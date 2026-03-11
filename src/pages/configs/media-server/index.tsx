import React, { useRef } from 'react'
import { Setting } from '#repositories/models/recoil-state'
import { GetSMSConfig, SMSReloadWithConfig } from '#repositories/apis/base'
import { type XRouteComponentProps } from '#routers/sites'
import { inArray, mapFilter } from '#utils/functions'
import Table from '#components/table'
import Form from '#components/form'
import { Confirm } from '#components/hint'
import { type TableRef } from '#components/table/model'
import { columns, formColumns, type Item, Item as CItem } from './model'
import { Create, Delete, List, Row, Update } from './api'

const Main: React.FC<XRouteComponentProps> = props => {
	const setting = new Setting()
	const permissionMaps = setting.shared().permissionMaps
	const tableRef = useRef<TableRef<Item> | null>(null)

	return <Table<Item>
		{ ...props }
		tableUniqueId="media-server"
		authority={ Setting.authorities(permissionMaps, [ 'P_1_4_3', 'P_0_2_3' ]) }
		itemInstance={ new CItem({}) }
		columns={ columns }
		primaryKey={ CItem.primaryKeyColumn() }
		create={ Create }
		delete={ Delete }
		update={ Update }
		fetchList={ List }
		popupDCWidth={ 900 }
		convToItem={ props => CItem.conv({ ...props }) }
		handleListResponse={
			(res, _, setData) => {
				let list = res.data?.list ?? []
				setTimeout(
					() => {
						for (let i = 0; i < list.length; i++) {
							const item = list[ i ]
							// 获取配置
							void GetSMSConfig({ ip: item.ip, port: item.port }).then(
								res => {
									list = list.map(
										v => item.id === v.id
											? new CItem({
												...item,
												...mapFilter({ ...res.data }, (key: string) => !inArray(CItem.filterColumns(), key)),
												loading: false
											})
											: v
									)
									setData(list)
								}
							)
						}
					},
					1000
				)

				return list
			}
		}
		fetchRow={ Row }
		tableRef={ tableRef }
		defaultSortColumn="createdAt"
		form={
			props => <Form<Item>
				afterUpdateTransformData={ data => CItem.conv(data) }
				beforeUpdateTransformData={
					records => {
						const maps: { [key: string]: any } = {}
						for (let i = 0; i < records.length; i++) {
							maps[ records[ i ].column ] = records[ i ]
						}

						if (maps.port !== maps.http_listen_port) {
							return records.map(
								item => item.column === 'http_listen_port' ? { ...item, value: maps.port } : item
							).filter(item => inArray(CItem.filterColumns(), item.column))
						}

						return records.filter(item => inArray(CItem.filterColumns(), item.column))
					}
				}
				afterUpdateCompletion={
					(record, data) => {
						if (record === null || record === undefined) {
							return
						}

						const records: { [key: string]: any } = {}
						data.filter(
							item => !inArray(CItem.filterColumns(), item.column)
						).forEach(
							item => {
								records[ item.column ] = item.value
							}
						)

						void SMSReloadWithConfig({ ip: record.ip, port: record.port }, { delay: 2, config: records }).then(
							() => {
								Confirm({
									content: <div className="weight">配置更新成功, 确认重启服务吗?</div>,
									success: (): void => {
										void SMSReloadWithConfig({ ip: record.ip, port: record.port }, { reboot: true })
									}
								})
							}
						)
					}
				}
				data={ props.data }
				fetchRow={ props.fetchRow }
				afterFetchRow={
					(data, setData) => {
						void GetSMSConfig({ ip: data.ip, port: data.port }).then(
							res => {
								setData(
									new CItem({
										...data,
										...mapFilter({ ...res.data }, (key: string) => !inArray(CItem.filterColumns(), key)),
										loading: false
									})
								)
							}
						)

						return data
					}
				}
				create={ props.create }
				update={ props.update }
				complete={ props.complete }
				autoClose={ props.autoClose }
				setRecords={ props.setRecords }
				records={ props.records }
				close={ props.close }
				columns={ formColumns }
				convToItem={ props => CItem.conv({ ...props }) }
			/>
		}
	/>
}

export default Main
