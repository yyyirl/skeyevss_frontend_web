import React, { useRef } from 'react'
import { type XRouteComponentProps } from '#routers/sites'
import { Setting } from '#repositories/models/recoil-state'
import Table from '#components/table'
import Form from '#components/form'
import { type TableRef } from '#components/table/model'
import { columns, formColumns, type Item, Item as CItem } from './model'
import { Create, Delete, List, Row, Update } from './api'
import { RowExpandable } from './component'

const Main: React.FC<XRouteComponentProps> = props => {
	const setting = new Setting()
	const permissionOptions = setting.shared().permissionOptions
	const permissionMaps = setting.shared().permissionMaps

	return <Table<Item>
		{ ...props }
		tableUniqueId="roles"
		authority={ Setting.authorities(permissionMaps, [ 'P_1_1_2', 'P_0_1_2' ]) }
		itemInstance={ new CItem({}) }
		columns={ columns }
		primaryKey={ CItem.primaryKeyColumn() }
		create={ Create }
		delete={ Delete }
		update={ Update }
		fetchList={ List }
		fetchRow={ Row }
		tableRef={ useRef<TableRef<Item> | null>(null) }
		expandableRender={ props => <RowExpandable { ...props } permissions={ permissionOptions } /> }
		popupDCWidth={ 800 }
		convToItem={ props => CItem.conv({ ...props }) }
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
				columns={ formColumns({ permissions: permissionOptions, permissionMaps }) }
				convToItem={ props => CItem.conv({ ...props }) }
			/>
		}
	/>
}

export default Main
