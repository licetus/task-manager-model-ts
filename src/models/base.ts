import { snakeCase, cloneDeep } from 'lodash'
import { sqlizeListParams } from '../utils'
import { db } from '../db'
import errors from '../errors'

const ERRORS = {
  InvalidId: 400,
  DatabaseCreateFailed: 400,
  DatabaseUpdateFailed: 400,
  DatabaseDeleteFailed: 400,
  DatabaseFetchFailed: 400,
}
errors.register(ERRORS)

export class ListParams {
  page?: number
  pagesize?: number
  next?: number
  filters?: string[]
  orderBy?: string
  constructor(data: any) {
    if (data.page) this.page = data.page
    if (data.pagesize) this.pagesize = data.pagesize
    if (!data.page && data.next) {
      this.page = undefined
      this.next = data.next
    }
    if (data.filters) this.filters = data.filters
    if (data.orderBy) this.orderBy = data.orderBy
  }
}

export interface DataConfig {
  independentId?: boolean
  returnCreateTime?: boolean
  returnLastUpdateTime?: boolean
  pkey?: string
  props?: any
}

export abstract class DataModel {
  private schemaName: string
  private tableName: string
  protected independentId: boolean = true
  protected returnCreateTime: boolean = true
  protected returnLastUpdateTime: boolean = true
  protected pkey: string = 'id'
  abstract props: { [key: string]: any }
  abstract schema: string[]

  constructor(schemaName: string, tableName: string, config?: DataConfig) {
    this.schemaName = schemaName
    this.tableName = tableName
    if (config && config.independentId) this.independentId = config.independentId
    if (config && config.returnCreateTime) this.returnCreateTime = config.returnCreateTime
    if (config && config.returnLastUpdateTime) this.returnLastUpdateTime = config.returnLastUpdateTime
    if (config && config.pkey) this.pkey = config.pkey
  }
  
  private setPkeyValue(val: string) {
    this.props[this.pkey] = val
  }

  private generateResult(data: any) {
    const res: {[key: string]: any} = {}
    this.schema.forEach((key) => {
      res[key] = data[snakeCase(key)]
    })
    if (this.returnCreateTime) res['createTime'] = data.create_time
    if (this.returnLastUpdateTime) res['lastUpdateTime'] = data.last_update_time
    return res
  }

  public async isExist(pkeyValue: number) {
    const query = `SELECT * FROM "${this.schemaName}".${this.tableName} WHERE ${this.pkey} = $1;`
    const res = await db.query(query, [pkeyValue])
    return res.rowCount > 0
  }

  public async isExistByKey(key: string, value: string | number) {
    const query = `SELECT * FROM "${this.schemaName}".${this.tableName} WHERE ${snakeCase(key)} = $1;`
    const res = await db.query(query, [value])
    return res.rowCount > 0
  }

  public async create() {
    if (this.independentId) {
      if (this.props[this.pkey]) delete this.props[this.pkey]
    }
    const propKeys = Object.keys(this.props).map((prop) => snakeCase(prop)).join(',')
    const propIndex = Object.keys(this.props).map((prop, index) => `$${index + 1}`).join(',')
    const propValues = Object.values(this.props)
    const query = `
      INSERT INTO "${this.schemaName}".${this.tableName} (
        ${propKeys}
      ) VALUES (
        ${propIndex}
      ) RETURNING ${this.pkey}
    ;`
    const res = await db.query(query, propValues)
    if (res.rowCount <= 0) throw new errors.DatabaseCreateFailedError()
    this.setPkeyValue(res.rows[0][this.pkey])
  }

  public async update() {
    const { pkey } = this
    const propAssigns = Object.keys(this.props).filter(key => key !== pkey).map((prop, index) => `${snakeCase(prop)}=$${index + 2}`)
    propAssigns.push('last_update_time = unix_now()')
    const keyIndexStr = propAssigns.join(',')
    const propValues = Object.values(this.props)
    const query = `
      UPDATE "${this.schemaName}".${this.tableName}
      SET ${keyIndexStr}
      WHERE ${this.pkey} = $1
    ;`
    const res = await db.query(query, propValues)
    if (res.rowCount <= 0) throw new errors.DatabaseUpdateFailedError()
  }

  public async getViewList(viewName: string, pkey: string, params: any) {
    const paramsString = sqlizeListParams(pkey, params)
    const query = `SELECT * from "${this.schemaName}".${viewName} ${paramsString};`
    const res = await db.query(query)
    return res.rows.map((item) => {
      return this.generateResult(item)
    })
  }

  public async getViewListCount(viewName: string, pkey: string, params: any) {
    const paramsString = sqlizeListParams(pkey, params, true)
    const query = `SELECT COUNT(*) as total from "${this.schemaName}".${viewName} ${paramsString};`
    const res = await db.query(query)
    return res.rows[0].total
  }

  public async get(pkeyValue: number) {
    const filters = [`${this.pkey} = ${pkeyValue}`]
    const res = await this.getViewList(this.tableName, this.pkey, { filters })
    if (res.length > 0) return res[0]
    throw new errors.InvalidIdError()
  }
  
  public async getList(params?: any) {
    const res = await this.getViewList(this.tableName, this.pkey, params)
    return res
  }

  public async getListCount(params: any) {
    const res = await this.getViewListCount(this.tableName, this.pkey, params)
    return res
  }

  public async save() {
    try {
      if (this.props[this.pkey]) {
        const isExist = await this.isExist(this.props[this.pkey])
        if (!isExist) {
          await this.create()
        } else {
          const object = await this.get(this.props[this.pkey])
          this.schema.forEach((key) => {
            if (key !== this.pkey) {
              if (!this.props[key]) this.props[key] = object[key]
            }
          })
          await this.update()
        }
      } else {
        await this.create()
      }
    } catch (err) {
      throw err
    }
    return cloneDeep(this)
  }

  public async delete(pkeyValue: number) {
    try {
      let isExist = await this.isExist(pkeyValue)
      if (!isExist) {
        throw new errors.InvalidIdError()
      } else {
        const query = `DELETE FROM "${this.schemaName}".${this.tableName} WHERE ${this.pkey} = $1;`
        await db.query(query, [pkeyValue])
        isExist = await this.isExist(pkeyValue)
        if (isExist) throw new errors.DatabaseDeleteFailedError()
      }
    } catch (err) {
      throw err
    }
  }

  static async transaction(actions: any) {
    await db.transaction(db, actions)
  }
}