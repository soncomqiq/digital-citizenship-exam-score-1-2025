const MAX_SCORE = 10;

const formatScore = (value) => (Math.round(value * 10) / 10).toFixed(1);

function parseScores(rawText) {
  return rawText
    .split(/\s+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => Number(entry))
    .filter((value) => Number.isFinite(value));
}

function mean(values) {
  const total = values.reduce((acc, value) => acc + value, 0);
  return total / values.length;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function mode(values) {
  const frequency = new Map();
  let maxFrequency = 0;
  values.forEach((value) => {
    const count = (frequency.get(value) ?? 0) + 1;
    frequency.set(value, count);
    maxFrequency = Math.max(maxFrequency, count);
  });
  const modes = [...frequency.entries()]
    .filter(([, count]) => count === maxFrequency)
    .map(([value]) => value)
    .sort((a, b) => a - b);
  return { modes, frequency: maxFrequency };
}

function standardDeviation(values) {
  const valuesMean = mean(values);
  const variance =
    values.reduce((acc, value) => acc + (value - valuesMean) ** 2, 0) /
    (values.length - 1);
  return Math.sqrt(variance);
}

function computeQuartiles(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const lowerHalf = sorted.slice(0, mid);
  const upperHalf = sorted.length % 2 === 0 ? sorted.slice(mid) : sorted.slice(mid + 1);
  return {
    q1: median(lowerHalf),
    q2: median(sorted),
    q3: median(upperHalf),
  };
}

function computeGradeBands(values, maxScore = MAX_SCORE) {
  const step = maxScore * 0.1;
  const narrowStep = step / 10;
  const tiers = [
    {
      label: `≥ ${formatScore(maxScore - step)}`,
      min: maxScore - step,
      max: maxScore + 1e-6,
      count: 0,
    },
    {
      label: `${formatScore(maxScore - step * 2)} – ${formatScore(maxScore - step - narrowStep)}`,
      min: maxScore - step * 2,
      max: maxScore - step + 1e-6,
      count: 0,
    },
    {
      label: `${formatScore(maxScore - step * 3)} – ${formatScore(maxScore - step * 2 - narrowStep)}`,
      min: maxScore - step * 3,
      max: maxScore - step * 2 + 1e-6,
      count: 0,
    },
    {
      label: `${formatScore(maxScore - step * 4)} – ${formatScore(maxScore - step * 3 - narrowStep)}`,
      min: maxScore - step * 4,
      max: maxScore - step * 3 + 1e-6,
      count: 0,
    },
    {
      label: `< ${formatScore(maxScore - step * 4)}`,
      min: -Infinity,
      max: maxScore - step * 4 + 1e-6,
      count: 0,
    },
  ];

  values.forEach((score) => {
    const tier = tiers.find((entry) => score >= entry.min && score < entry.max);
    if (tier) {
      tier.count += 1;
    }
  });

  return tiers.map(({ label, count }) => ({ label, count }));
}

function computeScoreDistribution(values, binSize = 1) {
  const minScore = Math.min(...values);
  const maxScore = Math.max(...values);
  const start = Math.floor(minScore / binSize) * binSize;
  const end = Math.ceil(maxScore / binSize) * binSize;
  const bins = [];

  for (let edge = start; edge < end; edge += binSize) {
    const upper = edge + binSize;
    bins.push({
      label: `${formatScore(edge)} – ${formatScore(upper)}`,
      min: edge,
      max: upper,
      count: 0,
    });
  }

  values.forEach((score) => {
    const index = Math.min(
      Math.floor((score - start) / binSize),
      bins.length - 1
    );
    bins[index].count += 1;
  });

  return bins.map(({ label, count }) => ({ label, count }));
}

function computeStatistics(values, maxScore = MAX_SCORE) {
  const sorted = [...values].sort((a, b) => a - b);
  const { modes, frequency } = mode(values);
  const { q1, q2, q3 } = computeQuartiles(values);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const valuesMean = mean(values);
  const stdDev = standardDeviation(values);
  const percentageAbove70 =
    (values.filter((score) => score >= 0.7 * maxScore).length / values.length) * 100;

  const lowerFence = q1 - 1.5 * (q3 - q1);
  const upperFence = q3 + 1.5 * (q3 - q1);
  const outliers = values.filter((score) => score < lowerFence || score > upperFence);

  return {
    count: values.length,
    mean: valuesMean,
    median: median(values),
    mode: { values: modes, frequency },
    standardDeviation: stdDev,
    min,
    max,
    quartiles: { q1, q2, q3 },
    iqr: q3 - q1,
    fences: { lower: lowerFence, upper: upperFence },
    outliers,
    percentageAbove70,
    gradeBands: computeGradeBands(values, maxScore),
    scoreBins: computeScoreDistribution(values),
  };
}

function normalDistributionCurve(values, bucketCount = 100) {
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const valuesMean = mean(values);
  const stdDev = standardDeviation(values);
  const step = (max - min) / bucketCount;
  const x = [];
  const y = [];

  const normalizationFactor = 1 / (stdDev * Math.sqrt(2 * Math.PI));

  for (let i = 0; i <= bucketCount; i++) {
    const xValue = min + step * i;
    const exponent = -0.5 * ((xValue - valuesMean) / stdDev) ** 2;
    x.push(xValue);
    y.push(normalizationFactor * Math.exp(exponent));
  }

  return { x, y };
}

function cumulativeDistribution(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const counts = sorted.map((value, index) => ({ value, probability: (index + 1) / sorted.length }));
  return counts;
}

export {
  MAX_SCORE,
  parseScores,
  computeStatistics,
  computeScoreDistribution,
  computeGradeBands,
  normalDistributionCurve,
  cumulativeDistribution,
};
