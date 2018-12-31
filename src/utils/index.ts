import { snakeCase } from 'lodash'
import { ListParams } from '../models/base'

export const sqlizeListParams = (primaryKey: string, parameters?: any, isSum = false) => {
  if (!parameters) return ''
  const params = new ListParams(parameters)
  const pKey = snakeCase(primaryKey)
  const arr: string[] = []
  let orderBy = ''
  let limit = ''
  if (!isSum) {
    if (params.orderBy) {
      const index = params.orderBy.indexOf(' desc')
      if (index > 0) {
        const key = params.orderBy.substring(0, index)
        orderBy = `ORDER BY ${snakeCase(key)} DESC`
      } else {
        orderBy = `ORDER BY ${snakeCase(params.orderBy)}`
      }
    } else {
      orderBy = `ORDER BY ${pKey} DESC`
    }
    if (params.page) {
      const pagesize = params.pagesize || 10
      limit = `LIMIT ${pagesize} OFFSET ${params.page * pagesize}`
    } else if (params.next) {
      orderBy = `ORDER BY ${pKey} DESC`
      const pagesize = params.pagesize || 10
      limit = `LIMIT ${pagesize}`
      arr.push(`${pKey} < ${params.next}`)
    } else if (params.pagesize) {
      limit = `LIMIT ${params.pagesize}`
    }
  }
  if (params.filters && params.filters.length > 0) {
    params.filters.forEach((item: string, index) => { 
      const split = item.split(/=|LIKE|>|<|>=|<=|<>|@>|<@1/)
      const key = split[0]
      const rest = item.substr(key.length)
      const f = `${snakeCase(key)} ${rest}`
      arr.push(f)
    })
  }
  const filterString = arr.length > 0 ? `WHERE ${arr.join(' AND ')}` : ''
  const string = ` ${filterString} ${orderBy} ${limit}`
  return string
}