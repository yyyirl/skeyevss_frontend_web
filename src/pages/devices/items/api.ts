import { proxy, route, service } from '#utils/axios'
import type { FetchListResponse } from '#repositories/types/response'
import type { Response } from '#types/axios.d'
import { type InternalAxiosRequestConfig } from 'axios/index'
import type { CreateRequestCall, DeleteRequestCall, FetchQueryListParams, UpdateRequestCall } from '#repositories/types/request'
import { Item } from './model'

export const Create: CreateRequestCall = async data => {
	return await service({
		url: proxy(route.backend, '/device/item'),
		method: 'post',
		data
	} as unknown as InternalAxiosRequestConfig)
}

export const Delete: DeleteRequestCall = async data => {
	return await service({
		url: proxy(route.backend, '/device/item'),
		method: 'delete',
		data
	} as unknown as InternalAxiosRequestConfig)
}

export const Update: UpdateRequestCall = async data => {
	return await service({
		url: proxy(route.backend, '/device/item'),
		method: 'put',
		data
	} as unknown as InternalAxiosRequestConfig)
}

export const List = async <T = Response<FetchListResponse<Item, { [key: number]: string }>>>(data: FetchQueryListParams<Item>): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/device/item/list'),
		method: 'post',
		data,
		transformType: Item,
		transformPropertyPath: [ 'list' ]
	} as unknown as InternalAxiosRequestConfig)
}

export const Row = async <T = Response<Item>>(id: string | number): Promise<T> => {
	if (typeof id === 'number') {
		return await service({
			url: proxy(route.backend, `/device/item/${ id }`),
			method: 'get'
		} as unknown as InternalAxiosRequestConfig)
	}

	return await service({
		url: proxy(route.backend, `/device/item-u/${ id }`),
		method: 'get'
	} as unknown as InternalAxiosRequestConfig)
}
