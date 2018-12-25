import { getLogger } from 'log4js'
import { PgManager } from '../src/db/manager'
import config from '../test/config/config.json'

const log = getLogger()

const init = async () => {
  const pgManager = new PgManager({
    pgConfig: config,
  })
  await pgManager.rebuild()
  log.info(`Current db version: ${pgManager.version}`)
}

init().catch((err) => {
  console.error(err.stack)
})