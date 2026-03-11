import React, { useEffect } from 'react'
import { Divider, Flex, Select, Switch, Tag, Tooltip } from 'antd'
import type { OptionItem } from '#types/base.d'
import { type ExpandableProps } from '#types/ant.table.d'
import { extractUrlComponents, isEmpty, timestampFormat } from '#utils/functions'
import { hintError1 } from '#utils/err-hint'
import { smsIPDef, variables } from '#constants/appoint'
import useFetchState from '#repositories/models'
import { DeviceDiagnose, Setting, VideoPopup, type VideoSaveParams } from '#repositories/models/recoil-state'
import { Base64FileUpload, FileUpload, StopVideoStream } from '#repositories/apis/base'
import { RangeDate, VideoItem } from '#repositories/types/foundation'
import { ReactComponent as IconEdit } from '#assets/svg/edit.svg'
import { ReactComponent as IconDelete } from '#assets/svg/delete.svg'
import { ReactComponent as IconPlay } from '#assets/svg/play.svg'
import { ReactComponent as IconStop } from '#assets/svg/stop.svg'
import { ReactComponent as IconVideo } from '#assets/svg/video.svg'
import { ReactComponent as IconVideo1 } from '#assets/svg/video-1.svg'
import { ReactComponent as IconDiagnose } from '#assets/svg/diagnose.svg'
import { ReactComponent as IconOnline } from '#assets/svg/online.svg'
import { ReactComponent as IconOffline } from '#assets/svg/offline.svg'
import { ReactComponent as IconLoading } from '#assets/svg/loading.svg'
import { PopupKey, toSelectOptionType } from '#components/table/model'
import Icon from '#components/icon'
import { MessageType, MMessage } from '#components/hint'
import { AutoFitImage } from '#components/image'
import Copy from '#components/copy'
import type { Item as MSItem } from '#pages/configs/media-server/model'
import { type ColumnParams, type Item, streamNameProduce } from './model'

type CardProps = ExpandableProps<Item> & ColumnParams & {
	cType: 'card' | 'table'
	mediaServers: OptionItem[]
	deviceOnlineState: { [key: string]: 0 | 1 }
	accessProtocolMaps: { [key: number]: OptionItem }
}

interface SubmitParams {
	column: keyof Item
	value: any
	setLoadings: (data: { [ key: string ]: boolean }) => void
	loadings: { [ key: string ]: boolean }
}

const submit = (props: SubmitParams & CardProps): void => {
	if (props.update !== undefined) {
		props.setLoadings({ ...props.loadings, [ props.column ]: true })
		void props.update<Item>({
			conditions: [ { column: props.record.primaryKeyColumn(), value: props.record.primaryKeyValue() } ],
			data: [ { column: props.column, value: props.value } ]
		}).then(
			() => {
				// 更新列表
				MMessage({
					message: '更新成功',
					type: MessageType.success
				})
				// 设置列表
				if (props.records !== undefined && props.records !== null) {
					switch (props.column) {
						case 'ptzType':
							props.record.ptzType = props.value
							break
						case 'onDemandLiveState':
							props.record.onDemandLiveState = props.value
							break
						case 'audioState':
							props.record.audioState = props.value
							break
						case 'transCodedState':
							props.record.transCodedState = props.value
							break
						case 'online':
							props.record.online = props.value
							break
						case 'screenshots':
							props.record.screenshots = props.value
							break
						case 'videos':
							props.record.videos = props.value
							break
					}

					props.setRecords?.([
						...props.records.map(
							item => {
								if (item.primaryKeyValue() === props.record.primaryKeyValue()) {
									return props.record
								}

								return item
							}
						)
					])
				}
			}
		).finally(
			() => {
				props.setLoadings({ ...props.loadings, [ props.column ]: false })
			}
		)
	}
}

export const CardItem: React.FC<CardProps> = props => {
	const setting = new Setting()
	const mediaServerRes = extractUrlComponents(setting.shared().msUrl)

	const [ smsIP, setSmsIP ] = useFetchState('')

	useEffect(
		() => {
			const msIds = props.record.deviceItem?.msIds ?? []
			if (props.mediaServers.length <= 0 || msIds.length <= 0) {
				return
			}

			for (let i = 0; i < props.mediaServers.length; i++) {
				const item = props.mediaServers[ i ].raw as MSItem
				for (let j = 0; j < msIds.length; j++) {
					const id = msIds[ j ]
					if (id === 0) {
						setSmsIP(smsIPDef)
						continue
					}
					if (id === item.id) {
						setSmsIP(`${ item.ip }:${ item.port }`)
						return
					}
				}
			}
		},
		[ props.mediaServers, props.record.deviceItem ]
	)

	const address = (smsIP: string): string => {
		let host = `${ mediaServerRes?.hostname }:${ setting.state?.rtmpPort }`
		if (smsIP !== '' && smsIP !== smsIPDef) {
			host = smsIP
		}
		return `rtmp://${ host }/live/${ streamNameProduce(props.record.deviceUniqueId, props.record.uniqueId, 'play') }`
	}

	return <div className="channel-card-item">
		<div className="snapshot">
			<AutoFitImage preview={ true } reloadInterval={ 8 } src={ props.record.snapshot } proxy={ true } />
		</div>
		<p className="title">{ props.record.name }</p>
		{
			props.record.deviceItem?.accessProtocol === 2
				? <p className="id">
					<span className="t">接入地址:</span>
					<Copy text={ address(smsIP) }><span className="blue">{ address(smsIP) }</span></Copy>
				</p>
				: <></>
		}
		<div className="l-1">
			<div className="l-item">
				<p className="id">
					<span className="t">设备ID:</span>
					<Copy text={ props.record.deviceUniqueId }><span className="blue">{ props.record.deviceUniqueId }</span></Copy>
				</p>
				<p className="id">
					<span className="t">通道ID:</span>
					<Copy text={ props.record.uniqueId }><span className="blue">{ props.record.uniqueId }</span></Copy>
				</p>
				<p className="createdAt">
					创建时间: { timestampFormat(props.record.createdAt) }
					<span style={ { padding: 5 } } />
					{
						props.record.longitude !== 0 && props.record.latitude !== 0
							? <>
								<Tooltip title="经度" arrow={ true }>
									<Tag color="gold">longitude { props.record.longitude }</Tag>
								</Tooltip>
								<Tooltip title="纬度" arrow={ true }>
									<Tag color="lime">latitude: { props.record.latitude }</Tag>
								</Tooltip>
							</>
							: <></>
					}
				</p>
				{
					props.record.deviceItem?.accessProtocol !== undefined && !isEmpty(props.accessProtocolMaps[ props.record.deviceItem?.accessProtocol ])
						? <p className="id">
							<span className="t">协议:</span>
							{ props.accessProtocolMaps[ props.record.deviceItem?.accessProtocol ].title }
						</p>
						: <></>
				}
			</div>
		</div>
		<Divider />
		<Controls { ...props } />
	</div>
}

export const Controls: React.FC<CardProps> = props => {
	const instance = new DeviceDiagnose()
	const [ loadings, setLoadings ] = useFetchState<{ [ key: string ]: boolean }>({
		ptzType: false,
		onDemandLiveState: false,
		audioState: false,
		transCodedState: false,
		online: false,
		stopStreamState: false
	})

	const videoPopup = new VideoPopup()
	// const videosPopupData = new VideosPopupData()

	const screenshot = (data?: string): void => {
		void Base64FileUpload(data ?? '').then(
			res => {
				submit({ ...props, loadings, setLoadings, column: 'screenshots', value: [ ...props.record.screenshots, res.data ] })
			}
		)
	}

	const videoSave = (params: VideoSaveParams): void => {
		if (params.blob === undefined || isEmpty(params.blob)) {
			MMessage({
				message: '视频保存失败',
				type: MessageType.warning
			})
			return
		}

		const fileReader = new FileReader()
		fileReader.onerror = () => {
			MMessage({
				message: '视频文件读取失败',
				type: MessageType.warning
			})
		}

		fileReader.readAsArrayBuffer(params.blob)
		fileReader.onload = async() => {
			void FileUpload({
				file: fileReader.result,
				filename: params.filename
			}).then(
				res => {
					submit({
						...props,
						loadings,
						setLoadings,
						column: 'videos',
						value: [
							...props.record.videos,
							new VideoItem({
								date: new RangeDate({
									start: params.startAt,
									end: params.endAt
								}),
								path: res.data
							})
						]
					})
				}
			)
		}
	}

	return <div className={ `controls ${ props.cType === 'card' ? 's' : '' }` }>
		{
			props.cType === 'card'
				? <Flex gap="4px 0" wrap>
					<Select
						loading={ loadings.ptzType }
						className="item-1"
						value={ props.record.ptzType }
						placeholder="接入协议"
						options={ toSelectOptionType(props.ptzTypeOptions ?? []) }
						onChange={ value => { submit({ ...props, loadings, setLoadings, column: 'ptzType', value }) } }
						variant="borderless"
						style={ { width: 100 } }
						disabled={ variables.licenseError !== undefined || variables.showcase === true }
					/>
					<div className="item-2">
						<span>转码</span>
						<Switch
							loading={ loadings.transCodedState }
							value={ props.record.transCodedState === 1 }
							onChange={ value => { submit({ ...props, loadings, setLoadings, column: 'transCodedState', value: value ? 1 : 0 }) } }
							disabled={ variables.licenseError !== undefined || variables.showcase === true }
						/>
					</div>
				</Flex>
				: <></>
		}
		{
			props.cType !== 'card' && props.record.deviceItem?.accessProtocol !== undefined && !isEmpty(props.accessProtocolMaps[ props.record.deviceItem?.accessProtocol ])
				? <span className="item-title">{ props.accessProtocolMaps[ props.record.deviceItem?.accessProtocol ].title }</span>
				: <></>
		}
		{
			variables.licenseError !== undefined
				? <>
					{
						props.record.streamState > 0
							? <Tooltip title={ `停止流(${ hintError1() })` } arrow={ true }>
								{
									loadings.stopStreamState
										? <span className="item s rotating-ele"><Icon className="i-4ax"><IconLoading /></Icon></span>
										: <span className="item"><Icon className="i-4ax" tap><IconStop /></Icon></span>
								}
							</Tooltip>
							: <></>
					}
					{
						!loadings.stopStreamState
							? <Tooltip title={ `实时视频(${ hintError1() })` } arrow={ true }>
								<span className="item"><Icon className="i-4ax" tap><IconPlay /></Icon></span>
							</Tooltip>
							: <></>
					}
					<Tooltip title={ `服务录像(${ hintError1() })` } arrow={ true }>
						<span className="item"><Icon className="i-4ax" tap><IconVideo /></Icon></span>
					</Tooltip>
					<Tooltip title={ props.deviceOnlineState?.[ `${ props.record.deviceUniqueId }-${ props.record.uniqueId }` ] === 1 ? '在线' : '离线' } arrow={ true }>
						<span className="item">
							<Icon className="i-3x online-state">
								{
									props.deviceOnlineState?.[ `${ props.record.deviceUniqueId }-${ props.record.uniqueId }` ] === 1
										? <IconOnline />
										: <IconOffline />
								}
							</Icon>
						</span>
					</Tooltip>
					<Tooltip title={ `诊断(${ hintError1() })` } arrow={ true }>
						<span className="item"><Icon className="i-5x" tap><IconDiagnose /></Icon></span>
					</Tooltip>
					<Tooltip title={ `设备录像(${ hintError1() })` } arrow={ true }>
						<span className="item"><Icon className="i-4ax" tap><IconVideo1 /></Icon></span>
					</Tooltip>
					{
						props.cType === 'card'
							? <>
								<Tooltip title={ `编辑(${ hintError1() })` } arrow={ true }>
									<span className="item"><Icon className="i-4ax" tap><IconEdit /></Icon></span>
								</Tooltip>
								{
									props.record?.hiddenDelete?.()
										? <></>
										: <Tooltip title={ `删除(${ hintError1() })` } arrow={ true }>
											<span className="item">
												<Icon className="i-4ax" tap><IconDelete /></Icon>
											</span>
										</Tooltip>
								}
							</>
							: <></>
					}
				</>
				: <>
					{
						props.record.streamState > 0
							? <Tooltip title={ props.record.recordingState === 0 ? '停止流' : '正在录像中无法停止' } arrow={ true }>
								{
									loadings.stopStreamState
										? <span className="item s rotating-ele"><Icon className="i-4ax"><IconLoading /></Icon></span>
										: <span
											className={ `item ${ props.record.recordingState === 0 ? 'cursor-pointer' : 'cursor-disabled' }` }
											onClick={
												() => {
													if (props.record.recordingState > 0) {
														return
													}

													setLoadings({ ...loadings, stopStreamState: true })
													void StopVideoStream(streamNameProduce(props.record.deviceUniqueId, props.record.uniqueId, 'play'), props.record.streamMSId ?? 0).then(
														() => {
															setTimeout(
																() => {
																	props.setRecords?.([
																		...props.records.map(
																			item => {
																				if (item.primaryKeyValue() === props.record.primaryKeyValue()) {
																					item.streamState = 0
																					item.streamMSId = 0
																					return props.record
																				}

																				return item
																			}
																		)
																	])
																	setLoadings({ ...loadings, stopStreamState: false })
																},
																1000
															)
														}
													)
												}
											}
										><Icon className="i-4ax" tap={ props.record.recordingState === 0 ? true : undefined }><IconStop /></Icon></span>
								}
							</Tooltip>
							: <></>
					}
					{
						!loadings.stopStreamState
							? <Tooltip title="实时视频" arrow={ true }>
								<span
									className="item cursor-pointer"
									onClick={
										() => {
											videoPopup.set({
												visible: true,
												deviceUniqueId: props.record.deviceUniqueId,
												channelUniqueId: props.record.uniqueId,
												screenshot,
												videoSave,
												setChannelRecord: ({ streamState, streamMSId }) => {
													props.setRecords?.([
														...props.records.map(
															item => {
																if (item.primaryKeyValue() === props.record.primaryKeyValue()) {
																	item.streamState = streamState
																	item.streamMSId = streamMSId
																	return props.record
																}

																return item
															}
														)
													])
												}
											})
										}
									}
								><Icon className="i-4ax" tap><IconPlay /></Icon></span>
							</Tooltip>
							: <></>
					}
					<Tooltip title={ props.deviceOnlineState?.[ `${ props.record.deviceUniqueId }-${ props.record.uniqueId }` ] === 1 ? '在线' : '离线' } arrow={ true }>
						<span className="item">
							<Icon className="i-3x online-state">
								{
									props.deviceOnlineState?.[ `${ props.record.deviceUniqueId }-${ props.record.uniqueId }` ] === 1
										? <IconOnline />
										: <IconOffline />
								}
							</Icon>
						</span>
					</Tooltip>
					<Tooltip title="诊断" arrow={ true }>
						<span
							className="item cursor-pointer"
							onClick={ () => { instance.set({ visible: true, channelUniqueId: props.record.uniqueId, deviceUniqueId: props.record.deviceUniqueId }) } }
						><Icon className="i-5x" tap><IconDiagnose /></Icon></span>
					</Tooltip>
					{
						props.cType === 'card'
							? <>
								<Tooltip title="编辑" arrow={ true }>
									<span
										className="item cursor-pointer"
										onClick={
											() => {
												props.setSelectedRow(props.record)
												props.setPopupVisible({ ...props.popupVisible, [ PopupKey.update ]: true })
											}
										}
									><Icon className="i-4ax" tap><IconEdit /></Icon></span>
								</Tooltip>
								{
									props.record?.hiddenDelete?.()
										? <></>
										: <Tooltip title="删除" arrow={ true }>
											<span className="item cursor-pointer" onClick={ () => { props.deleteRow() } }>
												<Icon className="i-4ax" tap><IconDelete /></Icon>
											</span>
										</Tooltip>
								}
							</>
							: <></>
					}
				</>
		}
	</div>
}
