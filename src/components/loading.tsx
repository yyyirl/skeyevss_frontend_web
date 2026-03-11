import React, { type CSSProperties } from 'react'
import { Spin } from 'antd'

export enum LoadingType {
	bottom,
	animate,
	inner
}

export enum SpinSizes {
	small = 'small',
	default = 'default',
	large = 'large'
}

interface PropsType {
	type?: LoadingType
	className?: string
	finish?: boolean
	size?: SpinSizes
	style?: CSSProperties
	tip?: string
}

const Main: React.FC<PropsType> = (
	{
		type,
		className,
		finish,
		size = SpinSizes.large,
		style,
		tip
	}
) => {
	switch (type) {
		case LoadingType.bottom:
			return <div className={ `loading-bottom font-center ${ className ?? '' }` }>
				{ finish !== undefined && finish ? '到底了~' : <Spin size={ size }/> }
			</div>

		case LoadingType.animate:
			return <div
				className="mask-layer font-center"
				style={ { backgroundColor: 'rgba(0, 0, 0, .9)', zIndex: 100 } }
			><div className="loader-box"><i className="loader --1"/></div></div>

		case LoadingType.inner:
			return <Spin size={ size } tip={ tip } className={ className ?? '' } />

		default:
			return <div
				className={ `mask-layer pos0 ${ className ?? '' }` }
				style={ style }
			><Spin size={ size } tip={ tip } /></div>
	}
}

export default Main
