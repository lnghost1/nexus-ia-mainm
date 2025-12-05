# NexusTrade AI

Plataforma profissional de análise técnica de trading impulsionada pelo Google Gemini 2.5 Flash.

## 🚀 Deploy Rápido (Vercel)

Como a chave de API já foi configurada no código para facilitar a demonstração, você pode fazer o deploy diretamente:

1. Suba este código para o seu **GitHub**.
2. Crie uma conta na **Vercel** (vercel.com).
3. Clique em "Add New Project" e importe o repositório do GitHub.
4. Framework Preset: Deixe como **Vite**.
5. Clique em **Deploy**.

O projeto detectará automaticamente as configurações e estará online em segundos.

## 🛠️ Instalação Local

1. Instale as dependências:
```bash
npm install
```

2. Rode o servidor de desenvolvimento:
```bash
npm run dev
```

## 🔑 Configuração

A API Key do Google Gemini está configurada em `services/geminiService.ts`. 

Para produção segura no futuro, recomenda-se mover a chave para Variáveis de Ambiente na Vercel (`VITE_API_KEY`).

## 📱 Tecnologias

- **Frontend:** React 19, Vite, TailwindCSS
- **AI:** Google Gemini 2.5 Flash (`@google/genai`)
- **Routing:** React Router DOM (HashRouter)
- **Icons:** Lucide React
