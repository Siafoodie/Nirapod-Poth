export function validateReport(data) {
  if (!data.incidentType?.trim()) {
    return "Incident type is required";
  }

  if (!data.location?.trim()) {
    return "Location is required";
  }

  return null;
}

export function buildAnonymousReport(data) {
  return {
    incidentType: data.incidentType.trim(),
    location: data.location.trim(),
    description: data.description?.trim() || "",
    ...(data.geo ? { geo: data.geo } : {}),
  };
}