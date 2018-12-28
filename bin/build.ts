import { promisify } from 'bluebird'
import del from 'del'

const copy = async () => {
  const n: any = promisify(require('ncp').ncp)
  await n('src/db/patches', 'dist/patches')
  // add models
}

const format = (time: Date) => {
  return time.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1')
}

const build = async () => {
  const start = new Date()
  console.log(`[${format(start)}] cleanup...`)
  await del(['.tmp', 'dist/*', '!dist/,git'], { dot: true })
  console.log(`[${format(start)}] Starting build...`)
  await copy()
  const end = new Date()
  const eslapse = end.getTime() - start.getTime()
  console.log(`[${format(end)}] Finished build after ${eslapse} ms`)
}

build().catch(err => {
  console.error(err.stack)
})