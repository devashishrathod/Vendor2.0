import { useEffect, useState } from "react";
import { getCategories, getSubCategories } from "../../New folder/services/CategoryApi"; // ← path apne project ke hisaab se adjust karo
import { extractArray } from "../utils/extractArray";

/**
 * Loads Brand Type categories once, then loads sub-categories whenever
 * `categoryId` changes. Keeps state defensively as arrays at all times —
 * never returns a raw (possibly non-array) API response, so `.map()` on the
 * result never crashes the page even on a bad/late API response.
 */
export function useCategories(categoryId) {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [subCategoriesLoading, setSubCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");
  const [subCategoriesError, setSubCategoriesError] = useState("");

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
    if (!categoryId) {
      setSubCategories([]);
      setSubCategoriesError("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setSubCategoriesLoading(true);
        setSubCategoriesError("");
        const data = await getSubCategories({ categoryId, page: 1, limit: 100 });
        const list = extractArray(data, ["data", "subCategories", "subcategories"]);
        if (!cancelled) {
          setSubCategories(list);
          if (!list.length) {
            console.warn("getSubCategories returned no usable array. Raw response:", data);
          }
        }
      } catch (err) {
        console.error("Failed to load sub-categories:", err?.message || err);
        if (!cancelled) {
          setSubCategories([]); // never leave state as a non-array on error
          setSubCategoriesError("Couldn't load sub-categories. Please retry.");
        }
      } finally {
        if (!cancelled) setSubCategoriesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  return {
    categories: Array.isArray(categories) ? categories : [],
    subCategories: Array.isArray(subCategories) ? subCategories : [],
    categoriesLoading,
    subCategoriesLoading,
    categoriesError,
    subCategoriesError,
  };
}
