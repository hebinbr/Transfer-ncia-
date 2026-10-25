/**
 * IndexedDB Local Cache Manager
 * Provides offline persistence for transfer history and recently received files/packages.
 * Allows viewing records, previews, and saving files even without server connectivity.
 */

import { SharedFileItem, SharedPackageItem, TransferHistoryItem } from '../types';

const DB_NAME = 'airshare_indexeddb_cache';
const DB_VERSION = 1;

const STORE_HISTORY = 'history';
const STORE_FILES = 'files';
const STORE_BLOBS = 'blobs';
const STORE_PACKAGES = 'packages';

export interface CachedBlobRecord {
  id: string;
  blob: Blob;
  filename: string;
  mimetype: string;
  size: number;
  updatedAt: number;
}

export function isIndexedDBSupported(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (!isIndexedDBSupported()) {
    return Promise.reject(new Error('IndexedDB is not supported in this browser'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        const historyStore = db.createObjectStore(STORE_HISTORY, { keyPath: 'id' });
        historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        historyStore.createIndex('direction', 'direction', { unique: false });
        historyStore.createIndex('status', 'status', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_FILES)) {
        const filesStore = db.createObjectStore(STORE_FILES, { keyPath: 'id' });
        filesStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        const blobsStore = db.createObjectStore(STORE_BLOBS, { keyPath: 'id' });
        blobsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_PACKAGES)) {
        const pkgStore = db.createObjectStore(STORE_PACKAGES, { keyPath: 'id' });
        pkgStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });

  return dbPromise;
}

/* =========================================================================
   Transfer History Operations
   ========================================================================= */

export async function saveHistoryToIndexedDB(items: TransferHistoryItem[]): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_HISTORY, 'readwrite');
    const store = tx.objectStore(STORE_HISTORY);

    items.forEach(item => {
      store.put(item);
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB saveHistory error:', err);
  }
}

export async function getHistoryFromIndexedDB(): Promise<TransferHistoryItem[]> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_HISTORY, 'readonly');
    const store = tx.objectStore(STORE_HISTORY);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const results = (request.result as TransferHistoryItem[]) || [];
        // Sort descending by timestamp
        results.sort((a, b) => b.timestamp - a.timestamp);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB getHistory error:', err);
    return [];
  }
}

export async function saveHistoryItemToIndexedDB(item: TransferHistoryItem): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_HISTORY, 'readwrite');
    const store = tx.objectStore(STORE_HISTORY);
    store.put(item);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB saveHistoryItem error:', err);
  }
}

export async function removeHistoryItemFromIndexedDB(id: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_HISTORY, 'readwrite');
    const store = tx.objectStore(STORE_HISTORY);
    store.delete(id);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB removeHistoryItem error:', err);
  }
}

export async function clearHistoryInIndexedDB(): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_HISTORY, 'readwrite');
    const store = tx.objectStore(STORE_HISTORY);
    store.clear();

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB clearHistory error:', err);
  }
}

/* =========================================================================
   Cached Files & Blob Operations
   ========================================================================= */

export async function cacheFileMetadata(file: SharedFileItem): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_FILES, 'readwrite');
    const store = tx.objectStore(STORE_FILES);
    store.put(file);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB cacheFileMetadata error:', err);
  }
}

export async function cacheFileBlob(
  fileId: string,
  blob: Blob,
  metadata?: { filename: string; mimetype: string; size: number }
): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_BLOBS, 'readwrite');
    const store = tx.objectStore(STORE_BLOBS);

    const record: CachedBlobRecord = {
      id: fileId,
      blob,
      filename: metadata?.filename || 'arquivo',
      mimetype: metadata?.mimetype || blob.type || 'application/octet-stream',
      size: metadata?.size || blob.size,
      updatedAt: Date.now(),
    };

    store.put(record);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB cacheFileBlob error:', err);
  }
}

export async function getCachedFileBlob(fileId: string): Promise<Blob | null> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_BLOBS, 'readonly');
    const store = tx.objectStore(STORE_BLOBS);
    const request = store.get(fileId);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const record = request.result as CachedBlobRecord | undefined;
        resolve(record ? record.blob : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB getCachedFileBlob error:', err);
    return null;
  }
}

export async function getCachedFiles(): Promise<SharedFileItem[]> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_FILES, 'readonly');
    const store = tx.objectStore(STORE_FILES);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const items = (request.result as SharedFileItem[]) || [];
        items.sort((a, b) => b.createdAt - a.createdAt);
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB getCachedFiles error:', err);
    return [];
  }
}

export async function removeCachedFile(fileId: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction([STORE_FILES, STORE_BLOBS], 'readwrite');
    tx.objectStore(STORE_FILES).delete(fileId);
    tx.objectStore(STORE_BLOBS).delete(fileId);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB removeCachedFile error:', err);
  }
}

/* =========================================================================
   Cached Packages Operations
   ========================================================================= */

export async function cachePackage(pkg: SharedPackageItem, zipBlob?: Blob): Promise<void> {
  try {
    const db = await getDB();
    const storesToOpen = zipBlob ? [STORE_PACKAGES, STORE_BLOBS] : [STORE_PACKAGES];
    const tx = db.transaction(storesToOpen, 'readwrite');
    tx.objectStore(STORE_PACKAGES).put(pkg);

    if (zipBlob) {
      const record: CachedBlobRecord = {
        id: `pkg_zip_${pkg.id}`,
        blob: zipBlob,
        filename: `${pkg.name}.zip`,
        mimetype: 'application/zip',
        size: zipBlob.size,
        updatedAt: Date.now(),
      };
      tx.objectStore(STORE_BLOBS).put(record);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB cachePackage error:', err);
  }
}

export async function getCachedPackages(): Promise<SharedPackageItem[]> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_PACKAGES, 'readonly');
    const store = tx.objectStore(STORE_PACKAGES);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const items = (request.result as SharedPackageItem[]) || [];
        items.sort((a, b) => b.createdAt - a.createdAt);
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB getCachedPackages error:', err);
    return [];
  }
}

export async function getCachedPackageZip(packageId: string): Promise<Blob | null> {
  return getCachedFileBlob(`pkg_zip_${packageId}`);
}

export async function removeCachedPackage(packageId: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction([STORE_PACKAGES, STORE_BLOBS], 'readwrite');
    tx.objectStore(STORE_PACKAGES).delete(packageId);
    tx.objectStore(STORE_BLOBS).delete(`pkg_zip_${packageId}`);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB removeCachedPackage error:', err);
  }
}

/* =========================================================================
   Storage Stats & Background Fetch Helper
   ========================================================================= */

export async function getCacheStorageSummary(): Promise<{
  historyCount: number;
  filesCount: number;
  blobsCount: number;
  totalEstimatedBytes: number;
}> {
  try {
    const db = await getDB();
    const tx = db.transaction([STORE_HISTORY, STORE_FILES, STORE_BLOBS], 'readonly');

    const historyReq = tx.objectStore(STORE_HISTORY).count();
    const filesReq = tx.objectStore(STORE_FILES).count();
    const blobsReq = tx.objectStore(STORE_BLOBS).getAll();

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        const blobs = (blobsReq.result as CachedBlobRecord[]) || [];
        const totalEstimatedBytes = blobs.reduce((sum, b) => sum + (b.size || 0), 0);
        resolve({
          historyCount: historyReq.result || 0,
          filesCount: filesReq.result || 0,
          blobsCount: blobs.length,
          totalEstimatedBytes,
        });
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    return { historyCount: 0, filesCount: 0, blobsCount: 0, totalEstimatedBytes: 0 };
  }
}

/**
 * Downloads and caches a file in IndexedDB in the background
 * without blocking UI thread.
 */
export async function autoCacheReceivedFile(file: SharedFileItem): Promise<void> {
  try {
    await cacheFileMetadata(file);

    // If file is reasonably sized (e.g. <= 150MB), fetch and cache blob in IndexedDB for offline access
    if (file.size <= 150 * 1024 * 1024) {
      const existing = await getCachedFileBlob(file.id);
      if (!existing) {
        const res = await fetch(`/api/download/${file.id}`);
        if (res.ok) {
          const blob = await res.blob();
          await cacheFileBlob(file.id, blob, {
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size,
          });
        }
      }
    }
  } catch (e) {
    // Non-blocking background caching error
    console.debug('Background cache error for file:', file.filename, e);
  }
}
