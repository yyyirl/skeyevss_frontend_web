import { proxy, route, service } from '#utils/axios'
import type { FetchListResponse } from '#repositories/types/response'
import type { Response } from '#types/axios.d'
import { type InternalAxiosRequestConfig } from 'axios/index'
import type { DeleteRequestCall, FetchQueryListParams } from '#repositories/types/request'
import { Item, type ListMapType } from './model'

export const Delete: DeleteRequestCall = async data => {
	return await service({
		url: proxy(route.backend, '/device/alarm'),
		method: 'delete',
		data
	} as unknown as InternalAxiosRequestConfig)
}

export const List = async <T = Response<FetchListResponse<Item, ListMapType>>>(data: FetchQueryListParams<Item>): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/device/alarm/list'),
		method: 'post',
		data,
		transformType: Item,
		transformPropertyPath: [ 'list' ]
	} as unknown as InternalAxiosRequestConfig)
}
