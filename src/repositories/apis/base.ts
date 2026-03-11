import { variables } from '#constants/appoint'
import { type CancelTokenSourceType, proxy, route, service } from '#utils/axios'
import { isEmpty } from '#utils/functions'
import { type InternalAxiosRequestConfig } from 'axios'
import { PermissionItem, type PermissionType, type Setting as SettingType } from '#repositories/types/config'
import type { Response } from '#types/axios.d'
import type { TreeItem } from '#repositories/types/foundation'
import type { UpdateRequestCall } from '#repositories/types/request'
import { type VideoStreamResp, Setting as RSSetting, type Setting } from '#repositories/models/recoil-state'
import { type Item as MSItem } from '#pages/configs/media-server/model'

export const configApiCall = (setting: Setting, data?: SettingType): void => {
	if (data === undefined || isEmpty(data)) {
		return
	}

	variables.showcase = data.showcase ?? false
	const permissions: PermissionType = {
		frontend: data.permissions.frontend.map(item => new PermissionItem(item)),
		backend: data.permissions.backend.map(item => new PermissionItem(item))
	}
	setting.set({
		...data,
		permissions,
		// permissionIds: permissions.frontend.map(item => item.uniqueId),
		permissionOptions: RSSetting.permissionGroupOptions(permissions),
		permissionMaps: RSSetting.permissionsToMap(permissions)
	})
}

export const configs = async <T = Response<Setting>>(hideState?: boolean): Promise<T> => {
	if (hideState === true) {
		return await service({
			url: proxy(route.backend, `/setting${ hideState ? `?t=${ new Date().valueOf() }` : '' }`),
			method: 'get',
			disabledLoading: true,
			disabledErrMsg: true
		} as unknown as InternalAxiosRequestConfig)
	}

	return await service({
		url: proxy(route.backend, '/setting'),
		method: 'get'
	} as unknown as InternalAxiosRequestConfig)
}

export interface BaseConfigs {
	title: string
	website: string
	'showcase-username'?: string
	'showcase-password'?: string
}

export const baseConfigs = async <T = Response<BaseConfigs>>(hideState?: boolean): Promise<T> => {
	if (hideState === true) {
		return await service({
			url: proxy(route.backend, `/conf${ hideState ? `?t=${ new Date().valueOf() }` : '' }`),
			method: 'get',
			disabledLoading: true,
			disabledErrMsg: true
		} as unknown as InternalAxiosRequestConfig)
	}

	return await service({
		url: proxy(route.backend, '/conf'),
		method: 'get'
	} as unknown as InternalAxiosRequestConfig)
}

export const genUniqueId = async <T = Response<string[]>>(data: { type: 'short' | 'uniqueId' | 'cascadeDepCode' | 'cascadeChannel', count: number }): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/gen-uniqueId'),
		method: 'post',
		data
	} as unknown as InternalAxiosRequestConfig)
}

export const SettingUpdate: UpdateRequestCall = async data => {
	return await service({
		url: proxy(route.backend, '/setting'),
		method: 'put',
		data
	} as unknown as InternalAxiosRequestConfig)
}

export interface SystemInfoResp {
	// 服务启动时间
	sevStartTime: number
	// 服务器时间
	sevTime: number
	// 构建信息
	buildVersion: string
	// 运行环境
	osEnvironment: string
	// 设备码
	diskSerialCode: string
	// 通道数量
	channel: number
	// 在线通道数
	channelOnline: number
	// 过期时间
	unlimited?: boolean
	days?: number
}

export const SystemInfo = async <T = Response<SystemInfoResp>>(): Promise<T> => {
	return await service({
		url: proxy(route.backend, `/system-info?r=${ new Date().valueOf() }`),
		method: 'get'
	} as unknown as InternalAxiosRequestConfig)
}

export interface PProfAnalyzeResponse {
	results: { [key: string]: any }
	filePaths: string[]
}

export interface PProfAnalyzeServiceItem {
	name: string
	host: string
	port: number
}

export enum PProfAnalyzeRequestType {
	cpu = 'cpu',
	heap = 'heap',
	goroutine = 'goroutine',
	block = 'block',
	mutex = 'mutex'
}

export interface PProfAnalyzeRequest {
	services: PProfAnalyzeServiceItem[]
	type: PProfAnalyzeRequestType
	duration: number
}

export const PProfAnalyze = async <T = Response<PProfAnalyzeResponse>>(data: PProfAnalyzeRequest, cancelToken?: CancelTokenSourceType): Promise<T> => {
	return await service({
		url: proxy(route.backend, `/pprof-analyze?r=${ new Date().valueOf() }`),
		method: 'post',
		data,
		cancelToken: cancelToken?.token
	} as unknown as InternalAxiosRequestConfig)
}

export const RespQuery = async <T = Response<string[]>>(code: string): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/resp-query'),
		method: 'post',
		data: { code }
	} as unknown as InternalAxiosRequestConfig)
}

export interface QueryActivateCodeResp {
	diskSerialCode: string
	channel: number
	unlimited: boolean
	days: number
}

export const QueryActivateCode = async <T = Response<QueryActivateCodeResp>>(code: string): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/activate-code'),
		method: 'post',
		data: { code }
	} as unknown as InternalAxiosRequestConfig)
}

export const SetActivateCode = async <T = Response<any>>(code: string): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/activate-code'),
		method: 'put',
		data: { code }
	} as unknown as InternalAxiosRequestConfig)
}

export interface UserPasswordType {
	oldPassword: string
	password: string
	repeatPassword?: string
}

export const SetPassword: (params: UserPasswordType) => Promise<Response<boolean>> = async data => {
	return await service({
		url: proxy(route.backend, '/password'),
		method: 'put',
		data
	} as unknown as InternalAxiosRequestConfig)
}

export interface InitializePasswordType {
	password: string
}

export const InitializePassword: (params: InitializePasswordType) => Promise<Response<boolean>> = async data => {
	return await service({
		url: proxy(route.backend, '/initialize-password'),
		method: 'put',
		data
	} as unknown as InternalAxiosRequestConfig)
}

export const mac = async <T = Response<Setting>>(): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/tool/mac'),
		method: 'get'
	} as unknown as InternalAxiosRequestConfig)
}

export const DictTrees = async <T = Response<TreeItem[]>>(): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/dictionary/trees'),
		method: 'get'
	} as unknown as InternalAxiosRequestConfig)
}

export const DeptTrees = async <T = Response<TreeItem[]>>(): Promise<T> => {
	return await service({
		url: proxy(route.backend, `/department/trees?r=${ new Date().valueOf() }`),
		method: 'get'
	} as unknown as InternalAxiosRequestConfig)
}

export interface StreamUrlItem {
	name: string
	url: string
}

export interface StreamAddresses { [key: string]: StreamUrlItem }

export type DeviceControlValueType = -1 | 0 | 1

export interface MSGroupItem {
	session_id: string
	protocol: string
	base_type: string
	remote_addr: string
	start_time: string
	read_bytes_sum: number
	wrote_bytes_sum: number
	bitrate_kbits: number
	read_bitrate_kbits: number
	write_bitrate_kbits: number
}

interface FileUploadParams {
	file: any
	onProgress?: (v: number) => void
	filename?: string
	abs?: boolean
	useOriginalFilename?: boolean
}

export const FileUpload = async <T = Response<string>>({
	file, onProgress, filename, abs, useOriginalFilename
}: FileUploadParams, cancelToken?: CancelTokenSourceType): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/tool/file/upload'),
		method: 'post',
		data: { file, abs: abs === true ? '1' : '0' },
		cancelToken: cancelToken?.token,
		headers: {
			// 'Content-Type': 'application/octet-stream'
			'Content-Type': 'multipart/form-data',
			'X-Filename': useOriginalFilename === true ? encodeURIComponent(filename ?? '') : ''
		},
		onUploadProgress: (progressEvent: any) => {
			onProgress?.(
				Math.round(
					(progressEvent.loaded * 100) / progressEvent.total
				)
			)
		}
	} as unknown as InternalAxiosRequestConfig)
}

export interface DownloadProgressUpdate {
	downloaded: number
	total: number
	progress: number
	speed: number
	taskID: string
	status: 'downloading' | 'completed' | 'error' | 'cancelled'
	message: string
	filepath: string
}

interface FileDownloadParams {
	url: string
	filename?: string
	cancel?: boolean
	call: (event: MessageEvent<string>) => void
	done?: () => void
}

export const FileDownload = (
	vssUrl: string,
	{
		url,
		call,
		filename,
		cancel,
		done
	}: FileDownloadParams
): EventSource => {
	let eventUrl = `${ vssUrl }/events?type=file_download&url=${ encodeURIComponent(url) }`
	if (filename !== undefined) {
		eventUrl += `&filename=${ encodeURIComponent(filename) }`
	}

	if (cancel === true) {
		eventUrl += '&cancel=1'
	}

	const eventSource = new EventSource(eventUrl)
	eventSource.onmessage = call
	eventSource.addEventListener('end', (_event: MessageEvent) => {
		done?.()
		eventSource.close()
	})

	eventSource.onerror = (_error: Event) => {
		done?.()
		eventSource.close()
	}

	return eventSource
}

export const VssSevState = (
	vssUrl: string,
	call: (event: MessageEvent<string>) => void,
	done?: () => void
): EventSource => {
	const eventUrl = `${ vssUrl }/events?type=sev_state`
	const eventSource = new EventSource(eventUrl)
	eventSource.onmessage = call
	eventSource.addEventListener('end', (_event: MessageEvent) => {
		done?.()
		eventSource.close()
	})

	eventSource.onerror = (_error: Event) => {
		done?.()
		eventSource.close()
	}

	return eventSource
}

export const Base64FileUpload = async <T = Response<string>>(stream: string): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/tool/file/base64'),
		method: 'post',
		data: { stream }
	} as unknown as InternalAxiosRequestConfig)
}

export const ServerUpdate = async <T = Response<string>>(path: string): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/system-server-update'),
		method: 'post',
		data: { path }
	} as unknown as InternalAxiosRequestConfig)
}

export const ServerUpgrade = async <T = Response<string>>(): Promise<T> => {
	return await service({
		url: proxy(route.backend, `/system-upgrade?t=${ new Date().valueOf() }`),
		method: 'get'
	} as unknown as InternalAxiosRequestConfig)
}

export const ServerRestart = async <T = Response<string>>(): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/system-restart'),
		method: 'get'
	} as unknown as InternalAxiosRequestConfig)
}

export const DeviceDiagnose = (params: DiagnoseParams): EventSource => {
	let url = `${ params.url }/events?type=${ params.type }&deviceUniqueId=${ params.deviceUniqueId }`
	if (params.channelUniqueId !== undefined) {
		url = `${ url }&channelUniqueId=${ params.channelUniqueId }`
	}
	const eventSource = new EventSource(url)
	eventSource.onmessage = params.call
	eventSource.addEventListener('end', (_event: MessageEvent) => {
		params.done()
		eventSource.close()
	})

	eventSource.onerror = (_error: Event) => {
		params.done()
		eventSource.close()
	}

	return eventSource
}

interface OnlineStateParams {
	url: string
	type: 1 | 2
	call: (event: MessageEvent<string>) => void
	done?: () => void
}

export const OnlineState = (params: OnlineStateParams): EventSource => {
	const eventSource = new EventSource(`${ params.url }/events?type=device_online_state&deviceType=${ params.type }`)
	eventSource.onmessage = params.call
	eventSource.addEventListener('end', (_event: MessageEvent) => {
		params.done?.()
		eventSource.close()
	})

	eventSource.onerror = (_error: Event) => {
		params.done?.()
		eventSource.close()
	}

	return eventSource
}

interface SipLogsParams {
	url: string
	call: (event: MessageEvent<string>) => void
	done?: () => void
}

export const SipLogs = (params: SipLogsParams): EventSource => {
	const url = `${ params.url }/events?type=sip_logs`
	const eventSource = new EventSource(url)
	eventSource.onmessage = params.call
	eventSource.addEventListener('end', (_event: MessageEvent) => {
		params.done?.()
		eventSource.close()
	})

	eventSource.onerror = (_error: Event) => {
		params.done?.()
		eventSource.close()
	}

	return eventSource
}

export interface DCReqParams {
	deviceUniqueId?: string
	channelUniqueId?: string
	msID?: number
}

export interface MSGroupRecordItem {
	file_size: number
	stream_name: string
	app_name: string
	audio_codec: string
	video_codec: string
	video_width: number
	video_height: number
	pub?: MSGroupItem
	subs?: MSGroupItem[]
	pull?: MSGroupItem
	pushs?: MSGroupItem[]
}

export const AllGroups = async <T = Response<MSGroupRecordItem[]>>(data: DCReqParams, cancelToken?: CancelTokenSourceType): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/internal/ms/all-groups'),
		method: 'post',
		data,
		cancelToken: cancelToken?.token,
		disabledLoading: true,
		disabledErrMsg: true
	} as unknown as InternalAxiosRequestConfig)
}

export const FetchDeviceRecordFiles = async <T = Response<Array<{ record_path: string, stream_name: string }>>>(data: DCReqParams, streamNames: string[], cancelToken?: CancelTokenSourceType): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/internal/ms/query-record-by-names'),
		method: 'post',
		data: { streamNames, recordType: 2, ...data },
		cancelToken: cancelToken?.token,
		disabledLoading: true,
		disabledErrMsg: true
	} as unknown as InternalAxiosRequestConfig)
}

export const GetSMSConfig = async <T = Response<MSItem>>(data: { ip: string, port: number }, cancelToken?: CancelTokenSourceType): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/internal/ms/config'),
		method: 'post',
		data,
		cancelToken: cancelToken?.token,
		disabledLoading: true,
		disabledErrMsg: true
	} as unknown as InternalAxiosRequestConfig)
}

export interface SetSMSConfigReq {
	reboot?: boolean
	delay?: number
	config?: { [key: string]: any }
}

export const SMSReloadWithConfig = async <T = Response<any>>(addr: { ip: string, port: number }, data: SetSMSConfigReq, cancelToken?: CancelTokenSourceType): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/internal/ms/reload'),
		method: 'post',
		data: {
			...data,
			ip: addr.ip,
			port: addr.port
		},
		cancelToken: cancelToken?.token,
		disabledLoading: true,
		disabledErrMsg: true
	} as unknown as InternalAxiosRequestConfig)
}

export const GetVideoStream = async <T = Response<VideoStreamResp>>(
	data: {
		deviceUniqueId: string
		channelUniqueId: string
		startAt?: number
		endAt?: number
		download?: boolean
		speed?: number
		https?: boolean
	}
): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/internal/vss/video/stream'),
		method: 'post',
		data
	} as unknown as InternalAxiosRequestConfig)
}

export const PlaybackControl = async <T = Response<any>>(data: { streamName: string, speed?: number }): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/internal/vss/gbs/playback-control'),
		method: 'post',
		data,
		disabledLoading: true,
		disabledErrMsg: true
	} as unknown as InternalAxiosRequestConfig)
}

interface StreamSession {
	session_id: string
	protocol: string
	base_type: string
	remote_addr: string
	start_time: string
	read_bytes_sum: number
	wrote_bytes_sum: number
	bitrate_kbits: number
	read_bitrate_kbits: number
	write_bitrate_kbits: number
}

export interface StreamInfoReq {
	stream_name: string
	app_name: string
	audio_codec: string
	video_codec: string
	video_width: number
	video_height: number
	pub: StreamSession
	pull: StreamSession
	subs: StreamSession[]
	pushs: StreamSession[]
}

export const GetVideoStreamInfo = async <T = Response<StreamInfoReq>>(streamName: string, id?: number): Promise<T> => {
	return await service({
		url: proxy(route.backend, `/internal/vss/video/stream/${ id }/${ streamName }?r=${ new Date().valueOf() }`),
		method: 'get',
		disabledLoading: true,
		disabledErrMsg: true
	} as unknown as InternalAxiosRequestConfig)
}

export const StopVideoStream = async <T = Response<any>>(streamName: string, id?: number): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/internal/vss/video/stop'),
		method: 'post',
		data: { streamName, id }
	} as unknown as InternalAxiosRequestConfig)
}

export const Catalog = async <T = Response<any>>(deviceUniqueId: string): Promise<T> => {
	return await service({
		url: proxy(route.backend, `/internal/vss/gbs/catalog/${ deviceUniqueId }`),
		method: 'get'
	} as unknown as InternalAxiosRequestConfig)
}

type GbcCatalogParams = { cascadeId: number } | { departmentUniqueId: string, oldDepartmentUniqueId: string } | { channelUniqueId: string, oldChannelUniqueId: string }

export const GbcCatalog = async <T = Response<any>>(data: GbcCatalogParams): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/internal/vss/gbc/catalog'),
		method: 'post',
		data,
		disabledLoading: true,
		disabledErrMsg: true
	} as unknown as InternalAxiosRequestConfig)
}

export interface DeviceControlReq {
	horizontal: DeviceControlValueType // 水平移动 正数向左+1 负数向右-1
	vertical: DeviceControlValueType // 垂直移动 正数+1向上 负数-1向下
	minifier: DeviceControlValueType // 变倍 拉近拉远
	zoom: DeviceControlValueType // 变焦
	diaphragm: DeviceControlValueType // 光圈
	speed: number // 速度
	stop: boolean // 停止
	deviceUniqueId: string // 设备id
	channelUniqueId: string // 通道id
}

export const DeviceControl = async <T = Response<any>>(data: DeviceControlReq): Promise<T> => {
	return await service({
		url: proxy(route.backend, `/internal/vss/device-control?t=${ data.stop ? 'stop' : 'start' }`),
		method: 'post',
		data,
		disabledLoading: true,
		disabledErrMsg: true
	} as unknown as InternalAxiosRequestConfig)
}

export interface OnvifDeviceItem {
	uuid: string
	name: string
	address: string
	service_urls: string[]
	types: string[]
	xaddrs: string[]
	scopes: string[]
	model: string
	manufacturer: string
	firmware_version: string
	serial_number: string
}

export const OnvifDiscover = async <T = Response<OnvifDeviceItem[]>>(source: CancelTokenSourceType): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/internal/vss/onvif/discover'),
		method: 'get',
		cancelToken: source.token
	} as unknown as InternalAxiosRequestConfig)
}

export interface DeviceAuthInfoReq {
	ip: string
	port: number
	username: string
	password: string
}

export interface OnvifDeviceInfoResp {
	Manufacturer: string
	Model: string
	FirmwareVersion: string
	SerialNumber: string
	HardwareId: string
}

export const OnvifDeviceInfo = async <T = Response<OnvifDeviceInfoResp>>(data: DeviceAuthInfoReq): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/internal/vss/onvif/device-info'),
		method: 'post',
		data
	} as unknown as InternalAxiosRequestConfig)
}

export type PresetPointSetType = 'add' | 'reset' | 'delete' | 'skip'

export interface PresetPointSetReq {
	deviceUniqueId: string
	channelUniqueId: string
	title: string
	index: string
	type: PresetPointSetType
}

export const PresetPointSet = async <T = Response<any>>(data: PresetPointSetReq): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/internal/vss/preset-point'),
		method: 'post',
		data
	} as unknown as InternalAxiosRequestConfig)
}

export interface PresetPointsReq {
	deviceUniqueId: string
	channelUniqueId: string
}

export type PresetPointRecords = Array<{ name: string, index: string }>

export interface PresetPointsResp {
	records: PresetPointRecords
	count: number
}

export const PresetPoints = async <T = Response<PresetPointsResp>>(data: PresetPointsReq): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/internal/vss/preset-points'),
		method: 'post',
		data
	} as unknown as InternalAxiosRequestConfig)
}

interface DiagnoseParams {
	type: string
	deviceUniqueId: string
	channelUniqueId?: string
	url: string
	call: (event: MessageEvent<string>) => void
	done: () => void
}

export const WSToken = async <T = Response<string>>(): Promise<T> => {
	return await service({
		url: proxy(route.backend, '/internal/vss/ws-token'),
		method: 'get',
		disabledLoading: true,
		disabledErrMsg: true
	} as unknown as InternalAxiosRequestConfig)
}