import React from 'react'
import { Divider } from 'antd'
import { RenderStyle } from '#types/ant.table.d'
import { type OptionItem, type RowDataType } from '#types/base.d'
import { type XFormItem, XFormItemType } from '#types/ant.form.d'
import { stateOptions } from '#constants/appoint'
import { type RowType } from '#components/table/model'
import { columnSearchProps } from '#components/table/items'
import { gt0, requiredRule, createCompareRule } from '#components/form/model'
import { MessageType, MMessage } from '#components/hint'

export class Item implements RowDataType {
	public id: number
	public name: string
	public ip: string
	public extIP: string
	public port: number
	public mediaServerStreamPortMin: number
	public mediaServerStreamPortMax: number
	public isDef: number
	public state: number
	public createdAt: number
	public updatedAt: number

	// 获取media server信息
	public loading: boolean
	// 以下是media server字段
	public http_listen_port: number
	public https_listen_port: number
	public rtmp_enable: boolean
	public rtmp_port: number
	public rtsp_enable: boolean
	public rtsp_port: number
	public ws_rtsp_enable: boolean
	public ws_rtsp_port: number
	public rtc_enable: boolean
	public rtc_enable_https: boolean
	public on_update: string
	public on_pub_start: string
	public on_pub_stop: string
	public on_sub_start: string
	public on_sub_stop: string
	public on_relay_pull_start: string
	public on_relay_pull_stop: string
	public on_rtmp_connect: string
	public on_server_start: string
	public on_hls_make_ts: string
	public on_report_stat: string
	public on_report_frame_info: string
	public rtc_iceHostNatToIps: string[]

	constructor(data: Partial<Item>) {
		this.id = data.id ?? 0
		this.name = data.name ?? ''
		this.ip = data.ip ?? ''
		this.extIP = data.extIP ?? ''
		this.port = data.port ?? 0
		this.mediaServerStreamPortMin = data.mediaServerStreamPortMin ?? 15000
		this.mediaServerStreamPortMax = data.mediaServerStreamPortMax ?? 19000
		this.state = data.state ?? 0
		this.isDef = data.isDef ?? 0
		this.createdAt = data.createdAt ?? 0
		this.updatedAt = data.updatedAt ?? 0

		this.loading = data.loading ?? true
		this.http_listen_port = data.http_listen_port ?? 0
		this.https_listen_port = data.https_listen_port ?? 0
		this.rtmp_enable = data.rtmp_enable ?? false
		this.rtmp_port = data.rtmp_port ?? 0
		this.rtsp_enable = data.rtsp_enable ?? false
		this.rtsp_port = data.rtsp_port ?? 0
		this.ws_rtsp_enable = data.ws_rtsp_enable ?? false
		this.ws_rtsp_port = data.ws_rtsp_port ?? 0
		this.rtc_enable = data.rtc_enable ?? false
		this.rtc_enable_https = data.rtc_enable_https ?? false
		this.rtc_iceHostNatToIps = data.rtc_iceHostNatToIps ?? []
		this.on_update = data.on_update ?? ''
		this.on_pub_start = data.on_pub_start ?? ''
		this.on_pub_stop = data.on_pub_stop ?? ''
		this.on_sub_start = data.on_sub_start ?? ''
		this.on_sub_stop = data.on_sub_stop ?? ''
		this.on_relay_pull_start = data.on_relay_pull_start ?? ''
		this.on_relay_pull_stop = data.on_relay_pull_stop ?? ''
		this.on_rtmp_connect = data.on_rtmp_connect ?? ''
		this.on_server_start = data.on_server_start ?? ''
		this.on_hls_make_ts = data.on_hls_make_ts ?? ''
		this.on_report_stat = data.on_report_stat ?? ''
		this.on_report_frame_info = data.on_report_frame_info ?? ''
	}

	primaryKeyValue(): string | number {
		return this.id
	}

	primaryKeyColumn(): keyof Item {
		return 'id'
	}

	rowLoading(): boolean {
		// return this.loading ?? true
		return false
	}

	static primaryKeyColumn(): keyof Item {
		return 'id'
	}

	hiddenEdit(): boolean {
		return this.isDef === 1
	}

	hiddenDelete(): boolean {
		return this.isDef === 1
	}

	hiddenChecked(): boolean {
		return this.isDef === 1
	}

	updateProperty(column: keyof this, value: any): Item {
		const data = { ...this }
		data[ column ] = value
		return new Item(data)
	}

	static conv(data: object): Item {
		return new Item(data)
	}

	static filterColumns(): string[] {
		return [
			'id',
			'name',
			'ip',
			'port',
			'mediaServerStreamPortMin',
			'mediaServerStreamPortMax',
			'state',
			'createdAt',
			'updatedAt'
		]
	}
}

export const columns: RowType<Item> = [
	{
		title: 'id',
		dataIndex: 'id',
		sorter: true,
		width: 80,
		fixed: 'left'
	},
	{
		title: '名称',
		dataIndex: 'name',
		width: 100,
		fixed: 'left',
		...columnSearchProps<Item>('name')
	},
	{
		title: '内网ip',
		dataIndex: 'ip',
		width: 240,
		renderStyle: RenderStyle.input
	},
	{
		title: '外网ip',
		dataIndex: 'extIP',
		width: 240,
		renderStyle: RenderStyle.input
	},
	{
		title: 'http端口',
		dataIndex: 'port',
		width: 120
	},
	{
		title: '推流端口范围最小值',
		dataIndex: 'mediaServerStreamPortMin',
		width: 180
	},
	{
		title: '推流端口范围最大值',
		dataIndex: 'mediaServerStreamPortMax',
		width: 180
	},
	{
		title: '在线状态',
		dataIndex: 'loading',
		width: 100,
		renderHook: props => <span className={ props.record.loading ? 'red' : 'blue' }>{ props.record.loading ? '离线' : '在线' }</span>
	},
	{
		title: '默认服务',
		dataIndex: 'isDef',
		width: 150,
		renderHook: props => <span>{ props.record.isDef === 1 ? '是' : '否' }</span>
	},
	{
		title: '启用状态',
		dataIndex: 'state',
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

export const formColumns: Array<XFormItem<Item>> = [
	{
		dataIndex: 'name',
		defValue: '',
		label: '名称',
		type: XFormItemType.input,
		rules: requiredRule('名称不能为空')
	},
	{
		dataIndex: 'ip',
		defValue: '',
		label: '内网ip',
		type: XFormItemType.input,
		rules: [ ...requiredRule('内网ip不能为空') ]
	},
	{
		dataIndex: 'extIP',
		defValue: '',
		label: '外网ip',
		type: XFormItemType.input,
		rules: [ ...requiredRule('外网extIP不能为空') ]
	},
	{
		dataIndex: 'port',
		defValue: 0,
		label: '端口',
		type: XFormItemType.number,
		rules: [ ...requiredRule('端口不能为空'), gt0 ]
	},
	{
		dataIndex: 'mediaServerStreamPortMin',
		defValue: 15000,
		label: '推流端口范围最小值',
		type: XFormItemType.number,
		rules: [
			gt0,
			createCompareRule({
				field: 'mediaServerStreamPortMax',
				message: '端口不能超出最大值',
				compareFn: (value, compareValue) => value < compareValue
			})
		],
		afterOnChange: ({ value, record, setFieldValue }) => {
			const mediaServerStreamPortMax = record?.mediaServerStreamPortMax ?? 0
			if (mediaServerStreamPortMax > 0 && value > 0 && (value <= 0 || (value >= mediaServerStreamPortMax && mediaServerStreamPortMax > 0))) {
				setFieldValue('mediaServerStreamPortMin', 0)
				MMessage({ message: '端口不能超出最大值', type: MessageType.warning })
			}
		}
	},
	{
		dataIndex: 'mediaServerStreamPortMax',
		defValue: 19000,
		label: '推流端口范围最大值',
		type: XFormItemType.number,
		afterOnChange: ({ value, record, setFieldValue }) => {
			const mediaServerStreamPortMin = record?.mediaServerStreamPortMin ?? 0
			if (mediaServerStreamPortMin > 0 && value > 0 && value <= mediaServerStreamPortMin) {
				setFieldValue('mediaServerStreamPortMin', 0)
				MMessage({ message: '端口不能小于最小值', type: MessageType.warning })
			}
		},
		rules: [
			gt0,
			createCompareRule({
				field: 'mediaServerStreamPortMin',
				message: '端口不能超出最大值',
				compareFn: (value, compareValue) => value > compareValue
			})
		]
	},
	{
		dataIndex: 'state',
		defValue: 1,
		label: '使用状态',
		type: XFormItemType.switch
	},
	{
		dataIndex: 'state',
		type: XFormItemType.custom,
		render: () => <Divider>media server config</Divider>,
		hidden: data => (data?.id ?? 0) <= 0
	},
	{
		dataIndex: 'http_listen_port',
		label: '服务http端口',
		type: XFormItemType.number,
		hidden: data => (data?.id ?? 0) <= 0
	},
	{
		dataIndex: 'https_listen_port',
		label: '服务https端口',
		type: XFormItemType.number,
		hidden: data => (data?.id ?? 0) <= 0
	},
	{
		dataIndex: 'rtmp_enable',
		type: XFormItemType.switch,
		defValue: false,
		label: '是否启用 RTMP 发布',
		hidden: data => (data?.id ?? 0) <= 0
	},
	{
		dataIndex: 'rtmp_port',
		type: XFormItemType.number,
		label: 'rtmp port',
		hidden: data => (data?.id ?? 0) <= 0
	},
	{
		dataIndex: 'rtsp_enable',
		type: XFormItemType.switch,
		defValue: false,
		label: '是否启用 WebSocket RTSP',
		hidden: data => (data?.id ?? 0) <= 0
	},
	{
		dataIndex: 'rtsp_port',
		type: XFormItemType.number,
		label: 'rtsp port',
		hidden: data => (data?.id ?? 0) <= 0
	},
	{
		dataIndex: 'ws_rtsp_enable',
		type: XFormItemType.switch,
		defValue: false,
		label: '是否启用 WebSocket RTSP',
		hidden: data => (data?.id ?? 0) <= 0
	},
	{
		dataIndex: 'ws_rtsp_port',
		type: XFormItemType.number,
		label: 'WebSocket rtsp port',
		hidden: data => (data?.id ?? 0) <= 0
	},
	{
		dataIndex: 'rtc_enable',
		type: XFormItemType.switch,
		defValue: false,
		label: '是否启用 RTC',
		hidden: data => (data?.id ?? 0) <= 0
	},
	{
		dataIndex: 'rtc_enable_https',
		type: XFormItemType.switch,
		defValue: false,
		label: '是否启用 RTC https',
		hidden: data => (data?.id ?? 0) <= 0
	},
	{
		dataIndex: 'rtc_iceHostNatToIps',
		type: XFormItemType.input,
		label: 'rtc数据发送绑定ip',
		explain: () => <>在其他类型能播放时, webrtc无法播放, 如果使用外网播放时需要配置一个绑定的外网ip, 默认内网播放<br />多个值使用,分隔</>,
		hidden: data => (data?.id ?? 0) <= 0
	},
	{
		dataIndex: 'on_update',
		type: XFormItemType.input,
		label: '更新时的通知',
		hidden: data => (data?.id ?? 0) <= 0
	},
	{
		dataIndex: 'on_pub_start',
		type: XFormItemType.input,
		label: '发布开始时的通知',
		hidden: data => (data?.id ?? 0) <= 0
	},
	{
		dataIndex: 'on_pub_stop',
		type: XFormItemType.input,
		label: '发布停止时的通知',
		hidden: data => (data?.id ?? 0) <= 0
	},
	{
		dataIndex: 'on_sub_start',
		type: XFormItemType.input,
		label: '订阅开始时的通知',
		hidden: data => (data?.id ?? 0) <= 0
	},
	{
		dataIndex: 'on_sub_stop',
		type: XFormItemType.input,
		label: '订阅停止时的通知',
		hidden: data => (data?.id ?? 0) <= 0
	},
	{
		dataIndex: 'on_relay_pull_start',
		type: XFormItemType.input,
		label: '中继拉流开始时的通知',
		hidden: data => (data?.id ?? 0) <= 0
	},
	{
		dataIndex: 'on_relay_pull_stop',
		type: XFormItemType.input,
		label: '中继拉流停止时的通知',
		hidden: data => (data?.id ?? 0) <= 0
	},
	{
		dataIndex: 'on_rtmp_connect',
		type: XFormItemType.input,
		label: 'RTMP 连接时的通知 URL',
		hidden: data => (data?.id ?? 0) <= 0
	},
	{
		dataIndex: 'on_server_start',
		type: XFormItemType.input,
		label: 'HLS 生成 TS 时的通知',
		hidden: data => (data?.id ?? 0) <= 0
	},
	{
		dataIndex: 'on_hls_make_ts',
		type: XFormItemType.input,
		label: ' HLS 生成 FMP4 时的通知 UR',
		hidden: data => (data?.id ?? 0) <= 0
	},
	{
		dataIndex: 'on_report_stat',
		type: XFormItemType.input,
		label: '报告统计信息时的通知',
		hidden: data => (data?.id ?? 0) <= 0
	},
	{
		dataIndex: 'on_report_frame_info',
		type: XFormItemType.input,
		label: '报告帧信息时的通知',
		hidden: data => (data?.id ?? 0) <= 0
	}
]

export const DefaultMSSev: OptionItem = { value: 0, title: '默认服务', raw: { id: 0, name: '默认服务' } }