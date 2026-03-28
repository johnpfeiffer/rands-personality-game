# Architecture

## Goal

Build a local source-data pipeline for the personality quiz by downloading Rands in Repose articles into a structured format that is easy to inspect, transform, and analyze.

## System Design

```mermaid
flowchart TD
    CLI[download_rands_posts.py] --> Downloader[RandsSourceDownloader]
    Downloader -->|preferred| WPAPI[WordPress REST API]
    Downloader -->|fallback| Sitemap[XML sitemaps]
    Sitemap --> Pages[Individual article pages]
    Pages --> Parser[RandsPageParser]
    WPAPI --> Parser
    Parser --> Model[ArticleRecord]
    Model --> JSONL[articles.jsonl]
    Model --> JSONFiles[articles/*.json]
    Model --> Manifest[manifest.json]
```

## User Journey

```mermaid
flowchart LR
    Start[Run downloader script] --> Discover[Discover article sources]
    Discover --> Fetch[Fetch post data]
    Fetch --> Extract[Extract main article content]
    Extract --> Persist[Write structured local files]
    Persist --> Analyze[Use local source data for quiz analysis and app development]
```

## Layering

- `models/article.py` holds the core article record.
- `models/rands_source.py` contains the domain logic for discovery and extraction.
- `download_rands_posts.py` acts as the controller entry point that turns domain results into files on disk.

## Output Contract

- `data/rands/articles.jsonl` stores one article per line for batch processing.
- `data/rands/articles/*.json` stores one file per article for debugging and manual inspection.
- `data/rands/manifest.json` records the run metadata and article counts.
