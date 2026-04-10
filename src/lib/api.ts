// API client for Cloudflare Workers backend — replaces @supabase/supabase-js
// Mirrors the supabase client interface to minimize frontend code changes

const API_BASE = import.meta.env.VITE_API_URL || '';

// ─── Token management ────────────────────────────────────────────────────────
const TOKEN_KEY = 'riot_sheets_token';

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setToken(token: string): void {
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* noop */ }
}

export function clearToken(): void {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* noop */ }
}

// ─── Base request helper ─────────────────────────────────────────────────────
async function request<T = any>(path: string, options: RequestInit = {}): Promise<{ data: T | null; error: any }> {
  try {
    const token = getToken();
    const headers: Record<string, string> = {};

    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string> || {}) },
    });

    const data = await res.json();

    if (!res.ok) {
      return { data: null, error: { message: data.error || `Request failed: ${res.status}`, status: res.status } };
    }

    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: { message: err.message || 'Network error' } };
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const auth = {
  signUp: async (email: string, password: string, name?: string) => {
    const { data, error } = await request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    if (data?.token) setToken(data.token);
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await request('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data?.token) setToken(data.token);
    return { data, error };
  },

  signOut: async () => {
    clearToken();
    return { error: null };
  },

  getUser: async () => {
    const token = getToken();
    if (!token) return { data: null, error: null };
    return request('/api/auth/me');
  },

  getSession: async () => {
    const token = getToken();
    if (!token) return { data: { session: null }, error: null };
    const { data, error } = await request('/api/auth/me');
    if (error || !data?.user) return { data: { session: null }, error };
    return { data: { session: { token, user: data.user } }, error: null };
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    // Check initial state
    const token = getToken();
    if (token) {
      request('/api/auth/me').then(({ data }) => {
        if (data?.user) {
          callback('SIGNED_IN', { access_token: token, user: data.user });
        } else {
          clearToken();
          callback('SIGNED_OUT', null);
        }
      });
    } else {
      setTimeout(() => callback('SIGNED_OUT', null), 0);
    }

    // Listen for storage events (cross-tab sync)
    const handler = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) {
        if (e.newValue) {
          request('/api/auth/me').then(({ data }) => {
            if (data?.user) callback('SIGNED_IN', { access_token: e.newValue, user: data.user });
          });
        } else {
          callback('SIGNED_OUT', null);
        }
      }
    };
    window.addEventListener('storage', handler);

    return {
      data: {
        subscription: {
          unsubscribe: () => window.removeEventListener('storage', handler),
        },
      },
    };
  },
};

// ─── Functions (invoke backend routes by name) ───────────────────────────────
export const functions = {
  invoke: async (name: string, options?: { body?: any; headers?: Record<string, string> }) => {
    // Map Supabase function names to Worker API routes
    const routeMap: Record<string, { path: string; method: string }> = {
      'identify-song': { path: '/api/identify-song', method: 'POST' },
      'get-sheet-music': { path: '/api/get-sheet-music', method: 'POST' },
      'youtube-to-audio': { path: '/api/youtube-to-audio', method: 'POST' },
      'anthropic-chatgpt': { path: '/api/chat', method: 'POST' },
      'check-subscription': { path: '/api/check-subscription', method: 'GET' },
      'create-checkout': { path: '/api/create-checkout', method: 'POST' },
      'customer-portal': { path: '/api/customer-portal', method: 'POST' },
    };

    const route = routeMap[name];
    if (!route) return { data: null, error: { message: `Unknown function: ${name}` } };

    return request(route.path, {
      method: route.method,
      body: route.method === 'POST' && options?.body ? JSON.stringify(options.body) : undefined,
      headers: options?.headers,
    });
  },
};

// ─── Database query builder (replaces supabase.from()) ───────────────────────
// Supports the subset of PostgREST-style chaining used in the app
export function from(table: string) {
  return new QueryBuilder(table);
}

class QueryBuilder {
  private table: string;
  private method: 'select' | 'insert' | 'update' = 'select';
  private filters: Array<{ col: string; val: any }> = [];
  private selectCols = '*';
  private orderCol?: string;
  private orderDir?: string;
  private limitNum?: number;
  private isSingle = false;
  private body: any = null;

  constructor(table: string) {
    this.table = table;
  }

  select(cols = '*') {
    this.method = 'select';
    this.selectCols = cols;
    return this;
  }

  insert(data: any) {
    this.method = 'insert';
    this.body = data;
    return this;
  }

  update(data: any) {
    this.method = 'update';
    this.body = data;
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ col, val });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderDir = opts?.ascending === false ? 'desc' : 'asc';
    return this;
  }

  limit(n: number) {
    this.limitNum = n;
    return this;
  }

  single() {
    this.isSingle = true;
    return this.execute();
  }

  async execute(): Promise<{ data: any; error: any }> {
    // Route table operations to API endpoints
    if (this.table === 'music_analyses') {
      return this.executeAnalyses();
    }
    if (this.table === 'subscribers') {
      return this.executeSubscribers();
    }
    // Generic fallback
    return { data: null, error: { message: `Table ${this.table} not supported in API client` } };
  }

  private async executeAnalyses() {
    if (this.method === 'select') {
      // Check if filtering by ID
      const idFilter = this.filters.find(f => f.col === 'id');
      if (idFilter) {
        const { data, error } = await request(`/api/analyses/${idFilter.val}`);
        return { data: this.isSingle ? data : [data], error };
      }
      // List all
      const { data, error } = await request('/api/analyses');
      return { data, error };
    }

    if (this.method === 'insert') {
      const { data, error } = await request('/api/analyses', {
        method: 'POST',
        body: JSON.stringify(this.body),
      });
      if (this.isSingle) return { data, error };
      return { data: data ? [data] : null, error };
    }

    if (this.method === 'update') {
      const idFilter = this.filters.find(f => f.col === 'id');
      if (!idFilter) return { data: null, error: { message: 'Update requires .eq("id", ...)' } };
      return request(`/api/analyses/${idFilter.val}`, {
        method: 'PATCH',
        body: JSON.stringify(this.body),
      });
    }

    return { data: null, error: { message: 'Unsupported operation' } };
  }

  private async executeSubscribers() {
    if (this.method === 'update') {
      // Subscriber updates go through the subscription check endpoint
      // The backend handles this internally, so we just return success
      return { data: null, error: null };
    }
    return { data: null, error: { message: 'Subscribers table: use check-subscription endpoint' } };
  }

  // Allow then() so queries can be awaited directly
  then(resolve: (val: any) => void, reject?: (err: any) => void) {
    return this.execute().then(resolve, reject);
  }
}

// ─── Storage (R2 via Worker API) ─────────────────────────────────────────────
export const storage = {
  from: (bucket: string) => ({
    upload: async (path: string, file: Blob, options?: { contentType?: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', path);
      return request(`/api/storage/${bucket}`, { method: 'POST', body: formData });
    },
    download: async (path: string) => {
      try {
        const token = getToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE}/api/storage/${bucket}/${path}`, { headers });
        if (!res.ok) return { data: null, error: { message: 'Download failed' } };
        const blob = await res.blob();
        return { data: blob, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },
    getPublicUrl: (path: string) => ({
      data: { publicUrl: `${API_BASE}/api/storage/${bucket}/${path}` },
    }),
  }),
};

// ─── Default export (drop-in replacement for `supabase` import) ──────────────
export const api = { auth, functions, from, storage };
export default api;
