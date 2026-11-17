import {
  BookOpen,
  Car,
  Clapperboard,
  Dumbbell,
  Gem,
  GraduationCap,
  HeartPulse,
  Hotel,
  House,
  PawPrint,
  Pill,
  Plane,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  Utensils,
  Wrench,
} from "lucide-react";

// Category tile icon, picked by keywords in the category name (the API
// sends no icon). First match wins, so specific words come first.
const ICON_KEYWORDS = [
  [/pharma|chemist|medic|drug/, Pill],
  [/food|restaurant|cafe|café|bakery|dining|kitchen|drink|beverage|sweet/, Utensils],
  [/grocery|kirana|supermarket|mart/, ShoppingBag],
  [/fashion|cloth|apparel|wear|footwear|shoe/, Shirt],
  [/jewel|gold|diamond/, Gem],
  [/beauty|salon|spa|wellness|cosmetic|grooming|barber/, Sparkles],
  [/gym|fitness|sport|yoga/, Dumbbell],
  [/health|clinic|hospital|doctor|dental/, HeartPulse],
  [/electronic|mobile|gadget|computer|appliance/, Smartphone],
  [/home|furniture|decor|living/, House],
  [/hotel|stay|resort/, Hotel],
  [/travel|tour|holiday/, Plane],
  [/auto|car|bike|vehicle|motor/, Car],
  [/movie|cinema|entertain|event|gaming/, Clapperboard],
  [/educat|school|coaching|class|course/, GraduationCap],
  [/book|station/, BookOpen],
  [/pet/, PawPrint],
  [/service|repair|laundry|clean/, Wrench],
];

/** @param {string} [name] @returns {import('react').ElementType} */
export function iconForCategory(name = "") {
  const value = name.toLowerCase();
  return ICON_KEYWORDS.find(([pattern]) => pattern.test(value))?.[1] ?? Store;
}

/**
 * Category / sub-category API item → `{ id, name, image }`. `image` is the
 * icon URL the backend sends (GET /categories/getAll → `image`); null when
 * there isn't one, so the tile falls back to `iconForCategory`.
 * @param {{ _id?: string, id?: string, name?: string, title?: string, image?: string, icon?: string }} item
 * @returns {{ id: string, name: string, image: string|null }}
 */
export const toOption = (item) => ({
  id: String(item?._id ?? item?.id ?? ""),
  name: String(item?.name ?? item?.title ?? "").trim(),
  image: (typeof item?.image === "string" && item.image.trim()) || (typeof item?.icon === "string" && item.icon.trim()) || null,
});
