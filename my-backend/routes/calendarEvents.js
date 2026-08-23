const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase'); // adjust if filename differs
const { verifyToken } = require('../middleware/auth');
const { notifyAllStaff, notificationEmailHtml } = require('../helpers/notify');
const { escapeHtml } = require('../helpers/utils');

// Who can create/edit/delete an office-wide event, beyond the admin role
// itself. Secretary and Clerk are the two positions that staff the calendar
// day-to-day and may post office-wide events; Vice-Mayor/Councilor events
// stay personal-only, by design.
const canManageOfficialEvents = (user) =>
  user.role === 'admin' || ['secretary', 'clerk'].includes(user.position);

// start_date/end_date are ISO "YYYY-MM-DD" strings, so plain string
// comparison already sorts chronologically — no need to parse into Date
// objects. Also catches the same-day case where the event still "ends
// before it starts" by time, when it's not an all-day event.
const validateEventRange = ({ start_date, end_date, start_time, end_time, all_day }) => {
  const effectiveEnd = end_date || start_date;
  if (effectiveEnd < start_date) return 'End date cannot be before the start date.';
  if (effectiveEnd === start_date && !all_day && start_time && end_time && end_time < start_time) {
    return 'End time cannot be before the start time.';
  }
  return null;
};

// GET /api/calendar-events
// GET /api/calendar-events
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    let query = supabase.from('calendar_events').select('*');

    // Both roles: see all official events + their own personal events
query = query.or(`is_admin_event.eq.true,created_by.eq.${userId}`);

    const { data, error } = await query.order('start_date', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/calendar-events
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, location, start_date, start_time, end_date, end_time, all_day, color } = req.body;

    if (!title || !start_date) {
      return res.status(400).json({ error: 'Title and start date are required' });
    }
    const rangeError = validateEventRange({ start_date, end_date, start_time, end_time, all_day });
    if (rangeError) return res.status(400).json({ error: rangeError });

    const { data, error } = await supabase
      .from('calendar_events')
      .insert([{
        title,
        description: description || null,
        location: location || null,
        start_date,
        start_time: all_day ? null : (start_time || null),
        end_date: end_date || start_date,
        end_time: all_day ? null : (end_time || null),
        all_day: !!all_day,
        color: color || '#009439',
        is_admin_event: canManageOfficialEvents(req.user),
        created_by: userId,
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    // Only official/admin events are office-wide — a personal event
    // (is_admin_event: false) is private to its creator (see GET's read
    // scope above), so broadcasting it to every staff member would leak it.
    if (data.is_admin_event) {
      notifyAllStaff({
        message: `New schedule: ${title} on ${start_date}`,
        entityType: 'calendar_event', entityId: data.id,
        emailSubject: `New Schedule: ${title}`,
        emailHtml: notificationEmailHtml(
          'New Schedule Added',
          `A new event was added to the calendar: <strong>${escapeHtml(title)}</strong> on ${escapeHtml(start_date)}.`
        ),
      });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/calendar-events/:id
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.id;

    const { data: existing, error: fetchError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (fetchError || !existing) return res.status(404).json({ error: 'Event not found' });

    // Write scope matches read scope exactly: an official event can only be
    // touched by whoever can also create one; a personal event can only be
    // touched by the person who created it — no override on someone else's
    // personal reminder, since even admins can't see other people's personal
    // events through GET in the first place.
    if (existing.is_admin_event) {
      if (!canManageOfficialEvents(req.user)) return res.status(403).json({ error: 'You cannot edit this event' });
    } else if (existing.created_by !== userId) {
      return res.status(403).json({ error: 'You cannot edit this event' });
    }

    const { title, description, location, start_date, start_time, end_date, end_time, all_day, color } = req.body;
    const rangeError = validateEventRange({ start_date, end_date, start_time, end_time, all_day });
    if (rangeError) return res.status(400).json({ error: rangeError });

    const { data, error } = await supabase
      .from('calendar_events')
      .update({
        title,
        description: description || null,
        location: location || null,
        start_date,
        start_time: all_day ? null : (start_time || null),
        end_date: end_date || start_date,
        end_time: all_day ? null : (end_time || null),
        all_day: !!all_day,
        color: color || '#009439',
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/calendar-events/:id
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.id;

    const { data: existing, error: fetchError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (fetchError || !existing) return res.status(404).json({ error: 'Event not found' });

    // Same write-matches-read scoping as PUT above.
    if (existing.is_admin_event) {
      if (!canManageOfficialEvents(req.user)) return res.status(403).json({ error: 'You cannot delete this event' });
    } else if (existing.created_by !== userId) {
      return res.status(403).json({ error: 'You cannot delete this event' });
    }

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;