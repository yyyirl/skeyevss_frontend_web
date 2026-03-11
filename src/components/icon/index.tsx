import React, { useEffect, useRef } from 'react'
import { type CSSStyle } from '#repositories/types/foundation'
import { isEmpty } from '#utils/functions'
import { Space } from 'antd'

interface IconProps {
	children: React.ReactElement
	className?: string
	color?: string
	tap?: boolean
	onClick?: (event: React.MouseEvent<HTMLElement>) => void
	transformColor?: string
}

interface IconTextProps {
	icon: React.ReactElement
	text: any
	className?: string
}

export const IconText = ({ icon, text, className }: IconTextProps): React.ReactElement => <Space className={ className }>
	{ icon }
	{ text }
</Space>

const Main: React.FC<IconProps> = (
	{
		className,
		children,
		color,
		tap,
		onClick,
		transformColor
	}
) => {
	const ref = useRef<HTMLDivElement>(null)
	let classNames: string[] = [ 'svg-icon' ]
	if (className !== undefined && !isEmpty(className)) {
		classNames = [ className, ...classNames ]
	} else {
		classNames.push('i-2x')
	}

	if (tap !== undefined) {
		classNames = [ ...classNames, 'cursor-pointer' ]
	}

	const style: CSSStyle = {}
	if (color !== undefined && !isEmpty(color)) {
		style.fill = color
	}

	const props = {
		style,
		className: classNames.join(' '),
		onClick
	}

	useEffect(
		() => {
			if (ref.current === null && transformColor !== undefined) {
				return
			}

			ref.current?.querySelectorAll('.transform')?.forEach(
				el => {
					el.setAttribute('fill', transformColor ?? el.getAttribute('fill') ?? '')
				}
			)
		},
		[]
	)

	return <i { ...props } ref={ ref } data-color={ transformColor }>{ children }</i>
}

export default Main
