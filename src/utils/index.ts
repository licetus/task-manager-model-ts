import decamelize from 'decamelize'

export const sqlizeListParams = (primaryKey: string, params: any, isSum = false) => {
  if (!params) return ''
  const pKey = decamelize(primaryKey)
  const filters = []
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
      filters.push(`${pKey} < ${params.next}`)
    } else if (params.pageSize) {
      limit = `LIMIT ${params.pageSize}`
    }
  }
  if (params.filters && params.filters.length > 0) {
    params.filters.forEach((filter: string) => {
      const strings = filter.split((/=|LIKE|>|<|>=|<=|@>|<@|<>/))
      const key = strings[0]
      const f = `${decamelize(key)}${filter.substr(key.length, filter.length - key.length)}`
      filters.push(f)
    })
  }
  const filterString = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : ''
  const ret = ` ${filterString} ${orderBy} ${limit}`
  return ret
}