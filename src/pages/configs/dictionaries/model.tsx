import { RenderStyle } from '#types/ant.table.d'
import { type OptionItem, type RowDataType } from '#types/base.d'
import { type XFormItem, XFormItemType } from '#types/ant.form.d'
import { stateOptions } from '#constants/appoint'
import { type RowType } from '#components/table/model'
import { columnSearchProps } from '#components/table/items'
import { remoteRule, requiredRule } from '#components/form/model'
import React from 'react'
import { DictUniqueIdType, type TreeItem } from '#repositories/types/foundation'
import { isEmpty } from '#utils/functions'
import { CheckUniqueId } from '#pages/configs/dictionaries/api'

const updateDisable = (readonly: number): boolean => readonly === 1

export class Item implements RowDataType {
	public id: number
	public name: string
	public parentId: number
	public state: number
	public readonly: number
	public uniqueId: string
	public multiValue: string
	public createdAt: number
	public updatedAt: number

	constructor(data: Partial<Item>) {
		this.id = data?.id ?? 0
		this.name = data?.name ?? ''
		this.parentId = data?.parentId ?? 0
		this.state = data?.state ?? 0
		this.readonly = data?.readonly ?? 0
		this.uniqueId = data?.uniqueId ?? ''
		this.multiValue = data?.multiValue ?? ''
		this.createdAt = data?.createdAt ?? 0
		this.updatedAt = data?.updatedAt ?? 0
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
		return updateDisable(this.readonly)
	}

	hiddenDelete(): boolean {
		return updateDisable(this.readonly)
	}

	hiddenChecked(): boolean {
		return updateDisable(this.readonly)
	}

	parentUniqueIdKeyColumn(): keyof Item {
		return 'parentId'
	}

	parentUniqueIdKeyValue(): string | number {
		return this.parentId
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
	maps: { [ key: number ]: TreeItem }
	trees: OptionItem[]
}

export const columns: RowType<Item> = [
	{
		title: 'id',
		dataIndex: 'id',
		sorter: true,
		width: 80,
		fixed: 'left'
	},
	{
		title: 'name',
		dataIndex: 'name',
		width: 240,
		renderStyle: RenderStyle.input,
		...columnSearchProps<Item>('name')
	},
	{
		title: 'uniqueId',
		dataIndex: 'uniqueId',
		width: 160,
		// renderStyle: RenderStyle.input,
		...columnSearchProps<Item>('uniqueId')
	},
	{
		title: '启用状态',
		dataIndex: 'state',
		sorter: true,
		width: 150,
		renderStyle: RenderStyle.switch,
		filters: stateOptions.map(
			item => ({ text: item.title, value: item.value })
		)
	},
	{
		title: '更新时间',
		dataIndex: 'updatedAt',
		width: 200,
		sorter: true,
		renderStyle: RenderStyle.timestamp
	},
	{
		title: '创建时间',
		dataIndex: 'createdAt',
		width: 200,
		sorter: true,
		renderStyle: RenderStyle.timestamp
	}
]

export const formColumns = ({ trees, maps, maxId, pid }: columnsParams & { maxId: number, pid: number }): Array<XFormItem<Item>> => [
	{
		dataIndex: 'name',
		defValue: '',
		label: '名称',
		type: XFormItemType.input,
		rules: requiredRule('字典名称不能为空')
	},
	{
		dataIndex: 'uniqueId',
		defValue: pid > 0 && !isEmpty(maps[ pid ]) ? (!isEmpty(maps[ pid ].raw.uniqueId) ? `${ maps[ pid ].raw.uniqueId }-${ (maxId + 1).toString() }` : '') : '',
		label: 'uniqueId',
		type: XFormItemType.input,
		placeholder: '唯一id 标注值',
		rules: params => remoteRule({
			message: '请输入uniqueId',
			uniqueId: 'uniqueIdRule',
			call: (value, resolve, reject) => {
				params.setLoading(true)
				const uniqueId = value as string
				if (uniqueId === '') {
					reject('请输入uniqueId')
					params.setLoading(false)
					return
				}

				if (params.record !== undefined && params.record.uniqueId === uniqueId) {
					resolve(true)
					return
				}

				params.setLoading(true)
				void CheckUniqueId(uniqueId).then(
					res => {
						if (res.data === false) {
							resolve(true)
							return
						}
						reject('uniqueId已占用')
					}
				).finally(
					() => { params.setLoading(false) }
				)
			}
		}),
		autoCompleteOptions: dictUniqueIdOptions()
	},
	{
		dataIndex: 'parentId',
		label: '父级',
		defValue: pid,
		type: XFormItemType.treeSelect,
		options: trees,
		disabled: () => pid > 0
	},
	{
		dataIndex: 'multiValue',
		label: '多值匹配',
		defValue: '',
		type: XFormItemType.textarea,
		explain: () => <>多个值用换行符分开</>
	},
	{
		dataIndex: 'state',
		defValue: 1,
		label: '使用状态',
		type: XFormItemType.switch
	}
]

function dictUniqueIdOptions(): OptionItem[] {
	const options: OptionItem[] = []
	for (const key in DictUniqueIdType) {
		options.push({
			title: DictUniqueIdType[ key as keyof typeof DictUniqueIdType ] as string,
			value: key
		})
	}

	return options
}