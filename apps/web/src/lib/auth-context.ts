import { createContext } from 'react';
import type { AuthUser } from './auth';

type AuthContextType = {
    user: AuthUser | null;
    accessToken: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (input: { email: string; password: string; first_name: string; last_name: string }) => Promise<void>;
    logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);
