import React, { type ReactElement } from 'react'
import { type MenuClickEventHandler } from 'rc-menu/lib/interface'
import { Menu } from 'antd'
import type { XRouteComponentProps } from '#routers/sites'
import { makeDefRoutePathWithPIdAnchor } from '#routers/anchor'
import useFetchState from '#repositories/models'
import { type ComponentProps } from '#components/table/model'
import Icon from '#components/icon'
import { ReactComponent as IconGroup } from '#assets/svg/group.svg'
import { ReactComponent as IconGroup1 } from '#assets/svg/group-1.svg'
import type { Item } from './model'
import { Dictionaries } from '#repositories/models/recoil-state'
import { inArray } from '#utils/functions'

export const CMenus = (props: XRouteComponentProps & ComponentProps<Item> & { id: number }): ReactElement => {
	const dictionaries = new Dictionaries()
	const trees = dictionaries.shared()?.trees ?? []

	const [ openKeys, setOpenKeys ] = useFetchState<string[]>([ props.id.toString() ])
	const [ selectedKeys, setSelectedKeys ] = useFetchState<string[]>([ props.id.toString() ])

	const onOpenChange = (keyPath: string[]): void => {
		const key = keyPath[ keyPath.length - 1 ]
		setOpenKeys([ key ])
	}

	// 选择通道
	const onSelected: MenuClickEventHandler = ({ key, keyPath }): void => {
		setOpenKeys(keyPath)
		setSelectedKeys([ key ])

		props.history.push(
			makeDefRoutePathWithPIdAnchor(props.pageRoute.list ?? '', key)
		)
	}

	return <Menu
		items={
			trees.filter(
				item => item.value !== 0
			).map(
				item => ({
					key: `${ item.value.toString() }`,
					label: item.title,
					icon: <Icon className="i-4x" tap>{ inArray(openKeys, item.value.toString()) ? <IconGroup1 /> : <IconGroup /> }</Icon>
				})
			)
		}
		mode="inline"
		onOpenChange={ onOpenChange }
		openKeys={ openKeys }
		selectedKeys={ selectedKeys }
		onClick={ onSelected }
	/>
}
