import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import log4js from 'log4js'
import { PgManager } from '../src/db/manager'
import * as config from './config/config.json'

chai.use(chaiAsPromised)
chai.should()

const log = log4js.getLogger()

before (async() => {
  const pgConfig = {
    connections: config.database.postgres
  }
  const pgManager = new PgManager(pgConfig)
  await pgManager.rebuild()
  log.info(`Current db version: ${pgManager.version}`)
})

after ((done: Function) => {
  done()
})