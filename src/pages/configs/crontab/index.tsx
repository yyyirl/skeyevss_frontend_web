import React, { useRef } from 'react'
import { Setting } from '#repositories/models/recoil-state'
import { type XRouteComponentProps } from '#routers/sites'
import Table from '#components/table'
import Form from '#components/form'
import { type TableRef } from '#components/table/model'
import { columns, formColumns, type Item, Item as CItem } from './model'
import { List, Row, Update } from './api'
import { Logs } from '#pages/configs/crontab/components'

const Main: React.FC<XRouteComponentProps> = props => {
	const setting = new Setting()
	const permissionMaps = setting.shared().permissionMaps
	const tableRef = useRef<TableRef<Item> | null>(null)

	return <Table<Item>
		{ ...props }
		tableUniqueId="crontab"
		state={
			{
				hiddenCreate: true,
				hiddenDelete: true,
				hiddenCellDelete: true,
				hideRowSelection: true
			}
		}
		convToItem={ props => CItem.conv({ ...props }) }
		authority={ Setting.authorities(permissionMaps, [ 'P_1_2_2', 'P_0_2_2' ]) }
		itemInstance={ new CItem({}) }
		columns={ columns }
		primaryKey={ CItem.primaryKeyColumn() }
		update={ Update }
		fetchList={ List }
		fetchRow={ Row }
		tableRef={ tableRef }
		expandableRender={ Logs }
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
				columns={ formColumns }
				convToItem={ props => CItem.conv({ ...props }) }
			/>
		}
	/>
}

export default Main
