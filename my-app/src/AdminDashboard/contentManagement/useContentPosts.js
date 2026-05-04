import { useState, useEffect, useCallback } from "react";
import { API, authFetch } from "../AdminContext";
import { DEFAULT_POST_CATEGORY } from "./constants";
import { toApiPayload } from "./utils";

function demoPosts() {
  const now = Date.now();
  return [
    {
      id: 1,
      title: "Coastal cleanup — Earth Day 2026",
      category: DEFAULT_POST_CATEGORY,
      caption:
        "SB members joined youth volunteers for a coastal cleanup. Photos for documentation and transparency.",
      images: [],
      published: true,
      pinned: true,
      created_at: new Date(now).toISOString(),
    },
    {
      id: 2,
      title: "Budget consultation — barangay hall",
      category: DEFAULT_POST_CATEGORY,
      caption:
        "Public hearing on the annual investment plan. Community stakeholders shared priorities.",
      images: [],
      published: true,
      pinned: false,
      created_at: new Date(now - 86400000 * 2).toISOString(),
    },
    {
      id: 3,
      title: "Draft: Flag ceremony highlights",
      category: DEFAULT_POST_CATEGORY,
      caption: "Photos from Monday flag raising—pending final caption.",
      images: [],
      published: false,
      pinned: false,
      created_at: new Date(now - 86400000 * 5).toISOString(),
    },
  ];
}

export function useContentPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await authFetch(`${API}/api/content-posts`);
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      setFetchError("Failed to load posts. Please refresh.");
      setPosts(demoPosts());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const savePost = useCallback(async (editTarget, rawForm) => {
    const formData = toApiPayload(rawForm);
    if (editTarget) {
      const res = await authFetch(
        `${API}/api/content-posts/${editTarget.id}`,
        {
          method: "PUT",
          body: JSON.stringify(formData),
        }
      );
      if (!res.ok) throw new Error("Failed to update post.");
      const updated = await res.json();
      setPosts((prev) =>
        prev.map((p) => (p.id === editTarget.id ? updated : p))
      );
    } else {
      const res = await authFetch(`${API}/api/content-posts`, {
        method: "POST",
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to create post.");
      const created = await res.json();
      setPosts((prev) => [created, ...prev]);
    }
  }, []);

  const deletePost = useCallback(async (post) => {
    try {
      await authFetch(`${API}/api/content-posts/${post.id}`, {
        method: "DELETE",
      });
    } catch {
      /* offline / demo: still drop locally */
    }
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
  }, []);

  const togglePublish = useCallback(async (id) => {
    let published;
    setPosts((prev) => {
      const post = prev.find((p) => p.id === id);
      if (!post) return prev;
      published = !post.published;
      return prev.map((p) =>
        p.id === id ? { ...p, published } : p
      );
    });
    if (published === undefined) return;
    try {
      await authFetch(`${API}/api/content-posts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ published }),
      });
    } catch {
      /* keep optimistic state */
    }
  }, []);

  const togglePin = useCallback(async (id) => {
    let pinned;
    setPosts((prev) => {
      const post = prev.find((p) => p.id === id);
      if (!post) return prev;
      pinned = !post.pinned;
      return prev.map((p) => (p.id === id ? { ...p, pinned } : p));
    });
    if (pinned === undefined) return;
    try {
      await authFetch(`${API}/api/content-posts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ pinned }),
      });
    } catch {
      /* keep optimistic state */
    }
  }, []);

  return {
    posts,
    loading,
    fetchError,
    fetchPosts,
    savePost,
    deletePost,
    togglePublish,
    togglePin,
  };
}
