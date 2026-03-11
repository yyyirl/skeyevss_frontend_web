import React, { type FC, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import { type VideoStreamResp } from '#repositories/models/recoil-state'
import { ReactComponent as IconControl } from '#assets/svg/control.svg'
import Icon from '#components/icon'
import { Controls } from '#components/video/controls'
import DraggableAdhesive from '#components/draggable-adhesive'

interface Props {
	selectedVideo?: VideoStreamResp
	fsCtlVisible: boolean
	setFsCtlVisible: (visible: boolean) => void
	handleControlDragClick: (event: React.MouseEvent) => void
}

const Main: FC<Props> = props => {
	const {
		selectedVideo,
		fsCtlVisible,
		setFsCtlVisible,
		handleControlDragClick
	} = props
	const dragExtRef = useRef<HTMLDivElement | null>(null)

	return selectedVideo === undefined
		? <></>
		: <DraggableAdhesive
			containerId="videos"
			init={ () => { setFsCtlVisible(false) } }
			extStyle={
				style => {
					if (dragExtRef.current === null) return
					dragExtRef.current.removeAttribute('style')
					for (const k in style) {
						dragExtRef.current.style[ k as any ] = style[ k ]
					}
				}
			}
		>
			<div className="control" onClick={ handleControlDragClick }>
				<Icon className="i-4ax" tap><IconControl /></Icon>
				<div
					className={ `video-device-controls fs ${ fsCtlVisible ? '' : 'hidden' }` }
					ref={ dragExtRef }
					onMouseDown={
						e => {
							e.stopPropagation()
							e.preventDefault()
						}
					}
					onMouseUp={
						e => {
							e.stopPropagation()
							e.preventDefault()
						}
					}
				>
					<Controls
						deviceUniqueId={ selectedVideo.deviceID }
						channelUniqueId={ selectedVideo.channelID }
						streamItem={ () => selectedVideo }
					/>
				</div>
			</div>
		</DraggableAdhesive>
}

export default Main