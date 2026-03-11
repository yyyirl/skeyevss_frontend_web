import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle, type ReactNode, type ReactElement } from 'react'
import { isArray, throttle } from '#utils/functions'
import type { RowDataType } from '#types/base.d'

export interface ScrollLoadProps<T extends RowDataType> {
	uniqueId: string
	fetchData: (page: number) => Promise<T[]>
	renderItem: (item: T, index: number) => ReactNode
	loadingComponent?: ReactNode
	endComponent?: ReactNode
	errorComponent?: (error: Error, retry: () => void) => ReactNode
	className?: string
	pageSize?: number
	threshold?: number
	initialPage?: number
}

export interface InfiniteScrollRef<T extends RowDataType> {
	reload: () => void
	reset: () => void
	loadMore: () => void
	getItems: () => T[]
	getCurrentPage: () => number
	setItems: (list: T[] | T) => void
}

const Main = <T extends RowDataType,>(props: ScrollLoadProps<T>, ref: React.Ref<InfiniteScrollRef<T>>): ReactElement => {
	const {
		fetchData,
		renderItem,
		loadingComponent = <div style={ { textAlign: 'center', padding: '20px' } }>加载中...</div>,
		endComponent = <div style={ { textAlign: 'center', padding: '20px' } }>没有更多数据了</div>,
		errorComponent = (error, retry) => <div style={ { textAlign: 'center', padding: '20px', color: 'red' } }>
				加载失败: { error.message }
			<button onClick={ retry } style={ { marginLeft: '10px' } }>重试</button>
		</div>,
		className,
		pageSize = 10,
		threshold = 100,
		initialPage = 1
	} = props

	const [ items, setItems ] = useState<T[]>([])
	const [ loading, setLoading ] = useState(false)
	const [ page, setPage ] = useState(initialPage)
	const [ hasMore, setHasMore ] = useState(true)
	const [ error, setError ] = useState<Error | null>(null)

	const observerRef = useRef<IntersectionObserver | null>(null)
	const sentinelRef = useRef<HTMLDivElement>(null)
	const isMounted = useRef(true)

	const handleSetItems = (data: T[] | T): void => {
		if (isArray(data)) {
			setItems(data as T[])
			return
		}

		const v = data as T
		setItems(
			items.map(
				item => {
					if (item.primaryKeyValue() === v.primaryKeyValue()) {
						return v
					}

					return item
				}
			)
		)
	}

	const loadMoreData = useCallback(
		(_page?: number) => {
			if (loading || !hasMore) return

			setLoading(true)
			setError(null)

			throttle(
				() => {
					let tmpPage = page
					if (_page !== undefined) {
						tmpPage = _page
					}

					void fetchData(tmpPage).then(
						data => {
							if (!isMounted.current) return

							if (data.length === 0 || data.length < pageSize) {
								setHasMore(false)
							}

							setItems(prev => [ ...prev, ...data ])
							setPage(prev => prev + 1)
						}
					).catch(
						err => {
							if (!isMounted.current) return
							setError(err as Error)
						}
					).finally(
						() => {
							if (isMounted.current) {
								setLoading(false)
							}
						}
					)
				},
				300,
				props.uniqueId
			)
		},
		[ loading, hasMore, page, fetchData, pageSize ]
	)

	const reload = useCallback(
		() => {
			setItems([])
			setPage(initialPage)
			setHasMore(true)
			setError(null)
			setLoading(false)
		},
		[ initialPage ]
	)

	const reset = useCallback(
		() => {
			setPage(0)
			reload()
			loadMoreData(0)
		},
		[ reload, loadMoreData ]
	)

	const getItems = (): T[] => items
	const getCurrentPage = (): number => page

	useImperativeHandle(
		ref, () => ({
			reload,
			reset,
			loadMore: loadMoreData,
			getItems,
			getCurrentPage,
			setItems: handleSetItems
		}),
		[ reload, reset, loadMoreData, items, page ]
	)

	useEffect(
		() => {
			if (sentinelRef.current === null || !hasMore || loading || error !== null) {
				return
			}

			const options: IntersectionObserverInit = {
				root: null,
				rootMargin: `${ threshold }px 0px`,
				threshold: 0.1
			}

			observerRef.current = new IntersectionObserver(
				entries => {
					const [ entry ] = entries
					if (entry.isIntersecting) {
						loadMoreData()
					}
				},
				options
			)

			observerRef.current.observe(sentinelRef.current)

			return () => {
				observerRef.current?.disconnect()
			}
		},
		[ hasMore, loading, error, loadMoreData, threshold ]
	)

	useEffect(
		() => {
			isMounted.current = true
			loadMoreData()

			return () => {
				isMounted.current = false
				observerRef.current?.disconnect()
			}
		},
		[]
	)

	const handleRetry = useCallback(
		() => {
			setError(null)
			loadMoreData()
		},
		[ loadMoreData ]
	)

	return <div className={ className }>
		{ items.map(renderItem) }
		{ loading ? loadingComponent : <></> }
		{ error !== null ? errorComponent(error, handleRetry) : <></> }
		{ !hasMore && items.length > 0 ? endComponent : <></> }
		{ hasMore && !loading && error === null ? <div ref={ sentinelRef } style={ { height: '1px' } } /> : <></> }
		{ !hasMore && items.length === 0 && !loading && error === null ? <div style={ { textAlign: 'center', padding: '40px' } }>暂无数据</div> : <></> }
	</div>
}

const InfiniteScroll = forwardRef(Main) as <T extends RowDataType>(props: ScrollLoadProps<T> & { ref?: React.Ref<InfiniteScrollRef<T>> }) => React.ReactElement

(InfiniteScroll as any).displayName = 'InfiniteScroll'

export default InfiniteScroll