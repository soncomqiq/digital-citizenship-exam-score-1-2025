import {
  MAX_SCORE,
  parseScores,
  computeStatistics,
  normalDistributionCurve,
  cumulativeDistribution,
} from "./dataProcessor.js";

const DATA_URL = "scores.txt";
const numberFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const scoreFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const bilingual = (en, th, { inline = false } = {}) => {
  const wrapperClass = inline ? "bilingual-inline" : "";
  return `<span class="${wrapperClass}"><span class="lang-en">${en}</span><span class="lang-th">${th}</span></span>`;
};

async function loadScores() {
  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(
      bilingual(
        `Unable to load score data (status ${response.status}).`,
        `ไม่สามารถโหลดข้อมูลคะแนนได้ (รหัสสถานะ ${response.status})`
      )
    );
  }
  const text = await response.text();
  const scores = parseScores(text);
  if (!scores.length) {
    throw new Error(
      bilingual("No scores found in the data file.", "ไม่พบคะแนนในไฟล์ข้อมูล")
    );
  }
  return scores;
}

function renderSummary(stats) {
  const summaryContainer = document.querySelector("#summary-cards");
  summaryContainer.innerHTML = "";

  const seventyBenchmark = 0.7 * MAX_SCORE;

  const summaryItems = [
    {
      labelEn: "Students",
      labelTh: "จำนวนนักเรียน",
      compute: () => stats.count.toString(),
    },
    {
      labelEn: "Mean",
      labelTh: "ค่าเฉลี่ย",
      compute: () => scoreFormatter.format(stats.mean),
    },
    {
      labelEn: "Median",
      labelTh: "มัธยฐาน",
      compute: () => scoreFormatter.format(stats.median),
    },
    {
      labelEn: "Mode",
      labelTh: "ฐานนิยม",
      compute: () =>
        stats.mode.values.length === 1
          ? `${scoreFormatter.format(stats.mode.values[0])} (×${stats.mode.frequency})`
          : `${stats.mode.values
              .map((value) => scoreFormatter.format(value))
              .join(", ")} (×${stats.mode.frequency})`,
    },
    {
      labelEn: "Std. Deviation",
      labelTh: "ส่วนเบี่ยงเบนมาตรฐาน",
      compute: () => numberFormatter.format(stats.standardDeviation),
    },
    {
      labelEn: "Minimum",
      labelTh: "คะแนนต่ำสุด",
      compute: () => scoreFormatter.format(stats.min),
    },
    {
      labelEn: "Maximum",
      labelTh: "คะแนนสูงสุด",
      compute: () => scoreFormatter.format(stats.max),
    },
    {
      labelEn: `≥ 70% (≥ ${scoreFormatter.format(seventyBenchmark)})`,
      labelTh: `สัดส่วนที่ได้เกิน 70% (≥ ${scoreFormatter.format(seventyBenchmark)} คะแนน)`,
      compute: () => `${numberFormatter.format(stats.percentageAbove70)}%`,
    },
  ];

  summaryItems.forEach(({ labelEn, labelTh, compute }) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <h3>${bilingual(labelEn, labelTh)}</h3>
      <div class="value">${compute()}</div>`;
    summaryContainer.appendChild(card);
  });
}

function renderGradeDistribution(gradeBands, total) {
  const tbody = document.querySelector("#grade-table tbody");
  tbody.innerHTML = "";

  gradeBands.forEach(({ label, count }) => {
    const row = document.createElement("tr");
    const percent = (count / total) * 100;
    row.innerHTML = `
  <td>${bilingual(`${label} points`, `${label} คะแนน`)}</td>
      <td>${count}</td>
      <td>${percentFormatter.format(percent)}%</td>`;
    tbody.appendChild(row);
  });
}

function renderScoreBinChart(scoreBins, total) {
  const labels = scoreBins.map((bin) => bin.label);
  const counts = scoreBins.map((bin) => bin.count);
  const percentages = counts.map((count) => (count / total) * 100);

  const trace = {
    x: percentages,
    y: labels,
    type: "bar",
    orientation: "h",
    text: percentages.map((p) => `${percentFormatter.format(p)}%`),
    textposition: "auto",
    marker: {
      color: "rgba(37, 99, 235, 0.75)",
      line: { color: "rgba(37, 99, 235, 1)", width: 1 },
    },
  };

  const layout = {
    margin: { l: 80, r: 20, t: 10, b: 40 },
    xaxis: {
      title: "Percentage of Students (%)<br>สัดส่วนของนักเรียน (%)",
      ticksuffix: "%",
      zeroline: false,
    },
    yaxis: {
      title: "Score Interval (out of 10)<br>ช่วงคะแนน (เต็ม 10)",
      automargin: true,
    },
    bargap: 0.15,
    height: 380,
  };

  Plotly.newPlot("score-bands-chart", [trace], layout, { responsive: true, displaylogo: false });
}

function renderHistogram(scores) {
  const histogramTrace = {
    x: scores,
    type: "histogram",
    histnorm: "probability density",
    autobinx: false,
    xbins: {
      size: 0.5,
    },
    marker: {
      color: "rgba(99, 102, 241, 0.7)",
      line: { color: "rgba(79, 70, 229, 1)", width: 1 },
    },
    opacity: 0.75,
    name: "Observed",
  };

  const normalCurve = normalDistributionCurve(scores, 200);

  const normalTrace = {
    x: normalCurve.x,
    y: normalCurve.y,
    type: "scatter",
    mode: "lines",
    line: {
      color: "#ef4444",
      width: 3,
    },
    name: "Normal fit",
  };

  const layout = {
    margin: { l: 50, r: 30, t: 10, b: 50 },
    xaxis: {
      title: "Score (out of 10)<br>คะแนน (เต็ม 10)",
      range: [
        Math.max(Math.min(...scores) - 0.5, 0),
        Math.min(Math.max(...scores) + 0.5, MAX_SCORE + 0.5),
      ],
    },
    yaxis: {
      title: "Density<br>ความหนาแน่น",
      zeroline: false,
    },
    barmode: "overlay",
    legend: { orientation: "h" },
    height: 380,
  };

  Plotly.newPlot("histogram", [histogramTrace, normalTrace], layout, {
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ["lasso2d", "select2d"],
  });
}

function renderBoxPlot(scores) {
  const trace = {
    y: scores,
    type: "box",
    name: "Scores",
    boxpoints: "suspectedoutliers",
    marker: {
      color: "rgba(16, 185, 129, 0.7)",
      line: { color: "rgba(5, 150, 105, 1)", width: 1 },
    },
  };

  const layout = {
    margin: { l: 50, r: 30, t: 10, b: 20 },
    height: 380,
    showlegend: false,
    yaxis: {
      title: "Score (out of 10)<br>คะแนน (เต็ม 10)",
      zeroline: false,
    },
  };

  Plotly.newPlot("box-plot", [trace], layout, { responsive: true, displaylogo: false });
}

function renderCDF(scores) {
  const cdf = cumulativeDistribution(scores);
  const trace = {
    x: cdf.map((point) => point.value),
    y: cdf.map((point) => point.probability),
    type: "scatter",
    mode: "lines+markers",
    line: { color: "#f59e0b", width: 3 },
    marker: { size: 6, color: "#f59e0b" },
  };

  const layout = {
    margin: { l: 60, r: 30, t: 10, b: 50 },
    xaxis: {
      title: "Score (out of 10)<br>คะแนน (เต็ม 10)",
      zeroline: false,
    },
    yaxis: {
      title: "Cumulative Probability<br>ความน่าจะเป็นสะสม",
      tickformat: ".0%",
      range: [0, 1.05],
    },
    height: 380,
  };

  Plotly.newPlot("cdf-plot", [trace], layout, { responsive: true, displaylogo: false });
}

function renderStatsTable(stats) {
  const tbody = document.querySelector("#detailed-stats tbody");
  tbody.innerHTML = "";

  const rows = [
    [
      bilingual("Q1 (25th percentile)", "ควอร์ไทล์ที่ 1 (25%)"),
      scoreFormatter.format(stats.quartiles.q1),
    ],
    [
      bilingual("Median (Q2)", "มัธยฐาน (Q2)"),
      scoreFormatter.format(stats.quartiles.q2),
    ],
    [
      bilingual("Q3 (75th percentile)", "ควอร์ไทล์ที่ 3 (75%)"),
      scoreFormatter.format(stats.quartiles.q3),
    ],
    [bilingual("IQR", "ช่วงค่ากลาง (IQR)"), scoreFormatter.format(stats.iqr)],
    [
      bilingual("Lower fence", "ขอบล่างสำหรับหาค่าผิดปกติ"),
      scoreFormatter.format(stats.fences.lower),
    ],
    [
      bilingual("Upper fence", "ขอบบนสำหรับหาค่าผิดปกติ"),
      scoreFormatter.format(stats.fences.upper),
    ],
    [
      bilingual("Outliers", "คะแนนที่หลุดเกณฑ์"),
      stats.outliers.length
        ? stats.outliers.map((value) => scoreFormatter.format(value)).join(", ")
        : bilingual("None", "ไม่มี", { inline: true }),
    ],
  ];

  rows.forEach(([label, value]) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${label}</td>
      <td>${value}</td>`;
    tbody.appendChild(row);
  });
}

function analyzePatterns(stats) {
  const container = document.querySelector("#insights-list");
  container.innerHTML = "";

  const insights = [];
  const addInsight = (en, th) => insights.push({ en, th });

  if (stats.outliers.length) {
    addInsight(
      `We spotted ${
        stats.outliers.length === 1 ? "a score" : `${stats.outliers.length} scores`
      } (${stats.outliers.map((value) => scoreFormatter.format(value)).join(", ")}) that fell below the usual range. If one of these is yours, use it as a signal to revisit the tricky topics and reach out for help early.`,
      `เราพบ${
        stats.outliers.length === 1 ? "คะแนนหนึ่งรายการ" : `${stats.outliers.length} คะแนน`
      } (${stats.outliers
        .map((value) => scoreFormatter.format(value))
        .join(", ")}) ที่ต่ำกว่าช่วงปกติ หากเป็นคะแนนของคุณให้ใช้เป็นสัญญาณว่าควรทบทวนบทที่ยากและขอความช่วยเหลือโดยเร็ว`
    );
  } else {
    addInsight(
      "Everyone stayed within the typical range—great consistency across the class!",
      "ทุกคนอยู่ในช่วงคะแนนปกติ แสดงให้เห็นถึงความสม่ำเสมอของทั้งชั้น!"
    );
  }

  const topBand = stats.scoreBins.reduce((prev, curr) => (curr.count > prev.count ? curr : prev));
  addInsight(
    `Most of you (${topBand.count} classmates) clustered between ${topBand.label} points. Keep leaning on the study habits that got you there.`,
    `เพื่อน ๆ ส่วนใหญ่ (${topBand.count} คน) อยู่ในช่วง ${topBand.label} คะแนน รักษานิสัยการเรียนแบบนั้นไว้ต่อไป!`
  );

  const { values: modes } = stats.mode;
  if (modes.length > 1) {
    addInsight(
      `Several score peaks (${modes.map((value) => scoreFormatter.format(value)).join(", ")}) tell us different groups mastered different pieces first. Share what worked for you with a classmate!`,
      `มีหลายช่วงคะแนนยอดนิยม (${modes
        .map((value) => scoreFormatter.format(value))
        .join(", ")}) แสดงว่ากลุ่มต่าง ๆ เชี่ยวชาญหัวข้อไม่เหมือนกัน ลองแบ่งปันวิธีการเรียนที่ได้ผลกับเพื่อนดูนะ!`
    );
  }

  const pctAbove70 = stats.percentageAbove70;
  const masteryTarget = scoreFormatter.format(0.7 * MAX_SCORE);
  addInsight(
    `${numberFormatter.format(pctAbove70)}% of the class hit at least ${masteryTarget} points (that’s the mastery target). Celebrate that momentum and keep pushing!`,
    `${numberFormatter.format(pctAbove70)}% ของชั้นทำได้ไม่ต่ำกว่า ${masteryTarget} คะแนน (เป้าหมายความเชี่ยวชาญ) รักษาโมเมนตัมนี้ไว้แล้วเดินหน้าต่อ!`
  );

  if (stats.standardDeviation > 1.2) {
    addInsight(
      `Scores varied quite a bit (spread of ${numberFormatter.format(
        stats.standardDeviation
      )}), so compare notes with classmates to fill any gaps.`,
      `คะแนนกระจายค่อนข้างมาก (ส่วนเบี่ยงเบน ${numberFormatter.format(
        stats.standardDeviation
      )}) ลองแลกเปลี่ยนโน้ตกับเพื่อนเพื่ออุดช่องโหว่ที่ยังไม่เข้าใจ`
    );
  } else {
    addInsight(
      "Your scores sit close together, showing steady progress as a group. Nice work staying consistent!",
      "คะแนนของทุกคนใกล้เคียงกัน แสดงว่ามีความก้าวหน้ามั่นคงในฐานะทีม เก่งมาก!"
    );
  }

  insights.forEach(({ en, th }) => {
    const item = document.createElement("li");
    item.innerHTML = bilingual(en, th);
    container.appendChild(item);
  });
}

function buildReportCSV(stats, scores) {
  const lines = [];
  lines.push("Metric (EN/TH),Value");
  lines.push(`Students / จำนวนนักเรียน,${stats.count}`);
  lines.push(`Mean / ค่าเฉลี่ย,${numberFormatter.format(stats.mean)}`);
  lines.push(`Median / มัธยฐาน,${numberFormatter.format(stats.median)}`);
  lines.push(`Mode / ฐานนิยม,${stats.mode.values.join(" /")} (freq ${stats.mode.frequency})`);
  lines.push(`Standard Deviation / ส่วนเบี่ยงเบนมาตรฐาน,${numberFormatter.format(stats.standardDeviation)}`);
  lines.push(`Minimum / คะแนนต่ำสุด,${stats.min}`);
  lines.push(`Maximum / คะแนนสูงสุด,${stats.max}`);
  lines.push(`Q1 / ควอร์ไทล์ที่ 1,${numberFormatter.format(stats.quartiles.q1)}`);
  lines.push(`Q2 (Median) / ควอร์ไทล์ที่ 2,${numberFormatter.format(stats.quartiles.q2)}`);
  lines.push(`Q3 / ควอร์ไทล์ที่ 3,${numberFormatter.format(stats.quartiles.q3)}`);
  lines.push(`IQR / ช่วงค่ากลาง (IQR),${numberFormatter.format(stats.iqr)}`);
  lines.push(`Lower Fence / ขอบล่าง,${numberFormatter.format(stats.fences.lower)}`);
  lines.push(`Upper Fence / ขอบบน,${numberFormatter.format(stats.fences.upper)}`);
  lines.push(
    `Outliers / คะแนนที่หลุดเกณฑ์,${
      stats.outliers.length
        ? stats.outliers.map((value) => scoreFormatter.format(value)).join(" ")
        : "None / ไม่มี"
    }`
  );
  lines.push(`≥70% / สัดส่วนที่ถึง 70%,${numberFormatter.format(stats.percentageAbove70)}%`);
  lines.push("");

  lines.push("Score Range (points) / ช่วงคะแนน,Count");
  stats.gradeBands.forEach((band) => {
    lines.push(`${band.label},${band.count}`);
  });
  lines.push("");

  return lines.join("\n");
}

function registerReportDownload(stats, scores) {
  const button = document.querySelector("#download-report");
  button.addEventListener("click", () => {
    const csv = buildReportCSV(stats, scores);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const timestamp = new Date().toISOString().split("T")[0];
    link.download = `exam-score-analysis-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}

function showStatus(message, isError = false) {
  const el = document.querySelector("#status-message");
  el.innerHTML = message;
  el.style.color = isError ? "#dc2626" : "#16a34a";
}

async function init() {
  showStatus(bilingual("Loading scores…", "กำลังโหลดคะแนน…"));
  try {
    const scores = await loadScores();
    const stats = computeStatistics(scores, MAX_SCORE);

    renderSummary(stats);
    renderGradeDistribution(stats.gradeBands, stats.count);
    renderScoreBinChart(stats.scoreBins, stats.count);
    renderHistogram(scores);
    renderBoxPlot(scores);
    renderCDF(scores);
    renderStatsTable(stats);
    analyzePatterns(stats);
    registerReportDownload(stats, scores);

    showStatus(
      bilingual(
        `Loaded ${stats.count} scores successfully.`,
        `โหลดคะแนน ${stats.count} รายการสำเร็จ`
      )
    );
  } catch (error) {
    console.error(error);
    showStatus(error.message, true);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  init();
});
