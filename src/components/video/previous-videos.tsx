import React, { type ReactElement, useEffect, useRef } from 'react'
import ReactPlayer from 'react-player'
import { Button, Carousel } from 'antd'
import type { PopupItemContentParamsType } from '#types/ant.form.d'
import { timestampFormat } from '#utils/functions'
import { type VideoItem } from '#repositories/types/foundation'
import { Setting } from '#repositories/models/recoil-state'

const Main = (props: PopupItemContentParamsType<any> & {
	videos: VideoItem[]
	index: number
	useOriginal?: boolean
	autoPlay?: boolean
}): ReactElement => {
	const setting = new Setting()
	const carouselRef = useRef<any>(null)

	useEffect(
		() => {
			if (carouselRef.current !== null) {
				carouselRef.current.goTo(props.index)
			}
		},
		[ props.index ]
	)

	return <div className="items">
		{
			props.videos.length > 1
				? <Carousel draggable={ true } arrows={ true } dots={ { className: 'dots' } } fade={ true } ref={ carouselRef }>
					{
						props.videos.map(
							(item, key) => <div className="item" key={ key }>
								{
									item.date.start <= 0 || item.date.end <= 0
										? <></>
										: <div className="title">
											{ timestampFormat(item.date.start) } - { timestampFormat(item.date.end) }
										</div>
								}
								<ReactPlayer
									className="video-player"
									controls={ true }
									autoPlay={ props.autoPlay ?? false }
									src={
										props.useOriginal === true
											? `${ item.path.replace(/^\//, '') }`
											: `${ setting.state[ 'proxy-file-url' ] }/${ item.path.replace(/^\//, '') }`
									}
								/>
							</div>
						)
					}
				</Carousel>
				: <ReactPlayer
					className="video-player"
					controls={ true }
					autoPlay={ props.autoPlay ?? false }
					src={
						props.useOriginal === true
							? `${ props.videos[ 0 ].path.replace(/^\//, '') }`
							: `${ setting.state[ 'proxy-file-url' ] }/${ props.videos[ 0 ].path.replace(/^\//, '') }`
					}
				/>
		}
		<div className="footer">
			<Button htmlType="button" onClick={ props.close } style={ { marginRight: 20 } }>关闭</Button>
		</div>
	</div>
}

export default Main
