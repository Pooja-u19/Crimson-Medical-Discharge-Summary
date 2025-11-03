// IndexedDB utility for local data persistence
const DB_NAME = import.meta.env.VITE_INDEXEDDB_NAME || 'dvs';
const DB_VERSION = parseInt(import.meta.env.VITE_INDEXEDDB_VERSION || '1');
const STORE_NAME = import.meta.env.VITE_INDEXEDDB_STORE_NAME || 'requests';

export interface StoredRequest {
  requestId: string;
  fileName: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  summary?: string;
  ocrText?: string;
  pages?: string[];
  documentS3Path?: string;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private async ensureConnection(): Promise<IDBDatabase> {
    if (this.db && this.db.version === DB_VERSION) {
      return this.db;
    }
    
    if (!this.initPromise) {
      this.initPromise = this.init();
    }
    
    await this.initPromise;
    return this.db!;
  }

  private async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        this.initPromise = null;
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        this.db.onclose = () => {
          this.db = null;
          this.initPromise = null;
        };
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'requestId' });
          objectStore.createIndex('status', 'status', { unique: false });
          objectStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  async saveRequest(data: StoredRequest): Promise<void> {
    try {
      const db = await this.ensureConnection();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(data);

        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(new Error('Transaction aborted'));
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn('IndexedDB save failed, continuing without local storage:', error);
      // Don't throw error to prevent upload failure
    }
  }

  async getRequest(requestId: string): Promise<StoredRequest | undefined> {
    try {
      const db = await this.ensureConnection();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(requestId);

        transaction.onerror = () => reject(transaction.error);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    } catch (error) {
      console.warn('IndexedDB get failed:', error);
      return undefined;
    }
  }

  async getAllRequests(): Promise<StoredRequest[]> {
    try {
      const db = await this.ensureConnection();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        transaction.onerror = () => reject(transaction.error);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    } catch (error) {
      console.warn('IndexedDB getAll failed:', error);
      return [];
    }
  }

  async deleteRequest(requestId: string): Promise<void> {
    try {
      const db = await this.ensureConnection();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(requestId);

        transaction.onerror = () => reject(transaction.error);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn('IndexedDB delete failed:', error);
    }
  }
}

export const indexedDBManager = new IndexedDBManager();
