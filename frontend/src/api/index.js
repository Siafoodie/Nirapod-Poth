export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:5000/api`;

export async function api(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Unable to connect to the API at ${API_BASE_URL}. Make sure the backend is running and reachable.`,
      );
    }
    throw error;
  }

  const responseText = await response.text();
  let data = {};
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(`The API returned an invalid response (${response.status}).`);
    }
  }

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed with status ${response.status}`,
    );
  }

  return data;
}
