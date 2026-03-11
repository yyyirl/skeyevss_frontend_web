import React from 'react'
import { useHistory } from 'react-router-dom'
import { Button } from 'antd'
import { isEmpty } from '#utils/functions'
import { RenderStyle } from '#types/ant.table.d'
import { type RowDataType } from '#types/base.d'
import { type XFormItem, XFormItemType } from '#types/ant.form.d'
import routes, { Path } from '#routers/constants'
import { makeDefRoutePathWithCreateAnchor } from '#routers/anchor'
import { stateOptions } from '#constants/appoint'
import { genUniqueId } from '#repositories/apis/base'
import { type RowType } from '#components/table/model'
import { columnSearchProps } from '#components/table/items'
import { requiredRule } from '#components/form/model'
import { type Item as RoleItem } from '#pages/system/roles/model'

export class Item implements RowDataType {
	public id: number
	public name: string
	public state: number
	public remark: string
	public parentId: number
	public cascadeDepUniqueId: string
	public roleIds: number[]
	public createdAt: number
	public updatedAt: number

	constructor(data: Partial<Item>) {
		this.id = data?.id ?? 0
		this.name = data?.name ?? ''
		this.cascadeDepUniqueId = data?.cascadeDepUniqueId ?? ''
		this.state = data?.state ?? 0
		this.remark = data?.remark ?? ''
		this.parentId = data?.parentId ?? 0
		this.roleIds = data?.roleIds ?? []
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
	roleList: RoleItem[]
	parentId: number
	parentName: string
}

export const columns = ({ roleList }: columnsParams): RowType<Item> => [
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
		title: '级联编号',
		dataIndex: 'cascadeDepUniqueId',
		width: 220,
		renderHook: ({ record }) => <>{ isEmpty(record.cascadeDepUniqueId) ? '-' : record.cascadeDepUniqueId }</>,
		...columnSearchProps<Item>('cascadeDepUniqueId')
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
		title: '角色',
		dataIndex: 'roleIds',
		width: 220,
		renderStyle: RenderStyle.select,
		multiple: true,
		options: roleList.map(item => ({ title: item.name, value: item.id }))
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

export const formColumns = ({ roleList, parentId, parentName }: columnsParams): Array<XFormItem<Item>> => [
	{
		dataIndex: 'parentId',
		defValue: parentId,
		label: '父级部门',
		type: XFormItemType.readonly,
		render: () => <div>{ parentName !== '' ? parentName : '无' }</div>
	},
	{
		dataIndex: 'name',
		defValue: '',
		label: '名称',
		type: XFormItemType.input,
		rules: requiredRule('名称不能为空')
	},
	{
		dataIndex: 'cascadeDepUniqueId',
		label: '级联编号',
		type: XFormItemType.input,
		fetchDefValue: async(value: string) => await new Promise<string>(
			resolve => {
				if (!isEmpty(value)) {
					resolve(value)
					return
				}

				void genUniqueId({ type: 'cascadeDepCode', count: 1 }).then(
					res => {
						resolve(res.data !== undefined ? res.data[ 0 ] : '')
					}
				)
			}
		)
	},
	{
		dataIndex: 'roleIds',
		defValue: [],
		label: '角色',
		type: XFormItemType.select,
		multiple: true,
		options: roleList.map(item => ({ title: item.name, value: item.id })),
		dynamicAddOption: () => {
			const history = useHistory()
			return <Button
				onClick={
					() => {
						const url = makeDefRoutePathWithCreateAnchor(
							routes[ Path.system ].subs?.[ Path.roles ].path ?? ''
						)
						if (url !== '') {
							history.push(url)
						}
					}
				}
				type="primary"
			>添加角色</Button>
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