import React, { type FC, useEffect, useRef } from 'react'
import { Dropdown, Tooltip } from 'antd'
import Screen from 'screenfull'
import 'leaflet/dist/leaflet.css'
import { isEmpty } from '#utils/functions'
import useFetchState from '#repositories/models'
import { InputSet as VInputSet, type VideoStreamResp } from '#repositories/models/recoil-state'
import { VideoPreviewPreinstall, type VideoPreviewPreinstallItem } from '#repositories/cache/ls'
import { ReactComponent as IconSplit1 } from '#assets/svg/split-1.svg'
import { ReactComponent as IconSplit4 } from '#assets/svg/split-4.svg'
import { ReactComponent as IconSplit9 } from '#assets/svg/split-9.svg'
import { ReactComponent as IconSplit16 } from '#assets/svg/split-16.svg'
import { ReactComponent as IconFullScreen1 } from '#assets/svg/full-screen-1.svg'
import { ReactComponent as IconFullScreen2 } from '#assets/svg/full-screen-2.svg'
import { ReactComponent as IconClear } from '#assets/svg/clear.svg'
import { ReactComponent as IconSlideVideo } from '#assets/svg/slide-video.svg'
import { ReactComponent as IconStop } from '#assets/svg/stop.svg'
import { ReactComponent as IconEye } from '#assets/svg/eye.svg'
import { ReactComponent as IconEye1 } from '#assets/svg/eye-1.svg'
import { ReactComponent as IconClose } from '#assets/svg/close.svg'
import { ReactComponent as IconSave } from '#assets/svg/save.svg'
import Icon from '#components/icon'
import CVideoBox from '#components/video'
import { MessageType, MMessage } from '#components/hint'
import { type Item as CItem } from '#pages/devices/channels/model'
import { type SplitStyle, SplitStyle as VSplitStyle } from '#pages/video-filters/model'

interface Props {
	fullScreen: boolean
	selectedVideo?: VideoStreamResp
	fsCtlVisible: boolean
	setFsCtlVisible: (visible: boolean) => void
	handleControlDragClick: (event: React.MouseEvent) => void
	splitStyle: SplitStyle
	previews: string[]
	handleSetVideoPreviewPreinstall: (item: VideoPreviewPreinstallItem) => void
	selectedIndex: number
	setSelectedIndex: (index: number) => void
	onSelectChannel: (item: CItem, clear: boolean) => void
	channelSelected: { [ key: string ]: CItem }
	eyeState: boolean
	setEyeState: (v: boolean) => void
	slideVideosIntervalState: boolean
	handleStopSlideVideos: () => void
	handleSlideVideos: () => void
	clear: () => void
	onSetSplitStyle: (key: SplitStyle) => void
	setVideoStreamRefCall: (key: string, item: VideoStreamResp) => void
}

const Main: FC<Props> = props => {
	const {
		fullScreen,
		splitStyle,
		previews,
		handleSetVideoPreviewPreinstall,
		selectedIndex,
		setSelectedIndex,
		onSelectChannel,
		channelSelected,
		eyeState,
		slideVideosIntervalState,
		handleStopSlideVideos,
		setEyeState,
		handleSlideVideos,
		onSetSplitStyle,
		clear,
		setVideoStreamRefCall
	} = props
	const splitScreenVideoRef = useRef<HTMLDivElement | null>(null)
	const inputSet = new VInputSet()
	const [ videoPreviewPreinstallList, setVideoPreviewPreinstallList ] = useFetchState<VideoPreviewPreinstallItem[]>([])

	// 设置全屏
	const onFullScreen = (): void => {
		if (Screen.isEnabled) {
			if (splitScreenVideoRef.current !== null) {
				void Screen.toggle(splitScreenVideoRef.current)
			}
			return
		}

		MMessage({ message: '浏览器不支持全屏', type: MessageType.warning })
	}

	// 保存预设
	const handleSavePreinstall = (): void => {
		inputSet.set({
			visible: true,
			title: <>设置标题</>,
			defaultValue: '',
			submit: (text, close) => {
				const title = text.trim()
				if (title === '') {
					MMessage({ message: '标题不能为空', type: MessageType.error })
					return
				}

				VideoPreviewPreinstall('set', { previews, title, splitStyle, selectedIndex })
				setVideoPreviewPreinstallList(VideoPreviewPreinstall() ?? [])
				close()
			}
		})
	}

	useEffect(
		() => {
			setVideoPreviewPreinstallList(VideoPreviewPreinstall() ?? [])
		},
		[]
	)

	return <div className="videos" ref={ splitScreenVideoRef } id="videos">
		<ul className={ `video-items column-${ splitStyle }` }>
			{
				previews.map(
					(item, key) => <li key={ key } className={ `item ${ selectedIndex === key ? 'active' : '' }` } onClick={ () => { setSelectedIndex(key) } }>
						{
							item !== '' && !isEmpty(channelSelected[ item ])
								? <>
									<div className="close" onClick={ () => { onSelectChannel(channelSelected[ item ], true) } }>
										<Icon className="i-4ax" tap><IconClose /></Icon>
									</div>
									<CVideoBox
										visible={ true }
										inner={ true }
										deviceUniqueId={ channelSelected[ item ].deviceUniqueId }
										channelUniqueId={ channelSelected[ item ].uniqueId }
										showDescription={ eyeState }
										videoStream={
											v => {
												setVideoStreamRefCall(item, v)
											}
										}
									/>
								</>
								: <p className="wh100 flex flex-cc">无信号</p>
						}
					</li>
				)
			}
		</ul>
		<ul className="footer">
			<li className="item preinstall">
				<div>
					{
						videoPreviewPreinstallList.map(
							(item, index) =>
								<Dropdown
									key={ index }
									menu={
										{
											items: [
												{
													key: '1',
													label: '移除',
													onClick: e => {
														e.domEvent.stopPropagation()
														VideoPreviewPreinstall('remove', item)
														setVideoPreviewPreinstallList(VideoPreviewPreinstall() ?? [])
													}
												}
											]
										}
									}
									arrow={ true }
									autoAdjustOverflow={ true }
									trigger={ [ 'contextMenu' ] }
									placement="top"
								>
									<div className="p-item" onClick={ () => { handleSetVideoPreviewPreinstall(item) } }>
										<span>{ item.title }</span>
									</div>
								</Dropdown>

						)
					}
				</div>
			</li>
			{
				fullScreen
					? <Tooltip title="退出全屏" arrow={ true }>
						<li className="item s" onClick={ onFullScreen }>
							<Icon className="i-4x" tap><IconFullScreen2 /></Icon>
						</li>
					</Tooltip>
					: <Tooltip title="全屏" arrow={ true }>
						<li className="item s" onClick={ onFullScreen }>
							<Icon className="i-4x" tap><IconFullScreen1 /></Icon>
						</li>
					</Tooltip>
			}
			{
				previews.filter(item => item !== '').length > 0
					? <Tooltip title="清屏" arrow={ true }>
						<li className={ `item ${ splitStyle === VSplitStyle.s1 ? 'active' : '' }` } onClick={ clear }>
							<Icon className="i-4x" tap><IconClear /></Icon>
						</li>
					</Tooltip>
					: <></>
			}
			{
				slideVideosIntervalState
					? <>
						<li className="item t">轮播中</li>
						<Tooltip title="停止轮播" arrow={ true }>
							<li className="item s" onClick={ handleStopSlideVideos }>
								<Icon className="i-4x" tap><IconStop /></Icon>
							</li>
						</Tooltip>
					</>
					: <Tooltip title="轮播" arrow={ true }>
						<li className="item s" onClick={ handleSlideVideos }>
							<Icon className="i-4x" tap><IconSlideVideo /></Icon>
						</li>
					</Tooltip>
			}
			{
				previews.filter(item => item !== '' && !isEmpty(channelSelected[ item ])).length > 0
					? <Tooltip title="保存为预设" arrow={ true }>
						<li className="item s" onClick={ handleSavePreinstall }>
							<Icon className="i-4x" tap><IconSave /></Icon>
						</li>
					</Tooltip>
					: <></>
			}
			{
				eyeState
					? <Tooltip title="隐藏信息" arrow={ true }>
						<li className="item eye" onClick={ () => { setEyeState(false) } }>
							<Icon className="i-4x" tap><IconEye1 /></Icon>
						</li>
					</Tooltip>
					: <Tooltip title="显示信息" arrow={ true }>
						<li className="item eye" onClick={ () => { setEyeState(true) } }>
							<Icon className="i-4x" tap><IconEye /></Icon>
						</li>
					</Tooltip>
			}
			{
				slideVideosIntervalState
					? <></>
					: <>
						<Tooltip title="一分屏" arrow={ true }>
							<li className={ `item ${ splitStyle === VSplitStyle.s1 ? 'active' : '' }` } onClick={ () => { onSetSplitStyle(VSplitStyle.s1) } }>
								<Icon className="i-4x" tap><IconSplit1 /></Icon>
							</li>
						</Tooltip>
						<Tooltip title="四分屏" arrow={ true }>
							<li className={ `item ${ splitStyle === VSplitStyle.s4 ? 'active' : '' }` } onClick={ () => { onSetSplitStyle(VSplitStyle.s4) } }>
								<Icon className="i-4x" tap><IconSplit4 /></Icon>
							</li>
						</Tooltip>
						<Tooltip title="九分屏" arrow={ true }>
							<li className={ `item ${ splitStyle === VSplitStyle.s9 ? 'active' : '' }` } onClick={ () => { onSetSplitStyle(VSplitStyle.s9) } }>
								<Icon className="i-4x" tap><IconSplit9 /></Icon>
							</li>
						</Tooltip>
						<Tooltip title="十六分屏" arrow={ true }>
							<li className={ `item ${ splitStyle === VSplitStyle.s16 ? 'active' : '' }` } onClick={ () => { onSetSplitStyle(VSplitStyle.s16) } }>
								<Icon className="i-4x" tap><IconSplit16 /></Icon>
							</li>
						</Tooltip>
					</>
			}
		</ul>
	</div>
}

export default Main

// TODO 视频调阅增加(调阅预设)(选择的通道 下次进来可以选择 最多5个) 缓存在浏览器中
// TODO 设置弹窗地图文件显示错误