# Neural Unlocker AI - Roadmap de Evolução

> Documento de planejamento estratégico para escalar o Neural Unlocker AI do MVP validado para produto robusto de mercado.

**Data:** Fevereiro 2026
**Status atual:** MVP validado com feedback positivo dos usuários
**Stack atual:** React 19 + TypeScript + Vite + Gemini AI + Web Audio API + Vercel

---

## Visão Geral da Estratégia

```
FASE 1 (Segurança & Estabilidade)   → Semanas 1-3
FASE 2 (Arquitetura & Resiliência)  → Semanas 3-6
FASE 3 (Persistência & Usuários)    → Semanas 6-9
FASE 4 (Qualidade & Confiança)      → Semanas 9-11
FASE 5 (Inteligência & Flexibilidade) → Semanas 11-13
FASE 6 (Escala & Alcance)           → Semanas 13-16
--- marco: produto web estável ---
FASE 7 (Avaliação React Native)     → Quando houver tração comprovada
```

---

## Estado Atual - Diagnóstico do MVP

### O que funciona bem
- Conceito validado: "Método IP" com 5 perguntas estruturadas
- Pipeline de áudio completo: gravação → TTS → transcrição → análise → exportação
- Interface responsiva (mobile + desktop)
- Persistência local com IndexedDB
- Exportação em 3 formatos (PDF, Markdown, WAV)
- Deploy contínuo via Vercel

### O que precisa melhorar
- **Segurança:** API key do Gemini exposta no frontend (qualquer usuário pode copiar)
- **Estabilidade:** 3 camadas de workaround contra TTS duplicado (sintoma de estado descontrolado)
- **Resiliência:** Zero retry/fallback quando APIs falham
- **Modelos:** 4 modelos Gemini em modo `preview` (podem ser removidos sem aviso)
- **Persistência:** IndexedDB é local - dados perdidos se o usuário limpar o browser
- **Testes:** Zero testes automatizados
- **Acessibilidade:** Sem suporte a screen readers, navegação por teclado limitada

---

## FASE 1 - Segurança & Infraestrutura Base

**Objetivo:** Proteger a API key e preparar a base para funcionalidades server-side.
**Duração estimada:** ~2 semanas

### 1.1 Backend Proxy (API Routes)

| Item | Detalhe |
|------|---------|
| **O quê** | Criar Vercel Edge Functions como proxy para todas as chamadas ao Gemini |
| **Por quê** | API key exposta no frontend = risco de abuso, custos inesperados, e violação dos ToS do Google |
| **Como** | Diretório `api/` com routes: `api/tts`, `api/analyze`, `api/transcribe` |
| **Resultado** | API key fica apenas no servidor. Frontend nunca vê a chave. |

**Arquitetura proposta:**
```
ANTES:  Browser ──(API key no JS)──→ Gemini API

DEPOIS: Browser ──→ /api/tts        ──→ Gemini TTS
        Browser ──→ /api/analyze     ──→ Gemini Analysis
        Browser ←──WebSocket──→ /api/transcribe ──→ Gemini Live
```

### 1.2 Rate Limiting

| Item | Detalhe |
|------|---------|
| **O quê** | Limitar requisições por IP/sessão nas API routes |
| **Por quê** | Prevenir abuso e custos descontrolados |
| **Como** | Upstash Redis (free tier) ou rate limiting in-memory na edge |
| **Limites sugeridos** | 5 sessões/hora por IP, 50 chamadas TTS/hora |

### 1.3 Variáveis de Ambiente

| Item | Detalhe |
|------|---------|
| **O quê** | Mover `GEMINI_API_KEY` para variáveis server-side no Vercel |
| **Por quê** | Env vars com prefixo `VITE_` ficam no bundle do cliente |
| **Como** | Remover do Vite config, usar apenas em `api/` routes |

### Entregáveis da Fase 1
- [ ] API route `/api/tts` para geração de áudio
- [ ] API route `/api/analyze` para análise de bloqueios
- [ ] API route `/api/transcribe` para transcrição via WebSocket
- [ ] Rate limiting configurado
- [ ] API key removida do bundle do frontend
- [ ] Testes manuais de todas as rotas

---

## FASE 2 - Arquitetura & Resiliência

**Objetivo:** Eliminar bugs de estado e tornar o app resiliente a falhas.
**Duração estimada:** ~3 semanas

### 2.1 State Machine para Fluxo de Sessão

| Item | Detalhe |
|------|---------|
| **O quê** | Substituir os hooks soltos + refs manuais por uma state machine explícita |
| **Por quê** | Eliminar TTS duplicado, transições inconsistentes, e simplificar debug |
| **Como** | `useReducer` com estados tipados (mais leve que XState para este caso) |

**Estados propostos:**
```
IDLE
  → INITIALIZING (init AudioContext, pre-cache TTS, conectar transcrição)
    → SPEAKING_QUESTION (TTS reproduzindo a pergunta)
      → RECORDING_RESPONSE (usuário gravando resposta)
        → PROCESSING_RESPONSE (transição entre perguntas)
          → SPEAKING_QUESTION (próxima pergunta - loop)
          → ANALYZING (todas perguntas respondidas)
            → RESULTS (exibir análise)
              → EXPORT (opções de download)

Estados de erro:
  → ERROR_RECOVERABLE (retry disponível)
  → ERROR_FATAL (voltar ao início)
```

**Impacto:** Elimina as 3 camadas de workaround anti-TTS-duplicado. TTS só dispara na transição `→ SPEAKING_QUESTION`. Impossível duplicar.

### 2.2 Error Recovery

| Item | Detalhe |
|------|---------|
| **Retry com backoff** | 3 tentativas com espera exponencial (1s, 2s, 4s) para chamadas ao Gemini |
| **Fallback de TTS** | Se Gemini TTS falha, usar Web Speech API nativa como plano B |
| **Reconexão WebSocket** | Reconectar automaticamente a transcrição se a conexão cair |
| **Timeout de sessão** | Timeout de 5 minutos de inatividade com opção de retomar |
| **UI de erro** | Feedback visual claro com botão "Tentar novamente" |

### 2.3 Refatoração do SessionScreen

| Item | Detalhe |
|------|---------|
| **O quê** | Quebrar o componente de 370+ linhas em módulos menores |
| **Como** | Extrair: `SessionOrchestrator` (state machine), `SessionContext` (estado compartilhado), componentes de UI puros |
| **Resultado** | Componentes testáveis isoladamente, menos re-renders |

### Entregáveis da Fase 2
- [ ] State machine implementada com `useReducer` e tipos explícitos
- [ ] Remoção dos 3 workarounds de TTS duplicado
- [ ] Retry automático em todas as chamadas de API
- [ ] Fallback de TTS com Web Speech API
- [ ] Reconexão automática do WebSocket
- [ ] SessionScreen refatorado (< 100 linhas)
- [ ] Testes unitários dos estados e transições

---

## FASE 3 - Persistência & Gestão de Usuários

**Objetivo:** Dados seguros na nuvem e identidade de usuário.
**Duração estimada:** ~3 semanas

### 3.1 Autenticação

| Item | Detalhe |
|------|---------|
| **O quê** | Login de usuário |
| **Opções** | **Supabase Auth** (recomendado - integra com banco) ou Clerk |
| **Métodos** | Google OAuth + Email/senha |
| **Por quê** | Vincular sessões a contas, preparar para planos pagos |

### 3.2 Banco de Dados

| Item | Detalhe |
|------|---------|
| **O quê** | Migrar de IndexedDB (local) para banco na nuvem |
| **Opção recomendada** | Supabase (PostgreSQL gerenciado + Row Level Security) |
| **Schema proposto** | `users`, `sessions`, `responses`, `analyses` |
| **Migração** | Oferecer ao usuário opção de importar sessões locais para a nuvem |

**Schema simplificado:**
```sql
users
  id, email, name, created_at

sessions
  id, user_id, created_at, completed_at, duration_seconds, status

responses
  id, session_id, question_id, question_text, user_response, order_index

analyses
  id, session_id, insights_text, blocks_json, generated_at
```

### 3.3 Sincronização

| Item | Detalhe |
|------|---------|
| **Offline-first** | Manter IndexedDB como cache local, sync com Supabase quando online |
| **Conflitos** | Server wins (dados do servidor têm prioridade) |

### Entregáveis da Fase 3
- [ ] Login com Google OAuth funcionando
- [ ] Banco Supabase configurado com schema e RLS
- [ ] CRUD de sessões na nuvem
- [ ] Migração automática de sessões locais (IndexedDB → Supabase)
- [ ] Tela de perfil do usuário com histórico
- [ ] Logout e cleanup de dados locais

---

## FASE 4 - Qualidade & Confiança

**Objetivo:** Garantir que mudanças futuras não quebrem o que funciona.
**Duração estimada:** ~2 semanas

### 4.1 Testes Automatizados

| Tipo | Ferramenta | Escopo |
|------|-----------|--------|
| **Unit** | Vitest | Hooks (`useQuestionFlow`, `useAudioExport`), services (`analysisService`, `ttsService`), utils |
| **Integration** | React Testing Library | Fluxo de sessão, chat panel, export panel |
| **E2E** | Playwright | Fluxo completo: intro → sessão → análise → exportação |

**Meta de cobertura:** 70% nos hooks e services (lógica de negócio).

### 4.2 CI/CD Pipeline

```
Push/PR → Lint (ESLint) → Type Check (tsc) → Unit Tests → Build → Preview Deploy
Merge to main → Full Test Suite → Production Deploy (Vercel)
```

| Item | Ferramenta |
|------|-----------|
| **CI** | GitHub Actions |
| **Lint** | ESLint com regras TypeScript strict |
| **Format** | Prettier (consistência de código) |
| **Preview** | Vercel preview deploys por PR |

### 4.3 Monitoramento de Erros

| Item | Detalhe |
|------|---------|
| **Error tracking** | Sentry (free tier: 5k eventos/mês) |
| **O quê rastrear** | Erros de API, falhas de áudio, exceções não tratadas |
| **Alertas** | Notificação quando taxa de erro > 5% |

### Entregáveis da Fase 4
- [ ] Suite de testes unitários (Vitest)
- [ ] Testes de integração dos fluxos principais
- [ ] Pelo menos 1 teste E2E do fluxo completo
- [ ] GitHub Actions configurado (lint + test + build)
- [ ] ESLint + Prettier configurados
- [ ] Sentry integrado com source maps

---

## FASE 5 - Inteligência & Flexibilidade

**Objetivo:** Melhorar qualidade da análise e desacoplar do Gemini.
**Duração estimada:** ~2 semanas

### 5.1 Melhoria dos Prompts

| Item | Detalhe |
|------|---------|
| **Contexto estruturado** | Enviar pergunta + resposta juntas (hoje manda só respostas) |
| **Few-shot examples** | Incluir 2-3 exemplos de análises de alta qualidade no prompt |
| **Versionamento** | Cada prompt versionado (v1, v2...) para A/B testing |
| **Validação** | Checar que a análise retornada tem campos válidos (intensidade 0-100, recomendações não vazias) |

### 5.2 Abstração de Provider de IA

| Item | Detalhe |
|------|---------|
| **O quê** | Interface `AIProvider` que abstrai o provedor |
| **Por quê** | Se Gemini deprecar um modelo preview, trocar sem reescrever o app |
| **Providers** | `GeminiProvider`, futuramente `OpenAIProvider`, `AnthropicProvider` |

**Interface proposta:**
```typescript
interface AIProvider {
  generateTTS(text: string, options: TTSOptions): Promise<AudioBuffer>;
  transcribeLive(callbacks: TranscriptionCallbacks): Promise<LiveSession>;
  analyzeText(input: string, systemPrompt: string): Promise<string>;
  analyzeJSON<T>(input: string, schema: JSONSchema): Promise<T>;
}
```

### 5.3 Migração para Modelos Estáveis

| Atual (preview) | Alvo (GA) |
|-----------------|-----------|
| `gemini-2.5-flash-preview-tts` | Modelo TTS GA quando disponível |
| `gemini-2.5-flash-native-audio-preview` | Modelo Live GA quando disponível |
| `gemini-3-pro-preview` | `gemini-3-pro` (GA) |
| `gemini-3-flash-preview` | `gemini-3-flash` (GA) |

> Nota: Migrar para GA assim que o Google disponibilizar. Enquanto isso, monitorar announcements de deprecação.

### Entregáveis da Fase 5
- [ ] Prompts reestruturados com contexto e few-shot
- [ ] Sistema de versionamento de prompts
- [ ] Interface `AIProvider` implementada
- [ ] `GeminiProvider` como implementação padrão
- [ ] Modelos atualizados para GA (quando disponíveis)
- [ ] Validação de respostas da IA

---

## FASE 6 - Escala & Alcance

**Objetivo:** Preparar para mais usuários e mais dispositivos.
**Duração estimada:** ~3 semanas

### 6.1 Performance

| Item | Ação |
|------|------|
| **TTS pre-cache** | Carregar sob demanda (atual + próxima) em vez de todas as 5 de uma vez |
| **Bundle splitting** | Lazy load de `jsPDF` (~2MB), `AnalysisResults`, `ExportPanel` |
| **Visualizer adaptativo** | Reduzir partículas em dispositivos de baixa performance |
| **React.memo** | Nos componentes filhos do SessionScreen para evitar re-renders |

### 6.2 PWA (Progressive Web App)

| Item | Detalhe |
|------|---------|
| **Manifest** | Ícone, splash screen, nome do app, tema escuro |
| **Service Worker** | Cache de assets estáticos (CSS, JS, fontes) |
| **Install prompt** | "Adicionar à tela inicial" no mobile |
| **Resultado** | Experiência "app-like" sem precisar de app store |

### 6.3 Acessibilidade (WCAG 2.1 AA)

| Item | Ação |
|------|------|
| **ARIA labels** | Em todos os botões, controles e regiões |
| **Navegação por teclado** | Tab order lógico, foco visível |
| **Contraste** | Revisar fundo `#050505` + textos cinza |
| **Reduced motion** | Respeitar `prefers-reduced-motion` no visualizer |
| **Screen reader** | Anúncios de status (pergunta atual, progresso, resultado) |

### 6.4 Analytics

| Item | Ferramenta |
|------|-----------|
| **Eventos** | PostHog ou Mixpanel (funnel: início → conclusão → export) |
| **Métricas chave** | Taxa de conclusão de sessão, tempo médio, ponto de abandono |
| **API monitoring** | Tempo de resposta e taxa de falha por endpoint |

### Entregáveis da Fase 6
- [ ] Lazy loading implementado (code splitting)
- [ ] TTS carregado sob demanda
- [ ] PWA configurado (manifest + service worker + install prompt)
- [ ] Auditoria de acessibilidade passando (Lighthouse > 90)
- [ ] Analytics de funil implementado
- [ ] Performance: Lighthouse > 90 em performance

---

## FASE 7 - Avaliação React Native (Futuro)

> **Gatilho:** Iniciar esta fase quando houver evidência de tração:
> - 500+ sessões completadas/mês
> - Feedback recorrente sobre experiência mobile
> - Receita ou pipeline de monetização definido

### Quando migrar para React Native

**Sinais de que é hora:**
- Problemas de áudio mobile persistem apesar das otimizações web
- Usuários pedem "app na loja"
- Necessidade de push notifications para engajamento
- Features que exigem acesso nativo (background audio, sensores)

**O que reaproveita do web:**
- Hooks de lógica de negócio (`useQuestionFlow`, `useNeuralAnalysis`)
- Services de API (com adaptação mínima)
- Types/interfaces TypeScript (100% reutilizáveis)
- Prompts e constantes
- State machine da Fase 2

**O que precisa reescrever:**
- Toda a UI (Tailwind → React Native StyleSheet ou NativeWind)
- Camada de áudio (Web Audio API → expo-av)
- Persistência (IndexedDB → SQLite local + Supabase sync)
- Visualizer (Canvas → react-native-skia)
- Navegação (manual → React Navigation ou Expo Router)

**Stack sugerido:**
- Expo SDK (managed workflow)
- Expo Router (navegação)
- expo-av (áudio)
- react-native-skia (visualizações)
- Supabase (já implementado na Fase 3)

---

## Resumo Executivo

| Fase | Foco | Resultado para o Usuário |
|------|------|--------------------------|
| **1** | Segurança | App protegido contra abuso |
| **2** | Estabilidade | Sessões sem bugs de áudio, recovery automático |
| **3** | Contas | Login, histórico na nuvem, dados seguros |
| **4** | Qualidade | Menos bugs, deploys mais seguros |
| **5** | Inteligência | Análises melhores, independência de provedor |
| **6** | Escala | Mais rápido, acessível, instalável como app |
| **7** | Nativo | App na loja (quando justificado por tração) |

### Princípios Guia

1. **Não reescrever, evoluir** - Cada fase melhora o que existe sem parar o produto
2. **Segurança primeiro** - API key protegida antes de qualquer feature nova
3. **Iterar rápido** - Fases curtas (2-3 semanas) com entregáveis claros
4. **Decisões baseadas em dados** - Analytics antes de grandes mudanças (ex: React Native)
5. **Manter simples** - Mínima complexidade necessária para cada fase

---

*Documento vivo - atualizar conforme as fases forem concluídas.*
