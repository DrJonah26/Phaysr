const BASE = '/api';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'request_failed');
  return data as T;
}

type PublicUser = { id: string; email: string; subscriptionStatus: 'active' | 'trial' | 'inactive'; trialStartedAt: number | null };

export const api = {
  auth: {
    me: () => req<{ user: PublicUser | null }>('/auth/me'),
    signup: (email: string, password: string) =>
      req<{ user: PublicUser }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    signin: (email: string, password: string) =>
      req<{ user: PublicUser }>('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    signout: () => req<{ ok: boolean }>('/auth/signout', { method: 'POST' }),
  },
  billing: {
    createCheckout: (projectId?: string) =>
      req<{ url: string }>('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ projectId }),
      }),
  },
  projects: {
    list: () =>
      req<{ projects: Project[] }>('/projects'),
    create: (data: ProjectInput) =>
      req<{ project: Project }>('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<ProjectInput>) =>
      req<{ project: Project }>(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
};

export interface Project {
  id: string;
  apiKey: string;
  siteName: string;
  color: string;
  context: string;
  contextUrl: string;
  allowedDomain: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectInput {
  siteName: string;
  color: string;
  context?: string;
  contextUrl?: string;
  allowedDomain?: string;
}
