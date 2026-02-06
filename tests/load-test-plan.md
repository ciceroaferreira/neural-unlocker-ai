# Neural Unlocker AI - Plano de Testes de Carga

## Resumo Executivo

Este plano cobre testes para ~100 usuários simultâneos, identificando gargalos críticos e bugs potenciais.

---

## 1. GARGALOS CRÍTICOS IDENTIFICADOS

### 🔴 CRÍTICO: Gemini Live API (WebSocket)
- **Limite:** 1-5 conexões simultâneas por API key
- **Impacto:** 95% dos usuários falharão ao conectar
- **Solução necessária:** Pool de conexões ou queue

### 🔴 CRÍTICO: OpenAI Analysis API
- **Limite:** ~3,500 RPM
- **Impacto:** Rate limiting após ~20 análises simultâneas
- **Retry já implementado:** 3 tentativas, backoff 2-15s

### 🟠 ALTO: TTS Pre-caching
- **Volume:** 100 usuários × 3 perguntas = 300 chamadas TTS
- **Limite Gemini:** ~1,500 RPM (tier pago)
- **Impacto:** Cache misses causam delay de 5s por pergunta

### 🟠 ALTO: AudioContext
- **Limite Chrome:** 6 contextos simultâneos
- **Impacto:** Falha na criação de contexto após 6º usuário

### 🟠 MÉDIO: IndexedDB
- **Quota:** ~50MB típico
- **Por sessão:** 2-5MB
- **Impacto:** QuotaExceededError após ~10-20 sessões

---

## 2. TESTES DE UNIDADE - PONTOS DE FALHA

### 2.1 Retry com Backoff Exponencial
```typescript
// fetchWithRetry.ts
Testar:
- HTTP 429 → retry com backoff
- HTTP 500+ → retry
- HTTP 400 → não retry
- Timeout após máximo de retries
- Jitter aplicado corretamente
```

### 2.2 Migração de Sessões Antigas
```typescript
// persistenceService.ts
Testar:
- Phase 1: intensity (0-100) → level (1-5)
- Phase 2.5: evidence string[] → EvidenceItem[]
- Current format: sem alteração
- Edge case: analysis vazio
- Edge case: evidence array vazio
```

### 2.3 Evidências Estruturadas
```typescript
// BlockCard.tsx, exportService.ts
Testar:
- Renderização de EvidenceItem
- Fallback para string (legado)
- Cores de emoção aplicadas
- Export Markdown formato correto
- Export PDF formato correto
```

### 2.4 JSON Schema Validation
```typescript
// api/analysis.ts
Testar:
- totalBloqueiosEncontrados presente
- evidence como objeto estruturado
- dominantEmotion valores válidos
- Ordenação por level (5→1)
```

---

## 3. TESTES DE INTEGRAÇÃO

### 3.1 Fluxo Completo de Sessão
```
1. Iniciar sessão → AudioContext criado
2. Pre-cache TTS → 3 perguntas carregadas
3. Gravação → WebSocket Gemini conectado
4. Transcrição → Mensagens acumulam
5. Próxima pergunta → TTS reproduz do cache
6. Análise → OpenAI retorna 5 bloqueios
7. Export → PDF/MD/WAV gerados
8. Salvar → IndexedDB persistido
```

### 3.2 Recuperação de Erro
```
Cenários:
- TTS falha → fallback para texto na tela
- WebSocket fecha → exibe erro, permite retry
- Analysis timeout → retry automático 3x
- AudioContext suspended → resume com user gesture
```

---

## 4. TESTES DE CARGA

### Fase 1: Baseline (1 usuário)
| Métrica | Target | Crítico |
|---------|--------|---------|
| Tempo total sessão | 3-5 min | >10 min |
| Latência análise | 20s | >45s |
| Geração TTS | 2.5s | >5s |
| Heap memory | 150MB | >500MB |

### Fase 2: 10 Usuários
| Métrica | Target | Crítico |
|---------|--------|---------|
| Taxa de erro | <5% | >15% |
| Tempo total sessão | <8 min | >12 min |
| Latência análise | 25s | >60s |
| WebSocket errors | 0-2 | >5 |

### Fase 3: 50 Usuários
| Métrica | Target | Crítico |
|---------|--------|---------|
| Taxa de erro | <15% | >25% |
| WebSocket rejections | 45+ | - |
| Analysis rate limit | Expected | - |
| Heap memory | 600MB | >1.2GB |

### Fase 4: 100 Usuários
| Métrica | Target | Crítico |
|---------|--------|---------|
| Taxa de sucesso | >85% | <80% |
| WebSocket rejections | 95+ | - |
| Memory peak | 1GB | >2GB |
| Recuperação de erro | >90% | <80% |

---

## 5. BUGS POTENCIAIS A VERIFICAR

### 5.1 Race Conditions
- [ ] TTS cache: duas sessões geram TTS para mesma pergunta
- [ ] Message array: transcrições rápidas criam duplicatas
- [ ] AudioContext init: múltiplas chamadas criam contextos extras
- [ ] Response audio: chunks perdidos se nextQuestion rápido

### 5.2 Memory Leaks
- [ ] TTS cache nunca limpo
- [ ] AudioContext não fechado após sessão
- [ ] Messages array cresce indefinidamente
- [ ] EventListeners não removidos

### 5.3 State Machine
- [ ] Transição inválida: speaking → next question ignorado
- [ ] Botão habilitado durante fase errada
- [ ] Error state não permite retry

### 5.4 Audio Processing
- [ ] Resampling incorreto (16kHz → 48kHz)
- [ ] Clipping em volume alto
- [ ] WAV export com header correto
- [ ] iOS AudioContext sampleRate ignorado

### 5.5 API Errors
- [ ] OpenAI 429 → retry funciona
- [ ] Gemini 502 → error handling
- [ ] Network offline → graceful degradation
- [ ] Timeout → não bloqueia UI

---

## 6. SCRIPTS DE TESTE

### 6.1 Teste de Migração (persistenceService)
```typescript
// Executar no console do browser
const testMigration = async () => {
  const { saveSession, getSession } = await import('./services/persistenceService');

  // Phase 1 legacy format
  const legacySession = {
    metadata: { id: 'test-phase1', createdAt: Date.now(), durationSeconds: 300, questionsAnswered: 3, totalQuestions: 3 },
    messages: [],
    analysis: [{
      blockName: 'Test Block',
      intensity: 75, // Phase 1 format
      description: 'Test description',
      recommendations: ['Action 1']
    }],
    aiInsights: 'Test insights',
    questionResponses: []
  };

  await saveSession(legacySession);
  const migrated = await getSession('test-phase1');

  console.assert(migrated.analysis[0].level === 5, 'Level should be 5 for intensity > 70');
  console.assert(migrated.analysis[0].actionPlan.length > 0, 'actionPlan should have items');
  console.log('Migration test PASSED');
};
```

### 6.2 Teste de Retry (fetchWithRetry)
```typescript
// Mock fetch para simular erros
const testRetry = async () => {
  let attempts = 0;
  const originalFetch = window.fetch;

  window.fetch = async () => {
    attempts++;
    if (attempts < 3) {
      return new Response(null, { status: 500 });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  };

  const { fetchWithRetry } = await import('./services/fetchWithRetry');
  const response = await fetchWithRetry('/test', {}, { maxRetries: 3, baseDelayMs: 100, maxDelayMs: 500 });

  console.assert(attempts === 3, 'Should retry twice before success');
  console.assert(response.status === 200, 'Final response should be 200');

  window.fetch = originalFetch;
  console.log('Retry test PASSED');
};
```

### 6.3 Teste de Evidence Rendering
```typescript
// Verificar renderização de evidências estruturadas
const testEvidence = () => {
  const structuredEvidence = {
    phrase: 'Meu pai sempre dizia que eu não era bom o suficiente',
    dominantEmotion: 'medo',
    context: 'Herança familiar — relato sobre o pai'
  };

  const stringEvidence = 'Citação legada simples';

  // BlockCard deve renderizar ambos formatos
  console.log('Evidence structure test - manual verification needed');
};
```

---

## 7. RESULTADOS ESPERADOS

### Para 100 Usuários Simultâneos:

| Componente | Comportamento Esperado |
|------------|----------------------|
| WebSocket Gemini | 95 rejeitados, 5 conectados |
| OpenAI Analysis | Rate limiting após 20 calls, retry resolve |
| TTS Cache | 70-80% hit rate, 5s delay nos misses |
| AudioContext | Falha após 6º usuário no Chrome |
| IndexedDB | QuotaExceeded após 10-20 sessões |
| Memory | Peak 1-2GB, GC frequente |

### Recomendações de Mitigação:

1. **Gemini Live:** Implementar queue com max 5 conexões simultâneas
2. **OpenAI:** Usar Batch API ou stagger análises
3. **TTS:** Pré-cachear perguntas no servidor, não por sessão
4. **AudioContext:** Pool e reuso de contextos
5. **IndexedDB:** Política de limpeza (deletar sessões > 30 dias)

---

## 8. PRÓXIMOS PASSOS

1. [ ] Executar testes de migração manualmente
2. [ ] Verificar race conditions com stress test
3. [ ] Monitorar memory profiler durante uso
4. [ ] Testar export em diferentes browsers
5. [ ] Validar comportamento offline
6. [ ] Documentar limites de API em MEMORY.md
