import React, { type CSSProperties } from 'react'
import ReactEcharts from 'echarts-for-react'
import { type EChartsOption } from 'echarts-for-react/src/types'

interface Props {
	ref?: any
	style?: CSSProperties
	className?: string
	options: EChartsOption
}

const Main: React.FC<Props> = props => {
	return <ReactEcharts
		ref={ props.ref }
		style={ props.style }
		className={ props.className }
		option={ props.options }
	/>
}

export default Main