import { proxy, route, service } from '#utils/axios'
import { type InternalAxiosRequestConfig } from 'axios/index'
import type { Response } from '#types/axios.d'
import { type ServerHealthResp } from './model'

export const ServerHealth = async <T = Response<ServerHealthResp>>(): Promise<T> => {
	return await service({
		url: proxy(route.backend, `/server-health?r=${ new Date().valueOf() }`),
		method: 'get',
		disabledErrMsg: true,
		disabledLoading: true
	} as unknown as InternalAxiosRequestConfig)
}
