import { type Dayjs } from 'dayjs'
import type * as H from 'history'
import type React from 'react'
import { type ANTOptionItem, type MenuItem, type OptionItem } from '#types/base.d'
import { inArray, isArray, isEmpty } from '#utils/functions'

export interface Coordinates {
	x: number
	y: number
}

export type CoordinatesList = Coordinates[]
export type CSSStyle = React.CSSProperties | null

export type RangeValue = [ Dayjs | null, Dayjs | null ] | null

export type HistoryType = H.History<H.LocationState>

export class TreeItem {
	public id: number
	public name: string
	public pid: number
	public raw?: any
	public children?: TreeItem[]

	constructor(data: Partial<TreeItem>) {
		this.id = data?.id ?? 0
		this.name = data?.name ?? ''
		this.pid = data?.pid ?? 0
		this.raw = data?.raw ?? 0
		this.children = data?.children ?? []
	}

	static toOptions(list: TreeItem[]): OptionItem[] {
		const options: OptionItem[] = []
		for (let i = 0; i < list.length; i++) {
			const item = list[ i ]
			let children: OptionItem[] = []
			if ((item.children ?? []).length > 0) {
				children = TreeItem.toOptions(item.children ?? [])
			}

			options.push({
				value: item.id,
				title: item.name,
				raw: item.raw,
				children: children.length > 0 ? children : undefined
			})
		}

		return options
	}

	static rangeOptions(list: OptionItem[], call: (item: OptionItem) => OptionItem): OptionItem[] {
		const data: OptionItem[] = [ ...list ]
		for (let i = 0; i < data.length; i++) {
			data[ i ] = call({ ...data[ i ] })
			const children = data[ i ].children ?? []
			if (!isEmpty(children) && isArray(children) && children.length > 0) {
				data[ i ].children = this.rangeOptions(children, call)
			}
		}

		return data
	}

	// static findTreeParentsIterative(
	//	 id: any,
	//	 tree: OptionItem[]
	// ): OptionItem[] {
	//	 const stack: Array<{ node: OptionItem, parents: OptionItem[] }> = tree.map(node => ({ node, parents: [] }))
	//	 while (stack.length > 0) {
	//		 const data = stack.pop()
	//		 if (data === null || data === undefined) {
	//			 continue
	//		 }
	//		 const { node, parents } = data
	//
	//		 if (node.value === id) {
	//			 return parents
	//		 }
	//
	//		 if (node.children !== undefined && node.children.length > 0) {
	//			 console.log(node.children)
	//			 for (const child of [ ...node.children ].reverse()) {
	//				 stack.push({ node: child, parents: [ ...parents, node ] })
	//			 }
	//		 }
	//	 }
	//
	//	 return []
	// }

	static findTreeParentsIterative(
		id: any,
		tree: OptionItem[]
	): OptionItem[] {
		const result: OptionItem[] = []

		function traverse(nodes: OptionItem[], parentPath: OptionItem[]): boolean {
			for (const node of nodes) {
				if (`${ node.value }` === `${ id }`) {
					result.push(...parentPath)
					return true
				}

				if (node.children !== undefined && node.children?.length > 0) {
					const found = traverse(node.children, [ ...parentPath, node ])
					if (found) return true
				}
			}
			return false
		}

		traverse(tree, [])
		return result
	}

	static findParentsIterativeWithMaps(
		id: number,
		maps: { [ key: number ]: TreeItem }
	): TreeItem[] {
		if (id <= 0) {
			return []
		}

		if (isEmpty(maps[ id ])) {
			return []
		}

		if (maps[ id ].pid <= 0) {
			return []
		}

		const records: TreeItem[] = []
		function call(parentId: number): void {
			if (isEmpty(maps[ parentId ])) {
				return
			}

			records.push(maps[ parentId ])
			if (maps[ parentId ].pid > 0) {
				call(maps[ parentId ].pid)
			}
		}

		call(maps[ id ].pid)
		return records
	}

	static findChildrenIterativeWithMaps(
		id: number,
		maps: { [ key: number ]: TreeItem }
	): TreeItem[] {
		if (id <= 0) {
			return []
		}

		if (isEmpty(maps[ id ])) {
			return []
		}

		const records: TreeItem[] = []
		function call(parentId: any): void {
			for (const key in maps) {
				const item = maps[ key ]
				if (item.pid === parentId) {
					records.push(item)
					call(item.id)
				}
			}
		}

		call(maps[ id ].id)
		return records
	}

	static toGroupOptions(list: TreeItem[]): { [key in DictUniqueIdType]: OptionItem } {
		const groups: { [key in DictUniqueIdType]: OptionItem } = {
			[ DictUniqueIdType.deviceManufacturer ]: {
				title: 'device Types',
				value: 0
			},
			[ DictUniqueIdType.deviceAlarmLevel ]: {
				title: 'alarm level',
				value: 0
			},
			[ DictUniqueIdType.alarmType ]: {
				title: 'alarm types',
				value: 0
			}
		}
		const values = Object.values(DictUniqueIdType)
		for (let i = 0; i < list.length; i++) {
			const item = list[ i ]
			let children: OptionItem[] = []
			if ((item.children ?? []).length > 0) {
				children = TreeItem.toOptions(item.children ?? [])
			}

			if (item.raw?.uniqueId === undefined || item.raw?.uniqueId === null) {
				continue
			}

			if (!inArray(values, item.raw?.uniqueId)) {
				continue
			}

			groups[ item.raw?.uniqueId as DictUniqueIdType ] = {
				value: item.id,
				title: item.name,
				raw: item,
				children: children.length > 0 ? children : undefined
			}
		}

		return groups
	}

	static toMaps(list: TreeItem[]): { [ key: number ]: TreeItem } {
		const maps: { [ key: number ]: TreeItem } = {}
		const range = (list: TreeItem[]): void => {
			for (let i = 0; i < list.length; i++) {
				const item = list[ i ]
				maps[ item.id ] = item

				if ((item.children ?? []).length > 0) {
					range(item.children ?? [])
				}
			}
		}

		range(list)
		return maps
	}

	static filter(ids: number[], list: OptionItem[]): OptionItem[] {
		const records: OptionItem[] = []
		for (let i = 0; i < list.length; i++) {
			const item: OptionItem = { ...list[ i ] }
			if (!inArray(ids, item.value)) {
				continue
			}

			if ((item.children ?? []).length > 0) {
				item.children = this.filter(ids, item.children ?? [])
			}

			records.push(item)
		}

		return records
	}

	static toMenuOptions(list: OptionItem[]): MenuItem[] {
		const options: MenuItem[] = []
		for (let i = 0; i < list.length; i++) {
			const item = list[ i ]
			let children: MenuItem[] = []
			if ((item.children ?? []).length > 0) {
				children = TreeItem.toMenuOptions(item.children ?? [])
			}

			options.push({
				key: item.value,
				label: item.title,
				children: children.length > 0 ? children : undefined
			})
		}

		return options
	}

	static toOptionMaps(list: OptionItem[]): { [key: number]: OptionItem } {
		const maps: { [key: number]: OptionItem } = {}
		const range = (list: OptionItem[]): void => {
			for (let i = 0; i < list.length; i++) {
				const item = list[ i ]
				maps[ item.value ] = item

				if ((item.children ?? []).length > 0) {
					range(item.children ?? [])
				}
			}
		}

		range(list)
		return maps
	}

	static pickWithColumn(maps: { [ key: number ]: TreeItem }, column: keyof TreeItem, value: TreeItem[ keyof TreeItem ]): TreeItem | undefined {
		for (const key in maps) {
			const item = maps[ key ]
			if (item[ column ] === value) {
				return item
			}
		}

		return undefined
	}

	static pickWithRawColumn(maps: { [ key: number ]: TreeItem }, column: string, value: any): TreeItem | undefined {
		for (const key in maps) {
			const item = maps[ key ]
			if (item.raw?.[ column ] === value) {
				return item
			}
		}

		return undefined
	}

	static recordsToOptions(maps: { [key: number]: string }): OptionItem[] {
		const records: OptionItem[] = []
		for (const id in maps) {
			records.push({
				title: maps[ id ],
				value: id
			})
		}

		return records
	}

	static findANTOption(list: ANTOptionItem[], id: any): ANTOptionItem | null {
		for (let i = 0; i < list.length; i++) {
			const item = list[ i ]
			if (item.value === id) {
				return item
			}

			const parent = this.findANTOption(item.options ?? [], id)
			if (parent !== null) {
				return parent
			}
		}

		return null
	}

	static tidyOptions(list: OptionItem[]): {
		options: OptionItem[]
		maps: { [ key: string | number | symbol ]: OptionItem }
		hasChildren: { [ key: number ]: boolean }
	} {
		const data = {
			options: [] as OptionItem[],
			maps: {} as unknown as { [ key: string | number | symbol ]: OptionItem },
			hasChildren: {} as unknown as { [ key: number ]: boolean }
		}

		if (isEmpty(list)) {
			return data
		}

		const range = (list: OptionItem[], level: number): void => {
			list.forEach(
				item => {
					data.options.push({ ...item, level })
					data.maps[ item.value ] = item
					data.hasChildren[ item.value ] = false
					if (item.children !== undefined && item.children.length > 0) {
						range(item.children, level + 1)
						data.hasChildren[ item.value ] = true
					}
				}
			)
		}

		range(list, 0)
		return data
	}
}

export enum DictUniqueIdType {
	// 设备类型
	deviceManufacturer = 'device-manufacturer',
	deviceAlarmLevel = 'device-alarm-level',
	alarmType = 'alarm-type'
}

export class RangeDate {
	public start: number
	public end: number

	constructor(data: Partial<RangeDate>) {
		this.start = data.start ?? 0
		this.end = data.end ?? 0
	}
}

export class VideoItem {
	public date: RangeDate
	public path: string

	constructor(data: Partial<VideoItem>) {
		this.date = data.date ?? new RangeDate({})
		this.path = data.path ?? ''
	}
}