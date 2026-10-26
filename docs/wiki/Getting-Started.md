# Getting started

## Requirements

Node.js 18 or newer. No other dependencies.

## Install

```bash
# one-off run
npx github:ksanyok/meta-analyzer example.com

# global CLI
npm install -g github:ksanyok/meta-analyzer

# as a library in your project
npm install github:ksanyok/meta-analyzer
```

## First run

```bash
meta-analyzer example.com
```

The table shows each tag's value (long values are shortened) with lengths where they matter. Problems follow: `✖` errors keep the page out of search or make signals unreliable, `!` warnings cost clicks or mobile-friendliness, `i` notes are suggestions.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | No errors (warnings allowed unless `--strict`) |
| 1 | Errors found (or warnings with `--strict`) |
| 2 | Bad arguments or the check could not run |

## More examples

**Check a local build before deploying**

```bash
meta-analyzer --file dist/index.html
```

**See what a crawler gets**

```bash
meta-analyzer https://example.com/product --ua "Googlebot"
```

**Export metadata as JSON**

```bash
meta-analyzer example.com --json | jq '.meta | {title, description, canonical}'
```

## Without installing anything

Use the [online Meta Tag Analyzer](https://promopilot.link/en/tools/meta-analyzer.php?utm_source=github&utm_medium=repo&utm_campaign=tools&utm_content=meta-analyzer).
