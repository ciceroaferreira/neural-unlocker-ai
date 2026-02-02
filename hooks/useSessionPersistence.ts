import { useState, useCallback, useEffect } from 'react';
import { PersistedSession } from '@/types/session';
import {
  saveSession as dbSave,
  getAllSessions as dbGetAll,
  getSession as dbGet,
  deleteSession as dbDelete,
} from '@/services/persistenceService';

export function useSessionPersistence() {
  const [sessions, setSessions] = useState<PersistedSession[]>([]);
  const [loading, setLoading] = useState(false);

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
      await dbSave(session);
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
    loadSessions,
    saveSession,
    getSession,
    removeSession,
  };
}
