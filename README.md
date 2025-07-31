

---

```markdown
# 📦 Scraper-Indexer

A powerful Node.js-based utility to scrape, process, and index various file types including documents, HTML, images, audio, video, and more. Built to automate content ingestion and indexing pipelines with optional UI/API access.

## ✨ Features

- Scrapes content from multiple file formats:
  - `.html`, `.pdf`, `.docx`, `.pptx`, `.xlsx`, `.csv`
  - `.odt`, `.ods`, `.odp`, `.svg`
  - `.jpg`, `.png`, `.mp4`, `.mp3`, etc.
- Extracts and indexes text from structured/unstructured data
- Supports batch processing of large datasets
- Generates thumbnails for image and video files
- Gracefully handles corrupted or broken files (e.g., SVG)
- Provides filtering by extension and project-wise organization

## 📁 Project Structure

```

scraper-indexer/
├── controllers/          # Handles API or internal logic
├── models/               # Data schema or file structures
├── routes/               # Express endpoints
├── views/                # Frontend templates (optional)
├── public/               # Static files (CSS, JS, images)
├── helpers/              # Utility scripts (indexing, scanning)
├── scripts/              # Automation scripts (.bat)
├── server.js             # Main server entry point
├── package.json          # Project metadata and dependencies

````

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/coolb0y/scraper-indexer.git
cd scraper-indexer
````

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Server

```bash
node server.js
```

Or on Windows:

```bash
start.bat
```

By default, the server runs at: [http://localhost:3000](http://localhost:3000)

## 🧪 Key Scripts

| Script                | Description                                |
| --------------------- | ------------------------------------------ |
| `indexOpencopy.js`    | Indexes content from specified folders     |
| `scanLinearcopy.js`   | Linearly scans and processes files         |
| `createThumbnail.js`  | Generates thumbnails for images and videos |
| `projectnamecheck.js` | Validates project naming conventions       |
| `folderexist.bat`     | Ensures required folder structure exists   |
| `copydata.bat`        | Copies data to the working directory       |

## 📦 Supported File Types

* Text: `.txt`, `.html`, `.md`
* Documents: `.pdf`, `.docx`, `.pptx`, `.xlsx`, `.csv`, `.odt`, `.ods`, `.odp`
* Media: `.jpg`, `.jpeg`, `.png`, `.svg`, `.mp4`, `.mp3`, `.webm`
* Others: Custom extension filtering available

## 🧯 Error Handling

* Corrupt or malformed files (especially SVG) are skipped or handled safely
* Out-of-memory SVG issues mitigated in v5.2+
* Logs include detailed error tracing and skipped files list

## 🧩 Use Cases

* Content ingestion for search engines
* Internal document archive processing
* Media library indexing
* Offline document scraping and summary building
* Automation of file metadata extraction

## 🆕 Release Highlights

### v5.2

* Improved memory handling for SVG extraction
* Skips corrupted SVGs gracefully

### v5.0

* Added support: `pptx`, `xlsx`, `ods`, `odp`, `svg`
* Enhanced extension filtering logic
* Better indexing output and logs

## 👨‍💻 Author

Created by [coolb0y](https://github.com/coolb0y)

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

```

---

Let me know if you want to generate a matching `LICENSE`, API reference, or `.env.example` file too.
```
