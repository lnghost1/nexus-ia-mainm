# NexusTrade AI

Plataforma profissional de análise técnica de trading impulsionada pelo Google Gemini.

## 🚀 Deploy na Vercel

Este projeto está pronto para ser implantado na Vercel.

1.  **Fork e Clone**: Faça um fork deste repositório e clone-o para sua máquina local.
2.  **Suba para o GitHub**: Envie o código para o seu próprio repositório no GitHub.
3.  **Importe na Vercel**:
    *   Crie uma conta na [Vercel](https://vercel.com).
    *   Clique em "Add New... > Project" e importe o repositório do GitHub.
    *   Vercel detectará automaticamente que é um projeto Vite e aplicará as configurações corretas.
4.  **Configure as Variáveis de Ambiente**:
    *   No painel do seu projeto na Vercel, vá para **Settings > Environment Variables**.
    *   Adicione as seguintes variáveis. É crucial que os nomes sejam exatamente como estão abaixo.

| Nome                      | Valor                                       | Descrição                                     |
| ------------------------- | ------------------------------------------- | --------------------------------------------- |
| `VITE_SUPABASE_URL`       | `URLdoSeuProjetoSupabase`                   | Encontrado nas configurações de API do Supabase. |
| `VITE_SUPABASE_ANON_KEY`  | `ChaveAnônimaDoSupabase`                    | Encontrado nas configurações de API do Supabase. |
| `VITE_API_KEY`            | `SuaChaveDeAPIDoGoogleGemini`               | Necessária para a análise de IA funcionar.    |
| `VITE_LICENSE_KEY`        | `NX-NEXUS-TRADE` (ou sua chave customizada) | Chave para ativar o plano PRO na aplicação.   |

5.  **Deploy**: Clique em **Deploy**. Seu site estará online em segundos.

## 🛠️ Instalação Local

1.  **Instale as dependências**:
    ```bash
    npm install
    ```
2.  **Configure as Variáveis de Ambiente Locais**:
    *   Crie um arquivo chamado `.env.local` na raiz do projeto.
    *   Adicione as mesmas variáveis do passo de deploy:
        ```
        VITE_SUPABASE_URL="URLdoSeuProjetoSupabase"
        VITE_SUPABASE_ANON_KEY="ChaveAnônimaDoSupabase"
        VITE_API_KEY="SuaChaveDeAPIDoGoogleGemini"
        VITE_LICENSE_KEY="NX-NEXUS-TRADE"
        ```
3.  **Rode o servidor de desenvolvimento**:
    ```bash
    npm run dev
    ```

## 📱 Tecnologias

- **Frontend:** React 19, Vite, TailwindCSS
- **AI:** Google Gemini (`@google/genai`)
- **Backend & Auth:** Supabase
- **Routing:** React Router DOM
- **Icons:** Lucide React