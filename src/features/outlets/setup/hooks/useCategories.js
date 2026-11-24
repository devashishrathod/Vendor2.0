import { useEffect, useState } from "react";
import { getCategories, getSubCategories } from "../services/CategoryApi"; // ← path apne project ke hisaab se adjust karo
import { extractArray } from "../utils/extractArray";

/**
 * Loads Brand Type categories once, then loads sub-categories whenever
 * `categoryId` changes. Keeps state defensively as arrays at all times —
 * never returns a raw (possibly non-array) API response, so `.map()` on the
 * result never crashes the page even on a bad/late API response.
 */
export function useCategories(categoryId) {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  // Sub-categories with the category they were loaded for — only shown while
  // that category is still the picked one (no reset inside an effect).
  const [sub, setSub] = useState({ forId: null, list: [], error: "" });

  // Load all categories once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setCategoriesLoading(true);
        setCategoriesError("");
        const data = await getCategories({ page: 1, limit: 100 });
        const list = extractArray(data, ["data", "categories"]);
        if (!cancelled) {
          setCategories(list);
          if (!list.length) {
            // Not necessarily an error (could legitimately be empty), but
            // surface it in the console once so you can inspect the real
            // shape returned by getCategories.
            console.warn("getCategories returned no usable array. Raw response:", data);
          }
        }
      } catch (err) {
        console.error("Failed to load categories:", err?.message || err);
        if (!cancelled) {
          setCategories([]); // never leave state as a non-array on error
          setCategoriesError("Couldn't load categories. Please retry.");
        }
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load sub-categories whenever a category is picked.
  useEffect(() => {
    if (!categoryId) return undefined;
    let cancelled = false;
    getSubCategories({ categoryId, page: 1, limit: 100 })
      .then((data) => {
        const list = extractArray(data, ["data", "subCategories", "subcategories"]);
        if (!list.length) console.warn("getSubCategories returned no usable array. Raw response:", data);
        if (!cancelled) setSub({ forId: categoryId, list, error: "" });
      })
      .catch((err) => {
        console.error("Failed to load sub-categories:", err?.message || err);
        if (!cancelled) setSub({ forId: categoryId, list: [], error: "Couldn't load sub-categories. Please retry." });
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  const subReady = Boolean(categoryId) && sub.forId === categoryId;

  return {
    categories: Array.isArray(categories) ? categories : [],
    subCategories: subReady && Array.isArray(sub.list) ? sub.list : [],
    categoriesLoading,
    subCategoriesLoading: Boolean(categoryId) && !subReady,
    categoriesError,
    subCategoriesError: subReady ? sub.error : "",
  };
}
