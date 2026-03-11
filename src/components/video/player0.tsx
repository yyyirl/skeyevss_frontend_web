import React, { type ReactElement, useEffect, useImperativeHandle, useRef, forwardRef } from 'react'
import type { PlayRef } from './types'

interface Props {
	'video-url'?: string
	screenshot?: (data?: string) => void
}

const Main = forwardRef(
	(props: Props, ref: React.Ref<PlayRef>): ReactElement => {
		const videoPlayerRef = useRef<any>(null)
		const jessibuca = useRef<any>(null)
		const createVideoPlayer = (options = {}, loading = false, isReplay = false): void => {
			const _options = Object.assign({}, {
				container: videoPlayerRef.current,
				videoBuffer: 0.1,
				videoBufferDelay: 0.2,
				decoder: '/assets/js/video/jessibuca/decoder-pro.js',
				isResize: false,
				text: '',
				loadingText: '加载中',
				debug: false,
				debugLevel: 'debug',
				useMSE: true,
				decoderErrorAutoWasm: true,
				useSIMD: true,
				useWCS: false,
				useMThreading: true,
				showBandwidth: false, // 显示网速
				showPerformance: false, // 显示性能
				// 是否开启声音
				hasAudio: true,
				controlAutoHide: true,
				// 控制栏
				operateBtns: {
					fullscreen: true, // 全屏按钮
					screenshot: true, // 快照截图按钮
					play: true, // 播放按钮
					audio: true, // 音频按钮
					ptz: false, // 云台控制按钮
					quality: false, // 视频清晰度按钮
					performance: true, // 性能按钮
					record: true // 录像按钮
				},
				timeout: 10,
				audioEngine: 'worklet',
				qualityConfig: [ '普清', '高清', '超清', '4K', '8K' ],
				forceNoOffscreen: true,
				isNotMute: false,
				ptzClickType: 'mouseDownAndUp',
				ptzZoomShow: true,
				ptzMoreArrowShow: true,
				ptzApertureShow: true,
				ptzFocusShow: true,
				useCanvasRender: false,
				useWebGPU: false,
				demuxUseWorker: false,
				controlHtml: '',
				pauseAndNextPlayUseLastFrameShow: true,
				// 重播使用上一帧显示
				replayUseLastFrameShow: true,
				// 重播显示loading
				replayShowLoadingIcon: false,
				loadingIcon: loading,
				mseDecoderUseWorker: true,
				// 播放开始加载超时
				loadingTimeout: 10,
				loadingTimeoutReplay: true,
				loadingTimeoutReplayTimes: -1,
				// 播放过程中超时
				heartTimeout: 10,
				heartTimeoutReplay: true,
				heartTimeoutReplayUseLastFrameShow: true,
				heartTimeoutReplayTimes: -1,
				streamErrorReplay: true,
				streamErrorReplayDelayTime: 5, // 延迟1s去触发播放。
				streamEndReplay: true,
				streamEndReplayDelayTime: 5, // 延迟1s去触发播放。
				websocket1006ErrorReplay: true,
				websocket1006ErrorReplayDelayTime: 1,
				networkDisconnectReplay: true,
				playFailedAndPausedShowPlayBtn: false,
				supportHls265: true // 启动新的解码器
			}, options)
			jessibuca.current = new window.SkeyePlayerPro(_options)

			const href = props[ 'video-url' ]
			if (href !== '') {
				if (!isReplay) {
					jessibuca.current.play(href)
				}
			} else {
				jessibuca.current.showErrorMessageTips('播放地址不能为空')
			}

			jessibuca.current.on('playFailedAndPaused', (error: string, frameInfo: any, msg: string) => {
				jessibuca.current.showErrorMessageTips('播放异常：' + error)
				jessibuca.current.showErrorMessageTips('msg：' + msg)
				//  一直播放
				//  触发重播的时候，使用最后一帧来显示
				// 最后一帧显示
				void resetPlayer(frameInfo as object).then(() => {
					//  延迟个1秒再重连
					setTimeout(() => {
						if (href !== '') {
							jessibuca.current.play(href).then(() => {
								console.log('play success')
							}).catch((e: any) => {
								console.log('play error', e)
							})
						} else {
							jessibuca.current.showErrorMessageTips('播放地址不能为空')
						}
					}, 3 * 1000)
				})
			})
		}
		const resetPlayer = async(options: object): Promise<any> => {
			await new Promise<void>((resolve) => {
				if (jessibuca.current !== null) {
					jessibuca.current.destroy().then(() => {
						createVideoPlayer(options, true, true)
						resolve()
					})
				} else {
					createVideoPlayer({}, true, false)
					resolve()
				}
			})
		}

		// 截图
		const onScreenshot = (): void => {
			return jessibuca.current.screenshot('screenshot', 'png', 0.92, 'base64')
		}

		// 开始录制
		const startRecord = async(): Promise<any> => {
			return jessibuca.current.startRecord('录像')
		}

		// 暂停录制并下载
		const stopRecordAndSave = async(): Promise<any> => {
			const isRecording: boolean = jessibuca.current.isRecording()
			if (isRecording) {
				return jessibuca.current.stopRecordAndSave('blob')
			} else {
				throw new Error(JSON.stringify({
					msg: '未开始录制！'
				}))
			}
		}

		// 设置时间
		const setCurrentTime = (duration: number): void => {
		}

		useEffect(
			() => {
				createVideoPlayer({}, true, false)
				return () => {
					jessibuca?.current.destroy()
				}
			},
			[]
		)

		useImperativeHandle(
			ref,
			() => ({
				onScreenshot,
				startRecord,
				stopRecordAndSave,
				setCurrentTime
			})
		)

		return <div ref={ videoPlayerRef } className="wh100"></div>
	}
)

Main.displayName = 'PlaybackPlayer'

export default Main
