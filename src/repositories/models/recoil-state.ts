import { type ReactElement } from 'react'
import type { ItemType } from 'antd/es/breadcrumb/Breadcrumb'
import { atom } from 'recoil'
import { themeDark, themeLight } from '#constants/appoint'
import type { OptionItem } from '#types/base.d'
import { isEmpty } from '#utils/functions'
import { authorization } from '#utils/token'
import store from '#utils/store'
import { type TokenType } from '#repositories/types/local-store'
import type { DepartmentsType, Dictionaries as DictionariesType, PermissionItem, PermissionType, Setting as SettingType } from '#repositories/types/config'
import { type VideoItem } from '#repositories/types/foundation'
import { type StreamAddresses } from '#repositories/apis/base'
import State from './recoil'

export const profileCheck = {
	intervalState: false,
	neededUpdate: false
}

export class Profile extends State {
	static profile = atom({
		key: 'profile',
		default: authorization('get')
	})

	constructor() {
		if (!profileCheck.intervalState) {
			profileCheck.intervalState = true
			setInterval(
				() => {
					if (profileCheck.neededUpdate) {
						setTimeout(
							() => {
								if (!profileCheck.neededUpdate) {
									return
								}
								profileCheck.neededUpdate = false
								super.setState(authorization('get'))
							},
							1000
						)
					}
				},
				500
			)
		}

		super(Profile.profile)
	}

	shared(): TokenType | null {
		return super.shared() as TokenType
	}

	set(profile: TokenType | null): void {
		super.setState(profile)
	}
}

// 主题
export class Theme extends State {
	static readonly cacheKey = 'theme'
	static readonly dark = themeDark
	static readonly light = themeLight

	static theme = atom({
		key: 'theme',
		default: Theme.cache()
	})

	static cache(): string {
		if (store.get(Theme.cacheKey) === Theme.dark) {
			return Theme.dark
		}

		return Theme.light
	}

	constructor() {
		super(Theme.theme)
	}

	shared(): string {
		return super.shared() as string
	}

	set(): void {
		if (this.state === Theme.light) {
			store.set(Theme.cacheKey, Theme.dark)
			super.setState(Theme.dark)
			return
		}

		store.set(Theme.cacheKey, Theme.light)
		super.setState(Theme.light)
	}
}

// 系统配置
export class Setting<T = SettingType> extends State {
	static setting = atom({
		key: 'setting',
		default: null
	})

	constructor() {
		super(Setting.setting)
	}

	shared(): T {
		return super.shared()
	}

	set(data: T): void {
		super.setState(data)
	}

	static permissionOptions(permissions: PermissionItem[], parentID: string): OptionItem[] {
		const records: OptionItem[] = []
		for (let i = 0; i < permissions.length; i++) {
			const item = permissions[ i ]
			records.push({
				title: item.name,
				value: item.uniqueId,
				children: this.permissionOptions(item.children ?? [], item.uniqueId),
				level: item.level,
				parentID
			})
		}

		return records
	}

	static permissionGroupOptions(permissions: PermissionType): OptionItem[] {
		const records: OptionItem[] = []
		if (permissions.frontend.length > 0) {
			records.push({
				title: '管理后台',
				value: '-1',
				level: -1,
				children: permissions.frontend.map(
					item => ({
						title: item.name,
						value: item.uniqueId,
						level: item.level,
						children: this.permissionOptions(item.children ?? [], item.uniqueId),
						retract: 1,
						parentID: '-1'
					})
				)
			})
		}

		if (permissions.backend.length > 0) {
			records.push({
				title: '后端接口',
				value: '-2',
				level: -1,
				children: permissions.backend.map(
					item => ({
						title: item.name,
						value: item.uniqueId,
						children: this.permissionOptions(item.children ?? [], item.uniqueId),
						level: item.level,
						retract: 1,
						parentID: '-2'
					})
				)
			})
		}

		return records
	}

	static permissionsToMap(permissions: PermissionType): { [ key: string ]: PermissionItem } {
		const maps: { [ key: string ]: PermissionItem } = {}
		const fn = (list: PermissionItem[]): void => {
			for (let i = 0; i < list.length; i++) {
				const item = list[ i ]
				maps[ item.uniqueId ] = item
				if ((item.children ?? []).length > 0) {
					fn(item.children ?? [])
				}
			}
		}

		fn(permissions.frontend)
		fn(permissions.backend)

		return maps
	}

	static authorities(maps: { [ key: string ]: PermissionItem }, uniqueIds: string[]): { create: boolean, update: boolean, delete: boolean } {
		const source = {
			create: false,
			update: false,
			delete: false
		}

		uniqueIds.forEach(
			item => {
				const data = maps[ item ]
				if (isEmpty(data)) {
					return
				}

				(data.children ?? []).forEach(
					item => {
						if (item.type === 'create') {
							source.create = true
						} else if (item.type === 'update') {
							source.update = true
						} else if (item.type === 'delete') {
							source.delete = true
						}
					}
				)
			}
		)

		return source
	}
}

// 字典
export class Dictionaries<T = DictionariesType> extends State {
	static dictionaries = atom({
		key: 'dictionaries',
		default: null
	})

	constructor() {
		super(Dictionaries.dictionaries)
	}

	shared(): T {
		return super.shared()
	}

	set(data: T): void {
		super.setState(data)
	}
}

// 部门信息
export class Departments<T = DepartmentsType> extends State {
	static departments = atom({
		key: 'departments',
		default: null
	})

	constructor() {
		super(Departments.departments)
	}

	shared(): T {
		return super.shared()
	}

	set(data: T): void {
		super.setState(data)
	}
}

// 导航
export class Breadcrumbs<T = ItemType[]> extends State {
	static breadcrumbs = atom({
		key: 'breadcrumbs',
		default: null
	})

	constructor() {
		super(Breadcrumbs.breadcrumbs)
	}

	shared(): T {
		return super.shared()
	}

	set(data: T): void {
		super.setState(data)
	}
}

export type MenuDirectionType = (typeof MenuDirection.direction)[keyof typeof MenuDirection.direction]

// 菜单位置
export class MenuDirection<T = MenuDirectionType> extends State {
	static readonly cacheKey = 'menu-direction-state'

	public static readonly direction = {
		top: 'top',
		left: 'left'
	} as const

	static menuDirection = atom({
		key: 'menuDirection',
		default: MenuDirection.cache()
	})

	constructor() {
		super(MenuDirection.menuDirection)
	}

	shared(): T {
		return super.shared()
	}

	set(data: T): void {
		store.set(MenuDirection.cacheKey, data)
		super.setState(data)
	}

	static cache(): MenuDirectionType {
		return store.get(this.cacheKey) ?? this.direction.top
	}
}

// 菜单收折状态
export class MenuFold<T = boolean> extends State {
	static readonly cacheKey = 'menu-fold-state'
	static menuFold = atom({
		key: 'menuFold',
		default: MenuFold.cache() ?? false
	})

	constructor() {
		super(MenuFold.menuFold)
	}

	shared(): T {
		return super.shared()
	}

	set(data: T): void {
		store.set(MenuFold.cacheKey, data)
		super.setState(data)
	}

	static cache(): boolean {
		return store.get(this.cacheKey) === true
	}
}

// 重置密码
export class ResetPassword<T = boolean> extends State {
	static data = atom({
		key: 'resetPassword',
		default: false
	})

	constructor() {
		super(ResetPassword.data)
	}

	shared(): T {
		return super.shared()
	}

	set(data: T): void {
		super.setState(data)
	}
}

export interface VideoSaveParams {
	filename: string
	blob?: Blob
	startAt: number
	endAt: number
}

export interface VideoStreamResp {
	accessProtocol: number
	accessProtocolName: string
	mediaServerNode: string
	mediaServerName: string
	mediaServerID: number

	deviceID: string
	channelID: string
	streamName: string
	streamUrl: string

	channelName: string
	deviceName: string

	channelOnlineState: boolean

	addresses: StreamAddresses
}

export interface RTVideoProps {
	visible: boolean
	close?: () => void
	// 组件内=true
	inner?: boolean
	showInnerControl?: boolean

	deviceUniqueId: string
	channelUniqueId: string

	setChannelRecord?: (data: { streamState: number, streamMSId: number }) => void

	startAt?: number
	endAt?: number

	download?: boolean
	playSpeed?: number

	showDescription?: boolean
	header?: string | ReactElement
	// 截图回调
	screenshot?: (data?: string) => void
	// 保存录像
	videoSave?: (params: VideoSaveParams) => void
	// 通知父级videoStream数据
	videoStream?: (data: VideoStreamResp) => void
	destroy?: () => void
}

// 视频弹窗
export class VideoPopup<T = RTVideoProps> extends State {
	static data = atom({
		key: 'videoPopup',
		default: false
	})

	constructor() {
		super(VideoPopup.data)
	}

	shared(): T {
		return super.shared()
	}

	set(data: T): void {
		super.setState(data)
	}
}

interface VideosPopupDataType {
	videos: VideoItem[]
	visible: boolean
	index: number
}

const defVideosPopupDataType: VideosPopupDataType = {
	videos: [],
	visible: false,
	index: 0
}

const videosPopupDataType: VideosPopupDataType = { ...defVideosPopupDataType }

export class VideosPopupData<T = VideosPopupDataType> extends State {
	static data = atom({
		key: 'videos-popup-data',
		default: defVideosPopupDataType
	})

	constructor() {
		super(VideosPopupData.data)
	}

	shared(): T {
		return super.shared()
	}

	set(
		data: {
			videos?: VideoItem[]
			visible?: boolean
			index?: number
		}
	): void {
		if (data.visible !== undefined) {
			videosPopupDataType.visible = data.visible
		}

		if (data.videos !== undefined) {
			videosPopupDataType.videos = data.videos
		}

		if (data.index !== undefined) {
			videosPopupDataType.index = data.index
		}

		super.setState({ ...videosPopupDataType })
	}
}

export interface DeviceItem {
	id: number
	name: string
	label: string
	deviceUniqueId: string
	accessProtocol: number
}

export interface ChannelItem {
	id: number
	uniqueId: string
	deviceUniqueId: string
	parentId: string
	name: string
	label: string
	depIds: number[]
	online: number
}

export interface Previews {
	devices: DeviceItem[]
	channels: ChannelItem[]
}

export interface DCPopupSubmitParams {
	close: () => void
	checkedChannelUniqueIds: string[]
	unCheckedChannelUniqueIds: string[]
	keyword: string
	online: number
	interval: number
}

export interface DCPopupType {
	title?: ReactElement
	depIds?: number[]
	visible: boolean
	useFilterComponent?: boolean
	submit?: (data: DCPopupSubmitParams) => void
}

// 设备通道弹窗
export class DCPopup<T = DCPopupType> extends State {
	static data = atom({
		key: 'DCPopup',
		default: false
	})

	constructor() {
		super(DCPopup.data)
	}

	shared(): T {
		return super.shared()
	}

	set(data: T): void {
		super.setState(data)
	}
}

export interface InputSetProps {
	defaultValue?: string
	submit?: (val: string, close: () => void) => void
	close?: () => void
	title?: ReactElement
	visible: boolean
}

export class InputSet<T = InputSetProps> extends State {
	static data = atom({
		key: 'InputSet',
		default: false
	})

	constructor() {
		super(InputSet.data)
	}

	shared(): T {
		return super.shared()
	}

	set(data: T): void {
		super.setState(data)
	}
}

export interface RequireDeviceDiagnoseProps {
	deviceUniqueId: string
	channelUniqueId?: string
}

export interface DeviceDiagnoseProps {
	close?: () => void
	visible: boolean
}

export type DeviceDiagnoseType = DeviceDiagnoseProps & RequireDeviceDiagnoseProps

export class DeviceDiagnose<T = DeviceDiagnoseType> extends State {
	static data = atom({
		key: 'DeviceDiagnose',
		default: false
	})

	constructor() {
		super(DeviceDiagnose.data)
	}

	shared(): T {
		return super.shared()
	}

	set(data: T): void {
		super.setState(data)
	}
}

export interface QueryActivateCodeVisibleProps {
	type: 'query' | 'update'
	visible: boolean
	close?: () => void
	afterClose?: () => void
}

export class QueryActivateCodeVisible<T = QueryActivateCodeVisibleProps> extends State {
	static data = atom({
		key: 'QueryActivateCodeVisible',
		default: false
	})

	constructor() {
		super(QueryActivateCodeVisible.data)
	}

	shared(): T {
		return super.shared()
	}

	set(data: T): void {
		super.setState(data)
	}
}

export interface SevUpdateVisibleProps {
	visible: boolean
	close?: () => void
	afterClose?: () => void
}

export class SevUpdateVisible<T = SevUpdateVisibleProps> extends State {
	static data = atom({
		key: 'SevUpdateVisible',
		default: false
	})

	constructor() {
		super(SevUpdateVisible.data)
	}

	shared(): T {
		return super.shared()
	}

	set(data: T): void {
		super.setState(data)
	}
}

interface ChannelsPopupSubmitType {
	channelItems: any[]
	cancelCheckedChannelItems: any[]
	interval: number
	close?: () => void
}

export interface ChannelsPopupType {
	close?: () => void
	checkedChannelUniqueIds?: any[]
	visible: boolean
	interval?: number
	title?: ReactElement
	submit?: (params: ChannelsPopupSubmitType) => void
	filterState?: boolean
	hideInterval?: boolean
	useOriginalId?: boolean
}

// 通道列表弹窗
export class ChannelsPopup<T = ChannelsPopupType> extends State {
	static data = atom({
		key: 'ChannelsPopup',
		default: false
	})

	constructor() {
		super(ChannelsPopup.data)
	}

	shared(): T {
		return super.shared()
	}

	set(data: T): void {
		super.setState(data)
	}
}

export interface SevStateType {
	close?: () => void
	visible: boolean
}

// 服务状态
export class SevCheckState<T = SevStateType> extends State {
	static data = atom({
		key: 'SevCheckState',
		default: false
	})

	constructor() {
		super(SevCheckState.data)
	}

	shared(): T {
		return super.shared()
	}

	set(data: T): void {
		super.setState(data)
	}
}

export interface SettingUpdateVisibleProps {
	visible: boolean
	close?: () => void
	afterClose?: () => void
}

export class SettingUpdateVisible<T = SettingUpdateVisibleProps> extends State {
	static data = atom({
		key: 'SettingUpdateVisible',
		default: false
	})

	constructor() {
		super(SettingUpdateVisible.data)
	}

	shared(): T {
		return super.shared()
	}

	set(data: T): void {
		super.setState(data)
	}
}

export interface PasswordSetVisibleProps {
	visible: boolean
	close?: () => void
	afterClose?: () => void
}

export class PasswordSetVisible<T = PasswordSetVisibleProps> extends State {
	static data = atom({
		key: 'PasswordSetVisible',
		default: false
	})

	constructor() {
		super(PasswordSetVisible.data)
	}

	shared(): T {
		return super.shared()
	}

	set(data: T): void {
		super.setState(data)
	}
}

export interface RespQueryVisibleProps {
	visible: boolean
	close?: () => void
	afterClose?: () => void
}

export class RespQueryVisible<T = RespQueryVisibleProps> extends State {
	static data = atom({
		key: 'RespQueryVisible',
		default: false
	})

	constructor() {
		super(RespQueryVisible.data)
	}

	shared(): T {
		return super.shared()
	}

	set(data: T): void {
		super.setState(data)
	}
}

export interface GetMapPointsStateProps {
	visible: boolean
	points?: [number, number]
	close?: () => void
	afterClose?: () => void
	callback?: (lat: number, lng: number) => void
}

export class GetMapPointsState<T = GetMapPointsStateProps> extends State {
	static data = atom({
		key: 'GetMapPointsState',
		default: { visible: false }
	})

	constructor() {
		super(GetMapPointsState.data)
	}

	shared(): T {
		return super.shared()
	}

	set(data: T): void {
		super.setState(data)
	}
}

export class CurrentCascadeUniqueIdState<T = string> extends State {
	static data = atom({
		key: 'CurrentCascadeUniqueIdState',
		default: ''
	})

	constructor() {
		super(CurrentCascadeUniqueIdState.data)
	}

	shared(): T {
		return super.shared()
	}

	set(data: T): void {
		super.setState(data)
	}
}

export interface DownloadUpgradePackageType {
	state: 0 | 1 | 2 // 0 未下载 1 开始下载 2 下载中
	progress: number
	url: string
}

export class DownloadUpgradePackage<T = DownloadUpgradePackageType> extends State {
	static readonly cacheKey = 'download-upgrade-package'

	static data = atom({
		key: 'DownloadUpgradePackage',
		default: DownloadUpgradePackage.cache()
	})

	constructor() {
		super(DownloadUpgradePackage.data)
	}

	shared(): T {
		return super.shared()
	}

	static cache(): DownloadUpgradePackageType {
		const cacheData = store.get(DownloadUpgradePackage.cacheKey) as DownloadUpgradePackageType
		if (isEmpty(cacheData)) {
			return {
				state: 0,
				progress: 0,
				url: ''
			}
		}

		return cacheData
	}

	set(data: T): void {
		store.set(DownloadUpgradePackage.cacheKey, data)
		super.setState(data)
	}
}

export class LayoutUpdate<T = number> extends State {
	static data = atom({
		key: 'LayoutUpdate',
		default: 0
	})

	constructor() {
		super(LayoutUpdate.data)
	}

	shared(): T {
		return super.shared()
	}

	set(data: T): void {
		super.setState(data)
	}
}