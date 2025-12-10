import React, { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Learning } from './pages/Learning';
import { Ranking } from './pages/Ranking';
import { Community } from './pages/Community';
import { Checkout } from './pages/Checkout';
import { Layout } from './components/Layout';
import { User } from './types';
import { authService } from './services/authService';
import { supabase } from './lib/supabase';

// Auth Context
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refetchUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      setUser(null);
    }
  }, []);

  // Efeito para a verificação inicial da sessão.
  // Roda apenas uma vez quando o app é montado.
  useEffect(() => {
    const checkInitialSession = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Erro na verificação inicial de sessão:", error);
        setUser(null);
      } finally {
        // Garante que a tela de loading seja removida,
        // independentemente do resultado da verificação.
        setLoading(false);
      }
    };

    checkInitialSession();
  }, []); // O array vazio garante que isso rode apenas uma vez.

  // Efeito para ouvir mudanças no estado de autenticação (login, logout).
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Se o estado mudou (ex: usuário fez login em outra aba),
      // atualizamos o estado do usuário.
      if (session) {
        refetchUser();
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refetchUser]);

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-[#00E599]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E599] mb-4"></div>
        <div className="text-sm font-mono tracking-widest uppercase animate-pulse">Carregando NexusTrade...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, logout, refetchUser }}>
      <BrowserRouter>
        <Routes>
          <Route 
            path="/" 
            element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
          />
          
          <Route 
            path="/login" 
            element={!user ? <Login /> : <Navigate to="/dashboard" replace />} 
          />

          {/* Rotas Protegidas */}
          <Route 
            path="/dashboard" 
            element={
              user ? (
                <Layout>
                  <Dashboard />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
           <Route 
            path="/checkout" 
            element={
              user ? (
                <Checkout />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/learning" 
            element={
              user ? (
                <Layout>
                  <Learning />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/ranking" 
            element={
              user ? (
                <Layout>
                  <Ranking />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/community" 
            element={
              user ? (
                <Layout>
                  <Community />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

export default App;