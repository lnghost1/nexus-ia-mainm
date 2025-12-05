import React, { useMemo } from 'react';
import { Trophy, TrendingUp, Medal } from 'lucide-react';

// Função geradora de números pseudo-aleatórios baseada em semente (data)
// Isso garante que o ranking mude todo dia, mas fique igual durante o dia todo para o mesmo usuário
const mulberry32 = (a: number) => {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

const generateDailyLeaderboard = () => {
    const today = new Date();
    // Semente baseada no dia, mês e ano
    const seed = today.getDate() + today.getMonth() * 31 + today.getFullYear() * 365;
    const rng = mulberry32(seed);

    const botNames = [
        'Carlos Trader', 'Ana Crypto', 'Marcos Fx', 'Julia Invest', 
        'Pedro Stocks', 'Sarah Win', 'Lucas B.', 'John Doe', 
        'Maria H.', 'Roberto Gold', 'Felipe Day', 'Jessica Scalp',
        'Bruno Coin', 'Fernanda FIIs', 'Ricardo Alvo'
    ];

    // Embaralhar nomes
    const shuffledNames = botNames.sort(() => rng() - 0.5).slice(0, 9);
    
    // Adicionar Andre Scheen (Dono)
    const participants = [...shuffledNames, 'Andre Scheen'];

    const leaderboardData = participants.map((name, index) => {
        // Lógica de Lucro:
        // 85% de chance de ser entre 2k e 9k
        // 15% de chance de ser um "High Roller" (10k a 14k)
        const isHighRoller = rng() > 0.85; 
        
        let profitValue;
        if (isHighRoller) {
            profitValue = 10000 + (rng() * 4500); // 10k a 14.5k
        } else {
            profitValue = 2000 + (rng() * 7500); // 2k a 9.5k
        }

        // Winrate entre 65% e 96%
        const winRate = 65 + Math.floor(rng() * 31);
        
        // Trades entre 8 e 55
        const trades = 8 + Math.floor(rng() * 47);

        return {
            id: name, // usar nome como ID temporário
            name: name,
            rawProfit: profitValue,
            profit: profitValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            winRate: `${winRate}%`,
            trades: trades,
            country: 'BR', // Maioria BR
            isOwner: name === 'Andre Scheen'
        };
    });

    // Ordenar pelo maior lucro
    return leaderboardData.sort((a, b) => b.rawProfit - a.rawProfit);
};

export const Ranking: React.FC = () => {
  const leaderboard = useMemo(() => generateDailyLeaderboard(), []);

  const top3 = leaderboard.slice(0, 3);
  const restOfList = leaderboard.slice(3);

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-8 border-b border-nexus-border pb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="text-yellow-500" />
          Ranking Diário
        </h2>
        <p className="text-nexus-muted text-sm mt-1">
            Os melhores analistas de hoje ({new Date().toLocaleDateString()}). A tabela atualiza a cada 24h.
        </p>
      </div>

      {/* TOP 3 CARDS */}
      <div className="grid md:grid-cols-3 gap-6 mb-8 items-end">
        {/* 2º Lugar */}
        <div className="order-2 md:order-1 glass-panel p-6 rounded-xl border-t-4 border-gray-400 relative overflow-hidden transform hover:-translate-y-1 transition-transform">
          <div className="absolute top-2 right-2 text-gray-400/20"><Medal size={60} /></div>
           <div className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
             2º Lugar
           </div>
           <div className="text-sm text-gray-300">
               {top3[1].name}
           </div>
           <div className="mt-4 text-xl text-nexus-primary font-mono">{top3[1].profit}</div>
        </div>

        {/* 1º Lugar */}
        <div className="order-1 md:order-2 glass-panel p-8 rounded-xl border-t-4 border-yellow-500 relative overflow-hidden transform scale-105 shadow-[0_0_30px_rgba(255,215,0,0.1)]">
          <div className="absolute top-2 right-2 text-yellow-500/20"><Medal size={80} /></div>
          <div className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
            1º Lugar
          </div>
          <div className="text-base text-gray-200">
            {top3[0].name}
          </div>
          <div className="mt-4 text-3xl text-nexus-primary font-mono font-bold neon-text-green">{top3[0].profit}</div>
        </div>

        {/* 3º Lugar */}
        <div className="order-3 glass-panel p-6 rounded-xl border-t-4 border-orange-700 relative overflow-hidden transform hover:-translate-y-1 transition-transform">
          <div className="absolute top-2 right-2 text-orange-700/20"><Medal size={60} /></div>
           <div className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
             3º Lugar
           </div>
           <div className="text-sm text-gray-300">
             {top3[2].name}
           </div>
           <div className="mt-4 text-xl text-nexus-primary font-mono">{top3[2].profit}</div>
        </div>
      </div>

      {/* TABELA COMPLETA */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-nexus-800 text-white text-xs uppercase tracking-wider">
            <tr>
              <th className="p-4 font-medium">Posição</th>
              <th className="p-4 font-medium">Trader</th>
              <th className="p-4 font-medium hidden md:table-cell">Trades</th>
              <th className="p-4 font-medium text-right">Win Rate</th>
              <th className="p-4 font-medium text-right">Lucro (Hoje)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-nexus-700">
            {leaderboard.map((trader, index) => (
              <tr 
                key={trader.id} 
                className="hover:bg-nexus-700/30 transition-colors"
              >
                <td className="p-4">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                    ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' : 
                      index === 1 ? 'bg-gray-400/20 text-gray-300' : 
                      index === 2 ? 'bg-orange-700/20 text-orange-500' : 
                      'text-nexus-muted'}
                  `}>
                    {index + 1}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-white">
                        {trader.name}
                    </div>
                  </div>
                  <div className="text-xs text-nexus-muted md:hidden">
                     {trader.trades} trades
                  </div>
                </td>
                <td className="p-4 text-gray-400 hidden md:table-cell">
                  {trader.trades}
                </td>
                <td className="p-4 text-right font-mono">
                  <div className="flex items-center justify-end gap-2">
                    <span className={parseInt(trader.winRate) > 80 ? 'text-nexus-primary' : 'text-gray-300'}>{trader.winRate}</span>
                    {parseInt(trader.winRate) > 80 && <TrendingUp size={14} className="text-nexus-primary" />}
                  </div>
                </td>
                <td className="p-4 text-right font-mono font-bold text-nexus-primary">
                  {trader.profit}
                </td>
              </tr>
            ))}
            
            {/* Linha do Usuário (Sempre visível no final para comparação) */}
            <tr className="border-t-4 border-nexus-card bg-nexus-800/50">
                <td className="p-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-nexus-muted bg-white/5">
                        -
                    </div>
                </td>
                <td className="p-4">
                    <div className="font-medium text-gray-400">Você</div>
                </td>
                <td className="p-4 text-gray-500 hidden md:table-cell">0</td>
                <td className="p-4 text-right text-gray-500 font-mono">0%</td>
                <td className="p-4 text-right font-mono text-gray-500">R$ 0,00</td>
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  );
};