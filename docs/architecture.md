# Architecture

## Goal

"Which Personality Game" has multiple parts

- a downloader of source articles
- extracted personality and quiz data that underpins the game

## System Design

```mermaid
flowchart TD
    subgraph v1 [Source Data Ingestion]
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
    end

    subgraph v2 [Quiz Data Layer]
        Articles[Source articles] --> Personalities[personalities.json]
        Personalities --> Questions[questions.json]
        Questions -->|sparse scores| Personalities
    end

    Model --> Articles
```

## Layering

### v1 — Source data ingestion

- `models/article.py` holds the core article record.
- `models/rands_source.py` contains the domain logic for discovery and extraction.
- `download_rands_posts.py` acts as the controller entry point that turns domain results into files on disk.

### v2 — Quiz data

- `data/personalities.json` defines the 10 MVP personality archetypes with descriptions and source article references.
- `data/questions.json` defines versioned quiz questions with answers that carry sparse scores toward personalities.
- No pipeline or scripts required — these files are hand-curated.

## Output Contract

### v1

- `data/articles.jsonl` stores one article per line for batch processing.
- `data/articles/*.json` stores one file per article for debugging and manual inspection.
- `data/manifest.json` records the run metadata and article counts.

### v2

- `data/personalities.json` stores personality definitions keyed by `id` (e.g. `"fixer"`).
- `data/questions.json` stores versioned questions (`qN-vN`) with sparse answer-to-personality scoring.

