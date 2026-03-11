import React from 'react'
import axios, { type AxiosInstance, type AxiosResponse, type CancelTokenSource, type InternalAxiosRequestConfig, isCancel } from 'axios'
import { done, start } from 'nprogress'
import { deepGet, deepSet, isEmpty, isObject, throttle, toInstance } from '#utils/functions'
import { LastRoute } from '#repositories/cache/ls'
import { resetPwdHash, variables } from '#constants/appoint'
import type { Response } from '#types/axios.d'
import { Alert, MessageType, MMessage } from '#components/hint'
import { authorization, clearCache, logout, tokenRenewal } from './token'
import { ClearLastRoute } from '#components/location'

/**
 * http错误码定义
 * @param status
 * @param url
 */
const httpCode = (status: number, url: string): string => {
	switch (status) {
		case 400:
			return '请求错误'
		case 401:
			return '未授权，请登录'
		case 403:
			return '拒绝访问'
		case 404:
			return `请求地址出错 ${ url }`
		case 408:
			return '请求超时'
		case 500:
			return '服务器内部错误'
		case 501:
			return '服务未实现'
		case 502:
			return '网关错误'
		case 503:
			return '服务不可用'
		case 504:
			return '网关超时'
		case 505:
			return 'HTTP版本不受支持'
		default:
			return `连接出错(${ status })!`
	}
}

const service: AxiosInstance = axios.create({
	baseURL: '',
	timeout: 100000
})

const { interceptors } = service
const { request, response } = interceptors

// 请求拦截器
request.use(
	(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig<any> => {
		if (config.disabledLoading !== true) {
			start()
		}
		const res = authorization('get')
		let token = ''
		if (!isEmpty(res)) {
			token = res?.token ?? ''
		}

		config.headers.Authorization = token
		config.headers.Version = import.meta.env.VITE_HEADER_VERSION
		config.headers.Language = 'zh'
		config.headers.XProtocol = window.location.protocol === 'https:' ? 1 : 0

		return config
	},
	(error: any): any => {
		done()
		return Promise.reject(error)
	}
)

// 响应拦截器
response.use(
	(res: AxiosResponse) => {
		done()

		if (res.data?.[ 'reset-pwd' ] === true) {
			throttle(
				() => {
					if (window.location.href.lastIndexOf(resetPwdHash) > 0) {
						return
					}

					window.location.href = window.location.href.replaceAll(resetPwdHash, '') + resetPwdHash
				},
				2000
			)
		}

		variables.channelUnlimited = res.data?.[ 'channel-unlimited' ]
		variables.licenseError = res.data?.license
		tokenRenewal(res?.data as Response<any>)
		// TODO 这里的实现方式并不好未来需要改成 transformResponse 的方式!!!!
		if (res.config.transformTypeMaps !== undefined) {
			for (const key in res.config.transformTypeMaps) {
				const v = res.config.transformTypeMaps[ key ]
				const data = deepGet(res.data.data, [ key ]) ?? []
				if (Array.isArray(data)) {
					deepSet(
						res.data.data,
						[ key ],
						data.map(
							(item: { [key: string]: any }) => toInstance(
								// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
								v as any,
								item
							)
						)
					)
				} else {
					deepSet(
						res.data.data,
						[ key ],
						// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
						toInstance(v as any, data as any)
					)
				}
			}
		} else {
			if (res.config.transformType !== undefined && res.config.transformPropertyPath !== undefined) {
				const data = deepGet(res.data.data, res.config.transformPropertyPath) ?? []
				if (Array.isArray(data)) {
					deepSet(
						res.data.data,
						res.config.transformPropertyPath,
						data.map(
							(item: { [key: string]: any }) => toInstance(
								// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
								res.config.transformType as any,
								item
							)
						)
					)
				} else {
					deepSet(
						res.data.data,
						res.config.transformPropertyPath,
						// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
						toInstance(res.config.transformType as any, data as any)
					)
				}
			}
		}
		return res.data
	},
	// (error: AxiosError): any => {
	(error: any): any => {
		done()

		if (isCancel(error)) {
			return Promise.reject(new Error('canceled'))
		}

		const { response } = error
		if (isEmpty(response) || response === undefined) {
			return Promise.reject(new Error('parse response error'))
		}

		if (isObject(response.data)) {
			const res = response.data as Response<any>
			tokenRenewal(res)
			if (!variables.loginPopupSign) {
				if (response.status === 403 || response.status === 401) {
					variables.loginPopupSign = true

					clearCache()
					if (res.code === 403) {
						ClearLastRoute()
					}
					const message = res.message !== '' ? res.message : '登录超时！请重新登录'
					Alert({
						message: <div className="weight">{ message }</div>,
						success: (): void => {
							logout({
								locationSign: true,
								callback: () => {
									if (res.code !== 403) {
										LastRoute('set')
									}
								}
							})
						}
					})

					return Promise.reject(response.data)
				}

				if (error.config?.disabledErrMsg !== true) {
					if (isObject(response.data)) {
						MMessage({
							message: res.message ?? '',
							type: MessageType.error
						})
					} else {
						MMessage({
							message: httpCode(response.status as number, (response.config.url ?? '') as string),
							type: MessageType.error
						})
					}
				}
			}
		} else {
			if (error.config?.disabledErrMsg !== true) {
				MMessage({
					message: httpCode(response.status as number, (response.config.url ?? '') as string),
					type: MessageType.error
				})
			}
		}

		return Promise.reject(response.data)
	}
)

enum route {
	backend,
	external
}

/**
 * proxy
 * @param type
 * @param dir
 */
const proxy = (type: route, dir: string): string => {
	switch (type) {
		case route.backend:
			return `/${ import.meta.env.VITE_BACKEND_PROXY }/${ dir.replace(/^\//, '') }`

		case route.external:
			return `/${ import.meta.env.VITE_EXTERNAL_PROXY }/${ dir.replace(/^\//, '') }`

		default :
			return dir
	}
}

export { service, proxy, route }

export type CancelTokenSourceType = CancelTokenSource

export const getCancelSource = (): CancelTokenSourceType => axios.CancelToken.source()
