import React from 'react'
import { Tooltip } from 'antd'
import { variables } from '#constants/appoint'
import { RenderStyle } from '#types/ant.table.d'
import { type OptionItem, type RowDataType } from '#types/base.d'
import routes, { Path } from '#routers/constants'
import { makeDefRoutePathWithIdAnchor } from '#routers/anchor'
import { isEmpty } from '#utils/functions'
import { errorMessage } from '#utils/err-hint'
import { type PopupItem, type RowType } from '#components/table/model'
import { AutoFitImage } from '#components/image'
import Icon from '#components/icon'
import Location from '#components/location'
import PreviousVideos from '#components/video/previous-videos'
import { ReactComponent as IconPlay } from '#assets/svg/play.svg'

export interface ListMapType {
	channels: {
		[ key: string ]: {
			deviceUniqueId: string
			label: string
			name: string
		}
	}
	devices: {
		[ key: string ]: {
			label: string
			name: string
		}
	}
}

export class Item implements RowDataType {
	public id: number
	public deviceUniqueId: string
	public alarmMethod: number
	public alarmPriority: number
	public alarmDescription: string
	public longitude: string
	public latitude: string
	public alarmType: number
	public eventType: number
	public snapshot: string
	public video: string
	public createdAt: number

	constructor(data: Partial<Item>) {
		this.id = data.id ?? 0
		this.deviceUniqueId = data.deviceUniqueId ?? ''
		this.alarmMethod = data.alarmMethod ?? 0
		this.alarmPriority = data.alarmPriority ?? 0
		this.alarmDescription = data.alarmDescription ?? ''
		this.longitude = data.longitude ?? ''
		this.latitude = data.latitude ?? ''
		this.alarmType = data.alarmType ?? 0
		this.eventType = data.eventType ?? 0
		this.snapshot = data.snapshot ?? ''
		this.video = data.video ?? ''
		this.createdAt = data.createdAt ?? 0
	}

	primaryKeyValue(): string | number {
		return this.id
	}

	primaryKeyColumn(): keyof Item {
		return 'id'
	}

	static primaryKeyColumn(): keyof Item {
		return 'id'
	}

	hiddenEdit(): boolean {
		return true
	}

	hiddenDelete(): boolean {
		return false
	}

	hiddenChecked(): boolean {
		return false
	}

	updateProperty(column: keyof this, value: any): Item {
		const data = { ...this }
		data[ column ] = value
		return new Item(data)
	}

	static conv(data: object): Item {
		return new Item(data)
	}
}

interface MapNS { [ key: number ]: string }

export const columns = (
	{
		alarmTypeOptions,
		eventTypeOptions,
		alarmMethodOptions,
		alarmPriorityOptions,
		alarmTypes,
		eventTypes,
		alarmMethods,
		alarmPriorities,
		convAddress,
		deviceMaps
	}: {
		alarmTypeOptions: OptionItem[]
		eventTypeOptions: OptionItem[]
		alarmMethodOptions: OptionItem[]
		alarmPriorityOptions: OptionItem[]
		alarmTypes: MapNS
		eventTypes: MapNS
		alarmMethods: MapNS
		alarmPriorities: MapNS
		convAddress: (address: string) => string
		deviceMaps: ListMapType
	}
): RowType<Item> => [
	{
		title: '设备信息',
		dataIndex: 'deviceUniqueId',
		width: 150,
		renderHook: ({ record }) => {
			const row = deviceMaps.channels?.[ record.deviceUniqueId ]
			if (row === undefined || row === null) {
				return <>-</>
			}

			const channel = isEmpty(row.label) ? row.name : row.label
			const device = isEmpty(deviceMaps.devices?.[ row.deviceUniqueId ]?.label) ? deviceMaps.devices?.[ row.deviceUniqueId ]?.name : deviceMaps.devices?.[ row.deviceUniqueId ]?.label
			const channelTitle = isEmpty(device) ? '-' : device
			const deviceTitle = isEmpty(channel) ? '-' : channel
			return <div>
				<Location
					className="primary cursor-pointer"
					title={ deviceTitle }
					to={ makeDefRoutePathWithIdAnchor(routes[ Path.devices ].subs?.[ Path.deviceItems ].path ?? '', row.deviceUniqueId) }
				><span>{ deviceTitle } </span></Location>
				<Location
					className="blue cursor-pointer"
					title={ channelTitle }
					to={ makeDefRoutePathWithIdAnchor(routes[ Path.devices ].subs?.[ Path.deviceChannels ].path ?? '', record.deviceUniqueId) }
				><span>{ channelTitle }</span></Location>
			</div>
		}
	},
	{
		title: '报警方式',
		dataIndex: 'alarmMethod',
		width: 100,
		sorter: true,
		filters: alarmMethodOptions.map(
			item => ({ text: item.title, value: item.value })
		),
		renderHook: ({ record }) => <span>{ alarmMethods?.[ record.alarmMethod ] ?? '-' }</span>
	},
	{
		title: '报警级别',
		dataIndex: 'alarmPriority',
		width: 100,
		sorter: true,
		filters: alarmPriorityOptions.map(
			item => ({ text: item.title, value: item.value })
		),
		renderHook: ({ record }) => <span>{ alarmPriorities?.[ record.alarmPriority ] ?? '-' }</span>
	},
	{
		title: '报警类型',
		dataIndex: 'alarmType',
		width: 150,
		sorter: true,
		filters: alarmTypeOptions.map(
			item => ({ text: item.title, value: item.value })
		),
		renderHook: ({ record }) => <span>{ alarmTypes?.[ record.alarmType ] ?? '-' }</span>
	},
	{
		title: '报警类型扩展参数',
		dataIndex: 'eventType',
		width: 150,
		sorter: true,
		filters: eventTypeOptions.map(
			item => ({ text: item.title, value: item.value })
		),
		renderHook: ({ record }) => <span>{ eventTypes?.[ record.eventType ] ?? '-' }</span>
	},
	{
		title: '报警时间',
		dataIndex: 'createdAt',
		width: 180,
		sorter: true,
		renderStyle: RenderStyle.timestamp
	},
	{
		title: '录像',
		dataIndex: 'video',
		width: 50,
		popup: PopupKey.play,
		renderHook: ({ popupCall, record }) => record.video === ''
			? <>-</>
			: <>
				{
					variables.licenseError !== undefined || variables.showcase === true
						? <Tooltip title={ errorMessage() } arrow={ true }>
							<span><Icon className="i-4x" tap><IconPlay /></Icon></span>
						</Tooltip>
						: <span onClick={ () => { popupCall?.() } }>
							<Icon className="i-4x" tap><IconPlay /></Icon>
						</span>
				}
			</>
	},
	{
		title: '快照',
		dataIndex: 'snapshot',
		width: 50,
		renderHook: ({ record }) => record.snapshot === ''
			? <>-</>
			: <AutoFitImage height={ 40 } width={ 40 } src={ convAddress(record.snapshot ?? '') } />
	}
]

export enum PopupKey {
	play = 'play'
}

export const popups: Array<PopupItem<Item>> = [
	{
		title: '视频播放',
		key: PopupKey.play,
		className: 'popup-video',
		content: props => <PreviousVideos
			index={ 0 }
			convToItem={ props.convToItem }
			videos={ [ { date: { start: 0, end: 0 }, path: props.data?.video ?? '' } ] }
			close={ props.close }
			popupKey="popup-videos"
		/>,
		height: 700,
		width: '80%',
		footer: <></>
	}
]