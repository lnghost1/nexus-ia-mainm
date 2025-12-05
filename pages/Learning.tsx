import React from 'react';
import { Play, BookOpen, Lock } from 'lucide-react';

export const Learning: React.FC = () => {
  const tutorials = [
    {
      id: 1,
      title: "Introdução ao NexusTrade",
      duration: "05:20",
      level: "Iniciante",
      image: "https://images.unsplash.com/photo-1611974765270-ca12586343bb?w=500&auto=format&fit=crop&q=60",
      locked: false
    },
    {
      id: 2,
      title: "Como identificar Suporte e Resistência",
      duration: "12:45",
      level: "Iniciante",
      image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=500&auto=format&fit=crop&q=60",
      locked: false
    },
    {
      id: 3,
      title: "Padrões de Candlestick e Gatilhos",
      duration: "18:10",
      level: "Intermediário",
      image: "https://images.unsplash.com/photo-1535320903710-d9cf11df87b6?w=500&auto=format&fit=crop&q=60",
      locked: false
    },
    {
      id: 4,
      title: "Gerenciamento de Risco Profissional",
      duration: "25:00",
      level: "Avançado",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=60",
      locked: true
    },
    {
      id: 5,
      title: "Psicologia do Trader",
      duration: "15:30",
      level: "Todos",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=60",
      locked: true
    }
  ];

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-8 border-b border-nexus-border pb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen className="text-nexus-primary" />
          Área de Aprendizado
        </h2>
        <p className="text-nexus-muted text-sm mt-1">Domine a plataforma e melhore seus resultados.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutorials.map((video) => (
          <div key={video.id} className="glass-panel rounded-xl overflow-hidden group hover:border-nexus-primary/40 transition-all cursor-pointer">
            <div className="h-40 relative overflow-hidden">
              <img 
                src={video.image} 
                alt={video.title} 
                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${video.locked ? 'grayscale opacity-40' : ''}`} 
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {video.locked ? (
                  <Lock className="text-gray-400" size={32} />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-nexus-primary/90 flex items-center justify-center text-black">
                    <Play size={20} fill="currentColor" className="ml-1" />
                  </div>
                )}
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 text-xs px-2 py-1 rounded text-white font-mono">
                {video.duration}
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  video.level === 'Iniciante' ? 'bg-green-900/50 text-green-400' :
                  video.level === 'Intermediário' ? 'bg-yellow-900/50 text-yellow-400' :
                  'bg-red-900/50 text-red-400'
                }`}>
                  {video.level}
                </span>
                {video.locked && <Lock size={14} className="text-gray-500" />}
              </div>
              
              <h3 className={`font-medium leading-tight mb-2 ${video.locked ? 'text-gray-500' : 'text-gray-100 group-hover:text-nexus-primary transition-colors'}`}>
                {video.title}
              </h3>
              
              <p className="text-xs text-nexus-muted">
                {video.locked ? 'Disponível no plano Master' : 'Assista agora para melhorar suas skills.'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};