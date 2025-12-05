import React from 'react';
import { Users, MessageCircle, Star, ShieldCheck, Globe } from 'lucide-react';

export const Community: React.FC = () => {
  const testimonials = [
    { id: 1, name: "Roberto S.", role: "Pro Trader", stars: 5, text: "A plataforma acertou 4 das 5 análises que mandei hoje. O lucro pagou o mês inteiro!" },
    { id: 2, name: "Amanda K.", role: "Iniciante", stars: 5, text: "Melhor comunidade. O suporte no WhatsApp é muito rápido e as dicas da IA ajudam a filtrar entradas ruins." },
    { id: 3, name: "Felipe M.", role: "Crypto Expert", stars: 4, text: "A análise de tendência é muito precisa. Uso como confluência para minhas operações de Bitcoin." },
    { id: 4, name: "Jessica L.", role: "Forex Trader", stars: 5, text: "Simplesmente sensacional. A interface é linda e as análises batem muito com meu setup." },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-8 border-b border-nexus-border pb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="text-nexus-primary" />
          Comunidade Oficial
        </h2>
        <p className="text-nexus-muted text-sm mt-1">Junte-se a uma comunidade de traders que lucram todos os dias.</p>
      </div>

      <div className="grid grid-cols-1 md:max-w-lg mx-auto gap-8 mb-12">
        {/* WhatsApp Card */}
        <div className="glass-panel p-8 rounded-2xl border border-green-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-green-500/20 transition-colors"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 bg-[#25D366]/20 rounded-xl flex items-center justify-center text-[#25D366] mb-6">
              <MessageCircle size={32} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Grupo VIP no WhatsApp</h3>
            <p className="text-nexus-muted mb-6 leading-relaxed">
              Receba notificações de análises em tempo real, tire dúvidas com nossos especialistas e compartilhe seus resultados com outros membros.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <ShieldCheck size={16} className="text-nexus-primary" /> Sem spam, apenas conteúdo.
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <Globe size={16} className="text-nexus-primary" /> Networking com traders do mundo todo.
              </li>
            </ul>
            <a 
               href="https://chat.whatsapp.com/DLZIlVw0jkr0g52rn2FoWH?mode=hqrt3" 
               target="_blank" 
               rel="noopener noreferrer"
               className="w-full bg-[#25D366] hover:bg-[#20BD5C] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/20"
             >
               <MessageCircle size={20} />
               Entrar no Grupo Agora
             </a>
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-6">O que dizem os membros</h3>
      <div className="grid md:grid-cols-2 gap-6">
        {testimonials.map((item) => (
          <div key={item.id} className="glass-panel p-6 rounded-xl border border-nexus-border/50 hover:border-nexus-primary/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-nexus-700 flex items-center justify-center font-bold text-nexus-primary">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{item.name}</div>
                  <div className="text-xs text-nexus-muted">{item.role}</div>
                </div>
              </div>
              <div className="flex text-yellow-500">
                {[...Array(item.stars)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
            </div>
            <p className="text-gray-300 text-sm italic">"{item.text}"</p>
          </div>
        ))}
      </div>
    </div>
  );
};