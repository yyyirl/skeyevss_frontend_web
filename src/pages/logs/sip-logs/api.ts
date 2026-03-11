import { proxy, route, service } from '#utils/axios'
import type { InternalAxiosRequestConfig } from 'axios'
import type { Response } from '#types/axios.d'
import { type SipFileResp } from './model'

export const Files = async <T = Response<SipFileResp>>(path: string, page: number, pageSize: number): Promise<T> => {
	return await service({
		url: proxy(route.backend, `/sip-logs/${ page }/${ pageSize }/${ path.replaceAll('/', '+') }?r=${ new Date().valueOf() }`),
		method: 'get'
	} as unknown as InternalAxiosRequestConfig)
}