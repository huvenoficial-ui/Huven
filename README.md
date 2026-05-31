# HUVEN — Sistema Viral

Plataforma de inteligência de conteúdo para criadores brasileiros.

## Setup em 5 passos

### 1. Banco de dados (Supabase)
- Acesse supabase.com → seu projeto `huven-viral`
- Vá em **SQL Editor** → **New query**
- Cole o conteúdo de `supabase-schema.sql` e clique em **Run**

### 2. Configure as variáveis de ambiente
No arquivo `.env.local`, substitua `COLE_SUA_CHAVE_AQUI` pela sua API Key da Anthropic:
```
ANTHROPIC_API_KEY=sk-ant-...sua-chave-aqui...
```

### 3. Suba para o GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/huven-viral.git
git push -u origin main
```

### 4. Deploy no Vercel
- Acesse vercel.com → **Add New Project**
- Importe o repositório `huven-viral`
- Em **Environment Variables**, adicione:
  - `NEXT_PUBLIC_SUPABASE_URL` = https://vsdkjhafqvwfnqgsbnyz.supabase.co
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = eyJhbGci... (anon key)
  - `SUPABASE_SERVICE_ROLE_KEY` = eyJhbGci... (service role key)
  - `ANTHROPIC_API_KEY` = sk-ant-... (sua chave)
- Clique em **Deploy**

### 5. Acesse a plataforma
O Vercel vai gerar um link tipo `https://huven-viral.vercel.app`

## Funcionalidades
- **Dashboard** — métricas, padrões virais, próximo post recomendado
- **Vídeos** — upload de MP4, análise de frames com IA, aprendizado de padrões
- **Comentários** — Kanban automático: lead quente / objeção / engajamento / ignorar
- **Gerador** — headlines + roteiro + A/B + legenda calibrados com seus padrões reais
- **Concorrentes** — mapeamento de temas e gaps de oportunidade
- **Crescimento** — gráfico de seguidores, top vídeos, projeções, comparativo

## Stack
- Next.js 14 + TypeScript
- Supabase (banco de dados)
- Anthropic Claude (IA)
- Recharts (gráficos)
- Vercel (hospedagem)
