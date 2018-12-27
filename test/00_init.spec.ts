import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import log4js from 'log4js'
import { Database } from '../src/db'
import { PgManager } from '../src/db/manager'
import config from './config/config.json'

chai.use(chaiAsPromised)
chai.should()

const log = log4js.getLogger()

export const db = new Database()

export const checkObject = (obj: any, data: any) => {
  Object.keys(data).forEach((key) => {
    if (key !== 'id' && data[key]) obj[key].should.equal(data[key])
  })
}

before (async() => {
  const pgManager = new PgManager({
    pgConfig: config
  })
  await pgManager.rebuild()
  log.info(`Current db version: ${pgManager.version}`)
})

after ((done: Function) => {
  done()
})