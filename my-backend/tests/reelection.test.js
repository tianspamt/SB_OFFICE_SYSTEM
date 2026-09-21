// Covers the automatic "Re-elected" flag for a new council term
// (isConsecutiveReelection in helpers/councils.js). Pure logic — needs neither
// the server nor the database.
const { ok, summary } = require('./_helpers')
const { isConsecutiveReelection } = require('../helpers/councils')

const prev = (term_period, extra = {}) => ({ term_period, ...extra })

ok('2022-2025 then 2025-2028 is a consecutive re-election',
  isConsecutiveReelection({ term_period: '2025-2028' }, [prev('2022-2025')]) === true)

ok('an en dash in the label is read the same way',
  isConsecutiveReelection({ term_period: '2025–2028' }, [prev('2022–2025')]) === true)

ok('a gap year (2019-2022 then 2025-2028) is not a re-election',
  isConsecutiveReelection({ term_period: '2025-2028' }, [prev('2019-2022')]) === false)

ok('a person who has no earlier term is not re-elected',
  isConsecutiveReelection({ term_period: '2025-2028' }, []) === false)

ok('the same council label does not count as its own predecessor',
  isConsecutiveReelection({ term_period: '2025-2028' }, [prev('2025-2028')]) === false)

ok('yearly councils: 2024-2025 then 2025-2026 is consecutive',
  isConsecutiveReelection({ term_period: '2025-2026' }, [prev('2024-2025')]) === true)

ok('any one matching earlier term is enough',
  isConsecutiveReelection({ term_period: '2025-2028' }, [prev('2016-2019'), prev('2022-2025')]) === true)

ok('falls back to the term dates when the label has no years',
  isConsecutiveReelection(
    { term_period: 'Current', term_start: '2025-07-01' },
    [prev('Previous', { term_end: '2025-06-30' })]
  ) === true)

ok('no year to compare against -> not flagged',
  isConsecutiveReelection({ term_period: 'Current' }, [prev('2022-2025')]) === false)

summary('reelection.test.js')
