import React, { useEffect } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { renderRoutes, type RouteConfig } from 'react-router-config'
import { ConfigProvider, Layout, theme as ANTDTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { Content } from 'antd/es/layout/layout'
import { setClassName } from '#utils/functions'
import { logout } from '#utils/token'
import { defOption, resetPwdHash, showcaseHash, themeDark, variables } from '#constants/appoint'
import { Departments, Dictionaries, MenuDirection, type MenuDirectionType, MenuFold, Profile, ResetPassword, Setting, Theme } from '#repositories/models/recoil-state'
import { configApiCall, configs, DeptTrees, DictTrees } from '#repositories/apis/base'
import { TreeItem } from '#repositories/types/foundation'
import type { Setting as SettingType } from '#repositories/types/config'
import routeMaps, { findRoute, Path } from '#routers/constants'
import Loading from '#components/loading'
import Solt from '#components/global-slot'
import Header from './header'
import Footer from './footer'
import Menus from './menus'

interface MainProps {
	routes: RouteConfig[]
}

const { Header: LayoutHeader, Footer: LayoutFooter } = Layout

const Main: React.FC<MainProps> = ({ routes }) => {
	const { token } = ANTDTheme.useToken()
	const location = useLocation()
	const history = useHistory()
	const menuFold = new MenuFold()
	const resetPassword = new ResetPassword()
	const menuDirection = new MenuDirection().state as MenuDirectionType ?? MenuDirection.direction.left
	const theme = new Theme()
	const profile = new Profile()
	const setting = new Setting()
	const dictionaries = new Dictionaries()
	const departments = new Departments()

	useEffect(
		() => {
			if (location.hash === showcaseHash) {
				logout({ locationSign: true, useShowCase: true })
				return
			}

			if (location.hash === resetPwdHash) {
				resetPassword.set(true)
			}
		},
		[ location.hash ]
	)

	useEffect(
		() => {
			const isDark = theme.state === themeDark
			const currentTheme = isDark ? ANTDTheme.darkAlgorithm : ANTDTheme.defaultAlgorithm
			// if
			const token = currentTheme(ANTDTheme.defaultSeed)
			const style = document.createElement('style')
			style.textContent = `
.ant-modal-confirm .ant-modal-confirm-content {
	color: ${ token.colorText } !important;
}
.ant-modal-confirm .ant-modal-body {
	color: ${ token.colorText } !important;
}
	`
			document.head.appendChild(style)

			variables.modalStyles = {
				modalStyles: {
					header: {
						background: token.colorBgContainer,
						color: isDark ? token.colorWhite : token.colorText,
						borderBottom: `1px solid ${ token.colorBorder }`
					},
					body: {
						background: token.colorBgContainer,
						color: isDark ? token.colorWhite : token.colorText
						// padding: '16px 24px'
					},
					content: {
						background: token.colorBgContainer,
						color: isDark ? token.colorWhite : token.colorText,
						borderRadius: token.borderRadiusLG
					},
					footer: {
						background: token.colorBgContainer,
						borderTop: `1px solid ${ token.colorBorder }`
					},
					mask: {
						backgroundColor: token.colorBgMask
					}
				},
				okButtonStyles: {
					background: token.colorPrimary,
					borderColor: token.colorPrimary,
					color: token.colorWhite
				},
				cancelButtonStyles: {
					color: isDark ? token.colorWhite : token.colorInfo,
					background: token.colorFillSecondary,
					borderColor: token.colorFillSecondary
				}
			}

			setClassName.remove(document.body, 'layout-dark', 'layout-light')
			if (isDark) {
				setClassName.add(document.body, 'layout-dark')
			} else {
				setClassName.add(document.body, 'layout-light')
			}

			return () => {
				document.head.removeChild(style)
			}
		},
		[ token, theme.state ]
	)

	useEffect(
		() => {
			if (profile.state === null) {
				history.push(routeMaps.login.path)
				return
			}

			// 获取部门列表
			void DeptTrees().then(
				res => {
					const trees = [ defOption, ...TreeItem.toOptions(res.data ?? []) ]
					const maps = TreeItem.toMaps(res.data ?? [])
					departments.set({ trees, maps })
				}
			)

			// 获取设置
			void configs().then(
				res => {
					configApiCall(setting, res.data as SettingType | undefined)
				}
			)

			// 字典信息
			void DictTrees().then(
				res => {
					const trees = [ defOption, ...TreeItem.toOptions(res.data ?? []) ]
					const groupTrees = TreeItem.toGroupOptions(res.data ?? [])
					const maps = TreeItem.toMaps(res.data ?? [])
					dictionaries.set({ trees, maps, groupTrees })
				}
			)
		},
		[ profile.state ]
	)

	// useEffect(
	//	 () => {
	//		 const monitor = new NetworkMonitor()
	//		 const currentStatus = monitor.getCurrentStatus()
	//		 console.log('Initial network status:', currentStatus)
	//
	//		 const unsubscribe = monitor.subscribe((status) => {
	//			 console.log('Network changed:', {
	//				 type: status.type,
	//				 speed: `${ status.downlink } Mbps`,
	//				 latency: `${ status.rtt }ms`,
	//				 effectiveType: status.effectiveType,
	//				 at: new Date(status.timestamp).toISOString()
	//			 })
	//		 })
	//
	//		 // 格式化显示
	//		 setInterval(() => {
	//			 const speedInfo = monitor.formatSpeed()
	//			 console.log(speedInfo)
	//		 }, 1000)
	//
	//		 // 需要时取消订阅
	//		 return () => {
	//			 unsubscribe()
	//		 }
	//	 },
	//	 []
	// )

	const path = findRoute(
		(history.location.pathname === '/' || history.location.pathname === '' ? Path.home : history.location.pathname) as Path,
		routeMaps, ({ path, item }) => item.path === `/${ path.replace(/^\//g, '') }`
	)
	const content = <>
		<Solt />
		<LayoutHeader
			className="layout-header-container"
			style={
				!history.location.pathname.includes(routeMaps[ Path.home ].path) &&
				!history.location.pathname.includes(routeMaps[ Path.videoPreview ].path) &&
				!history.location.pathname.includes(routeMaps[ Path.maps ].path) &&
				history.location.pathname !== '/'
					? {}
					: { marginBottom: 0 }
			}
		><Header /></LayoutHeader>
		{
			menuDirection === MenuDirection.direction.left
				? <Layout className={ `layout-body-container layout-flex ${ path?.className ?? '' }` }>
					<div className={ `left-menu ${ menuFold.state === true ? '' : 'hidden' }` }>
						<Menus />
					</div>
					<div className="flex-1" style={ menuFold.state === true ? { marginLeft: 20 } : undefined }>
						<Content className="wh100">{ renderRoutes(routes) }</Content>
					</div>
				</Layout>
				: <Layout className={ `layout-body-container ${ path?.className ?? '' }` }><Content className="wh100">{ renderRoutes(routes) }</Content></Layout>
		}
		<LayoutFooter className="layout-footer-container"><Footer /></LayoutFooter>
	</>

	const themeParams = { algorithm: theme.state === Theme.dark ? ANTDTheme.darkAlgorithm : undefined }
	return profile.state === null || setting.state === null
		? <Loading />
		: <ConfigProvider locale={ zhCN } theme={ themeParams }>
			<Layout className="h100">
				{ content }
			</Layout>
		</ConfigProvider>
}

export default Main