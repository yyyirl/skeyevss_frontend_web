import { type OptionItem, type RowDataType } from '#types/base.d'
import { type XFormItem, XFormItemType } from '#types/ant.form.d'
import { RenderStyle } from '#types/ant.table.d'
import { stateOptions } from '#constants/appoint'
import { type PermissionItem } from '#repositories/types/config'
import type { RowType } from '#components/table/model'
import { columnSearchProps } from '#components/table/items'
import { requiredRule } from '#components/form/model'
import { arrayUnique, isArray } from '#utils/functions'

export class Item implements RowDataType {
	public id: number
	public name: string
	public state: number
	public remark: string
	public permissionUniqueIds: string[]
	public isDel: number
	public createdAt: number
	public updatedAt: number

	constructor(data: Partial<Item>) {
		this.id = data?.id ?? 0
		this.name = data?.name ?? ''
		this.state = data?.state ?? 0
		this.remark = data?.remark ?? ''
		this.permissionUniqueIds = data?.permissionUniqueIds ?? []
		this.isDel = data?.isDel ?? 0
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
		return false
	}

	hiddenDelete(): boolean {
		return false
	}

	hiddenChecked(): boolean {
		return false
	}

	updateProperty(column: keyof this, value: any): any {
		const data = { ...this }
		data[ column ] = value
		return new Item(data)
	}

	static conv(data: object): Item {
		return new Item(data)
	}
}

interface columnsParams {
	permissions: OptionItem[]
	permissionMaps: { [key: string]: PermissionItem }
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
		title: '名称',
		dataIndex: 'name',
		width: 100,
		fixed: 'left',
		...columnSearchProps<Item>('name')
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

export const formColumns = ({ permissions, permissionMaps }: columnsParams): Array<XFormItem<Item>> => [
	{
		dataIndex: 'name',
		defValue: '',
		label: '角色名',
		type: XFormItemType.input,
		rules: requiredRule('角色名不能为空')
	},
	{
		dataIndex: 'permissionUniqueIds',
		defValue: [],
		label: '权限',
		type: XFormItemType.checkbox,
		options: permissions,
		valueRender: value => {
			if (!isArray(value)) {
				return value
			}

			const data = [ ...value ]
			for (const key in permissionMaps) {
				const item = permissionMaps[ key ]
				if (item.universal) {
					data.push(item.uniqueId)
				}
			}
			return arrayUnique(data, item => item)
		}
	},
	{
		dataIndex: 'remark',
		label: '备注',
		type: XFormItemType.textarea
	},
	{
		dataIndex: 'state',
		defValue: 1,
		label: '使用状态',
		type: XFormItemType.switch
	}
]
