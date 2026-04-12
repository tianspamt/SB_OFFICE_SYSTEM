import { useState } from "react";
import { ChevronLeft, ChevronRight, PlusCircle, Clock, MapPin, Pencil, Trash2 } from "lucide-react";
import styles from "./AdminDashboard.module.css";
import { toIsoDate, toLocalIso, getLocalHolidays } from "./AdminContext";

export default function CalendarPage({
  localEvents, phHolidays, fetchingHolidays,
  showHolidays, setShowHolidays,
  onAddEvent, onEditEvent, onDeleteEvent,
}) {
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [selectedCalDay, setSelectedCalDay] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);

  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const today = new Date();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const chipStyle = (ev) => {
    if (ev.isHoliday) {
      if (ev.holidayType === "national")        return { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" };
      if (ev.holidayType === "special-working") return { bg: "#dcfce7", color: "#166534", dot: "#22c55e" };
      if (ev.holidayType === "local-fiesta")    return { bg: "#fce7f3", color: "#9d174d", dot: "#ec4899" };
      if (ev.holidayType === "special")         return { bg: "#fef9c3", color: "#854d0e", dot: "#eab308" };
      return { bg: "#ede9fe", color: "#5b21b6", dot: "#8b5cf6" };
    }
    const c = ev.color || "#009439";
    return { bg: c + "28", color: c, dot: c };
  };

  const getEventsForDay = (date) => {
    const iso = toIsoDate(date);
    const yr = date.getFullYear();
    const yearHolidays = phHolidays[yr] || [];
    const localHols = getLocalHolidays(yr);
    const allHolsForDay = [
      ...yearHolidays.filter((h) => h.date === iso),
      ...localHols.filter((h) => h.date === iso),
    ];
    const holidays = showHolidays
      ? allHolsForDay.map((h) => ({
          id: `hol-${h.date}-${h.name}`, summary: h.name,
          isHoliday: true, holidayType: h.type,
          start: { date: h.date }, end: { date: h.date },
        }))
      : [];
    const dbEvs = localEvents
      .filter((ev) => {
        const start = toLocalIso(ev.start_date);
        const end = toLocalIso(ev.end_date || ev.start_date) || start;
        return start <= iso && iso <= end;
      })
      .map((ev) => {
        const startIso = toLocalIso(ev.start_date);
        const endIso = toLocalIso(ev.end_date || ev.start_date);
        return {
          id: `local-${ev.id}`, dbId: ev.id, summary: ev.title,
          location: ev.location, description: ev.description,
          color: ev.color || "#009439", isLocal: true, all_day: ev.all_day,
          start: { date: startIso, dateTime: ev.all_day ? null : `${startIso}T${ev.start_time || "00:00"}` },
          end: { date: endIso, dateTime: ev.all_day ? null : `${endIso}T${ev.end_time || "00:00"}` },
          raw: ev,
        };
      });
    return [...holidays, ...dbEvs];
  };

  const getUpcomingEvents = () => {
    const todayIso = toIsoDate(new Date());
    const yr = new Date().getFullYear();
    const allHolidays = [...(phHolidays[yr] || []), ...(phHolidays[yr + 1] || [])];
    const localHolsUpcoming = [...getLocalHolidays(yr), ...getLocalHolidays(yr + 1)];
    const holidays = showHolidays
      ? [...allHolidays, ...localHolsUpcoming]
          .filter((h) => h.date >= todayIso)
          .map((h) => ({
            id: `hol-${h.date}-${h.name}`, summary: h.name,
            isHoliday: true, holidayType: h.type,
            start: { date: h.date }, end: { date: h.date },
          }))
      : [];
    const dbEvs = localEvents
      .filter((ev) => (toLocalIso(ev.start_date) || "") >= todayIso)
      .map((ev) => {
        const startIso = toLocalIso(ev.start_date);
        const endIso = toLocalIso(ev.end_date || ev.start_date);
        return {
          id: `local-${ev.id}`, dbId: ev.id, summary: ev.title,
          location: ev.location, description: ev.description,
          color: ev.color || "#009439", isLocal: true, all_day: ev.all_day,
          start: { date: startIso, dateTime: ev.all_day ? null : `${startIso}T${ev.start_time}` },
          end: { date: endIso, dateTime: ev.all_day ? null : `${endIso}T${ev.end_time}` },
          raw: ev,
        };
      });
    return [...holidays, ...dbEvs]
      .sort((a, b) => (a.start?.date || "").localeCompare(b.start?.date || ""))
      .slice(0, 15);
  };

  const upcoming = getUpcomingEvents();

  return (
    <div className={styles.calendarWrapper}>
      <div className={styles.calendarTopBar}>
        <div className={styles.calendarNav}>
          <button className={styles.calNavBtn} onClick={() => setCalendarViewDate(new Date(year, month - 1, 1))}><ChevronLeft size={16} /></button>
          <span className={styles.calMonthLabel}>{MONTH_NAMES[month]} {year}</span>
          <button className={styles.calNavBtn} onClick={() => setCalendarViewDate(new Date(year, month + 1, 1))}><ChevronRight size={16} /></button>
          <button className={styles.calTodayBtn} onClick={() => { setCalendarViewDate(new Date()); setSelectedCalDay(null); }}>Today</button>
        </div>
        <div className={styles.calendarTopActions}>
          <button onClick={() => setShowHolidays((v) => !v)} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "6px 11px",
            borderRadius: 8, border: "1px solid", fontSize: 12, fontWeight: 500, cursor: "pointer",
            background: showHolidays ? "#fee2e2" : "#f1f5f9",
            borderColor: showHolidays ? "#fca5a5" : "#cbd5e0",
            color: showHolidays ? "#991b1b" : "#64748b",
          }}>{showHolidays ? "Hide" : "Show"} Holidays</button>
          <button className={styles.calAddBtn} onClick={() => onAddEvent(selectedCalDay ? toIsoDate(selectedCalDay) : "")}>
            <PlusCircle size={14} /> Add Event
          </button>
        </div>
      </div>

      {showHolidays && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 10, fontSize: 11, alignItems: "center", padding: "6px 0" }}>
          <span style={{ fontWeight: 600, color: "#64748b" }}>Holidays:</span>
          {[
            { label: "National Regular",    bg: "#fee2e2", color: "#991b1b" },
            { label: "Special Non-Working", bg: "#fef9c3", color: "#854d0e" },
            { label: "Special Working",     bg: "#dcfce7", color: "#166534" },
            { label: "Local / Fiesta",      bg: "#fce7f3", color: "#9d174d" },
          ].map((l) => (
            <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: l.bg, border: `1px solid ${l.color}`, display: "inline-block" }} />
              <span style={{ color: l.color }}>{l.label}</span>
            </span>
          ))}
          {fetchingHolidays && <span style={{ color: "#94a3b8", fontSize: 11 }}>Loading holidays...</span>}
        </div>
      )}

      <div className={styles.calCard}>
        <div className={styles.calDayHeaders}>{DAY_NAMES.map((d) => <div key={d} className={styles.calDayHeader}>{d}</div>)}</div>
        <div className={styles.calCells}>
          {cells.map((day, idx) => {
            if (day === null || day === undefined || isNaN(Number(day))) return <div key={`e-${idx}`} className={styles.calCellEmpty} />;
            const d = Number(day);
            const cellDate = new Date(year, month, d);
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
            const isSelected = selectedCalDay?.getDate() === d && selectedCalDay?.getMonth() === month && selectedCalDay?.getFullYear() === year;
            const evs = getEventsForDay(cellDate);
            const hasHoliday = evs.some((e) => e.isHoliday);
            return (
              <div key={`day-${idx}`}
                className={`${styles.calCell} ${isToday ? styles.calCellToday : ""} ${isSelected ? styles.calCellSelected : ""}`}
                style={hasHoliday && !isToday && !isSelected ? { background: "#fffbf0" } : {}}
                onClick={() => setSelectedCalDay(isSelected ? null : cellDate)}>
                <span className={styles.calDayNum}>{d}</span>
                {evs.slice(0, 3).map((ev) => {
                  const c = chipStyle(ev);
                  return (
                    <button key={ev.id} className={styles.calEventChip}
                      style={{ background: c.bg, color: c.color, fontSize: 10 }}
                      onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); setShowEventDetailModal(true); }}>
                      {ev.isHoliday ? "🇵🇭 " : ""}{ev.summary}
                    </button>
                  );
                })}
                {evs.length > 3 && <span className={styles.calEventChipMore}>+{String(evs.length - 3)} more</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.calEventsPanel}>
        <div className={styles.calEventsPanelHeader}>
          <span className={styles.calEventsPanelTitle}>
            {selectedCalDay ? `Events — ${selectedCalDay.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })}` : "Upcoming Events"}
          </span>
          <span className={styles.calEventsPanelCount}>
            {String((selectedCalDay ? getEventsForDay(selectedCalDay) : upcoming).length)} event
            {(selectedCalDay ? getEventsForDay(selectedCalDay) : upcoming).length !== 1 ? "s" : ""}
          </span>
        </div>
        <table className={styles.calEventsTable}>
          <thead className={styles.calEventsTableHead}><tr><th>Event</th><th>Date</th><th>Time</th><th>Location</th></tr></thead>
          <tbody>
            {(() => {
              const list = selectedCalDay ? getEventsForDay(selectedCalDay) : upcoming;
              if (list.length === 0) return <tr><td colSpan={4} className={styles.calEvTableEmpty}>{selectedCalDay ? "No events on this day." : "No upcoming events."}</td></tr>;
              return list.map((ev) => {
                const c = chipStyle(ev);
                const evDate = ev.start?.date ? new Date(ev.start.date + "T00:00:00") : new Date(ev.start?.dateTime);
                const hasTime = !ev.isHoliday && !ev.all_day && !!ev.start?.dateTime;
                return (
                  <tr key={ev.id} className={styles.calEventsTableRow} onClick={() => { setSelectedEvent(ev); setShowEventDetailModal(true); }}>
                    <td>
                      <span className={styles.calEvTableChip}>
                        <span className={styles.calEvTableDot} style={{ background: c.dot }} />
                        {ev.isHoliday ? "🇵🇭 " : ""}{ev.summary}
                        {ev.isHoliday && (
                          <span style={{ marginLeft: 4, fontSize: 10, padding: "1px 5px", borderRadius: 4, background: c.bg, color: c.color, border: `1px solid ${c.dot}` }}>
                            {ev.holidayType === "national" ? "National" : ev.holidayType === "special-working" ? "Special Working" : ev.holidayType === "local-fiesta" ? "Local Fiesta" : "Special"}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className={styles.calEvTableDate}>{evDate.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className={styles.calEvTableTime}>{hasTime ? `${new Date(ev.start.dateTime).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })} – ${new Date(ev.end.dateTime).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}` : "All day"}</td>
                    <td className={styles.calEvTableLocation}>{ev.location || <span style={{ color: "#cbd5e0" }}>—</span>}</td>
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>

      {/* Event Detail Modal */}
      {showEventDetailModal && selectedEvent && (() => {
        const ev = selectedEvent;
        const start = ev.start?.dateTime ? new Date(ev.start.dateTime) : ev.start?.date ? new Date(ev.start.date + "T00:00:00") : null;
        const end = ev.end?.dateTime ? new Date(ev.end.dateTime) : ev.end?.date ? new Date(ev.end.date + "T00:00:00") : null;
        const c = chipStyle(ev);
        return (
          <div className={styles.modalOverlay}><div className={styles.modal}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: c.dot, flexShrink: 0, display: "inline-block" }} />
              <h2 className={styles.modalTitle} style={{ margin: 0 }}>{ev.isHoliday ? "🇵🇭 " : ""}{ev.summary}</h2>
            </div>
            {ev.isHoliday && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: c.bg, color: c.color, border: `1px solid ${c.dot}`, marginBottom: 10 }}>
                {ev.holidayType === "national" ? "🇵🇭 National Regular Holiday" : ev.holidayType === "special-working" ? "✅ Special Working Holiday" : ev.holidayType === "local-fiesta" ? "🎉 Local Fiesta / Founding Anniversary" : "📅 Special Non-Working Day"}
              </div>
            )}
            {start && (
              <div style={{ fontSize: 13, color: "#4a5568", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                <Clock size={13} />
                {start.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                {!ev.isHoliday && !ev.all_day && ev.start?.dateTime && ` • ${start.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })} – ${end?.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}`}
              </div>
            )}
            {ev.location && <div style={{ fontSize: 13, color: "#4a5568", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}><MapPin size={13} />{ev.location}</div>}
            {ev.description && <div className={styles.calEventDetailDesc}>{ev.description}</div>}
            <div className={styles.modalBtns}>
              {ev.isLocal && (
                <>
                  <button className={styles.editBtn} onClick={() => { setShowEventDetailModal(false); onEditEvent(ev); }}><Pencil size={13} /> Edit</button>
                  <button className={styles.deleteBtn} onClick={() => { if (window.confirm("Delete this event?")) { onDeleteEvent(ev.dbId); setShowEventDetailModal(false); } }}><Trash2 size={13} /> Delete</button>
                </>
              )}
              <button className={styles.confirmBtn} onClick={() => setShowEventDetailModal(false)}>Close</button>
            </div>
          </div></div>
        );
      })()}
    </div>
  );
}
