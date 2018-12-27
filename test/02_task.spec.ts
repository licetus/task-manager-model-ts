import { checkObject } from './00_init.spec'
import { Task } from '../src/models/task'


const taskDataAdd = { isCompleted: true, title: 'test title', content: 'test content', deadline: 2147483656 }
const taskDataUpdate = { isCompleted: false, title: 'test title', content: 'test content', deadline: 2147483656 }

describe('* task =======================', () => {
  let taskId: number

  describe('  task: create/update/fetch/delete', () => {
    it('Create(save)', async () => {
      const data = taskDataAdd
      const object = await new Task(data).save()
      object.props.should.have.property('id')
      taskId = object.props.id as number
      checkObject(object.props, data)
    })
    it('Update', async () => {
      const data = Object.assign({
        id: taskId
      }, taskDataUpdate)
      await new Task(data).update()
      const res = await new Task().get(taskId)
      checkObject(res, taskDataUpdate)
    })
    it('Fetch', async () => {
      let res = await new Task().getList()
      res.should.have.property('length')
      res.length.should.above(0)
      res = await new Task().get(taskId)
      checkObject(res, taskDataUpdate)
    })

    it('Delete', async () => {
      const id = taskId
      await new Task().delete(id)
      const isExist = await new Task().isExist(id)
      isExist.should.equal(false)
    })
  })
})