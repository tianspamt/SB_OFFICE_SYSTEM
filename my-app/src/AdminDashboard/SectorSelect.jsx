// SectorSelect.jsx
// Drop-in replacement for a native <select> that always opens DOWNWARD.
// A native select lets the browser pick the direction, and with a long list
// (the ~38 sectors) it flips upward and covers the page. This one renders its
// own list under the button, capped in height with its own scroll.
//
//   <SectorSelect value onChange options placeholder variant />
//   - options:     array of strings
//   - placeholder: when given, an empty first choice ("— Select sector —")
//   - onChange:    called with the chosen string ("" for the placeholder)
//   - variant:     "filter" (compact, filter rows) | "form" (full-width field)
//   - searchable:  adds a search box at the top of the list; typing narrows it

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

const CSS = `
.ss-wrap { position: relative; display: inline-block; }
.ss-wrap.ss-form { display: block; width: 100%; margin-bottom: 10px; }
.ss-btn {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  width: 100%; text-align: left; cursor: pointer; font-family: inherit;
  border: 1px solid #e2e8f0; background: #fff; color: #2d3748; outline: none;
  transition: border-color 0.15s;
}
.ss-filter .ss-btn { padding: 6px 10px; border-radius: 8px; font-size: 13px; background: #f7fafc; min-width: 150px; max-width: 260px; }
.ss-form .ss-btn { padding: 9px 13px; border-radius: 8px; font-size: 15px; }
.ss-btn:focus, .ss-open .ss-btn { border-color: #090446; }
.ss-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ss-placeholder { color: #718096; }
.ss-chev { flex: none; color: #718096; transition: transform 0.15s; }
.ss-open .ss-chev { transform: rotate(180deg); }
.ss-menu {
  position: absolute; top: calc(100% + 4px); left: 0; z-index: 1000;
  min-width: 100%; width: max-content; max-width: min(340px, 90vw);
  background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); padding: 4px;
  display: flex; flex-direction: column;
}
.ss-form .ss-menu { width: 100%; max-width: none; }
.ss-list {
  max-height: 240px; overflow-y: auto; overscroll-behavior: contain;
  margin: 0; padding: 0; list-style: none;
}
.ss-search {
  display: flex; align-items: center; gap: 7px; flex: none;
  padding: 7px 9px; margin-bottom: 4px;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
}
.ss-search:focus-within { border-color: #090446; }
.ss-search svg { flex: none; color: #a0aec0; }
.ss-search input {
  flex: 1; min-width: 0; border: none; outline: none; background: transparent;
  font-family: inherit; font-size: 13.5px; color: #2d3748;
}
.ss-empty { padding: 10px; text-align: center; font-size: 13px; color: #a0aec0; }
.ss-opt { padding: 7px 10px; border-radius: 6px; font-size: 13.5px; color: #2d3748; cursor: pointer; }
.ss-form .ss-opt { font-size: 14.5px; }
.ss-opt.ss-active { background: #eef2ff; }
.ss-opt.ss-selected { font-weight: 700; color: #090446; }
`;

export default function SectorSelect({
  value,
  onChange,
  options,
  placeholder,
  variant = "form",
  searchable = false,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);
  const listRef = useRef(null);
  const btnRef = useRef(null);

  // While searching, only matching options are listed (case-insensitive,
  // anywhere in the name) and the empty "— Select —" choice is left out.
  const q = query.trim().toLowerCase();
  const items = q
    ? options.filter((o) => o.toLowerCase().includes(q))
    : placeholder
      ? ["", ...options]
      : options;
  const labelOf = (v) => (v === "" ? placeholder : v);

  const closeMenu = () => {
    setOpen(false);
    setQuery("");
  };

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) closeMenu();
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    if (open && active >= 0) listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const openMenu = () => {
    if (disabled) return;
    setQuery("");
    setActive(Math.max(0, (placeholder ? ["", ...options] : options).indexOf(value)));
    setOpen(true);
  };
  const choose = (v) => {
    onChange(v);
    closeMenu();
    btnRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    // Space belongs to the search box while it's open (part of a name).
    if (e.key === " " && searchable) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
      btnRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (active >= 0 && active < items.length) choose(items[active]);
    } else if (e.key === "Tab") {
      closeMenu();
    }
  };

  const showPlaceholder = value === "" || value == null;

  return (
    <div
      ref={wrapRef}
      className={`ss-wrap ss-${variant}${open ? " ss-open" : ""}`}
      onKeyDown={onKeyDown}
    >
      <style>{CSS}</style>
      <button
        type="button"
        ref={btnRef}
        className="ss-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => (open ? closeMenu() : openMenu())}
      >
        <span className={`ss-label${showPlaceholder ? " ss-placeholder" : ""}`}>
          {showPlaceholder ? placeholder ?? "" : value}
        </span>
        <ChevronDown size={14} className="ss-chev" />
      </button>
      {open && (
        <div className="ss-menu">
          {searchable && (
            <div className="ss-search">
              <Search size={13} />
              <input
                autoFocus
                type="text"
                placeholder="Search sector…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
              />
            </div>
          )}
          <ul className="ss-list" role="listbox" ref={listRef}>
            {items.map((v, i) => (
              <li
                key={v || "__none"}
                role="option"
                aria-selected={v === value}
                className={`ss-opt${i === active ? " ss-active" : ""}${v === value ? " ss-selected" : ""}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(v)}
              >
                {labelOf(v)}
              </li>
            ))}
          </ul>
          {items.length === 0 && <div className="ss-empty">No sector matches “{query.trim()}”.</div>}
        </div>
      )}
    </div>
  );
}
