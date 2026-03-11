import { proxy, route, service } from '#utils/axios'
import type { InternalAxiosRequestConfig } from 'axios'
import type { FetchQueryListParams } from '#repositories/types/request'
import type { FetchListResponse } from '#repositories/types/response'
import type { Response } from '#types/axios.d'
import { Item } from './model'

export const List = async <T = Response<FetchListResponse<Item>>>(_: FetchQueryListParams<Item>): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/run-logs'),
		method: 'get',
		transformType: Item,
		transformPropertyPath: [ 'list' ]
	} as unknown as InternalAxiosRequestConfig)
}

export const Row = async <T = Response<string[]>>(path: string, page: number, pageSize: number): Promise<T> => {
	return await service({
		url: proxy(route.backend, `/run-logs/${ page }/${ pageSize }/${ path.replaceAll('/', '+') }`),
		method: 'get'
	} as unknown as InternalAxiosRequestConfig)
}