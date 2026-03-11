import { type OptionItem } from '#types/base'

// 获取列表响应
export interface FetchListResponse<T, ET = any> {
	list?: T[]
	count?: number
	maps?: { [key: number]: any }
	slices?: any[]
	ext?: ET
}
// 获取列表响应
export interface FetchOptionListResponse {
	list?: OptionItem[]
	count?: number
	maps?: { [key: number]: any }
}