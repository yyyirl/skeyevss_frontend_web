import { proxy, route, service } from '#utils/axios'
import { type InternalAxiosRequestConfig } from 'axios/index'
import type { CreateRequestCall, DeleteRequestCall, FetchQueryListParams, UpdateRequestCall } from '#repositories/types/request'
import type { FetchListResponse } from '#repositories/types/response'
import type { Response } from '#types/axios.d'
import { Item } from './model'

export const Create: CreateRequestCall = async data => {
	return await service({
		url: proxy(route.backend, '/departments'),
		method: 'post',
		data
	} as unknown as InternalAxiosRequestConfig)
}

export const Delete: DeleteRequestCall = async data => {
	return await service({
		url: proxy(route.backend, '/departments'),
		method: 'delete',
		data
	} as unknown as InternalAxiosRequestConfig)
}

export const Update: UpdateRequestCall = async data => {
	return await service({
		url: proxy(route.backend, '/department'),
		method: 'put',
		data
	} as unknown as InternalAxiosRequestConfig)
}

export const List = async <T = Response<FetchListResponse<Item>>>(data: FetchQueryListParams<Item>): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/department/list'),
		method: 'post',
		data,
		transformType: Item,
		transformPropertyPath: [ 'list' ]
	} as unknown as InternalAxiosRequestConfig)
}

export const Row = async <T = Response<Item>>(id: string | number): Promise<T> => {
	return await service({
		url: proxy(route.backend, `/department/${ id }`),
		method: 'get'
	} as unknown as InternalAxiosRequestConfig)
}