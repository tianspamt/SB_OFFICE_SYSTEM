// Covers the name rules behind account linking (helpers/accountLinks.js) and
// the author-approval stage mapping (helpers/authorApprovals.js). Pure logic —
// needs neither the server nor the database. `normalizeName` equality is what
// Option B auto-links on, so its false positives matter most: a wrong link
// would let one councilor approve another's ordinances.
const { ok, summary } = require('./_helpers')
const { normalizeName, isSimilarName, TERM_TO_USER_POSITION } = require('../helpers/accountLinks')
const { stageForStatus } = require('../helpers/authorApprovals')

// ── normalizeName (automatic linking) ─────────────────────────────────────────
ok('drops "Hon." so the official record matches the account name',
  normalizeName('Hon. Juan D. Cruz') === normalizeName('Juan D. Cruz'))
ok('folds ñ and accents (Paña = Pana)',
  normalizeName('Angel Mae Paña') === normalizeName('Angel Mae Pana'))
ok('ignores letter case and extra spaces',
  normalizeName('  JUAN   dela CRUZ ') === normalizeName('Juan Dela Cruz'))
ok('a missing middle initial is NOT an automatic match',
  normalizeName('Juan D. Cruz') !== normalizeName('Juan Cruz'))
ok('different people with a shared surname are not a match',
  normalizeName('Maria Cruz') !== normalizeName('Juan Cruz'))
ok('an empty name normalizes to empty (never auto-links)', normalizeName('Hon.') === '')

// ── isSimilarName (one-time "Suggest matches" only) ───────────────────────────
ok('suggests "Juan Cruz" for "Hon. Juan Dela Cruz"', isSimilarName('Juan Cruz', 'Hon. Juan Dela Cruz'))
ok('suggests across a missing middle initial', isSimilarName('Juan D. Cruz', 'Juan Cruz'))
ok('does not suggest a different first name', !isSimilarName('Maria Cruz', 'Juan Cruz'))

// ── seat mapping ──────────────────────────────────────────────────────────────
ok('every term position maps to an account position',
  TERM_TO_USER_POSITION['Councilor'] === 'councilor' &&
  TERM_TO_USER_POSITION['Vice Mayor'] === 'vice_mayor' &&
  TERM_TO_USER_POSITION['Liga ng mga Barangay President'] === 'liga_ng_mga_barangay' &&
  TERM_TO_USER_POSITION['SK Federated President'] === 'sk_federated')

// ── approval stages ───────────────────────────────────────────────────────────
ok('each reading is its own approval stage',
  ['first_reading', 'second_reading', 'third_reading'].every((s) => stageForStatus(s) === s))
ok('after the Vice-Mayor approves, the stage is the final "publish" approval',
  stageForStatus('approved') === 'publish')
ok('pending / ready_to_publish / published need no author approval',
  ['pending', 'ready_to_publish', 'published', 'rejected'].every((s) => stageForStatus(s) === null))

summary('account-links.test.js')
