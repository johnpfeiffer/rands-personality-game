# Rands Source Downloader

This directory is a UV-managed Python project for downloading Rands in Repose
posts into structured local source data.

## Usage

```bash
uv run download_rands_posts.py --max-posts 5
uv run download_rands_posts.py --skip-existing
```

## Validation

```bash
uv run python -m unittest discover -s tests
```
