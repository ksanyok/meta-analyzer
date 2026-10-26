# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-10-26

### Added
- `meta-analyzer` CLI for URLs and local files (`--file`), `--ua`, `--json`, `--strict`
- Dependency-free head parser that ignores comments, scripts and templates and decodes HTML entities
- Extraction of title, description, robots, googlebot, canonical, viewport, charset, lang, H1, hreflang, Open Graph, Twitter Card, favicon and JSON-LD count
- Checks: missing/short/long/duplicate title and description, noindex/nofollow in meta and X-Robots-Tag, multiple canonicals, viewport, lang, charset, H1, incomplete Open Graph, HTTP errors
- Library API (`analyzeMeta`, `extractMeta`, `lintMeta`) with injectable fetch, and GitHub Action

[1.0.0]: https://github.com/ksanyok/meta-analyzer/releases/tag/v1.0.0
