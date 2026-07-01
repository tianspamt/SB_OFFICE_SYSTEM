const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase'); // adjust if filename differs
const { verifyToken } = require('../middleware/auth');

// GET /api/calendar-events
// GET /api/calendar-events
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

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

    if (userRole !== 'admin' && (existing.is_admin_event || existing.created_by !== userId)) {
      return res.status(403).json({ error: 'You cannot edit this event' });
    }

    const { title, description, location, start_date, start_time, end_date, end_time, all_day, color } = req.body;

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

    if (userRole !== 'admin' && (existing.is_admin_event || existing.created_by !== userId)) {
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