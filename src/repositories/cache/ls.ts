import store from '#utils/store'
import { isEmpty, md5Str } from '#utils/functions'
import type { TableStyle } from '#types/ant.table'
import { type SplitStyle } from '#pages/video-filters/model'

export function LastRoute(type = 'get'): string | null {
	const key = 'last-login-route'
	if (type === 'get') {
		const route = store.get(key)
		// 清除缓存
		store.remove(key)

		if (!isEmpty(route) && (route as string) !== '' && route.indexOf('http') === 0) {
			return (new URL(route as string)).pathname
		}

		return route
	}

	store.set(key, (new URL(window.location.href)).pathname)
	return null
}

export function XTableStyle(path: string, v?: TableStyle): TableStyle | null {
	const key = 'table-style'
	const data: { [key: string]: TableStyle } = store.get(key) ?? {}
	if (v === undefined) {
		return data[ path ] === 'card' ? 'card' : 'list'
	}

	data[ path ] = v ?? 'list'
	store.set(key, data)
	return null
}

export interface VideoPreviewPreinstallItem {
	key: string
	title: string
	previews: string[]
	splitStyle: SplitStyle
	selectedIndex: number
}

export function VideoPreviewPreinstall(type: 'get' | 'set' | 'remove' = 'get', item?: { previews: string[], title: string, splitStyle: SplitStyle, selectedIndex: number }): VideoPreviewPreinstallItem[] | undefined {
	const key = 'video-preview-preinstall'
	const list: VideoPreviewPreinstallItem[] = store.get(key) ?? []
	if (type === 'get') {
		if (isEmpty(list)) {
			return []
		}

		return list
	}

	if (item === undefined) {
		return
	}

	const uniqueId = md5Str(item.previews.join('-'))
	if (type === 'remove') {
		store.set(key, list.filter(item => item.key !== uniqueId))
		return
	}

	const value: VideoPreviewPreinstallItem = {
		key: uniqueId,
		...item
	}
	store.set(key, [ value, ...list.filter(item => item.key !== uniqueId) ])
}