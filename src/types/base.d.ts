import type { MenuProps } from 'antd'

export abstract class RowDataType {
	// 获取主键值
	abstract primaryKeyValue(): string | number
	// 获取主键字段
	// abstract primaryKeyColumn(): keyof this
	abstract primaryKeyColumn(): string

	// 隐藏编辑按钮
	abstract hiddenEdit(): boolean
	// 隐藏删除按钮
	abstract hiddenDelete(): boolean
	// licenseError可删除
	abstract licenseErrorDeleteIgnore?(): boolean
	// 隐藏选框状态
	abstract hiddenChecked(): boolean

	// parent id
	abstract parentUniqueIdKeyColumn?(): string
	abstract parentUniqueIdKeyValue?(): string | number

	// uniqueId id
	abstract anchorUniqueIdKeyColumn?(): string

	// loading
	abstract rowLoading?(): boolean

	// 行索引 rowKey
	abstract rowKey?(): number
	// 排序字段值
	abstract getSortValue?(): number
	// 排序字段
	abstract getSortColumn?(): string
	// 更新属性
	// eslint-disable-next-line no-undef
	abstract updateProperty?(column: keyof self, value: any): any
	// 更新属性
	abstract searchRowTypes?(): { [key: string]: 'string' | 'number' } | undefined
}

export interface OptionItem {
	title: string
	value: any
	disabled?: boolean
	visible?: boolean
	activate?: boolean
	children?: OptionItem[]
	level?: number
	parentID?: any
	raw?: any
}

export type DateFormat = | 'YYYY-MM-DD' // ISO 日期格式
| 'YYYY/MM/DD' // 斜杠日期格式
| 'MM/DD/YYYY' // 美式日期格式
| 'DD/MM/YYYY' // 欧式日期格式
| 'YYYY-MM-DD HH:mm:ss' // 完整日期时间
| 'YYYY年MM月DD日' // 中文日期
| 'MMMM D, YYYY' // "January 5, 2023"
| 'h:mm A' // "2:30 PM"

export type ClassType<T> = new(data: any) => T

export interface ANTOptionItem {
	value: any
	label: string
	title: string
	options?: ANTOptionItem[]
	level?: number
	parentID?: any
	disabled?: boolean
	raw?: any
}

// 百度地图类型
declare global {
	interface Window {
		BMapGL: any
		initBaiduMap: any
		WebMediaPlayer: any
		SkeyePlayerPro: any
	}

	namespace JSX {
		interface IntrinsicElements {
			'live-player': { [key: string]: any }
		}
	}

	interface Navigator {
		connection?: NetworkInformation
		mozConnection?: NetworkInformation
		webkitConnection?: NetworkInformation
	}

	type EffectiveConnectionType = 'slow-2g' | '2g' | '3g' | '4g'

	type ConnectionType = | 'bluetooth' | 'cellular' | 'ethernet' | 'mixed' | 'none' | 'other' | 'unknown' | 'wifi' | 'wimax'

	interface NetworkInformation extends EventTarget {
		readonly type: ConnectionType
		readonly effectiveType: EffectiveConnectionType
		readonly downlink: number
		readonly downlinkMax: number
		readonly rtt: number
		readonly saveData: boolean
		onchange: EventListener
	}
}

export type ResolveFunction<T> = (value: T | PromiseLike<T>) => void
export type RejectFunction = (reason?: any) => void

export type MenuItem = Required<MenuProps>[ 'items' ][ number ]

export type PlayType = 'play' | 'playback'