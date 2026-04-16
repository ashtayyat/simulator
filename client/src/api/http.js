const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function withApiHint(error, path) {
  return new Error(
    `${error.message} (request: ${path}). If you opened this app from GitHub Pages, set VITE_API_URL to a deployed backend URL.`
  );
}

export async function apiGet(path) {
  try {
    const res = await fetch(`${API}${path}`);
    if (!res.ok) throw new Error(`GET ${path} failed with ${res.status}`);
    return res.json();
  } catch (error) {
    throw withApiHint(error, path);
  }
}

export async function apiPost(path, body) {
  try {
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(err.message || `POST ${path} failed with ${res.status}`);
    }
    return res.json();
  } catch (error) {
    throw withApiHint(error, path);
  }
}
