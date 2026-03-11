import type { ReactElement, Ref } from 'react'
import type React from 'react'
import type { TableProps } from 'antd'
import type { ColumnType } from 'antd/es/table/interface'
import type { ExpandableProps, RenderStyle, SwitchTextType, tableMode, TableStyle } from '#types/ant.table.d'
import type { ANTOptionItem, OptionItem, RowDataType } from '#types/base.d'
import { type XRouteComponentProps } from '#routers/sites'
import type { Condition, CreateRequestCall, DeleteRequestCall, FetchQueryListParams, FetchRowRequestCall, SortBy, UpdateRequest, UpdateRequestCall } from '#repositories/types/request'
import type { FetchListResponse } from '#repositories/types/response'
import type { Response } from '#types/axios.d'
import type { PopupItemContentParamsType } from '#types/ant.form.d'
import type { TableComponents } from 'rc-table/lib/interface'
import { type SortBy as SortByEnum } from '#constants/appoint'
import { type CancelTokenSourceType } from '#utils/axios'

// type ProducerStyleParams = | {
//	 type: RenderStyle.switch
//	 options: OptionItem[]
//	 switchTextType: SwitchTextType
// } | {
//	 type: RenderStyle.input
// } | {
//	 type: RenderStyle.timestamp
// } | {
//	 type: RenderStyle.select
//	 options: OptionItem[]
// }
//
// type ProducerParams<T extends RowDataType> = ProducerStyleParams & {
//	 update?: (params: UpdateRequest<T>) => Promise<Response<boolean>>
//	 fetchList: (params: FetchQueryListParams<T>) => Promise<Response<FetchListResponse<T>>>
//	 setData: (data: T) => void
//	 columnItem: ColumnType<T>
//	 popupCall: (() => void) | number
// }

export interface ComponentProps<T extends RowDataType> {
	components?: TableLayoutComponentProps<T>
	content: ReactElement
	records: T[]
	setRecords: (data: T[]) => void
	update?: UpdateRequestCall
	handleSwitchContent: (v: SwitchContentStyle) => void
	switchContentState: SwitchContentStyle
	className?: string
	loading: boolean
	fetchListCancelToken: () => void
}

interface Authority {
	create?: boolean
	update?: boolean
	delete?: boolean
}

interface ProducerParams<T extends RowDataType> {
	type?: RenderStyle
	options?: OptionItem[]
	switchTextType?: SwitchTextType
	tips?: ReactElement

	update?: (params: UpdateRequest<T>) => Promise<Response<boolean>>
	fetchList: (params: FetchQueryListParams<T>) => Promise<Response<FetchListResponse<T>>>
	setData: (data: T) => void
	columnItem: ColumnType<T>
	popupCall: (() => void) | null
	// 弹窗前验证
	popupVerify?: (record: T) => boolean
	authority?: Authority

	minValue?: number
	maxValue?: number
}

export interface ProducerPropsType<T extends RowDataType> {
	params: ProducerParams<T>
	value: any
	index: number
	primaryKey: string
	record: T
}

// 表格状态
interface TableState<T extends RowDataType> {
	// 隐藏创建按钮
	hiddenCreate?: boolean
	hiddenCreateCall?: (props: TableFooterType<T>) => boolean
	// 隐藏删除按钮
	hiddenDelete?: boolean
	hiddenDeleteCall?: (props: TableFooterType<T>) => boolean
	// 隐藏所有行编辑按钮
	hiddenCellEdit?: boolean
	// 隐藏所有行删除按钮
	hiddenCellDelete?: boolean

	// 是否隐藏分页
	hidePagination?: boolean
	// 隐藏复选
	hideRowSelection?: boolean
}

// row类型
export type RowType<T extends RowDataType> = TableProps<T>['columns']
// // 分页配置
// export type TablePaginationConfig = Exclude<GetProp<TableProps, 'pagination'>, boolean>
// // 排序
// export type TableSortField = SorterResult<any>['field']
// //
// export type TableSortOrder = SorterResult<any>['order']
// // 筛选
// export type TableFilters = Parameters<GetProp<TableProps, 'onChange'>>[1]

// 路由跳转
export interface RouteRedirectParams {
	page: number
	pageSize: number
	sort?: string
	filter?: string
}

// 筛选参数
export interface FilterItem {
	name: string
	value: string[]
}

export const defaultUrlParamsValue = '-'

export interface ExportExcelParams<T extends RowDataType> {
	title: string
	callback?: (data: { original: T[], list: string[][] }) => void
}

// table ref
export interface TableRef<T extends RowDataType> {
	// 刷新表格数据
	reload?: () => void
	// 重置
	reset?: () => void
	// 导出为excel
	exportExcel?: (params: ExportExcelParams<T>) => void
}

// 弹窗
export interface PopupItem<T extends RowDataType> {
	title: string | ((data: T | null) => string)
	key: string
	content: (data: PopupItemContentParamsType<T>) => ReactElement
	className?: string
	footer?: React.ReactElement
	width?: number | string
	height?: number | string
}

export interface Anchors {
	uniqueId?: any
	parentUniqueId?: any
	parentUniqueIdWithCreate?: any
}

// footer参数类型
export interface FooterParams<T extends RowDataType> {
	// 弹窗显示状态
	setPopupVisible: (key: string, value: boolean) => void
	popupVisible: { [key: string]: boolean }

	// 弹窗拓展数据
	popupExtData: any
	// 表单创建完成后自动关闭表单
	autoCloseForm?: boolean
	// 点击选中的行
	rowData: T | null
	setSelectedRow: (data: any) => void
	// 刷新列表数据
	fetchData: () => void
	// 设置列表
	setData: (data: T[]) => void
	// 列表数据
	data: T[]
	// 点击的字段
	column?: keyof T
	// 选中id
	checkedIds: React.Key[]
	setCheckedIds: (data: React.Key[]) => void
	// 删除
	handleDelete: DeleteActionType

	// 表格样式
	tableStyle: TableStyle
	// 设置表格样式
	setTableStyle: (v: TableStyle) => void

	anchors: Anchors

	// 内容切换
	handleSwitchContent: (v: SwitchContentStyle) => void
	switchContentState: SwitchContentStyle
}

export type DeleteActionType = <T extends RowDataType>(pk: keyof T, val: TableCheckIdType, call?: () => void) => void

export enum SwitchContentStyle {
	table,
	custom
}

interface TableLayoutComponentItem<T extends RowDataType> {
	width?: number
	height?: number
	content: (props: ComponentProps<T>) => ReactElement
}

export interface TableLayoutComponentProps<T extends RowDataType> {
	left?: TableLayoutComponentItem<T>
	right?: TableLayoutComponentItem<T>
	header?: TableLayoutComponentItem<T>
	footer?: TableLayoutComponentItem<T>
	customSwitchContent?: TableLayoutComponentItem<T>
}

interface AfterFetchListCallProps<T extends RowDataType> {
	records: T[]
	setSelectedRow: (data: T | null) => void
	handleSetPopupVisible: (key: string, value: boolean) => void
}

export type FooterActionComponentProps<T extends RowDataType> = TableFooterType<T> & {
	disabled: boolean
	loadings: { [key: string]: boolean }
	setLoadings: (value: { [key: string]: boolean }) => void
	handleSwitchContent: (v: SwitchContentStyle) => void
	switchContentState: SwitchContentStyle
}

export interface FooterActionType<T extends RowDataType> {
	index: string
	content: (data: FooterActionComponentProps<T>) => ReactElement
}

export interface TableRowCustomActionProps <T extends RowDataType> {
	record: T
	popupCall: (visible: boolean, key: string) => void
	fetchData: () => void
	reload: () => void
}

// 表格组件props
export interface XTableProps<T extends RowDataType> extends XRouteComponentProps {
	// 表格id
	tableUniqueId: string
	// content style
	switchContentStyle?: SwitchContentStyle

	convToItem: (item: T | object) => T
	state?: TableState<T>
	columns: RowType<T>
	primaryKey: string
	itemInstance: T
	dataSourceFilter?: (records: T[]) => T[]
	tableMode?: tableMode
	// 列表响应状态
	handleListResponse?: (res: Response<FetchListResponse<T>>, reqParams: FetchQueryListParams<T>, setData: (data: T[]) => void) => T[]
	// 列表数据获取完成后执行
	afterFetchList?: (params: AfterFetchListCallProps<T>) => void
	// 默认排序字段
	defaultSortColumn?: keyof T
	defaultSortValue?: SortByEnum

	// ------------------- api
	// 创建
	create?: CreateRequestCall
	// 删除
	delete?: DeleteRequestCall
	beforeDelete?: (params: { checkedIds: TableCheckIdType, conditions: Array<Condition<T>>, data: T[] }) => Array<Condition<T>>
	// 更新
	update?: UpdateRequestCall
	// 获取列表
	fetchList: (params: FetchQueryListParams<T>, cancelToken?: CancelTokenSourceType) => Promise<Response<FetchListResponse<T>>>
	fetchListHint?: string
	// 获取详情
	fetchRow?: FetchRowRequestCall
	// ------------------- api

	// ------------------- 权限
	authority?: Authority
	// ------------------- 权限
	// licenseError可删除
	licenseErrorDeleteIgnore?: boolean

	// 组件
	components?: TableLayoutComponentProps<T>
	footerComponentItems?: Array<FooterActionType<T>>
	rowCustomActions?: (props: TableRowCustomActionProps<T>) => ReactElement

	// expandable
	expandableRender?: (data: ExpandableProps<T>) => ReactElement | undefined
	expandableState?: (data: T) => boolean

	// drag
	draggable?: boolean

	// table ref
	tableRef?: Ref<TableRef<T>> | undefined
	// 弹窗列表
	popups?: Array<PopupItem<T>>
	// 创建/详情弹窗宽度
	popupDCWidth?: number
	// 弹窗前验证
	popupVerify?: (record: T) => boolean
	// 详情组件
	form?: (data: PopupItemContentParamsType<T>) => ReactElement

	// card样式
	cardRender?: (data: ExpandableProps<T>) => ReactElement
	className?: string

	// 文字
	footerDeleteButtonText?: string
}

export type TableFooterType<T extends RowDataType> = XTableProps<T> & FooterParams<T>

// cell组件
export interface CellProducerUpdateParams<T extends RowDataType> {
	setLoading: (data: any) => void
	value: any
	callback?: (data: T) => void
}

export interface CellProducerPropsType<T extends RowDataType> extends ProducerPropsType<T> {
	handleUpdate: (params: CellProducerUpdateParams<T>) => void
	column: keyof T
	number?: boolean
}

export enum PopupKey {
	create = 'create',
	update = 'update',
	main = 'main'
}

export const filterParse = (filter: string): FilterItem[] => {
	const data = filter.split('@').map(
		(item: string) => {
			const data = item.split('=')
			if (data.length === 2) {
				return {
					name: data[ 0 ],
					value: data[ 1 ].split(',')
				} satisfies FilterItem
			}

			return null
		}
	)

	const records: FilterItem[] = []
	for (let i = 0; i < data.length; i++) {
		const item = data[ i ]
		if (item === null) {
			continue
		}

		if (item.value.length <= 0) {
			continue
		}

		records.push(item)
	}

	return records
}

export type TableCheckIdType = string | number | string[] | number[]

export const toSelectOptionType = (data: OptionItem[] | null): ANTOptionItem[] => (data ?? []).map(
	item => {
		const val: ANTOptionItem = {
			value: item.value,
			label: item.title,
			title: item.title,
			level: item.level,
			parentID: item.parentID,
			disabled: item.disabled,
			raw: item.raw
		}

		if (item.children === undefined) {
			return val
		}

		val.options = toSelectOptionType(item.children)
		return val
	}
)

export const pickOption = (value: any, data: ANTOptionItem[]): ANTOptionItem | undefined => {
	for (let i = 0; i < data.length; i++) {
		const item = data[ i ]
		if (item.value === value) {
			return item
		}
	}

	return undefined
}

export type XTableComponents<T extends RowDataType> = TableComponents<T>

export interface FetchDataParams<T extends RowDataType> {
	orders?: SortBy[]
	conditions?: Array<Condition<T>>
	page?: number
	pageSize?: number
}

export interface ParseParams {
	sort: string
	filter: string
	page: number
	pageSize: number
}