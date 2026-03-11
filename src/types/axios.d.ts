import 'axios'
import { AxiosProgressEvent } from 'axios'
import { type ClassType } from './base.d'

interface errors {
	code: number
	message?: string
}

export interface Response<T> {
	timestamp?: number
	node?: string
	token?: string
	logout?: boolean
	data?: T

	version?: number
	// 错误码
	code?: number
	// 提示信息
	message?: string
	errors?: errors
}

declare module 'axios' {
	interface InternalAxiosRequestConfig {
		transformType?: ClassType<any>
		transformTypeMaps?: { [key: string]: ClassType<any> }
		transformPropertyPath?: string[]
		disabledErrMsg?: boolean
		disabledLoading?: boolean
		onUploadProgress?: (progressEvent: any) => void
		onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void;
	}
}