// Keeps the logo / cover the vendor picked on Create Outlet across a page
// refresh. The files are only sent to the backend on final submit, and a
// File can't go into sessionStorage, so they're parked in IndexedDB (which
// stores Blobs/Files as-is) under the brand id until the outlet is saved.

const DB_NAME = "trydood-outlet-images";
const STORE = "images";

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
    });
  } finally {
    db.close();
  }
}

const keyFor = (brandId, kind) => `${brandId}:${kind}`;

/**
 * Saves (or, with `file === null`, removes) the picked image.
 * @param {string} brandId @param {"logo"|"cover"} kind @param {File|null} file
 */
export function cacheOutletImage(brandId, kind, file) {
  if (!brandId) return Promise.resolve();
  return run("readwrite", (store) => (file ? store.put(file, keyFor(brandId, kind)) : store.delete(keyFor(brandId, kind)))).catch(
    (err) => console.error(`Couldn't cache outlet ${kind}:`, err),
  );
}

/**
 * @param {string} brandId @param {"logo"|"cover"} kind
 * @returns {Promise<File|null>}
 */
export function readOutletImage(brandId, kind) {
  if (!brandId) return Promise.resolve(null);
  return run("readonly", (store) => store.get(keyFor(brandId, kind)))
    .then((file) => file || null)
    .catch((err) => {
      console.error(`Couldn't read cached outlet ${kind}:`, err);
      return null;
    });
}

/** Clears both images once the outlet is saved. @param {string} brandId */
export function clearOutletImages(brandId) {
  return Promise.all([cacheOutletImage(brandId, "logo", null), cacheOutletImage(brandId, "cover", null)]);
}
