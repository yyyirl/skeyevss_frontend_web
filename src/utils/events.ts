import type React from 'react'
import { useCallback } from 'react'
import { type ChangeEvent } from 'react'
import { type Coordinates } from '#repositories/types/foundation'
import { execFunc } from '#utils/functions'

type InputChangeHandler = (event: ChangeEvent<HTMLInputElement>) => void
type textareaChangeHandler = (event: ChangeEvent<HTMLTextAreaElement>) => void

type TextOnChange = (value: string) => void
type NumberOnChange = (value: number) => void

export function textOnChange(onChange: TextOnChange): InputChangeHandler {
	return (event: ChangeEvent<HTMLInputElement>) => {
		onChange(event.target.value)
	}
	// return useCallback(
	//	 (event: ChangeEvent<HTMLInputElement>) => {
	//		 onChange(event.target.value)
	//	 },
	//	 [ onChange ]
	// )
}

export function numberOnChange(onChange: NumberOnChange): InputChangeHandler {
	return (event: ChangeEvent<HTMLInputElement>) => {
		const reg = /^-?\d*(\.\d*)?$/
		if (reg.test(event.target.value) || event.target.value === '' || event.target.value === '-') {
			const val = parseInt(event.target.value)
			onChange(isNaN(val) ? 0 : val)
		}
	}
	// return useCallback(
	//	 (event: ChangeEvent<HTMLInputElement>) => {
	//		 const reg = /^-?\d*(\.\d*)?$/
	//		 if (reg.test(event.target.value) || event.target.value === '' || event.target.value === '-') {
	//			 const val = parseInt(event.target.value)
	//			 onChange(isNaN(val) ? 0 : val)
	//		 }
	//	 },
	//	 [ onChange ]
	// )
}

export function textareaOnChange(onChange: TextOnChange): textareaChangeHandler {
	return useCallback(
		(event: ChangeEvent<HTMLTextAreaElement>) => {
			onChange(event.target.value)
		},
		[ onChange ]
	)
}

/**
 * 找到元素的坐标
 * @param dom
 */
export function getEleCoordinates(dom: HTMLElement): Coordinates {
	const box = dom.getBoundingClientRect()
	const D = document.documentElement
	const x = box.left + Math.max(D.scrollLeft, document.body.scrollLeft) - D.clientLeft
	const y = box.top + Math.max(D.scrollTop, document.body.scrollTop) - D.clientTop
	return { x, y }
}

export function getElementOffset(element: HTMLElement): Coordinates {
	let x = 0
	let y = 0

	// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
	while (element) {
		y = y + element.offsetTop
		x = x + element.offsetLeft
		element = element.offsetParent as HTMLElement
	}

	return { x, y }
}

// 滚动到顶部
export const scrollToTop = (duration: number, callback?: () => void): void => {
	// instant auto
	// window.scrollTo({ top: 0, behavior: 'smooth' })
	const start = window.scrollY
	const end = 0
	const startTime = performance.now()

	const easeInOutCubic = (t: number, b: number, c: number, d: number): number => {
		t /= d / 2
		if (t < 1) return (c / 2) * t * t * t + b
		t -= 2
		return (c / 2) * (t * t * t + 2) + b
	}

	const animateScroll = (currentTime: number): void => {
		const elapsedTime = currentTime - startTime
		const scrollPosition = easeInOutCubic(elapsedTime, start, end - start, duration)
		window.scrollTo(0, scrollPosition)

		if (elapsedTime < duration) {
			window.requestAnimationFrame(animateScroll)
		} else {
			execFunc(callback)
		}
	}

	window.requestAnimationFrame(animateScroll)
}

interface EnterParams {
	callback: () => void
	e: React.KeyboardEvent
}

/**
 * 回车事件
 * @param callback
 * @param e
 * @return {function(): void}
 * @constructor
 */
export function Enter({ callback, e }: EnterParams): void {
	if (e.key === 'NumpadEnter' || e.key === 'Enter') {
		typeof callback === 'function' && callback()
	}
	// ele = ele || document
	//
	// ele.addEventListener('keydown', e => onKeydown({ e, callback }))
	// return () => ele.removeEventListener('keydown', e => onKeydown({ e, callback }))
}