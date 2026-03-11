import React, { useEffect, useRef } from 'react'
import { useHistory } from 'react-router-dom'
import type { OptionItem } from '#types/base.d'
import { Breadcrumbs, Dictionaries, Setting } from '#repositories/models/recoil-state'
import useFetchState from '#repositories/models'
import { type CreateRequest } from '#repositories/types/request'
import routes, { Path } from '#routers/constants'
import type { XRouteComponentProps } from '#routers/sites'
import { isEmpty, mapFilter } from '#utils/functions'
import Table from '#components/table'
import Form from '#components/form'
import { type TableRef } from '#components/table/model'
import Loading from '#components/loading'
import { MessageType, MMessage } from '#components/hint'
import { type Item as DeviceItem, Item as VDeviceItem } from '#pages/devices/items/model'
import { Row as DeviceRow } from '#pages/devices/items/api'
import { type ColumnParams, columns, formColumns, type Item, Item as CItem } from './model'
import { Create, Delete, List, Row, Update } from './api'
import { CardItem } from './components'
import { Options } from '#pages/configs/media-server/api'
import { GbcCatalog, OnlineState } from '#repositories/apis/base'
import { DefaultMSSev } from '#pages/configs/media-server/model'

const Main: React.FC<XRouteComponentProps> = props => {
	const history = useHistory()
	const setting = new Setting()
	const permissionMaps = setting.shared().permissionMaps
	const dictionaries = new Dictionaries()
	const breadcrumbs = new Breadcrumbs()
	const vssSseUrl = setting.shared().vssSseUrl

	const tableRef = useRef<TableRef<Item> | null>(null)
	// 摄像机云台类型
	const ptzType = setting.shared()[ 'ptz-types' ] ?? {}
	const ptzTypeOptions: OptionItem[] = []
	for (const id in ptzType) {
		ptzTypeOptions.push({
			title: ptzType[ id ],
			value: parseInt(id)
		})
	}

	// 协议类型
	const accessProtocolTypes = setting.state[ 'access-protocols' ] ?? {}
	const accessProtocolMaps: { [key: number]: OptionItem } = {}
	for (const id in accessProtocolTypes) {
		accessProtocolMaps[ parseInt(id) ] = {
			title: accessProtocolTypes[ id ],
			value: parseInt(id)
		}
	}

	const dictMaps = dictionaries.shared()?.maps ?? {}
	const [ deviceOnlineState, setDeviceOnlineState ] = useFetchState<{ [key: string]: 0 | 1 }>({})
	// 设备id
	const [ deviceUniqueId, setDeviceUniqueId ] = useFetchState('')
	// params
	const [ columnParams, setColumnParams ] = useFetchState<ColumnParams>({
		ptzTypeOptions,
		dictMaps,
		deviceUniqueId,
		deviceMaps: {},
		mediaServers: [],
		deviceOnlineState,
		accessProtocolMaps,
		plans: {}
	})
	// table
	const [ columnsState, setColumnsState ] = useFetchState(columns(columnParams))
	// form
	const [ formColumnsState, setFormColumnsState ] = useFetchState(formColumns(columnParams))
	// 当前设备
	const currentDeviceItemRef = useRef<DeviceItem | undefined>(undefined)
	const [ loading, setLoading ] = useFetchState(false)

	useEffect(
		() => {
			if (isEmpty(deviceUniqueId)) {
				return
			}

			// 获取设备信息
			setLoading(true)
			void DeviceRow(deviceUniqueId).then(
				res => {
					currentDeviceItemRef.current = new VDeviceItem(res.data ?? {})
					breadcrumbs.set([
						{ title: routes[ Path.devices ].subs?.[ Path.deviceItems ].title ?? '设备管理' },
						{
							title: <span className="cursor-pointer">
								{ currentDeviceItemRef.current !== undefined ? currentDeviceItemRef.current.name : deviceUniqueId }
								<i> [ { currentDeviceItemRef.current?.accessProtocolExample() ?? 'known' } ]</i>
							</span>,
							onClick: () => { history.push(routes[ Path.devices ].subs?.[ Path.deviceItems ].path ?? '') }
						},
						{ title: routes[ Path.devices ].subs?.[ Path.deviceChannels ].title ?? '通道' }
					])
				}
			).then(
				() => {
					setLoading(false)
				}
			)
		},
		[ deviceUniqueId ]
	)

	useEffect(
		() => {
			void Options().then(
				res => {
					const options: OptionItem[] = [ DefaultMSSev, ...res.data ?? [] ]
					setColumnParams({ ...columnParams, mediaServers: options })
				}
			).finally(
				() => {
					setLoading(false)
				}
			)

			const es = OnlineState({
				type: 2,
				url: vssSseUrl,
				call: res => {
					const content = JSON.parse(res.data) as { data: { [key: string]: 0 | 1 } }
					setDeviceOnlineState(content.data)
					setColumnParams(
						(columnParams: ColumnParams) => {
							const params = { ...columnParams, deviceOnlineState: content.data }
							setColumnsState(columns(params))
							return params
						}
					)
				}
			})

			return () => {
				es.close()
			}
		},
		[]
	)

	return isEmpty(setting.state) || isEmpty(dictionaries.state) || loading
		? <Loading />
		: <Table<Item>
			{ ...props }
			tableUniqueId="channel-items"
			className="channel-items-table"
			authority={ Setting.authorities(permissionMaps, [ 'P_0_3_2', 'P_1_3_2' ]) }
			itemInstance={ new CItem({}) }
			columns={ columnsState }
			primaryKey={ CItem.primaryKeyColumn() }
			convToItem={ props => CItem.conv({ ...props }) }
			licenseErrorDeleteIgnore={ new CItem({}).licenseErrorDeleteIgnore?.() }
			create={
				async(data: CreateRequest<Item>) => {
					if (isEmpty(deviceUniqueId)) {
						MMessage({ message: '非法操作', type: MessageType.error })
						throw new Error('deviceUniqueId不能为空')
					}

					return await Create({
						...data,
						record: mapFilter(
							{ ...data.record, deviceUniqueId, deviceItem: undefined } satisfies { [ key: string ]: any },
							(k: string) => k !== 'uniqueId'
						)
					})
				}
			}
			delete={ Delete }
			update={
				async params => {
					return await Update({
						...params,
						data: params.data.filter(
							item => item.column !== 'deviceItem'
						)
					})
				}
			}
			fetchList={ List }
			handleListResponse={
				(res, reqParams) => {
					let deviceUniqueId = ''
					reqParams.conditions?.forEach(
						(item: any) => {
							if (item.column === 'deviceUniqueId') {
								deviceUniqueId = item.value
								setDeviceUniqueId(deviceUniqueId)
							}
						}
					)

					const deviceMaps: { [key: string]: DeviceItem } = res.data?.maps ?? {}
					const params = { ...columnParams, deviceUniqueId, deviceMaps, plans: res.data?.ext?.plans ?? {} }
					setColumnParams(params)
					setColumnsState(columns(params))
					setFormColumnsState(formColumns(params))

					for (const uniqueId in deviceMaps) {
						if (uniqueId === deviceUniqueId) {
							currentDeviceItemRef.current = deviceMaps[ uniqueId ]
						}
					}

					return (res.data?.list ?? []).map(
						item => {
							item.deviceItem = deviceMaps[ item.deviceUniqueId ]
							return item
						}
					)
				}
			}
			fetchRow={ Row }
			tableRef={ tableRef }
			popupDCWidth={ 850 }
			state={
				{
					hiddenCreateCall: () => {
						if (deviceUniqueId === '') {
							return true
						}

						return new CItem({ deviceItem: currentDeviceItemRef.current }).setHiddenState()
					},
					hiddenDeleteCall: () => {
						if (isEmpty(currentDeviceItemRef.current)) {
							return false
						}

						return new CItem({ deviceItem: currentDeviceItemRef.current }).setHiddenState()
					}
				}
			}
			form={
				props => <Form<Item>
					wrapperCol={ { span: 7 } }
					afterUpdateTransformData={ data => CItem.conv(data) }
					data={ props.data }
					renderRecord={
						record => {
							record.deviceItem = currentDeviceItemRef.current
							return record
						}
					}
					fetchRow={ props.fetchRow }
					create={ props.create }
					update={ props.update }
					complete={ props.complete }
					autoClose={ props.autoClose }
					setRecords={ props.setRecords }
					records={ props.records }
					close={ props.close }
					columns={ formColumnsState }
					convToItem={ props => CItem.conv({ ...props }) }
					updateCompletion={
						(oldData, newData) => {
							if (oldData.cascadeChannelUniqueId === newData.cascadeChannelUniqueId) {
								return
							}

							void GbcCatalog({ channelUniqueId: newData.cascadeChannelUniqueId, oldChannelUniqueId: oldData.cascadeChannelUniqueId })
						}
					}
				/>
			}
			cardRender={ params => <CardItem { ...params } { ...columnParams } deviceOnlineState={ deviceOnlineState } cType="card" /> }
		/>
}

export default Main
