import { promisify } from 'bluebird'
import { ncp } from 'ncp'

const copy = async () => {
  const n: any = promisify(ncp)
  await n('src/db/patches', 'dist/db/patches', (err: Error) => {
    console.log('err', err)
  })
  // add models
}

const format = (time: Date) => {
  return time.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1')
}

const build = async () => {
  const start = new Date()
  console.log(`[${format(start)}] cleanup...`)
  console.log(`[${format(start)}] Starting build...`)
  await copy()
  const end = new Date()
  const eslapse = end.getTime() - start.getTime()
  console.log(`[${format(end)}] Finished build after ${eslapse} ms`)
}

build().catch((err) => {
  console.log(err)
})