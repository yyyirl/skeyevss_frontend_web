import React, { type ReactElement, useEffect, useImperativeHandle, useRef, forwardRef } from 'react'
import { type PlayRef } from './types'

interface Props {
	'video-url'?: string
	snapOutside?: (evt: any) => void
	ended?: () => void
	timeupdate?: (duration: number) => void
	live: boolean
}

// https://www.liveqing.com/docs/manuals/LivePlayer.html#%E5%B1%9E%E6%80%A7-property
const Main = forwardRef(
	(props: Props, ref: React.Ref<PlayRef>): ReactElement => {
		const videoPlayerRef = useRef<any>(null)

		// 获取快照
		const onScreenshot = (): void => {
			videoPlayerRef.current.getVueInstance().snap()
		}

		// 设置时间
		const setCurrentTime = (duration: number): void => {
			videoPlayerRef.current?.getVueInstance().setCurrentTime(duration)
		}

		// 获取快照 base64 数据
		const snapOutside = (evt: any): void => {
			const res = evt.detail[ 0 ]
			props?.snapOutside?.(res)
		}

		// 开始录制
		const startRecord = async(): Promise<any> => {
		}

		// 暂停录制并下载
		const stopRecordAndSave = async(): Promise<any> => {

		}

		const timeupdate = (evt: any): void => {
			props?.timeupdate?.(parseFloat(`${ evt.detail?.[ 0 ] ?? 0 }`))
		}

		const ended = (evt: any): void => {
			props?.ended?.()
		}

		useEffect(
			() => {
				videoPlayerRef.current?.addEventListener?.('snapOutside', snapOutside)
				videoPlayerRef.current?.addEventListener?.('timeupdate', timeupdate)
				videoPlayerRef.current?.addEventListener?.('ended', ended)

				return () => {
					videoPlayerRef.current?.removeEventListener?.('snapOutside', snapOutside)
					videoPlayerRef.current?.removeEventListener?.('timeupdate', timeupdate)
					videoPlayerRef.current?.removeEventListener?.('ended', ended)

					if (typeof videoPlayerRef.current?.destroy === 'function') {
						videoPlayerRef.current?.destroy()
					}
				}
			},
			[]
		)

		useImperativeHandle(
			ref,
			() => ({
				onScreenshot,
				setCurrentTime,
				startRecord,
				stopRecordAndSave
			}),
			[ onScreenshot, setCurrentTime, startRecord, stopRecordAndSave ]
		)

		return <live-player
			ref={ videoPlayerRef }
			video-url={ props[ 'video-url' ] }
			stretch="true"
			fluent="true"
			autoplay="true"
			hide-big-play-button="true"
			live={ props.live ? 'true' : 'false' }
			aspect="fullscreen"
		/>
	}
)

Main.displayName = 'LivePlayer'

export default Main
