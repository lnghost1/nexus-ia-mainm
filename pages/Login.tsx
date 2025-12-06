import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';

export const Login: React.FC = () => {
  const navigate = useNavigate();

  // O listener de autenticação foi removido daqui.
  // O App.tsx já gerencia o estado global e os redirecionamentos.

  return (
    <div className="min-h-screen w-full bg-[#050505] grid-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Efeitos de Fundo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-nexus-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="w-full max-w-md relative z-10">
        
        {/* Header da Logo */}
        <div className="flex justify-center mb-10">
          <Logo size={48} className="scale-110" />
        </div>

        <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-nexus-border backdrop-blur-xl">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#00E599',
                    brandAccent: '#00CC88',
                    brandButtonText: 'black',
                    defaultButtonBackground: '#0A0A0A',
                    defaultButtonBackgroundHover: '#1A1A1A',
                    defaultButtonBorder: '#1A1A1A',
                    defaultButtonText: '#EDEDED',
                    dividerBackground: '#1A1A1A',
                    inputBackground: 'transparent',
                    inputBorder: '#1A1A1A',
                    inputBorderHover: '#00E599',
                    inputBorderFocus: '#00E599',
                    inputText: '#EDEDED',
                    inputLabelText: '#666666',
                    inputPlaceholder: '#666666',
                    messageText: '#666666',
                    messageTextDanger: '#FF2950',
                  },
                  radii: {
                    borderRadiusButton: '8px',
                    buttonBorderRadius: '8px',
                    inputBorderRadius: '8px',
                  },
                },
              },
            }}
            theme="dark"
            providers={[]}
            localization={{
              variables: {
                sign_up: {
                  email_label: 'Email',
                  password_label: 'Crie uma Senha',
                  email_input_placeholder: 'seu@email.com',
                  password_input_placeholder: '••••••••',
                  button_label: 'Criar conta',
                  link_text: 'Não tem uma conta? Crie uma',
                  confirmation_text: 'Verifique seu email para o link de confirmação'
                },
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Senha',
                  email_input_placeholder: 'seu@email.com',
                  password_input_placeholder: '••••••••',
                  button_label: 'Entrar',
                  link_text: 'Já tem uma conta? Entre'
                },
                forgotten_password: {
                  email_label: 'Email',
                  email_input_placeholder: 'seu@email.com',
                  button_label: 'Enviar instruções',
                  link_text: 'Esqueceu sua senha?',
                },
              },
            }}
          />
        </div>
      </div>
      
      <div className="absolute bottom-6 text-nexus-muted/20 text-[10px] font-mono tracking-widest uppercase">
        NexusTrade AI v3.0 • Secure Connection
      </div>
    </div>
  );
};