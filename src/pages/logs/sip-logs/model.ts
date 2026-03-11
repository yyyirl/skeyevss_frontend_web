import type { RowDataType } from '#types/base.d'

export class Item implements RowDataType {
	public id: number
	public path: string
	public name: string
	public isDir: boolean
	public level: number

	constructor(data: Partial<Item> = {}) {
		this.id = data?.id ?? 0
		this.path = data?.path ?? ''
		this.name = data?.name ?? ''
		this.isDir = data?.isDir ?? false
		this.level = data?.level ?? 0
	}

	primaryKeyValue(): number {
		return this.id
	}

	primaryKeyColumn(): keyof Item {
		return 'id'
	}

	static primaryKeyColumn(): keyof Item {
		return 'id'
	}

	hiddenEdit(): boolean {
		return true
	}

	hiddenDelete(): boolean {
		return true
	}

	hiddenChecked(): boolean {
		return true
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

export interface SipFileResp {
	lines: string[]
	files: Item[]
	dir: string
}