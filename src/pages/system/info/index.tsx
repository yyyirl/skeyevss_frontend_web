import React, { useEffect, useRef } from 'react'
import { Button } from 'antd'
import { allIncluded, isEmpty, timestampFormat } from '#utils/functions'
import { showcaseState } from '#utils/err-hint'
import { type XRouteComponentProps } from '#routers/sites'
import { configApiCall, configs as configsApi, ServerRestart, ServerUpgrade, SystemInfo, type SystemInfoResp } from '#repositories/apis/base'
import useFetchState from '#repositories/models'
import { DownloadUpgradePackage, type DownloadUpgradePackageType, QueryActivateCodeVisible, Setting, SevCheckState, SevUpdateVisible } from '#repositories/models/recoil-state'
import type { Setting as SettingType } from '#repositories/types/config'
import Icon from '#components/icon'
import Loading from '#components/loading'
import { Confirm, MessageType, MMessage } from '#components/hint'
import { ReactComponent as IconUpdates } from '#assets/svg/updates.svg'
import { ReactComponent as IconRestart } from '#assets/svg/restart.svg'
import { ReactComponent as IconUpgrade } from '#assets/svg/upgrade.svg'
import { ReactComponent as IconSubmit } from '#assets/svg/submit.svg'
import { ReactComponent as IconSearch } from '#assets/svg/search.svg'
import { ReactComponent as IconLoading } from '#assets/svg/loading.svg'

const Main: React.FC<XRouteComponentProps> = () => {
	const downloadUpgradePackageState = new DownloadUpgradePackage()
	const dpState = downloadUpgradePackageState.state as DownloadUpgradePackageType
	const sevState = new SevCheckState()
	const setting = new Setting()
	const permissions = setting.shared()?.permissionIds ?? []
	const Super = setting.shared()?.super ?? 0
	const queryActivateCodeVisible = new QueryActivateCodeVisible()
	const sevUpdateVisible = new SevUpdateVisible()

	const intervalRef = useRef<any>(null)
	const checkIntervalRef = useRef<any>(null)

	const [ systemInfo, setSystemInfo ] = useFetchState<SystemInfoResp | undefined>(undefined)
	const [ loading, setLoading ] = useFetchState(true)
	const [ upgradeLoading, setUpgradeLoading ] = useFetchState(false)
	const [ sevDate, setSevDate ] = useFetchState(0)
	const [ sevRestartState, setSevRestartState ] = useFetchState(false)

	const fetch = (): void => {
		setLoading(true)
		void SystemInfo().then(
			res => {
				setSystemInfo(res.data)
				let sevDate = res.data?.sevTime ?? 0
				setSevDate(sevDate)
				intervalRef.current = setInterval(
					() => {
						sevDate = sevDate + 1000
						setSevDate(sevDate)
					},
					1000
				)
			}
		).finally(
			() => {
				setLoading(false)
			}
		)
	}

	const check = (call: () => void): void => {
		void configsApi(true).then(
			(res) => {
				clearInterval(checkIntervalRef.current as number)
				call()

				configApiCall(setting, res.data as SettingType | undefined)
			}
		).catch(
			() => {
				checkIntervalRef.current = setTimeout(
					() => {
						check(call)
					},
					2000
				)
			}
		)
	}

	const restart = (): void => {
		if (showcaseState()) {
			return
		}

		Confirm({
			content: <div className="weight">确认重启吗?</div>,
			success: (): void => {
				setSevRestartState(true)
				void ServerRestart().then(
					() => {
						setTimeout(
							() => {
								check(
									() => {
										MMessage({ type: MessageType.success, message: '重启完成' })
										setSevRestartState(false)
									}
								)
							},
							2000
						)
					}
				).catch(
					() => {
						setSevRestartState(false)
					}
				)
			}
		})
	}

	const upgradeOnline = (url: string): void => {
		if (dpState.state !== undefined && dpState.state > 0) {
			MMessage({ type: MessageType.warning, message: '更新正在下载' })
			return
		}

		const pathname = new URL(url).pathname
		Confirm({
			content: <div><p className="weight">有{ pathname.substring(pathname.lastIndexOf('/') + 1) }可供下载, 确认下载更新吗?</p></div>,
			success: (): void => {
				downloadUpgradePackageState.set({
					state: 1,
					progress: 0,
					url
				})
			}
		})
	}

	const upgrade = (): void => {
		if (showcaseState()) {
			return
		}

		// downUpgradePackageState.set({
		// 	state: 1,
		// 	progress: 0,
		// 	url: 'http://114.116.122.72:9000/skeyevss/packages/V1.0.2/windows.arm64.V1.0.2.full-1.zip'
		// })
		setUpgradeLoading(true)
		void ServerUpgrade().then(
			res => {
				if (isEmpty(res.data)) {
					MMessage({
						type: MessageType.success,
						message: '当前已是最新版本'
					})
					return
				}

				upgradeOnline(res.data ?? '')
			}
		).finally(
			() => {
				setUpgradeLoading(false)
			}
		)
	}

	useEffect(
		() => {
			fetch()

			return () => {
				clearInterval(intervalRef.current as number)
				clearInterval(checkIntervalRef.current as number)
			}
		},
		[]
	)

	useEffect(
		() => {
			if (sevState.state.visible === true) {
				setTimeout(
					() => {
						check(
							() => {
								MMessage({ type: MessageType.success, message: '升级成功' })
								sevState.set({ visible: false })
							}
						)
					},
					3000
				)
			}
		},
		[ sevState.state ]
	)

	return loading
		? <Loading />
		: <div className="system-info">
			<div className="card">
				<div className="item">
					<p>前端版本: V-{ import.meta.env.VITE_ENV }-{ import.meta.env.VITE_BUILD_DATE }</p>
					<p>启动时间: { timestampFormat(systemInfo?.sevStartTime ?? 0) }</p>
					<p>服务器时间: { timestampFormat(sevDate) }</p>
					<p>构建信息: { systemInfo?.buildVersion }</p>
					{
						isEmpty(systemInfo?.osEnvironment)
							? <></>
							: <p>环境: { systemInfo?.osEnvironment }</p>
					}
				</div>
				<div className="item sp">
					<>
						{
							isEmpty(systemInfo?.osEnvironment)
								? <>
									{
										Super === 1 || allIncluded(permissions, [ 'P_1_1_1_3', 'P_0_1_1_3' ])
											? <>
												{
													sevState.state.visible === true
														? <span style={ { display: 'flex', gap: 4 } }><Icon className="i-2x rotating-ele" tap><IconLoading /></Icon>服务启动中...</span>
														: <Button
															onClick={
																() => {
																	if (showcaseState()) {
																		return
																	}
																	sevUpdateVisible.set({ visible: true })
																}
															}
														>
															<Icon className="i-3x" tap><IconUpdates /></Icon>
															<span>服务升级</span>
														</Button>
												}
											</>
											: <></>
									}
									{
										Super === 1 || allIncluded(permissions, [ 'P_1_1_1_4', 'P_0_1_1_4' ])
											? <Button loading={ upgradeLoading } onClick={ upgrade }>
												<Icon className="i-3x" tap><IconRestart /></Icon>
												<span>检查更新</span>
											</Button>
											: <></>
									}
								</>
								: <></>
						}
					</>
					{
						Super === 1 || allIncluded(permissions, [ 'P_1_1_1_2', 'P_0_1_1_2' ])
							? <>
								{
									sevRestartState
										? <span style={ { display: 'flex', gap: 4 } }><Icon className="i-2x rotating-ele" tap><IconLoading /></Icon>服务重启中...</span>
										: <Button type="primary" danger onClick={ restart }>
											<Icon className="i-3x" tap><IconUpgrade /></Icon>
											<span>{ isEmpty(systemInfo?.osEnvironment) ? '服务重启' : '服务更新重启' }</span>
										</Button>
								}
							</>
							: <></>
					}
				</div>
			</div>
		</div>
}

export default Main