import { proxy, route, service } from '#utils/axios'
import type { FetchListResponse } from '#repositories/types/response'
import type { Response } from '#types/axios.d'
import { type InternalAxiosRequestConfig } from 'axios/index'
import type { CreateRequestCall, DeleteRequestCall, FetchQueryListParams, UpdateRequestCall } from '#repositories/types/request'
import { Item } from './model'

export const Create: CreateRequestCall = async data => {
	return await service({
		url: proxy(route.backend, '/device/channel'),
		method: 'post',
		data
	} as unknown as InternalAxiosRequestConfig)
}

export const Delete: DeleteRequestCall = async data => {
	return await service({
		url: proxy(route.backend, '/device/channel'),
		method: 'delete',
		data
	} as unknown as InternalAxiosRequestConfig)
}

export const Update: UpdateRequestCall = async data => {
	return await service({
		url: proxy(route.backend, '/device/channel'),
		method: 'put',
		data
	} as unknown as InternalAxiosRequestConfig)
}

export interface Plans { [key: number]: { [key: number]: Array<[string, string]> } }

export const List = async <T = Response<FetchListResponse<Item, { plans: Plans }>>>(data: FetchQueryListParams<Item>): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/device/channel/list'),
		method: 'post',
		data,
		transformType: Item,
		transformPropertyPath: [ 'list' ]
	} as unknown as InternalAxiosRequestConfig)
}

export const Row = async <T = Response<Item>>(id: string | number): Promise<T> => {
	return await service({
		url: proxy(route.backend, `/device/channel/${ id }`),
		method: 'get'
	} as unknown as InternalAxiosRequestConfig)
}

export const RowWithParams = async <T = Response<Item>>(data: FetchQueryListParams<Item>): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/device/channel-with-params'),
		method: 'post',
		data,
		disabledErrMsg: true,
		disabledLoading: true
	} as unknown as InternalAxiosRequestConfig)
}
