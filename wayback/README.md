# Web Page Screenshot Archive

This repository uses GitHub Actions and GitHub Pages to create a Wayback Machine-like archive of web page screenshots. Screenshots are captured using a Node.js script (`archive.js`) with Puppeteer and stored in the `docs/wayback` folder. GitHub Actions automatically runs the script at scheduled intervals and commits any new screenshots.

## Repository Structure


---------------------


## How It Works

1. The `archive.js` script uses Puppeteer to capture full-page screenshots of the specified websites.
2. Screenshots are saved in the `docs/wayback/<YYYYMMDD>` folder with filenames containing the domain and timestamp.
3. The GitHub Actions workflow (in `.github/workflows/archive.yml`) runs on a schedule (e.g., daily at 07:00 UTC) and executes the script.
4. If new screenshots are found in the `docs` folder, they are committed and pushed to the repository.
5. GitHub Pages serves the `docs` folder as a static site, letting you browse the archived screenshots.

## Setup

1. Update the website URLs in `archive.js` as needed.
2. Modify the schedule in `.github/workflows/archive.yml` if desired.
3. Push the repository to GitHub.
4. In your GitHub repository settings, configure GitHub Pages to serve from the `docs` folder.


