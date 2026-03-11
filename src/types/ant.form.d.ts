import type { MutableRefObject, ReactElement, ReactNode } from 'react'
import type { Rule } from 'rc-field-form/lib/interface'
import { type PanelMode } from 'rc-picker/lib/interface'
import type { ColProps } from 'antd/es/grid/col'
import type { ANTOptionItem, DateFormat, OptionItem, RowDataType } from '#types/base.d'
import type { CreateRequestCall, FetchRowRequestCall, UpdateItem, UpdateRequestCall } from '#repositories/types/request'
import type { Response } from '#types/axios.d'

// 表单字段类型
export enum XFormItemType {
	readonly = 'type-readonly',
	input = 'type-input',
	password = 'type-password',
	textarea = 'type-textarea',
	markdown = 'type-markdown',
	editor = 'type-editor',
	radio = 'type-radio',
	checkbox = 'type-checkbox',
	select = 'type-select',
	treeSelect = 'type-treeSelect',
	switch = 'type-switch',
	colorPicker = 'type-colorPicker',
	datePicker = 'type-datePicker',
	dateRangePicker = 'type-dateRangePicker',
	number = 'type-number',
	fileUpload = 'type-fileUpload',
	custom = 'type-custom'
}

interface AfterOnChangeParams<T extends RowDataType> {
	value: any
	record?: T
	columns?: Array<XFormItem<T>>
	setFieldValue: (key: keyof T, value: any) => void

	hiddenMaps: Partial<{ [ key: keyof T ]: boolean }>
	setHiddenMaps: (data: Partial<{ [ key: keyof T ]: boolean }>, useCurrent?: boolean) => void

	readonlyMaps: Partial<{ [ key: keyof T ]: boolean }>
	setReadonlyMaps: (data: Partial<{ [ key: keyof T ]: boolean }>, useCurrent?: boolean) => void

	fetchRowComplete: MutableRefObject<boolean | null>
	setLoading: (v: boolean) => void
	formColumnInstance: { [ key: string ]: FormItemProps<T> }
}

interface RuleCallParams<T extends RowDataType> {
	record?: T
	original?: T
	setLoading: (value: boolean) => void
}

export interface ExtensionProps<T extends RowDataType> {
	data?: T
}

export interface SetterMapsType<T extends RowDataType> { [key: keyof T]: (val: any) => void }

export type FormItemProps<T extends RowDataType> = XFormItem<T> & {
	original: T | undefined
	setFieldValue: (key: keyof T, value: any) => void
	columns?: Array<XFormItem<T>>

	proxyPath?: string

	hiddenMaps: Partial<{ [ key: keyof T ]: boolean }>
	setHiddenMaps: (data: Partial<{ [ key: keyof T ]: boolean }>, useCurrent?: boolean) => void

	readonlyMaps: Partial<{ [ key: keyof T ]: boolean }>
	setReadonlyMaps: (data: Partial<{ [ key: keyof T ]: boolean }>, useCurrent?: boolean) => void

	fetchRowComplete: MutableRefObject<boolean | null>
	setterMaps: SetterMapsType<T>
	formColumnInstance: { [ key: string ]: FormItemProps<T> }
}

export type XFormItemRenderProps<T> = FormItemProps<T> & {
	handleChange?: (v: any) => void
	value?: any
}

export interface XFormItem<T extends RowDataType> {
	width?: number
	// 字段名
	dataIndex: keyof T
	label?: string
	proxyPath?: string
	type: XFormItemType
	// 自定验证
	rules?: Rule[] | ((data: RuleCallParams<T>) => Rule[])
	options?: OptionItem[]
	optionsFilter?: (record?: T, options?: OptionItem[]) => OptionItem[]
	antOptionsFilter?: (record?: T, options?: ANTOptionItem[]) => ANTOptionItem[]
	simple?: boolean
	// form item value值设置
	valueRender?: (currentValue: any, record?: T) => any
	// 联想
	autoCompleteOptions?: OptionItem[]
	// 选择联想词后执行
	autoCompleteAfter?: (val: string, record?: T) => string
	// readonly 自定义组件 类型渲染
	render?: (props: XFormItemRenderProps<T>) => ReactElement
	// 默认打开
	defaultOpen?: boolean
	// 默认展开所有树节点
	treeDefaultExpandAll?: boolean

	// 动态添加基础数据
	dynamicAddOption?: (props: ExtensionProps) => ReactElement
	// 提示信息
	explain?: (props: ExtensionProps) => ReactElement

	prefix?: ReactNode
	placeholder?: string | ((record?: T) => string)

	// 取值范围
	min?: number
	max?: number

	// 日期选择模式
	dateMode?: PanelMode
	// datePicker是否显示时间
	showTime?: boolean
	// 时间戳格式 unix milli
	timestampStyle?: 'unix' | 'milli'
	// 时间格式化
	dateFormat?: DateFormat

	// 禁用状态
	disabled?: (data: T | undefined) => boolean
	// 隐藏表单组件 数据也不会
	hidden?: ((data: T | undefined) => boolean) | boolean
	// 隐藏表单组件 数据会提交
	sightless?: ((data: T | undefined) => boolean) | boolean
	// 批量选择
	multiple?: boolean
	// 默认值
	// defValue?: T[this['dataIndex']]
	defValue?: any
	// 设置默认值 获取远程数据后表单显示值设置
	// setDefValue?: (val: T[this['dataIndex']]) => T[this['dataIndex']]
	fetchDefValue?: (val: any) => Promise<any>
	// 值修改后触发
	afterOnChange?: ((data: AfterOnChangeParams<T>) => void)
	// 更新当前值
	handleChange?: (v: any, setVal: (val: any) => void, record?: T) => void

	// afterOnChange: ({ value, hiddenList, setHiddenList }) => {
	//	 if (Array.isArray(value)) {
	//		 if (value.length >= 2) {
	//			 setHiddenList({ ...hiddenList, username: true })
	//		 } else {
	//			 setHiddenList({ ...hiddenList, username: false })
	//		 }
	//	 }
	// }
}

// 表单类型验证
export type XFormItems<T extends RowDataType> = {
	[K in XFormItem<T>[number]['dataIndex']]: T[K]
}

export interface XPopupFormProps<T extends RowDataType> {
	data?: T | null
	// 创建
	create?: CreateRequestCall
	// 更新
	update?: UpdateRequestCall
	// 详情
	fetchRow?: FetchRowRequestCall
	// 详情获取完成后执行
	afterFetchRow?: (data: T, setData: (data: T) => void) => void
	// 详情获取完成后执行
	updateCompletion?: (oldData: T, newData: T) => void
	// conv
	convToItem: (item: T | object) => T
	// 获取详情
	row?: <V = Response<T>>(id: string | number) => Promise<V>
	// 表单完成回调
	complete?: (data: T) => void
	// 完成后立即关闭表单
	autoClose?: boolean
	// 关闭弹窗
	close: () => void
	// 设置列表
	setRecords?: (data: T[]) => void
	// 列表数据
	records?: T[]
	// 拓展数据
	extData?: any
	// 提交前执行
	beforeSubmit?: (data: T, id?: string | number, call: () => void) => void
}

export interface XFormProps<T extends RowDataType> extends XPopupFormProps<T> {
	className?: string
	// 字段
	columns?: Array<XFormItem<T>>
	renderColumns?: (record: T) => Array<XFormItem<T>>
	renderRecord?: (record: T) => T
	// 隐藏footer
	hiddenFooter?: boolean
	// 提交按钮文字内容
	submitText?: ''
	// 布局
	wrapperCol?: ColProps
	// 转换类型 表单更新完成后执行
	afterUpdateTransformData: (data: object) => T
	// 表单更新完成后执行
	afterUpdateCompletion?: (record?: T | null, data: Array<UpdateItem<T>>) => void
	// 创建前执行
	beforeCreateTransformData?: (data: T, records: T[]) => T
	// 更新前执行
	beforeUpdateTransformData?: (data: Array<UpdateItem<T>>) => Array<UpdateItem<T>>
}

// 表格中表单弹窗类型
interface PopupItemContentParamsType<T extends RowDataType> extends XPopupFormProps<T> {
	popupKey: string
	data?: T | null
	close: () => void
}
