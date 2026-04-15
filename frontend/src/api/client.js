const API_BASE = 'http://localhost:4000';

export async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Unknown API error' }));
    throw new Error(error.message || 'Request failed');
  }

  return res.json();
}
