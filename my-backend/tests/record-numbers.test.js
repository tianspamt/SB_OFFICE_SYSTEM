// Covers how the next official number is written (formatLike in
// helpers/recordNumbers.js): it copies the latest record's wording and
// zero-padding and only swaps the sequence and year. Pure logic — needs
// neither the server nor the database. The "latest + 1" rule itself runs
// against real published numbers, so it's checked through Publish instead.
const { ok, summary } = require('./_helpers')
const { formatLike } = require('../helpers/recordNumbers')

ok('resolution format: 13-2025 → 14-2025',
  formatLike('RESOLUTION NO. 13-2025', 2025, 14) === 'RESOLUTION NO. 14-2025')
ok('ordinance format (year first): 2025-17 → 2025-18',
  formatLike('Municipal Ordinance No. 2025-17', 2025, 18) === 'Municipal Ordinance No. 2025-18')
ok('keeps two-digit padding: 08 → 09',
  formatLike('RESOLUTION NO. 08-2025', 2025, 9) === 'RESOLUTION NO. 09-2025')
ok('keeps wider padding: RES-2025-045 → RES-2025-046',
  formatLike('RES-2025-045', 2025, 46) === 'RES-2025-046')
ok('a new year swaps the year and restarts at 01',
  formatLike('Municipal Ordinance No. 2025-17', 2026, 1) === 'Municipal Ordinance No. 2026-01')
ok('grows past the padding when needed: 99 → 100',
  formatLike('RESOLUTION NO. 99-2025', 2025, 100) === 'RESOLUTION NO. 100-2025')

summary('record-numbers.test.js')
