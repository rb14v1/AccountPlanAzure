from __future__ import annotations
from typing import List


def chunk_text(
    text: str,
    max_chars: int = 1000,
    overlap: int = 200,
) -> List[str]:
    if not text:
        return []

    text = text.strip()
    if not text:
        return []

    # ✅ Guardrails
    if max_chars <= 0:
        raise ValueError("max_chars must be > 0")
    if overlap < 0:
        overlap = 0
    if overlap >= max_chars:
        overlap = max_chars // 4  # keep it sane

    step = max_chars - overlap
    n = len(text)
    chunks: List[str] = []

    start = 0
    while start < n:
        end = min(start + max_chars, n)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= n:
            break  # ✅ reached the end, stop

        start += step  # ✅ always moves forward

    return chunks
