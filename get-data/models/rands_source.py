from __future__ import annotations

from collections import deque
from typing import Iterable
from urllib.parse import urlencode, urljoin, urlparse
from xml.etree import ElementTree as ET
import json

from bs4 import BeautifulSoup

from models.article import ArticleRecord, slug_from_url
from models.http_client import HttpClient, error


BLOCKED_ARCHIVE_SEGMENTS = {"author", "category", "comments", "feed", "page", "tag"}
SITEMAP_ACCEPT = "application/xml,text/xml;q=0.9,*/*;q=0.8"


def collapse_whitespace(value: str) -> str:
    return " ".join(value.split())


def extract_text_from_html(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    lines = [collapse_whitespace(text) for text in soup.get_text("\n", strip=True).splitlines()]
    return "\n".join(line for line in lines if line)


def extract_sitemap_locations(xml_text: str) -> list[str]:
    root = ET.fromstring(xml_text)
    locations: list[str] = []
    for element in root.iter():
        if element.tag.endswith("loc") and element.text:
            locations.append(element.text.strip())
    return locations


def is_post_url(url: str, base_url: str) -> bool:
    parsed = urlparse(url)
    base_host = urlparse(base_url).netloc
    if parsed.netloc and parsed.netloc != base_host:
        return False

    parts = [part for part in parsed.path.split("/") if part]
    if len(parts) != 2 or parts[0] != "archives":
        return False

    return parts[1] not in BLOCKED_ARCHIVE_SEGMENTS


def parse_wp_post(post: dict, category_names: dict[int, str] | None = None) -> ArticleRecord:
    category_names = category_names or {}
    content_html = post.get("content", {}).get("rendered", "").strip()
    excerpt_html = post.get("excerpt", {}).get("rendered", "").strip()
    categories = [category_names[category_id] for category_id in post.get("categories", []) if category_id in category_names]
    return ArticleRecord(
        url=post["link"],
        slug=post.get("slug") or slug_from_url(post["link"]),
        title=BeautifulSoup(post.get("title", {}).get("rendered", ""), "html.parser").get_text(" ", strip=True),
        published_at=post.get("date"),
        modified_at=post.get("modified"),
        categories=categories,
        excerpt=extract_text_from_html(excerpt_html) or None,
        content_html=content_html,
        content_text=extract_text_from_html(content_html),
        source="wordpress_api",
    )


class RandsPageParser:
    def parse_article_html(self, url: str, html: str) -> ArticleRecord:
        soup = BeautifulSoup(html, "html.parser")
        article = soup.select_one("article.type-post") or soup.find("article")
        if article is None:
            raise ValueError(f"Could not find an article element in {url}")

        title_tag = article.select_one("h1.entry-title") or soup.select_one("h1.entry-title")
        content_tag = article.select_one("div.entry-content")
        if title_tag is None or content_tag is None:
            raise ValueError(f"Could not find title/content selectors in {url}")

        # Work on a detached copy so we can remove comments and scripts safely.
        content_soup = BeautifulSoup(str(content_tag), "html.parser")
        root = content_soup.select_one("div.entry-content") or content_soup
        for tag in root.select(".entry-comments, script, style, noscript"):
            tag.decompose()

        content_html = root.decode_contents().strip()
        category_meta = soup.find("meta", attrs={"property": "article:section"})
        excerpt_meta = soup.find("meta", attrs={"property": "og:description"}) or soup.find(
            "meta", attrs={"name": "description"}
        )
        published_meta = soup.find("meta", attrs={"property": "article:published_time"})
        modified_meta = soup.find("meta", attrs={"property": "article:modified_time"}) or soup.find(
            "meta", attrs={"property": "og:updated_time"}
        )

        categories = []
        if category_meta and category_meta.get("content"):
            categories = [collapse_whitespace(category_meta["content"])]

        excerpt = None
        if excerpt_meta and excerpt_meta.get("content"):
            excerpt = collapse_whitespace(excerpt_meta["content"])

        return ArticleRecord(
            url=url,
            slug=slug_from_url(url),
            title=title_tag.get_text(" ", strip=True),
            published_at=published_meta.get("content") if published_meta else None,
            modified_at=modified_meta.get("content") if modified_meta else None,
            categories=categories,
            excerpt=excerpt,
            content_html=content_html,
            content_text=extract_text_from_html(content_html),
            source="html_page",
        )


class RandsSourceDownloader:
    def __init__(self, client: HttpClient | None = None, base_url: str = "https://randsinrepose.com") -> None:
        self.client = client or HttpClient()
        self.base_url = base_url.rstrip("/")
        self.page_parser = RandsPageParser()

    def fetch_articles(self, strategy: str = "auto", max_posts: int | None = None) -> list[ArticleRecord]:
        if strategy not in {"auto", "wordpress_api", "sitemap"}:
            raise ValueError(f"Unsupported strategy: {strategy}")

        if strategy in {"auto", "wordpress_api"}:
            try:
                return self._fetch_from_wordpress_api(max_posts=max_posts)
            except Exception:
                if strategy == "wordpress_api":
                    raise

        return self._fetch_from_sitemaps(max_posts=max_posts)

    def _fetch_from_wordpress_api(self, max_posts: int | None = None) -> list[ArticleRecord]:
        category_names = self._fetch_category_names()
        page = 1
        articles: list[ArticleRecord] = []

        while True:
            query = urlencode({"per_page": 100, "page": page, "context": "view"})
            response = self.client.get_text(f"{self.base_url}/wp-json/wp/v2/posts?{query}", accept="application/json")
            payload = json.loads(response.text)
            if not payload:
                break

            for post in payload:
                articles.append(parse_wp_post(post, category_names))
                if max_posts is not None and len(articles) >= max_posts:
                    return articles

            total_pages = int(response.headers.get("x-wp-totalpages", str(page)))
            if page >= total_pages:
                break
            page += 1

        return articles

    def _fetch_category_names(self) -> dict[int, str]:
        categories: dict[int, str] = {}
        page = 1

        while True:
            query = urlencode({"per_page": 100, "page": page, "context": "view"})
            response = self.client.get_text(
                f"{self.base_url}/wp-json/wp/v2/categories?{query}",
                accept="application/json",
            )
            payload = json.loads(response.text)
            if not payload:
                break

            for category in payload:
                if "id" in category and "name" in category:
                    categories[int(category["id"])] = str(category["name"])

            total_pages = int(response.headers.get("x-wp-totalpages", str(page)))
            if page >= total_pages:
                break
            page += 1

        return categories

    def _fetch_from_sitemaps(self, max_posts: int | None = None) -> list[ArticleRecord]:
        sitemap_urls = self._discover_post_urls_from_sitemaps()
        articles: list[ArticleRecord] = []

        for post_url in sitemap_urls:
            response = self.client.get_text(post_url)
            articles.append(self.page_parser.parse_article_html(post_url, response.text))
            if max_posts is not None and len(articles) >= max_posts:
                break

        return articles

    def _discover_post_urls_from_sitemaps(self) -> list[str]:
        queue = deque(
            [
                f"{self.base_url}/wp-sitemap.xml",
                f"{self.base_url}/sitemap_index.xml",
                f"{self.base_url}/post-sitemap.xml",
                f"{self.base_url}/sitemap.xml",
            ]
        )
        seen_sitemaps: set[str] = set()
        post_urls: list[str] = []
        seen_posts: set[str] = set()

        while queue:
            sitemap_url = queue.popleft()
            if sitemap_url in seen_sitemaps:
                continue
            seen_sitemaps.add(sitemap_url)

            try:
                response = self.client.get_text(sitemap_url, accept=SITEMAP_ACCEPT)
            except error.HTTPError as exc:
                if exc.code in {403, 404}:
                    continue
                raise

            locations = extract_sitemap_locations(response.text)
            root = ET.fromstring(response.text)
            root_name = root.tag.split("}", maxsplit=1)[-1]

            if root_name == "sitemapindex":
                for location in locations:
                    if location not in seen_sitemaps:
                        queue.append(location)
                continue

            for location in locations:
                if is_post_url(location, self.base_url) and location not in seen_posts:
                    seen_posts.add(location)
                    post_urls.append(location)

        if not post_urls:
            raise RuntimeError("No post URLs discovered from sitemap endpoints")

        return post_urls


__all__ = [
    "ArticleRecord",
    "RandsPageParser",
    "RandsSourceDownloader",
    "collapse_whitespace",
    "extract_sitemap_locations",
    "extract_text_from_html",
    "is_post_url",
    "parse_wp_post",
]
