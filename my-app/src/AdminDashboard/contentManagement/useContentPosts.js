import { useState, useEffect, useCallback } from "react";
import { API, authFetch, extractErrorMsg } from "../AdminContext";

export function useContentPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await authFetch(`${API}/api/content-posts`);
      const data = await res.json();
      if (!res.ok) throw new Error(extractErrorMsg(data, "Failed to load posts."));
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      setFetchError(err.message || "Failed to load posts. Please refresh.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // `formData` is a ready-to-send FormData built by ContentPostModal (title,
  // body, category, published, pinned, existingImages, and any new image
  // files) — passed straight through rather than re-serialized here.
  const savePost = useCallback(async (editTarget, formData) => {
    if (editTarget) {
      const res = await authFetch(`${API}/api/content-posts/${editTarget.id}`, {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(extractErrorMsg(data, "Failed to update post."));
      setPosts((prev) => prev.map((p) => (p.id === editTarget.id ? data : p)));
    } else {
      const res = await authFetch(`${API}/api/content-posts`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(extractErrorMsg(data, "Failed to create post."));
      setPosts((prev) => [data, ...prev]);
    }
  }, []);

  const deletePost = useCallback(async (post) => {
    const res = await authFetch(`${API}/api/content-posts/${post.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractErrorMsg(data, "Failed to delete post."));
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
  }, []);

  // Optimistic, but rolled back on failure — previously these silently kept
  // the optimistic state even when the network call failed, so clicking
  // "Publish" could look like it worked while nothing changed server-side.
  const togglePublish = useCallback(async (id) => {
    const prevPost = posts.find((p) => p.id === id);
    if (!prevPost) return;
    const published = !prevPost.published;
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, published } : p)));
    try {
      const res = await authFetch(`${API}/api/content-posts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ published }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(extractErrorMsg(data, "Failed to update post."));
      setPosts((prev) => prev.map((p) => (p.id === id ? data : p)));
    } catch (err) {
      setPosts((prev) => prev.map((p) => (p.id === id ? prevPost : p)));
      throw err;
    }
  }, [posts]);

  const togglePin = useCallback(async (id) => {
    const prevPost = posts.find((p) => p.id === id);
    if (!prevPost) return;
    const pinned = !prevPost.pinned;
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, pinned } : p)));
    try {
      const res = await authFetch(`${API}/api/content-posts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ pinned }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(extractErrorMsg(data, "Failed to update post."));
      setPosts((prev) => prev.map((p) => (p.id === id ? data : p)));
    } catch (err) {
      setPosts((prev) => prev.map((p) => (p.id === id ? prevPost : p)));
      throw err;
    }
  }, [posts]);

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
