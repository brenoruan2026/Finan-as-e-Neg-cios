import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AppModule } from '../types/index.ts';
import { api, getStoredToken, setStoredToken, removeStoredToken } from '../services/api.ts';
import { useToast } from './ToastContext.tsx';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  quickSwitch: (userId: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; position?: string; avatar?: string }) => Promise<boolean>;
  hasPermission: (moduleKey: AppModule) => boolean;
  refreshUser: () => Promise<void>;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('nexora_theme') === 'dark';
  });

  const { success, error, info } = useToast();

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('nexora_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('nexora_theme', 'light');
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const refreshUser = useCallback(async () => {
    try {
      const currentToken = getStoredToken();
      if (!currentToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const data = await api.getMe();
      setUser(data.user);
    } catch {
      setUser(null);
      removeStoredToken();
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      error('Sua sessão expirou. Por favor, conecte-se novamente.');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [refreshUser, error]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await api.login(email, password);
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      success(`Bem-vindo de volta, ${res.user.name}!`, 'Autenticação bem-sucedida');
      return true;
    } catch (err: any) {
      error(err.message || 'Falha ao autenticar.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const quickSwitch = async (userId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await api.quickSwitch(userId);
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      info(`Sessão alternada para ${res.user.name} (${res.user.position}).`, 'Perfil Alternado');
      return true;
    } catch (err: any) {
      error(err.message || 'Falha ao alternar perfil.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      removeStoredToken();
      setToken(null);
      setUser(null);
      info('Você desconectou do sistema.', 'Sessão Finalizada');
    }
  };

  const updateProfile = async (data: { name?: string; position?: string; avatar?: string }): Promise<boolean> => {
    try {
      const res = await api.updateProfile(data);
      setUser(res.user);
      success('Foto de perfil e dados atualizados com sucesso!', 'Perfil Atualizado');
      return true;
    } catch (err: any) {
      error(err.message || 'Erro ao atualizar foto de perfil.');
      return false;
    }
  };

  const hasPermission = (moduleKey: AppModule): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions?.includes(moduleKey) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        quickSwitch,
        logout,
        updateProfile,
        hasPermission,
        refreshUser,
        isDarkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
