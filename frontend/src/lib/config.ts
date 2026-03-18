export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_URL;
  if (!raw) return null;
  return String(raw).replace(/\/$/, '');
}
