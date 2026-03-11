import { proxy, route, service } from '#utils/axios'
import type { FetchListResponse } from '#repositories/types/response'
import type { Response } from '#types/axios.d'
import { type InternalAxiosRequestConfig } from 'axios/index'
import type { FetchQueryListParams } from '#repositories/types/request'
import { Item } from './model'

export const List = async <T = Response<FetchListResponse<Item>>>(data: FetchQueryListParams<Item>): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/system-operation-logs'),
		method: 'post',
		data,
		transformType: Item,
		transformPropertyPath: [ 'list' ]
	} as unknown as InternalAxiosRequestConfig)
}
