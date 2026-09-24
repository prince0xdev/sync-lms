import type { Locale } from './locale';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

type RequestOptions = {
    locale: Locale;
    accessToken?: string | null;
    body?: unknown;
    method?: 'GET' | 'POST' | 'PUT';
};

export class ApiError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

export async function apiRequest<T>(path: string, options: RequestOptions): Promise<T> {
    const headers: Record<string, string> = { 'Accept-Language': options.locale };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;

    const response = await fetch(`${apiBaseUrl}${path}`, {
        method: options.method ?? 'GET',
        headers,
        credentials: 'include',
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
        const message = typeof payload === 'object' && payload !== null && 'detail' in payload && typeof payload.detail === 'string'
            ? payload.detail
            : options.locale === 'fr' ? 'Une erreur est survenue.' : 'Something went wrong.';
        throw new ApiError(message);
    }

    return payload as T;
}

export async function uploadMedia<T>(
    path: string,
    file: File,
    options: { locale: Locale; accessToken?: string | null; language?: string },
): Promise<T> {
    const body = new FormData();
    body.append('file', file);
    if (options.language) body.append('language', options.language);
    const headers: Record<string, string> = { 'Accept-Language': options.locale };
    if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;
    const response = await fetch(`${apiBaseUrl}${path}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body,
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
        const message = typeof payload === 'object' && payload !== null && 'detail' in payload && typeof payload.detail === 'string'
            ? payload.detail
            : options.locale === 'fr' ? 'Impossible d’envoyer le média.' : 'Could not upload media.';
        throw new ApiError(message);
    }
    return payload as T;
}
