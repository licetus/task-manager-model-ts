import { getLogger } from 'log4js'
import { PgManager } from '../src/db/manager'

const log = getLogger()

const init = async () => {
  const pgManager = new PgManager()
  await pgManager.rebuild()
  log.info(`Current db version: ${pgManager.version}`)
}

init().catch((err) => {
  console.error(err.stack)
})