import React, { useRef, useEffect, useCallback, type ReactElement } from 'react'
import useFetchState from '#repositories/models'

interface DraggableAdhesiveProps {
	containerId: string
	children: React.ReactNode
	className?: string
	init?: () => void
	extStyle?: (style: { [key: string]: string }) => void
}

export interface Position {
	left?: number
	top?: number
	right?: number
	bottom?: number
}

type Edge = 'top' | 'bottom' | 'left' | 'right'

interface EdgeDistances {
	top: number
	bottom: number
	left: number
	right: number
}

const Main: React.FC<DraggableAdhesiveProps> = ({
	containerId,
	children,
	className = '',
	init,
	extStyle
}: DraggableAdhesiveProps): ReactElement => {
	const draggableRef = useRef<HTMLDivElement>(null)
	const positionRef = useRef<Position>({})
	const [ isDragging, setIsDragging ] = useFetchState<boolean>(false)
	const [ position, setPosition ] = useFetchState<Position>({})
	const [ startPos, setStartPos ] = useFetchState<{ x: number, y: number }>({ x: 0, y: 0 })
	const [ isInitialized, setIsInitialized ] = useFetchState<boolean>(false)

	const getContainerRect = useCallback(
		(): DOMRect | null => {
			const container: HTMLElement | null = document.getElementById(containerId)
			return container !== null ? container.getBoundingClientRect() : null
		},
		[ containerId ]
	)

	// 初始化位置
	const initializePosition = useCallback(
		(): void => {
			const containerRect: DOMRect | null = getContainerRect()
			const element: HTMLDivElement | null = draggableRef.current

			if (containerRect !== null && element !== null && !isInitialized) {
				const elementRect: DOMRect = element.getBoundingClientRect()
				const initialLeft: number = 40
				const initialTop: number = (containerRect.height - elementRect.height) / 2

				const initialPosition: Position = {
					left: initialLeft,
					top: initialTop
				}

				positionRef.current = initialPosition
				setPosition(initialPosition)
				setIsInitialized(true)
			}
		},
		[ getContainerRect, isInitialized ]
	)

	const handleMouseDown = useCallback(
		(e: React.MouseEvent<HTMLDivElement>): void => {
			init?.()
			const containerRect: DOMRect | null = getContainerRect()
			if (containerRect === null || draggableRef.current === null) return

			setIsDragging(true)
			const relativeX: number = e.clientX - containerRect.left
			const relativeY: number = e.clientY - containerRect.top

			const elementRect: DOMRect = draggableRef.current.getBoundingClientRect()
			let currentLeft: number = position.left ?? 0
			let currentTop: number = position.top ?? 0

			// 如果当前是 right/bottom 定位，转换为 left/top
			if (position.right !== undefined) {
				currentLeft = containerRect.width - elementRect.width - position.right
			}
			if (position.bottom !== undefined) {
				currentTop = containerRect.height - elementRect.height - position.bottom
			}

			setStartPos({
				x: relativeX - currentLeft,
				y: relativeY - currentTop
			})
		},
		[ getContainerRect, position ]
	)

	const handleMouseMove = useCallback(
		(e: MouseEvent): void => {
			init?.()
			if (!isDragging || draggableRef.current === null) {
				return
			}

			const containerRect: DOMRect | null = getContainerRect()
			if (containerRect === null) {
				return
			}

			const elementRect: DOMRect = draggableRef.current.getBoundingClientRect()
			const relativeX: number = e.clientX - containerRect.left
			const relativeY: number = e.clientY - containerRect.top

			const newLeft: number = relativeX - startPos.x
			const newTop: number = relativeY - startPos.y

			const constrainedLeft: number = Math.max(0, Math.min(newLeft, containerRect.width - elementRect.width))
			const constrainedTop: number = Math.max(0, Math.min(newTop, containerRect.height - elementRect.height))

			const newPosition: Position = {
				left: constrainedLeft,
				top: constrainedTop
			}

			positionRef.current = newPosition
			setPosition(newPosition)
		},
		[ isDragging, startPos.x, startPos.y, getContainerRect ]
	)

	const handleMouseUp = useCallback(
		(): void => {
			if (!isDragging || draggableRef.current === null) {
				return
			}

			setIsDragging(false)
			snapToEdge()
		},
		[ isDragging ]
	)

	const snapToEdge = useCallback(
		(): void => {
			const containerRect: DOMRect | null = getContainerRect()
			const element: HTMLDivElement | null = draggableRef.current

			if (containerRect === null || element === null) {
				return
			}

			const currentPosition: Position = positionRef.current
			const elementRect: DOMRect = element.getBoundingClientRect()

			const currentLeft: number = currentPosition.left ?? 0
			const currentTop: number = currentPosition.top ?? 0

			const elementCenterX: number = currentLeft + elementRect.width / 2
			const elementCenterY: number = currentTop + elementRect.height / 2

			const distances: EdgeDistances = {
				top: elementCenterY,
				bottom: containerRect.height - elementCenterY,
				left: elementCenterX,
				right: containerRect.width - elementCenterX
			}

			const closestEdge: Edge = Object.keys(distances).reduce((a: string, b: string) => {
				const edgeA: Edge = a as Edge
				const edgeB: Edge = b as Edge
				return distances[ edgeA ] < distances[ edgeB ] ? edgeA : edgeB
			}) as Edge

			let newPosition: Position = {}
			let extPosition: { [key: string]: string } = {}
			switch (closestEdge) {
				case 'top':
					newPosition = { top: 20, left: currentLeft }
					extPosition = { top: '40px', left: '50%', transform: 'translateX(-50%)' }
					break
				case 'bottom':
					newPosition = { bottom: 80, left: currentLeft }
					extPosition = { bottom: '40px', left: '50%', transform: 'translateX(-50%)' }
					break
				case 'left':
					newPosition = { left: 20, top: currentTop }
					extPosition = { left: '40px', top: '50%', transform: 'translateY(-50%)' }
					break
				case 'right':
					newPosition = { right: 80, top: currentTop }
					extPosition = { right: '40px', top: '50%', transform: 'translateY(-50%)' }
					break
				default:
			}

			setPosition(newPosition)
			extStyle?.(extPosition)
		},
		[ getContainerRect ]
	)

	useEffect(
		(): (() => void) => {
			if (isDragging) {
				document.addEventListener('mousemove', handleMouseMove)
				document.addEventListener('mouseup', handleMouseUp)
			}

			return (): void => {
				document.removeEventListener('mousemove', handleMouseMove)
				document.removeEventListener('mouseup', handleMouseUp)
			}
		},
		[ isDragging, handleMouseMove, handleMouseUp ]
	)

	// 初始化位置
	useEffect(
		(): void => {
			initializePosition()
		},
		[ initializePosition ]
	)

	const style: React.CSSProperties = {
		position: 'absolute',
		cursor: isDragging ? 'grabbing' : 'grab',
		userSelect: 'none',
		...position
	}

	return <div
		ref={ draggableRef }
		className={ `draggable-adhesive ${ className }`.trim() }
		style={ style }
		onMouseDown={ handleMouseDown }
	>{ children }</div>
}

export default Main