import type { SortBy as SortByEnum } from '#constants/appoint'
import { type RowDataType } from '#types/base.d'
import type { Response } from '#types/axios.d'

export interface SortBy {
	column: string
	value: SortByEnum
}

export enum Operator {
	eq = '=',
	lt = '<',
	lte = '<=',
	gt = '>',
	gte = '>=',
	neq = '!=',
	in = 'IN',
	notin = 'notin',
	jai = 'ai',
	jac = 'aic',
	jal = 'ail',
	like = 'like',
	match = 'match',
	matchPhrase = 'match_phrase',
	fulltextBoolMatch = 'fbm'
}

export enum OperatorOuter {
	and = 'and',
	or = 'or'
}

export type TCondition<T extends RowDataType> = {
	column: keyof T
	value: any
} | {
	column: keyof T
	values: any[]
}

export type Condition<T extends RowDataType> = TCondition<T> & {
	operator?: Operator
	logicalOperator?: OperatorOuter
	inner?: Array<Condition<T>>
}

export interface FetchQueryListParams<T extends RowDataType> {
	limit?: number
	page?: number
	orders?: SortBy[]
	conditions?: Array<Condition<T>>
	ids?: number[]
	keyword?: string
	random?: boolean
	all?: boolean
}

export interface FetchQueryOptionListParams {
	limit?: number
	page?: number
	orders?: SortBy[]
	conditions?: Array<Condition<any>>
	ids?: number[]
	keyword?: string
	random?: boolean
	all?: boolean
	type?: number
}

export interface UpdateItem<T extends RowDataType> {
	column: keyof T
	value: any
}

export type ValueDictionary<T extends RowDataType> = {
	[K in Extract<T[keyof T], string>]?: any;
}

// 更新
export interface UpdateRequest<T extends RowDataType> {
	conditions: Array<Condition<T>>
	data: Array<UpdateItem<T>>
}

// 删除
export interface DeleteRequest<T extends RowDataType> {
	conditions: Array<Condition<T>>
	all?: boolean
}

// 创建
export interface CreateRequest<T extends RowDataType> {
	record: ValueDictionary<T>
}

// 创建
export type CreateRequestCall = <T extends RowDataType>(params: CreateRequest<T>) => Promise<Response<number | string | null | undefined>>

// 删除
export type DeleteRequestCall = <T extends RowDataType>(params: DeleteRequest<T>) => Promise<Response<boolean>>

// 更新
export type UpdateRequestCall = <T extends RowDataType>(params: UpdateRequest<T>) => Promise<Response<boolean>>

// 获取详情
export type FetchRowRequestCall = <T extends RowDataType>(id: string | number) => Promise<Response<T>>