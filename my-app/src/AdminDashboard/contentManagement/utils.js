import { DEFAULT_POST_CATEGORY } from "./constants";

export function formatPostDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Ensure API payload always includes category for older backends. */
export function toApiPayload(form) {
  return {
    ...form,
    category: form.category || DEFAULT_POST_CATEGORY,
  };
}

export function filterPosts(posts, { search, filterStatus }) {
  const q = search.trim().toLowerCase();
  return posts.filter((p) => {
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "published" && p.published) ||
      (filterStatus === "draft" && !p.published);
    const matchSearch =
      !q ||
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.caption && p.caption.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });
}

export function sortPostsPinnedThenNewest(list) {
  return [...list].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });
}
