import { proxy, route, service } from '#utils/axios'
import type { Response } from '#types/axios.d'
import type { InternalAxiosRequestConfig } from 'axios/index'

export const Update = async(content: string): Promise<Response<boolean>> => {
	return await service({
		url: proxy(route.backend, '/env'),
		method: 'put',
		data: { content }
	} as unknown as InternalAxiosRequestConfig)
}

export const Row = async <T = Response<{ content: string, file: string }>>(): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/env'),
		method: 'get'
	} as unknown as InternalAxiosRequestConfig)
}
