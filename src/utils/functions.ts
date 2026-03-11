import type React from 'react'
import { renderToString } from 'react-dom/server'
import { dateFormat } from '#constants/appoint'
import dayjs, { type Dayjs } from 'dayjs'
import { Md5 } from 'ts-md5'
import { v4 as uuidv4 } from 'uuid'
import type { OptionItem } from '#types/base.d'
import type { GetProp, UploadProps } from 'antd'
import JSZip from 'jszip'
import fileSaver from 'file-saver'
import axios from 'axios'

export type RangeValue = [ Dayjs, Dayjs ] | null
type InputDate = string | number | Date | Dayjs | null | undefined
type InputRange = [ InputDate, InputDate ] | { start: InputDate, end: InputDate } | any

export function createStyleLink(url: string, id?: string): void {
	const link = document.createElement('link')
	link.rel = 'stylesheet'
	link.type = 'text/css'
	link.href = url
	if (id !== undefined && id !== '') {
		link.setAttribute('id', id)
	}

	document.head.appendChild(link)
}

export function stripHtmlTags(element: React.ReactElement): string {
	const htmlString = renderToString(element)
	return htmlString.replace(/<[^>]*>?/gm, '')
}

export function createScript(url: string, onLoad: () => void): HTMLScriptElement {
	const script = document.createElement('script')
	script.src = url
	script.async = true
	script.onload = onLoad
	document.body.appendChild(script)
	return script
}

interface FindParentWithParams {
	element: HTMLElement | null
	call: (element: HTMLElement) => boolean
	maxLevels?: number
}

export function findParentWith({ element, maxLevels, call }: FindParentWithParams): HTMLElement | null {
	let currentLevel = 0
	while (element !== null && currentLevel < (maxLevels ?? 10)) {
		if (call(element)) {
			return element
		}

		element = element.parentElement
		currentLevel++
	}

	return null
}

/**
 * exec function
 * @param func
 * @param params
 */
export function execFunc(func: any, ...params: any[]): any {
	return typeof func === 'function' && func(...params)
}

/**
 * 阻止默认事件
 * @param e
 * @param type
 */
export function stopDefaultEvent(e: Event, type = 0): void {
	if (type === 1) {
		e.stopPropagation()
	} else if (type === 2) {
		e.preventDefault()
	} else {
		e.stopPropagation()
		e.preventDefault()
	}
}

/**
 * 是否为空
 * @param data
 */
export function isEmpty(data: any): boolean {
	return data === null || data === '' || data === undefined || data.length === 0
}

/**
 * 转数字
 * @param data
 * @param def
 */
export function toNumber(data: any, def?: number): number {
	const value = data * 1
	if (isNaN(value)) {
		if (def !== undefined && !isEmpty(def)) {
			return def
		}

		return 0
	}

	return value
}

export function getSliceFromIndex<T>(array: T[], startIndex: number, count: number): T[] {
	return startIndex < 0 || startIndex >= array.length || count <= 0 ? [] : array.slice(startIndex, startIndex + count)
}

export function pickListWithIndex<T = any>(list: T[], count: number, currentIndex: number): { list: T[], index: number } {
	const length = list.length
	if (length === 0 || count <= 0) {
		return { list: [], index: 0 }
	}

	const slice = getSliceFromIndex(list, currentIndex, count)
	let nextIndex = currentIndex + count
	if (nextIndex >= length) {
		nextIndex = nextIndex % length
	}

	if (slice.length < count) {
		nextIndex = 0
	}

	return { list: slice, index: nextIndex }
}

export function getLastElements<T>(data: T[], count: number): T[] {
	if (!Array.isArray(data)) {
		throw new Error('第一个参数必须是数组')
	}

	if (count < 0) {
		return data
	}

	if (count >= data.length) {
		return [ ...data ]
	}

	return data.slice(-count)
}

export function compareEQ(data1: any, data2: any): boolean {
	return JSON.stringify({ d: data1 }) === JSON.stringify({ d: data2 })
}

// 获取数组交集
export function arrayIntersection<T>(
	arr1: T[],
	arr2: T[],
	compareFn: (a: T, b: T) => boolean = (a, b) => a === b
): T[] {
	return arr1.length <= 0 || arr2.length <= 0
		? []
		: arr1.filter(item1 =>
			arr2.some(item2 => compareFn(item1, item2))
		)
}

export const generateSequence = (length: number): number[] => {
	return Array.from({ length }, (_, i) => i)
}

export function findParents<V = any, T = any>(
	id: V,
	list: T[],
	getPid: (item: T) => V,
	getId: (item: T) => V = (item: any) => item.id,
	maxDepth: number = 100
): T[] {
	const itemMap = new Map<V, T>()
	list.forEach(item => itemMap.set(getId(item), item))

	const parents: T[] = []
	let currentId: V | null | undefined = id
	let depth = 0

	while (currentId !== null && currentId !== undefined && depth < maxDepth) {
		depth++
		const currentItem = itemMap.get(currentId)
		if (currentItem === undefined) break

		const pid = getPid(currentItem)
		if (pid === null || pid === undefined || pid === '') break

		const parentItem = itemMap.get(pid)
		if (parentItem === undefined) break

		if (parents.some(p => getId(p) === getId(parentItem))) {
			break
		}

		parents.push(parentItem)
		currentId = pid
	}

	return parents
}

// const list = [1, 2, 3, 4, 5, 6];
// const fill = ['a', 'b', 'c', 'd'];
//
// // 测试1: index=2
// console.log(circularReplace(list, fill, 2));
// // 输出: [1, 2, 'd', 'c', 'b', 'a']
//
// // 测试2: index=4 (你的测试用例)
// console.log(circularReplace(list, fill, 4));
// // 现在正确输出: ['b', 'a', 3, 4, 'd', 'c']
//
// // 测试3: index大于长度 (8 % 6 = 2)
// console.log(circularReplace(list, fill, 8));
// // 输出: [1, 2, 'd', 'c', 'b', 'a'] (与index=2相同)
//
// // 测试4: fill比list长
// console.log(circularReplace([1, 2, 3], ['a', 'b', 'c', 'd', 'e'], 1));
// // 输出: ['e', 'd', 'c'] (只替换到回到起点)

// 替换数组元素
export function circularReplace<T>(props: { list: T[], fill: T[], index: number, reversed?: boolean }): T[] {
	if (props.list.length === 0) {
		return []
	}

	if (props.fill.length === 0) {
		return [ ...props.list ]
	}

	const startIndex = props.index % props.list.length
	const result = [ ...props.list ]
	let tmp = [ ...props.fill ]
	if (props.reversed === true) {
		tmp = tmp.reverse()
	}

	let fillIndex = 0
	let currentPos = startIndex
	while (fillIndex < tmp.length) {
		result[ currentPos ] = tmp[ fillIndex ]
		fillIndex++
		currentPos++

		if (tmp[ fillIndex ] === undefined) {
			break
		}

		if (currentPos >= props.list.length) {
			currentPos = 0
		}

		if (currentPos === startIndex) {
			break
		}
	}

	return result
}

/**
 * 是否是数组
 * @param object
 */
export function isArray(object: any): boolean {
	return Object.prototype.toString.call(object) === '[object Array]'
}

/**
 * 是否是对象
 * @param object
 */
export function isObject(object: any): boolean {
	return Object.prototype.toString.call(object) === '[object Object]'
}

/**
 * 是否是数组或对象
 * @param data
 */
export function isArrOrObj(data: any): boolean {
	return isArray(data) || isObject(data)
}

export function isUndefined(data: any): boolean {
	return typeof data === 'undefined'
}

export function getQuery(key: string): string {
	return new URLSearchParams(window.location.search).get(key) ?? ''
}

type timer = ReturnType<typeof setTimeout>
const timerMaps: { [key: string]: timer } = {}

/**
 * throttle 节流
 * @param call
 * @param ms
 * @param unique
 * @param onlyUnique
 */
export function throttle<T extends (...args: any[]) => void>(
	call: T,
	ms = 500,
	unique = '',
	onlyUnique = false
): void {
	if (!onlyUnique) {
		unique = JSON.stringify([ call, ms, unique ])
	}

	if (timerMaps[ unique ] !== null) {
		clearTimeout(timerMaps[ unique ])
	}

	timerMaps[ unique ] = setTimeout(() => {
		execFunc(call)
	}, ms)
}

// 获取时间范围
export function processTimeRanges(timeRanges: Array<[string, string]>): Array<[string, string]> {
	if (timeRanges.length === 0) {
		return []
	}

	const intervals: Array<[number, number]> = timeRanges.map(
		item => [
			new Date(item[ 0 ]).valueOf(),
			new Date(item[ 1 ]).valueOf()
		]
	)
	intervals.sort((a, b) => a[ 0 ] - b[ 0 ])

	const merged: Array<[number, number]> = [ [ ...intervals[ 0 ] ] ]
	for (let i = 1; i < intervals.length; i++) {
		const current = intervals[ i ]
		const last = merged[ merged.length - 1 ]

		if (current[ 0 ] <= last[ 1 ]) {
			last[ 1 ] = Math.max(last[ 1 ], current[ 1 ])
		} else {
			merged.push([ ...current ])
		}
	}

	const data: Array<[string, string]> = []
	for (let i = 0; i < merged.length; i++) {
		data.push(merged[ i ].map(item => timestampFormat(item)) as [string, string])
	}

	return data
}

function timeToMinutes(timeStr: string): number {
	const [ hours, minutes ] = timeStr.split(':').map(Number)
	return hours * 60 + minutes
}

function addMinutesToTime(time: string, minutesToAdd: number): string {
	const [ hoursStr, minutesStr ] = time.split(':')
	let hours = parseInt(hoursStr, 10)
	let minutes = parseInt(minutesStr, 10)

	minutes += minutesToAdd
	hours += Math.floor(minutes / 60)
	minutes = minutes % 60
	hours = hours % 24
	return `${ String(hours).padStart(2, '0') }:${ String(minutes).padStart(2, '0') }`
}

export function fillHourlyTimePercentages(
	startTime: string,
	endTime: string,
	step: number = 10
): Array<{ percentage: number, time: string }> {
	const startMinutes = timeToMinutes(startTime)
	const endMinutes = timeToMinutes(endTime)
	const totalMinutes = endMinutes - startMinutes
	const result: Array<{ percentage: number, time: string }> = []
	result.push({
		percentage: 0,
		time: startTime
	})

	for (let i = 1; i <= parseInt(String(100 / step)); i++) {
		const percentage = i * step
		const minutes = parseInt(String(percentage / 100 * totalMinutes + startMinutes))

		result.push({
			percentage,
			// time: addMinutesToTime(startTime, minutes)
			time: addMinutesToTime('00:00', minutes)
		})
	}

	if (result[ result.length - 1 ].percentage !== 100) {
		result.push({
			percentage: 100,
			time: endTime
		})
	}

	return result
}

export function convertToPercentage(start: number, end: number, current: number): number {
	if (start >= end) {
		return 0
	}

	if (current < start) {
		return 0
	}

	if (current > end) {
		return 100
	}

	const percentage = ((current - start) / (end - start)) * 100
	return Math.min(100, Math.max(0, parseFloat(percentage.toFixed(2))))
}

export function convertPercentageToNumber(start: number, end: number, percentage: number): number {
	if (percentage <= 0) {
		return start
	}

	if (percentage >= 100) {
		return end
	}

	const value = start + (percentage / 100) * (end - start)
	const roundedValue = parseFloat(value.toFixed(6))

	return Math.min(Math.max(start, end), Math.max(Math.min(start, end), roundedValue))
}

export function calculateTimeDifference(startTime: string, endTime: string): string {
	const startDate = new Date(startTime.replace(/-/g, '/'))
	const endDate = new Date(endTime.replace(/-/g, '/'))
	const diffInMs = endDate.getTime() - startDate.getTime()
	if (diffInMs < 0) {
		return '-'
	}

	const diffInSeconds = Math.floor(diffInMs / 1000)
	const diffInMinutes = Math.floor(diffInSeconds / 60)
	const diffInHours = Math.floor(diffInMinutes / 60)
	const diffInDays = Math.floor(diffInHours / 24)

	const remainingSeconds = diffInSeconds % 60
	const remainingMinutes = diffInMinutes % 60
	const remainingHours = diffInHours % 24

	if (diffInDays > 0) {
		return `${ diffInDays }天${ remainingHours }小时${ remainingMinutes }分钟${ remainingSeconds }秒`
	} else if (diffInHours > 0) {
		return `${ diffInHours }小时${ remainingMinutes }分钟${ remainingSeconds }秒`
	} else if (diffInMinutes > 0) {
		return `${ diffInMinutes }分钟${ remainingSeconds }秒`
	} else {
		return `${ remainingSeconds }秒`
	}
}

export function calculateTimeDifference1(startTime: number, endTime: number): string {
	const diffInMs = startTime - endTime
	if (diffInMs < 0) {
		return '-'
	}

	const diffInSeconds = Math.floor(diffInMs / 1000)
	const diffInMinutes = Math.floor(diffInSeconds / 60)
	const diffInHours = Math.floor(diffInMinutes / 60)
	const diffInDays = Math.floor(diffInHours / 24)

	const remainingSeconds = diffInSeconds % 60
	const remainingMinutes = diffInMinutes % 60
	const remainingHours = diffInHours % 24

	if (diffInDays > 0) {
		return `${ diffInDays }天${ remainingHours }小时${ remainingMinutes }分钟${ remainingSeconds }秒`
	} else if (diffInHours > 0) {
		return `${ diffInHours }小时${ remainingMinutes }分钟${ remainingSeconds }秒`
	} else if (diffInMinutes > 0) {
		return `${ diffInMinutes }分钟${ remainingSeconds }秒`
	} else {
		return `${ remainingSeconds }秒`
	}
}

export function timestampFormat(timestamp: number, format: string = dateFormat): string {
	if (timestamp <= 0 || isEmpty(timestamp)) {
		return '-'
	}

	return timestampToDayjs(timestamp).format(format)
}

export function getMidnightTimestamp(timestamp: number): number {
	if (timestamp <= 0) {
		return 0
	}

	const date = new Date(timestamp)
	date.setHours(0, 0, 0, 0)
	return date.getTime()
}

export function timestampToDayjs(val: any): Dayjs {
	if (typeof val === 'number') {
		if (val.toString().length >= 13) {
			return dayjs(val)
		}

		return dayjs.unix(val)
	}

	return dayjs(val as null | Dayjs)
}

type TimeInterval = [ string, string ]

export type TimeIntervalArray = TimeInterval[]

const parseTimeToTimestamp = (timeStr: string): number => {
	return new Date(timeStr).getTime()
}

const formatTimestampToTime = (timestamp: number): string => {
	return new Date(timestamp).toLocaleString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false
	}).replace(/\//g, '-')
}

export const mergeTimeIntervals = (intervals: TimeIntervalArray): TimeIntervalArray => {
	if (intervals.length <= 1) return intervals

	const timestampIntervals = intervals
		.map(([ start, end ]) => [
			parseTimeToTimestamp(start),
			parseTimeToTimestamp(end)
		])
		.sort((a, b) => a[ 0 ] - b[ 0 ])

	const merged: number[][] = []
	let current = timestampIntervals[ 0 ]

	for (let i = 1; i < timestampIntervals.length; i++) {
		const interval = timestampIntervals[ i ]
		if (interval[ 0 ] <= current[ 1 ] + 1000) {
			current[ 1 ] = Math.max(current[ 1 ], interval[ 1 ])
		} else {
			merged.push([ ...current ])
			current = interval
		}
	}

	merged.push([ ...current ])

	return merged.map(([ start, end ]) => [
		formatTimestampToTime(start),
		formatTimestampToTime(end)
	])
}

export function makeRangePickerValue(data: InputRange): RangeValue {
	if (!Array.isArray(data) || isEmpty(data)) {
		return null
	}

	if (data.length === 2) {
		const [ start, end ] = data.map(
			d => (d !== null ? timestampToDayjs(d) : null)
		)
		if (((start?.isValid()) === true) && ((end?.isValid()) === true)) {
			return [ start, end ]
		}
	}

	return null
}

export function makeSpecificRangePickerValue(data: [ number, number ]): [ Dayjs, Dayjs ] {
	const [ start, end ] = data.map(
		d => (d !== null ? timestampToDayjs(d) : null)
	)
	if (((start?.isValid()) === true) && ((end?.isValid()) === true)) {
		return [ start, end ]
	}
	return [ dayjs(), dayjs() ]
}

export function convertToRangeValue(data: InputRange): RangeValue {
	if (data === null) return null

	if (Array.isArray(data) && data.length === 2) {
		const [ start, end ] = data.map((d) => (d !== null ? dayjs(d as Dayjs) : null))
		if (((start?.isValid()) === true) && ((end?.isValid()) === true)) return [ start, end ]
	}

	if (typeof data === 'object' && 'start' in data && 'end' in data) {
		const start = data.start !== null ? dayjs(data.start as Dayjs) : null
		const end = data.end !== null ? dayjs(data.end as Dayjs) : null
		if (((start?.isValid()) === true) && ((end?.isValid()) === true)) return [ start, end ]
	}

	return null
}

export function trim(str: string, char?: RegExp, replace?: string): string {
	return str.replace(char ?? /(^\s*)|(\s*$)/g, replace ?? '')
}

export function numberFormat(n: number): string {
	if (n >= 10000000) {
		const num = n / 10000000
		return `${ num.toFixed(1) }kw`
	}

	if (n >= 10000) {
		const num = n / 10000
		return `${ num.toFixed(1) }w`
	}

	if (n >= 1000 && n < 10000) {
		const num = n / 1000
		return `${ num.toFixed(1) }k`
	}

	return n.toString()
}

export function autoConvertBits(data: number, decimalPlaces: number = 2): {
	value: number
	unit: 'KB' | 'MB' | 'GB'
} {
	if (data < 1024) {
		return {
			value: parseFloat(data.toFixed(decimalPlaces)),
			unit: 'KB'
		}
	}

	const megabytes = data / 1024
	if (megabytes < 1024) {
		return {
			value: parseFloat(megabytes.toFixed(decimalPlaces)),
			unit: 'MB'
		}
	}

	const gigabytes = megabytes / 1024
	return {
		value: parseFloat(gigabytes.toFixed(decimalPlaces)),
		unit: 'GB'
	}
}

export function isTimestamp(timestamp: number): boolean {
	const regex = /^\d{10}$/
	if (regex.test(timestamp.toString())) {
		const date = new Date(timestamp * 1000)
		return !isNaN(date.getTime())
	}
	return false
}

// 复制到剪贴板
export function copyToClipboard(text: string, callback?: () => void): void {
	const el = document.createElement('input')
	el.setAttribute('value', text)
	document.body.appendChild(el)
	el.select()
	document.execCommand('copy')
	document.body.removeChild(el)
	// return navigator.clipboard.writeText(text)
	execFunc(callback)
}

export function isURL(input: string): boolean {
	return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(input)
}

export const extractUrl = (content: string): string => {
	const data = content.match(/(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g)
	if (data === null) {
		return content
	}

	return data.length > 0 ? data[ 0 ] : ''
}

export const getYearMonth = (timestampInSeconds: number, sep = '-', sep1 = ''): string => {
	const date = new Date(timestampInSeconds * 1000)
	const year = date.getFullYear()
	const month = date.getMonth() + 1
	return `${ year }${ sep }${ month < 10 ? '0' : '' }${ month }${ sep1 }`
}

export const md5Str = (content: string): string => {
	return Md5.hashStr(content).toString()
}

export function isChrome87OrEarlier(): boolean {
	const userAgent: string = window.navigator.userAgent.toLowerCase()

	const isChrome: boolean = userAgent.includes('chrome')
	if (isChrome) {
		const versionMatch: RegExpMatchArray | null = /chrome\/(\d+)/.exec(userAgent)
		if (versionMatch !== null) {
			const chromeVersion: number = parseInt(versionMatch[ 1 ], 10)
			return chromeVersion <= 87
		}
	}

	return false
}

export function pathJoin(...paths: string[]): string {
	return paths.filter(Boolean).join('/').replace(/\/+/g, '/').replace(/\/$/, '')
}

export function getProperty(_: any, key: string): any {
	return key
}

export function getPropertyNameof<T>(key: keyof T): keyof T {
	return key
}

export function deepGet<T = unknown>(
	obj: unknown,
	path: Array<string | number>,
	defaultValue?: T
): T | undefined {
	try {
		const result = path.reduce<unknown>((current, key) => {
			if (current === null || current === undefined || typeof current !== 'object') {
				throw new Error('Invalid path')
			}
			return (current as { [key: string | number]: unknown })[ key ]
		}, obj)

		return result !== undefined ? (result as T) : defaultValue
	} catch {
		return defaultValue
	}

	// const data = { a: { b: { c: 'value' } } }
	// console.log(deepGet(data, [ 'a', 'b', 'x' ], 'default')) // "default"
	// const numValue = deepGet<number>(data, [ 'a', 'b', 'c' ], 0) // 类型为number
}

function _deepSet<T extends object>(
	obj: T,
	path: Array<string | number>,
	value: any,
	options: {
		createIfNotExist?: boolean // 路径不存在时是否创建
		allowOverwrite?: boolean // 是否允许覆盖已有值
	} = { createIfNotExist: true, allowOverwrite: true }
): T {
	// 验证输入
	if (typeof obj !== 'object' || obj === null) {
		throw new Error('Input must be an object')
	}

	if (!Array.isArray(path) || path.length === 0) {
		throw new Error('Path must be a non-empty array')
	}

	let current: any = obj

	// 遍历路径，直到倒数第二个key
	for (let i = 0; i < path.length - 1; i++) {
		const key = path[ i ]

		// 检查当前层级是否存在
		if (current[ key ] === undefined || current[ key ] === null) {
			if (options.createIfNotExist === false) {
				throw new Error(`Path ${ path.slice(0, i + 1).join('.') } does not exist`)
			}

			// 根据下一个key的类型决定创建对象还是数组
			const nextKey = path[ i + 1 ]
			current[ key ] = typeof nextKey === 'number' ? [] : {}
		}

		current = current[ key ]
	}

	const lastKey = path[ path.length - 1 ]

	// 检查是否允许覆盖已有值
	if (current[ lastKey ] !== undefined && (options.allowOverwrite === false)) {
		throw new Error(`Property ${ path.join('.') } already exists`)
	}

	// 设置值
	current[ lastKey ] = value

	return obj
}

export function deepSet<T extends object>(
	obj: T,
	path: string[],
	value: any,
	options?: {
		createIfNotExist?: boolean
		allowOverwrite?: boolean
	}
): T {
	return _deepSet(obj, path as Array<string | number>, value, options)
}

// // 使用示例
// const typedData = {
//	 user: {
//		 name: 'Alice',
//		 address: {
//			 city: 'New York',
//			 zip: 10001
//		 }
//	 }
// };
//
// // 类型安全的设置
// typeSafeDeepSet(typedData, ['user', 'address'], 'Boston');
//

// export function toInstance<T>(Class: new () => T, plainObject: any): T {
//	 const instance = new Class()
//	 Object.assign(instance as object, plainObject)
//	 return instance
// }
export function toInstance<T extends object>(
	// Class: ClassType<any> | undefined,
	Class: new (data: Partial<T>) => T,
	plainObject: { [key in string]: any }
): T {
	if (typeof plainObject !== 'object' || plainObject === null) {
		throw new Error('Input must be a non-null object')
	}

	// const instance = new Class({})
	//
	// Object.keys(plainObject).forEach(key => {
	//	 if (key in instance) {
	//		 (instance as Record<string, any>)[ key ] = plainObject[ key ]
	//	 }
	// })

	return new Class(plainObject as Partial<T>)
}

interface ElementStyle {
	width: number
	height: number
	paddingBorder: number
	margin: {
		top: number
		bottom: number
		left: number
		right: number
	}
	totalHeight: number
	ele: HTMLElement
}

function isHTMLElement(target: unknown): target is HTMLElement {
	return (target as HTMLElement).offsetHeight !== undefined
}

export function getElementHeightAdvanced(
	target: HTMLElement | string | null
): ElementStyle | null {
	let element: HTMLElement | null

	if (typeof target === 'string') {
		element = document.querySelector(target)
	} else if (isHTMLElement(target)) {
		element = target
	} else {
		return null
	}

	if (element === null) return null

	const style = window.getComputedStyle(element)
	const marginTop = parseFloat(style.marginTop)
	const marginBottom = parseFloat(style.marginBottom)

	const marginLeft = parseFloat(style.marginLeft)
	const marginRight = parseFloat(style.marginRight)

	return {
		width: element.clientWidth,
		height: element.scrollHeight,
		paddingBorder: element.offsetHeight,
		margin: {
			top: marginTop,
			bottom: marginBottom,
			left: marginLeft,
			right: marginRight
		},
		totalHeight: element.offsetHeight + marginTop + marginBottom,
		ele: element
	}
}

export function getParentNodes(
	element: HTMLElement | null,
	selector?: string
): HTMLElement[] {
	const parents: HTMLElement[] = []
	let current = element?.parentElement

	while (current !== null && current !== undefined) {
		if (selector !== undefined && current.matches(selector)) {
			parents.push(current)
		}
		current = current.parentElement
	}

	return parents
}

export function isSubset<T>(
	subset: T[],
	superset: T[],
	compareFn: (a: T, b: T) => boolean = (a, b) => a === b
): boolean {
	return subset.every((subsetItem) =>
		superset.some((supersetItem) => compareFn(subsetItem, supersetItem))
	)
}

export function arrayUnique<T = object>(data: T[], getKey: (item: T) => string): T[] {
	const seen = new Map<string, boolean>()
	const result: T[] = []

	for (const item of data) {
		const key = getKey(item)
		if (!seen.has(key)) {
			seen.set(key, true)
			result.push(item)
		}
	}

	return result
}

export function inArray<T = any>(arr: T[], val: T, call: (v1: T, v2: T) => boolean = (v1, v2) => v1 === v2): boolean {
	if (arr.length <= 0) {
		return false
	}

	for (let i = 0; i < arr.length; i++) {
		if (call(arr[ i ], val)) {
			return true
		}
	}

	return false
}

export function allIncluded<T>(a: T[], b: T[]): boolean {
	if (b.length === 0) return true
	const setA = new Set(a)
	return b.every(element => setA.has(element))
}

export function uniqueId(): string {
	return uuidv4()
}

export function getUrlFileName(url: string | null): string | undefined {
	if (url === null || url === undefined) return undefined

	return url.split('/').pop()
}

export interface ExtractUrlComponentsResp {
	protocol: string
	hostname: string
	port: string
	url: string
	username?: string
	password?: string
}

export function extractUrlComponents(url: string): ExtractUrlComponentsResp | null {
	try {
		const urlObject = new URL(url)
		const protocol = urlObject.protocol.replace(':', '')
		const hostname = urlObject.hostname
		const port = urlObject.port !== '' ? `:${ urlObject.port }` : ''

		return {
			protocol,
			hostname,
			port,
			username: urlObject.username,
			password: urlObject.password,
			url: `${ protocol }://${ hostname }${ port }`
		}
	} catch (error) {
		return null
	}
}

export const antdGetBase64 = async(file: Parameters<GetProp<UploadProps, 'beforeUpload'>>[0]): Promise<string> => await new Promise((resolve, reject) => {
	const reader = new FileReader()
	reader.readAsDataURL(file as Blob)
	reader.onload = () => { resolve(reader.result as string) }
	reader.onerror = (error) => { reject(error) }
})

export interface DownloadFilesItem {
	url: string
	title: string
}

interface DownloadFilesProps {
	list: DownloadFilesItem[]
	defExt?: string
	zipName?: string
}

export async function downloadFilesAsZip({ list, zipName = 'files.zip', defExt = 'jpg' }: DownloadFilesProps): Promise<void> {
	const zip = new JSZip()
	const promises = list.map(
		async(item, index) => {
			try {
				const response = await axios.get(item.url, { responseType: 'blob' })
				const fileName = `${ item.title }.${ item.url.split('.').pop()?.split('?')[ 0 ] ?? defExt }`
				zip.file(fileName, response.data as string)
			} catch (error) {
				console.error(`Failed to download ${ item.url }:`, error)
			}
		}
	)

	await Promise.all(promises)
	fileSaver.saveAs(await zip.generateAsync({ type: 'blob' }), zipName)
}

// 使用示例
// 1. 从URL下载
// downloadFile('https://example.com/file.pdf', 'my-file.pdf');

// 2. 从Blob下载
// const blob = new Blob([data], { type: 'application/pdf' });
// downloadFile(blob, 'document.pdf');

// 3. 从API响应下载
// fetch('/api/download').then(response => downloadFile(response));
// 下载文件
export async function downloadFile(
	data: Blob | File | string | Response,
	filename?: string,
	options?: {
		type?: string // 文件类型，如 'application/pdf'
		autoBom?: boolean // 是否自动添加BOM头（对于Excel等文件）

		progress?: (v: number) => void // 目前只添加了对url的支持
		signal?: AbortSignal
	}
): Promise<void> {
	if (typeof data === 'string') {
		const controller = new AbortController()
		const signal = options?.signal ?? controller.signal
		await downloadFromUrl({ url: data, filename, progress: options?.progress, signal })
		return
	}

	if (data instanceof Response) {
		await downloadFromResponse(data, filename, options); return
	}

	downloadBlob(data, filename ?? (data as File).name ?? 'download', options)
}

export interface DownloadFromUrlType {
	url: string
	filename?: string
	progress?: (v: number) => void
	signal?: AbortSignal
	afterDownload?: (data: Blob) => void
}

// 从URL下载文件
export async function downloadFromUrl({ url, filename, progress, signal, afterDownload }: DownloadFromUrlType): Promise<void> {
	const response = await fetch(url)
	if (!response.ok) {
		throw new Error(`下载失败: ${ response.status } ${ response.statusText }`)
	}

	signal?.addEventListener('abort', () => {
		throw new Error('下载已取消[1]')
	})

	if (signal?.aborted === true) {
		throw new Error('下载已取消[2]')
	}

	if (response.body !== null && progress !== undefined) {
		let loaded = 0
		const contentLength = response.headers.get('content-length')
		const total = contentLength !== null ? parseInt(contentLength) : 0
		const reader = response.body.getReader()
		const chunks: Uint8Array[] = []

		while (true) {
			const { done, value } = await reader.read()

			if (signal !== undefined && signal.aborted) {
				await reader.cancel()
				throw new Error('下载已取消[3]')
			}

			if (done) break
			loaded += value.length
			chunks.push(value)
			if (total > 0) {
				progress(Math.round((loaded / total) * 100))
			}
		}

		const blob = new Blob(chunks)
		const newResponse = new Response(blob, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers
		})

		await downloadFromResponse(newResponse, filename, { custom: afterDownload })
		return
	}

	await downloadFromResponse(response, filename, { custom: afterDownload })
}

// 从Response对象下载文件
async function downloadFromResponse(
	response: Response,
	filename?: string,
	options?: { type?: string, autoBom?: boolean, custom?: (data: Blob) => void }
): Promise<void> {
	const disposition = response.headers.get('Content-Disposition')
	const finalFilename = filename ?? (disposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)?.[ 1 ] ?? 'download')
		.replace(/['"]/g, '')
		.trim()
	const blob = await response.blob()
	if (options?.custom !== undefined) {
		options.custom(blob)
		return
	}

	downloadBlob(blob, finalFilename, options)
}

// 下载Blob对象
function downloadBlob(
	blob: Blob | File,
	filename: string,
	options?: { type?: string, autoBom?: boolean }
): void {
	const blobUrl = window.URL.createObjectURL(
		options?.type !== undefined ? new Blob([ blob ], { type: options.type }) : blob
	)

	const link = document.createElement('a')
	link.href = blobUrl
	link.download = filename
	link.style.display = 'none'

	document.body.appendChild(link)
	link.click()

	setTimeout(() => {
		document.body.removeChild(link)
		window.URL.revokeObjectURL(blobUrl)
	}, 100)
}

export function findNeighbors<T = { [key: string]: any }>(arr: T[], column: string, value: any): {
	previous: T | null
	next: T | null
} {
	const index = arr.findIndex((item) => ((item as any)[ column ]) === value)
	if (index === -1) {
		return { previous: null, next: null }
	}

	const previous = index > 0 ? arr[ index - 1 ] : null
	const next = index < arr.length - 1 ? arr[ index + 1 ] : null

	return { previous, next }
}

export function rangeMaps<K extends string | number | symbol, V>(maps: { [ key in K ]: V }, call: (item: V, key: K) => any): { [ key in K ]: V } {
	for (const key in maps) {
		maps[ key ] = call(maps[ key ], key)
	}

	return maps
}

export function mapToOptions(data: { [key: string]: string }, valConv: (v: any) => any): OptionItem[] {
	const records: OptionItem[] = []
	for (const key in data) {
		records.push({
			title: data[ key ],
			value: valConv(key)
		})
	}

	return records
}

export function optionsToMap(data: OptionItem[]): { [key: number]: string } {
	const maps: { [key: string]: string } = {}
	for (let i = 0; i < data.length; i++) {
		maps[ data[ i ].value ] = data[ i ].title
	}
	return maps
}

export function topMap<
	T = any,
	K extends string | number | symbol = any,
	V = any
>(
	records: T[],
	call: (item: T, map: Partial<{ [ key in K ]: V }>) => void
): Partial<{ [ key in K ]: V }> {
	const maps: Partial<{ [ key in K ]: V }> = {}
	for (let i = 0; i < records.length; i++) {
		call(records[ i ], maps)
	}

	return maps
}

export function mapFilter<K extends string | number | symbol = any, T = any>(maps: { [key in K]: T }, call: (key: K, val: T) => boolean): { [key in K]: T } {
	const data: { [key in K]: T } = {} as any
	for (const key in maps) {
		const item = maps[ key ]
		if (call(key, item)) {
			data[ key ] = item
		}
	}
	return data
}

// function dictToArray<K extends string | number | symbol, V>(
//	 dict: Record<K, V>
// ): Array<{ key: K, value: V }> {
//	 return (Object.entries(dict) as Array<[K, V]>).map(([ key, value ]) => ({ key, value }))
// }

export const setClassName = {
	/**
	 * 为元素添加一个或多个类名
	 * @param element 目标元素
	 * @param classNames 要添加的类名（可以是一个或多个，用空格分隔）
	 */
	add(element: HTMLElement | null, ...classNames: string[]): void {
		if (element === null || (classNames.length === 0)) return

		classNames.forEach(className => {
			if (className.trim() !== '') {
				element.classList.add(...className.trim().split(/\s+/))
			}
		})
	},

	/**
	 * 从元素中移除一个或多个类名
	 * @param element 目标元素
	 * @param classNames 要移除的类名（可以是一个或多个，用空格分隔）
	 */
	remove(element: HTMLElement | null, ...classNames: string[]): void {
		if (element === null || (classNames.length === 0)) return

		classNames.forEach(className => {
			if (className.trim() !== '') {
				element.classList.remove(...className.trim().split(/\s+/))
			}
		})
	},

	/**
	 * 切换元素的类名（存在则删除，不存在则添加）
	 * @param element 目标元素
	 * @param className 要切换的类名
	 * @param force 强制添加(true)或删除(false)
	 */
	toggle(element: HTMLElement | null, className: string, force?: boolean): void {
		if (element === null || (className.trim() === '')) return
		element.classList.toggle(className.trim(), force)
	},

	/**
	 * 检查元素是否包含指定的类名
	 * @param element 目标元素
	 * @param className 要检查的类名
	 * @returns 是否包含该类名
	 */
	contains(element: HTMLElement | null, className: string): boolean {
		if (element === null || (className.trim() === '')) return false
		return element.classList.contains(className.trim())
	},

	/**
	 * 替换元素的类名
	 * @param element 目标元素
	 * @param oldClassName 要替换的旧类名
	 * @param newClassName 要替换成的新类名
	 */
	replace(element: HTMLElement | null, oldClassName: string, newClassName: string): void {
		if (element === null || (oldClassName.trim() === '') || (newClassName.trim() === '')) return
		element.classList.replace(oldClassName.trim(), newClassName.trim())
	}
}

export async function isImageAccessibleFetch(url: string, timeout: number = 5000): Promise<boolean> {
	return await new Promise(
		(resolve, reject) => {
			const controller = new AbortController()
			const timeoutId = setTimeout(() => { controller.abort() }, timeout)

			void fetch(url, {
				method: 'HEAD',
				signal: controller.signal,
				headers: {
					'Cache-Control': 'no-cache'
				}
			}).then(
				() => {
					resolve(true)
				}
			).catch(reject)
			clearTimeout(timeoutId)
		}
	)
}
