import React from 'react'
import { RenderStyle } from '#types/ant.table.d'
import { type OptionItem, type RowDataType } from '#types/base.d'
import { type RowType } from '#components/table/model'
import { columnSearchProps } from '#components/table/items'

export class Item implements RowDataType {
	public id: number
	public userid: number
	public username: string
	public data: string
	public ip: string
	public mac: string
	public type: number
	public updatedAt: number
	public createdAt: number

	constructor(data: Partial<Item>) {
		this.id = data?.id ?? 0
		this.userid = data?.userid ?? 0
		this.username = data?.username ?? ''
		this.data = data?.data ?? ''
		this.ip = data?.ip ?? ''
		this.mac = data?.mac ?? ''
		this.type = data?.type ?? 0
		this.updatedAt = data?.updatedAt ?? 0
		this.createdAt = data?.createdAt ?? 0
	}

	primaryKeyValue(): string | number {
		return this.id
	}

	primaryKeyColumn(): keyof Item {
		return 'id'
	}

	static primaryKeyColumn(): keyof Item {
		return 'id'
	}

	hiddenEdit(): boolean {
		return true
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

interface columnsParams {
	SystemOperationLogTypeOptions: OptionItem[]
	SystemOperationLogTypes: { [key: number]: string }
}

export const columns = (data: columnsParams): RowType<Item> => [
	{
		title: '管理员账号',
		dataIndex: 'username',
		width: 180,
		...columnSearchProps<Item>('userid')
	},
	{
		title: 'ip',
		dataIndex: 'ip',
		width: 150,
		...columnSearchProps<Item>('ip')
	},
	{
		title: '类型',
		dataIndex: 'type',
		width: 350,
		renderHook: ({ record }) => <>{data.SystemOperationLogTypes[ record.type ] ?? ''}</>,
		multiple: true,
		filters: data.SystemOperationLogTypeOptions.map(
			item => ({ text: item.title, value: item.value })
		)
	},
	{
		title: '操作时间',
		dataIndex: 'createdAt',
		width: 200,
		renderStyle: RenderStyle.timestamp
	}
]