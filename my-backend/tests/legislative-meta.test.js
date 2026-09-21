// Covers the rule-based number/date extraction behind the upload form's
// "detect from document" prefill (helpers/legislativeMeta.js and the
// year cross-check in helpers/documentMeta.js), plus reading a real text-layer
// PDF end to end. Unlike the other files in this folder it needs neither the
// server nor the database — it's pure logic on strings and one in-memory PDF.
const { ok, summary } = require('./_helpers')
const { extractLegislativeMeta } = require('../helpers/legislativeMeta')
const { extractRecordMeta, _finalize } = require('../helpers/documentMeta')
const { yearInManila } = require('../helpers/utils')

const ORDINANCE = 'ordinance'

function textPdf(lines) {
  const parts = []
  const offs = []
  let len = 0
  const push = (s) => { const b = Buffer.from(s, 'latin1'); parts.push(b); len += b.length }
  const obj = (n, body) => { offs[n] = len; push(`${n} 0 obj\n${body}\nendobj\n`) }
  push('%PDF-1.4\n')
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>')
  obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
  obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>')
  obj(4, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  const content = 'BT /F1 12 Tf 14 TL 50 780 Td ' + lines.map((l) => `(${l}) '`).join(' ') + ' ET'
  obj(5, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`)
  const xref = len
  push('xref\n0 6\n0000000000 65535 f \n')
  for (let i = 1; i <= 5; i++) push(`${String(offs[i]).padStart(10, '0')} 00000 n \n`)
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`)
  return Buffer.concat(parts)
}

async function main() {
  // ── number ───────────────────────────────────────────────────────────────
  let m = extractLegislativeMeta('MUNICIPAL ORDINANCE NO. 2026-011\nAN ORDINANCE ...', ORDINANCE)
  ok('number: "ORDINANCE NO. 2026-011" -> Municipal Ordinance No. 2026-011', m.number === 'Municipal Ordinance No. 2026-011', m.number)

  m = extractLegislativeMeta('ORDINANCE NO. 2O26-O11\nENACTED this 12th day of March, 2O26', ORDINANCE)
  ok('number: OCR "O" for "0" is corrected', m.number === 'Municipal Ordinance No. 2026-011', m.number)

  m = extractLegislativeMeta('ORDINANCE NO. l2, Series of 1998', ORDINANCE)
  ok('number: OCR "l" for "1" + "Series of" year -> 1998-012', m.number === 'Municipal Ordinance No. 1998-012', m.number)

  m = extractLegislativeMeta('RESOLUTION NO. 45-2026\nADOPTED this 3rd day of February 2026', 'resolution')
  ok('number: resolution, sequence-first form -> RESOLUTION NO. 45 - 2026', m.number === 'RESOLUTION NO. 45 - 2026', m.number)

  m = extractLegislativeMeta('Resolution No. 2, Series of 2025\nADOPTED this 3rd day of February 2025', 'resolution')
  ok('number: resolution sequence is padded to two digits, year after a dash', m.number === 'RESOLUTION NO. 02 - 2025', m.number)

  m = extractLegislativeMeta('Amending Ordinance No. 5, series of 2001.\n\nORDINANCE NO. 7 ...', ORDINANCE)
  ok('number: a reference to another ordinance is ignored', m.number === 'Municipal Ordinance No. 7', String(m.number))

  m = extractLegislativeMeta('the ordinance no longer applies', ORDINANCE)
  ok('number: prose like "ordinance no longer" is not a match', m.number === null, String(m.number))

  // ── date ─────────────────────────────────────────────────────────────────
  m = extractLegislativeMeta(
    'ORDINANCE NO. 2026-011\nENACTED this 12th day of March, 2026.\nAPPROVED: March 20, 2026', ORDINANCE)
  ok('date: "enacted" outranks "approved"', m.date === '2026-03-12', m.date)

  m = extractLegislativeMeta('ORDINANCE NO. 3\nENACTED this 12th day of Marcb, 2O26', ORDINANCE)
  ok('date: misspelled month and OCR digits still parse', m.date === '2026-03-12', m.date)

  m = extractLegislativeMeta(
    'ORDINANCE NO. 9\nEnacted on October 5, 1998. This Ordinance takes effect on January 1, 1999.', ORDINANCE)
  ok('date: an "effective on" date is not picked over the enactment date', m.date === '1998-10-05', m.date)

  m = extractLegislativeMeta('ORDINANCE NO. 7 ... passed 05/06/1999', ORDINANCE)
  ok('date: numeric mm/dd/yyyy parsed', m.date === '1999-05-06', m.date)

  m = extractLegislativeMeta('ORDINANCE NO. 7\nFebruary 31, 2026', ORDINANCE)
  ok('date: an impossible calendar date is rejected', m.date === null, String(m.date))

  const approvedDoc = 'ORDINANCE NO. 12, Series of 1998\nENACTED this 5th day of October, 1998.\nAPPROVED: October 14, 1998'
  m = extractLegislativeMeta(approvedDoc, ORDINANCE, { preferApproved: true })
  ok('date: preferApproved (Publish dialog) picks the approval line', m.date === '1998-10-14', m.date)
  m = extractLegislativeMeta(approvedDoc, ORDINANCE)
  ok('date: without preferApproved the enactment date still wins', m.date === '1998-10-05', m.date)

  m = extractLegislativeMeta('nothing useful in here', ORDINANCE)
  ok('nothing detectable -> all null', m.number === null && m.date === null)

  // ── session minutes / order of business ──────────────────────────────────
  m = extractLegislativeMeta(
    'REPUBLIC OF THE PHILIPPINES\nMINUTES OF THE 2ND REGULAR SESSION OF THE SANGGUNIANG BAYAN\nheld at the Session Hall on March 5, 2026 at 9:00 AM', 'minutes')
  ok('minutes: "2ND REGULAR SESSION" + date -> "MINUTES NO. 02 - 2026"', m.number === 'MINUTES NO. 02 - 2026' && m.sessionType === 'regular', m.number)
  ok('minutes: date read from the "held on" line', m.date === '2026-03-05', m.date)
  ok('minutes: venue read from "held at the ..."', m.venue === 'Session Hall', m.venue)

  m = extractLegislativeMeta('ORDER OF BUSINESS\nfor the Twelfth Special Session\nOctober 14, 2025', 'agenda')
  ok('agenda: worded ordinal + special -> "AGENDA NO. 12 - 2025"', m.number === 'AGENDA NO. 12 - 2025' && m.sessionType === 'special', m.number)

  m = extractLegislativeMeta('Agenda for the twenty-first regular session on 01/06/2026', 'agenda')
  ok('agenda: compound ordinal "twenty-first" -> AGENDA NO. 21 - 2026', m.number === 'AGENDA NO. 21 - 2026', m.number)

  m = extractLegislativeMeta('AGENDA NO. 3 - 2024\nRegular Session held on February 9, 2025', 'agenda')
  ok('agenda: the document\'s own "AGENDA NO. 3 - 2024" is used, with its own year', m.number === 'AGENDA NO. 03 - 2024' && m.sessionType === 'regular', m.number)

  m = extractLegislativeMeta('MINUTES NO. 7\nheld on June 2, 2026', 'minutes')
  ok('minutes: own number with no year takes the date\'s year', m.number === 'MINUTES NO. 07 - 2026', m.number)

  m = extractLegislativeMeta(
    'MINUTES OF THE 5TH REGULAR SESSION\nMarch 5, 2026\n\n3. Reading and approval of the minutes of the 4th regular session', 'minutes')
  ok('minutes: a mention of another session further down is ignored', m.number === 'MINUTES NO. 05 - 2026', m.number)

  m = extractLegislativeMeta('Minutes of the Regular Session held on May 3, 2026', 'minutes')
  ok('minutes: no number -> no title, but the type and date are still found',
    m.number === null && m.sessionType === 'regular' && m.date === '2026-05-03', `${m.number}/${m.sessionType}/${m.date}`)

  m = extractLegislativeMeta('nothing about a session here', 'minutes')
  ok('minutes: nothing detectable -> all null', m.number === null && m.sessionType === null && m.date === null && m.venue === null)

  // ── year cross-check ─────────────────────────────────────────────────────
  const base = {
    number: 'Municipal Ordinance No. 1998-012', numberRaw: 'x', numberConfidence: 'high', numberYear: 1998,
    date: '1993-10-05', dateRaw: 'r', dateConfidence: 'high',
    dateCandidates: [
      { value: '1993-10-05', raw: 'a', score: 10, confidence: 'high' },
      { value: '1998-10-05', raw: 'b', score: 9, confidence: 'high' },
    ],
  }
  let f = _finalize(base)
  ok('year check: prefers a date whose year matches the number\'s', f.date === '1998-10-05' && f.yearMismatch === false, f.date)

  f = _finalize({ ...base, dateCandidates: [base.dateCandidates[0]] })
  ok('year check: flags a mismatch when nothing agrees', f.date === '1993-10-05' && f.yearMismatch === true)

  f = _finalize({ ...base, numberYear: null })
  ok('year check: no year on the number -> no mismatch flag', f.yearMismatch === false)

  // ── approval year (Philippine time) ─────────────────────────────────────
  ok('year: 1 Jan 01:00 PH (still 31 Dec in UTC) counts as the new year', yearInManila('2025-12-31T17:00:00Z') === 2026)
  ok('year: 31 Dec 23:59 PH is still that year', yearInManila('2026-12-31T15:59:00Z') === 2026)
  ok('year: noon-UTC publish-dialog dates keep their calendar year', yearInManila('1998-10-14T12:00:00.000Z') === 1998)

  // ── end to end on a real PDF text layer ──────────────────────────────────
  const pdf = textPdf([
    'REPUBLIC OF THE PHILIPPINES', 'MUNICIPAL ORDINANCE NO. 2026-011', 'Some title here',
    'ENACTED this 12th day of March, 2026.',
  ])
  const meta = await extractRecordMeta({ mimetype: 'application/pdf', buffer: pdf }, ORDINANCE)
  ok('pdf text layer: number + date read without OCR',
    meta.number === 'Municipal Ordinance No. 2026-011' && meta.date === '2026-03-12' && meta.ocrPasses === 0,
    `${meta.number} / ${meta.date} / passes=${meta.ocrPasses}`)

  summary('legislative-meta.test.js')
}

main().catch((err) => { console.error(err); process.exitCode = 1 })
