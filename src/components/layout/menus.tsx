import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { Menu } from 'antd'
import type { ItemType } from 'antd/es/breadcrumb/Breadcrumb'
import routes, { findRoute, Path, toPath } from '#routers/constants'
import useFetchState from '#repositories/models'
import { Breadcrumbs, Departments, MenuDirection, Profile, RespQueryVisible, Setting } from '#repositories/models/recoil-state'
import type { MenuDirectionType } from '#repositories/models/recoil-state'
import { menus } from './model'
import { dynamicMenus } from './dynamic-menus'

const Main: React.FC = () => {
	const respQueryVisible = new RespQueryVisible()
	const departmentState = (new Departments()).shared()
	const menuDirection = new MenuDirection().state as MenuDirectionType ?? MenuDirection.direction.left
	const breadcrumbs = new Breadcrumbs()
	const setting = new Setting()
	const permissions = setting.shared()?.permissionIds ?? []
	const Super = setting.shared()?.super ?? 0
	const history = useHistory()
	// 菜单选中
	const [ selectedKeys, setSelectedKeys ] = useFetchState<string[]>([])
	const [ defaultSelectedKeys, setDefaultSelectedKeys ] = useFetchState<string[]>([])
	const [ openKeys, setOpenKeys ] = useFetchState<string[]>([])
	const [ menuList, setMenuList ] = useFetchState(
		menus({
			permissions: permissions ?? [],
			super: Super,
			showRespQuery: () => { respQueryVisible.set({ visible: true }) }
		})
	)
	const profile = new Profile().shared()
	const depIds = profile?.depIds ?? []

	useEffect(
		() => {
			let path = history.location.pathname.split('/').filter(item => item !== '')
			let tmp = ''
			path = (path.length <= 0 ? [ routes[ Path.home ].path ] : path).map(
				item => {
					if (tmp === '') {
						tmp = item
						return `/${ item.replace(/^\//, '') }`
					}

					const d = `/${ tmp }/${ item }`
					tmp = d
					return d
				}
			)
			setSelectedKeys(path)
			const defaultSelectedKeys = path.length > 0 ? [ path[ 0 ] ] : []
			setDefaultSelectedKeys(defaultSelectedKeys)
			setOpenKeys(defaultSelectedKeys)

			const breadcrumbList: ItemType[] = []
			let current = ''
			let title = ''
			path.forEach(
				item => {
					const tmp = item.split('/')
					const v = toPath(tmp[ tmp.length - 1 ])
					if (v !== undefined) {
						const path = findRoute(v, routes)
						if (path !== undefined) {
							breadcrumbList.push({ title: path.title })
							title = path.title
						}
					}

					if (current === '') {
						current = `/${ item }`
					} else {
						current = `${ current }/${ item }`
					}
				}
			)

			breadcrumbs.set(breadcrumbList.length <= 1 ? [] : breadcrumbList)
			document.title = `${ title } - ${ import.meta.env.VITE_TITLE }`
		},
		[ window.location.href ]
	)

	useEffect(
		() => {
			setMenuList([
				...menuList,
				...dynamicMenus({
					departments: departmentState,
					depIds,
					super: Super
				})
			])
		},
		[ departmentState, depIds, Super ]
	)

	return <Menu
		className={ menuDirection === MenuDirection.direction.left ? '' : 'flex-1' }
		selectedKeys={ selectedKeys }
		style={
			menuDirection === MenuDirection.direction.left
				? {}
				: {
					display: 'flex',
					justifyContent: 'center'
				}
		}
		defaultSelectedKeys={ defaultSelectedKeys }
		onOpenChange={ val => { setOpenKeys(val) } }
		openKeys={ menuDirection === MenuDirection.direction.left ? openKeys : undefined }
		mode={ menuDirection === MenuDirection.direction.left ? 'inline' : 'horizontal' }
		items={ menuList }
	/>
}

export default Main