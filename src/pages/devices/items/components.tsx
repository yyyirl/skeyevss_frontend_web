import React, { type ReactElement, useEffect, useRef } from 'react'
import { useHistory } from 'react-router-dom'
import { Button, Checkbox, Divider, Flex, Select, Spin, Tag, Tooltip } from 'antd'
import { type OptionItem } from '#types/base.d'
import { type XFormItemRenderProps } from '#types/ant.form.d'
import { type ExpandableProps } from '#types/ant.table.d'
import { makeDefRoutePathWithPCAnchor, makeDefRoutePathWithPIdAnchor } from '#routers/anchor'
import routes, { Path } from '#routers/constants'
import { arrayIntersection, arrayUnique, extractUrlComponents, inArray, isEmpty, throttle, timestampFormat } from '#utils/functions'
import { hintError1 } from '#utils/err-hint'
import { type CancelTokenSourceType, getCancelSource } from '#utils/axios'
import { smsIPDef, variables } from '#constants/appoint'
import useFetchState from '#repositories/models'
import type { Setting as SettingType, SettingItem } from '#repositories/types/config'
import { DeviceDiagnose, Dictionaries, type Setting as SSetting, Setting } from '#repositories/models/recoil-state'
import { Catalog, OnvifDeviceInfo, type OnvifDeviceItem, OnvifDiscover, SettingUpdate } from '#repositories/apis/base'
import { DictUniqueIdType } from '#repositories/types/foundation'
import { ReactComponent as IconEdit } from '#assets/svg/edit.svg'
import { ReactComponent as IconDelete } from '#assets/svg/delete.svg'
import { ReactComponent as IconChannel } from '#assets/svg/channel.svg'
import { ReactComponent as IconAdd } from '#assets/svg/add.svg'
import { ReactComponent as IconBlacklist } from '#assets/svg/blacklist.svg'
import { ReactComponent as IconBlacklist1 } from '#assets/svg/blacklist1.svg'
import { ReactComponent as IconReload } from '#assets/svg/reload.svg'
import { ReactComponent as IconDiagnose } from '#assets/svg/diagnose.svg'
import { ReactComponent as IconCatalog } from '#assets/svg/catalog.svg'
import { ReactComponent as IconLoading } from '#assets/svg/loading.svg'
import { ReactComponent as IconOnline } from '#assets/svg/online.svg'
import { ReactComponent as IconOffline } from '#assets/svg/offline.svg'
import Icon from '#components/icon'
import { PopupKey, toSelectOptionType } from '#components/table/model'
import { MessageType, MMessage } from '#components/hint'
import type { Item as MSItem } from '#pages/configs/media-server/model'
import type { Item as DItem } from '#pages/configs/dictionaries/model'
import { type ColumnParams, defOnvifOption, defSubscription, type Item, mediaTransModeOptions, onvifReadonlyMaps, SubscriptionOptions } from './model'
import { useDoubleClick } from '#repositories/hooks'

type CardProps = ExpandableProps<Item> & ColumnParams & { cType: 'card' | 'table', deviceOnlineState: { [key: string]: 0 | 1 } }

interface SubmitParams {
	column: keyof Item
	value: any
}

interface BanProps {
	setting: SSetting
	settingState: SettingType
	v: string
	exists: boolean
	deleteRow: (call?: () => void) => void
}

const ban = ({ setting, settingState, v, exists, deleteRow }: BanProps): void => {
	deleteRow(
		() => {
			const banIp = arrayUnique(
				`${ settingState.setting.banIp }\n${ v }`.split('\n'),
				v => v
			).filter(
				item => exists ? item !== v : true
			).join('\n')
			const settingContent: SettingItem = { ...settingState.setting, banIp }

			void SettingUpdate({
				conditions: [],
				data: [ { column: 'content' as any, value: settingContent } ]
			}).then(
				() => {
					setting.set({
						...settingState,
						setting: settingContent
					})

					// 删除记录

					MMessage({
						message: '设置成功',
						type: MessageType.success
					})
				}
			)
		}
	)
}

export const CardItem: React.FC<CardProps> = props => {
	const history = useHistory()

	const setting = new Setting()
	const mediaServerRes = extractUrlComponents(setting.shared().msUrl)
	const [ smsIP, setSmsIP ] = useFetchState('')

	const address = (smsIP: string): string => {
		if (props.record.accessProtocol === 2) {
			let host = `${ mediaServerRes?.hostname }${ mediaServerRes?.port }`
			if (smsIP !== '' && smsIP !== smsIPDef) {
				host = smsIP
			}

			return host
		}

		return props.record.address
	}

	const handleCardClick = useDoubleClick({
		timeout: 300,
		onDoubleClick: () => {
			const url = makeDefRoutePathWithPIdAnchor(
				routes[ Path.devices ].subs?.[ Path.deviceChannels ].path ?? '',
				props.record.deviceUniqueId
			)
			if (url !== '') {
				history.push(url)
			}
		}
	})

	useEffect(
		() => {
			if (props.mediaServers.length <= 0 || props.record.msIds.length <= 0) {
				return
			}

			for (let i = 0; i < props.mediaServers.length; i++) {
				const item = props.mediaServers[ i ].raw as MSItem
				for (let j = 0; j < props.record.msIds.length; j++) {
					const id = props.record.msIds[ j ]
					if (id === 0) {
						setSmsIP(smsIPDef)
						continue
					}
					if (id === item.id) {
						setSmsIP(`${ item.ip }:${ item.port }`)
						return
					}
				}
			}
		},
		[ props.mediaServers, props.record.msIds ]
	)

	return <div
		onClick={ handleCardClick }
		className="device-card-item"
		style={ { backgroundColor: props.accessProtocolColors[ props.record.accessProtocol ] } }
	>
		<p className="title">{ props.record.label !== '' ? props.record.label : props.record.name }</p>
		<p className="id">设备ID: { props.record.deviceUniqueId }</p>
		{ <p className="address">设备接入地址: { address(smsIP) }</p> }
		<p className="createdAt">{ props.record.createdAt > 0 ? '创建' : '注册' }时间: { timestampFormat(props.record.createdAt > 0 ? props.record.createdAt : props.record.registerAt) }</p>
		{
			props.record.keepaliveAt > 0
				? <p className="createdAt">心跳时间: { timestampFormat(props.record.keepaliveAt) }</p>
				: <></>
		}
		<Divider />
		<Flex gap="4px 0" wrap>
			<Tag color="orange">通道数量: { props.record.chanelCount }</Tag>
			{
				smsIP !== ''
					? <Tooltip title="设备推流给指定的流媒体服务器IP" arrow={ true }>
						<Tag color="gold" title={ smsIP } className="tag-item ellipsis-1">media server: { smsIP }</Tag>
					</Tooltip>
					: <></>
			}
			{
				props.record.clusterServerId !== ''
					? <Tooltip title="集群服务器ID" arrow={ true }>
						<Tag color="lime" title={ props.record.clusterServerId } className="tag-item ellipsis-1">集群: { props.record.clusterServerId }</Tag>
					</Tooltip>
					: <></>
			}
			{
				props.record.modelVersion !== ''
					? <Tag color="cyan" title={ props.record.modelVersion } className="tag-item ellipsis-1">型号: { props.record.modelVersion }</Tag>
					: <></>
			}
		</Flex>
		<Controls { ...props } />
	</div>
}

export const Controls: React.FC<CardProps> = props => {
	const instance = new DeviceDiagnose()
	const history = useHistory()
	const setting = new Setting()
	const settingState = new Setting().shared()
	const banIps = settingState.setting?.banIp?.split('\n') ?? []
	const banExists = inArray(banIps, props.record.deviceUniqueId)

	const [ loadings, setLoadings ] = useFetchState<{ [key: string]: boolean }>({
		mediaTransMode: false,
		manufacturerId: false,
		accessProtocol: false,
		catalog: false
	})

	const submit = ({ column, value }: SubmitParams): void => {
		if (props.update !== undefined) {
			setLoadings({ ...loadings, [ column ]: true })
			void props.update<Item>({
				conditions: [ { column: props.record.primaryKeyColumn(), value: props.record.primaryKeyValue() } ],
				data: [ { column, value } ]
			}).then(
				() => {
					// 更新列表
					MMessage({
						message: '更新成功',
						type: MessageType.success
					})
					// 设置列表
					if (props.records !== undefined && props.records !== null) {
						switch (column) {
							case 'mediaTransMode':
								props.record.mediaTransMode = value
								break
							case 'manufacturerId':
								props.record.manufacturerId = value
								break
						}
						props.setRecords?.([
							...props.records.map(
								item => {
									if (item.primaryKeyValue() === props.record.primaryKeyValue()) {
										return props.record
									}

									return item
								}
							)
						])
					}
				}
			).finally(
				() => {
					setLoadings({ ...loadings, [ column ]: false })
				}
			)
		}
	}

	const mediaTransMode = (ele: ReactElement): ReactElement => {
		switch (props.record.accessProtocol) {
			case 2: // RTMP推流
				return <></>

			// case 1: // 流媒体源
			// case 3: // ONVIF协议
			// case 4: // GB28181协议
			// case 5: // EHOME协议
			default:
				return ele
		}
	}

	const catalog = (): void => {
		setLoadings({ ...loadings, catalog: true })
		void Catalog(props.record.deviceUniqueId).finally(
			() => {
				setTimeout(
					() => {
						setLoadings({ ...loadings, catalog: false })
					},
					1000
				)
			}
		)
	}

	return <>
		{
			props.cType === 'card'
				? <div className={ `controls ${ props.cType === 'card' ? 's' : '' }` }>
					{
						mediaTransMode(
							<Tooltip title="流媒体传输模式" arrow={ true }>
								<Select
									style={ { width: 100 } }
									loading={ loadings.mediaTransMode }
									className="item-1"
									value={ props.record.mediaTransMode }
									placeholder="流媒体传输模式"
									options={ mediaTransModeOptions(props.record.accessProtocol, toSelectOptionType(props.mediaTransModeOptions ?? [])) }
									onChange={ value => { submit({ column: 'mediaTransMode', value }) } }
									variant="borderless"
									disabled={ variables.licenseError !== undefined || variables.showcase === true }
								/>
							</Tooltip>
						)
					}
					{
						isEmpty(props.dictMaps[ props.record.manufacturerId ])
							? <></>
							: <Tooltip title="厂商" arrow={ true }><span className="item-title">{ props.dictMaps[ props.record.manufacturerId ].name }</span></Tooltip>
					}
					{
						isEmpty(props.accessProtocolMaps[ props.record.accessProtocol ])
							? <></>
							: <Tooltip title="接入协议" arrow={ true }><span className="item-title">{ props.accessProtocolMaps[ props.record.accessProtocol ].title }</span></Tooltip>
					}
				</div>
				: <></>
		}
		<div className={ `controls ${ props.cType === 'card' ? 's' : '' }` }>
			{
				variables.licenseError !== undefined || variables.showcase === true
					? <>
						{
							props.record.accessProtocol !== 4
								? <></>
								: <>
									<Tooltip title={ banExists ? `移除黑名单(${ hintError1() })` : `加入黑名单(${ hintError1() })` } arrow={ true }>
										<span className="item"><Icon className="i-4ax" tap>{ banExists ? <IconBlacklist1 /> : <IconBlacklist /> }</Icon></span>
									</Tooltip>
									<Tooltip title={ `catalog(${ hintError1() })` } arrow={ true }>
										{
											loadings.catalog
												? <span className="item s rotating-ele"><Icon className="i-4ax" tap><IconLoading /></Icon></span>
												: <span className="item"><Icon className="i-4ax" tap><IconCatalog /></Icon></span>
										}
									</Tooltip>
								</>
						}
						<Tooltip title="通道列表" arrow={ true }>
							<span
								className="item cursor-pointer"
								onClick={
									() => {
										const url = makeDefRoutePathWithPIdAnchor(
											routes[ Path.devices ].subs?.[ Path.deviceChannels ].path ?? '',
											props.record.deviceUniqueId
										)
										if (url !== '') {
											history.push(url)
										}
									}
								}
							><Icon className="i-4ax" tap><IconChannel /></Icon></span>
						</Tooltip>
						{
							props.record?.addChannelState()
								? <Tooltip title={ `添加通道(${ hintError1() })` } arrow={ true }>
									<span className="item"><Icon className="i-4ax" tap><IconAdd /></Icon></span>
								</Tooltip>
								: <></>
						}
						{
							props.cType === 'card'
								? <>
									<Tooltip title={ `编辑(${ hintError1() })` } arrow={ true }>
										<span className="item"><Icon className="i-4ax" tap><IconEdit /></Icon></span>
									</Tooltip>
									<Tooltip title={ `删除(${ hintError1() })` } arrow={ true }>
										<span className="item"><Icon className="i-4ax" tap><IconDelete /></Icon></span>
									</Tooltip>
								</>
								: <></>
						}
						<Tooltip title={ props.deviceOnlineState?.[ props.record.deviceUniqueId ] === 1 ? '在线' : '离线' } arrow={ true }>
							<span className="item"><Icon className="i-3x online-state">{ props.deviceOnlineState?.[ props.record.deviceUniqueId ] === 1 ? <IconOnline /> : <IconOffline /> }</Icon></span>
						</Tooltip>
						<Tooltip title={ `诊断(${ hintError1() })` } arrow={ true }>
							<span className="item"><Icon className="i-5x" tap><IconDiagnose /></Icon></span>
						</Tooltip>
					</>
					: <>
						{
							props.record.accessProtocol !== 4
								? <></>
								: <>
									<Tooltip title={ banExists ? '移除黑名单' : '加入黑名单并删除记录' } arrow={ true }>
										<span
											className="item cursor-pointer"
											onClick={ () => { ban({ setting, settingState, v: props.record.deviceUniqueId, exists: banExists, deleteRow: props.deleteRow }) } }
										><Icon className="i-4ax" tap>{ banExists ? <IconBlacklist1 /> : <IconBlacklist /> }</Icon></span>
									</Tooltip>
									<Tooltip title="catalog" arrow={ true }>
										{
											loadings.catalog
												? <span className="item s rotating-ele"><Icon className="i-4ax" tap><IconLoading /></Icon></span>
												: <span
													className="item cursor-pointer"
													onClick={ catalog }
												><Icon className="i-4ax" tap><IconCatalog /></Icon></span>
										}
									</Tooltip>
								</>
						}
						<Tooltip title="通道列表" arrow={ true }>
							<span
								className="item cursor-pointer"
								onClick={
									() => {
										const url = makeDefRoutePathWithPIdAnchor(
											routes[ Path.devices ].subs?.[ Path.deviceChannels ].path ?? '',
											props.record.deviceUniqueId
										)
										if (url !== '') {
											history.push(url)
										}
									}
								}
							><Icon className="i-4ax" tap><IconChannel /></Icon></span>
						</Tooltip>
						{
							props.record?.addChannelState()
								? <Tooltip title="添加通道" arrow={ true }>
									<span
										className="item cursor-pointer"
										onClick={
											() => {
												const url = makeDefRoutePathWithPCAnchor(
													routes[ Path.devices ].subs?.[ Path.deviceChannels ].path ?? '',
													props.record.deviceUniqueId
												)
												if (url !== '') {
													history.push(url)
												}
											}
										}
									><Icon className="i-4ax" tap><IconAdd /></Icon></span>
								</Tooltip>
								: <></>
						}
						{
							props.cType === 'card'
								? <>
									<Tooltip title="编辑" arrow={ true }>
										<span
											className="item cursor-pointer"
											onClick={
												() => {
													props.setSelectedRow(props.record)
													props.setPopupVisible({ ...props.popupVisible, [ PopupKey.update ]: true })
												}
											}
										><Icon className="i-4ax" tap><IconEdit /></Icon></span>
									</Tooltip>
									<Tooltip title="删除" arrow={ true }>
										<span className="item cursor-pointer" onClick={ () => { props.deleteRow() } }>
											<Icon className="i-4ax" tap><IconDelete /></Icon>
										</span>
									</Tooltip>
								</>
								: <></>
						}
						<Tooltip title={ props.deviceOnlineState?.[ props.record.deviceUniqueId ] === 1 ? '在线' : '离线' } arrow={ true }>
							<span className="item"><Icon className="i-3x online-state">{ props.deviceOnlineState?.[ props.record.deviceUniqueId ] === 1 ? <IconOnline /> : <IconOffline /> }</Icon></span>
						</Tooltip>
						<Tooltip title="诊断" arrow={ true }>
							<span
								className="item cursor-pointer"
								onClick={ () => { instance.set({ visible: true, deviceUniqueId: props.record.deviceUniqueId }) } }
							><Icon className="i-5x" tap><IconDiagnose /></Icon></span>
						</Tooltip>
					</>
			}
		</div>
	</>
}

export const COnvifDiscoverDevices = (props: XFormItemRenderProps<Item> & { onvifAddresses: string[] }): ReactElement => {
	const vssHttpUrl = new Setting().shared()?.vssHttpUrl ?? ''
	const id = props.original?.id ?? 0
	const disableOnvifDeviceInfoItem = (): boolean => (
		props.original?.accessProtocol !== 3 ||
			props.original?.username === '' ||
			props.original?.password === '' ||
			props.original?.onvifDiscoverItem === undefined
	) && props.original?.onvifDiscoverItem?.value !== defOnvifOption.value

	const [ loading, setLoading ] = useFetchState(true)
	const [ options, setOptions ] = useFetchState<OptionItem[]>([])

	const [ manualOperationState, setManualOperationState ] = useFetchState(false)
	const devicesRef = useRef<{ [key: string]: OnvifDeviceItem }>({})

	const cancelTokenRef = useRef<CancelTokenSourceType | null>(null)

	const handleChange = (value: string, init: boolean = false): void => {
		setManualOperationState(false)
		const data = devicesRef.current[ value ]
		const address = (data?.address ?? '').split(':')
		const port = parseInt(address.length <= 1 ? '80' : address[ 1 ])
		props.setReadonlyMaps(onvifReadonlyMaps(true) as Partial<Item>, true)
		props.setHiddenMaps({ deviceUniqueId: false, address: true, name: false, manufacturerId: false, modelVersion: false, onvifDeviceInfo: true }, true)

		if (!init) {
			props.setFieldValue('name', data.name)
			props.setFieldValue('label', data.name)
			props.setFieldValue('username', '')
			props.setFieldValue('password', '')
			props.setFieldValue('address', data.service_urls[ 0 ])
		}

		props.setFieldValue('deviceUniqueId', data.uuid)
		props.setFieldValue('onvifDiscoverItem', {
			title: data.name,
			value: data.uuid,
			raw: { ip: address[ 0 ], port: isNaN(port) ? 80 : port }
		})
	}

	const fetchData = (): void => {
		if (id <= 0) {
			props.setFieldValue('onvifDiscoverItem', undefined)
			props.setFieldValue('address', '')
			props.setReadonlyMaps({ address: true }, true)
		}

		const options: OptionItem[] = [ defOnvifOption ]
		let value = ''
		setLoading(true)

		cancelTokenRef.current = getCancelSource()
		void OnvifDiscover(cancelTokenRef.current).then(
			res => {
				if (props.original?.accessProtocol !== 3) {
					return
				}

				(res.data ?? []).forEach(
					item => {
						if (value === '') {
							value = item.uuid
						}
						options.push({
							title: item.address,
							value: item.uuid,
							raw: item
						})
						if (id <= 0) {
							props.setFieldValue('deviceUniqueId', item.uuid)
						}
						devicesRef.current[ item.uuid ] = item
					}
				)

				props.setFieldValue('onvifManualOperationState', false)
				props.setHiddenMaps({ deviceUniqueId: false, name: false, manufacturerId: false, modelVersion: false, onvifDeviceInfo: true }, true)
				setOptions(options)
				handleChange(value, id > 0)
			}
		).finally(
			() => {
				props.setReadonlyMaps({ address: false }, true)
				setLoading(false)
			}
		)
	}

	const manualOperation = (state: boolean): void => {
		setManualOperationState(state)
		if (!state) {
			const ids = Object.keys(devicesRef.current)
			if (ids.length > 0) {
				handleChange(ids[ 0 ], false)
			}
			props.setReadonlyMaps(onvifReadonlyMaps(true) as Partial<Item>, true)
			props.setFieldValue('onvifManualOperationState', false)
			props.setHiddenMaps({ deviceUniqueId: false, name: false, manufacturerId: false, modelVersion: false }, true)
			return
		}

		props.setReadonlyMaps(onvifReadonlyMaps(false) as Partial<Item>, true)
		props.setReadonlyMaps({ name: false }, true)
		props.setHiddenMaps({ address: false, name: false, deviceUniqueId: true, manufacturerId: true, modelVersion: true }, true)
		props.setFieldValue('onvifManualOperationState', true)
		props.setFieldValue('name', '')
		props.setFieldValue('label', '')
		props.setFieldValue('username', '')
		props.setFieldValue('password', '')
		props.setFieldValue('address', '')
		props.setFieldValue('deviceUniqueId', '')
		props.setFieldValue('onvifDiscoverItem', defOnvifOption)
	}

	useEffect(
		() => {
			if (props.original?.accessProtocol !== 3) {
				props.setReadonlyMaps({ address: false }, true)
				cancelTokenRef.current?.cancel()
				return
			}

			fetchData()
		},
		[ props.original?.accessProtocol ]
	)

	useEffect(
		() => {
			return () => {
				cancelTokenRef.current?.cancel()
			}
		},
		[]
	)

	useEffect(
		() => {
			if (disableOnvifDeviceInfoItem()) {
				props.setHiddenMaps({ onvifDeviceInfo: true }, true)
				return
			}

			props.setHiddenMaps({ onvifDeviceInfo: false }, true)
		},
		[ props.original?.accessProtocol, props.original?.username, props.original?.password ]
	)

	return <div className="wh100 relative">
		{
			vssHttpUrl === ''
				? <>未设置vss url</>
				: <>
					{
						loading
							? <Spin size="small" tip="探测中..."><div /></Spin>
							: <div className="w-100 flex flex-cc">
								<Select
									style={ { width: '100%' } }
									onChange={ (v: string) => { handleChange(v, false) } }
									options={
										toSelectOptionType(options).map(
											item => ({
												...item,
												label: item.value === defOnvifOption.value || arrayIntersection(props.onvifAddresses, (item.raw?.xaddrs ?? []) as string[]).length <= 0
													? <>{ item.title }</>
													: <span>{ item.title } <i className="red" style={ { fontSize: 12 } }>已添加</i></span>
											})
										)
									}
									value={ props.original?.onvifDiscoverItem?.value }
								/>
								<Tooltip title="刷新" arrow={ true }>
									<span
										className="cursor-pointer"
										style={ { marginLeft: 10 } }
										onClick={ fetchData }
									><Icon className="i-3x" tap>{ <IconReload /> }</Icon></span>
								</Tooltip>
								{
									id <= 0
										? <Button
											onClick={ () => { manualOperation(!manualOperationState) } }
											style={ { marginLeft: 10 } }
										>{ manualOperationState ? '取消手动输入' : '手动输入' }</Button>
										: <></>
								}
							</div>
					}
				</>
		}
	</div>
}

export const COnvifDeviceInfo = (props: XFormItemRenderProps<Item>): ReactElement => {
	const vssHttpUrl = new Setting().shared()?.vssHttpUrl ?? ''
	const [ loading, setLoading ] = useFetchState(false)
	const disableCurrentItem = (): boolean => props.original?.accessProtocol !== 3 || props.original?.username === '' || props.original?.password === '' || props.original?.onvifDiscoverItem === undefined
	const id = props.original?.id ?? 0

	// 设备厂商
	const dictionaries = new Dictionaries()
	const groupTrees = dictionaries.shared()?.groupTrees ?? {}
	const deviceTypeOptions = groupTrees[ DictUniqueIdType.deviceManufacturer ]?.children ?? []

	// 获取设备信息
	const fetchData = (init = false): void => {
		if (disableCurrentItem() && !init) {
			return
		}

		setLoading(true)
		void OnvifDeviceInfo({
			ip: props.original?.onvifDiscoverItem?.raw?.ip ?? '',
			port: props.original?.onvifDiscoverItem?.raw?.port ?? 0,
			username: props.original?.username ?? '',
			password: props.original?.password ?? ''
		}).then(
			res => {
				if (res.data?.Manufacturer === '') {
					props.setFieldValue('manufacturerId', deviceTypeOptions[ deviceTypeOptions.length - 1 ].value)
					MMessage({
						message: '设备信息获取失败',
						type: MessageType.warning
					})
					return
				}

				for (let i = 0; i < deviceTypeOptions.length; i++) {
					const item = deviceTypeOptions[ i ]
					const record = item.raw as DItem
					if (isEmpty(record)) {
						return
					}

					const multiValue = [ ...record.multiValue.split('\n'), item.title ].map(
						v => v.toLowerCase()
					)
					if (inArray(multiValue, res.data?.Manufacturer.toLowerCase())) {
						props.setFieldValue('manufacturerId', item.value)
						break
					}
				}
				props.setFieldValue('modelVersion', res.data?.Model)
			}
		).finally(
			() => {
				setLoading(false)
			}
		)
	}

	useEffect(
		() => {
			if (id > 0) {
				throttle(
					() => {
						fetchData(true)
					},
					400,
					'fetch-OnvifDeviceInfo'
				)
			}
		},
		[ props.original ]
	)

	return <div className="wh100 relative">
		{
			props.original?.username === '' || props.original?.password === '' || (props.original?.onvifDiscoverItem !== undefined && props.original?.onvifDiscoverItem.value === defOnvifOption.value)
				? <></>
				: vssHttpUrl === '' ? <>未设置vss http url</> : <Button loading={ loading } type="primary" className="red-btn" onClick={ () => { fetchData() } }>获取设备信息</Button>
		}
	</div>
}

export const CSubscription = (props: XFormItemRenderProps<Item>): ReactElement => {
	const [ value, setValue ] = useFetchState<string[]>([])

	const handleChange = (value: string[]): void => {
		setValue(value)
		const sub = defSubscription
		const subscription = props.defValue.split('')
		sub.catalog = inArray(value, 'catalog')
		sub.emergencyCall = inArray(value, 'emergencyCall')
		sub.location = inArray(value, 'location')
		sub.ptz = inArray(value, 'ptz')
		subscription[ 0 ] = sub.catalog ? 1 : 0
		subscription[ 1 ] = sub.emergencyCall ? 1 : 0
		subscription[ 2 ] = sub.location ? 1 : 0
		subscription[ 3 ] = sub.ptz ? 1 : 0

		props.setFieldValue('sub', sub)
		props.setFieldValue('subscription', subscription.join(''))
	}

	useEffect(
		() => {
			const v = (props.original?.subscription ?? props.defValue).split('')
			const value: string[] = []
			if (v.length >= 4) {
				if (v[ 0 ] === '1') {
					value.push('catalog')
				}

				if (v[ 1 ] === '1') {
					value.push('emergencyCall')
				}

				if (v[ 2 ] === '1') {
					value.push('location')
				}

				if (v[ 3 ] === '1') {
					value.push('ptz')
				}
			}

			setValue(value)
		},
		[ props.original?.subscription ]
	)

	return <Checkbox.Group
		options={ SubscriptionOptions }
		value={ value }
		onChange={ handleChange }
	/>
}
