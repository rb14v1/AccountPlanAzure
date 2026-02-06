# backend/api/search.py
from __future__ import annotations

import os
import time
from typing import Any, Dict, Optional, List

import requests

from .aoai import embed


def _env(name: str, default: str = "") -> str:
    return (os.getenv(name) or default).strip()


def _search_endpoint() -> str:
    endpoint = _env("AZURE_SEARCH_ENDPOINT")
    if not endpoint:
        raise ValueError("AZURE_SEARCH_ENDPOINT missing")
    return endpoint.rstrip("/")


def _api_version() -> str:
    return _env("AZURE_SEARCH_API_VERSION", "2025-09-01")


def _admin_key() -> str:
    key = _env("AZURE_SEARCH_ADMIN_KEY") or _env("AZURE_SEARCH_API_KEY")
    if not key:
        raise ValueError("AZURE_SEARCH_ADMIN_KEY (or AZURE_SEARCH_API_KEY) missing")
    return key


def _index_name() -> str:
    return _env("AZURE_SEARCH_INDEX", "account-chunks-v4")


def _indexer_name() -> str:
    return _env("AZURE_SEARCH_INDEXER", "account-chunks-indexer")


def _headers() -> Dict[str, str]:
    return {
        "Content-Type": "application/json",
        "api-key": _admin_key(),
    }


# ----------------------------
# Indexer helpers
# ----------------------------
def run_indexer(indexer_name: Optional[str] = None, wait_seconds: int = 0) -> Dict[str, Any]:
    name = (indexer_name or _indexer_name()).strip()

    url = f"{_search_endpoint()}/indexers/{name}/run?api-version={_api_version()}"
    r = requests.post(url, headers=_headers(), timeout=30)
    if r.status_code not in (200, 201, 202, 204):
        raise RuntimeError(f"Failed to run indexer '{name}': {r.status_code} {r.text}")

    out: Dict[str, Any] = {"ok": True, "indexer": name, "started": True}

    if wait_seconds > 0:
        deadline = time.time() + max(1, wait_seconds)
        last = None
        while time.time() < deadline:
            last = get_indexer_status(name)
            status = ((last.get("lastResult") or {}).get("status") or "").lower()
            if status in {"success", "transientfailure", "persistentfailure"}:
                out["final"] = last
                break
            time.sleep(2)
        if last is not None and "final" not in out:
            out["latest"] = last

    return out


def get_indexer_status(indexer_name: Optional[str] = None) -> Dict[str, Any]:
    name = (indexer_name or _indexer_name()).strip()
    url = f"{_search_endpoint()}/indexers/{name}/status?api-version={_api_version()}"
    r = requests.get(url, headers=_headers(), timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f"Failed to get indexer status '{name}': {r.status_code} {r.text}")
    return r.json()


# ----------------------------
# RAG retrieval (UPDATED)
# ----------------------------
def search_chunks(
    user_id: str,
    query: str,
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """
    Hybrid (keyword + vector) search with strict user filter and highlights.
    """

    user_id = (user_id or "").strip()
    query = (query or "").strip()

    if not user_id:
        raise ValueError("user_id required for search")
    if not query:
        raise ValueError("query required for search")

    vec = embed(query)

    url = (
        f"{_search_endpoint()}/indexes/{_index_name()}"
        f"/docs/search?api-version={_api_version()}"
    )

    payload: Dict[str, Any] = {
        "count": True,
        "top": int(top_k),
        "select": "chunk_text,file_name,blob_path,user_id",

        # 🔎 keyword / lexical search
        "search": query,
        "queryType": "simple",

        # ✨ highlight exact matching text
        "highlight": "chunk_text",
        "highlightPreTag": "<<<",
        "highlightPostTag": ">>>",

        # 🧠 vector similarity search
        "vectorQueries": [
            {
                "kind": "vector",
                "vector": vec,
                "fields": "vector",
                "k": int(top_k),
            }
        ],

        # 🔒 strict tenant isolation
        "filter": f"user_id eq '{user_id}'",
    }

    r = requests.post(url, headers=_headers(), json=payload, timeout=60)
    if r.status_code != 200:
        raise RuntimeError(f"Search failed: {r.status_code} {r.text}")

    data = r.json()

    out: List[Dict[str, Any]] = []
    for row in data.get("value") or []:
        out.append(
            {
                "score": row.get("@search.score"),
                "chunk_text": row.get("chunk_text"),
                "highlights": (row.get("@search.highlights") or {}).get("chunk_text"),
                "file_name": row.get("file_name"),
                "blob_path": row.get("blob_path"),
                "user_id": row.get("user_id"),
            }
        )

    return out

def fallback_topk() -> int:
    try:
        return int(os.getenv("AZURE_SEARCH_FALLBACK_TOPK", "12"))
    except Exception:
        return 12
