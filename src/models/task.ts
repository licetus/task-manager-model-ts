import { DataModel } from './base'

export class TaskData {
  id?: number = 0
  isCompleted?: boolean = false
  title?: string = ''
  content?: string = ''
  deadline?: number = 0
  constructor(data?: any) {
    if (data) {
      if (data.id) this.id = data.id
      if (data.isCompleted) this.isCompleted = data.isCompleted
      if (data.title) this.title = data.title
      if (data.content) this.content = data.content
      if (data.deadline) this.deadline = data.deadline
    }
  }
}

export class Task extends DataModel {
  props: TaskData = new TaskData()
  schema: string[] = Object.keys(this.props)
  constructor(data?: any) {
    super('task', 'task')
    if (data) {
      this.props = new TaskData(data)
    }
  }
}