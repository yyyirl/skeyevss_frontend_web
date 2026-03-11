import React, { useEffect, useRef } from 'react'
import { Dictionaries, Setting } from '#repositories/models/recoil-state'
import type { XRouteComponentProps } from '#routers/sites'
import { makeDefRoutePathWithPIdAnchor, parseAnchorPId } from '#routers/anchor'
import Table from '#components/table'
import Form from '#components/form'
import { type TableRef } from '#components/table/model'
import Loading from '#components/loading'
import { CMenus } from '#pages/configs/dictionaries/components'
import { columns, formColumns, type Item, Item as CItem } from './model'
import { Create, Delete, List, Row, Update } from './api'

const Main: React.FC<XRouteComponentProps> = props => {
	const setting = new Setting()
	const permissionMaps = setting.shared().permissionMaps
	const dictionaries = new Dictionaries()
	const trees = dictionaries.shared()?.trees ?? []
	const maps = dictionaries.shared()?.maps ?? {}
	const tmp = parseAnchorPId(props.match.params.anchor)
	const pid = tmp === undefined ? 0 : parseInt(tmp)

	const tableRef = useRef<TableRef<Item> | null>(null)

	useEffect(
		() => {
			if (pid <= 0) {
				const list = trees.filter(
					item => item.value !== 0
				)

				if (list.length > 0) {
					props.history.push(
						makeDefRoutePathWithPIdAnchor(props.pageRoute.list ?? '', list[ 0 ].value as string | number)
					)
				}
			}
		},
		[ pid, trees ]
	)

	return trees.length <= 0 || Object.keys(maps).length <= 0 || pid <= 0
		? <Loading />
		: <Table<Item>
			{ ...props }
			tableUniqueId="dictionaries"
			convToItem={ props => CItem.conv({ ...props }) }
			authority={ Setting.authorities(permissionMaps, [ 'P_1_2_1', 'P_0_2_1' ]) }
			itemInstance={ new CItem({}) }
			columns={ columns }
			primaryKey={ CItem.primaryKeyColumn() }
			create={ Create }
			delete={ Delete }
			fetchRow={ Row }
			update={ Update }
			fetchList={ List }
			tableRef={ tableRef }
			expandableState={ record => record.parentId === 0 }
			components={
				{
					left: {
						width: 300,
						content: params => <CMenus { ...params } { ...props } id={ pid } />
					}
				}
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
					convToItem={ props => CItem.conv({ ...props }) }
					columns={
						formColumns({
							pid,
							trees,
							maps,
							maxId: props.records !== undefined && props.records.length > 0
								? Math.max(...props.records.map(item => item.id))
								: 1
						})
					}
				/>
			}
		/>
}

export default Main
