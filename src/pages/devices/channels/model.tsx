import React from 'react'
import { RenderStyle } from '#types/ant.table.d'
import { type OptionItem, type PlayType, type RowDataType } from '#types/base.d'
import { type XFormItem, XFormItemType } from '#types/ant.form.d'
import { isEmpty } from '#utils/functions'
import { stateOptions, variables } from '#constants/appoint'
import { type TreeItem, type VideoItem } from '#repositories/types/foundation'
import { type RowType } from '#components/table/model'
import { columnSearchProps } from '#components/table/items'
import { requiredRule } from '#components/form/model'
import { type Item as DeviceItem } from '#pages/devices/items/model'
import { Controls } from './components'
import type { Plans } from './api'
import { genUniqueId } from '#repositories/apis/base'

export class Item implements RowDataType {
	public id: number
	public uniqueId: string
	public deviceUniqueId: string
	public cascadeChannelUniqueId: string
	public cascadeDepUniqueId: string
	public name: string
	public label: string
	public ptzType: number
	public streamUrl: string
	public cdnState: number
	public cdnUrl: string
	public longitude: number
	public latitude: number
	public onDemandLiveState: number
	public audioState: number
	public transCodedState: number
	public online: number
	public streamState: number
	public recordingState: number
	public streamMSId: number
	public original: string
	public snapshot: string
	public videos: VideoItem[]
	public screenshots: string[]
	public depIds: number[]
	public parentID: string
	public parental: number
	public isCascade: number
	public createdAt: number
	public updatedAt: number

	public deviceItem?: DeviceItem

	constructor(data: Partial<Item>) {
		this.id = data.id ?? 0
		this.uniqueId = data.uniqueId ?? ''
		this.deviceUniqueId = data.deviceUniqueId ?? ''
		this.cascadeChannelUniqueId = data.cascadeChannelUniqueId ?? ''
		this.cascadeDepUniqueId = data.cascadeDepUniqueId ?? ''
		this.name = data.name ?? ''
		this.label = data.label ?? ''
		if (this.label === '') {
			this.label = this.name
		}
		this.ptzType = data.ptzType ?? 0
		this.streamUrl = data.streamUrl ?? ''
		this.cdnState = data.cdnState ?? 0
		this.cdnUrl = data.cdnUrl ?? ''
		this.longitude = data.longitude ?? 0
		this.latitude = data.latitude ?? 0
		this.onDemandLiveState = data.onDemandLiveState ?? 0
		this.audioState = data.audioState ?? 0
		this.transCodedState = data.transCodedState ?? 0
		this.online = data.online ?? 0
		this.streamState = data.streamState ?? 0
		this.recordingState = data.recordingState ?? 0
		this.streamMSId = data.streamMSId ?? 0
		this.original = data.original ?? ''
		this.snapshot = data.snapshot ?? ''
		this.videos = data.videos ?? []
		this.screenshots = data.screenshots ?? []
		this.depIds = data.depIds ?? []
		this.parentID = data.parentID ?? ''
		this.parental = data.parental ?? 0
		this.isCascade = data.isCascade ?? 0
		this.createdAt = data.createdAt ?? 0
		this.updatedAt = data.updatedAt ?? 0
		this.deviceItem = data.deviceItem
	}

	primaryKeyValue(): string | number {
		return this.id
	}

	anchorUniqueIdKeyColumn(): string {
		return 'uniqueId'
	}

	primaryKeyColumn(): keyof Item {
		return 'id'
	}

	static primaryKeyColumn(): keyof Item {
		return 'id'
	}

	parentUniqueIdKeyColumn(): keyof Item {
		return 'deviceUniqueId'
	}

	parentUniqueIdKeyValue(): string | number {
		return this.deviceUniqueId
	}

	hiddenEdit(): boolean {
		return false
	}

	hiddenDelete(): boolean {
		return this.setHiddenState()
	}

	licenseErrorDeleteIgnore(): boolean {
		return variables.channelUnlimited === true
	}

	hiddenChecked(): boolean {
		return this.setHiddenState()
	}

	updateProperty(column: keyof this, value: any): Item {
		const data = { ...this }
		data[ column ] = value
		return new Item(data)
	}

	setHiddenState(): boolean {
		switch (this.deviceItem?.accessProtocol) {
			case 2: // RTMP推流
				return false

				// case 1: // 流媒体源
				// case 3: // ONVIF协议
				// case 4: // GB28181协议
				// case 5: // EHOME协议
				//	 return false

			default:
				return true
		}
	}

	static apType(accessProtocol: number): 'pub' | 'pull' {
		switch (accessProtocol) {
			case 2: // RTMP推流
				return 'pub'
			case 4: // GB28181协议
				return 'pub'

			case 5: // EHOME协议
				return 'pub'

			// case 1: // 流媒体源
			// case 3: // ONVIF协议
			default:
				return 'pull'
		}
	}

	static conv(data: object): Item {
		return new Item(data)
	}
}

export interface ColumnParams {
	ptzTypeOptions: OptionItem[]
	dictMaps: { [ key: number ]: TreeItem }
	deviceMaps: { [key: string]: DeviceItem }
	deviceUniqueId: string
	mediaServers: OptionItem[]
	deviceOnlineState: { [key: string]: 0 | 1 }
	accessProtocolMaps: { [key: number]: OptionItem }
	plans: Plans
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
		title: '通道名称',
		dataIndex: 'label',
		width: 300,
		fixed: 'left',
		renderStyle: RenderStyle.input,
		...columnSearchProps<Item>('label')
	},
	{
		dataIndex: 'label',
		width: 350,
		renderHook: props => <Controls { ...params } { ...props.expandableParams } cType="table" />
	},
	{
		title: '通道id',
		dataIndex: 'uniqueId',
		width: 200,
		...columnSearchProps<Item>('uniqueId')
	},
	{
		title: '设备id',
		dataIndex: 'deviceUniqueId',
		width: 200,
		...columnSearchProps<Item>('deviceUniqueId')
	},
	{
		title: '摄像机云台类型',
		dataIndex: 'ptzType',
		sorter: true,
		width: 200,
		renderStyle: RenderStyle.select,
		options: params.ptzTypeOptions,
		filters: params.ptzTypeOptions?.map(
			item => ({ text: item.title, value: item.value })
		)
	},
	{
		title: 'cdn启用状态',
		dataIndex: 'cdnState',
		sorter: true,
		width: 180,
		renderStyle: RenderStyle.switch,
		filters: stateOptions.map(
			item => ({ text: item.title, value: item.value })
		)
	},
	{
		title: '接入cdn地址',
		dataIndex: 'cdnUrl',
		renderStyle: RenderStyle.input,
		width: 300,
		placeholder: '请输入接入cdn地址'
	},
	{
		title: '通道经度',
		dataIndex: 'longitude',
		width: 150
	},
	{
		title: '通道纬度',
		dataIndex: 'latitude',
		width: 150
	},
	{
		title: '是否转码',
		dataIndex: 'transCodedState',
		sorter: true,
		width: 150,
		renderStyle: RenderStyle.switch,
		filters: stateOptions.map(
			item => ({ text: item.title, value: item.value })
		)
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
		renderStyle: RenderStyle.timestamp
	}
]

export const formColumns = (params: ColumnParams): Array<XFormItem<Item>> => [
	{
		dataIndex: 'name',
		defValue: '',
		label: '通道名称',
		type: XFormItemType.input,
		rules: requiredRule('通道名称不能为空')
	},
	{
		dataIndex: 'label',
		defValue: '',
		label: '自定义标签',
		type: XFormItemType.input
	},
	{
		dataIndex: 'uniqueId',
		label: '通道id',
		hidden: record => (record?.id ?? 0) <= 0,
		type: XFormItemType.readonly
		// type: XFormItemType.input,
		// rules: requiredRule('通道id不能为空')
		// prefix: <>{ params.deviceUniqueId === '' ? 'known' : params.deviceUniqueId }-</>,
		// disabled: record => (record?.id ?? 0) > 0,
		// valueRender: value => {
		//	 const prefix = params.deviceUniqueId === '' ? 'known' : params.deviceUniqueId
		//	 return isEmpty(value) ? '' : value.replace(prefix + '-', '')
		// }
		// afterOnChange: ({ value, setFieldValue }) => {
		//	 const uniqueId = (value ?? 0).toString()
		//	 const parentUniqueId = `${ params.anchors?.parentUniqueId ?? params.anchors?.parentUniqueIdWithCreate ?? 'known' }-`
		//	 const v = `${ parentUniqueId }${ uniqueId.replaceAll(parentUniqueId, '') }`
		//	 setFieldValue('uniqueId' as any, v)
		// }
	},
	{
		dataIndex: 'deviceUniqueId',
		label: '设备id',
		type: XFormItemType.readonly
	},
	{
		dataIndex: 'ptzType',
		defValue: 0,
		label: '摄像机云台类型',
		type: XFormItemType.select,
		options: params.ptzTypeOptions,
		rules: requiredRule('摄像机云台类型不能为空')
	},
	{
		dataIndex: 'streamUrl',
		defValue: '',
		label: '接入码流地址',
		type: XFormItemType.input,
		hidden: record => {
			switch (record?.deviceItem?.accessProtocol) {
				case 4: // GB28181协议
					return true
				case 5: // EHOME协议
					return true
				default:
					return false
			}
		},
		rules: params => {
			switch (params.record?.deviceItem?.accessProtocol) {
				case 4: // GB28181协议
				case 5: // EHOME协议
					return requiredRule('接入码流地址不能为空')
				default:
					return []
			}
		}
	},
	{
		dataIndex: 'cdnState',
		defValue: 0,
		label: 'cdn开启状态',
		type: XFormItemType.switch
	},
	{
		dataIndex: 'cdnUrl',
		defValue: '',
		label: 'cdn地址',
		type: XFormItemType.input
	},
	{
		dataIndex: 'longitude',
		defValue: 0,
		label: '经度',
		type: XFormItemType.number,
		max: 180,
		min: -180
	},
	{
		dataIndex: 'latitude',
		defValue: 0,
		label: '纬度',
		type: XFormItemType.number,
		max: 90,
		min: -90
	},
	{
		dataIndex: 'transCodedState',
		defValue: 0,
		label: '是否转码',
		type: XFormItemType.switch
	},
	{
		dataIndex: 'cascadeChannelUniqueId',
		defValue: '',
		label: '级联编号',
		type: XFormItemType.input,
		fetchDefValue: async(value: string) => await new Promise<string>(
			resolve => {
				if (!isEmpty(value)) {
					resolve(value)
					return
				}

				void genUniqueId({ type: 'cascadeChannel', count: 1 }).then(
					res => {
						resolve(res.data !== undefined ? res.data[ 0 ] : '')
					}
				)
			}
		)
	}
]

export function streamNameProduce(deviceUniqueId: string, channelUniqueId: string, playType: PlayType): string {
	return `stream_${ deviceUniqueId }_${ channelUniqueId }_${ playType }`
}

// export function streamURLProduce(item: Item, playType: PlayType): string {
//	 return `${ item.deviceItem?.streamUrl }/${ streamNameProduce(item.deviceUniqueId, item.uniqueId, playType) }`
// }
