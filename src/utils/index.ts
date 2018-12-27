import decamelize from 'decamelize'
import { ListParams } from '../models/base'

export const sqlizeListParams = (pkey: string, params?: ListParams, isSum = false) => {
  if (!params) return ''
  const pKey = decamelize(pkey)
  const arr = []
  let orderBy = ''
  let limit = ''
  if (!isSum) {
    orderBy = params.orderBy ? `ORDER BY ${decamelize(params.orderBy)}` : `ORDER BY ${pKey} DESC`
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
    params.filters.forEach((filter: string) => {
      const strings = filter.split((/=|LIKE|>|<|>=|<=|@>|<@|<>/))
      const key = strings[0]
      const f = `${decamelize(key)}${filter.substr(key.length, filter.length - key.length)}`
      arr.push(f)
    })
  }
  const filterString = arr.length > 0 ? `WHERE ${arr.join(' AND ')}` : ''
  const ret = ` ${filterString} ${orderBy} ${limit}`
  return ret
}