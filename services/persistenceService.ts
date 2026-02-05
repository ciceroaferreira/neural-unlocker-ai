import { PersistedSession } from '@/types/session';
import { NeuralAnalysis, BlockLevel, InvestigationCategory } from '@/types/analysis';

/**
 * Migrate old analysis blocks (intensity 0-100) to new format (level 1-5)
 */
function migrateAnalysis(session: PersistedSession): PersistedSession {
  if (!session.analysis || session.analysis.length === 0) return session;

  // Check if already migrated (has `level` field)
  const first = session.analysis[0] as any;
  if (first.level != null) return session;

  const migratedBlocks: NeuralAnalysis[] = session.analysis.map((block: any) => {
    const intensity = block.intensity ?? 50;
    let level: BlockLevel;
    if (intensity > 70) level = 5;
    else if (intensity > 55) level = 4;
    else if (intensity > 35) level = 3;
    else if (intensity > 15) level = 2;
    else level = 1;

    return {
      blockName: block.blockName,
      level,
      description: block.description,
      evidence: [],
      currentPatterns: [],
      investigationCategory: 'gatilhos-atuais' as InvestigationCategory,
      actionPlan: block.recommendations || [],
      intensity: block.intensity,
      recommendations: block.recommendations,
    };
  });

  return { ...session, analysis: migratedBlocks };
}

const DB_NAME = 'neural-unlocker';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'metadata.id' });
        store.createIndex('createdAt', 'metadata.createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSession(session: PersistedSession): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(session);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllSessions(): Promise<PersistedSession[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('createdAt');
    const request = index.openCursor(null, 'prev'); // newest first
    const results: PersistedSession[] = [];

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        results.push(migrateAnalysis(cursor.value));
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getSession(id: string): Promise<PersistedSession | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result ? migrateAnalysis(request.result) : null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteSession(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
