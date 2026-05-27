Goal: prerequisite work to have the data that underpins this app.


Task: build the source-data ingestion pipeline for Rands in Repose.

- Build a script to download articles
- Download all blog posts into a local structured dataset for analysis and application development.
- Capture the main article content, metadata, and categories in JSON files plus a JSONL corpus.
- (discovered during implementation) Prefer the WordPress API for reliability, with sitemap/page scraping as a fallback.
- Verify the pipeline with automated parser/downloader tests and a full live download run.

Exclude comments on the article/blog for MVP; comment ingestion can be added in a later phase.

example-download.html is an example downloaded with curl

*(I manually spot checked and believe there are 906 articles)*

