# Signal Desk

A personal research-job monitor for broad field searches across science, academic, higher-ed, neuroscience, and European sources.

## GitHub Pages

This is a static site and deploys with the included GitHub Actions workflow. After creating the repository, enable Pages with **GitHub Actions** as the source.

The `Refresh job feed` workflow runs daily at 06:17 UTC and can also be run manually from the Actions tab. It fetches public RSS feeds from Science Careers, Inside Higher Ed, and Nature Careers, keeps individual posting URLs, and commits only when the feed changes. No LLM or paid API is used.

## Privacy

Profile preferences and field notes are stored locally in the browser with `localStorage`. No account or server-side data store is required.
