# Notion Crawler

A command-line application written in TypeScript that **recursively crawls** Notion pages, **downloads** their HTML content and associated **images**, and **rewrites** internal Notion links for local navigation.

---

## 📦 Features

- **Recursive crawl** starting from a Notion URL (`--start_url`), following only links containing `notion.site`.
- **HTML download** with rewritten local links pointing to saved files.
- **Image download** into an `images/` folder with sanitized filenames.
- **Internal link transformation**: converts Notion links to relative paths (e.g., `./page_123.html`).
- **Visited URL persistence** in `visited.json`, with an option to **reset** (`--reset`).
- **Page limit control**: set a maximum number of pages to crawl (`--max`).

---

## 🛠 Prerequisites

- Node.js v14 or higher
- npm

---

## 🚀 Installation

```bash
# Clone the repository
git clone <repository-url>
cd notion-crawler

# Install dependencies
npm install
```

---

## ⚙️ Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

Compiled files will be placed in the `dist/` directory.

---

## 🏃 Usage

### Via npm script

```bash
npm start -- --start_url=<NOTION_URL> [--folder=<OUTPUT_FOLDER>] [--reset] [--max=<PAGE_LIMIT>]
```

### Directly with Node.js

```bash
node dist/index.js \
  --start_url=https://fine-road-79e.notion.site/EDN-18674ab5917980fdb259f57052a65a0d \
  --folder=mySite \
  --reset \
  --max=50
```

#### Command-line options

| Option           | Required | Description                                                                      |
| ---------------- | -------- | -------------------------------------------------------------------------------- |
| `--start_url`    | yes      | The initial Notion page URL to crawl.                                            |
| `--folder`       | no       | Name of the output folder (defaults to the URL hostname).                        |
| `--reset`        | no       | If provided, deletes the existing `visited.json` and restarts the crawl.         |
| `--max`          | no       | Maximum number of pages to crawl (default: 10,000).                              |

The output directory structure will look like:

```
/sites/<folder>/
├── index.html              # First page (and others) saved
├── page_123.html           # Other crawled pages
├── visited.json            # Persisted list of visited URLs
└── images/
    ├── img1.png            # Downloaded images
    └── img2.jpg
```

---

## 🔍 Development & Testing

- **Tests** with Jest and jsdom:
  ```bash
  npm test
  ```
- **Linting/Formatting** (optional): integrate ESLint and Prettier as desired.

---

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request. For major changes, start by opening an issue to discuss your ideas.

---

© 2025 Daniel Rivas