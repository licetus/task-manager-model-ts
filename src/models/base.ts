import { snakeCase, cloneDeep } from 'lodash'
import { sqlizeListParams } from '../utils'
import { db } from '../db'
import { error } from '../errors'

const ERRORS = {
  InvalidId: 400,
  DatabaseCreateFailed: 400,
  DatabaseUpdateFailed: 400,
  DatabaseDeleteFailed: 400,
  DatabaseFetchFailed: 400,
}
error.register(ERRORS)

export interface ListParams {
  page?: number
  pageSize?: number
  next?: number
  orderBy?: string
  filters?: string[]
}

interface DataConfig {
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
  abstract props: any = {}

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

  abstract getShema(): string[]

  private generateResult(data: any) {
    const res = {} as any
    this.getShema().forEach((key) => {
      res[key] = data[snakeCase(key)]
    })
    if (this.returnCreateTime) res.createTime = data.create_time
    if (this.returnLastUpdateTime) res.lastUpdateTime = data.last_update_time
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
    if (res.rowCount <= 0) throw new error.DatabaseCreateFailedError()
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
    if (res.rowCount <= 0) throw new error.DatabaseUpdateFailedError()
  }

  public async get(pkeyValue: number) {
    const query = `SELECT * FROM "${this.schemaName}".${this.tableName} WHERE ${this.pkey} = $1;`
    const res = await db.query(query, [pkeyValue])
    if (res.rowCount <= 0) throw new error.DatabaseFetchFailedError()
    return this.generateResult(res.rows[0])
  }

  public async getByKey(key: string, value: string | number) {
    const query = `SELECT * FROM "${this.schemaName}".${this.tableName} WHERE ${key} = $1;`
    const res = await db.query(query, [value])
    if (res.rowCount <= 0) throw new error.DatabaseFetchFailedError()
    return this.generateResult(res.rows[0])
  }

  public async getList(params?: ListParams) {
    const paramsString = sqlizeListParams(this.pkey, params)
    const query = `SELECT * from "${this.schemaName}".${this.tableName} ${paramsString};`
    const res = await db.query(query)
    return res.rows.map((item) => {
      return this.generateResult(item)
    })
  }

  public async getViewList(viewName: string, pkey: string, params: ListParams) {
    const paramsString = sqlizeListParams(pkey, params)
    const query = `SELECT * from "${this.schemaName}".${viewName} ${paramsString};`
    const res = await db.query(query)
    return res.rows.map((item) => {
      return this.generateResult(item)
    })
  }

  public async getViewListCount(viewName: string, pkey: string, params: ListParams) {
    const paramsString = sqlizeListParams(pkey, params, true)
    const query = `SELECT COUNT(*) as total from "${this.schemaName}".${viewName} ${paramsString};`
    const res = await db.query(query)
    return res.rows[0].total
  }

  public async getListCount(params: ListParams) {
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
          this.getShema().forEach((key) => {
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
        throw new error.InvalidIdError()
      } else {
        const query = `DELETE FROM "${this.schemaName}".${this.tableName} WHERE ${this.pkey} = $1;`
        await db.query(query, [pkeyValue])
        isExist = await this.isExist(pkeyValue)
        if (isExist) throw new error.DatabaseDeleteFailedError()
      }
    } catch (err) {
      throw err
    }
  }

  static async transaction(actions: any) {
    await db.transaction(db, actions)
  }
}