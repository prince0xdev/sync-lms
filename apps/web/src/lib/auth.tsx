import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { apiRequest } from './api';
import { useI18n } from './useI18n';
import { AuthContext } from './auth-context';

export type AuthUser = {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    is_admin: boolean;
};

type AuthResponse = {
    access_token: string;
    user: AuthUser;
};

type RegisterInput = {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const { locale } = useI18n();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const restoreStarted = useRef(false);

    const acceptSession = useCallback((session: AuthResponse) => {
        setAccessToken(session.access_token);
        setUser(session.user);
    }, []);

    useEffect(() => {
        if (restoreStarted.current) return;
        restoreStarted.current = true;
        apiRequest<AuthResponse>('/auth/refresh', { method: 'POST', locale })
            .then(acceptSession)
            .catch(() => undefined)
            .finally(() => setIsLoading(false));
    }, [acceptSession, locale]);

    const login = useCallback(async (email: string, password: string) => {
        const session = await apiRequest<AuthResponse>('/auth/login', { method: 'POST', locale, body: { email, password } });
        acceptSession(session);
    }, [acceptSession, locale]);

    const register = useCallback(async (input: RegisterInput) => {
        const session = await apiRequest<AuthResponse>('/auth/register', { method: 'POST', locale, body: input });
        acceptSession(session);
    }, [acceptSession, locale]);

    const logout = useCallback(async () => {
        await apiRequest<{ message: string }>('/auth/logout', { method: 'POST', locale, accessToken }).catch(() => undefined);
        setAccessToken(null);
        setUser(null);
    }, [accessToken, locale]);

    return <AuthContext.Provider value={{ user, accessToken, isLoading, login, register, logout }}>{children}</AuthContext.Provider>;
}
