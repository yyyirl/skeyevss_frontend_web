import type { OptionItem } from '#types/base.d'
import { type DictUniqueIdType, type TreeItem } from '#repositories/types/foundation'

export class PermissionItem {
	public uniqueId: string
	public name: string
	public super: string
	public universal: boolean
	public type?: 'create' | 'delete' | 'update'
	public level: number
	public children: PermissionItem[] | null

	constructor(data: Partial<PermissionItem> = {}) {
		this.uniqueId = data.uniqueId ?? ''
		this.name = data.name ?? ''
		this.super = data.super ?? ''
		this.universal = data.universal ?? false
		this.type = data.type
		this.level = data.level ?? 0
		this.children = data.children ?? []
	}

	static conv(data: object): PermissionItem {
		return new PermissionItem(data)
	}
}

export interface PermissionType {
	backend: PermissionItem[]
	frontend: PermissionItem[]
}

export interface SettingItem {
	// 视频播放地址默认类型
	mediaServerVideoPlayAddressType: string
	// SIP 黑名单 IP
	banIp: string
	// logo
	logo: string
	// 管理后台标题
	webManageTitle: string
	// 官网地址
	website: string
	// 瓦片地图包地址
	mapTiles: string
	// 地图中心点
	mapCenterPoints: string
	// 地图放大倍数
	mapZoom: number
}

export interface Setting {
	setting: SettingItem
	permissions: PermissionType
	permissionOptions: OptionItem[]
	permissionMaps: { [key: string]: PermissionItem }

	permissionIds: string[]
	super: number
	'system-operation-log-types': { [key: number]: string }
	'internal-ip': string

	// 流媒体传输模式
	'media-trans-modes': { [key: number]: string }
	// 接入协议
	'access-protocols': { [key: number]: string }
	// 接入协议颜色区分
	'access-protocol-colors': { [key: number]: string }
	// 通道过滤
	'channel-filters': { [key: string]: string }
	// 码流索引
	'bitstream-indexes': { [key: number]: string }
	// 摄像机云台类型
	'ptz-types': { [key: number]: string }
	// vss http url
	vssHttpUrl: string
	// vss sse url
	vssSseUrl: string
	// websocket url
	wsUrl: string
	// media server url
	msUrl: string
	// rtmp
	rtmpPort: number
	// 文件代理url
	'proxy-file-url': string
	// 视频播放地址类型方式
	'ms-video-play-address-types': string[]
	// pprof
	pprof: OptionItem[]
	'pprof-file-dir': string

	// 报警类型
	'alarm-types': { [key: number]: string }
	// 报警类型扩展参数
	'event-types': { [key: number]: string }
	// 报警方式
	'alarm-methods': { [key: number]: string }
	// 报警级别
	'alarm-priorities': { [key: number]: string }
	// 信令传输协议
	'cascade-sip-protocols': { [key: number]: string }
	// sip默认服务器端口(上级)
	'sip-port': number
	// 下级默认sip服务器端口(上级)
	'cascade-sip-port': number
	// api doc目录
	'api-doc-dir': string
	// 天地图key
	'tmap-key': string
	// 演示账号登录
	showcase: boolean
}

export interface Dictionaries {
	trees: OptionItem[]
	maps: { [ key: number ]: TreeItem }
	groupTrees: { [key in DictUniqueIdType]: OptionItem }
}

export interface DepartmentsType {
	trees: OptionItem[]
	maps: { [ key: number ]: TreeItem }
}

export interface MapTiles {
	// 0 本地天地图包 1 在线天地图 2 其他在线地图
	type: 0 | 1 | 2
	url: string
	key: string
}

export const defPapTiles: MapTiles = { type: 2, url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', key: '' }
