import React from 'react'
import { RenderStyle, SwitchTextType } from '#types/ant.table.d'
import { type OptionItem, type RowDataType } from '#types/base.d'
import { type XFormItem, XFormItemType } from '#types/ant.form.d'
import { isEmpty } from '#utils/functions'
import { genderOptions, stateOptions } from '#constants/appoint'
import { type RowType } from '#components/table/model'
import type { TreeItem } from '#repositories/types/foundation'
import { columnSearchProps } from '#components/table/items'
import { requiredRule } from '#components/form/model'
import { DepartMainAddOption } from '#components/sundry'

const updateDisable = (id: number): boolean => [ 1, 2 ].includes(id)

export class Item implements RowDataType {
	public id: number
	public username: string
	public nickname: string
	public mobile: string
	public password: string
	public depIds: number[]
	public remark: string
	public email: string
	public avatar: string
	public sex: number
	public state: number
	public updatedAt: number
	public isDel: number
	public createdAt: number

	constructor(data: Partial<Item>) {
		this.id = data?.id ?? 0
		this.username = data?.username ?? ''
		this.nickname = data?.nickname ?? ''
		this.mobile = data?.mobile ?? ''
		this.password = data?.password ?? ''
		this.depIds = data?.depIds ?? []
		this.remark = data?.remark ?? ''
		this.email = data?.email ?? ''
		this.avatar = data?.avatar ?? ''
		this.sex = data?.sex ?? 0
		this.state = data?.state ?? 0
		// this.super = data?.super ?? 0
		this.updatedAt = data?.updatedAt ?? 0
		this.isDel = data?.isDel ?? 0
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
		return updateDisable(this.id)
	}

	hiddenDelete(): boolean {
		return updateDisable(this.id)
	}

	hiddenChecked(): boolean {
		return updateDisable(this.id)
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

export const columns = (departments: { [ key: number ]: TreeItem }): RowType<Item> => [
	{
		title: 'id',
		dataIndex: 'id',
		sorter: true,
		width: 80,
		fixed: 'left'
	},
	{
		title: '用户名',
		dataIndex: 'username',
		width: 100,
		fixed: 'left',
		...columnSearchProps<Item>('username')
	},
	{
		title: '启用状态',
		dataIndex: 'state',
		sorter: true,
		width: 150,
		renderStyle: RenderStyle.switch,
		renderVerify: record => updateDisable(record.id) ? '-' : true,
		filters: stateOptions.map(
			item => ({ text: item.title, value: item.value })
		)
	},
	{
		title: '密码',
		dataIndex: 'password',
		renderStyle: RenderStyle.input,
		width: 300,
		placeholder: '请输入密码',
		renderVerify: record => updateDisable(record.id) ? '-' : true,
		defaultValueFilter: () => ''
	},
	{
		title: '昵称',
		dataIndex: 'nickname',
		width: 240,
		renderStyle: RenderStyle.input
	},
	{
		title: '手机号',
		dataIndex: 'mobile',
		width: 240,
		renderStyle: RenderStyle.input
	},
	{
		title: '部门',
		dataIndex: 'roleIds',
		width: 220,
		renderHook: ({ record }) => <span>{
			record.depIds.map(
				(item: number) => isEmpty(departments[ item ]) ? '' : (departments[ item ].name ?? '')
			).filter(
				(item: string) => item !== ''
			).join(' | ')
		}</span>
	},
	{
		title: '邮箱',
		dataIndex: 'email',
		width: 240,
		renderStyle: RenderStyle.input
	},
	{
		title: '删除状态',
		dataIndex: 'isDel',
		width: 200,
		renderVerify: record => updateDisable(record.id) ? '-' : true,
		renderStyle: RenderStyle.switch,
		switchTextType: SwitchTextType.del
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

interface columnsParams {
	departments: OptionItem[]
}

export const formColumns = ({ departments }: columnsParams): Array<XFormItem<Item>> => [
	{
		dataIndex: 'username',
		defValue: '',
		label: '用户名',
		type: XFormItemType.input,
		rules: requiredRule('用户名不能为空'),
		disabled: data => isEmpty(data?.id) ? false : !updateDisable(data?.id ?? 0)
	},
	{
		dataIndex: 'password',
		defValue: '',
		label: '密码',
		placeholder: record => !isEmpty(record?.id) ? '请输入密码, 不填写则为原密码' : '请输入密码',
		type: XFormItemType.input,
		rules: data => !isEmpty(data?.record?.id) ? [] : requiredRule('密码不能为空'),
		fetchDefValue: async() => await new Promise<string>(
			resolve => {
				resolve('')
			}
		)
	},
	{
		dataIndex: 'nickname',
		defValue: '',
		label: '昵称',
		type: XFormItemType.input
	},
	{
		dataIndex: 'mobile',
		label: '手机号',
		type: XFormItemType.input
	},
	{
		dataIndex: 'depIds',
		defValue: [],
		label: '部门',
		type: XFormItemType.treeSelect,
		multiple: true,
		options: departments,
		dynamicAddOption: DepartMainAddOption
	},
	{
		dataIndex: 'email',
		label: '邮箱',
		type: XFormItemType.input
	},
	{
		dataIndex: 'remark',
		label: '备注',
		type: XFormItemType.textarea
	},
	{
		dataIndex: 'avatar',
		label: '头像',
		type: XFormItemType.fileUpload
	},
	{
		dataIndex: 'sex',
		defValue: 0,
		label: '性别',
		type: XFormItemType.radio,
		options: genderOptions
	},
	{
		dataIndex: 'state',
		defValue: 1,
		label: '使用状态',
		type: XFormItemType.switch
	}
]