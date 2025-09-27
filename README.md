# Exam Score Insights Dashboard

A lightweight, GitHub Pages–ready analytics dashboard that visualizes the `scores.txt` dataset (out of 10 points) with interactive charts and downloadable summaries. Built with vanilla JavaScript modules and Plotly.js for fully client-side deployment.

## Highlights

- Automatic parsing of `scores.txt` into descriptive statistics, grade bands, and chart-ready datasets
- Interactive histogram with a fitted normal curve, box plot (for outliers), cumulative distribution, and score band bar chart
- Responsive layout designed for desktops, tablets, and phones
- One-click CSV export containing key metrics and grade bands
- Bilingual English/Thai interface and exports so every student can follow along

## Quick Start

1. **Serve locally (recommended)**
   ```powershell
   cd "c:\Users\nuttachai.ku\Downloads\Local Learn\we-stride\Examination-1"
   npx --yes --registry https://registry.npmjs.org serve@14 .
   ```
   If your npm configuration forces a private registry and the command above still fails, you can temporarily bypass it with `setx npm_config_registry https://registry.npmjs.org` (restart the terminal afterwards).

   **Offline-friendly alternative (requires Python 3):**
   ```powershell
   cd "c:\Users\nuttachai.ku\Downloads\Local Learn\we-stride\Examination-1"
   python -m http.server 5500
   ```

   Open the printed local URL (for example `http://localhost:3000` or `http://localhost:5500`) to see the dashboard. Using a static server avoids browser security restrictions when fetching `scores.txt`.

2. **Deploy to GitHub Pages**
   - Commit the repository and push to GitHub.
   - Enable GitHub Pages for the repo (Settings → Pages → Source: `main` / `/` root).
   - The dashboard fetches `scores.txt` relatively, so any updates to the file are reflected automatically after publishing.

## Key Results (current dataset)

- **Mean:** 8.40
- **Median:** 8.60
- **Mode:** 8.4 (appears 6×)
- **Standard deviation (sample):** 1.18
- **Range:** 3.8 – 10.0 (single low outlier at 3.8)
- **Percent ≥ 70% (≥7.0 points):** 93.02%
- **Score distribution:**
   - ≥ 9.0: 16 students
   - 8.0 – 8.9: 14 students
   - 7.0 – 7.9: 10 students
   - 6.0 – 6.9: 2 students
   - < 6.0: 1 student

### Observed Patterns

- The histogram peaks between 8.0 and 10.0, highlighting a high-performing class on the 10-point scale.
- A single outlier at 3.8 stands out; if this is yours, tap class resources early to bounce back.
- Several tight clusters (7.x and 9.x ranges) show mini-waves of mastery—encourage peer sharing across those groups.

### Grading Guidance

- **Keep the numeric tiers:** Treat ≥9.0 as "exceeds expectations," 8.0–8.9 as "meeting goals," 7.0–7.9 as "nearing targets," and use 6.x / <6.0 as early-warning checkpoints. Only three students fall below 7.0, so the benchmarks already differentiate progress well.
- **Optional curve:** To center the class around 9.0, add +0.6 points across the board (still cap scores at 10). The lowest score rises to 4.4 while top performers remain maxed without overshooting the scale.

## Customization

- **Update data:** Replace the contents of `scores.txt` with new newline- or space-delimited scores on the 0–10 scale.
- **Adjust grade bands:** Edit `computeGradeBands` inside `assets/js/dataProcessor.js` to change grade thresholds or labels.
- **Change visuals:** Modify layout options inside `assets/js/app.js` (e.g., bin size, colors, chart types).
- **Add exports:** Extend `buildReportCSV` for JSON, PDF, or direct email integrations.

## File Overview

| File | Purpose |
| --- | --- |
| `index.html` | Main landing page, references CSS/JS bundles. |
| `assets/css/styles.css` | Responsive styling and layout system. |
| `assets/js/dataProcessor.js` | Data parsing, statistics, grade-band utilities. |
| `assets/js/app.js` | Fetches scores, renders UI, handles insight generation and CSV export. |
| `scores.txt` | Raw exam scores (one score per line). |

---

Questions or enhancements? Adjust the JS modules and redeploy—no build step required.
