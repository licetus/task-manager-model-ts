import { snakeCase } from 'lodash'
import { ListParams } from '../models/base'

export const sqlizeListParams = (primaryKey: string, params?: ListParams, isSum = false) => {
  if (!params) return ''
  const pKey = snakeCase(primaryKey)
  const arr: string[] = []
  const values: (string | number)[] = []
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
    if (params.page || params.page === 0) {
      const pageSize = params.pageSize || 10
      limit = `LIMIT ${pageSize} OFFSET ${params.page * pageSize}`
    } else if (params.next || params.next === 0) {
      orderBy = `ORDER BY ${pKey} DESC`
      const pageSize = params.pageSize || 10
      limit = `LIMIT ${pageSize}`
      arr.push(`${pKey} < ${params.next}`)
    } else if (params.pageSize) {
      limit = `LIMIT ${params.pageSize}`
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