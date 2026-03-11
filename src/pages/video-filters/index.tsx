import React, { useEffect, useRef } from 'react'
import { type MenuInfo } from 'rc-menu/lib/interface'
import { Dropdown, Tabs, Tooltip } from 'antd'
import type { MenuProps } from 'antd/es/menu'
import Screen from 'screenfull'
import type { MenuItem } from '#types/base.d'
import { allIncluded, arrayUnique, inArray, isEmpty, mapFilter, pickListWithIndex, topMap } from '#utils/functions'
import { hintError } from '#utils/err-hint'
import { variables } from '#constants/appoint'
import useFetchState from '#repositories/models'
import { ChannelsPopup, Setting, type VideoStreamResp } from '#repositories/models/recoil-state'
import { Operator } from '#repositories/types/request'
import type { VideoPreviewPreinstallItem } from '#repositories/cache/ls'
import { useDoubleClick } from '#repositories/hooks'
import type { XRouteComponentProps } from '#routers/sites'
import { ReactComponent as IconCamera } from '#assets/svg/camera.svg'
import { ReactComponent as IconFolder1 } from '#assets/svg/folder-1.svg'
import { ReactComponent as IconFolder2 } from '#assets/svg/folder-2.svg'
import { ReactComponent as IconArrow1 } from '#assets/svg/arrow-1.svg'
import Icon from '#components/icon'
import { MessageType, MMessage } from '#components/hint'
import { ChannelListMakeUniqueId, DepartmentTrees, type DepartmentTreesRenderProps, DeviceMenus, type DeviceMenusRef, SetChannelPoints } from '#components/sundry'
import { type Item as CHItem, type Item as CItem } from '#pages/devices/channels/model'
import { List as ChannelListApi, Update as ChannelUpdate } from '#pages/devices/channels/api'
import VideoPreview from './components/preview'
import Maps, { type MapRef } from './components/maps'
import { type SplitStyle, defaultSplitStyle } from './model'

interface PropTypes extends XRouteComponentProps {
	pageType: 'maps' | 'video-preview'
}

const Main: React.FC<PropTypes> = props => {
	const { pageType } = props

	const channelsPopup = new ChannelsPopup()
	const channelsPopupState = channelsPopup.shared()
	const setting = new Setting()
	const Super = setting.shared()?.super ?? 0
	const permissions = setting.shared()?.permissionIds ?? []

	const videoStreamsRef = useRef<{ [key: string]: VideoStreamResp }>({})
	const mapRef = useRef<MapRef>(null)
	const slideVideosIntervalRef = useRef<any>(null)
	const deviceMenusRef = useRef<DeviceMenusRef>(null)

	const [ channelSelected, setChannelSelected ] = useFetchState<{ [key: string]: CItem }>({})
	const [ selectedIndex, setSelectedIndex ] = useFetchState(0)
	const [ selectedVideo, setSelectedVideo ] = useFetchState<VideoStreamResp | undefined>(undefined)

	const [ slideVideosIntervalState, setSlideVideosIntervalState ] = useFetchState(false)
	const [ filterTab, setFilterTab ] = useFetchState('0')
	const [ previews, setPreviews ] = useFetchState<string[]>(Array(defaultSplitStyle).fill('') as string[])
	const [ splitStyle, setSplitStyle ] = useFetchState<SplitStyle>(defaultSplitStyle)
	const [ fullScreen, setFullScreen ] = useFetchState(false)
	const [ eyeState, setEyeState ] = useFetchState(false)
	const [ channelGroups, setChannelGroups ] = useFetchState<{ [key: number]: CItem[] }>({})
	const [ fsCtlVisible, setFsCtlVisible ] = useFetchState(false)
	const [ foldUpState, setFoldUpState ] = useFetchState(false)
	const menuFoldUp = (): void => {
		setFoldUpState(!foldUpState)
	}

	// 切换 设备/组织架构
	const onSwitchFilter = (key: string): void => {
		setFilterTab(key)
	}

	// 设置分屏
	const onSetSplitStyle = (key: SplitStyle): void => {
		let index = selectedIndex
		if (index >= key) {
			index = 0
		}

		setSelectedIndex(index)
		setSplitStyle(key)
		handleSetPreviews({ splitStyle: key, index })
	}

	// 清除页面视频
	const clear = (): void => {
		handleStopSlideVideos()
		setChannelSelected({})
		setPreviews(Array(splitStyle).fill(''))
	}

	// 设置视频列表
	const handleSetPreviews = (params: { splitStyle: SplitStyle, index?: number, channelItem?: CItem }): void => {
		let tmpPreview = Array(params.splitStyle).fill('').map((_, i) => previews[ i ] ?? '')
		if (params.channelItem !== undefined && params.index !== undefined) {
			if (inArray(tmpPreview, params.channelItem.uniqueId)) {
				tmpPreview = tmpPreview.map(item => item === params.channelItem?.uniqueId ? '' : item)
			} else {
				tmpPreview[ params.index ] = params.channelItem?.uniqueId
			}
		}

		setPreviews(tmpPreview)
	}

	// 设置预设列表
	const handleSetVideoPreviewPreinstall = (item: VideoPreviewPreinstallItem): void => {
		const uniqueIds = item.previews.map(
			item => {
				const v = item.split('-')
				return v[ v.length - 1 ]
			}
		).filter(item => !isEmpty(item.trim()))
		if (uniqueIds.length <= 0) {
			return
		}

		void ChannelListApi({
			limit: uniqueIds.length,
			conditions: [ { column: 'uniqueId', values: uniqueIds } ]
		}).then(
			res => {
				const list = res.data?.list ?? []
				if (list.length <= 0) {
					return
				}

				setChannelSelected(topMap<CItem, string, CItem>(list, (item, map) => { map[ item.uniqueId ] = item }))
				setSplitStyle(item.splitStyle)
				setSelectedIndex(item.selectedIndex)
				setPreviews(
					item.previews.map(
						item => {
							const v = item.split('-')
							return v[ v.length - 1 ]
						}
					)
				)
			}
		)
	}

	// 选择通道
	const onSelectChannel = (item: CItem, clear: boolean): void => {
		if (hintError(1)) {
			return
		}

		let tmp: { [key: string]: CItem } = { ...channelSelected }
		if (clear) {
			tmp = mapFilter(tmp, k => k !== item.uniqueId)
		} else {
			tmp[ item.uniqueId ] = item
		}
		setChannelSelected(tmp)
		handleSetPreviews({
			splitStyle,
			index: selectedIndex,
			channelItem: item
		})
		if (!clear) {
			let index = selectedIndex + 1
			if (index >= splitStyle) {
				index = 0
			}

			setSelectedIndex(index)
		} else {
			setSelectedVideo(undefined)
		}
	}

	// 停止轮播
	const handleStopSlideVideos = (): void => {
		clearInterval(slideVideosIntervalRef.current as number)
		setSlideVideosIntervalState(false)
	}

	// 设置轮播弹窗
	const handleSlideVideos = (): void => {
		channelsPopup.set({
			...channelsPopupState,
			filterState: true,
			visible: true,
			title: <><span style={ { marginRight: 20 } }>选择轮巡播放通道:</span> <Icon className="i-4x" tap><IconCamera /></Icon></>,
			submit: ({ close, interval, channelItems }) => {
				const length = channelItems.length
				if (length <= 0) {
					MMessage({ message: '至少选择一个通道', type: MessageType.warning })
					return
				}

				const checkedChannelUniqueIds = channelItems.map(item => item.uniqueId)
				setChannelSelected(topMap<CItem>(channelItems as CItem[], (item, map) => { map[ item.uniqueId ] = item }))
				clearInterval(slideVideosIntervalRef.current as number)
				let index = 0
				const fn = (): void => {
					setSelectedVideo(undefined)
					const data = pickListWithIndex(checkedChannelUniqueIds, splitStyle, index)
					index = data.index
					// 设置显示视频
					let channelSelectIds = data.list
					const surplus = splitStyle - channelSelectIds.length
					if (surplus > 0) {
						channelSelectIds = [ ...channelSelectIds, ...Array(surplus).fill('') ]
					}

					setPreviews(Array(splitStyle).fill('').map((_, i) => channelSelectIds[ i ] ?? ''))
					if (splitStyle >= length) {
						setSlideVideosIntervalState(false)
						clearInterval(slideVideosIntervalRef.current as number)
					} else {
						setSlideVideosIntervalState(true)
					}
				}

				fn()
				slideVideosIntervalRef.current = setInterval(fn, interval * 1000)
				close?.()
			}
		})
	}

	const fetchChannels = (): void => {
		void ChannelListApi({ all: true, conditions: [ { column: 'depIds', value: '[]', operator: Operator.neq } ] }).then(
			res => {
				if (res.data === undefined) {
					return
				}

				const channelGroups: { [key: number]: CItem[] } = {}
				const records = res.data.list ?? []
				records.forEach(
					item => {
						item.depIds.forEach(
							v => {
								if (isEmpty(channelGroups[ v ])) {
									channelGroups[ v ] = []
								}

								channelGroups[ v ].push(item)
							}
						)
					}
				)

				for (const key in channelGroups) {
					channelGroups[ key ] = arrayUnique(channelGroups[ key ], item => item.uniqueId)
				}
				setChannelGroups(channelGroups)
			}
		)
	}

	const onRemove = (item: CItem, depId: number): void => {
		const channelUniqueId = item.uniqueId
		const depIds = item.depIds.filter(v => v !== depId)
		void ChannelUpdate<CItem>({
			conditions: [ { column: 'uniqueId', value: channelUniqueId } ],
			data: [ { column: 'depIds', value: depIds } ]
		}).then(fetchChannels)
	}

	const departmentItemHandleClick = (e: MenuInfo, record: MenuItem, checkedChannelUniqueIds: string[]): void => {
		e.domEvent.stopPropagation()
		channelsPopup.set({
			filterState: false,
			visible: true,
			checkedChannelUniqueIds,
			title: <><span>设置分组:</span> <Icon className="i-4x" tap><IconFolder1 /></Icon></>,
			submit: ({ close, cancelCheckedChannelItems, channelItems }) => {
				if (channelItems.length <= 0 && cancelCheckedChannelItems.length <= 0) {
					MMessage({ message: '至少设置或删除一个通道', type: MessageType.warning })
					return
				}

				const checkedChannelIds = channelItems.map(item => item.id)
				const cancelCheckedChannelIds = cancelCheckedChannelItems.map(item => item.id)
				const depIds = [ record?.key as number ]

				const deleteCall = (call?: () => void): void => {
					// 删除depIds
					void ChannelUpdate<CHItem>({
						conditions: [ { column: 'id', values: cancelCheckedChannelIds } ],
						data: [ { column: 'depIds', value: [] } ]
					}).then(
						() => {
							fetchChannels()
							call?.()
						}
					)
				}

				if (checkedChannelIds.length <= 0 && cancelCheckedChannelIds.length > 0) {
					deleteCall(
						() => {
							MMessage({ message: '设置成功', type: MessageType.success })
						}
					)
					return
				}

				void ChannelUpdate<CItem>({
					conditions: [ { column: 'id', values: checkedChannelIds } ],
					data: [ { column: 'depIds', value: depIds } ]
				}).then(
					() => {
						// 删除depIds
						if (cancelCheckedChannelIds.length > 0) {
							deleteCall(
								() => {
									MMessage({ message: '设置成功', type: MessageType.success })
								}
							)
						} else {
							MMessage({ message: '设置成功', type: MessageType.success })
							fetchChannels()
						}
					}
				).finally(close)
			}
		})
	}

	const departmentChannelHandleClick = (item: CItem): void => {
		onSelectChannel(item, inArray(Object.values(channelSelected), item, (v1, v2) => v1.uniqueId === v2.uniqueId))
	}

	const departmentItemRender: (data: DepartmentTreesRenderProps) => MenuItem = ({ record, defaultOpenKeys }): MenuItem => {
		if (record !== null) {
			const data = (record as any)
			data.icon = <Icon className="i-4x" tap>
				{ inArray(defaultOpenKeys, `${ record.key }`) ? <IconFolder1 /> : <IconFolder2 /> }
			</Icon>

			const depCheckedChannelUniqueIds: string[] = []
			Object.values(channelGroups).forEach(
				item => {
					item.forEach(
						val => {
							if (inArray(val.depIds, record.key)) {
								depCheckedChannelUniqueIds.push(ChannelListMakeUniqueId(val))
							}
						}
					)
				}
			)

			const menuItem: MenuProps = { items: [ { key: '1', label: '通道列表', onClick: e => { departmentItemHandleClick(e, record, depCheckedChannelUniqueIds) } } ] }
			data.label = Super >= 1 || inArray(permissions, 'P_1_4_2_1')
				? <Dropdown
					getPopupContainer={ ele => ele.parentElement?.parentElement?.parentElement ?? ele }
					menu={ menuItem }
					trigger={ [ 'contextMenu' ] }
					placement="bottomLeft"
				><span className="wh100 block">{ data.label }</span></Dropdown>
				: <span className="wh100 block">{ data.label }</span>

			// 显示通道
			if (!isEmpty(channelGroups[ data.key ])) {
				for (let i = 0; i < channelGroups[ data.key ].length; i++) {
					const item = channelGroups[ data.key ][ i ]
					if (item.depIds.length <= 0) {
						continue
					}

					const v: MenuItem = {
						key: item.uniqueId,
						label: Super >= 1 || inArray(permissions, 'P_1_4_2_1')
							? <Dropdown
								getPopupContainer={ ele => ele.parentElement?.parentElement?.parentElement ?? ele }
								menu={ { items: [ { key: '1', label: '移除', onClick: () => { onRemove(item, data.key as number) } } ] } }
								trigger={ [ 'contextMenu' ] }
								placement="bottomLeft"
							>
								<span className="department-channel" onClick={ () => { departmentChannelHandleClick(item) } }>{ item.name }</span>
							</Dropdown>
							: <span className="department-channel" onClick={ () => { departmentChannelHandleClick(item) } }>{ item.name }</span>,
						disabled: true,
						icon: <Icon className="i-3x" tap><IconCamera /></Icon>,
						className: `department-channel-line ${ inArray(previews, item.uniqueId) ? 'active' : '' }`
					}
					if (data.children !== undefined) {
						data.children.push(v)
					} else {
						data.children = [ v ]
					}
				}
			}

			return data
		}

		return record
	}

	const handleControlDragClick = useDoubleClick({
		timeout: 300,
		onDoubleClick: () => {
			setFsCtlVisible(true)
		}
	})

	const tracingMenu = (item: CItem, clear: boolean): void => {
		if (filterTab !== '0') {
			return
		}

		deviceMenusRef.current?.tracingChannel(item, clear)
	}

	const setVideoStreamRefCall = (key: string, item: VideoStreamResp): void => {
		videoStreamsRef.current[ key ] = item
	}

	useEffect(
		() => {
			if (Screen.isEnabled) {
				const handleChange = (): void => {
					setFullScreen(Screen.isFullscreen)
				}

				Screen.on('change', handleChange)

				return () => {
					clearInterval(slideVideosIntervalRef.current as number)
					Screen.off('change', handleChange)
				}
			}
		},
		[]
	)

	useEffect(fetchChannels, [])

	useEffect(
		() => {
			setSelectedVideo(undefined)
			previews.forEach(
				(item, index) => {
					if (index === selectedIndex) {
						if (item === '') return

						setSelectedVideo(videoStreamsRef.current[ item ])
					}
				}
			)
		},
		[ selectedIndex ]
	)

	return <div className="video-preview-container">
		<div className={ `filters ${ foldUpState ? 'sm' : '' }` }>
			<Tooltip title={ foldUpState ? '展开菜单' : '收起菜单' } arrow={ true }>
				<div className={ `fold-up ${ foldUpState ? 'sp' : '' }` } onClick={ menuFoldUp }>
					<Icon className={ `i-5x ${ foldUpState ? 'rotate-90' : 'rotate-270' }` } tap>
						<IconArrow1 />
					</Icon>
				</div>
			</Tooltip>
			<div className={ `filter-trees ${ foldUpState ? 'hidden' : '' }` }>
				{
					Super === 1 || allIncluded(permissions, [ 'P_1_4_1', 'P_1_4_2' ])
						? <>
							<Tabs
								className="filter-tabs"
								onChange={ onSwitchFilter }
								activeKey={ filterTab }
								items={
									[
										Super === 1 || inArray(permissions, 'P_1_4_1') ? { label: '设备列表', key: '0' } : undefined,
										Super === 1 || inArray(permissions, 'P_1_4_2') ? { label: '组织架构', key: '1' } : undefined
									].filter(
										item => item !== null
									) as any
								}
							/>
							{
								Super === 1 || inArray(permissions, 'P_1_4_1')
									? <DeviceMenus
										ref={ deviceMenusRef }
										className={ filterTab === '0' ? '' : 'hidden' }
										onSelected={ onSelectChannel }
										selectedChannelUniqueIds={ previews }
										afterSetDepartment={ fetchChannels }
										hideEmptyState={ true }
										useChannelUnique={ true }
										reloadMap={ item => { mapRef.current?.reloadMap({ channelItem: item }) } }
										pointComponent={
											pageType === 'maps' && isEmpty(variables.licenseError)
												? props => <SetChannelPoints { ...props } />
												: undefined
										}
										channelClick={
											pageType === 'maps'
												? item => {
													if (!isEmpty(variables.licenseError)) {
														return
													}

													mapRef.current?.location({ channelItem: item })
												}
												: undefined
										}
									/>
									: <></>
							}
							{
								Super === 1 || inArray(permissions, 'P_1_4_2')
									? <DepartmentTrees
										className={ `filter-trees-menu ${ filterTab === '1' ? '' : 'hidden' }` }
										itemRender={ departmentItemRender }
										inlineIndent={ 8 }
									/>
									: <></>
							}
						</>
						: <></>
				}
			</div>
		</div>
		{
			pageType === 'maps'
				? <Maps
					selectedVideo={ selectedVideo }
					setSelectedVideo={ setSelectedVideo }
					setVideoStreamRefCall={ setVideoStreamRefCall }
					foldUpState={ foldUpState }
					onSelectChannel={ onSelectChannel }
					eyeState={ eyeState }
					fsCtlVisible={ fsCtlVisible }
					setFsCtlVisible={ setFsCtlVisible }
					handleControlDragClick={ handleControlDragClick }
					tracingMenu={ tracingMenu }
					ref={ mapRef }
				/>
				: <VideoPreview
					fullScreen={ fullScreen }
					selectedVideo={ selectedVideo }
					fsCtlVisible={ fsCtlVisible }
					setFsCtlVisible={ setFsCtlVisible }
					handleControlDragClick={ handleControlDragClick }
					splitStyle={ splitStyle }
					previews={ previews }
					handleSetVideoPreviewPreinstall={ handleSetVideoPreviewPreinstall }
					selectedIndex={ selectedIndex }
					setSelectedIndex={ setSelectedIndex }
					onSelectChannel={ onSelectChannel }
					channelSelected={ channelSelected }
					eyeState={ eyeState }
					setEyeState={ setEyeState }
					slideVideosIntervalState={ slideVideosIntervalState }
					handleStopSlideVideos={ handleStopSlideVideos }
					handleSlideVideos={ handleSlideVideos }
					onSetSplitStyle={ onSetSplitStyle }
					clear={ clear }
					setVideoStreamRefCall={ setVideoStreamRefCall }
				/>
		}
	</div>
}

export default Main