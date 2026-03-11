import { proxy, route, service } from '#utils/axios'
import { Item } from './model'
import type { FetchListResponse } from '#repositories/types/response'
import type { Response } from '#types/axios.d'
import type { InternalAxiosRequestConfig } from 'axios/index'
import type { CreateRequestCall, DeleteRequestCall, FetchQueryListParams, UpdateRequestCall } from '#repositories/types/request'

export const Create: CreateRequestCall = async data => {
	return await service({
		url: proxy(route.backend, '/dictionaries'),
		method: 'post',
		data
	} as unknown as InternalAxiosRequestConfig)
}

export const Delete: DeleteRequestCall = async data => {
	return await service({
		url: proxy(route.backend, '/dictionaries'),
		method: 'delete',
		data
	} as unknown as InternalAxiosRequestConfig)
}

export const Update: UpdateRequestCall = async data => {
	return await service({
		url: proxy(route.backend, '/dictionary'),
		method: 'put',
		data
	} as unknown as InternalAxiosRequestConfig)
}

export const List = async <T = Response<FetchListResponse<Item>>>(data: FetchQueryListParams<Item>): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/dictionary/list'),
		method: 'post',
		data,
		transformType: Item,
		transformPropertyPath: [ 'list' ]
	} as unknown as InternalAxiosRequestConfig)
}

export const Row = async <T = Response<Item>>(id: string | number): Promise<T> => {
	return await service({
		url: proxy(route.backend, `/dictionary/${ id }`),
		method: 'get'
	} as unknown as InternalAxiosRequestConfig)
}

export const CheckUniqueId = async <T = Response<boolean>>(val: string): Promise<T> => {
	return await service({
		url: proxy(route.backend, `/dictionary/check/${ val }`),
		method: 'get'
	} as unknown as InternalAxiosRequestConfig)
}
