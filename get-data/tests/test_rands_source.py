from __future__ import annotations

from pathlib import Path
import json
import tempfile
import unittest
from urllib.error import HTTPError

from download_rands_posts import load_existing_articles
from models.http_client import HttpResponse
from models.article import ArticleRecord
from models.rands_source import (
    RandsPageParser,
    RandsSourceDownloader,
    extract_sitemap_locations,
    is_post_url,
    parse_wp_post,
)


FIXTURE_PATH = Path(__file__).resolve().parents[1] / "test-download.html"
EXAMPLE_URL = "https://randsinrepose.com/archives/incrementalists-completionists/"


class FakeHttpClient:
    def __init__(self, responses: dict[str, HttpResponse]) -> None:
        self.responses = responses
        self.requested_urls: list[str] = []

    def get_text(self, url: str, accept: str | None = None) -> HttpResponse:
        del accept
        self.requested_urls.append(url)
        if url in self.responses:
            return self.responses[url]
        raise HTTPError(url, 404, "Not Found", hdrs=None, fp=None)


class RandsPageParserTests(unittest.TestCase):
    def test_parse_article_html_extracts_main_content_and_skips_comments(self) -> None:
        html = FIXTURE_PATH.read_text(encoding="utf-8")

        article = RandsPageParser().parse_article_html(EXAMPLE_URL, html)

        self.assertEqual(article.title, "Incrementalists & Completionists")
        self.assertEqual(article.categories, ["Management"])
        self.assertEqual(article.published_at, "2003-08-05T09:48:49-07:00")
        self.assertTrue(article.content_text.startswith("I recently got into minor war of words"))
        self.assertNotIn("Does anyone know of ideas if how to acquire", article.content_text)
        self.assertNotIn("comment-content", article.content_html)


class SitemapHelpersTests(unittest.TestCase):
    def test_extract_sitemap_locations_supports_namespaced_documents(self) -> None:
        xml_text = """<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://randsinrepose.com/archives/incrementalists-completionists/</loc></url>
          <url><loc>https://randsinrepose.com/archives/category/management/</loc></url>
        </urlset>
        """

        self.assertEqual(
            extract_sitemap_locations(xml_text),
            [
                "https://randsinrepose.com/archives/incrementalists-completionists/",
                "https://randsinrepose.com/archives/category/management/",
            ],
        )

    def test_is_post_url_filters_archive_pages_with_table_cases(self) -> None:
        cases = [
            ("https://randsinrepose.com/archives/incrementalists-completionists/", True),
            ("https://randsinrepose.com/archives/category/management/", False),
            ("https://randsinrepose.com/archives/tag/leadership/", False),
            ("https://randsinrepose.com/archives/", False),
            ("https://example.com/archives/incrementalists-completionists/", False),
        ]

        for url, expected in cases:
            with self.subTest(url=url):
                self.assertEqual(is_post_url(url, "https://randsinrepose.com"), expected)


class WordpressApiParsingTests(unittest.TestCase):
    def test_parse_wp_post_uses_rendered_content(self) -> None:
        post = {
            "link": EXAMPLE_URL,
            "slug": "incrementalists-completionists",
            "date": "2003-08-05T09:48:49-07:00",
            "modified": "2016-10-31T23:25:16-07:00",
            "title": {"rendered": "Incrementalists &amp; Completionists"},
            "excerpt": {"rendered": "<p>A short summary.</p>"},
            "content": {"rendered": "<p>First paragraph.</p><p>Second paragraph.</p>"},
            "categories": [2],
        }

        article = parse_wp_post(post, {2: "Management"})

        self.assertEqual(article.title, "Incrementalists & Completionists")
        self.assertEqual(article.categories, ["Management"])
        self.assertEqual(article.content_text, "First paragraph.\nSecond paragraph.")
        self.assertEqual(article.source, "wordpress_api")


class ArticleSerializationTests(unittest.TestCase):
    def test_to_dict_normalizes_json_line_separator_characters(self) -> None:
        article = ArticleRecord(
            url=EXAMPLE_URL,
            slug="incrementalists-completionists",
            title="Title",
            published_at=None,
            modified_at=None,
            excerpt="Before After",
            content_html="<p>One Two</p>",
            content_text="One Two",
            source="wordpress_api",
        )

        payload = article.to_dict()

        self.assertEqual(payload["excerpt"], "Before\nAfter")
        self.assertEqual(payload["content_html"], "<p>One\nTwo</p>")
        self.assertEqual(payload["content_text"], "One\nTwo")


class SitemapDownloadTests(unittest.TestCase):
    def test_fetch_articles_from_sitemap_downloads_each_post(self) -> None:
        html = FIXTURE_PATH.read_text(encoding="utf-8")
        client = FakeHttpClient(
            {
                "https://randsinrepose.com/wp-sitemap.xml": HttpResponse(
                    url="https://randsinrepose.com/wp-sitemap.xml",
                    status=200,
                    headers={},
                    text="""<?xml version="1.0" encoding="UTF-8"?>
                    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                      <sitemap><loc>https://randsinrepose.com/post-sitemap.xml</loc></sitemap>
                    </sitemapindex>
                    """,
                ),
                "https://randsinrepose.com/post-sitemap.xml": HttpResponse(
                    url="https://randsinrepose.com/post-sitemap.xml",
                    status=200,
                    headers={},
                    text="""<?xml version="1.0" encoding="UTF-8"?>
                    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                      <url><loc>https://randsinrepose.com/archives/incrementalists-completionists/</loc></url>
                      <url><loc>https://randsinrepose.com/archives/category/management/</loc></url>
                    </urlset>
                    """,
                ),
                EXAMPLE_URL: HttpResponse(url=EXAMPLE_URL, status=200, headers={}, text=html),
            }
        )

        articles = RandsSourceDownloader(client=client).fetch_articles(strategy="sitemap", max_posts=1)

        self.assertEqual(len(articles), 1)
        self.assertEqual(articles[0].title, "Incrementalists & Completionists")


class SkipExistingTests(unittest.TestCase):
    def test_sitemap_skips_existing_slug_without_network_call(self) -> None:
        client = FakeHttpClient(
            {
                "https://randsinrepose.com/wp-sitemap.xml": HttpResponse(
                    url="https://randsinrepose.com/wp-sitemap.xml",
                    status=200,
                    headers={},
                    text="""<?xml version="1.0" encoding="UTF-8"?>
                    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                      <url><loc>https://randsinrepose.com/archives/incrementalists-completionists/</loc></url>
                    </urlset>
                    """,
                ),
                # Deliberately no response for EXAMPLE_URL: fetching it would raise 404.
            }
        )

        articles = RandsSourceDownloader(client=client).fetch_articles(
            strategy="sitemap", skip_slugs={"incrementalists-completionists"}
        )

        self.assertEqual(articles, [])
        self.assertNotIn(EXAMPLE_URL, client.requested_urls)

    def test_wordpress_api_skips_existing_slugs_with_table_cases(self) -> None:
        posts = [
            {
                "link": "https://randsinrepose.com/archives/keep/",
                "slug": "keep",
                "date": None,
                "modified": None,
                "title": {"rendered": "Keep"},
                "excerpt": {"rendered": ""},
                "content": {"rendered": "<p>Keep me.</p>"},
                "categories": [],
            },
            {
                "link": "https://randsinrepose.com/archives/already-have/",
                "slug": "already-have",
                "date": None,
                "modified": None,
                "title": {"rendered": "Already Have"},
                "excerpt": {"rendered": ""},
                "content": {"rendered": "<p>Skip me.</p>"},
                "categories": [],
            },
        ]
        base = "https://randsinrepose.com/wp-json/wp/v2"
        client = FakeHttpClient(
            {
                f"{base}/categories?per_page=100&page=1&context=view": HttpResponse(
                    url=f"{base}/categories", status=200, headers={"x-wp-totalpages": "1"}, text="[]"
                ),
                f"{base}/posts?per_page=100&page=1&context=view": HttpResponse(
                    url=f"{base}/posts", status=200, headers={"x-wp-totalpages": "1"}, text=json.dumps(posts)
                ),
            }
        )

        articles = RandsSourceDownloader(client=client).fetch_articles(
            strategy="wordpress_api", skip_slugs={"already-have"}
        )

        self.assertEqual([article.slug for article in articles], ["keep"])


class ExistingArticleLoadingTests(unittest.TestCase):
    def test_from_dict_round_trips_to_dict(self) -> None:
        original = ArticleRecord(
            url=EXAMPLE_URL,
            slug="incrementalists-completionists",
            title="Title",
            published_at="2003-08-05T09:48:49-07:00",
            modified_at=None,
            categories=["Management"],
            excerpt="An excerpt.",
            content_html="<p>Body.</p>",
            content_text="Body.",
            source="wordpress_api",
        )

        self.assertEqual(ArticleRecord.from_dict(original.to_dict()), original)

    def test_load_existing_articles_reads_slug_from_file_contents(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            article_dir = Path(tmp) / "articles"
            article_dir.mkdir()
            record = ArticleRecord(
                url=EXAMPLE_URL,
                slug="incrementalists-completionists",
                title="Title",
                published_at=None,
                modified_at=None,
            )
            # Filename intentionally differs from the slug to prove we read the slug field.
            (article_dir / "incrementalists-completionists-2.json").write_text(
                json.dumps(record.to_dict()), encoding="utf-8"
            )

            loaded = load_existing_articles(article_dir)

            self.assertEqual([a.slug for a in loaded], ["incrementalists-completionists"])

    def test_load_existing_articles_returns_empty_when_missing(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual(load_existing_articles(Path(tmp) / "articles"), [])


if __name__ == "__main__":
    unittest.main()
