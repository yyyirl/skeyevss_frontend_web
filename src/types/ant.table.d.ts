import type * as H from 'history'
import type { AnyObject } from 'antd/es/_util/type'
import type { ColumnType as RcColumnType } from 'rc-table/lib/interface'
import { type PaginationProps } from 'antd/es/pagination'
import { type OptionItem, type RowDataType } from '#types/base.d'
import { type ReactElement } from 'react'
import type { UpdateRequestCall } from '#repositories/types/request'

export interface ExpandableProps<T extends RowDataType> {
	record: T
	records: T[]
	setRecords: (data: T[]) => void
	update?: UpdateRequestCall
	deleteRow: (call?: () => void) => void
	setPopupVisible: (data: { [ key: string ]: boolean }) => void
	popupVisible: { [ key: string ]: boolean }
	setSelectedRow: (data: T | null) => void
	setPopupExtData: (data: any) => void
}

export enum SwitchTextType {
	default, // 默认无提示
	ok, // 图标
	text, // 打开/关闭
	del // 删除/未删除
}

export enum RenderStyle {
	input = 'input',
	switch = 'switch',
	select = 'select',
	timestamp = 'timestamp',
	number = 'number'
}

interface RenderHookProps<T = any> {
	record: T
	node: ReactElement
	history: H.History<H.LocationState>
	popupCall: (() => void) | null
	expandableParams: ExpandableProps<T>
}

export type TableStyle = 'list' | 'card'

declare module 'antd/es/table/interface' {
	export interface ColumnType<RecordType = AnyObject> extends Omit<RcColumnType<RecordType>, 'title'> {
		// 单元格渲染类型风格
		renderStyle?: RenderStyle
		minValue?: number
		maxValue?: number
		// 定义renderStyle后渲染函数验证 如果返回'-'单元格也将显示- true则继续规则
		renderVerify?: (record: RecordType) => '-' | boolean
		// render hook
		renderHook?: (props: RenderHookProps<RecordType>) => ReactElement
		// select options
		options?: OptionItem[] | ((data: { record: RecordType }) => OptionItem[])
		// 批量操作
		multiple?: boolean
		// switch 文字显示类型
		switchTextType?: SwitchTextType
		// 文字反转
		switchTextReversed?: boolean
		// placeholder
		placeholder?: string
		// 默认值筛选
		defaultValueFilter?: (data: any) => any
		// 弹窗key 设置以后将调用 popup中的弹窗键值
		popup?: string
		// 提示
		tips?: ReactElement

		// // fix unused error
		// filterDropdown?: React.ReactElement | ((props: FilterDropdownProps) => React.ReactElement)
		// filterIcon?: React.ReactElement | ((filtered: boolean) => React.ReactElement)
	}

	export interface TablePaginationConfig extends PaginationProps {
		pageSize?: number
		current?: number
	}
}

export type tableMode = 'inner' | 'page'
