// Runs every *.test.js in this folder as its own process (so one file's
// process.exitCode doesn't bleed into the next) and fails the overall run
// if any of them did. See tests/README.md for what these need to run at all.
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const files = fs.readdirSync(__dirname).filter((f) => f.endsWith('.test.js')).sort()

let anyFailed = false
for (const file of files) {
  console.log(`\n=== ${file} ===`)
  const result = spawnSync(process.execPath, [path.join(__dirname, file)], { stdio: 'inherit' })
  if (result.status !== 0) anyFailed = true
}

process.exit(anyFailed ? 1 : 0)
