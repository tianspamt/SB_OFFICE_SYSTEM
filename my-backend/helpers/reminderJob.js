const cron = require('node-cron')
const supabase = require('../config/supabase')
const { notify, notifyAllStaff, notificationEmailHtml } = require('./notify')
const { escapeHtml } = require('./utils')
const { userForMember } = require('./accountLinks')
const { STAGE_LABELS } = require('./authorApprovals')

// Runs once daily: finds official calendar events happening tomorrow that
// haven't been reminded about yet, and notifies all active staff. Personal
// events (is_admin_event: false) are excluded — same privacy reasoning as
// the immediate "new schedule" trigger in routes/calendarEvents.js.
async function sendCalendarReminders() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const { data: events, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('start_date', tomorrowStr)
    .eq('is_admin_event', true)
    .eq('reminder_sent', false)
  if (error) {
    console.error('sendCalendarReminders lookup failed:', error.message)
    return
  }

  for (const event of events || []) {
    await notifyAllStaff({
      message: `Reminder: ${event.title} is tomorrow`,
      entityType: 'calendar_event', entityId: event.id,
      emailSubject: `Reminder: ${event.title} — Tomorrow`,
      emailHtml: notificationEmailHtml(
        'Event Tomorrow',
        `This is a reminder that <strong>${escapeHtml(event.title)}</strong> is scheduled for tomorrow, ${escapeHtml(event.start_date)}.`
      ),
    })
    await supabase.from('calendar_events').update({ reminder_sent: true }).eq('id', event.id)
  }
}

// Author approvals that have waited more than a day get a reminder email to
// the author, at most once a day each (reminder_sent_at, migrations/031).
// Never auto-approves — an unanswered request just keeps waiting, and the
// Secretary sees it as "Waiting for author" in the record's approval panel.
const ONE_DAY_MS = 24 * 60 * 60 * 1000
async function sendAuthorApprovalReminders() {
  const cutoff = new Date(Date.now() - ONE_DAY_MS).toISOString()
  const { data: waiting, error } = await supabase
    .from('author_approvals')
    .select('id, entity_type, entity_id, stage, official_id')
    .eq('decision', 'pending')
    .lt('requested_at', cutoff)
    .or(`reminder_sent_at.is.null,reminder_sent_at.lt.${cutoff}`)
  if (error) {
    console.error('sendAuthorApprovalReminders lookup failed:', error.message)
    return
  }

  for (const a of waiting || []) {
    const account = await userForMember(a.official_id).catch(() => null)
    if (!account) continue
    const { data: record } = await supabase
      .from(`${a.entity_type}s`).select('title').eq('id', a.entity_id).maybeSingle()
    if (!record) continue
    await notify({
      recipientId: account.id,
      emailSubject: `Reminder: Your Approval Is Still Needed — ${record.title}`,
      emailHtml: notificationEmailHtml(
        'Your Approval Is Still Needed',
        `<strong>${escapeHtml(record.title)}</strong> is still waiting for your approval of the <strong>${STAGE_LABELS[a.stage]}</strong>. Sign in and open <em>My Profile → Needs My Approval</em>.`
      ),
    })
    await supabase.from('author_approvals').update({ reminder_sent_at: new Date().toISOString() }).eq('id', a.id)
  }
}

// Runs every day at 8:00 AM server time.
cron.schedule('0 8 * * *', sendCalendarReminders)
cron.schedule('0 8 * * *', sendAuthorApprovalReminders)

module.exports = { sendCalendarReminders, sendAuthorApprovalReminders }
