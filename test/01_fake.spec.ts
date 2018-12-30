import fs from 'fs'
import path from 'path'
import { sqlizeListParams } from '../src/utils'
import { db } from '../'


describe('* Test data ============================', () => {
  it('Create fake test data', async () => {
    const dataPath = path.join(__dirname, 'data')
    const files = fs.readdirSync(dataPath)
    files.sort()
    const queryArr = []
    for (const f of files) {
      queryArr.push(fs.readFileSync(path.join(dataPath, f.toString())))
    }
    const query = queryArr.join(';')
    await db.query(query)
  })
  it('Check fake test data', async () => {
    const checkQuery = `
      SELECT * FROM "task".task
    `
    const res = await db.query(checkQuery)
    res.rowCount.should.equal(6)
    res.rows.forEach((item: any, index: number) => {
      item.id.should.equal(parseInt(`20338879906000${index + 1}`))
      item.is_completed.should.equal(index % 2 === 1 ? true : false)
      item.title.should.equal(`task_0${index + 1}`)
      item.content.should.equal(`test task 0${index + 1}`)
      item.deadline.should.equal(parseInt(`151600827000${index + 1}`))
      item.create_time.should.equal(parseInt(`151600827001${index + 1}`))
      item.last_update_time.should.equal(parseInt(`151600827002${index + 1}`))
    })
  })
})

describe('* Test generate list params =============', () => {
  it('Check filter', () => {
    const params = {
      filters: [`wow LIKE '%TEMP%'`, 'userId >= 1', `userName = 'Lily'`, 'users @> array[1]'],
    }
    const string = sqlizeListParams('id', params)
    const answer = ['%TEMP%', 1, 'Lily']
    string.should.equal(` WHERE wow LIKE '%TEMP%' AND user_id >= 1 AND user_name = 'Lily' AND users @> array[1] ORDER BY id DESC `)
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
    const string = sqlizeListParams('id', params)
    string.should.equal('  ORDER BY id DESC LIMIT 10')
  })
})