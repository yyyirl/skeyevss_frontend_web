import { type MutableRefObject, useCallback, useEffect, useRef, useState } from 'react'

type SetType = <T>(data: T | ((data: T) => void)) => void
type FetchState<T> = [ T, SetType, MutableRefObject<T> ]

/**
 * useFetchState
 * @param initialState
 */
export default function useFetchState<T>(initialState: T): FetchState<T> {
	const focus = useRef<boolean>(false)
	const ref = useRef<T>(initialState)
	const [ state, setState ] = useState(initialState)

	useEffect(
		() => {
			focus.current = true
			return () => {
				focus.current = false
			}
		},
		[]
	)

	const setFetchState = useCallback(
		(params: T) => {
			ref.current = typeof params === 'function' ? params() : params

			if (focus.current) {
				setState(params)
			}

			setState(params)
		},
		[]
	) as SetType

	return [ state, setFetchState, ref ]
}
