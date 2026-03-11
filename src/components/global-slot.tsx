import React from 'react'
import { Input, Button } from 'antd'
import { clearCache, logout } from '#utils/token'
import { LastRoute } from '#repositories/cache/ls'
import useFetchState from '#repositories/models'
import { ChannelsPopup, DCPopup, DeviceDiagnose, type DeviceDiagnoseType, GetMapPointsState, type GetMapPointsStateProps, InputSet, PasswordSetVisible, type PasswordSetVisibleProps, QueryActivateCodeVisible, type QueryActivateCodeVisibleProps, ResetPassword, RespQueryVisible, type RespQueryVisibleProps, SettingUpdateVisible, type SettingUpdateVisibleProps, SevUpdateVisible, type SevUpdateVisibleProps, VideoPopup, VideosPopupData } from '#repositories/models/recoil-state'
import { InitializePassword } from '#repositories/apis/base'
import { Alert, MessageType, MMessage, Modals } from '#components/hint'
import CVideoBox from '#components/video'
import PreviousVideos from '#components/video/previous-videos'
import { DeviceChannelGroups, InputSet as CInputSet, DeviceDiagnose as CDeviceDiagnose, RespQuery as CRespQuery, QueryActivateCode, ChannelList, SevUpdate, Setting, UserPassword, GetMapPoints as CGetMapPoints } from '#components/sundry'

const CResetPassword: React.FC = () => {
	const resetPassword = new ResetPassword()
	const [ password, setPassword ] = useFetchState('')
	const [ rePassword, setRePassword ] = useFetchState('')

	const submit = (): void => {
		if (password === '' || rePassword === '') {
			MMessage({
				message: '密码不能为空',
				type: MessageType.error
			})
			return
		}

		if (password !== rePassword) {
			MMessage({
				message: '密码不一致',
				type: MessageType.error
			})
			return
		}

		void InitializePassword({ password }).then(
			() => {
				resetPassword.set(false)
				clearCache()
				Alert({
					message: <div className="weight">设置成功, 请重新登录</div>,
					success: (): void => {
						logout({
							locationSign: true,
							callback: () => {
								LastRoute('set')
							}
						})
					}
				})
			}
		)
	}

	return <Modals
		centered={ true }
		visible={ resetPassword.state }
		setVisible={ () => { resetPassword.set(false) } }
		destroyOnHidden={ true }
		className="reset-password"
		maskClosable={ true }
		content={
			<div className="reset-password-box">
				<p className="title">请更新您的初始密码, 不更新则会有密码泄露风险!!</p>
				<div className="item">
					<Input
						allowClear
						placeholder="请输入密码"
						onChange={ e => { setPassword(e.target.value) } }
					/>
				</div>
				<div className="item">
					<Input
						allowClear
						placeholder="确认密码"
						onChange={ e => { setRePassword(e.target.value) } }
					/>
				</div>
				<div className="item btn">
					<Button type="primary" onClick={ submit }>确认</Button>
				</div>
			</div>
		}
	/>
}

// 视频弹窗
const CVideoPopup: React.FC = () => {
	const data = new VideoPopup()
	const state = data.shared()
	const close = (): void => { data.set({ ...state, visible: false }) }

	return <Modals
		visible={ state.visible ?? false }
		setVisible={ close }
		destroyOnHidden={ true }
		className="popup-rt-video"
		centered={ true }
		width="90%"
		height="90%"
		maskClosable={ true }
		content={ <CVideoBox { ...state } close={ close } /> }
	/>
}

// 视频列表
const CPreviousVideosPopup: React.FC = () => {
	const videosPopupData = new VideosPopupData()
	const state = videosPopupData.shared()
	const close = (): void => { videosPopupData.set({ visible: false }) }

	return <Modals
		visible={ state.visible }
		setVisible={ close }
		destroyOnHidden={ true }
		className="popup-videos"
		centered={ true }
		width="100%"
		maskClosable={ true }
		content={
			<PreviousVideos
				convToItem={ data => data }
				index={ state.index }
				videos={ state.videos }
				close={ close }
				popupKey="popup-videos"
			/>
		}
	/>
}

// 通道Channel分组
const CDCPopup: React.FC = () => {
	const instance = new DCPopup()
	const state = instance.shared()
	const close = (): void => { instance.set({ visible: false }) }

	return <Modals
		visible={ state.visible }
		setVisible={ close }
		destroyOnHidden={ true }
		className="popup-device-channel-group"
		centered={ true }
		maskClosable={ true }
		content={ <DeviceChannelGroups close={ close } { ...state } /> }
	/>
}

// 通道列表
const CChannelsPopup: React.FC = () => {
	const instance = new ChannelsPopup()
	const state = instance.shared()
	const close = (): void => { instance.set({ ...state, visible: false, checkedChannelUniqueIds: [] }) }

	return <Modals
		visible={ state.visible }
		setVisible={ close }
		destroyOnHidden={ true }
		className="popup-channel-list"
		centered={ true }
		maskClosable={ true }
		content={ <ChannelList close={ close } { ...state } /> }
	/>
}

// 设置input
const CCInputSet: React.FC = () => {
	const instance = new InputSet()
	const state = instance.shared()
	const close = (): void => { instance.set({ visible: false }) }

	return <Modals
		visible={ state.visible }
		setVisible={ close }
		destroyOnHidden={ true }
		className="popup-input-set"
		centered={ true }
		maskClosable={ true }
		content={ <CInputSet close={ close }{ ...state } /> }
	/>
}

// 设备诊断
const CCDeviceDiagnose: React.FC = () => {
	const instance = new DeviceDiagnose()
	const state = instance.shared()
	const close = (): void => { instance.set({ visible: false } as unknown as DeviceDiagnoseType) }

	return <Modals
		visible={ state.visible }
		setVisible={ close }
		destroyOnHidden={ true }
		className="popup-device-diagnose"
		centered={ true }
		maskClosable={ true }
		content={ <CDeviceDiagnose close={ close } { ...state } /> }
	/>
}

// 激活码查询
const CQueryActivateCode: React.FC = () => {
	const instance = new QueryActivateCodeVisible()
	const state = instance.shared()
	const close = (): void => { instance.set({ visible: false } as unknown as QueryActivateCodeVisibleProps) }

	return <Modals
		visible={ state.visible }
		setVisible={ close }
		destroyOnHidden={ true }
		className="popup-activate-code-query"
		centered={ true }
		maskClosable={ true }
		content={ <QueryActivateCode close={ close } { ...state } /> }
	/>
}

// 服务更新
const CSevUpdate: React.FC = () => {
	const instance = new SevUpdateVisible()
	const state = instance.shared()
	const close = (): void => { instance.set({ visible: false } as unknown as SevUpdateVisibleProps) }

	return <Modals
		visible={ state.visible }
		setVisible={ close }
		destroyOnHidden={ true }
		className="popup-server-update"
		centered={ true }
		maskClosable={ true }
		content={ <SevUpdate close={ close } { ...state } /> }
	/>
}

// 服务更新
const SettingUpdate: React.FC = () => {
	const instance = new SettingUpdateVisible()
	const state = instance.shared()
	const close = (): void => { instance.set({ visible: false } as unknown as SettingUpdateVisibleProps) }

	return <Modals
		key="setting-controls"
		title="基础设置"
		visible={ state.visible }
		setVisible={ close }
		destroyOnHidden={ true }
		width="70%"
		height="90%"
		maskClosable={ true }
		content={ <Setting close={ close } /> }
	/>
}

// 设置密码
const PasswordSet: React.FC = () => {
	const instance = new PasswordSetVisible()
	const state = instance.shared()
	const close = (): void => { instance.set({ visible: false } as unknown as PasswordSetVisibleProps) }

	return <Modals
		key="set-password"
		className="user-password-setting-controls"
		visible={ state.visible }
		setVisible={ close }
		destroyOnHidden={ true }
		width={ 600 }
		height="100%"
		maskClosable={ true }
		content={ <UserPassword close={ close } /> }
	/>
}

// 响应查询
const RespQuery: React.FC = () => {
	const instance = new RespQueryVisible()
	const state = instance.shared()
	const close = (): void => { instance.set({ visible: false } as unknown as RespQueryVisibleProps) }

	return <Modals
		key="resp-query"
		title="响应查询"
		visible={ state.visible }
		setVisible={ close }
		destroyOnHidden={ true }
		width={ 700 }
		maskClosable={ true }
		centered={ true }
		content={ <CRespQuery close={ close } /> }
	/>
}

// 获取地图坐标点
const CCGetMapPoints: React.FC = () => {
	const instance = new GetMapPointsState()
	const state = instance.shared()
	const close = (): void => { instance.set({ visible: false } as unknown as GetMapPointsStateProps) }
	const [ points, setPoints ] = useFetchState<[number, number] | null>(null)

	return <Modals
		key="get-map-points"
		className="get-map-points"
		title="获取地图坐标点"
		visible={ state.visible }
		setVisible={ close }
		destroyOnHidden={ true }
		width={ 900 }
		maskClosable={ true }
		centered={ true }
		footer={
			<div className="flex flex-end" style={ { gap: 10 } }>
				<Button onClick={ close }>取消</Button>
				<Button
					type="primary"
					onClick={
						() => {
							if (points !== null) {
								state.callback?.(points[ 0 ], points[ 1 ])
							}
							close()
						}
					}
				>确定</Button>
			</div>
		}
		content={ <CGetMapPoints{ ...state } callback={ (lat, lng) => { setPoints([ lat, lng ]) } } /> }
	/>
}

const Main: React.FC = () => {
	return <>
		<CQueryActivateCode />
		<CCInputSet />
		<CResetPassword />
		<CVideoPopup />
		<CPreviousVideosPopup />
		<CDCPopup />
		<CChannelsPopup />
		<CCDeviceDiagnose />
		<CSevUpdate />
		<SettingUpdate />
		<PasswordSet />
		<RespQuery />
		<CCGetMapPoints />
	</>
}

export default Main
