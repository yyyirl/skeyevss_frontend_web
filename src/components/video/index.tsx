import React, { type ReactElement, type Ref, useEffect, useImperativeHandle, useRef } from 'react'
import { Button, Spin, Tabs, Tooltip } from 'antd'
import { variables } from '#constants/appoint'
import useFetchState from '#repositories/models'
import { GetVideoStream, GetVideoStreamInfo, PlaybackControl, StopVideoStream, type StreamInfoReq, type StreamUrlItem } from '#repositories/apis/base'
import { type RTVideoProps, Setting as SSetting, type VideoStreamResp } from '#repositories/models/recoil-state'
import { autoConvertBits, copyToClipboard, isEmpty, throttle, timestampFormat } from '#utils/functions'
import { errorMessage } from '#utils/err-hint'
import { MessageType, MMessage } from '#components/hint'
import Player0 from '#components/video/player0'
import Player1 from '#components/video/player1'
import Loading from '#components/loading'
import type { PlayRef } from '#components/video/types'
import { Item } from '#pages/devices/channels/model'

export interface VideoRef {
	stopVideoStream: () => void
	onScreenshot: () => void
}

const Main = (props: RTVideoProps & { videoRef?: Ref<VideoRef> }): ReactElement => {
	const settingState = new SSetting().shared()
	const playAddressTypes = settingState?.[ 'ms-video-play-address-types' ] ?? []
	const mediaServerVideoPlayAddressType = settingState.setting.mediaServerVideoPlayAddressType

	const streamRef = useRef<VideoStreamResp | undefined>(undefined)
	const videoPlayerRef = useRef<PlayRef>(null)
	const fetchStreamStateIntervalRef = useRef<any>(null)
	const fetchStreamInfoIntervalRef = useRef<any>(null)

	const [ loading, setLoading ] = useFetchState(false)
	const [ recordingLoading, setRecordingLoading ] = useFetchState(false)
	const [ recordingAndSaveLoading, setRecordingAndSaveLoading ] = useFetchState(false)
	const [ playItem, setPlayItem ] = useFetchState<StreamUrlItem | undefined>(undefined)
	const [ videoStream, setVideoStream ] = useFetchState<VideoStreamResp | undefined>(undefined)
	const [ videoStreamInfo, setVideoStreamInfo ] = useFetchState<StreamInfoReq | undefined>(undefined)
	const [ playType, setPlayType ] = useFetchState(0)
	const [ activeKey, setActiveKey ] = useFetchState(mediaServerVideoPlayAddressType)

	const stopVideoStream = (): void => {
		if (variables.licenseError !== undefined) {
			MMessage({ message: errorMessage(), type: MessageType.warning })
			return
		}

		// 停止视频流
		if (streamRef.current === undefined || isEmpty(streamRef.current)) {
			return
		}

		if ((props.startAt ?? 0) > 0) {
			void StopVideoStream(streamRef.current.streamName, streamRef.current?.mediaServerID).then(
				() => {
					props.setChannelRecord?.({
						streamState: 0,
						streamMSId: streamRef.current?.mediaServerID ?? 0
					})
				}
			)
		}

		streamRef.current = undefined
	}
	// 获取快照
	const onScreenshot = (): void => {
		if (variables.licenseError !== undefined || variables.showcase === true) {
			MMessage({ message: errorMessage(), type: MessageType.warning })
			return
		}

		videoPlayerRef?.current?.onScreenshot()
	}

	// 获取快照 base64 数据
	const snapOutside = (data?: string): void => {
		if (variables.licenseError !== undefined || variables.showcase === true) {
			MMessage({ message: errorMessage(), type: MessageType.warning })
			return
		}

		props?.screenshot?.(data)
	}

	// 开始录制
	const onStartRecordingVideo = (): void => {
		if (variables.licenseError !== undefined || variables.showcase === true) {
			MMessage({ message: errorMessage(), type: MessageType.warning })
			return
		}

		void videoPlayerRef.current?.startRecord().then(
			() => {
				setRecordingLoading(true)
			}
		)
	}

	// 暂停录制并下载
	const onStopRecordingAndSave = (): void => {
		if (variables.licenseError !== undefined || variables.showcase === true) {
			MMessage({ message: errorMessage(), type: MessageType.warning })
			return
		}

		setRecordingLoading(false)
		setRecordingAndSaveLoading(true)
		videoPlayerRef.current?.stopRecordAndSave().then(
			(fileBlob: Blob) => {
				const filename = `${ timestampFormat(props.startAt ?? 0) } ${ timestampFormat(props.endAt ?? 0) }.mp4`
				props?.videoSave?.({
					filename,
					blob: fileBlob,
					startAt: props.startAt ?? 0,
					endAt: props.endAt ?? 0
				})
			}
		).catch(
			(err: Error) => {
				console.log(err)
			}
		).finally(
			() => {
				setRecordingAndSaveLoading(false)
			}
		)
	}

	const switchPlayUrl = (key: string): void => {
		for (const k in videoStream?.addresses) {
			const item = videoStream?.addresses[ k ]
			if (item?.name === key) {
				if (key === 'RTMP' || key === 'RTSP') {
					let url = videoStream?.addresses.rtsp.url
					if (key === 'RTMP') {
						url = videoStream?.addresses.rtmp.url
					}

					copyToClipboard(url)
					MMessage({
						message: `复制成功[ ${ key } ]`,
						type: MessageType.success
					})
					return
				}

				setActiveKey(item?.name)
				setPlayType(item?.name === 'WEBRTC' ? 1 : 0)
				setPlayItem(item)
			}
		}
	}

	const fetchStreamInfo = (): void => {
		if (variables.licenseError !== undefined) {
			MMessage({ message: errorMessage(), type: MessageType.warning })
			return
		}

		void GetVideoStreamInfo(videoStream?.streamName ?? '', videoStream?.mediaServerID ?? 0).then(
			res => {
				setVideoStreamInfo(res.data)
			}
		).catch(
			() => {}
		).finally(
			() => {
				fetchStreamInfoIntervalRef.current = setTimeout(
					() => {
						fetchStreamInfo()
					},
					2000
				)
			}
		)
	}

	const speed = (): string => {
		const data = autoConvertBits(videoStreamInfo?.[ Item.apType(videoStream?.accessProtocol ?? 0) ].bitrate_kbits ?? 0)
		return `${ data.value }${ data.unit }`
	}

	useEffect(
		() => {
			if (videoStream === undefined) {
				return
			}

			props.videoStream?.(videoStream)

			if (props.inner !== true) {
				fetchStreamInfo()
			}
		},
		[ videoStream ]
	)

	useEffect(
		() => {
			if (variables.licenseError !== undefined) {
				MMessage({ message: errorMessage(), type: MessageType.warning })
				return
			}

			setLoading(true)

			let channelUniqueId = props.channelUniqueId
			if (channelUniqueId.includes('-')) {
				channelUniqueId = channelUniqueId.split('-')[ 1 ]
			}

			// 获取播放地址
			void GetVideoStream(
				{
					deviceUniqueId: props.deviceUniqueId,
					channelUniqueId,
					startAt: props.startAt,
					endAt: props.endAt,
					download: props.download,
					speed: props.playSpeed ?? 8,
					https: window.location.protocol === 'https:'
				}
			).then(
				res => {
					setVideoStream(res.data)
					streamRef.current = res.data
					if ((props.endAt ?? 0) > 0) {
						setPlayType(0)
						setPlayItem(res.data?.addresses.httpFlv)
					} else {
						for (const k in res.data?.addresses) {
							const item = res.data?.addresses[ k ]
							if (item?.name === mediaServerVideoPlayAddressType) {
								setPlayItem(item)
								setPlayType(item?.name === 'WEBRTC' ? 1 : 0)
								break
							}
						}
					}
				}
			).catch(
				() => {
					props.close?.()
				}
			).finally(
				() => {
					setLoading(false)
				}
			)

			return () => {
				// 停止视频流
				stopVideoStream()

				clearTimeout(fetchStreamInfoIntervalRef.current as number)
				clearTimeout(fetchStreamStateIntervalRef.current as number)
			}
		},
		[ props.deviceUniqueId, props.channelUniqueId, props.startAt ]
	)

	useEffect(
		() => {
			if (videoStream === undefined || (props.endAt ?? 0) <= 0) {
				return
			}

			throttle(
				() => {
					void PlaybackControl({ speed: props.playSpeed ?? 8, streamName: videoStream.streamName })
				},
				400,
				`${ props.deviceUniqueId }${ props.channelUniqueId }`
			)
		},
		[ props.playSpeed, videoStream ]
	)

	useImperativeHandle(
		props.videoRef,
		() => ({
			stopVideoStream,
			onScreenshot
		}),
		[ videoStream, stopVideoStream, onScreenshot, videoStream ]
	)

	return <Spin spinning={ loading }>
		<div className="video-frame oh">
			<div className="video-head-warp">
				{ props.header !== undefined && props.inner !== true ? <div>{ props.header }</div> : <></> }
				{
					videoStream?.addresses !== undefined && props.inner !== true
						? <Tabs
							className="video-frame-tabs"
							onChange={ switchPlayUrl }
							activeKey={ activeKey }
							items={ playAddressTypes.map(val => ({ label: val, key: val })) }
						/>
						: <></>
				}
			</div>
			<div className="video-body">
				<div className="video-frame-box oh">
					{
						playItem === undefined
							? <Loading />
							: <>
								{
									props.showDescription === true
										? <div className="description">
											<p>{ videoStream?.channelName }</p>
										</div>
										: <></>
								}
								{
									playType === 0
										? <Player0
											ref={ videoPlayerRef }
											key={ playItem.url }
											screenshot={ snapOutside }
											video-url={ playItem.url }
										/>
										: <Player1
											ref={ videoPlayerRef }
											video-url={ playItem.url }
											snapOutside={ snapOutside }
											live={ true }
										/>
								}
							</>
					}
				</div>
				{
					props.inner === true
						? <></>
						: <div className="video-device-controls">
							{
								playItem === undefined
									? <></>
									: <>
										<div className="detail">
											<div><span className="title">Player Type:</span> <i>{ playType === 0 ? 'jessibuca' : 'liveplayer' }</i></div>
											<div><span className="title">在线状态:</span> { videoStream?.channelOnlineState === true ? <i className="green">在线</i> : <i className="red">离线</i> }</div>
											<div><span className="title">设备编码:</span> <i className="red">{ videoStream?.deviceID ?? '-' }</i></div>
											<div><span className="title">通道编码:</span> <i className="red">{ videoStream?.channelID ?? '-' }</i></div>
											<div><span className="title">媒体服务节点:</span> <i className="red">{ videoStream?.mediaServerNode ?? '-' }</i></div>
											<div><span className="title">媒体服务名称:</span> <i className="red">{ videoStream?.mediaServerName ?? '-' }</i></div>
											<div><span className="title">协议:</span> <i className="red">{ videoStream?.accessProtocolName ?? '-' }</i></div>
											<div><span className="title">媒体服务节点:</span> <i className="red">{ videoStream?.mediaServerNode ?? '-' }</i></div>
											<div>
												<span className="title">Stream Name: </span>
												<Tooltip title="点击复制" placement="right" arrow={ true }>
													<span
														className="pointer blue"
														onClick={
															() => {
																copyToClipboard(videoStream?.streamName ?? '')
																MMessage({ message: '复制成功', type: MessageType.success })
															}
														}
													>{ videoStream?.streamName ?? '-' }</span>
												</Tooltip>
											</div>
											<div>
												<span className="title">播放地址[ <span className="blue">{ playItem?.name }</span> ]: </span>
												<Tooltip title="点击复制" placement="right" arrow={ true }>
													<span
														className="pointer blue"
														onClick={
															() => {
																copyToClipboard(playItem?.url ?? '')
																MMessage({ message: '复制成功', type: MessageType.success })
															}
														}
													> { playItem?.url }</span>
												</Tooltip>
											</div>
											{
												videoStreamInfo !== undefined
													? <>
														<div><span className="title">分辨率: </span> { videoStreamInfo.video_width } x { videoStreamInfo.video_height }</div>
														<div><span className="title">视频编码格式: </span> { videoStreamInfo.video_codec }</div>
														<div><span className="title">音频编码格式: </span> { videoStreamInfo.audio_codec }</div>
														<div><span className="title">码率: </span>{ speed() }</div>
													</>
													: <></>
											}
										</div>
									</>
							}
						</div>
				}
			</div>
			{
				(props.startAt ?? 0) > 0 && props.inner !== true
					? <>
						<div className="recording-actions">
							<Button type="dashed" loading={ recordingLoading } onClick={ onStartRecordingVideo }>开始录制</Button>
							<Button type="primary" loading={ recordingAndSaveLoading } onClick={ onStopRecordingAndSave }>停止并保存</Button>
							<span>回放时间: <span className="red">{ timestampFormat(props.startAt ?? 0) } - { timestampFormat(props.endAt ?? 0) }</span></span>
						</div>
					</>
					: <></>
			}
		</div>
	</Spin>
}

export default Main
