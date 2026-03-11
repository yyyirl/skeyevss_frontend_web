import React, { useRef, useEffect, useCallback, type ReactElement } from 'react'
import useFetchState from '#repositories/models'

interface ScrollToBottomProps {
	call: () => void
	threshold?: number
	children?: ReactElement
	className?: string
}

const Main: React.FC<ScrollToBottomProps> = ({
	call,
	threshold = 100,
	children,
	className
}) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const [ isNearBottom, setIsNearBottom ] = useFetchState(false)

	const handleScroll = useCallback(
		(): void => {
			const container: HTMLDivElement | null = containerRef.current
			if (container === null) return

			const scrollTop: number = container.scrollTop
			const scrollHeight: number = container.scrollHeight
			const clientHeight: number = container.clientHeight
			const distanceFromBottom: number = scrollHeight - scrollTop - clientHeight
			const nearBottom: boolean = distanceFromBottom <= threshold

			if (nearBottom && !isNearBottom) {
				setIsNearBottom(true)
				call()
			} else if (!nearBottom && isNearBottom) {
				setIsNearBottom(false)
			}
		},
		[ threshold, call, isNearBottom ]
	)

	useEffect(
		() => {
			const container: HTMLDivElement | null = containerRef.current
			if (container === null) return

			container.addEventListener('scroll', handleScroll)

			return () => {
				container.removeEventListener('scroll', handleScroll)
			}
		},
		[ handleScroll ]
	)

	return <div
		className={ className ?? '' }
		ref={ containerRef }
		style={
			{
				height: '100%',
				overflowY: 'auto',
				position: 'relative'
			}
		}
	>{ children }</div>
}

export default Main