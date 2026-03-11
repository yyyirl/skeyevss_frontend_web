import React from 'react'
import { Tag } from 'antd'
import { RenderStyle } from '#types/ant.table.d'
import { type ANTOptionItem, type OptionItem, type RowDataType } from '#types/base.d'
import { type XFormItem, XFormItemType } from '#types/ant.form.d'
import routes, { Path } from '#routers/constants'
import { makeDefRoutePathWithIdAnchor } from '#routers/anchor'
import { extractUrlComponents, isEmpty, timestampFormat } from '#utils/functions'
import { defOption, onlineOptions, pickColor, stateOptions, variables } from '#constants/appoint'
import type { TreeItem } from '#repositories/types/foundation'
import { type RowType, toSelectOptionType } from '#components/table/model'
import { columnSearchProps } from '#components/table/items'
import { requiredRule } from '#components/form/model'
import { MediaServerAddOption } from '#components/sundry'
import Location from '#components/location'
import { type Item as MSItem } from '#pages/configs/media-server/model'
import { Controls, COnvifDeviceInfo, COnvifDiscoverDevices, CSubscription } from './components'

export interface Subscription {
	catalog: boolean
	emergencyCall: boolean
	location: boolean
	ptz: boolean
}

export const defSubscription: Subscription = {
	catalog: false,
	emergencyCall: false,
	location: false,
	ptz: false
}

export const SubscriptionOptions: ANTOptionItem[] = [
	{ label: '目录', title: '目录', value: 'catalog' },
	{ label: '报警', title: '报警', value: 'emergencyCall' },
	{ label: '位置', title: '位置', value: 'location' },
	{ label: 'PTZ', title: 'PTZ', value: 'ptz' }
]

export class Item implements RowDataType {
	public id: number
	public name: string
	public label: string
	public accessProtocol: number
	public deviceUniqueId: string
	public state: number
	public online: number
	public expire: number
	public address: string
	public mediaTransMode: number
	public username: string
	public password: string
	public streamUrl: string
	public chanelCount: number
	// public smsIP: string
	public clusterServerId: string
	public manufacturerId: number
	public modelVersion: string
	public sourceType: number
	public msIds: number[]
	public registerAt: number
	public keepaliveAt: number
	public createdAt: number
	public updatedAt: number
	public onvifDiscoverItem?: OptionItem
	public onvifDeviceInfo?: boolean
	public onvifManualOperationState?: boolean
	public subscription: string
	public channelFilters: string[]
	public bitstreamIndex: number
	public sub: Subscription
	public depIds: number[]

	constructor(data: Partial<Item>) {
		this.id = data.id ?? 0
		this.name = data.name ?? ''
		this.label = data.label ?? ''
		if (this.label === '') {
			this.label = this.name
		}
		this.accessProtocol = data.accessProtocol ?? 0
		this.deviceUniqueId = data.deviceUniqueId ?? ''
		this.state = data.state ?? 0
		this.online = data.online ?? 0
		this.expire = data.expire ?? 0
		this.address = data.address ?? ''
		this.mediaTransMode = data.mediaTransMode ?? 0
		this.username = data.username ?? ''
		this.password = data.password ?? ''
		this.streamUrl = data.streamUrl ?? ''
		this.chanelCount = data.chanelCount ?? 0
		// this.smsIP = data.smsIP ?? ''
		this.clusterServerId = data.clusterServerId ?? ''
		this.manufacturerId = data.manufacturerId ?? 0
		this.modelVersion = data.modelVersion ?? ''
		this.sourceType = data.sourceType ?? 0
		this.msIds = data.msIds ?? []
		this.registerAt = data.registerAt ?? 0
		this.keepaliveAt = data.keepaliveAt ?? 0
		this.createdAt = data.createdAt ?? 0
		this.updatedAt = data.updatedAt ?? 0
		this.subscription = data.subscription ?? ''
		this.channelFilters = data.channelFilters ?? []
		this.depIds = data.depIds ?? []
		this.bitstreamIndex = data.bitstreamIndex ?? 0
		this.sub = data.sub ?? {
			emergencyCall: false,
			location: false,
			catalog: false,
			ptz: false
		}
	}

	primaryKeyValue(): string | number {
		return this.id
	}

	primaryKeyColumn(): keyof Item {
		return 'id'
	}

	anchorUniqueIdKeyColumn(): string {
		return 'deviceUniqueId'
	}

	static primaryKeyColumn(): keyof Item {
		return 'id'
	}

	hiddenEdit(): boolean {
		return false
	}

	hiddenDelete(): boolean {
		return false
	}

	hiddenChecked(): boolean {
		return false
	}

	licenseErrorDeleteIgnore(): boolean {
		return variables.channelUnlimited === true
	}

	updateProperty(column: keyof this, value: any): Item {
		const data = { ...this }
		data[ column ] = value
		return new Item(data)
	}

	accessProtocolExample(): string | undefined {
		switch (this.accessProtocol) {
			case 1:
				return '流媒体源'
			case 2:
				return 'RTMP推流'
			case 3:
				return 'ONVIF'
			case 4:
				return 'GB28181'
			case 5:
				return 'EHOME'
		}
	}

	controlState(): boolean {
		switch (this.accessProtocol) {
			case 3:
			case 4:
				return true
			default:
				return false
		}
	}

	addChannelState(): boolean {
		switch (this.accessProtocol) {
			case 2: // RTMP推流
				return true

				// case 1: // 流媒体源
				// case 3: // ONVIF协议
				// case 4: // GB28181协议
				// case 5: // EHOME协议
				//	 return false

			default:
				return false
		}
	}

	static conv(data: object): Item {
		return new Item(data)
	}
}

export interface ColumnParams {
	mediaServers: OptionItem[]
	mediaTransModeOptions: OptionItem[]
	mediaTransModeMaps: { [key: number]: OptionItem }
	accessProtocolOptions: OptionItem[]
	accessProtocolMaps: { [key: number]: OptionItem }
	accessProtocolColors: { [key: number]: string }
	channelFilters: { [key: string]: string }
	channelFilterOptions: OptionItem[]
	bitstreamIndexes: { [key: number]: string }
	bitstreamIndexOptions: OptionItem[]
	deviceTypeOptions: OptionItem[]
	deviceTypeMaps: { [key: number]: OptionItem }
	dictMaps: { [ key: number ]: TreeItem }
	msUrl: string
	onvifAddresses: string[]
	deviceOnlineState: { [key: string]: 0 | 1 }
	departmentMaps: { [key: number]: string }
}

export const columns = (params: ColumnParams): RowType<Item> => [
	{
		title: 'id',
		dataIndex: 'id',
		sorter: true,
		width: 80,
		fixed: 'left'
	},
	{
		title: '设备名称',
		dataIndex: 'label',
		width: 300,
		fixed: 'left',
		renderStyle: RenderStyle.input,
		...columnSearchProps<Item>('label')
	},
	{
		width: 300,
		dataIndex: 'label',
		renderHook: props => <Controls { ...params } { ...props.expandableParams } cType="table" />
	},
	{
		title: '接入协议',
		dataIndex: 'accessProtocol',
		sorter: true,
		width: 150,
		renderHook: props => <>{ params.accessProtocolMaps[ props.record.accessProtocol ]?.title ?? 'known' }</>,
		filters: params.accessProtocolOptions.map(
			item => ({ text: item.title, value: item.value })
		)
	},
	{
		title: '设备id',
		dataIndex: 'deviceUniqueId',
		width: 200,
		...columnSearchProps<Item>('deviceUniqueId')
	},
	{
		title: '启用状态',
		dataIndex: 'state',
		sorter: true,
		width: 150,
		hidden: true,
		renderStyle: RenderStyle.switch,
		filters: stateOptions.map(
			item => ({ text: item.title, value: item.value })
		)
	},
	{
		title: '在线状态',
		dataIndex: 'online',
		sorter: true,
		width: 150,
		hidden: true,
		filters: onlineOptions.map(
			item => ({ text: item.title, value: item.value })
		),
		renderHook: props => <>{ props.record.online === 0 ? '不在线' : '在线' }</>
	},
	{
		title: '流媒体传输模式',
		dataIndex: 'mediaTransMode',
		sorter: true,
		width: 180,
		filters: params.mediaTransModeOptions.map(
			item => ({ text: item.title, value: item.value })
		),
		options: ({ record }) => mediaTransModeOptions(
			record.accessProtocol, toSelectOptionType(params.mediaTransModeOptions ?? [])
		),
		renderStyle: RenderStyle.select
	},
	// {
	//	 title: '流媒体传输模式',
	//	 dataIndex: 'mediaTransMode',
	//	 sorter: true,
	//	 width: 200,
	//	 // renderStyle: RenderStyle.select,
	//	 // options: params.mediaTransModeOptions,
	//	 renderHook: props => <>{ params.mediaTransModeMaps[ props.record.mediaTransMode ]?.title ?? 'known' }</>,
	//	 filters: params.mediaTransModeOptions.map(
	//		 item => ({ text: item.title, value: item.value })
	//	 )
	// },
	{
		title: '注册有效期',
		dataIndex: 'expire',
		width: 220,
		renderStyle: RenderStyle.timestamp
	},
	{
		title: '心跳时间',
		dataIndex: 'keepaliveAt',
		width: 220,
		renderStyle: RenderStyle.timestamp
	},
	{
		title: '设备接入地址',
		dataIndex: 'address',
		width: 150
	},
	{
		title: '设备登录用户名',
		dataIndex: 'username',
		renderStyle: RenderStyle.input,
		width: 300,
		hidden: true,
		placeholder: '请输入设备登录用户名'
	},
	{
		title: '设备登录密码',
		dataIndex: 'password',
		renderStyle: RenderStyle.input,
		width: 300,
		hidden: true,
		placeholder: '请输入设备登录密码'
	},
	{
		title: '通道数量',
		dataIndex: 'chanelCount',
		width: 100
	},
	{
		title: '平台厂商',
		dataIndex: 'manufacturerId',
		sorter: true,
		width: 200,
		// renderStyle: RenderStyle.select,
		// options: params.deviceTypeOptions,
		renderHook: props => <>{ params.deviceTypeMaps[ props.record.manufacturerId ]?.title ?? 'known' }</>,
		filters: params.deviceTypeOptions.map(
			item => ({ text: item.title, value: item.value })
		)
	},
	{
		title: '型号',
		dataIndex: 'modelVersion',
		width: 100
	},
	{
		title: '组织部门',
		width: 200,
		dataIndex: 'depIds',
		renderHook: props => {
			if (props.record.depIds.length <= 0) {
				return <>-</>
			}

			return <div>
				{
					props.record.depIds.filter(
						item => !isEmpty(params.departmentMaps[ item ])
					).map(
						(item, key) => <Location
							key={ key }
							to={ makeDefRoutePathWithIdAnchor(routes[ Path.system ].subs?.[ Path.departments ].path ?? '', item) }
						><Tag color={ pickColor(key) } >{ params.departmentMaps[ item ] }</Tag></Location>
					)
				}
			</div>
		}
	},
	{
		title: '更新时间',
		dataIndex: 'updatedAt',
		width: 200,
		sorter: true,
		renderStyle: RenderStyle.timestamp
	},
	{
		title: '创建时间',
		dataIndex: 'createdAt',
		width: 200,
		sorter: true,
		renderHook: props => <>{ props.record.createdAt > 0 ? timestampFormat(props.record.createdAt) : timestampFormat(props.record.registerAt) }</>
	}
]

export const formColumns = (formParams: ColumnParams): Array<XFormItem<Item>> => [
	{
		dataIndex: 'accessProtocol',
		defValue: 1,
		label: '接入协议',
		type: XFormItemType.select,
		options: formParams.accessProtocolOptions,
		antOptionsFilter: (_record, options) => (options ?? []).map(
			item => ({
				...item,
				disabled: item.value === 4 || item.value === 5
			})
		),
		rules: requiredRule('接入协议不能为空'),
		disabled: record => record !== undefined && record.id > 0,
		afterOnChange: params => {
			const id = params.record?.id ?? 0
			params.setFieldValue('onvifDiscoverItem', undefined)
			params.setReadonlyMaps({})

			if (id === 0) {
				params.setFieldValue('address', '')
				params.setFieldValue('name', '')
			}

			let hiddenMaps: Partial<{ [key in keyof Item]: boolean }>
			switch (params.value) {
				case 1: // 流媒体源
					hiddenMaps = {
						username: true,
						password: true,
						subscription: true,
						channelFilters: true,
						bitstreamIndex: true,
						onvifDiscoverItem: true,
						onvifDeviceInfo: true,
						label: true,
						online: true,
						address: true,
						expire: true,
						chanelCount: true,
						clusterServerId: true,
						manufacturerId: true,
						modelVersion: true,
						deviceUniqueId: true
					}
					params.setHiddenMaps(hiddenMaps)
					return

				case 2: // RTMP推流
					hiddenMaps = {
						subscription: true,
						channelFilters: true,
						bitstreamIndex: true,
						onvifDiscoverItem: true,
						onvifDeviceInfo: true,
						label: true,
						online: true,
						address: true,
						mediaTransMode: true,
						username: true,
						password: true,
						expire: true,
						chanelCount: true,
						clusterServerId: true,
						manufacturerId: true,
						modelVersion: true,
						deviceUniqueId: true
					}

					params.setReadonlyMaps({ streamUrl: true })
					setTimeout(
						() => {
							params.formColumnInstance?.msIds?.afterOnChange?.({ ...params, value: [ 0 ] })
						},
						1000
					)

					params.setHiddenMaps(hiddenMaps)
					return

				case 3: // ONVIF协议
					hiddenMaps = {
						label: id <= 0,
						subscription: true,
						channelFilters: true,
						bitstreamIndex: true,
						onvifDiscoverItem: false,
						onvifDeviceInfo: params.record?.onvifDiscoverItem?.value !== defOnvifOption.value,
						online: true,
						expire: true,
						streamUrl: true,
						chanelCount: true,
						clusterServerId: true
					}

					params.setReadonlyMaps(onvifReadonlyMaps(true) as Partial<{ [ key in keyof Item ]: boolean }>)

					params.setHiddenMaps(hiddenMaps)
					return

				case 4: // GB28181协议
				case 5: // EHOME协议
					hiddenMaps = {
						subscription: false,
						channelFilters: false,
						bitstreamIndex: false,
						onvifDiscoverItem: true,
						onvifDeviceInfo: true,
						id: true,
						name: true,
						deviceUniqueId: true,
						online: true,
						expire: true,
						address: true,
						mediaTransMode: true,
						username: true,
						password: true,
						streamUrl: true,
						chanelCount: true,
						clusterServerId: true,
						manufacturerId: true,
						modelVersion: true,
						sourceType: true,
						msIds: false,
						createdAt: true,
						updatedAt: true
					}
					params.setHiddenMaps(hiddenMaps)
			}
		}
	},
	{
		dataIndex: 'onvifDiscoverItem',
		defValue: undefined,
		label: '设备列表',
		type: XFormItemType.custom,
		rules: requiredRule('设备不能为空'),
		render: props => <COnvifDiscoverDevices { ...props } onvifAddresses={ formParams.onvifAddresses } />
	},
	{
		dataIndex: 'onvifManualOperationState',
		defValue: false,
		sightless: true,
		label: 'onvif手动输入',
		type: XFormItemType.custom
	},
	{
		dataIndex: 'name',
		defValue: '',
		label: '设备名称',
		type: XFormItemType.input,
		rules: requiredRule('设备名称不能为空'),
		afterOnChange: params => {
			if (params.record?.sourceType === 1) {
				params.setFieldValue('label', params.value)
			}
		}
	},
	{
		dataIndex: 'label',
		defValue: '',
		afterOnChange: params => {
			if (isEmpty(params.record?.label)) {
				params.setFieldValue('label', params.record?.name)
			}
		},
		label: '自定义标签',
		type: XFormItemType.input
	},
	{
		dataIndex: 'deviceUniqueId',
		defValue: '',
		label: '设备id',
		type: XFormItemType.input,
		rules: requiredRule('设备id不能为空')
	},
	{
		dataIndex: 'state',
		defValue: 1,
		label: '使用状态',
		type: XFormItemType.switch,
		hidden: true
	},
	{
		dataIndex: 'online',
		defValue: 0,
		label: '在线状态',
		type: XFormItemType.switch
	},
	{
		dataIndex: 'expire',
		defValue: 3600,
		label: '注册有效期',
		type: XFormItemType.number,
		rules: requiredRule('注册有效期不能为空'),
		explain: () => <>单位/s</>
	},
	{
		dataIndex: 'streamUrl',
		defValue: '',
		label: '输入接入码流地址',
		type: XFormItemType.input,
		rules: requiredRule('输入接入码流地址不能为空'),
		afterOnChange: params => {
			const res = extractUrlComponents(params.value as string)
			switch (params.record?.accessProtocol) {
				case 1: // 流媒体源
					params.setFieldValue('address', res?.url)
					params.setFieldValue('username', res?.username)
					params.setFieldValue('password', res?.password)

					break

				default:
			}
		}
	},
	{
		dataIndex: 'address',
		defValue: '',
		label: '设备接入地址',
		type: XFormItemType.input,
		rules: requiredRule('设备接入地址不能为空')
	},
	{
		dataIndex: 'subscription',
		defValue: '0000',
		label: '订阅',
		type: XFormItemType.custom,
		render: CSubscription
	},
	{
		dataIndex: 'channelFilters',
		defValue: [],
		label: '通道筛选',
		type: XFormItemType.checkbox,
		options: formParams.channelFilterOptions
	},
	{
		dataIndex: 'bitstreamIndex',
		defValue: 0,
		label: '码流索引',
		type: XFormItemType.select,
		options: formParams.bitstreamIndexOptions
	},
	{
		dataIndex: 'mediaTransMode',
		defValue: 0,
		label: '流媒体传输模式',
		type: XFormItemType.select,
		options: formParams.mediaTransModeOptions,
		antOptionsFilter: (record, options) => mediaTransModeOptions(record?.accessProtocol ?? 0, options ?? []),
		rules: requiredRule('流媒体传输模式不能为空')
	},
	{
		dataIndex: 'username',
		defValue: '',
		label: '设备登录用户名',
		type: XFormItemType.input,
		rules: requiredRule('设备登录用户名不能为空')
	},
	{
		dataIndex: 'password',
		defValue: '',
		label: '设备登录密码',
		type: XFormItemType.password,
		rules: requiredRule('设备登录密码不能为空')
	},
	{
		dataIndex: 'onvifDeviceInfo',
		defValue: false,
		label: ' ',
		type: XFormItemType.custom,
		render: COnvifDeviceInfo
	},
	{
		dataIndex: 'chanelCount',
		defValue: 1,
		label: '通道数量',
		type: XFormItemType.number,
		rules: requiredRule('通道数量不能为空')
	},
	{
		dataIndex: 'clusterServerId',
		defValue: '',
		label: '集群服务器ID',
		type: XFormItemType.input
	},
	{
		dataIndex: 'manufacturerId',
		label: '平台厂商',
		type: XFormItemType.select,
		options: formParams.deviceTypeOptions,
		rules: requiredRule('平台厂商不能为空')
	},
	{
		dataIndex: 'modelVersion',
		defValue: '',
		label: '型号',
		type: XFormItemType.input,
		rules: requiredRule('型号不能为空')
	},
	{
		dataIndex: 'msIds',
		label: '绑定媒体服务',
		type: XFormItemType.checkbox,
		options: formParams.mediaServers,
		optionsFilter: (record, options) => options?.map(
			item => ({
				...item,
				disabled: record?.accessProtocol !== 2 && item.value === 0
			})
		) ?? [],
		simple: true,
		dynamicAddOption: MediaServerAddOption,
		valueRender: (value): number[] => {
			const ids: number[] = isEmpty(value) ? [ 0 ] : value
			return [ ids[ ids.length - 1 ] ]
			// switch (record?.accessProtocol) {
			// 	case 2: // RTMP推流
			// 		return [ ids[ ids.length - 1 ] ]
			//
			// 	default:
			// 		return arrayUnique([ 0, ...ids ], v => v.toString())
			// }
		},
		afterOnChange: props => {
			const id = props.record?.id ?? 0
			const value = props.value as number[]
			const url = makeStreamUrl(formParams.msUrl)
			switch (props.record?.accessProtocol) {
				case 1: // 流媒体源
					if (id <= 0) {
						props.setFieldValue('streamUrl', '')
					}
					break

				case 2: // RTMP推流
					// 选择媒体服务后设置 'streamUrl:输入接入码流地址'
					if (value.length <= 0) {
						props.setFieldValue('streamUrl', url)
						break
					}

					formParams.mediaServers.forEach(
						item => {
							if (item.value === value[ 0 ]) {
								if (value[ 0 ] === 0) {
									props.setFieldValue('streamUrl', url)
									return
								}

								const record = item.raw as MSItem
								if (record === undefined) {
									return
								}

								props.setFieldValue('streamUrl', `rtmp://${ record.ip }:${ record.port }/rlive`)
							}
						}
					)

					break

				default:
			}
		}
	}
]

function makeStreamUrl(url: string): string {
	return `rtmp://${ url.replace(/http:\/\/|https:\/\//g, '') }/rlive`
}

export const mediaTransModeOptions = (accessProtocol: number, options: ANTOptionItem[]): ANTOptionItem[] => accessProtocol !== 4
	? (options ?? []).map(
		item => {
			const label = item.label.replace(/被动|主动/g, '')
			return {
				...item,
				title: label,
				label
			}
		}
	).filter(item => item.value !== 2)
	: (options ?? [])

export const onvifReadonlyMaps = (v: boolean): any => ({ modelVersion: v, deviceUniqueId: v, manufacturerId: v, name: v })

export const defOnvifOption: OptionItem = { ...defOption, value: '0' }
