import React, { type ReactElement, useEffect, useRef, useState } from 'react'
import { Select, type SelectProps, Spin } from 'antd'
import { throttle, trim } from '#utils/functions'
import { type OptionItem } from '#types/base'
import useFetchState from '#repositories/models'
import type { FetchQueryOptionListParams } from '#repositories/types/request'
import type { FetchOptionListResponse } from '#repositories/types/response'
import type { Response } from '#types/axios.d'
import { toSelectOptionType } from '#components/table/model'

export interface FetchSelectProps<ValueType = any> extends Omit<SelectProps<ValueType | ValueType[]>, 'options' | 'children'> {
	fetchList: (params: FetchQueryOptionListParams) => Promise<Response<FetchOptionListResponse>>
	interval?: number
	uniqueId: string
	limit?: number
	emptyDataView?: ReactElement
}

export function FetchSelect({ fetchList, interval = 800, limit = 20, uniqueId, ...props }: FetchSelectProps): ReactElement {
	const page = useRef(0)
	const keyword = useRef('')
	const [ loading, setLoading ] = useState(false)
	const [ initLoading, setInitLoading ] = useState(true)
	const [ options, setOptions ] = useState<OptionItem[]>([])
	const [ total, setTotal ] = useFetchState(0)
	const fetch = (): void => {
		throttle(
			(): void => {
				if (loading) {
					return
				}
				setLoading(true)

				page.current += 1
				void fetchList({
					keyword: trim(keyword.current),
					page: page.current,
					limit
				}).then((res) => {
					setOptions([ ...options, ...(res.data?.list ?? []) ])
					setTotal(res.data?.count ?? 0)
				}).finally(
					() => {
						setLoading(false)
						setInitLoading(false)
					}
				)
			},
			interval,
			uniqueId
		)
	}
	const handlePopupScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
		const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
		if (scrollHeight - scrollTop <= clientHeight + 20 && total > 0 && total - options.length > 0 && !loading) {
			fetch()
		}
	}
	const initFetch = (v: string): void => {
		setOptions([])
		keyword.current = v
		page.current = 0
		fetch()
	}

	useEffect(() => {
		initFetch('')
	}, [])

	return initLoading
		? <Spin size="small" />
		: <Select
			{ ...props }
			filterOption={ false }
			onPopupScroll={ handlePopupScroll }
			showSearch={ true }
			onSearch={ initFetch }
			notFoundContent={ loading ? <Spin size="small" /> : (options.length <= 0 ? <>无记录</> : null) }
			options={ toSelectOptionType(options) }
		/>
}