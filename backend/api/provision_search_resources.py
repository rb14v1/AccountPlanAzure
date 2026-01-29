"""One-time provisioning for Azure AI Search integrated vectorization.

Run:
  python provision_search_resources.py

Creates/updates:
  - Data source (Blob container)
  - Index (chunk-level docs with parent_id + user_id + blob_path)
  - Skillset (Text Split + AzureOpenAIEmbedding) + indexProjections
  - Indexer (ties everything together)

Env vars:
  AZURE_SEARCH_ENDPOINT=https://...search.windows.net
  AZURE_SEARCH_ADMIN_KEY=...

  AZURE_STORAGE_CONNECTION_STRING=...
  AZURE_STORAGE_CONTAINER=uploads

  AZURE_OPENAI_ENDPOINT=https://<subdomain>.openai.azure.com
  AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-small
  AZURE_OPENAI_EMBEDDING_MODEL=text-embedding-3-small
  AZURE_OPENAI_KEY=...   (optional if you later move to managed identity)

  AZURE_EMBEDDING_DIMENSIONS=1536 (optional)
"""

from __future__ import annotations

import os
from typing import Any, Dict

import requests


def _env(name: str, default: str = "") -> str:
    return (os.getenv(name) or default).strip()


SEARCH_ENDPOINT = _env("AZURE_SEARCH_ENDPOINT").rstrip("/")
ADMIN_KEY = _env("AZURE_SEARCH_ADMIN_KEY") or _env("AZURE_SEARCH_API_KEY")
API_VERSION = _env("AZURE_SEARCH_API_VERSION", "2025-09-01")

INDEX_NAME = _env("AZURE_SEARCH_INDEX", "account-chunks")
DATASOURCE_NAME = _env("AZURE_SEARCH_DATASOURCE", "account-blobs")
SKILLSET_NAME = _env("AZURE_SEARCH_SKILLSET", "account-chunks-skillset")
INDEXER_NAME = _env("AZURE_SEARCH_INDEXER", "account-chunks-indexer")

STORAGE_CONTAINER = _env("AZURE_STORAGE_CONTAINER", "uploads")
STORAGE_CONN_STR = _env("AZURE_STORAGE_CONNECTION_STRING")

AOAI_ENDPOINT = _env("AZURE_OPENAI_ENDPOINT")
AOAI_DEPLOYMENT = _env("AZURE_OPENAI_EMBEDDING_DEPLOYMENT")
AOAI_MODEL = _env("AZURE_OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
AOAI_KEY = _env("AZURE_OPENAI_KEY")  # optional if you use MI from Search

DIM = int(_env("AZURE_EMBEDDING_DIMENSIONS", "1536"))


def _check_env() -> None:
    missing = []
    if not SEARCH_ENDPOINT:
        missing.append("AZURE_SEARCH_ENDPOINT")
    if not ADMIN_KEY:
        missing.append("AZURE_SEARCH_ADMIN_KEY")
    if not STORAGE_CONN_STR:
        missing.append("AZURE_STORAGE_CONNECTION_STRING")
    if not AOAI_ENDPOINT:
        missing.append("AZURE_OPENAI_ENDPOINT")
    if not AOAI_DEPLOYMENT:
        missing.append("AZURE_OPENAI_EMBEDDING_DEPLOYMENT")
    if missing:
        raise SystemExit(f"Missing env vars: {', '.join(missing)}")


def _headers() -> Dict[str, str]:
    return {"Content-Type": "application/json", "api-key": ADMIN_KEY}


def _put(path: str, payload: Dict[str, Any]) -> None:
    url = f"{SEARCH_ENDPOINT}/{path}?api-version={API_VERSION}"
    r = requests.put(url, headers=_headers(), json=payload, timeout=60)
    if r.status_code not in (200, 201):
        raise RuntimeError(f"PUT {path} failed: {r.status_code} {r.text}")


def create_datasource() -> None:
    payload = {
        "name": DATASOURCE_NAME,
        "type": "azureblob",
        "credentials": {"connectionString": STORAGE_CONN_STR},
        "container": {"name": STORAGE_CONTAINER},
    }
    _put(f"datasources('{DATASOURCE_NAME}')", payload)


def create_index() -> None:
    payload: Dict[str, Any] = {
        "name": INDEX_NAME,
        "fields": [
            {"name": "chunk_id", "type": "Edm.String", "key": True, "filterable": True, "analyzer": "keyword"},
            {"name": "parent_id", "type": "Edm.String", "filterable": True},
            {"name": "user_id", "type": "Edm.String", "filterable": True},
            {"name": "title", "type": "Edm.String", "searchable": True, "retrievable": True},
            {"name": "blob_path", "type": "Edm.String", "filterable": True, "retrievable": True},
            {"name": "chunk", "type": "Edm.String", "searchable": True, "retrievable": True},
            {
                "name": "chunk_vector",
                "type": "Collection(Edm.Single)",
                "searchable": True,
                "retrievable": False,
                "stored": False,
                "dimensions": DIM,
                "vectorSearchProfile": "vector-profile",
            },
        ],
        "vectorSearch": {
            "algorithms": [
                {
                    "name": "hnsw-algorithm",
                    "kind": "hnsw",
                    "hnswParameters": {"m": 4, "efConstruction": 400, "efSearch": 100, "metric": "cosine"},
                }
            ],
            "profiles": [{"name": "vector-profile", "algorithm": "hnsw-algorithm", "vectorizer": "aoai-vectorizer"}],
            "vectorizers": [
                {
                    "name": "aoai-vectorizer",
                    "kind": "azureOpenAI",
                    "azureOpenAIParameters": {
                        "resourceUri": AOAI_ENDPOINT,
                        "deploymentId": AOAI_DEPLOYMENT,
                        "modelName": AOAI_MODEL,
                    },
                }
            ],
        },
    }
    _put(f"indexes('{INDEX_NAME}')", payload)


def create_skillset() -> None:
    split_skill = {
        "@odata.type": "#Microsoft.Skills.Text.SplitSkill",
        "name": "split-skill",
        "description": "Split extracted content into pages for RAG",
        "context": "/document",
        "textSplitMode": "pages",
        "maximumPageLength": 2000,
        "pageOverlapLength": 300,
        "maximumPagesToTake": 0,
        "unit": "characters",
        "defaultLanguageCode": "en",
        "inputs": [{"name": "text", "source": "/document/content", "inputs": []}],
        "outputs": [{"name": "textItems", "targetName": "pages"}],
    }

    embed_skill = {
        "@odata.type": "#Microsoft.Skills.Text.AzureOpenAIEmbeddingSkill",
        "name": "aoai-embedding-skill",
        "description": "Create embeddings for each page chunk",
        "context": "/document/pages/*",
        "resourceUri": AOAI_ENDPOINT,
        "deploymentId": AOAI_DEPLOYMENT,
        "modelName": AOAI_MODEL,
        "dimensions": DIM,
        "inputs": [{"name": "text", "source": "/document/pages/*", "inputs": []}],
        "outputs": [{"name": "embedding", "targetName": "chunk_vector"}],
    }
    if AOAI_KEY:
        embed_skill["apiKey"] = AOAI_KEY

    payload: Dict[str, Any] = {
        "name": SKILLSET_NAME,
        "description": "Chunk + vectorize blobs using TextSplit + Azure OpenAI embeddings",
        "skills": [split_skill, embed_skill],
        "indexProjections": {
            "selectors": [
                {
                    "targetIndexName": INDEX_NAME,
                    "parentKeyFieldName": "parent_id",
                    "sourceContext": "/document/pages/*",
                    "mappings": [
                        {"name": "chunk", "source": "/document/pages/*"},
                        {"name": "chunk_vector", "source": "/document/pages/*/chunk_vector"},
                        {"name": "title", "source": "/document/metadata_storage_name"},
                        {"name": "blob_path", "source": "/document/metadata_storage_path"},
                        {"name": "user_id", "source": "/document/metadata_user_id"},
                    ],
                }
            ],
            "parameters": {"projectionMode": "skipIndexingParentDocuments"},
        },
    }
    _put(f"skillsets('{SKILLSET_NAME}')", payload)


def create_indexer() -> None:
    payload: Dict[str, Any] = {
        "name": INDEXER_NAME,
        "dataSourceName": DATASOURCE_NAME,
        "targetIndexName": INDEX_NAME,
        "skillsetName": SKILLSET_NAME,
        "schedule": {"interval": "PT2H"},
        "parameters": {
            "configuration": {
                "dataToExtract": "contentAndMetadata",
                "parsingMode": "default",
                "allowSkillsetToReadFileData": False,
            }
        },
        "fieldMappings": [
            {"sourceFieldName": "metadata_storage_path", "targetFieldName": "parent_id"},
            {"sourceFieldName": "metadata_storage_path", "targetFieldName": "blob_path"},
            {"sourceFieldName": "metadata_storage_name", "targetFieldName": "title"},
            {"sourceFieldName": "metadata_user_id", "targetFieldName": "user_id"},
        ],
        "outputFieldMappings": [],
    }
    _put(f"indexers('{INDEXER_NAME}')", payload)


def main() -> None:
    _check_env()
    print("Provisioning Azure AI Search resources...")
    create_datasource()
    print(" - datasource ok")
    create_index()
    print(" - index ok")
    create_skillset()
    print(" - skillset ok")
    create_indexer()
    print(" - indexer ok")
    print("Done.")


if __name__ == "__main__":
    main()
