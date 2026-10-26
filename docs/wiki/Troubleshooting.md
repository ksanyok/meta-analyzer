# Troubleshooting

## Tags are missing but I see them in the browser

They are probably added by JavaScript after load. Render them on the server, or check the rendered HTML with `--file` after saving it from your browser's developer tools.

## 403 or a captcha page

The site blocks automated clients. Save the page and use `--file`.

## Wrong characters in the title

The page may declare one charset and send another. Make sure the server sends `Content-Type: text/html; charset=utf-8` and the page uses `<meta charset="utf-8">`.

## Still stuck?

Open an [issue](https://github.com/ksanyok/meta-analyzer/issues/new/choose) with the command, the output (`--json` if possible) and your Node.js version — or compare with the [online version](https://promopilot.link/en/tools/meta-analyzer.php?utm_source=github&utm_medium=repo&utm_campaign=tools&utm_content=meta-analyzer).
