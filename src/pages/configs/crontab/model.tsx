import React from 'react'
import { RenderStyle } from '#types/ant.table.d'
import { type RowDataType } from '#types/base.d'
import { type XFormItem, XFormItemType } from '#types/ant.form.d'
import { isEmpty } from '#utils/functions'
import { stateOptions } from '#constants/appoint'
import { type RowType } from '#components/table/model'
import { requiredRule } from '#components/form/model'

const updateDisable = (readonly: number): boolean => readonly === 1

export class Item implements RowDataType {
	public uniqueId: string
	public title: string
	public interval: number
	public status: number
	public timeout: number
	public counter: number
	public blockStatus: number
	public readonly: number
	public logs: string[]
	public createdAt: number
	public updatedAt: number

	constructor(data: Partial<Item>) {
		this.uniqueId = data.uniqueId ?? ''
		this.title = data.title ?? ''
		this.interval = data.interval ?? 0
		this.status = data.status ?? 0
		this.timeout = data.timeout ?? 0
		this.counter = data.counter ?? 0
		this.blockStatus = data.blockStatus ?? 0
		this.readonly = data.readonly ?? 0
		this.logs = data.logs ?? []
		this.createdAt = data.createdAt ?? 0
		this.updatedAt = data.updatedAt ?? 0
	}

	primaryKeyValue(): string | number {
		return this.uniqueId
	}

	primaryKeyColumn(): keyof Item {
		return 'uniqueId'
	}

	static primaryKeyColumn(): keyof Item {
		return 'uniqueId'
	}

	hiddenEdit(): boolean {
		return updateDisable(this.readonly)
	}

	hiddenDelete(): boolean {
		return true
	}

	hiddenChecked(): boolean {
		return true
	}

	updateProperty(column: keyof this, value: any): Item {
		const data = { ...this }
		data[ column ] = value
		return new Item(data)
	}

	static conv(data: object): Item {
		return new Item(data)
	}
}

export const columns: RowType<Item> = [
	{
		title: 'uniqueId',
		dataIndex: 'uniqueId',
		width: 160,
		fixed: 'left'
	},
	{
		title: '标题',
		dataIndex: 'title',
		width: 150
	},
	{
		title: '启用状态',
		dataIndex: 'status',
		sorter: true,
		width: 150,
		renderStyle: RenderStyle.switch,
		filters: stateOptions.map(
			item => ({ text: item.title, value: item.value })
		)
	},
	{
		title: '执行周期',
		dataIndex: 'interval',
		renderStyle: RenderStyle.number,
		minValue: 1,
		renderVerify: record => record.interval === 0 ? '-' : true,
		width: 200,
		tips: <>单位/s</>
	},
	{
		title: '每一批次执行数量',
		dataIndex: 'counter',
		renderStyle: RenderStyle.number,
		width: 200
	},
	{
		title: '超时时间',
		dataIndex: 'timeout',
		renderStyle: RenderStyle.number,
		width: 200,
		tips: <>单位/s</>
	},
	{
		title: '阻塞状态',
		dataIndex: 'blockStatus',
		sorter: true,
		width: 150,
		renderStyle: RenderStyle.switch,
		filters: stateOptions.map(
			item => ({ text: item.title, value: item.value })
		)
	},
	{
		title: '创建时间',
		dataIndex: 'createdAt',
		width: 200,
		sorter: true,
		renderStyle: RenderStyle.timestamp
	},
	{
		title: '更新时间',
		dataIndex: 'updatedAt',
		width: 200,
		sorter: true,
		renderStyle: RenderStyle.timestamp
	}
]

export const formColumns: Array<XFormItem<Item>> = [
	{
		dataIndex: 'uniqueId',
		defValue: '',
		label: 'uniqueId',
		type: XFormItemType.readonly
	},
	{
		dataIndex: 'title',
		defValue: '',
		label: '标题',
		type: XFormItemType.readonly
	},
	{
		dataIndex: 'status',
		defValue: 1,
		label: '启用状态',
		type: XFormItemType.switch
	},
	{
		dataIndex: 'interval',
		defValue: '',
		label: '执行周期',
		type: XFormItemType.number,
		rules: data => !isEmpty(data?.record?.uniqueId) ? [] : requiredRule('执行周期不能为空'),
		explain: () => <>单位/s</>
	},
	{
		dataIndex: 'timeout',
		defValue: 0,
		label: '超时时间',
		type: XFormItemType.number,
		rules: data => !isEmpty(data?.record?.uniqueId) ? [] : requiredRule('超时时间不能为空'),
		explain: () => <>单位/s</>
	},
	{
		dataIndex: 'counter',
		defValue: 0,
		label: '每一批次执行数量',
		type: XFormItemType.number,
		rules: data => !isEmpty(data?.record?.uniqueId) ? [] : requiredRule('每一批次执行数量不能为空')
	},
	{
		dataIndex: 'blockStatus',
		defValue: 0,
		label: '阻塞状态状态',
		type: XFormItemType.switch
	}
]