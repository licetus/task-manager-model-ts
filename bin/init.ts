import { getLogger } from 'log4js'
import { PgManager } from '../src/db/manager'
import * as config from '../test/config/config.json'

// const config = require('../test/config/config.json')
const log = getLogger()

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