import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import api from '../service';

export type AuthUser = {
  userId: string;
  email: string;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  targetGender: string | null;
  bio: string | null;
  status: string | null;
};

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type LoginResult = AuthTokens & { user: AuthUser };

type AuthContextType = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoggedIn: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const AUTH_USER_KEY = 'authUser';

const clearAuthStorage = async (): Promise<void> => {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(AUTH_USER_KEY),
  ]);
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async (): Promise<void> => {
      try {
        const [storedAccessToken, storedRefreshToken, storedUser] = await Promise.all([
          SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
          SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
          SecureStore.getItemAsync(AUTH_USER_KEY),
        ]);

        if (!storedAccessToken || !storedRefreshToken || !storedUser) return;

        const parsedUser = JSON.parse(storedUser) as AuthUser;
        if (isMounted) {
          setUser(parsedUser);
          setAccessToken(storedAccessToken);
        }

        try {
          const response = await api.post<{ data: AuthTokens }>('/auth/sessions/current/refreshes', {
            refreshToken: storedRefreshToken,
          });
          const tokens = response.data.data;
          await Promise.all([
            SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
            SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
          ]);
          if (isMounted) setAccessToken(tokens.accessToken);
        } catch (error) {
          if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
            await clearAuthStorage();
            if (isMounted) {
              setUser(null);
              setAccessToken(null);
            }
          }
        }
      } catch {
        await clearAuthStorage();
        if (isMounted) {
          setUser(null);
          setAccessToken(null);
        }
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };

    void restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const response = await api.post<{ data: LoginResult }>('/auth/sessions', { email, password });
    const result = response.data.data;

    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, result.accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, result.refreshToken),
      SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(result.user)),
    ]);

    setUser(result.user);
    setAccessToken(result.accessToken);
  };

  const logout = async () => {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      await api.post('/auth/sessions/current/revocations', { refreshToken }).catch(() => undefined);
    }

    await Promise.allSettled([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(AUTH_USER_KEY),
    ]);
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      isLoggedIn: user !== null && accessToken !== null,
      isInitializing,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được dùng bên trong AuthProvider');
  }
  return context;
};