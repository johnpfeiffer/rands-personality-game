from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any
from urllib.parse import urlparse
import re


_SLUG_PATTERN = re.compile(r"[^a-z0-9]+")
_JSON_LINE_SEPARATOR_MAP = str.maketrans({" ": "\n", " ": "\n"})


def slug_from_url(url: str) -> str:
    parsed = urlparse(url)
    path_parts = [part for part in parsed.path.split("/") if part]
    candidate = path_parts[-1] if path_parts else "article"
    slug = _SLUG_PATTERN.sub("-", candidate.lower()).strip("-")
    return slug or "article"


@dataclass(slots=True)
class ArticleRecord:
    url: str
    slug: str
    title: str
    published_at: str | None
    modified_at: str | None
    categories: list[str] = field(default_factory=list)
    excerpt: str | None = None
    content_html: str = ""
    content_text: str = ""
    source: str = ""

    def to_dict(self) -> dict[str, Any]:
        return _sanitize_for_json(asdict(self))


def _sanitize_for_json(value: Any) -> Any:
    if isinstance(value, str):
        return value.translate(_JSON_LINE_SEPARATOR_MAP)
    if isinstance(value, list):
        return [_sanitize_for_json(item) for item in value]
    if isinstance(value, dict):
        return {key: _sanitize_for_json(item) for key, item in value.items()}
    return value
