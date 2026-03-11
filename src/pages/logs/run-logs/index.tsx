import React, { useRef } from 'react'
import { type XRouteComponentProps } from '#routers/sites'
import Table from '#components/table'
import { type TableRef } from '#components/table/model'
import { columns, type Item, Item as CItem, popups } from './model'
import { List } from './api'

const Main: React.FC<XRouteComponentProps> = props => {
	const tableRef = useRef<TableRef<Item> | null>(null)
	return <Table<Item>
		{ ...props }
		tableUniqueId="run-logs"
		itemInstance={ new CItem({}) }
		convToItem={ props => CItem.conv({ ...props }) }
		columns={ columns }
		primaryKey={ CItem.primaryKeyColumn() }
		fetchList={ List }
		tableRef={ tableRef }
		popups={ popups }
		popupVerify={ item => !(item.isDir ?? false) }
		dataSourceFilter={
			records => records.filter(
				item => item.name !== '.DS_Store'
			)
		}
		state={
			{
				hiddenCreate: true,
				hiddenDelete: true,
				hiddenCellEdit: true,
				hiddenCellDelete: true,
				hideRowSelection: true,
				hidePagination: true
			}
		}
	/>
}

export default Main
