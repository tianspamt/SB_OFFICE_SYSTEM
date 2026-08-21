export function formatPostDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function filterPosts(posts, { search, filterStatus, filterCategory = "all" }) {
  const q = search.trim().toLowerCase();
  return posts.filter((p) => {
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "published" && p.published) ||
      (filterStatus === "draft" && !p.published);
    const matchCategory = filterCategory === "all" || p.category === filterCategory;
    const matchSearch =
      !q ||
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.body && p.body.toLowerCase().includes(q));
    return matchStatus && matchCategory && matchSearch;
  });
}

export function sortPostsPinnedThenNewest(list) {
  return [...list].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });
}
