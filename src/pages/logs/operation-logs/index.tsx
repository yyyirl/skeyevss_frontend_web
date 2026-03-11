import React, { useRef } from 'react'
import { type XRouteComponentProps } from '#routers/sites'
import Table from '#components/table'
import { type TableRef } from '#components/table/model'
import { columns, type Item, Item as CItem } from './model'
import { List } from './api'
import { Setting } from '#repositories/models/recoil-state'
import type { OptionItem } from '#types/base.d'

const Main: React.FC<XRouteComponentProps> = props => {
	const tableRef = useRef<TableRef<Item> | null>(null)
	const setting = new Setting()
	const types = setting.shared()[ 'system-operation-log-types' ] ?? {}
	const options: OptionItem[] = []
	for (const id in types) {
		options.push({
			title: types[ id ],
			value: id
		})
	}

	return <Table<Item>
		{ ...props }
		tableUniqueId="operation-logs"
		itemInstance={ new CItem({}) }
		convToItem={ props => CItem.conv({ ...props }) }
		state={
			{
				hiddenCreate: true,
				hiddenDelete: true,
				hiddenCellEdit: true,
				hiddenCellDelete: true,
				hideRowSelection: true
			}
		}
		columns={
			columns({
				SystemOperationLogTypeOptions: options,
				SystemOperationLogTypes: types
			})
		}
		primaryKey={ CItem.primaryKeyColumn() }
		fetchList={ List }
		tableRef={ tableRef }
	/>
}

export default Main
