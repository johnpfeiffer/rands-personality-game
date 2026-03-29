from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping
from urllib import error, request
import gzip
import zlib


DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}


@dataclass(slots=True)
class HttpResponse:
    url: str
    status: int
    headers: Mapping[str, str]
    text: str


class HttpClient:
    def __init__(self, timeout: int = 30) -> None:
        self.timeout = timeout

    def get_text(self, url: str, accept: str | None = None) -> HttpResponse:
        headers = dict(DEFAULT_HEADERS)
        if accept:
            headers["Accept"] = accept

        req = request.Request(url, headers=headers)
        with request.urlopen(req, timeout=self.timeout) as response:
            raw = response.read()
            content_encoding = (response.headers.get("Content-Encoding") or "").lower()
            decoded = self._decode_body(raw, content_encoding)
            return HttpResponse(
                url=response.geturl(),
                status=getattr(response, "status", 200),
                headers={key.lower(): value for key, value in response.headers.items()},
                text=decoded,
            )

    @staticmethod
    def _decode_body(body: bytes, content_encoding: str) -> str:
        if "gzip" in content_encoding or body[:2] == b"\x1f\x8b":
            body = gzip.decompress(body)
        elif "deflate" in content_encoding:
            body = zlib.decompress(body)
        return body.decode("utf-8", errors="replace")


__all__ = ["HttpClient", "HttpResponse", "error"]
