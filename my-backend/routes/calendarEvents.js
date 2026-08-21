const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase'); // adjust if filename differs
const { verifyToken } = require('../middleware/auth');

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
    const userRole = req.user.role;
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
        is_admin_event: userRole === 'admin',
        created_by: userId,
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/calendar-events/:id
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const eventId = req.params.id;

    const { data: existing, error: fetchError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (fetchError || !existing) return res.status(404).json({ error: 'Event not found' });

    // Write scope matches read scope exactly: an official event can only be
    // touched by an admin; a personal event can only be touched by the
    // person who created it — no admin override on someone else's personal
    // reminder, since admins can't even see other people's personal events
    // through GET in the first place.
    if (existing.is_admin_event) {
      if (userRole !== 'admin') return res.status(403).json({ error: 'You cannot edit this event' });
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
    const userRole = req.user.role;
    const eventId = req.params.id;

    const { data: existing, error: fetchError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (fetchError || !existing) return res.status(404).json({ error: 'Event not found' });

    // Same write-matches-read scoping as PUT above.
    if (existing.is_admin_event) {
      if (userRole !== 'admin') return res.status(403).json({ error: 'You cannot delete this event' });
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