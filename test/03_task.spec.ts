import { checkObject } from './00_init.spec'
import { Model } from '../'


const taskDataAdd = { isCompleted: true, title: 'test title', content: 'test content', deadline: 2147483656 }
const taskDataUpdate = { isCompleted: false, title: 'test title', content: 'test content', deadline: 2147483656 }

describe('* task =======================', () => {
  let taskId: number

  describe('  task: create/update/fetch/delete', () => {
    it('Create(save)', async () => {
      const data = taskDataAdd
      const object = await new Model.Task(data).save()
      object.props.should.have.property('id')
      taskId = object.props.id as number
      checkObject(object.props, data)
    })
    it('Update', async () => {
      const data = Object.assign({
        id: taskId
      }, taskDataUpdate)
      await new Model.Task(data).update()
      const res = await new Model.Task().get(taskId)
      checkObject(res, taskDataUpdate)
    })
    it('Fetch', async () => {
      let res = await new Model.Task().getList()
      res.should.have.property('length')
      res.length.should.above(0)
      res = await new Model.Task().get(taskId)
      checkObject(res, taskDataUpdate)
    })

    it('Delete', async () => {
      const id = taskId
      await new Model.Task().delete(id)
      const isExist = await new Model.Task().isExist(id)
      isExist.should.equal(false)
    })
  })
})