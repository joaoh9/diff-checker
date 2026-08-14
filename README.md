# diff.

A text comparison tool that runs on your machine.

Paste two versions of a document, click **Find difference**, and see exactly what changed — line by line, word by word. The texts stay in the browser. They are never uploaded.

That is the point. Online diff sites are convenient, and they are also a place you paste contracts, drafts, credentials, and messages that have no business sitting on a stranger's server. This project exists so you can get the same marks without handing the content to a website you do not control.

## Run it locally

You need Node.js 20+.

```bash
npm install
npm run dev
```

Open the localhost URL Vite prints (usually `http://localhost:5173`). Keep the tab on localhost — that is the whole privacy model.

```bash
npm test          # unit tests
npm run build     # production build
npm run preview   # serve the build locally
```

## What you get

- Two panes: **Original** and **Changed**
- Side-by-side result, with changed lines kept on the same row
- Word-level marks: strikethrough for removals, weight for additions
- A short summary (`3 lines changed. +9 / −6 words`)
- Swap, clear, an example, and `Cmd+Enter` / `Ctrl+Enter` to compare

There is no account, no share link, and no file upload. Paste, compare, close the tab.

## What leaves the machine

The comparison itself is client-side. It uses [jsdiff](https://github.com/kpdecker/jsdiff) in the browser. There is no application backend.

The page does load fonts from Google Fonts. That request does not include the text you pasted. If you want zero third-party requests, block `fonts.googleapis.com` — the UI falls back to system type.

## Stack

Vite, TypeScript, and jsdiff. No framework.

## License

No license file is attached yet. If you fork it, treat that as all rights reserved until one is added.
