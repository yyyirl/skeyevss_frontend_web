import React, { useEffect, useRef } from 'react'
import { useHistory } from 'react-router-dom'
import { Button } from 'antd'
import { variables } from '#constants/appoint'
import { throttle } from '#utils/functions'
import routeMaps, { Path } from '#routers/constants'
import { DownloadUpgradePackage, type DownloadUpgradePackageType, LayoutUpdate, Setting as SSetting, Setting, SevCheckState } from '#repositories/models/recoil-state'
import { configApiCall, configs as configsApi, type DownloadProgressUpdate, FileDownload, ServerUpdate } from '#repositories/apis/base'
import type { Setting as SettingType } from '#repositories/types/config'
import { ReactComponent as IconLoading } from '#assets/svg/loading.svg'
import { Confirm, MessageType, MMessage } from '#components/hint'
import Icon from '#components/icon'

const Main: React.FC = () => {
	const history = useHistory()
	const settingState = new SSetting().shared()
	const vssSseUrl = settingState?.vssSseUrl ?? ''

	const checkIntervalRef = useRef<any>(null)

	const setting = new Setting()
	const sevState = new SevCheckState()
	const layoutUpdate = new LayoutUpdate()
	const layoutUpdateState = layoutUpdate.state as number
	const downUpgradePackage = new DownloadUpgradePackage()
	const downloadUpgradePackageState = downUpgradePackage.state as DownloadUpgradePackageType

	const completed = (url: string): void => {
		downUpgradePackage.set({
			state: 0,
			progress: 0,
			url: ''
		})
		variables.downloadFileState[ downloadUpgradePackageState.url ] = false

		Confirm({
			content: <div><p className="weight">确认提交更新吗?</p><p>此操作将会替换服务文件并重启服务 .</p></div>,
			success: (): void => {
				void ServerUpdate(url).then(
					() => {
						MMessage({ message: '更新成功, 等待服务启动中...', type: MessageType.success })
						sevState.set({ visible: true })
					}
				)
			}
		})
	}

	const doDownload = (cancel: boolean): void => {
		FileDownload(vssSseUrl, {
			url: downloadUpgradePackageState.url,
			filename: 'upgrade-package.zip',
			cancel,
			call: res => {
				const tmp = JSON.parse(res.data)
				const data = tmp.data as DownloadProgressUpdate
				downUpgradePackage.set({
					...downloadUpgradePackageState,
					state: 2,
					progress: data.progress
				})

				if (data.status === 'completed') {
					throttle(
						() => {
							completed(data.filepath)
						},
						500,
						'downloadPackage'
					)
				}

				if (data.status === 'cancelled' || data.status === 'error') {
					if (data.status === 'error') {
						MMessage({ message: data.message, type: MessageType.error })
					} else {
						MMessage({ message: data.message, type: MessageType.warning })
					}

					downUpgradePackage.set({
						state: 0,
						progress: 0,
						url: ''
					})
					variables.downloadFileState[ downloadUpgradePackageState.url ] = false
					layoutUpdate.set(layoutUpdateState + 1)
				}
			}
		})
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

	useEffect(
		() => {
			if (downloadUpgradePackageState.state === 0) {
				return
			}

			if (variables.downloadFileState[ downloadUpgradePackageState.url ]) {
				return
			}

			variables.downloadFileState[ downloadUpgradePackageState.url ] = true
			doDownload(false)
		},
		[ downloadUpgradePackageState ]
	)

	useEffect(
		() => {
			if (routeMaps[ Path.system ].subs?.[ Path.systemInfo ].path !== undefined && history.location.pathname.includes(routeMaps[ Path.system ].subs?.[ Path.systemInfo ].path)) {
				return
			}

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

	return <div className="wh100">
		{
			downloadUpgradePackageState.state !== undefined && downloadUpgradePackageState.state !== 0
				? <div className="download-upgrade-package">
					<span>更新下载中: { downloadUpgradePackageState.progress.toFixed(2) }%</span>
					<Button color="primary" variant="solid" onClick={ () => { doDownload(true) } }>取消下载</Button>
				</div>
				: <></>
		}
		{
			sevState.state.visible === true && routeMaps[ Path.system ].subs?.[ Path.systemInfo ].path !== undefined && history.location.pathname.includes(routeMaps[ Path.system ].subs?.[ Path.systemInfo ].path)
				? <div className="download-upgrade-package">
					<span style={ { display: 'flex', gap: 4 } }><Icon className="i-2x rotating-ele" tap><IconLoading /></Icon>服务启动中...</span>
				</div>
				: <></>
		}
	</div>
}

export default Main