const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : 'https://api.gunasai.in')
).replace(/\/$/, '');

export function resolveApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}

let csrfToken: string | null = null;

export function invalidateCsrfToken() {
  csrfToken = null;
}

export async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  try {
    const res = await fetch(resolveApiUrl('/api/v1/admin/auth/csrf'), { credentials: 'include' });
    if (res.ok) {
      const json = await res.json();
      csrfToken = json?.data?.csrfToken || json?.csrfToken || '';
      return csrfToken || '';
    }
  } catch (err) {
    console.warn('Failed to fetch CSRF token:', err);
  }
  return '';
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: any;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach CSRF token on mutating methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const token = await getCsrfToken();
    if (token) {
      headers.set('x-csrf-token', token);
    }
  }

  const response = await fetch(resolveApiUrl(endpoint), {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type') || '';
  let data: any = null;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else if (contentType.includes('text/csv')) {
    data = await response.text();
    return data as unknown as T;
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    if (response.status === 403 && data?.error?.code === 'CSRF_MISMATCH') {
      invalidateCsrfToken();
    }
    const detailsMsg = Array.isArray(data?.error?.details) && data.error.details.length > 0
      ? data.error.details.map((d: any) => `${d.path ? d.path + ': ' : ''}${d.message}`).join(', ')
      : (typeof data?.error?.details === 'string' ? data.error.details : '');

    const baseMessage = data?.error?.message || response.statusText || 'Request failed';
    const finalMessage = detailsMsg ? `${baseMessage}: ${detailsMsg}` : baseMessage;

    const err: ApiError = {
      status: response.status,
      code: data?.error?.code || 'UNKNOWN_ERROR',
      message: finalMessage,
      details: data?.error?.details,
    };
    throw err;
  }

  return data?.data !== undefined ? data.data : data;
}

// API methods
export const api = {
  // Auth
  async getMe() {
    return apiRequest<{ id: string; email: string; role: string }>('/api/v1/admin/auth/me');
  },
  async login(credentials: { email: string; password: string }) {
    invalidateCsrfToken();
    const result = await apiRequest('/api/v1/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    // Immediately store the newly rotated CSRF token
    if (result?.csrfToken) {
      csrfToken = result.csrfToken;
    } else {
      await getCsrfToken();
    }
    return result;
  },
  async logout() {
    try {
      await apiRequest('/api/v1/admin/auth/logout', { method: 'POST' });
    } finally {
      invalidateCsrfToken();
    }
  },

  // Pages
  async getPages() {
    return apiRequest<any[]>('/api/v1/admin/pages');
  },
  async getPage(pageId: string) {
    return apiRequest<any>(`/api/v1/admin/pages/${pageId}`);
  },
  async createPage(data: { title: string; slug: string; seo?: any }) {
    return apiRequest<any>('/api/v1/admin/pages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateDraft(pageId: string, data: { expectedRevision: number; sections: any[]; seo?: any }) {
    return apiRequest<any>(`/api/v1/admin/pages/${pageId}/draft`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async publishPage(pageId: string, data?: { expectedDraftRevision?: number; note?: string }) {
    return apiRequest<any>(`/api/v1/admin/pages/${pageId}/publish`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },
  async getPreviewToken(pageId: string) {
    return apiRequest<{ token: string; previewUrl: string; expiresAt: string }>(
      `/api/v1/admin/pages/${pageId}/preview`,
      { method: 'POST' }
    );
  },
  async getVersions(pageId: string) {
    return apiRequest<any[]>(`/api/v1/admin/pages/${pageId}/versions`);
  },
  async restoreVersion(pageId: string, revision: number) {
    return apiRequest<any>(`/api/v1/admin/pages/${pageId}/restore/${revision}`, {
      method: 'POST',
    });
  },

  // Theme
  async getTheme() {
    return apiRequest<any>('/api/v1/admin/theme');
  },
  async updateTheme(themeData: any) {
    return apiRequest<any>('/api/v1/admin/theme', {
      method: 'PUT',
      body: JSON.stringify(themeData),
    });
  },

  // Settings
  async getSettings() {
    return apiRequest<any>('/api/v1/admin/settings');
  },
  async updateSettings(settingsData: any) {
    return apiRequest<any>('/api/v1/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  },

  // Media
  async getMedia(params?: { page?: number; limit?: number; search?: string }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', params.page.toString());
    if (params?.limit) qs.set('limit', params.limit.toString());
    if (params?.search) qs.set('search', params.search);
    return apiRequest<any>(`/api/v1/admin/media?${qs.toString()}`);
  },
  async uploadMedia(formData: FormData) {
    return apiRequest<any>('/api/v1/admin/media/upload', {
      method: 'POST',
      body: formData,
    });
  },
  async deleteMedia(mediaId: string) {
    return apiRequest<any>(`/api/v1/admin/media/${mediaId}`, {
      method: 'DELETE',
    });
  },

  // Forms & Submissions
  async getForms() {
    return apiRequest<any[]>('/api/v1/admin/forms');
  },
  async createForm(formData: any) {
    return apiRequest<any>('/api/v1/admin/forms', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },
  async updateForm(formId: string, formData: any) {
    return apiRequest<any>(`/api/v1/admin/forms/${formId}`, {
      method: 'PATCH',
      body: JSON.stringify(formData),
    });
  },
  async deleteForm(formId: string) {
    return apiRequest<any>(`/api/v1/admin/forms/${formId}`, {
      method: 'DELETE',
    });
  },
  async getSubmissions(params?: { page?: number; limit?: number; status?: string; formId?: string }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', params.page.toString());
    if (params?.limit) qs.set('limit', params.limit.toString());
    if (params?.status) qs.set('status', params.status);
    if (params?.formId) qs.set('formId', params.formId);
    return apiRequest<any>(`/api/v1/admin/submissions?${qs.toString()}`);
  },
  async updateSubmission(submissionId: string, data: { status?: string }) {
    return apiRequest<any>(`/api/v1/admin/submissions/${submissionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  async exportSubmissionsCsv(formId?: string) {
    const qs = formId ? `?formId=${formId}` : '';
    return apiRequest<string>(`/api/v1/admin/submissions/export${qs}`);
  },
};
