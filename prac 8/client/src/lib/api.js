export class ApiError extends Error {
  constructor(message, details) {
    super(message);
    this.details = details;
  }
}

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (res.status === 204) {
    return null;
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message = body?.error || 'Something went wrong. Please try again.';
    throw new ApiError(message, body?.details);
  }

  return body;
}

export function listStudents(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  }
  const qs = query.toString();
  return request(`/api/students${qs ? `?${qs}` : ''}`);
}

export const getStats = () => request('/api/students/stats');

export const createStudent = (data) =>
  request('/api/students', { method: 'POST', body: JSON.stringify(data) });

export const updateStudent = (id, data) =>
  request(`/api/students/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteStudent = (id) =>
  request(`/api/students/${id}`, { method: 'DELETE' });
