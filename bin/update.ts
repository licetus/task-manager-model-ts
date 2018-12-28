import log4js from 'log4js'
import { PgManager } from '../src/db/manager'

const log = log4js.getLogger()

const init = async () => {
  const pgManager = new PgManager()
  const version = await pgManager.getCurrentVersion()
  log.info(`Before update db version: ${version}`)
  await pgManager.update()
  log.info(`After update db version: ${pgManager.version}`)
}

init().catch((err) => {
  console.error(err.stack)
})