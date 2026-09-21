// Covers the number-based ordering of published ordinances/resolutions
// (recordNumberKey / sortByRecordNumber in helpers/utils.js). Pure logic.
const { ok, summary } = require('./_helpers')
const { recordNumberKey, sortByRecordNumber } = require('../helpers/utils')

const nums = (rows) => rows.map((r) => r.n)

let k = recordNumberKey('Municipal Ordinance No. 2025-04')
ok('key: year-first ordinance number', k.year === 2025 && k.seq === 4, JSON.stringify(k))

k = recordNumberKey('RESOLUTION NO. 02 - 2025')
ok('key: sequence-first resolution number', k.year === 2025 && k.seq === 2, JSON.stringify(k))

k = recordNumberKey('RES-2025-045')
ok('key: legacy RES-YYYY-NNN', k.year === 2025 && k.seq === 45, JSON.stringify(k))

k = recordNumberKey(null)
ok('key: no number -> 0 / 0', k.year === 0 && k.seq === 0)

const ordinances = [
  { n: 'Municipal Ordinance No. 2025-04' },
  { n: 'Municipal Ordinance No. 2025-03' },
  { n: 'Municipal Ordinance No. 2025-02' },
  { n: 'Municipal Ordinance No. 2025-01' },
  { n: 'Municipal Ordinance No. 2025-08' },
  { n: 'Municipal Ordinance No. 2025-09' },
]
ok('ordinances: highest number first (09, 08, 04, 03, 02, 01)',
  nums(sortByRecordNumber(ordinances, 'n')).map((s) => s.slice(-2)).join(',') === '09,08,04,03,02,01')

const mixed = [
  { n: 'Municipal Ordinance No. 2025-10' },
  { n: 'Municipal Ordinance No. 2026-01' },
  { n: 'Municipal Ordinance No. 2025-9' },
]
ok('a new year comes before every number of the old one, and 10 beats 9 numerically',
  nums(sortByRecordNumber(mixed, 'n')).join('|') ===
    'Municipal Ordinance No. 2026-01|Municipal Ordinance No. 2025-10|Municipal Ordinance No. 2025-9')

const res = [{ n: 'RESOLUTION NO. 02 - 2025' }, { n: 'RESOLUTION NO. 11 - 2025' }, { n: 'RESOLUTION NO. 01 - 2026' }]
ok('resolutions: sorted by year then sequence',
  nums(sortByRecordNumber(res, 'n')).join('|') === 'RESOLUTION NO. 01 - 2026|RESOLUTION NO. 11 - 2025|RESOLUTION NO. 02 - 2025')

const ties = [{ n: null, id: 1 }, { n: null, id: 2 }, { n: 'X 2025-01', id: 3 }]
ok('no-number records go last and keep their incoming order',
  sortByRecordNumber(ties, 'n').map((r) => r.id).join(',') === '3,1,2')

const before = [{ n: 'A 2025-01' }, { n: 'A 2025-02' }]
sortByRecordNumber(before, 'n')
ok('does not reorder the caller\'s array', before[0].n === 'A 2025-01')

summary('record-order.test.js')
