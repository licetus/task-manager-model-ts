import log4js from 'log4js'
import * as config from '../test/config/config.json'
import { PgManager } from '../src/db/manager'

const log = log4js.getLogger()

const init = async () => {
  const managerConfig = {
    connections: config.database.postgres
  }
  const pgManager = new PgManager(managerConfig)
  const version = await pgManager.getCurrentVersion()
  log.info(`Before update db version: ${version}`)
  await pgManager.update()
  log.info(`After update db version: ${pgManager.version}`)
}

init().catch((err) => {
  console.error(err.stack)
})