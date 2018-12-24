import fs from 'fs'
import path from 'path'
import { db } from '../src/db'
import { sqlizeListParams } from '../src/utils'

describe('* Test data ============================', () => {
  it('Create fake test data', async () => {
    const dataPath = path.join(__dirname, 'data')
    const files = fs.readFileSync(dataPath)
    files.sort()
    const queryArr = []
    for (const f of files) {
      queryArr.push(fs.readFileSync(path.join(dataPath, f.toString())))
    }
    const query = queryArr.join(';')
    await db.query(query)
  })
})

describe('* Test generate list params =============', () => {
  it('Check filter', () => {
    const params = {
      filters: ['wow LIKE \'%TEMP%\'', 'userId=1', 'userId>=3', 'users@>array[1]'],
    }
    const str = sqlizeListParams('id', params)
    str.should.equal(' WHERE wow LIKE \'%TEMP%\' AND user_id=1 AND user_id>=3 AND users@>array[1] ORDER BY id DESC ')
  })

  it('Check count', () => {
    const params = {
      next: 100,
      pageSize: 1,
      orderBy: 'id desc'
    }
    const str = sqlizeListParams('id', params, true)
    console.log(str)
  })

  it('Check order', () => {
    const params = {
      pageSize: 10,
      orderBy: 'id desc',
    }
    const str = sqlizeListParams('id', params)
    str.should.equal(' ORDER BY id DESC LIMIT 10')
  })
})