// Keeps each business document's actual file (by document id) so it can be
// previewed and survives a refresh between "chosen" and "saved". The
// persisted store only holds name / size / status; File objects can't go in
// localStorage, so they live in IndexedDB, which stores Blobs/Files as-is.

const DB_NAME = "trydood-document-files";
const STORE = "files";

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run(mode, action) {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = action(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request?.result);
      tx.onerror = () => reject(tx.error);
      // Aborted (e.g. storage quota) without an error event — don't hang.
      tx.onabort = () => reject(tx.error || new Error("Document file transaction aborted"));
    });
  } finally {
    db.close();
  }
}

/** @param {string} id @param {File} file */
export const putDocumentFile = (id, file) =>
  run("readwrite", (store) => store.put(file, id)).catch((err) => console.error("Couldn't keep document file:", err));

/** @param {string} id @returns {Promise<File|null>} */
export const getDocumentFile = (id) =>
  run("readonly", (store) => store.get(id))
    .then((file) => file || null)
    .catch((err) => {
      console.error("Couldn't read document file:", err);
      return null;
    });

/** @param {string} id */
export const deleteDocumentFile = (id) =>
  run("readwrite", (store) => store.delete(id)).catch((err) => console.error("Couldn't delete document file:", err));

/** Removes every kept file (on logout — they're the vendor's business documents). */
export const clearDocumentFiles = () =>
  run("readwrite", (store) => store.clear()).catch((err) => console.error("Couldn't clear document files:", err));
