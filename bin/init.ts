import log4js from 'log4js'
import config from '../test/config/config.json'
import { PgManager } from '../src/db/manager'

const log = log4js.getLogger()

const init = async () => {
  const managerConfig = {
    connections: config.database.postgres
  }
  const pgManager = new PgManager(managerConfig)
  await pgManager.rebuild()
  log.info(`Current db version: ${pgManager.version}`)
}

init().catch((err) => {
  console.error(err.stack)
})