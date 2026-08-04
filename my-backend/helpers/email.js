const SibApiV3Sdk = require('sib-api-v3-sdk')

const brevoClient = SibApiV3Sdk.ApiClient.instance
brevoClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY
const emailApi = new SibApiV3Sdk.TransactionalEmailsApi()

// Sends one transactional email via Brevo. Pass `bcc` for office-wide
// broadcasts so recipients don't see each other's addresses — put a single
// internal address (e.g. the sender) in `to` and the real recipient list in
// `bcc` instead of stacking everyone into `to`.
const sendEmail = async ({ to, bcc, subject, htmlContent }) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()
  sendSmtpEmail.sender = { name: 'Sangguniang Bayan Balilihan', email: process.env.BREVO_SENDER_EMAIL }
  sendSmtpEmail.to = to
  if (bcc?.length) sendSmtpEmail.bcc = bcc
  sendSmtpEmail.subject = subject
  sendSmtpEmail.htmlContent = htmlContent
  await emailApi.sendTransacEmail(sendSmtpEmail)
}

module.exports = { sendEmail }
