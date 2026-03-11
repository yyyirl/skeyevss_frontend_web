import { service, proxy, route } from '#utils/axios'
import { type LoginReqType, type LoginResp } from './model'
import type { Response } from '#types/axios.d'
import type { InternalAxiosRequestConfig } from 'axios'

/**
 * 用户名密码登录
 * @param data
 */
export const login = async <T = Response<LoginResp>>(data: LoginReqType): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/login'),
		method: 'post',
		data
	} as unknown as InternalAxiosRequestConfig)
}
