import React, { type ReactElement } from 'react'
import { Divider } from 'antd'
import type { ExpandableProps } from '#types/ant.table.d'
import { copyToClipboard } from '#utils/functions'
import { MessageType, MMessage } from '#components/hint'
import type { Item } from './model'

export const Logs = (props: ExpandableProps<Item>): ReactElement => {
	return props.record.logs.length > 0
		? <ul>
			{
				props.record.logs?.map(
					(item, key) => <li key={ key }>
						<div
							className="cursor-pointer"
							onClick={
								() => {
									copyToClipboard(item)
									MMessage({
										message: '复制成功',
										type: MessageType.success
									})
								}
							}
						>{ item }</div>
						<Divider />
					</li>
				)
			}
		</ul>
		: <>-</>
}
