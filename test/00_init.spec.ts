import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import log4js from 'log4js'
import { PgManager } from '../src/db/manager'

chai.use(chaiAsPromised)
chai.should()

const log = log4js.getLogger()

export const checkObject = (obj: any, data: any) => {
  Object.keys(data).forEach((key) => {
    if (key !== 'id' && data[key]) obj[key].should.equal(data[key])
  })
}

before (async() => {
  const pgManager = new PgManager()
  await pgManager.rebuild()
  log.info(`Current db version: ${pgManager.version}`)
})

after ((done: Function) => {
  done()
})