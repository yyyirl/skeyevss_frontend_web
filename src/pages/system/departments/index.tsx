import React, { useEffect } from 'react'
import type { XFormItem } from '#types/ant.form.d'
import type { tableMode } from '#types/ant.table.d'
import { isEmpty, mapFilter } from '#utils/functions'
import useFetchState from '#repositories/models'
import { ChannelsPopup, Setting } from '#repositories/models/recoil-state'
import type { CreateRequest } from '#repositories/types/request'
import { GbcCatalog } from '#repositories/apis/base'
import { type XRouteComponentProps } from '#routers/sites'
import { type RowType, type TableRowCustomActionProps } from '#components/table/model'
import Table from '#components/table'
import Form from '#components/form'
import Icon from '#components/icon'
import { MessageType, MMessage } from '#components/hint'
import { ChannelListMakeUniqueId } from '#components/sundry'
import { ReactComponent as IconFolder1 } from '#assets/svg/folder-1.svg'
import { List as RoleList } from '#pages/system/roles/api'
import { type Item as CHItem } from '#pages/devices/channels/model'
import { Update as ChannelUpdate } from '#pages/devices/channels/api'
import { columns, formColumns, type Item, Item as CItem } from './model'
import { Create, Delete, List, Row, Update } from './api'

interface Props extends XRouteComponentProps {
	parentId: number
	parentName: string
	tableMode: tableMode
}

const Main: React.FC<Props> = props => {
	const channelsPopup = new ChannelsPopup()
	const setting = new Setting()
	const permissionMaps = setting.shared().permissionMaps
	const defFormListParams = { parentName: props.parentName, parentId: props.parentId, roleList: [] }

	const [ columnList, setColumnList ] = useFetchState<RowType<Item>>([])
	const [ formColumnList, setFormColumnList ] = useFetchState<Array<XFormItem<Item>>>(formColumns(defFormListParams))
	const [ channelMaps, setChannelMaps ] = useFetchState<{ [key: number]: CHItem[] }>({})

	const handleChannelSet = (props: TableRowCustomActionProps<Item>): void => {
		channelsPopup.set({
			filterState: false,
			visible: true,
			checkedChannelUniqueIds: isEmpty(channelMaps[ props.record.id ]) ? [] : channelMaps[ props.record.id ].map(item => ChannelListMakeUniqueId(item)),
			title: <><span>设置分组:</span> <Icon className="i-4x" tap><IconFolder1 /></Icon></>,
			submit: ({ close, cancelCheckedChannelItems, channelItems }) => {
				if (channelItems.length <= 0 && cancelCheckedChannelItems.length <= 0) {
					MMessage({ message: '至少设置或删除一个通道', type: MessageType.warning })
					return
				}

				const checkedChannelIds = channelItems.map(item => item.id)
				const cancelCheckedChannelIds = cancelCheckedChannelItems.map(item => item.id)
				const depIds = [ props.record.id ]
				const deleteCall = (call?: () => void): void => {
					// 删除depIds
					void ChannelUpdate<CHItem>({
						conditions: [ { column: 'id', values: cancelCheckedChannelIds } ],
						data: [ { column: 'depIds', value: [] } ]
					}).then(
						() => {
							props.fetchData()
							call?.()
						}
					)
				}

				if (checkedChannelIds.length <= 0 && cancelCheckedChannelIds.length > 0) {
					deleteCall(
						() => {
							MMessage({ message: '设置成功', type: MessageType.success })
							close?.()
						}
					)
					return
				}

				void ChannelUpdate<CHItem>({
					conditions: [ { column: 'id', values: checkedChannelIds } ],
					data: [ { column: 'depIds', value: depIds } ]
				}).then(
					() => {
						// 删除depIds
						if (cancelCheckedChannelIds.length > 0) {
							deleteCall(
								() => {
									MMessage({ message: '设置成功', type: MessageType.success })
									close?.()
								}
							)
						} else {
							props.fetchData()
							MMessage({ message: '设置成功', type: MessageType.success })
							close?.()
						}
					}
				)
			}
		})
	}

	useEffect(
		() => {
			setColumnList(columns(defFormListParams))
			// 获取角色列表
			void RoleList({
				conditions: [ { column: 'isDel', value: 0 } ],
				all: true
			}).then(
				res => {
					const roleList = res.data?.list ?? []
					setColumnList(columns({ ...defFormListParams, roleList }))
					setFormColumnList(formColumns({ ...defFormListParams, roleList }))
				}
			)
		},
		[]
	)

	return <Table<Item>
		{ ...props }
		tableUniqueId="departments"
		authority={ Setting.authorities(permissionMaps, [ 'P_1_1_3', 'P_0_1_3' ]) }
		itemInstance={ new CItem({}) }
		columns={ columnList }
		primaryKey={ CItem.primaryKeyColumn() }
		convToItem={ props => CItem.conv({ ...props }) }
		create={
			async(data: CreateRequest<Item>) => await Create({
				...data,
				record: mapFilter(
					data.record,
					(k: string, v: any) => k !== 'cascadeDepUniqueId' ? true : !isEmpty(v)
				)
			})
		}
		delete={ Delete }
		update={ Update }
		fetchList={
			async params => {
				params.conditions?.push({
					column: 'parentId',
					value: props.parentId
				})

				return await List(params)
			}
		}
		handleListResponse={
			res => {
				setChannelMaps(res.data?.maps ?? {})
				return res.data?.list ?? []
			}
		}
		fetchRow={ Row }
		expandableRender={
			params => <Main
				{ ...props }
				parentId={ params.record.id }
				parentName={ params.record.name }
				tableMode="inner"
			/>
		}
		rowCustomActions={
			props => <span
				className="blue cursor-pointer"
				onClick={ () => { handleChannelSet(props) } }
			>设置通道[{ isEmpty(channelMaps[ props.record.id ]) ? 0 : channelMaps[ props.record.id ].length }]</span>
		}
		form={
			props => <Form<Item>
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
				columns={ formColumnList }
				convToItem={ props => CItem.conv({ ...props }) }
				updateCompletion={
					(oldData, newData) => {
						if (oldData.cascadeDepUniqueId === newData.cascadeDepUniqueId) {
							return
						}

						void GbcCatalog({ departmentUniqueId: newData.cascadeDepUniqueId, oldDepartmentUniqueId: oldData.cascadeDepUniqueId })
					}
				}
			/>
		}
	/>
}

export default Main
