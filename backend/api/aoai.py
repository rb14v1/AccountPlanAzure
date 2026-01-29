# backend/api/aoai.py
from __future__ import annotations

import json
import os
from typing import Any, Dict, List

from openai import AzureOpenAI


def _client() -> AzureOpenAI:
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "").strip()  # https://<resource>.openai.azure.com
    api_key = os.getenv("AZURE_OPENAI_API_KEY", "").strip()
    api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-06-01").strip()

    if not endpoint:
        raise RuntimeError("AZURE_OPENAI_ENDPOINT missing")
    if not api_key:
        raise RuntimeError("AZURE_OPENAI_API_KEY missing")

    return AzureOpenAI(
        azure_endpoint=endpoint,
        api_key=api_key,
        api_version=api_version,
    )


def embed(text: str) -> List[float]:
    """
    Azure OpenAI embeddings.
    IMPORTANT: In Azure, 'model' = DEPLOYMENT NAME (not the base model id).
    """
    deployment = os.getenv("AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT", "").strip()
    if not deployment:
        deployment = os.getenv("AZURE_OPENAI_EMBED_DEPLOYMENT", "").strip()
    if not deployment:
        deployment = "text-embedding-3-small"

    text = (text or "").strip()
    if not text:
        raise RuntimeError("embed() received empty text")

    client = _client()
    resp = client.embeddings.create(
        model=deployment,
        input=text,
    )
    vec = resp.data[0].embedding
    return [float(x) for x in vec]


def answer_only_from_context(query: str, context_text: str) -> str:
    """
    Returns ONLY the answer text. If answer not explicitly present in context -> "TBD".
    """
    deployment = os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT", "").strip()
    if not deployment:
        deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "").strip()
    if not deployment:
        raise RuntimeError("AZURE_OPENAI_CHAT_DEPLOYMENT (or AZURE_OPENAI_DEPLOYMENT) missing")

    query = (query or "").strip()
    context_text = (context_text or "").strip()

    system = (
        "You are a RAG assistant.\n"
        "Use ONLY the provided CONTEXT.\n"
        "Return ONLY the final answer as plain text (no JSON, no markdown, no citations).\n"
        "If the answer is not explicitly present in the CONTEXT, return exactly: TBD"
    )

    user = f"QUESTION:\n{query}\n\nCONTEXT:\n{context_text}\n\nReturn only the answer."

    client = _client()
    resp = client.chat.completions.create(
        model=deployment,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.0,
    )

    return (resp.choices[0].message.content or "").strip()


def fill_template_json_only(template: Dict[str, Any], context_text: str) -> Dict[str, Any]:
    """
    Strictly fills the template JSON using ONLY context.
    Missing values must be 'TBD' (inside arrays).
    Returns Python dict.
    """
    deployment = os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT", "").strip()
    if not deployment:
        deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "").strip()
    if not deployment:
        raise RuntimeError("AZURE_OPENAI_CHAT_DEPLOYMENT (or AZURE_OPENAI_DEPLOYMENT) missing")

    # system = (
    #     "You are a strict JSON generator.\n"
    #     "Return ONLY valid JSON. No markdown. No comments. No extra keys.\n"
    #     "Fill the template strictly from the CONTEXT.\n"
    #     "If a value is not explicitly present in CONTEXT, put the string 'TBD' (inside the array).\n"
    #     "Keep EXACT same schema and keys.\n"
    #     "Do NOT add citations, explanations, or any extra fields."
    # )
    SYSTEM_PROMPT = ("""
You are a JSON generator.

Rules:
- Respond ONLY with valid JSON.
- No markdown.
- No explanations.
- No citations.
- No extra keys.
- If value not found, return "TBD".

Follow exactly the schema provided by user.
""")


    user = (
        "TEMPLATE:\n"
        f"{json.dumps(template, ensure_ascii=False)}\n\n"
        "CONTEXT:\n"
        f"{context_text}\n\n"
        "Return ONLY the filled JSON."
    )

    client = _client()
    resp = client.chat.completions.create(
        model=deployment,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.0,
    )

    raw = (resp.choices[0].message.content or "").strip()

    try:
        out = json.loads(raw)
    except Exception:
        raise RuntimeError(f"Model did not return valid JSON. Raw:\n{raw}")

    return out


def enforce_tbd(template: Dict[str, Any], filled: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ensures exact schema and that each field is a non-empty list.
    If empty/missing -> ['TBD'].
    """
    template_type = template.get("template_type")
    data = template.get("data", {}) or {}
    filled_data = (filled or {}).get("data") or {}

    out: Dict[str, Any] = {"template_type": template_type, "data": {}}

    for key in data.keys():
        val = filled_data.get(key)

        if not isinstance(val, list):
            out["data"][key] = ["TBD"]
            continue

        cleaned = [str(x).strip() for x in val if str(x).strip()]
        out["data"][key] = cleaned if cleaned else ["TBD"]

    return out
