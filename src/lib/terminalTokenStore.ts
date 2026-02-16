const IDB_DB_NAME = "flash_pos"
const IDB_STORE_NAME = "kv"
const IDB_KEY = "terminal_token"

const LS_KEY = "flash_terminal_token"

function hasIndexedDb(): boolean {
  return typeof indexedDB !== "undefined"
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB_NAME, 1)
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"))
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) db.createObjectStore(IDB_STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
  })
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openDb()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, "readonly")
      const store = tx.objectStore(IDB_STORE_NAME)
      const req = store.get(key)
      req.onerror = () => reject(req.error ?? new Error("IndexedDB get failed"))
      req.onsuccess = () => {
        const v = req.result
        resolve(typeof v === "string" ? v : v == null ? null : String(v))
      }
    })
  } finally {
    db.close()
  }
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, "readwrite")
      const store = tx.objectStore(IDB_STORE_NAME)
      const req = store.put(value, key)
      req.onerror = () => reject(req.error ?? new Error("IndexedDB put failed"))
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB tx failed"))
      tx.onabort = () => reject(tx.error ?? new Error("IndexedDB tx aborted"))
    })
  } finally {
    db.close()
  }
}

async function idbDel(key: string): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, "readwrite")
      const store = tx.objectStore(IDB_STORE_NAME)
      const req = store.delete(key)
      req.onerror = () => reject(req.error ?? new Error("IndexedDB delete failed"))
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB tx failed"))
      tx.onabort = () => reject(tx.error ?? new Error("IndexedDB tx aborted"))
    })
  } finally {
    db.close()
  }
}

function lsGet(): string | null {
  try {
    const v = localStorage.getItem(LS_KEY)
    return v && v.trim() ? v : null
  } catch {
    return null
  }
}

function lsSet(token: string): void {
  try {
    localStorage.setItem(LS_KEY, token)
  } catch {
    // ignore
  }
}

function lsDel(): void {
  try {
    localStorage.removeItem(LS_KEY)
  } catch {
    // ignore
  }
}

export async function getTerminalToken(): Promise<string | null> {
  // Prefer IndexedDB. If it fails/unavailable, fallback to localStorage.
  if (hasIndexedDb()) {
    try {
      const v = await idbGet(IDB_KEY)
      if (v && v.trim()) return v.trim()
      // If IDB is empty, still allow localStorage fallback for older installs.
    } catch {
      // fallthrough
    }
  }
  return lsGet()
}

export async function setTerminalToken(token: string): Promise<void> {
  const trimmed = token.trim()
  if (!trimmed) return

  if (hasIndexedDb()) {
    try {
      await idbSet(IDB_KEY, trimmed)
      // Also set localStorage as fallback for environments where IDB may later fail.
      lsSet(trimmed)
      return
    } catch {
      // fallthrough
    }
  }

  lsSet(trimmed)
}

export async function clearTerminalToken(): Promise<void> {
  if (hasIndexedDb()) {
    try {
      await idbDel(IDB_KEY)
    } catch {
      // ignore and still clear localStorage
    }
  }
  lsDel()
}

