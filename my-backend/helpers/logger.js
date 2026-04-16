const supabase = require('../config/supabase')

const logActivity = async (req, action, module, description, status = 'success') => {
  try {
    await supabase.from('activity_logs').insert({
      user_id:    req.user?.id || null,
      user_name:  req.user?.name || 'Unknown',
      user_role:  req.user?.role || 'unknown',
      action,
      module,
      description,
      ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      status
    })
  } catch (err) {
    console.error('Log error:', err.message)
  }
}

const autoEndTerms = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const { error } = await supabase
      .from('sb_council_member_terms')
      .update({ status: 'terms_ended' })
      .eq('status', 'active')
      .not('term_end', 'is', null)
      .lt('term_end', today)
    if (error) console.error('autoEndTerms error:', error.message)
  } catch (err) {
    console.error('autoEndTerms exception:', err.message)
  }
}

module.exports = { logActivity, autoEndTerms }
