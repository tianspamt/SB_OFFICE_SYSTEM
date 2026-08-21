require('dotenv').config({ path: require('path').resolve(__dirname, '.env') })
const jwt = require('jsonwebtoken')
const { chromium } = require('playwright')

const token = jwt.sign(
  { id: 1, username: 'admin', email: 'admin@email.com', role: 'admin', name: 'Admin Name', position: 'secretary' },
  process.env.JWT_SECRET,
  { expiresIn: '1h', issuer: 'sangguniang-bayan-system', audience: 'sb-client' }
)
const user = { id: 1, name: 'Admin Name', username: 'admin', email: 'admin@email.com', role: 'admin', position: 'secretary' }

const OUT = 'C:/Users/ferdinandroylopez/OneDrive/Documents/THESIS/SB USER SIDE/SB_OFFICE_SYSTEM/my-backend'

;(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push('pageerror: ' + err.message))
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push('console.error: ' + msg.text()) })

  // Seed a logged-in session, then land on the dashboard.
  await page.goto('http://localhost:5173')
  await page.evaluate(([t, u]) => {
    localStorage.setItem('token', t)
    localStorage.setItem('user', JSON.stringify(u))
  }, [token, user])
  await page.goto('http://localhost:5173/dashboard')
  await page.waitForSelector('text=SANGGUNIANG BAYAN OFFICE', { timeout: 15000 })
  await page.screenshot({ path: `${OUT}/_check_1_dashboard.png` })
  console.log('[1] Dashboard rendered, screenshot saved.')
  console.log('    console/page errors after load:', errors.length ? errors : 'none')

  // Navigate to Manage Users, find the disposable test user, archive it,
  // and confirm the new floating toast appears (this is the actual thing
  // being verified — the old in-flow banner is gone, replaced by Toast.jsx).
  await page.click('text=Manage Users')
  await page.waitForSelector('text=diagtoasttarget', { timeout: 10000 })
  console.log('[2] Found test user row.')

  const row = page.locator('tr', { hasText: 'diagtoasttarget' })
  await row.getByRole('button', { name: /Archive/i }).click()
  await page.waitForSelector('text=Archive this user?', { timeout: 5000 })
  await page.getByRole('button', { name: /^Archive$/i }).click()

  // The toast is the whole point of this check.
  await page.waitForSelector('.toast-item', { timeout: 5000 })
  await page.screenshot({ path: `${OUT}/_check_2_toast.png` })
  console.log('[3] Toast appeared, screenshot saved.')
  console.log('    console/page errors after archive action:', errors.length ? errors : 'none')

  // Confirm the OLD in-flow banner class is nowhere in the DOM anymore.
  const oldBannerCount = await page.locator('.message').count()
  console.log('    old in-flow .message banner still present:', oldBannerCount > 0 ? 'YES (unexpected)' : 'no (expected)')

  await browser.close()
})().catch((err) => {
  console.error('SCRIPT FAILED:', err.message)
  process.exit(1)
})
