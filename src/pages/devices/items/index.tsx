import React, { useEffect, useRef } from 'react'
import type { OptionItem } from '#types/base.d'
import { defOption } from '#constants/appoint'
import { Setting, Dictionaries } from '#repositories/models/recoil-state'
import useFetchState from '#repositories/models'
import { DictUniqueIdType, TreeItem } from '#repositories/types/foundation'
import type { CreateRequest } from '#repositories/types/request'
import { OnlineState } from '#repositories/apis/base'
import { compareEQ, throttle } from '#utils/functions'
import { type XRouteComponentProps } from '#routers/sites'
import Table from '#components/table'
import Form from '#components/form'
import { type TableRef } from '#components/table/model'
import Loading from '#components/loading'
import { Options } from '#pages/configs/media-server/api'
import { DefaultMSSev } from '#pages/configs/media-server/model'
import { type ColumnParams, columns, formColumns, type Item, Item as CItem } from './model'
import { Create, Delete, List, Row, Update } from './api'
import { CardItem } from './components'

const Main: React.FC<XRouteComponentProps> = props => {
	const setting = new Setting()
	const vssSseUrl = setting.shared().vssSseUrl
	const msUrl = setting.shared().msUrl
	const permissionMaps = setting.shared().permissionMaps
	const dictionaries = new Dictionaries()

	const tableRef = useRef<TableRef<Item> | null>(null)
	const deviceOnlineStateRef = useRef<{ [key: string]: 0 | 1 }>({})

	const [ deviceOnlineState, setDeviceOnlineState ] = useFetchState<{ [key: string]: 0 | 1 }>({})
	const [ loading, setLoading ] = useFetchState(true)
	const [ columnParams, setColumnParams ] = useFetchState<ColumnParams>({
		mediaTransModeOptions: [],
		mediaTransModeMaps: {},
		accessProtocolOptions: [],
		accessProtocolMaps: {},
		accessProtocolColors: {},
		channelFilters: {},
		channelFilterOptions: [],
		bitstreamIndexes: {},
		bitstreamIndexOptions: [],
		deviceTypeOptions: [],
		deviceTypeMaps: {},
		dictMaps: {},
		mediaServers: [],
		msUrl,
		onvifAddresses: [],
		deviceOnlineState,
		departmentMaps: {}
	})

	useEffect(
		() => {
			// 流媒体传输模式
			const mediaTransModeTypes = setting.state[ 'media-trans-modes' ] ?? {}
			const mediaTransModeOptions: OptionItem[] = []
			for (const id in mediaTransModeTypes) {
				mediaTransModeOptions.push({
					title: mediaTransModeTypes[ id ],
					value: parseInt(id)
				})
			}

			// 接入协议
			const accessProtocolTypes = setting.state[ 'access-protocols' ] ?? {}
			const accessProtocolColors = setting.state[ 'access-protocol-colors' ] ?? {}
			// 通道过滤
			const channelFilters = setting.state[ 'channel-filters' ] ?? {}
			// 码流索引
			const bitstreamIndexes = setting.state[ 'bitstream-indexes' ] ?? {}
			const accessProtocolOptions: OptionItem[] = []
			const accessProtocolMaps: { [key: number]: OptionItem } = {}
			for (const id in accessProtocolTypes) {
				const item = {
					title: accessProtocolTypes[ id ],
					value: parseInt(id)
				}
				accessProtocolOptions.push(item)
				accessProtocolMaps[ parseInt(id) ] = item
			}

			const channelFilterOptions: OptionItem[] = []
			for (const id in channelFilters) {
				const item = {
					title: channelFilters[ id ],
					value: id
				}
				channelFilterOptions.push(item)
			}

			const bitstreamIndexOptions: OptionItem[] = [ defOption ]
			for (const id in bitstreamIndexes) {
				const item = {
					title: bitstreamIndexes[ id ],
					value: parseInt(id)
				}
				bitstreamIndexOptions.push(item)
			}

			const groupTrees = dictionaries.state?.groupTrees ?? {}
			const dictMaps = dictionaries.state?.maps ?? {}
			// 设备厂商
			const deviceTypeOptions: OptionItem[] = groupTrees[ DictUniqueIdType.deviceManufacturer ]?.children ?? []

			setLoading(true)
			throttle(
				() => {
					void Options().then(
						res => {
							const options: OptionItem[] = [ DefaultMSSev ]
							setColumnParams(
								(columnParams: ColumnParams) => ({
									...columnParams,
									mediaTransModeOptions,
									accessProtocolOptions,
									accessProtocolColors,
									channelFilters,
									channelFilterOptions,
									bitstreamIndexes,
									bitstreamIndexOptions,
									deviceTypeOptions,
									dictMaps,
									accessProtocolMaps,
									mediaTransModeMaps: TreeItem.toOptionMaps(mediaTransModeOptions),
									deviceTypeMaps: TreeItem.toOptionMaps(deviceTypeOptions),
									mediaServers: [ ...options, ...(res.data ?? []) ]
								})
							)
						}
					).finally(
						() => {
							setLoading(false)
						}
					)
				},
				300,
				'fetch-ms-options'
			)
		},
		[ setting.state[ 'media-trans-modes' ], setting.state[ 'access-protocols' ], setting.state[ 'access-protocol-colors' ], dictionaries.state ]
	)

	useEffect(
		() => {
			const es = OnlineState({
				type: 1,
				url: vssSseUrl,
				call: res => {
					const content = JSON.parse(res.data) as { data: { [key: string]: 0 | 1 } }
					if (compareEQ(deviceOnlineStateRef.current, content.data)) {
						return
					}
					deviceOnlineStateRef.current = content.data
					setDeviceOnlineState(deviceOnlineStateRef.current)
					setColumnParams((columnParams: ColumnParams) => ({ ...columnParams, deviceOnlineState: deviceOnlineStateRef.current }))
				}
			})

			return () => {
				es.close()
			}
		},
		[]
	)

	return loading
		? <Loading />
		: <Table<Item>
			{ ...props }
			className="device-items-table"
			tableUniqueId="device-items"
			authority={ Setting.authorities(permissionMaps, [ 'P_0_1_4', 'P_1_1_4' ]) }
			itemInstance={ new CItem({}) }
			columns={ columns(columnParams) }
			primaryKey={ CItem.primaryKeyColumn() }
			licenseErrorDeleteIgnore={ new CItem({}).licenseErrorDeleteIgnore?.() }
			convToItem={ props => CItem.conv({ ...props }) }
			create={
				async(data: CreateRequest<Item>) => await Create({
					...data, record: { ...data.record, sourceType: 1 }
				})
			}
			delete={ Delete }
			update={
				async params => await Update({
					...params,
					data: params.data.filter(
						item => item.column !== 'onvifDiscoverItem' && item.column !== 'onvifDeviceInfo' && item.column !== 'onvifManualOperationState'
					)
				})
			}
			fetchList={ List }
			handleListResponse={
				res => {
					setColumnParams({
						...columnParams,
						onvifAddresses: res.data?.slices ?? [],
						departmentMaps: res.data?.ext ?? {}
					})
					return res.data?.list ?? []
				}
			}
			fetchRow={ Row }
			tableRef={ tableRef }
			popupDCWidth={ 850 }
			defaultSortColumn={ 'createdAt' }
			form={
				props => <Form<Item>
					wrapperCol={ { span: 7 } }
					afterUpdateTransformData={ data => CItem.conv(data) }
					data={ props.data }
					fetchRow={ props.fetchRow }
					create={ props.create }
					update={ props.update }
					complete={ props.complete }
					autoClose={ props.autoClose }
					setRecords={ props.setRecords }
					records={ props.records }
					close={ props.close }
					columns={ formColumns(columnParams) }
					convToItem={ props => CItem.conv({ ...props }) }
				/>
			}
			cardRender={ params => <CardItem { ...params } { ...columnParams } deviceOnlineState={ deviceOnlineState } cType="card" /> }
		/>
}

export default Main
