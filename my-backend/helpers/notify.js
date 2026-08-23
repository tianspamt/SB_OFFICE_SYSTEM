const supabase = require('../config/supabase')
const { sendEmail } = require('./email')
const { escapeHtml } = require('./utils')

// Same green used for the dashboard's sidebar/header gradient (see
// AdminDashboard.module.css) — kept as the one source of truth so every
// outbound email visually matches the app instead of drifting independently.
const BRAND_GREEN = '#009439'
const BRAND_GREEN_DARK = '#005822'

// Shared visual shell for every outbound email (notifications, OTP, urgent
// announcements) — a green header band with the office wordmark, a round
// icon, headline, free-form body, and a footer note. `icon` is a single
// emoji rather than an inline SVG: email clients (Outlook's Word rendering
// engine especially) have unreliable SVG/flexbox support, so an emoji is the
// one "icon" format that reliably centers and renders everywhere.
const emailShell = ({
  icon = '🔔',
  heading,
  bodyHtml,
  footerNote = "you're receiving this because you have email notifications enabled.",
}) => `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;background:#ffffff;border:1px solid #e0e0e0;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,${BRAND_GREEN},${BRAND_GREEN_DARK});padding:26px 32px;text-align:center;">
      <p style="margin:0;font-size:19px;font-weight:800;color:#ffffff;">Office of Sangguniang Bayan</p>
      <p style="margin:2px 0 0;font-size:11px;color:#d7f5df;letter-spacing:1px;text-transform:uppercase;">Municipality of Balilihan, Bohol</p>
    </div>
    <div style="padding:36px 32px 8px;text-align:center;">
      <div style="width:60px;height:60px;line-height:60px;margin:0 auto 18px;border-radius:50%;background:#eafaf1;font-size:26px;text-align:center;">${icon}</div>
      <h1 style="margin:0 0 14px;font-size:21px;color:#1a365d;">${escapeHtml(heading)}</h1>
      <div style="color:#4a5568;font-size:14px;line-height:1.7;text-align:left;padding-bottom:28px;">${bodyHtml}</div>
    </div>
    <div style="background:#f7fdf9;padding:16px 32px;text-align:center;border-top:1px solid #eef7f1;">
      <p style="margin:0;color:#9ba7ac;font-size:11px;">Sangguniang Bayan Office System — ${footerNote}</p>
    </div>
  </div>
`

// Every existing call site only ever passed (heading, bodyHtml) — the
// optional `icon` param defaults to a generic bell so none of them needed
// touching for the new look.
const notificationEmailHtml = (heading, bodyHtml, icon = '🔔') =>
  emailShell({ icon, heading, bodyHtml })

// Email-only — there is no in-app notification list, so this just emails
// the recipient unless they've opted out via users.email_notifications. A
// missing/falsy recipientId is a no-op rather than an error — callers
// resolving "the Clerk who drafted this" etc. may legitimately have nothing
// to notify (record predates created_by tracking). Callers still pass
// `message`/`entityType`/`entityId` (harmless extra fields, ignored here) so
// every trigger-site call didn't need touching when the in-app list was
// dropped.
async function notify({ recipientId, emailSubject, emailHtml }) {
  if (!recipientId) return
  try {
    const { data: user } = await supabase
      .from('users').select('email, name, email_notifications').eq('id', recipientId).single()
    if (user?.email && user.email_notifications) {
      await sendEmail({ to: [{ email: user.email, name: user.name }], subject: emailSubject, htmlContent: emailHtml })
    }
  } catch (err) {
    console.error('Notification email failed:', err.message)
  }
}

// Same fields, many recipients — de-duplicated so a user who somehow
// qualifies twice (shouldn't happen, but position lookups are cheap to be
// defensive about) doesn't get double-notified.
async function notifyMany(recipientIds, fields) {
  const ids = [...new Set((recipientIds || []).filter(Boolean))]
  await Promise.all(ids.map((recipientId) => notify({ recipientId, ...fields })))
}

// Notifies every active user holding a given position (e.g. all Secretaries)
// — used wherever the trigger matrix names a role rather than a specific
// person, since a role can be held by more than one account.
async function notifyByPosition(position, fields) {
  const { data, error } = await supabase
    .from('users').select('id').eq('position', position).eq('is_archived', false)
  if (error) {
    console.error('notifyByPosition lookup failed:', error.message)
    return
  }
  await notifyMany((data || []).map((u) => u.id), fields)
}

// Notifies every active staff account regardless of position — Secretary,
// Clerk, Vice-Mayor, Councilor — used for office-wide events like a new
// calendar schedule, where the matrix names "all active staff" rather than
// one role.
async function notifyAllStaff(fields) {
  const { data, error } = await supabase
    .from('users').select('id').not('position', 'is', null).eq('is_archived', false)
  if (error) {
    console.error('notifyAllStaff lookup failed:', error.message)
    return
  }
  await notifyMany((data || []).map((u) => u.id), fields)
}

module.exports = {
  notify, notifyMany, notifyByPosition, notifyAllStaff,
  notificationEmailHtml, emailShell, BRAND_GREEN, BRAND_GREEN_DARK,
}
