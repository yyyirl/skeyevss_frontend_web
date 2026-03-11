import React, { useEffect, useRef } from 'react'
import mapStyleConfig from '#assets/json/baidu-map-style-config.json'

interface Props {
	points?: {
		lng: number
		lat: number
	}
	zoom?: number
	minZoom?: number
	maxZoom?: number
	// 设置地图的倾斜角度
	tilt?: number
}

const Main: React.FC<Props> = props => {
	const mapInstance = useRef<any>(null)
	const initCounter = useRef(0)
	const interval = useRef(0)
	const initMap = (): void => {
		initCounter.current += 1
		if (initCounter.current >= 5) {
			console.error('百度地图API未加载成功')
			return
		}

		if (window.BMapGL === null || window.BMapGL === undefined) {
			return
		}

		// 创建地图实例
		mapInstance.current = new window.BMapGL.Map('pageCompMapContainer')
		// 初始化地图，设置中心点坐标和地图级别
		mapInstance.current.centerAndZoom(
			new window.BMapGL.Point(
				props.points?.lng ?? 103.99104,
				props.points?.lat ?? 30.627748
			),
			props.zoom ?? 10
		)
		// 开启鼠标滚轮缩放
		mapInstance.current.enableScrollWheelZoom(true)
		if (props.minZoom !== undefined) {
			mapInstance.current.setMinZoom(props.minZoom)
		}

		if (props.maxZoom !== undefined) {
			mapInstance.current.setMinZoom(props.maxZoom)
		}

		if (props.tilt !== undefined) {
			mapInstance.current.setTilt(props.tilt)
		}
		mapInstance.current.setMapStyleV2({ styleJson: mapStyleConfig })
		mapInstance.current.setDisplayOptions({
			skyColors: [ 'rgba(0, 0, 0, 0)' ]
		})
	}

	useEffect(() => {
		if (window.BMapGL === null || window.BMapGL === undefined) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			interval.current = setInterval(initMap, 500)
			return
		}

		initMap()
		return () => {
			clearInterval(interval.current)
		}
	}, [])

	return <div id="pageCompMapContainer" style={ { width: '100%', height: '100%' } } />
}

export default Main