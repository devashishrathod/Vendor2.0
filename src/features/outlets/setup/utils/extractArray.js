// APIs are inconsistent about how they wrap list data (bare array, { data },
// { categories }, { data: { categories } }, { data: { data } }, etc). This
// walks the common shapes and returns the FIRST one that is actually an
// array, instead of the old `a || b || c || []` pattern which happily
// accepts a truthy object and hands it to `.map()`, crashing the page.
export function extractArray(payload, keys = []) {
  if (Array.isArray(payload)) return payload;

  for (const key of keys) {
    const value = payload?.[key];
    if (Array.isArray(value)) return value;
  }

  // one more level deep, e.g. payload.data.data / payload.data.categories
  for (const key of keys) {
    const nested = payload?.data;
    if (Array.isArray(nested?.[key])) return nested[key];
  }

  return [];
}
