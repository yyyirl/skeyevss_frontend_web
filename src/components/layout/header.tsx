import React from 'react'
import { useHistory } from 'react-router-dom'
import { Breadcrumb, Popover, Tooltip } from 'antd'
import type { ItemType } from 'antd/es/breadcrumb/Breadcrumb'
import Screen from 'screenfull'
import routes, { Path } from '#routers/constants'
import { isEmpty } from '#utils/functions'
import { logout } from '#utils/token'
import { showcaseState } from '#utils/err-hint'
import { AutoFitImage } from '#components/image'
import Icon from '#components/icon'
import Avatar from '#components/avatar'
import { Confirm } from '#components/hint'
import useFetchState from '#repositories/models'
import type { MenuDirectionType } from '#repositories/models/recoil-state'
import { Breadcrumbs, Departments, MenuDirection, MenuFold, PasswordSetVisible, Profile, Setting, SettingUpdateVisible, Theme } from '#repositories/models/recoil-state'
import { ReactComponent as IconFullScreen } from '#assets/svg/full-screen.svg'
import { ReactComponent as IconSun } from '#assets/svg/sun.svg'
import { ReactComponent as IconMoon } from '#assets/svg/moon.svg'
import { ReactComponent as IconAvatarMoon } from '#assets/svg/avatar.svg'
import { ReactComponent as IconUnfold } from '#assets/svg/unfold.svg'
import { ReactComponent as IconSetting } from '#assets/svg/setting-color.svg'
import Menus from './menus'

const Main: React.FC = () => {
	const history = useHistory()
	const setting = new Setting()
	const permissions = setting.shared()?.permissionIds ?? []
	const Super = setting.shared()?.super ?? 0
	const logo = setting.shared()?.setting?.logo ?? ''
	const webManageTitle = setting.shared()?.setting?.webManageTitle ?? ''
	const settingUpdate = new SettingUpdateVisible()
	const passwordSet = new PasswordSetVisible()
	const menuFold = new MenuFold()
	const menuDirection = new MenuDirection().state as MenuDirectionType ?? MenuDirection.direction.left
	// 面包屑导航
	const breadcrumbs = new Breadcrumbs().state as ItemType[] ?? []
	// 全屏
	const [ fullScreenState, setFullScreenState ] = useFetchState(false)
	// 全屏
	const fullScreen = (): void => {
		const state = !fullScreenState
		setFullScreenState(state)

		if (state) {
			void Screen.request()
		} else {
			void Screen.exit()
		}
	}
	// 主题显示隐藏
	const theme = new Theme()
	const doSetTheme = (): void => {
		theme.set()
	}
	// 部门信息
	const departments = new Departments()
	// 会员
	const profile = new Profile()
	const convAddress = (filename: string): string => `${ setting.state[ 'proxy-file-url' ] }/${ filename.replace(/^\//, '') }`

	return <>
		<div className="logo">
			<AutoFitImage preview={ false } src={ logo !== '' ? convAddress(logo) : '/logo192.png' } inner={ true } />
			<span className="website-title ellipsis-1" title={ webManageTitle }>{ webManageTitle }</span>
		</div>
		{
			menuDirection === MenuDirection.direction.top
				? <Menus />
				: <Tooltip title={ fullScreenState ? '展开菜单' : '收起菜单' }>
					<div className="menu-fold">
						<Icon
							className={ `i-4x t3s ${ menuFold.state === true ? 'rotate-180' : '' }` }
							tap
							onClick={
								() => {
									menuFold.set(!(menuFold.state as boolean))
								}
							}
						><IconUnfold /></Icon>
					</div>
				</Tooltip>
		}
		<ul className="system-controls">
			{
				Super === 1 || permissions.includes('P_1_2_3_1')
					? <Tooltip title="基础设置">
						<li className="item" onClick={ () => { settingUpdate.set({ visible: true }) } }>
							<Icon className="i-4x" tap><IconSetting /></Icon>
						</li>
					</Tooltip>
					: <></>
			}
			<Tooltip title={ fullScreenState ? '退出全屏' : '全屏' }>
				<li className="item" onClick={ fullScreen }>
					<Icon className="i-4x" tap><IconFullScreen /></Icon>
				</li>
			</Tooltip>
			<Tooltip title="更换主题">
				<li className="item" onClick={ doSetTheme }>
					<Icon className="i-4x" tap>{ theme.state === Theme.light ? <IconSun /> : <IconMoon /> }</Icon>
				</li>
			</Tooltip>
			<Popover
				trigger="hover"
				content={
					<div className="user-popover-options">
						<p
							className="pointer"
							onClick={
								() => {
									if (showcaseState()) {
										return
									}

									passwordSet.set({ visible: true })
								}
							}
						>更新密码</p>
						<p
							className="pointer"
							onClick={
								() => {
									Confirm({
										content: <div className="weight">确认退出吗</div>,
										success: (): void => {
											logout({ locationSign: false })
											profile.set(null)
											history.push(routes.login.path)
										}
									})
								}
							}
						>退出登录</p>
					</div>
				}
			>
				<li className="flex-center profile">
					<div className="avatar flex-center">
						{
							profile.state === null || isEmpty(profile.state.avatar)
								? <Icon className="i-5x" tap><IconAvatarMoon /></Icon>
								: <Avatar path={ profile.state.avatar } name={ profile.state.nickname } />
						}
					</div>
					{
						profile.state === null
							? <></>
							: <span style={ { paddingLeft: 4 } }>{ profile.shared()?.username }</span>
					}
				</li>
			</Popover>
			{
				!isEmpty(profile.state) && departments.state !== null && !isEmpty(departments.state.maps) && profile.state.depIds?.length > 0
					? <li className="item department ellipsis-1">{
						profile.state.depIds.filter(
							(item: number) => !isEmpty(departments.state.maps[ item ])
						).map(
							(item: number) => departments.state.maps[ item ].name
						).join(', ')
					}</li>
					: <></>
			}
		</ul>
		{
			!history.location.pathname.includes(routes[ Path.home ].path) && !history.location.pathname.includes(routes[ Path.videoPreview ].path) && history.location.pathname !== '/' && breadcrumbs.length > 0
				? <div className="breadcrumb-box">
					<Breadcrumb items={ breadcrumbs } />
				</div>
				: <></>
		}
	</>
}

export default Main