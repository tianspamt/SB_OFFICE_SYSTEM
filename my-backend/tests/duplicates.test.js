// Covers the duplicate title/number trap (helpers/duplicates.js) with the
// Supabase client stubbed out, so it needs neither the server nor the database.
const { ok, summary } = require('./_helpers')

const rows = [
  { id: 1, title: 'AN ORDINANCE REGULATING TRICYCLES', ordinance_number: 'Municipal Ordinance No. 2025-011', status: 'published' },
  { id: 2, title: 'AN ORDINANCE ON WASTE', ordinance_number: null, status: 'pending' },
  { id: 3, title: 'AN ORDINANCE ON NOISE', ordinance_number: null, status: 'rejected' },
]

// Minimal stand-in for supabase.from(t).select(..).neq(..) resolving to rows.
const supabasePath = require.resolve('../config/supabase')
require.cache[supabasePath] = {
  id: supabasePath, filename: supabasePath, loaded: true,
  exports: {
    from: () => ({
      select: () => {
        let list = rows
        const q = {
          neq: (_col, val) => { list = list.filter((r) => r.id !== val); return q },
          then: (resolve) => resolve({ data: list, error: null }),
        }
        return q
      },
    }),
  },
}

const { findDuplicateRecord, duplicateMessage } = require('../helpers/duplicates')
const find = (args) => findDuplicateRecord({ table: 'ordinances', numberField: 'ordinance_number', ...args })

async function main() {
  let d = await find({ title: 'An Ordinance Regulating Tricycles' })
  ok('title: same title in other capitals is a duplicate', d?.field === 'title' && d.record.id === 1)

  d = await find({ title: '  AN  ORDINANCE   REGULATING TRICYCLES ' })
  ok('title: extra spaces are ignored', d?.field === 'title')

  d = await find({ title: 'AN ORDINANCE REGULATING BOATS' })
  ok('title: a different title is fine', d === null)

  d = await find({ title: 'AN ORDINANCE ON NOISE' })
  ok('title: a rejected record does not block its own title', d === null)

  d = await find({ number: 'municipal ordinance  no. 2025-011' })
  ok('number: same number in other case/spacing is a duplicate', d?.field === 'number' && d.record.id === 1)

  d = await find({ number: 'Municipal Ordinance No. 2025-012' })
  ok('number: a different number is fine', d === null)

  d = await find({ number: '' , title: '' })
  ok('nothing to check -> no duplicate', d === null)

  d = await find({ number: 'Municipal Ordinance No. 2025-011', excludeId: 1 })
  ok('a record is never a duplicate of itself', d === null)

  d = await find({ title: 'AN ORDINANCE ON WASTE', excludeId: 2 })
  ok('editing a record keeps its own title', d === null)

  d = await find({ number: 'Municipal Ordinance No. 2025-011', title: 'AN ORDINANCE ON WASTE' })
  ok('a number clash is reported before a title clash', d?.field === 'number')

  const msg = duplicateMessage({ field: 'title', record: rows[0] }, {
    lower: 'ordinance', numberField: 'ordinance_number', title: 'AN ORDINANCE REGULATING TRICYCLES',
  })
  ok('title message names the other record\'s number', msg.includes('Municipal Ordinance No. 2025-011'), msg)

  summary('duplicates.test.js')
}

main().catch((err) => { console.error(err); process.exitCode = 1 })
