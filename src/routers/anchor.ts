import { defPageSize } from '#constants/appoint'
import { trim } from '#utils/functions'

export enum Anchor {
	create = 'with-create',
	id = 'with-id-',
	pid = 'with-pid-',
	pc = 'with-pc-',
	filter = 'with-filter-',
	multiple = 'with-multiple-'
}

export const createAnchors: Anchor[] = [
	Anchor.create,
	Anchor.pc
]

export const makeDefRoutePathWithCreateAnchor = (path: string): string => {
	return path === '' ? '' : `${ path }/1/${ defPageSize }/-/-/${ Anchor.create }`
}

export const makeDefRoutePathWithFilterAnchor = (path: string, val: string): string => {
	if (val.trim() === '') {
		return path === '' ? '' : `${ path }/1/${ defPageSize }`
	}

	return path === '' ? '' : `${ path }/1/${ defPageSize }/-/-/${ Anchor.filter }${ val }`
}

export const makeDefRoutePathWithColumnFilter = (path: string, column: string, value: string | number): string => {
	return path === '' ? '' : `${ path }/1/${ defPageSize }/-/${ column }=${ value }`
}

export const makeDefRoutePathWithIdAnchor = (path: string, id: string | number): string => {
	return path === '' ? '' : `${ path }/1/${ defPageSize }/-/-/${ Anchor.id }${ id }`
}

export const makeDefRoutePathWithPIdAnchor = (path: string, id: string | number): string => {
	return path === '' ? '' : `${ path }/1/${ defPageSize }/-/-/${ Anchor.pid }${ id }`
}

export const makeDefRoutePathWithPCAnchor = (path: string, id: string | number): string => {
	return path === '' ? '' : `${ path }/1/${ defPageSize }/-/-/${ Anchor.pc }${ id }`
}

export const makeDefRoutePathWithMultipleAnchor = (path: string, data: any[]): string => {
	return path === '' ? '' : `${ path }/1/${ defPageSize }/-/-/${ Anchor.multiple }${ data.join(',') }`
}

export const parseAnchorId = (anchor?: string): string | undefined => {
	if (anchor === undefined || anchor === '') {
		return undefined
	}

	if (anchor.indexOf(Anchor.id) !== 0) {
		return undefined
	}

	return trim(anchor.replace(Anchor.id, ''))
}

export const parseAnchorPId = (anchor?: string): string | undefined => {
	if (anchor === undefined || anchor === '') {
		return undefined
	}

	if (anchor.indexOf(Anchor.pid) !== 0) {
		return undefined
	}

	return trim(anchor.replace(Anchor.pid, ''))
}

export const parseAnchorPC = (anchor?: string): string | undefined => {
	if (anchor === undefined || anchor === '') {
		return undefined
	}

	if (anchor.indexOf(Anchor.pc) !== 0) {
		return undefined
	}

	return trim(anchor.replace(Anchor.pc, ''))
}

export const parseAnchorFilter = (anchor?: string): string | undefined => {
	if (anchor === undefined || anchor === '') {
		return undefined
	}

	if (anchor.indexOf(Anchor.filter) !== 0) {
		return undefined
	}

	return trim(anchor.replace(Anchor.filter, ''))
}

export const parseAnchorMultiple = (anchor?: string): string[] | undefined => {
	if (anchor === undefined || anchor === '') {
		return undefined
	}

	if (anchor.indexOf(Anchor.multiple) !== 0) {
		return undefined
	}

	const data = trim(anchor.replace(Anchor.multiple, ''))
	if (data === '') {
		return undefined
	}

	return data.split(',')
}

interface ParseAnchorColumnFilter {
	column: string | undefined
	value: string | null
}

export const parseAnchorColumnFilter = (anchor?: string): ParseAnchorColumnFilter | undefined => {
	if (anchor === undefined || anchor === '') {
		return undefined
	}

	const data = trim(anchor).split('=')
	if (data.length > 1) {
		return { column: data[ 0 ], value: data[ 1 ] }
	}

	return { column: data[ 0 ], value: null }
}

export const currentUrl = (url: string): string => url.replace(/^(https?:\/\/[^/:\s]+(:\d+)?)\/?/, '/')

export function replaceWithCreateAnchor(url: string): string {
	let req = currentUrl(url)
	createAnchors.forEach(
		item => {
			const withIndex = req.indexOf('/' + item)
			if (withIndex === -1) return req

			const queryIndex = req.indexOf('?', withIndex)
			const hashIndex = req.indexOf('#', withIndex)

			let endIndex = req.length
			if (queryIndex !== -1) {
				endIndex = queryIndex
			} else if (hashIndex !== -1) {
				endIndex = hashIndex
			}

			req = req.substring(0, withIndex) + req.substring(endIndex)
		}
	)

	return req
}