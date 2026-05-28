
This application will be a "personality test" game based on the People Manager blog posts from "Rands in Repose"

inspired by <https://youtu.be/-Akmf4SGHTQ?si=bERFC1kNT3HHiBhL&t=2795>

*note he references Julia and Marcel, both incredibly successful at Slack and after*

- <https://www.infoq.com/presentations/slack-scaling-infrastructure/>
- <https://review.firstround.com/new-engineering-manager-advice/>


<https://randsinrepose.com/archives/category/management/page/15/>

First we should download all the posts into a local system so that it is available in an efficient way for analysis and development

## Getting new content

Example source data downloader: `python3 download_rands_posts.py` to fetch posts into `data/rands/`.

- Default mode prefers the WordPress API and falls back to sitemap + page scraping.
- `python3 download_rands_posts.py --max-posts 5` is useful for a quick test run.


# Validation

Model checking:

`cd VALIDATION`
`uv run tla tlc RandsPersonalityGameInvariantCheck.tla`

## Testing

```bash
cd app
npm test
npm run build
```

# Deployment Copy

The deployable Vite app lives under `app/`.

The root-level `cloud-deploy.sh` copies only that subdirectory to the monorepo deployment target and excludes generated or local-only files such as `node_modules`, `dist`, `.env*`, test files, and logs.

