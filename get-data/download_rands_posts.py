#!/usr/bin/env python3

from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
import argparse
import json

from models.article import ArticleRecord
from models.rands_source import RandsSourceDownloader


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download Rands in Repose posts into structured local source data."
    )
    parser.add_argument(
        "--output-dir",
        default="data/rands",
        help="Directory where JSON article files, JSONL, and a manifest will be written.",
    )
    parser.add_argument(
        "--strategy",
        choices=["auto", "wordpress_api", "sitemap"],
        default="auto",
        help="How to discover and download posts.",
    )
    parser.add_argument(
        "--max-posts",
        type=int,
        default=None,
        help="Optional cap for a test run.",
    )
    parser.add_argument(
        "--base-url",
        default="https://randsinrepose.com",
        help="Root site URL for the blog.",
    )
    return parser.parse_args()


def write_articles(output_dir: Path, articles: list[ArticleRecord], strategy: str, base_url: str) -> dict:
    output_dir.mkdir(parents=True, exist_ok=True)
    article_dir = output_dir / "articles"
    article_dir.mkdir(parents=True, exist_ok=True)

    jsonl_path = output_dir / "articles.jsonl"
    slug_counts: Counter[str] = Counter()
    source_counts: Counter[str] = Counter()

    with jsonl_path.open("w", encoding="utf-8") as jsonl_file:
        for article in articles:
            payload = article.to_dict()
            json.dump(payload, jsonl_file, ensure_ascii=False)
            jsonl_file.write("\n")

            slug_counts[article.slug] += 1
            suffix = "" if slug_counts[article.slug] == 1 else f"-{slug_counts[article.slug]}"
            file_path = article_dir / f"{article.slug}{suffix}.json"
            file_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            source_counts[article.source] += 1

    manifest = {
        "base_url": base_url,
        "strategy": strategy,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "article_count": len(articles),
        "source_breakdown": dict(source_counts),
        "jsonl_path": str(jsonl_path),
        "article_directory": str(article_dir),
    }
    (output_dir / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return manifest


def main() -> int:
    args = parse_args()
    downloader = RandsSourceDownloader(base_url=args.base_url)
    articles = downloader.fetch_articles(strategy=args.strategy, max_posts=args.max_posts)
    manifest = write_articles(Path(args.output_dir), articles, args.strategy, args.base_url)

    print(
        f"Downloaded {manifest['article_count']} articles "
        f"using {manifest['strategy']} into {args.output_dir}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
