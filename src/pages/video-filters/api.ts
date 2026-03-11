import { proxy, route, service } from '#utils/axios'
import type { Response } from '#types/axios.d'
import { type InternalAxiosRequestConfig } from 'axios/index'
import { type Previews } from '#repositories/models/recoil-state'

export const List = async <T = Response<Previews>>(accessProtocol?: number[]): Promise<T> => {
	return await service({
		url: proxy(route.backend, `/device/preview${ accessProtocol !== undefined ? `?accessProtocols=${ accessProtocol.join(',') }` : '' }`),
		method: 'get'
	} as unknown as InternalAxiosRequestConfig)
}
