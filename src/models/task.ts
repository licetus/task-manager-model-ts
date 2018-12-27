import { DataModel } from './base'

export interface TaskData {
  id?: number
  isCompleted?: boolean
  title?: string
  content?: string
  deadline?: number
}

export class Task extends DataModel {
  props: TaskData = {}

  private schema: string[] = [
    'id',
    'isCompleted',
    'title',
    'content',
    'deadline',
  ]
  getShema(): string[] {
    return this.schema
  }

  constructor(data?: TaskData) {
    super('task', 'task')
    if (data) {
      if (data.id) this.props.id = data.id
      if (data.isCompleted) this.props.isCompleted = data.isCompleted
      if (data.title) this.props.title = data.title
      if (data.content) this.props.content = data.content
      if (data.deadline) this.props.deadline = data.deadline
    }
  }

}