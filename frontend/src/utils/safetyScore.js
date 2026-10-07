export const calculateSafetyScore = ({
  crimeSafety,
  lighting,
  communityReports,
  timeOfDay,
}) => {
  const factors = [
    { value: crimeSafety, weight: 0.4 },
    { value: lighting, weight: 0.25 },
    { value: communityReports, weight: 0.2 },
    { value: timeOfDay, weight: 0.15 },
  ];

  // Only use factors that contain valid numeric data
  const availableFactors = factors.filter(
    (factor) =>
      typeof factor.value === "number" &&
      !Number.isNaN(factor.value)
  );

  // If no safety data is available
  if (availableFactors.length === 0) {
    return null;
  }

  // Recalculate based only on available data
  const totalWeight = availableFactors.reduce(
    (total, factor) => total + factor.weight,
    0
  );

  const weightedScore = availableFactors.reduce(
    (total, factor) =>
      total + factor.value * factor.weight,
    0
  );

  return Math.round(weightedScore / totalWeight);
};

export const getSafetyLevel = (score) => {
  if (score === null || score === undefined) {
    return "UNKNOWN";
  }

  if (score >= 80) {
    return "HIGH";
  }

  if (score >= 50) {
    return "MEDIUM";
  }

  return "LOW";
};