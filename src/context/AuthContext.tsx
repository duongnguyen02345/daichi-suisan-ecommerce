import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../types';
import { mockCustomerUser, mockAdminUser } from '../data/mockData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthResult {
  success: boolean;
  message: string;
  role?: User['role'];
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  login: (role?: 'customer' | 'admin', customEmail?: string) => void;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, fullName: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  authModalMessage: string;
  openAuthModal: (message?: string) => void;
  closeAuthModal: () => void;
  requireAuth: (action: () => void, message?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapSupabaseUser = (authUser: SupabaseUser): User => {
  const role = authUser.app_metadata?.role === 'admin' ? 'admin' : 'customer';
  const displayName =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    authUser.email?.split('@')[0] ||
    'Khách hàng FreshMart';

  return {
    id: authUser.id,
    name: displayName,
    email: authUser.email || '',
    phone: authUser.phone || authUser.user_metadata?.phone || '',
    avatar: authUser.user_metadata?.avatar_url || '',
    role,
    memberTier: role === 'admin' ? 'Quản trị viên' : 'Thành viên',
    addresses: [],
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (isSupabaseConfigured) return null;
    const saved = localStorage.getItem('freshmart_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return mockCustomerUser;
      }
    }
    return mockCustomerUser;
  });
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState(
    'Đăng nhập để quản lý tài khoản, lưu ưu đãi và theo dõi đơn hàng thuận tiện hơn.'
  );

  useEffect(() => {
    if (isSupabaseConfigured) return;
    if (user) {
      localStorage.setItem('freshmart_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('freshmart_user');
    }
  }, [user]);

  useEffect(() => {
    const authClient = supabase;
    if (!authClient) return;

    let mounted = true;
    const synchronizeVerifiedUser = async () => {
      const { data, error } = await authClient.auth.getUser();
      let verifiedUser = !error ? data.user : null;

      if (verifiedUser) {
        const { data: sessionData } = await authClient.auth.getSession();
        const verifiedRole = verifiedUser.app_metadata?.role;
        const tokenRole = sessionData.session?.user.app_metadata?.role;

        if (verifiedRole !== tokenRole) {
          const { data: refreshedData, error: refreshError } = await authClient.auth.refreshSession();
          if (!refreshError && refreshedData.user) verifiedUser = refreshedData.user;
        }
      }

      if (!mounted) return;
      setUser(verifiedUser ? mapSupabaseUser(verifiedUser) : null);
      setIsLoading(false);
    };

    void synchronizeVerifiedUser();

    const { data } = authClient.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const login = (role: 'customer' | 'admin' = 'customer', customEmail?: string) => {
    if (isSupabaseConfigured) {
      setAuthModalMessage('Hệ thống đã bật xác thực thật. Vui lòng đăng nhập bằng email và mật khẩu.');
      setIsAuthModalOpen(true);
      return;
    }
    if (role === 'admin') {
      setUser(mockAdminUser);
      setIsAuthModalOpen(false);
      return;
    }
    setUser({
      ...mockCustomerUser,
      email: customEmail || mockCustomerUser.email,
    });
    setIsAuthModalOpen(false);
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) {
      login('customer', email);
      return { success: true, message: 'Đăng nhập thành công ở chế độ demo.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, message: error.message };
    if (!data.user) return { success: false, message: 'Không tìm thấy tài khoản.' };

    const { data: verifiedData } = await supabase.auth.getUser();
    const mappedUser = mapSupabaseUser(verifiedData.user || data.user);
    setUser(mappedUser);
    setIsAuthModalOpen(false);
    return { success: true, message: 'Đăng nhập thành công.', role: mappedUser.role };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
  ): Promise<AuthResult> => {
    if (!supabase) {
      login('customer', email);
      return { success: true, message: 'Đã tạo tài khoản dùng thử.' };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) return { success: false, message: error.message };
    return {
      success: true,
      message: 'Đã tạo tài khoản. Vui lòng kiểm tra email để xác nhận đăng ký.',
    };
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  };

  const openAuthModal = (message?: string) => {
    if (message) setAuthModalMessage(message);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const requireAuth = (action: () => void, message?: string): boolean => {
    if (user) {
      action();
      return true;
    } else {
      openAuthModal(message);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoading,
        isDemoMode: !isSupabaseConfigured,
        login,
        signIn,
        signUp,
        logout,
        isAuthModalOpen,
        authModalMessage,
        openAuthModal,
        closeAuthModal,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
