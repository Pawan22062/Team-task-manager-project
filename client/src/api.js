const API = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      data.error ||
      data.errors?.[0]?.msg ||
      data.errors?.[0]?.message ||
      'Request failed';
    throw new Error(msg);
  }
  return data;
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  dashboard: () => request('/dashboard'),
  projects: {
    list: () => request('/projects'),
    get: (id) => request(`/projects/${id}`),
    create: (body) => request('/projects', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) =>
      request(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
    addMember: (id, body) =>
      request(`/projects/${id}/members`, { method: 'POST', body: JSON.stringify(body) }),
    updateMember: (id, userId, body) =>
      request(`/projects/${id}/members/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    removeMember: (id, userId) =>
      request(`/projects/${id}/members/${userId}`, { method: 'DELETE' }),
  },
  tasks: {
    list: (projectId, params = '') =>
      request(`/tasks/projects/${projectId}/tasks${params ? `?${params}` : ''}`),
    create: (projectId, body) =>
      request(`/tasks/projects/${projectId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (id, body) =>
      request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  },
};
