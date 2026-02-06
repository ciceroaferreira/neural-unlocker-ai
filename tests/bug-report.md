# Neural Unlocker AI - Relatório de Bugs e Vulnerabilidades

Data: 2026-02-06
Versão: commit 18a82c9

---

## RESUMO EXECUTIVO

Foram identificados **12 bugs potenciais** e **5 gargalos críticos** que impactarão performance com 100 usuários simultâneos.

| Severidade | Quantidade |
|------------|------------|
| 🔴 Crítico | 3 |
| 🟠 Alto | 5 |
| 🟡 Médio | 4 |

---

## 🔴 BUGS CRÍTICOS

### BUG-001: Race Condition no AudioContext Init
**Arquivo:** `services/audioContextManager.ts:25-31`
**Código problemático:**
```typescript
export async function initAudioContext(): Promise<AudioContext> {
  if (!sharedContext) {
    sharedContext = new AudioContext(); // ← RACE: duas chamadas simultâneas criam dois contextos
  }
  // ...
}
```
**Problema:** Sem lock, duas chamadas simultâneas podem ambas passar o check `!sharedContext` antes de atribuir, criando dois AudioContexts.

**Impacto:** Vazamento de memória, comportamento imprevisível de áudio.

**Reprodução:**
1. Abrir app em 2 abas simultaneamente
2. Clicar "Iniciar" em ambas no mesmo momento

**Correção sugerida:** Usar Promise-based initialization guard:
```typescript
let initPromise: Promise<AudioContext> | null = null;

export async function initAudioContext(): Promise<AudioContext> {
  if (!initPromise) {
    initPromise = (async () => {
      if (!sharedContext) {
        sharedContext = new AudioContext();
      }
      return sharedContext;
    })();
  }
  return initPromise;
}
```

---

### BUG-002: Limite de Conexões WebSocket Gemini Live
**Arquivo:** `services/transcriptionService.ts`
**Problema:** Gemini Live API permite apenas 1-5 conexões simultâneas por API key.

**Impacto:** Com 100 usuários, 95+ recebem erro de conexão.

**Comportamento atual:**
- Erro silencioso → `onError('Live Scan')` → tela de erro
- Sem queue, sem retry automático
- Usuário deve clicar "Retry" manualmente

**Correção sugerida:**
1. Implementar connection pool com max 5 slots
2. Queue de sessões aguardando slot
3. Feedback visual "X usuários na fila"

---

### BUG-003: TTS Cache Sem Deduplicação
**Arquivo:** `hooks/useSessionMachine.ts:58-76`
**Código problemático:**
```typescript
MANDATORY_QUESTIONS.forEach((q, index) => {
  generateTTSAudio(q.text, QUESTION_PROSODY)  // ← Chamadas paralelas sem lock
    .then((result) => {
      ttsCacheRef.current.set(q.id, result);  // ← Última ganha, anteriores desperdiçadas
    })
```
**Problema:** Se duas sessões iniciarem ao mesmo tempo, ambas geram TTS para as mesmas 3 perguntas → 6 chamadas à API em vez de 3.

**Impacto:** Custo dobrado, rate limit atingido mais rápido.

**Correção sugerida:** Cache global no nível de serviço, não por sessão.

---

## 🟠 BUGS DE ALTA SEVERIDADE

### BUG-004: Memory Leak - TTS Cache Nunca Limpo
**Arquivo:** `hooks/useSessionMachine.ts:48`
```typescript
const ttsCacheRef = useRef<Map<string, TTSResult>>(new Map());
```
**Problema:** Cache armazena AudioBuffers (~5-10MB cada), nunca liberados.

**Impacto:** Após 10 sessões sem refresh, heap pode atingir 500MB+.

**Correção sugerida:** Limpar cache em `handleAbort` e `handleNewSession`.

---

### BUG-005: Messages Array Crescimento Ilimitado
**Arquivo:** `hooks/useGeminiSession.ts:13-22`
**Problema:** Cada chunk de transcrição adiciona/atualiza array de mensagens.

**Cálculo:** 30 min sessão × 4 updates/sec = 7.200 operações no array.

**Impacto:**
- Garbage collection frequente
- Re-renders desnecessários
- Memória: ~500KB-1MB por sessão

**Correção sugerida:** Usar string acumuladora para transcrição em andamento, só adicionar ao array quando finalizada.

---

### BUG-006: AudioContext do Recording Não Fechado
**Arquivo:** `hooks/useAudioRecording.ts:32-51`
**Código:**
```typescript
const cleanup = useCallback(() => {
  // ...
  if (inputAudioCtxRef.current) {
    if (inputAudioCtxRef.current.state !== 'closed') {
      inputAudioCtxRef.current.close().catch(() => {});  // ← catch silencioso
    }
```
**Problema:** Se `close()` falhar, o contexto permanece aberto.

**Impacto:** Chrome permite apenas 6 AudioContexts → após 6 sessões sem refresh, novas gravações falham.

**Correção sugerida:** Retry no close ou forçar via `sharedContext = null`.

---

### BUG-007: Transição Speaking → Next Question Ignorada
**Arquivo:** `hooks/sessionMachineReducer.ts:64-74`
```typescript
case 'speaking': {
  if (action.type === 'TTS_ENDED') {
    return { ...state, phase: 'recording' };
  }
  // ← NEXT_QUESTION ignorado durante speaking
  break;
}
```
**Problema:** Se usuário clicar "Próxima" enquanto TTS toca, ação é ignorada sem feedback.

**Impacto:** Usuário acha que botão não funciona.

**Correção sugerida:**
1. Desabilitar botão durante `speaking` phase
2. OU: parar TTS e processar next question

---

### BUG-008: IndexedDB Quota Exceeded Silencioso
**Arquivo:** `services/persistenceService.ts:60-68`
```typescript
export async function saveSession(session: PersistedSession): Promise<void> {
  // ...
  tx.onerror = () => reject(tx.error);  // ← Rejeita mas quem trata?
}
```
**Problema:** Se quota excedida (~50MB), erro é lançado mas não há tratamento no caller.

**Impacto:** Sessões não salvam, usuário não sabe.

**Correção sugerida:**
1. Catch no caller e exibir toast de aviso
2. Implementar cleanup de sessões antigas (>30 dias)

---

## 🟡 BUGS DE MÉDIA SEVERIDADE

### BUG-009: Jitter Insuficiente no Retry
**Arquivo:** `services/fetchWithRetry.ts:17-22`
```typescript
function getDelay(attempt: number, base: number, max: number): number {
  const exponential = base * Math.pow(2, attempt);
  const capped = Math.min(exponential, max);
  return capped * (0.5 + Math.random() * 0.5);  // ← 50-100% do delay
}
```
**Problema:** Com 100 usuários em retry simultâneo, 50% de jitter ainda causa "thundering herd".

**Impacto:** Rate limit da API atingido mais rápido durante recuperação.

**Correção sugerida:** Full jitter (0-100%) conforme AWS recomendação.

---

### BUG-010: ScriptProcessorNode Deprecado
**Arquivo:** `hooks/useAudioRecording.ts:67`
```typescript
const scriptNode = inputCtx.createScriptProcessor(AUDIO_CONFIG.BUFFER_SIZE, 1, 1);
```
**Problema:** `ScriptProcessorNode` está deprecado, deve usar `AudioWorklet`.

**Impacto:**
- Performance inferior (roda na main thread)
- Pode ser removido em futuras versões do Chrome

**Correção sugerida:** Migrar para AudioWorklet (Phase 4+).

---

### BUG-011: Error Callback em onClose WebSocket
**Arquivo:** `services/transcriptionService.ts`
**Problema:** Se WebSocket fecha inesperadamente (timeout, network), apenas `onClose` é chamado, não `onError`.

**Impacto:** Usuário vê "desconectado" mas não há retry automático nem mensagem de erro clara.

**Correção sugerida:** Tratar `onClose` inesperado como erro e tentar reconectar.

---

### BUG-012: Export WAV Sem Validação de Dados
**Arquivo:** `hooks/useAudioExport.ts`
**Problema:** Se `getSegments()` retornar array vazio, WAV é gerado com 44 bytes (header only).

**Impacto:** Download de arquivo inválido/vazio.

**Correção sugerida:** Verificar se há dados antes de gerar, exibir warning se vazio.

---

## GARGALOS DE PERFORMANCE

### PERF-001: OpenAI Rate Limit
- **Limite:** ~3,500 RPM para gpt-4o
- **Load 100 users:** 100 análises em 30s = 200 RPM
- **Status:** OK se staggered, CRÍTICO se simultâneo

### PERF-002: Gemini Live Connections
- **Limite:** 1-5 simultâneas
- **Load 100 users:** 95+ falhas imediatas
- **Status:** 🔴 CRÍTICO - precisa queue

### PERF-003: TTS Pre-caching
- **Limite:** ~1,500 RPM
- **Load 100 users:** 300 chamadas em 5s
- **Status:** 🟠 ALTO - cache hit resolve

### PERF-004: Browser Memory
- **Limite:** ~500MB heap (weak devices)
- **Per session:** ~50-100MB
- **Status:** 🟠 ALTO com multiple tabs

### PERF-005: IndexedDB Quota
- **Limite:** ~50MB
- **Per session:** ~2-5MB
- **Status:** 🟡 MÉDIO - após 10-20 sessões

---

## RECOMENDAÇÕES PRIORITÁRIAS

### Imediato (antes do próximo deploy):
1. ✅ Adicionar lock ao `initAudioContext()` (BUG-001)
2. ✅ Limpar TTS cache on session end (BUG-004)
3. ✅ Desabilitar "Próxima" durante speaking (BUG-007)

### Curto prazo (1-2 semanas):
4. Implementar connection queue para Gemini Live (BUG-002)
5. Global TTS cache com deduplicação (BUG-003)
6. IndexedDB cleanup policy (BUG-008)

### Médio prazo (Phase 4+):
7. Migrar para AudioWorklet (BUG-010)
8. WebSocket auto-reconnect (BUG-011)
9. Batch API para análise (PERF-001)

---

## TESTES RECOMENDADOS

### Smoke Test (5 min):
```
1. Iniciar sessão
2. Responder 3 perguntas (10s cada)
3. Gerar análise
4. Download PDF/MD/WAV
5. Verificar sessão salva
```

### Stress Test (30 min):
```
1. Abrir 5 abas simultâneas
2. Iniciar todas ao mesmo tempo
3. Verificar: quantas conectam, erros, memória
4. Completar 1 sessão, verificar exports
```

### Memory Leak Test:
```
1. Chrome DevTools > Memory
2. Snapshot inicial
3. Completar sessão
4. Nova sessão (sem refresh)
5. Snapshot final
6. Comparar: crescimento > 50MB = leak
```
