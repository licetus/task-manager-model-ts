import camelcase from 'camelcase'
import decamelize from 'decamelize'
import { cloneDeep } from 'lodash'
import { sqlizeListParams } from '../utils'
import { Database } from '../db'

const db = new Database()

interface DataConfig {
  independentId?: boolean
  returnCreateTime?: boolean
  returnLastUpdateTime?: boolean
  pkey?: string
  props?: any
}

export class DataModel {
  private schema: string
  private table: string
  private independentId: boolean = true
  private returnCreateTime: boolean = true
  private returnLastUpdateTime: boolean = true
  private pkey: string = 'id'
  private props: any = {}

  constructor(schema: string, table: string, config?: DataConfig) {
    this.schema = schema
    this.table = table
    if (config && config.independentId) this.independentId = config.independentId
    if (config && config.returnCreateTime) this.returnCreateTime = config.returnCreateTime
    if (config && config.returnLastUpdateTime) this.returnLastUpdateTime = config.returnLastUpdateTime
    if (config && config.pkey) this.pkey = config.pkey
    if (config && config.props) this.props = config.props
  }

  private setPkeyValue(val: number) {
    this.props[this.pkey] = val
  }

  public async isExist(pkey: string) {
    const query = `SELECT * FROM "${this.schema}".${this.table} WHERE ${this.pkey} = $1;`
    const res = await db.query(query, [pkey])
    return res.length > 0
  }

  public async isExistByKey(key: string, value: string) {
    const query = `SELECT * FROM "${this.schema}".${this.table} WHERE ${decamelize(key)} = $1;`
    const res = await db.query(query, [value])
    return res.length > 0
  }

  public async create() {
    if (this.independentId) {
      if (this.props[this.pkey]) delete this.props[this.pkey]
    }
    const propKeys = Object.keys(this.props).map((prop) => decamelize(prop)).join(',')
    const propIndex = Object.keys(this.props).map((prop, index) => `$${index + 1}`).join(',')
    const propValues = Object.values(this.props)
    const query = `
			INSERT INTO "${this.schema}".${this.table} (
				${propKeys}
			) VALUES (
				${propIndex}
			) RETURNING ${this.pkey}
		;`
    const res = await db.query(query, propValues)
    if (res.length <= 0) throw new Error // TODO: errorhandler
    this.setPkeyValue(res[this.pkey])
  }

  public async update() {
    const { pkey } = this
    const propAssigns = Object.keys(this.props).filter(key => key !== pkey).map((prop, index) => `${decamelize(prop)}=$${index + 2}`)
    propAssigns.push('last_update_time = unix_now()')
    const keyIndexStr = propAssigns.join(',')
    const propValues = Object.values(this.props)
    const query = `
			UPDATE "${this.schema}".${this.table}
			SET ${keyIndexStr}
			WHERE ${this.pkey} = $1
		;`
    const res = await db.query(query, propValues)
    if (res.length <= 0) throw new Error // TODO: errorhandler
  }
}