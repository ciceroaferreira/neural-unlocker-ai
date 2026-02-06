import { useState, useCallback, useEffect } from 'react';
import { PersistedSession } from '@/types/session';
import {
  saveSession as dbSave,
  getAllSessions as dbGetAll,
  getSession as dbGet,
  deleteSession as dbDelete,
  deleteOldestSessions,
} from '@/services/persistenceService';

const MAX_SESSIONS_TO_KEEP = 20;

export function useSessionPersistence() {
  const [sessions, setSessions] = useState<PersistedSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const all = await dbGetAll();
      setSessions(all);
    } catch (e) {
      console.error('Failed to load sessions:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const saveSession = useCallback(
    async (session: PersistedSession) => {
      setSaveError(null);
      try {
        await dbSave(session);
      } catch (e: any) {
        const isQuota =
          e?.name === 'QuotaExceededError' ||
          e?.message?.includes('quota') ||
          e?.code === 22;

        if (isQuota) {
          console.warn('[Persistence] Quota exceeded, cleaning old sessions...');
          try {
            await deleteOldestSessions(MAX_SESSIONS_TO_KEEP);
            await dbSave(session);
          } catch (retryError) {
            console.error('[Persistence] Save failed after cleanup:', retryError);
            setSaveError('Armazenamento cheio. Sessões antigas foram removidas, mas o salvamento falhou.');
            throw retryError;
          }
        } else {
          console.error('[Persistence] Save failed:', e);
          setSaveError('Falha ao salvar sessão localmente.');
          throw e;
        }
      }
      await loadSessions();
    },
    [loadSessions]
  );

  const getSession = useCallback(async (id: string) => {
    return dbGet(id);
  }, []);

  const removeSession = useCallback(
    async (id: string) => {
      await dbDelete(id);
      await loadSessions();
    },
    [loadSessions]
  );

  return {
    sessions,
    loading,
    saveError,
    loadSessions,
    saveSession,
    getSession,
    removeSession,
  };
}
