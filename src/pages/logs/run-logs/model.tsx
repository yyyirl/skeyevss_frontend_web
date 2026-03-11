import React from 'react'
import { type PopupItem, type RowType } from '#components/table/model'
import type { RowDataType } from '#types/base.d'
import { CatLog } from './components'

export const popupKey = {
	catLog: 'catLog'
}

export class Item implements RowDataType {
	public id: number
	public path: string
	public name: string
	public isDir: boolean
	public level: number

	constructor(data: Partial<Item> = {}) {
		this.id = data?.id ?? 0
		this.path = data?.path ?? ''
		this.name = data?.name ?? ''
		this.isDir = data?.isDir ?? false
		this.level = data?.level ?? 0
	}

	primaryKeyValue(): number {
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

export const columns: RowType<Item> = [
	{
		title: '文件名',
		dataIndex: 'name',
		width: 300,
		popup: popupKey.catLog,
		renderHook: ({ record, node }) => <div
			style={
				{
					paddingLeft: (record.level - 1) * 50,
					color: record.isDir ? 'blue' : 'red',
					cursor: record.isDir ? 'default' : 'pointer'
				}
			}
		>{ node }</div>
	}
]

export const popups: Array<PopupItem<Item>> = [
	{
		title: '查看日志',
		key: popupKey.catLog,
		content: CatLog,
		width: '80%',
		footer: <></>
	}
]
