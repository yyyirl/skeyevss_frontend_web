import React, { useRef } from 'react'
import { type OptionItem } from '#types/base.d'
import { Setting } from '#repositories/models/recoil-state'
import useFetchState from '#repositories/models'
import { type XRouteComponentProps } from '#routers/sites'
import Table from '#components/table'
import { type TableRef } from '#components/table/model'
import { columns, type Item, Item as CItem, type ListMapType, popups } from './model'
import { Delete, List } from './api'

const Main: React.FC<XRouteComponentProps> = props => {
	const setting = new Setting()
	const permissionMaps = setting.shared().permissionMaps
	const alarmTypes = setting.shared()[ 'alarm-types' ]
	const alarmTypeOptions: OptionItem[] = []
	for (const id in alarmTypes) {
		alarmTypeOptions.push({
			title: alarmTypes[ id ],
			value: parseInt(id)
		})
	}

	const eventTypes = setting.shared()[ 'event-types' ]
	const eventTypeOptions: OptionItem[] = []
	for (const id in eventTypes) {
		eventTypeOptions.push({
			title: eventTypes[ id ],
			value: parseInt(id)
		})
	}

	const alarmMethods = setting.shared()[ 'alarm-methods' ]
	const alarmMethodOptions: OptionItem[] = []
	for (const id in alarmMethods) {
		alarmMethodOptions.push({
			title: alarmMethods[ id ],
			value: parseInt(id)
		})
	}

	const alarmPriorities = setting.shared()[ 'alarm-priorities' ]
	const AlarmPriorityOptions: OptionItem[] = []
	for (const id in alarmPriorities) {
		AlarmPriorityOptions.push({
			title: alarmPriorities[ id ],
			value: parseInt(id)
		})
	}

	const tableRef = useRef<TableRef<Item> | null>(null)
	const [ deviceMaps, setDeviceMaps ] = useFetchState<ListMapType>({ devices: {}, channels: {} })
	const convAddress = (filename: string): string => `${ setting.state[ 'proxy-file-url' ] }/${ filename.replace(/^\//, '') }`

	return <Table<Item>
		{ ...props }
		tableUniqueId="alarms"
		authority={ Setting.authorities(permissionMaps, [ 'P_1_6_4' ]) }
		convToItem={ (props: object) => CItem.conv({ ...props }) }
		itemInstance={ new CItem({}) }
		defaultSortColumn={ 'createdAt' }
		columns={
			columns({
				alarmTypeOptions,
				eventTypeOptions,
				alarmMethodOptions,
				alarmPriorityOptions: AlarmPriorityOptions,
				alarmTypes,
				eventTypes,
				alarmMethods,
				alarmPriorities,
				convAddress,
				deviceMaps
			})
		}
		expandableRender={
			props => <div>
				报警描述: { props.record.alarmDescription ?? '-' }<br/>
				经度: { props.record.longitude ?? '-' }<br/>
				纬度: { props.record.latitude ?? '-' }
			</div>
		}
		handleListResponse={
			(res, reqParams) => {
				setDeviceMaps(res.data?.ext ?? deviceMaps)
				return res.data?.list ?? []
			}
		}
		primaryKey={ CItem.primaryKeyColumn() }
		delete={ Delete }
		fetchList={ List }
		tableRef={ tableRef }
		popups={ popups }
	/>
}

export default Main
