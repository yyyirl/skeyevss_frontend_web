import React, { type ReactElement, useEffect, useRef } from 'react'
import { Button, Empty, Input, Progress, Tooltip } from 'antd'
import WS, { type Receive } from '#utils/ws'
import AudioRecorder from '#utils/audio-recorder'
import { isEmpty, throttle, uniqueId } from '#utils/functions'
import useFetchState from '#repositories/models'
import { Setting as SSetting, type VideoStreamResp } from '#repositories/models/recoil-state'
import { useMicrophone } from '#repositories/hooks'
import { DeviceControl, type DeviceControlReq, type DeviceControlValueType, type PresetPointRecords, PresetPoints as PresetPointsApi, PresetPointSet, type PresetPointSetType, WSToken } from '#repositories/apis/base'
import { ReactComponent as IconArrow } from '#assets/svg/arrow.svg'
import { ReactComponent as IconMinifier1 } from '#assets/svg/minifier-1.svg'
import { ReactComponent as IconMinifier2 } from '#assets/svg/minifier-2.svg'
import { ReactComponent as IconZoom1 } from '#assets/svg/zoom-1.svg'
import { ReactComponent as IconZoom2 } from '#assets/svg/zoom-2.svg'
import { ReactComponent as IconDiaphragm1 } from '#assets/svg/diaphragm-1.svg'
import { ReactComponent as IconDiaphragm2 } from '#assets/svg/diaphragm-2.svg'
import { ReactComponent as IconAdd1 } from '#assets/svg/add-1.svg'
import { ReactComponent as IconSurplus1 } from '#assets/svg/surplus-1.svg'
import { ReactComponent as IconReset } from '#assets/svg/reload.svg'
import { ReactComponent as IconAnchor } from '#assets/svg/anchor.svg'
import { ReactComponent as IconDelete } from '#assets/svg/delete.svg'
import { ReactComponent as IconAudioActive } from '#assets/svg/audio.svg'
import { ReactComponent as IconAudioDef } from '#assets/svg/audio-1.svg'
import { ReactComponent as IconPrepareAudio } from '#assets/svg/prepare-audio.svg'
import { ReactComponent as IconLoading } from '#assets/svg/loading.svg'
import { ReactComponent as IconNotAllowed } from '#assets/svg/not-allowed.svg'
import { ReactComponent as IconNoMicrophone } from '#assets/svg/no-microphone.svg'
import Icon from '#components/icon'
import { MessageType, MMessage } from '#components/hint'

export enum ControlType {
	directionLeftTop,
	directionTop,
	directionRightTop,
	directionLeft,
	directionRight,
	directionLeftBottom,
	directionBottom,
	directionRightBottom,

	minifier,
	zoom,
	diaphragm,
	speed,

	stop
}

interface Props {
	deviceUniqueId: string
	channelUniqueId: string

	streamItem?: () => VideoStreamResp | undefined
}

const convValue = (v: number): DeviceControlValueType => {
	if (v > 0) return 1
	if (v < 0) return -1
	return 0
}

// 0 未开始 1 准备录制 2 开始录制 3 停止录制
type AudioActive = 0 | 1 | 2 | 3
// 对讲sip状态 0 等待注册 1 占用 2 等待 3 sip交互完成
type TalkSipPubState = 0 | 1 | 2 | 3
// 使用状态 0 解除状态 1 正在占用
type TalkUsageStatus = 0 | 1

enum WSMsgType {
	gbsTalkAudioSend = 'gbs-talk-audio-send',
	gbsTalkSipPub = 'gbs-talk-sip-pub',
	gbsTalkChannelRegister = 'gbs-talk-channel-register',
	gbsTalkSipPubState = 'gbs-talk-sip-pub-state',
	gbsTalkPubBroadcast = 'gbs-talk-pub-broadcast',
	gbsTalkUsageStatusBroadcast = 'gbs-talk-usage-status-broadcast'
}

export const Controls = (props: Props): ReactElement => {
	const baseParams = {
		channelUniqueId: props.channelUniqueId,
		deviceUniqueId: props.deviceUniqueId
	}
	const { hasMicrophone, error } = useMicrophone()
	const sevKey = props.deviceUniqueId
	const settingState = new SSetting().shared()
	const wsUrl = settingState?.wsUrl ?? ''
	const uniqueIdRef = useRef<string | null>(null)
	const wsRef = useRef<WS | undefined>(undefined)
	const audioActiveIntervalRef = useRef(0)
	const wsIntervalRef = useRef(0)
	const audioActiveTimeoutRef = useRef(0)
	const audioSender = (data: Blob | undefined | null, ended?: boolean): void => {
		if (data === null) {
			return
		}

		const uniqueId = uniqueIdRef.current
		const params = { uniqueId, ...baseParams }
		if (data === undefined) {
			if (ended === true) {
				setTimeout(
					() => {
						wsRef.current?.sender(WSMsgType.gbsTalkAudioSend, { ended, ...params })
					},
					500
				)
			}
			return
		}

		const call = (): void => {
			const reader = new FileReader()
			reader.readAsDataURL(data)
			reader.onload = () => {
				const base64 = reader.result
				if (base64 === null) {
					return
				}

				if (typeof base64 === 'string') {
					wsRef.current?.sender(WSMsgType.gbsTalkAudioSend, {
						stream: base64.substring(base64.indexOf(',') + 1),
						mimeType: data.type,
						size: data.size,
						ended,
						...params
					})
				}
			}
		}

		if (ended === true) {
			setTimeout(call, 500)
			return
		}

		call()
	}

	const [ audioVolume, setAudioVolume ] = useFetchState(0)
	const audioRecorder = useRef(
		new AudioRecorder(
			{
				onData: audioSender,
				onVolume: setAudioVolume,
				onError: err => {
					MMessage({ type: MessageType.error, message: err })
				}
			},
			{
				// 输入采样率
				inputSampleRate: 48000,
				// 输入采样位数
				inputSampleBits: 16,
				// 输出采样率
				outputSampleRate: 8000,
				// 输出采样位数
				outputSampleBits: 16
			}
		)
	)

	const [ talkUsageStatus, setTalkUsageStatus ] = useFetchState<TalkUsageStatus>(0)
	const [ talkSipPubState, setTalkSipPubState ] = useFetchState<TalkSipPubState>(0)
	const [ wsState, setWSState ] = useFetchState(false)
	const [ audioActive, setAudioActive ] = useFetchState<AudioActive>(0)
	const [ speed, setSpeed ] = useFetchState(5)
	const control = (type: ControlType, value?: number): void => {
		const v = convValue(value ?? 0)
		const data: DeviceControlReq = {
			horizontal: 0, // 水平移动 正数向左+1 负数向右-1
			vertical: 0, // 垂直移动 正数+1向上 负数-1向下
			minifier: 0, // 变倍 拉近拉远
			zoom: 0, // 变焦
			diaphragm: 0, // 光圈
			speed, // 速度
			stop: false, // 停止
			deviceUniqueId: props.deviceUniqueId, // 设备id
			channelUniqueId: props.channelUniqueId // 通道id
		}
		switch (type) {
			case ControlType.minifier: // 变倍
				data.minifier = v
				break

			case ControlType.zoom: // 变焦
				data.zoom = v
				break

			case ControlType.diaphragm: // 光圈
				data.diaphragm = v
				break

			case ControlType.speed: // 速度
				setSpeed(value ?? 0)
				return

			case ControlType.directionLeftTop:
				data.horizontal = 1
				data.vertical = 1
				break

			case ControlType.directionTop:
				data.vertical = 1
				break

			case ControlType.directionRightTop:
				data.horizontal = -1
				data.vertical = 1
				break

			case ControlType.directionLeft:
				data.horizontal = 1
				break

			case ControlType.directionRight:
				data.horizontal = -1
				break

			case ControlType.directionLeftBottom:
				data.horizontal = 1
				data.vertical = -1
				break

			case ControlType.directionBottom:
				data.vertical = -1
				break

			case ControlType.directionRightBottom:
				data.horizontal = -1
				data.vertical = -1
				break

			case ControlType.stop:
				data.stop = true
				break

			default:
		}

		void DeviceControl(data)
	}

	const handleAudioActive = (audioActive: AudioActive): void => {
		const now = new Date().valueOf()
		if (audioActiveIntervalRef.current <= 0) {
			audioActiveIntervalRef.current = new Date().valueOf()
		} else {
			// 点击和抬起间隔不能小于500毫秒
			if (now - audioActiveIntervalRef.current <= 500) {
				clearTimeout(audioActiveTimeoutRef.current)
				setAudioActive(0)
				return
			}
		}

		audioActiveTimeoutRef.current = setTimeout(
			() => {
				setAudioActive(audioActive === 1 ? 2 : 3)
			},
			500
		) as any
	}

	// 发起sip注册请求
	const handleSendSip = (state: TalkSipPubState, unset?: boolean): void => {
		setTalkSipPubState(state)
		wsRef.current?.sender(WSMsgType.gbsTalkSipPub, { ...baseParams, unset: unset === true })
	}

	// 接收消息
	const wsReceiver: Receive = {
		// 响应 ------------------------------
		[ WSMsgType.gbsTalkAudioSend ]: res => {
			if (res.errors !== undefined && !isEmpty(res.errors)) {
				MMessage({ type: MessageType.warning, message: res.msg ?? res.errors })
			}
		},
		[ WSMsgType.gbsTalkSipPub ]: res => {
			if (res.errors !== undefined && !isEmpty(res.errors)) {
				MMessage({ type: MessageType.warning, message: res.msg ?? res.errors })
			}
		},
		[ WSMsgType.gbsTalkChannelRegister ]: res => {
			if (res.errors !== undefined && !isEmpty(res.errors)) {
				MMessage({ type: MessageType.warning, message: res.msg ?? res.errors })
			}
		},
		[ WSMsgType.gbsTalkSipPubState ]: res => {
			if (res.errors !== undefined && !isEmpty(res.errors)) {
				MMessage({ type: MessageType.warning, message: res.msg ?? res.errors })
				setTalkSipPubState(2)
				wsRef.current?.sender(WSMsgType.gbsTalkSipPubState, baseParams)
				return
			}

			const data = res.data as { state: TalkSipPubState }
			setTalkSipPubState(data.state)
		},

		// 广播 ------------------------------
		[ WSMsgType.gbsTalkPubBroadcast ]: res => {
			if (res.errors !== undefined && !isEmpty(res.errors)) {
				MMessage({ type: MessageType.warning, message: res.msg ?? res.errors })
				return
			}

			const data = res.data as { state: TalkSipPubState, key: string, failedReason: string }
			if (sevKey !== data.key) {
				return
			}

			if (!isEmpty(data.failedReason)) {
				MMessage({ type: MessageType.warning, message: data.failedReason })
				return
			}

			setTalkSipPubState(data.state)
		},
		[ WSMsgType.gbsTalkUsageStatusBroadcast ]: res => {
			if (res.errors !== undefined && !isEmpty(res.errors)) {
				MMessage({ type: MessageType.warning, message: res.msg ?? res.errors })
				return
			}

			const data = res.data as { state: TalkUsageStatus, key: string, uniqueId: string }
			if (sevKey !== data.key) {
				return
			}

			const uniqueId = uniqueIdRef.current
			// 当前使用者不设置占用状态
			if (!isEmpty(uniqueId) && uniqueId === data.uniqueId) {
				setTalkUsageStatus(0)
				return
			}

			setTalkUsageStatus(data.state)
		}
	}
	const wsClose = (): void => {
		setWSState(false)
		// 注销对讲
		wsRef.current?.sender(WSMsgType.gbsTalkChannelRegister, {
			...baseParams,
			offline: true
		})

		setTimeout(
			() => {
				wsRef.current?.cleanup(wsReceiver)
			}
		)
	}
	const wsInit = (): void => {
		void WS.shared(wsUrl, WSToken, wsClose).then(
			ws => {
				wsRef.current = ws
				wsRef.current.receiver(wsReceiver)
				setWSState(true)

				setTimeout(
					() => {
						// 注册对讲
						wsRef.current?.sender(WSMsgType.gbsTalkChannelRegister, baseParams)
						// 初始化获取sip状态
						wsRef.current?.sender(WSMsgType.gbsTalkSipPubState, baseParams)
					},
					500
				)
			}
		)
	}

	useEffect(
		() => {
			if (!wsState) {
				wsInit()
			}

			return wsClose
		},
		[]
	)

	useEffect(
		() => {
			if (isEmpty(error)) {
				return
			}

			console.log('microphone error: ', error)
		},
		[ error ]
	)

	useEffect(
		() => {
			clearInterval(wsIntervalRef.current)
			if (!wsState) {
				wsIntervalRef.current = setInterval(
					() => {
						wsInit()
					},
					3000
				) as unknown as number
			}

			return () => {
				clearInterval(wsIntervalRef.current)
			}
		},
		[ wsState ]
	)

	useEffect(
		() => {
			throttle(
				() => {
					if (audioActive === 3) {
						// 停止录制
						audioActiveIntervalRef.current = 0
						const blobData = audioRecorder.current.stop()
						if (blobData !== null && import.meta.env.VITE_ENV !== 'production') {
							console.log(`共发送数据: size: ${ blobData.size }, type: ${ blobData.type }`)
						}

						setTimeout(
							() => {
								uniqueIdRef.current = null
							},
							500
						)
					} else if (audioActive === 2) {
						// 开始录制
						uniqueIdRef.current = uniqueId()
						void audioRecorder.current.start()
					}
				},
				500,
				'audio-recorder-start'
			)
		},
		[ audioActive ]
	)

	useEffect(
		() => {
			return () => {
				if (audioActive > 1) {
					void audioRecorder.current.stop()
				}
			}
		},
		[]
	)

	return <div className="video-control-box flex row w100">
		<div className="controls">
			<div className="item">
				<span
					onMouseDown={ () => { control(ControlType.directionLeftTop) } }
					onMouseUp={ () => { control(ControlType.stop) } }
					className="left-top"
				><Icon className="i-3x" tap><IconArrow /></Icon></span>
				<span
					onMouseDown={ () => { control(ControlType.directionTop) } }
					onMouseUp={ () => { control(ControlType.stop) } }
					className="top flex"
				><Icon className="i-3x" tap><IconArrow /></Icon></span>
				<span
					onMouseDown={ () => { control(ControlType.directionRightTop) } }
					onMouseUp={ () => { control(ControlType.stop) } }
					className="right-top"
				><Icon className="i-3x" tap><IconArrow /></Icon></span>
			</div>
			<div className="item">
				<span
					onMouseDown={ () => { control(ControlType.directionLeft) } }
					onMouseUp={ () => { control(ControlType.stop) } }
					className="left flex"
				><Icon className="i-3x" tap><IconArrow /></Icon></span>
				<span />
				<span
					onMouseDown={ () => { control(ControlType.directionRight) } }
					onMouseUp={ () => { control(ControlType.stop) } }
					className="right flex"
				><Icon className="i-3x" tap><IconArrow /></Icon></span>
			</div>
			<div className="item">
				<span
					onMouseDown={ () => { control(ControlType.directionLeftBottom) } }
					onMouseUp={ () => { control(ControlType.stop) } }
					className="left-bottom"
				><Icon className="i-3x" tap><IconArrow /></Icon></span>
				<span
					onMouseDown={ () => { control(ControlType.directionBottom) } }
					onMouseUp={ () => { control(ControlType.stop) } }
					className="bottom flex"
				><Icon className="i-3x" tap><IconArrow /></Icon></span>
				<span
					onMouseDown={ () => { control(ControlType.directionRightBottom) } }
					onMouseUp={ () => { control(ControlType.stop) } }
					className="right-bottom"
				><Icon className="i-3x" tap><IconArrow /></Icon></span>
			</div>
			{
				wsState
					? <>
						{
							hasMicrophone
								? <>
									{
										talkUsageStatus === 0
											? <>{
												talkSipPubState === 3
													? <Tooltip title={ audioActive === 2 ? '' : '长按开始对讲,松开结束对讲' }>
														<div
															className="item audio"
															onMouseDown={
																() => {
																	setAudioActive(1)
																	handleAudioActive(1)
																}
															}
															onMouseUp={ () => { handleAudioActive(3) } }
														>
															{
																audioActive === 2
																	? <div className="volume-box">
																		<Progress
																			size={ 70 }
																			type="circle"
																			showInfo={ false }
																			percent={ audioVolume }
																			strokeColor={ { '0%': 'rgba(86, 143, 135, .3)', '50%': 'rgba(86, 143, 135, .6)', '100%': 'rgba(86, 143, 135, 1)' } }
																		/>
																	</div>
																	: <></>
															}
															<Icon className="i-6x" tap>
																{ audioActive === 2 || audioActive === 1 ? <IconAudioActive /> : <IconAudioDef /> }
															</Icon>
														</div>
													</Tooltip>
													: <>
														{
															talkSipPubState === 1 || talkSipPubState === 2
																? <Tooltip title="等待SIP注册完成"><div className="item audio"><Icon className="i-6x rotating-ele esp"><IconLoading /></Icon></div></Tooltip>
																: <Tooltip title="启动语音"><div className="item audio" onClick={ () => { handleSendSip(2) } }><Icon className="i-6x" tap><IconPrepareAudio /></Icon></div></Tooltip>
														}
													</>
											}</>
											: <Tooltip title="等待其他用户结束对讲"><div className="item audio"><Icon className="i-6x"><IconNotAllowed /></Icon></div></Tooltip>
									}
								</>
								: <Tooltip title="未检测到麦克风设备"><div className="item audio"><Icon className="i-5x"><IconNoMicrophone /></Icon></div></Tooltip>
						}
					</>
					: <Tooltip title="WS链接已断开"><div className="item audio"><Icon className="i-6x"><IconNotAllowed /></Icon></div></Tooltip>
			}
		</div>
		<div className="controls-1 flex column flex-1 flex-cc">
			<div className="control-zoom">
				<span
					onMouseDown={ () => { control(ControlType.minifier, 1) } }
					onMouseUp={ () => { control(ControlType.stop) } }
					className="item"
				><Icon className="i-4x" tap><IconMinifier1 /></Icon></span>
				<div className="item s">
					<span>变倍</span>
				</div>
				<span
					onMouseDown={ () => { control(ControlType.minifier, -1) } }
					onMouseUp={ () => { control(ControlType.stop) } }
					className="item"
				><Icon className="i-4x" tap><IconMinifier2 /></Icon></span>
			</div>
			<div className="control-zoom">
				<span
					onMouseDown={ () => { control(ControlType.zoom, 1) } }
					onMouseUp={ () => { control(ControlType.stop) } }
					className="item"
				><Icon className="i-4x esp" tap><IconZoom1 /></Icon></span>
				<div className="item s">
					<span>变焦</span>
				</div>
				<span
					onMouseDown={ () => { control(ControlType.zoom, -1) } }
					onMouseUp={ () => { control(ControlType.stop) } }
					className="item"
				><Icon className="i-4x esp" tap><IconZoom2 /></Icon></span>
			</div>
			<div className="control-zoom">
				<span
					onMouseDown={ () => { control(ControlType.diaphragm, 1) } }
					onMouseUp={ () => { control(ControlType.stop) } }
					className="item"
				><Icon className="i-4x" tap><IconDiaphragm1 /></Icon></span>
				<div className="item s">
					<span>光圈</span>
				</div>
				<span
					onMouseDown={ () => { control(ControlType.diaphragm, -1) } }
					onMouseUp={ () => { control(ControlType.stop) } }
					className="item"
				><Icon className="i-4x" tap><IconDiaphragm2 /></Icon></span>
			</div>
			<div className="control-zoom">
				<span onClick={ () => { control(ControlType.speed, speed + 1 >= 10 ? 10 : speed + 1) } } className="item"><Icon className="i-4x" tap><IconAdd1 /></Icon></span>
				<div className="item s p">
					<span>速度({ speed })</span>
				</div>
				<span onClick={ () => { control(ControlType.speed, speed - 1 <= 1 ? 1 : speed - 1) } } className="item"><Icon className="i-4x" tap><IconSurplus1 /></Icon></span>
			</div>
		</div>
	</div>
}

export const PresetPoints = (props: Props & { addVisible: boolean, setAddPresetPointsVisible: (v: boolean) => void }): ReactElement => {
	const [ title, setTitle ] = useFetchState('')
	const [ index, setIndex ] = useFetchState('')
	const [ loading, setLoading ] = useFetchState(false)
	const [ presetPoints, setPresetPoints ] = useFetchState<PresetPointRecords>([])
	const [ presetPointMaxCount, setPresetPointMaxCount ] = useFetchState(300)

	const fetchData = (): void => {
		void PresetPointsApi({
			deviceUniqueId: props.deviceUniqueId,
			channelUniqueId: props.channelUniqueId
		}).then(
			res => {
				setPresetPoints(res.data?.records ?? [])
				setPresetPointMaxCount(res.data?.count ?? 300)
			}
		)
	}

	const set = (type: PresetPointSetType, index: string): void => {
		if (type === 'add') {
			if (parseInt(index) > presetPointMaxCount) {
				MMessage({
					type: MessageType.warning,
					message: `预置位不能超过${ presetPointMaxCount }上限`
				})
				return
			}

			if (title === '') {
				MMessage({
					type: MessageType.warning,
					message: 'title不能为空'
				})
				return
			}
		}

		props.setAddPresetPointsVisible(false)
		setTitle('')
		setIndex('')

		setLoading(true)
		void PresetPointSet({
			deviceUniqueId: props.deviceUniqueId,
			channelUniqueId: props.channelUniqueId,
			title,
			index,
			type
		}).finally(
			() => {
				setLoading(false)
				fetchData()
			}
		)
	}

	useEffect(fetchData, [])

	return <>
		<ul className="device-preset-points">
			{
				presetPoints.length > 0
					? <>
						{
							presetPoints.map(
								(item, index) => <li key={ index }>
									<i className="blue">[{ item.index }] </i>
									<span>{ item.name }</span>
									<div className="actions">
										<Tooltip title="重置预置位" arrow={ true }>
											<span onClick={ () => { set('reset', item.index) } }><Icon className="i-3x" tap><IconReset /></Icon></span>
										</Tooltip>
										<Tooltip title="跳转预置位" arrow={ true }>
											<span onClick={ () => { set('skip', item.index) } }><Icon className="i-3x" tap><IconAnchor /></Icon></span>
										</Tooltip>
										<Tooltip title="删除预置位" arrow={ true }>
											<span onClick={ () => { set('delete', item.index) } }><Icon className="i-3x" tap><IconDelete /></Icon></span>
										</Tooltip>
									</div>
								</li>
							)
						}
					</>
					: <Empty />
			}
		</ul>
		{
			props.addVisible
				? <div className="add-device-preset-point-box">
					<div className="line">
						<div className="item">
							<div className="title">名称<i className="red">*</i>:</div>
							<div className="input">
								<Input value={ title } onChange={ e => { setTitle(e.currentTarget.value.trim()) } } />
							</div>
						</div>
						<div className="item">
							<div className="title">索引:</div>
							<div className="input">
								<Input value={ index } onChange={ e => { setIndex(e.currentTarget.value.trim()) } } />
							</div>
						</div>
					</div>
					<div className="line btn">
						<Button type="primary" loading={ loading } disabled={ title === '' || index === '' } onClick={ () => { set('add', index) } }>保存</Button>
						<Button onClick={ () => { props.setAddPresetPointsVisible(false) } }>取消</Button>
					</div>
				</div>
				: <></>
		}
	</>
}

// const generateABCBase64 = (durationMs: number = 1000, sampleRate: number = 8000): string => {
// 	const samples = (sampleRate * durationMs) / 1000
// 	const pcmData = new Uint8Array(samples * 2)
//
// 	// "ABC" 三个音调
// 	const freqs = [440, 494, 523]
// 	const segmentSamples = Math.floor(samples / 3)
//
// 	for (let seg = 0; seg < 3; seg++) {
// 		const freq = freqs[seg]
// 		const start = seg * segmentSamples
// 		const end = Math.min((seg + 1) * segmentSamples, samples)
//
// 		for (let i = start; i < end; i++) {
// 			const t = (i - start) / sampleRate
// 			const sample = Math.sin(2 * Math.PI * freq * t) * 0.5
//
// 			// 包络
// 			const envelope = Math.min(1, t * 50) * Math.min(1, (end - i) / (segmentSamples * 0.1))
// 			const finalSample = sample * envelope
//
// 			const int16 = Math.round(finalSample * 32767)
// 			pcmData[i * 2] = int16 & 0xFF
// 			pcmData[i * 2 + 1] = (int16 >> 8) & 0xFF
// 		}
// 	}
//
// 	// 转换为Base64
// 	let binary = ''
// 	for (let i = 0; i < pcmData.length; i++) {
// 		binary += String.fromCharCode(pcmData[i])
// 	}
// 	const base64 = btoa(binary)
//
// 	console.log(`ABC语音Base64: ${base64.substring(0, 50)}...`)
// 	return base64
// }
// generateABCBase64(20, 8000)
