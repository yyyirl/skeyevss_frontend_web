import React, { useEffect, type FC, useRef, type ReactElement, useImperativeHandle, forwardRef } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L, { type PopupEvent } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { arrayUnique, isEmpty, throttle, uniqueId } from '#utils/functions'
import { Setting, type VideoStreamResp } from '#repositories/models/recoil-state'
import useFetchState from '#repositories/models'
import { Operator } from '#repositories/types/request'
import { defPapTiles, type MapTiles } from '#repositories/types/config'
import IconCamera from '#assets/svg/camera.svg'
import IconPos from '#assets/svg/pos.svg'
import CVideoBox from '#components/video'
import Loading, { LoadingType, SpinSizes } from '#components/loading'
import { DirectTianDiTuLayer, MapClickHandler, MapPointController, type MapPointControllerProps, MapSizeUpdater } from '#components/sundry'
import { type Item as CItem, Item as CVItem } from '#pages/devices/channels/model'
import { type Item as DItem, Item as DVItem } from '#pages/devices/items/model'
import { List as ChannelListApi } from '#pages/devices/channels/api'
import ControlWidget from './control-widget'
import { defMapCenterPoints } from '#constants/appoint'

export interface MapMarker {
	id: string | number
	position: [number, number] // [lat, lng]
	title: string
	icon?: string
	data?: any
	channelItem: CItem
	isCenter?: boolean
}

interface Props {
	foldUpState: boolean
	selectedVideo?: VideoStreamResp
	setSelectedVideo?: (v: VideoStreamResp) => void
	fsCtlVisible: boolean
	setFsCtlVisible: (visible: boolean) => void
	handleControlDragClick: (event: React.MouseEvent) => void
	setVideoStreamRefCall: (key: string, item: VideoStreamResp) => void
	onSelectChannel: (item: CItem, clear: boolean) => void
	eyeState: boolean
	tracingMenu: (item: CItem, clear: boolean) => void
}

const MapDevicePopup: FC<Props & { item: MapMarker }> = props => <div className="map-marker-popup">
	{
		props.selectedVideo !== undefined && (new DVItem({ accessProtocol: props.selectedVideo.accessProtocol })).controlState()
			? <ControlWidget
				selectedVideo={ props.selectedVideo }
				fsCtlVisible={ props.fsCtlVisible }
				setFsCtlVisible={ props.setFsCtlVisible }
				handleControlDragClick={ props.handleControlDragClick }
			/>
			: <></>
	}
	<div className="title">
		<p>通道名称: { !isEmpty(props.item.channelItem.label) ? props.item.channelItem.label : props.item.channelItem.name } 设备名称: { !isEmpty(props.item.channelItem.deviceItem?.label) ? props.item.channelItem.deviceItem?.label : props.item.channelItem.deviceItem?.name }</p>
		<p>设备id: { props.item.channelItem.deviceUniqueId }, 通道id: { props.item.channelItem.uniqueId }</p>
	</div>
	<CVideoBox
		visible={ true }
		showInnerControl={ true }
		inner={ true }
		deviceUniqueId={ props.item.channelItem.deviceUniqueId }
		channelUniqueId={ props.item.channelItem.uniqueId }
		showDescription={ props.eyeState }
		videoStream={
			v => {
				props.setVideoStreamRefCall(props.item.channelItem.uniqueId, v)
				props.setSelectedVideo?.(v)
			}
		}
	/>
</div>

export interface MapRef {
	reloadMap: (props: { channelItem: CItem }) => void
	location: (props: { channelItem: CItem }) => void
}

const CMarker = (props: { mItem: MapMarker, call: (ref: any) => void } & Props): ReactElement => {
	const { mItem, call } = props
	const ref = useRef<any>(null)
	// 解决二次打开不显示控制按钮
	const [ uniqueKey, setUniqueKey ] = useFetchState(uniqueId())
	const popupclose = (_: PopupEvent): void => {
		setUniqueKey(uniqueId())
		props.tracingMenu(props.mItem.channelItem, true)
	}

	useEffect(
		() => {
			call(ref.current)
		},
		[ ref.current ]
	)

	return <Marker
		key={ mItem.id }
		position={ mItem.position }
		title={ mItem.title }
		ref={ ref }
		icon={
			mItem.isCenter === true
				? L.divIcon({
					html: `<div class="map-marker center"><img src="${ IconPos }" alt=""></div>`,
					className: 'text-marker-icon',
					iconAnchor: [ 50, 20 ],
					popupAnchor: [ 0, -20 ]
				})
				: L.divIcon({
					html: `<div class="map-marker"><img src="${ IconCamera }" alt=""><span>${ mItem.title }</span></div>`,
					className: 'text-marker-icon',
					iconAnchor: [ 50, 20 ],
					popupAnchor: [ 0, -20 ]
				})
		}
		eventHandlers={ { click: () => { props.tracingMenu(props.mItem.channelItem, false) }, popupclose } }
	>
		<Popup maxWidth={ 700 } maxHeight={ 500 } key={ uniqueKey }>
			{ mItem.isCenter === true ? <div>中心点</div> : <MapDevicePopup item={ mItem } { ...props } /> }
		</Popup>
	</Marker>
}

const Main = (props: Props, ref: React.Ref<MapRef>): ReactElement => {
	const setting = new Setting()
	const settingState = setting.shared()

	// 地图地址
	// 离线地图URL格式：{z}/{x}/{y}.png '/tiles/{z}/{x}/{y}.png'
	const proxyFileUrl = settingState?.[ 'proxy-file-url' ] ?? ''
	const tmapKey = settingState?.[ 'tmap-key' ] ?? ''
	const mapTilesTmp = settingState?.setting?.mapTiles ?? ''
	const [ mapCenterPoints, setMapCenterPoints ] = useFetchState(
		isEmpty(settingState?.setting?.mapCenterPoints)
			? defMapCenterPoints
			: (settingState?.setting?.mapCenterPoints ?? '').split(',').map(item => parseFloat(item)) as [ number, number ]
	)
	const defCenterPoint = {
		channelItem: new CVItem({}),
		isCenter: true,
		id: 'center',
		position: mapCenterPoints,
		title: '中心点'
	} satisfies MapMarker

	const markersRef = useRef<MapMarker[]>([])
	const marksRef = useRef<{ [ key: string ]: any }>({})

	const [ mapTiles, setMapTiles ] = useFetchState<MapTiles>(defPapTiles)
	const [ markers, setMarkers ] = useFetchState<MapMarker[]>([])
	const [ loading, setLoading ] = useFetchState(true)
	const [ mapComplete, setMapComplete ] = useFetchState(false)
	const [ mapPointController, setMapPointController ] = useFetchState<MapPointControllerProps>({})

	const loadChannels = (): void => {
		void ChannelListApi({
			all: true,
			conditions: [
				{
					column: 'latitude',
					value: 0,
					operator: Operator.gt
				},
				{
					column: 'longitude',
					value: 0,
					operator: Operator.gt
				}
			]
		}).then(
			res => {
				if (res.data?.list === undefined) {
					return
				}

				const devices: { [ key: string ]: DItem } = res.data.maps ?? {}
				markersRef.current = arrayUnique(
					[
						...markersRef.current.filter(item => item.isCenter !== true),
						...res.data.list.map(
							item => {
								item.deviceItem = devices[ item.deviceUniqueId ]
								return {
									channelItem: item,
									id: item.uniqueId,
									position: [ item.latitude, item.longitude ],
									title: item.name
								} satisfies MapMarker
							}
						)
					],
					item => item.id as string
				)
				setMarkers(markersRef.current)
			}
		).finally(
			() => {
				setLoading(false)
			}
		)
	}

	const reloadMap = (params: { channelItem: CItem }): void => {
		markersRef.current = [ defCenterPoint ]
		setMarkers(markersRef.current)
		setMapPointController({
			center: [ params.channelItem.latitude, params.channelItem.longitude ],
			zoom: 10
		})
		loadChannels()
	}

	const location = (params: { channelItem: CItem }): void => {
		setMapPointController({
			center: [ params.channelItem.latitude, params.channelItem.longitude ],
			zoom: 10
		} satisfies MapPointControllerProps)

		markers.forEach(
			item => {
				if (params.channelItem.latitude === item.position[ 0 ] && params.channelItem.longitude === item.position[ 1 ]) {
					marksRef.current[ item.id ].openPopup()
				}
			}
		)
	}

	useImperativeHandle(
		ref, () => ({
			reloadMap,
			location
		}),
		[ reloadMap ]
	)

	useEffect(loadChannels, [])

	useEffect(
		() => {
			setMapCenterPoints(
				isEmpty(settingState?.setting?.mapCenterPoints)
					? defMapCenterPoints
					: (settingState?.setting?.mapCenterPoints ?? '').split(',').map(item => parseFloat(item)) as [ number, number ]
			)
		},
		[ settingState?.setting?.mapCenterPoints ]
	)

	useEffect(
		() => {
			throttle(
				() => {
					markersRef.current = arrayUnique(
						[
							...markersRef.current.filter(item => item.isCenter !== true),
							defCenterPoint
						],
						item => item.id as string
					)
					setMarkers(markersRef.current)
				},
				500,
				'map-center-points'
			)
		},
		[ mapCenterPoints ]
	)

	useEffect(
		() => {
			// 默认在线地图
			let mapTiles = defPapTiles
			if (!isEmpty(mapTilesTmp)) {
				// 本地天地图
				mapTiles = { type: 0, url: `${ proxyFileUrl }/${ mapTilesTmp }/{z}/{x}/{y}.png`, key: '' }
			} else {
				// 在线天地图
				if (!isEmpty(tmapKey)) {
					mapTiles = { type: 1, url: '', key: tmapKey }
				}
			}

			setMapTiles(mapTiles)
			setMapComplete(true)
		},
		[ proxyFileUrl, mapTilesTmp, tmapKey ]
	)

	return <div className="map relative">
		{ loading ? <div className="c-loading"><Loading size={ SpinSizes.default } type={ LoadingType.inner } /><p>设备加载中...</p></div> : <></> }
		{
			mapComplete
				? <MapContainer
					center={ mapCenterPoints }
					zoom={ settingState?.setting?.mapZoom ?? 6 }
					scrollWheelZoom={ true }
					zoomControl={ true }
					dragging={ true }
					className="wh100"
				>
					{ mapTiles.type === 2 || mapTiles.type === 0 ? <TileLayer url={ mapTiles.url } /> : <></> }
					{ mapTiles.type === 1 ? <DirectTianDiTuLayer type="vec" apiKey={ mapTiles.key } showAnnotation={ true } /> : <></> }
					<MapClickHandler />
					<MapPointController { ...mapPointController } />
					<MapSizeUpdater foldUpState={ props.foldUpState } />
					{
						markers.map(
							item => <CMarker
								{ ...props }
								key={ item.id }
								mItem={ item }
								call={ v => { marksRef.current[ item.id as string ] = v } }
							/>
						)
					}
				</MapContainer>
				: <></>
		}
	</div>
}

const Maps = forwardRef(Main) as (props: Props & { ref?: React.Ref<MapRef> }) => ReactElement
(Maps as any).displayName = 'Maps'

export default Maps
