import React, { useState, useEffect, useContext, createContext } from 'react';
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

  useEffect(() => {
    // 1. Verifica a sessão ativa na carga inicial
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Erro ao verificar sessão inicial:", error);
        setUser(null);
      } finally {
        setLoading(false); // Garante que o loading sempre termine
      }
    };

    checkInitialSession();

    // 2. Configura um ouvinte para mudanças de estado de autenticação (login, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Erro na mudança de estado de autenticação:", error);
        setUser(null);
      }
    });

    // Limpa a inscrição ao desmontar o componente
    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
          
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