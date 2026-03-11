import React from 'react'
import { Link as LLink, useHistory } from 'react-router-dom'
import { type CSSStyle } from '#repositories/types/foundation'
import { execFunc, isEmpty } from '#utils/functions'
import store from '#utils/store'

// TODO 版本兼容
const Link = LLink as any

const key = 'last-login-route'

export const LastRoute = (type: string = 'get'): string | undefined => {
	if (type === 'get') {
		const route = store.get(key) as string
		// 清除缓存
		ClearLastRoute()

		if (!isEmpty(route) && route.indexOf('http') === 0) {
			return (new URL(route)).pathname
		}

		return route
	}

	store.set(key, (new URL(window.location.href)).pathname)
}

export const ClearLastRoute = (): void => {
	store.remove(key)
}

interface LocationProps {
	to: string
	target?: string
	className?: string
	style?: CSSStyle
	children: React.ReactElement
	title?: string
	onClick?: () => void
}

const Location: React.FC<LocationProps> = (
	{
		to,
		target,
		className,
		children,
		style,
		title,
		onClick
	}
) => {
	const history = useHistory()
	if (to.indexOf('http') === 0) {
		return <a
			target={ target }
			href={ to }
			style={ style ?? {} }
			className={ className }
			title={ title }
			onClick={
				e => {
					const url = history.location.pathname + history.location.search + history.location.hash
					if (url === to) {
						e.preventDefault()
					}

					execFunc(onClick, e)
				}
			}
		>{ children }</a>
	}

	return <Link
		target={ target }
		to={ to }
		style={ style ?? {} }
		className={ className }
		title={ title }
		onClick={
			(e: any) => {
				const url = history.location.pathname + history.location.search + history.location.hash
				if (url === to) {
					e.preventDefault()
				}

				execFunc(onClick, e)
			}
		}
	>{ children }</Link>
}

export default Location
