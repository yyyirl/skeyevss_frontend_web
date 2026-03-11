import React, { type ReactElement, useEffect, useImperativeHandle, useRef } from 'react'
import { useHistory } from 'react-router-dom'
import * as XLSX from 'xlsx'
import type { ExpandableConfig } from 'rc-table/lib/interface'
import { Space, Table, type TableProps, Tooltip } from 'antd'
import type { TableRowSelection } from 'antd/es/table/interface'
import { defaultLimit, defPageSize, pageSizeOptions, SortBy as SortByEnum, variables } from '#constants/appoint'
import { type ExpandableProps, RenderStyle as EnumRenderStyle, type SwitchTextType, SwitchTextType as EnumSwitchTextType, type TableStyle } from '#types/ant.table.d'
import type { OptionItem, RowDataType } from '#types/base.d'
import routes, { Path } from '#routers/constants'
import { parseAnchorId, parseAnchorPC, parseAnchorPId } from '#routers/anchor'
import useFetchState from '#repositories/models'
import { LayoutUpdate, MenuFold } from '#repositories/models/recoil-state'
import { type Condition, type SortBy } from '#repositories/types/request'
import { XTableStyle } from '#repositories/cache/ls'
import { getElementHeightAdvanced, getParentNodes, inArray, isEmpty, pathJoin, setClassName, timestampFormat, toNumber } from '#utils/functions'
import { type CancelTokenSourceType, getCancelSource } from '#utils/axios'
import { errorMessage } from '#utils/err-hint'
import { Confirm, MessageType, MMessage } from '#components/hint'
import Icon from '#components/icon'
import { ReactComponent as IconLoading } from '#assets/svg/loading.svg'
import { Components, DraggableTable, Footer, Producer } from './items'
import { defaultUrlParamsValue, type DeleteActionType, type ExportExcelParams, type FetchDataParams, type FilterItem, filterParse, type ParseParams, PopupKey, type RouteRedirectParams, SwitchContentStyle, type TableRef, type XTableProps } from './model'

const TB = <T extends RowDataType>(props: XTableProps<T>): ReactElement => {
	const popups = props.popups ?? []
	const history = useHistory()

	const fetchListCancelTokenRef = useRef<CancelTokenSourceType | undefined>(undefined)
	const tableRef = useRef<HTMLDivElement>(null)
	const uniqueIdRef = useRef(parseAnchorId(props.match.params.anchor))
	const parentUniqueIdRef = useRef(parseAnchorPId(props.match.params.anchor))
	const parentUniqueIdWithCreateRef = useRef(parseAnchorPC(props.match.params.anchor))

	const layoutUpdate = new LayoutUpdate()
	const layoutUpdateState = layoutUpdate.state as number
	const menuFold = new MenuFold()
	const [ tableStyle, setTableStyle ] = useFetchState<TableStyle>(
		props.cardRender === undefined ? 'list' : XTableStyle(props.tableUniqueId) ?? 'list'
	)

	// 弹窗显示状态
	const [ popupVisible, setPopupVisible ] = useFetchState<{ [key: string]: boolean }>({
		[ PopupKey.create ]: false
	})
	const handleSetPopupVisible = (key: string, value: boolean): void => {
		const data = { ...popupVisible }
		data[ key ] = value
		setPopupVisible(data)
	}
	// 内容切换
	const [ switchContentState, setSwitchContentState ] = useFetchState(props.switchContentStyle ?? SwitchContentStyle.table)
	// 选择的行数据 弹窗数据传递
	const [ selectedRow, setSelectedRow ] = useFetchState<T | null>(null)
	const [ popupExtData, setPopupExtData ] = useFetchState<any>(null)
	// 选中id 左侧复选框
	const [ checkedIds, setCheckedIds ] = useFetchState<React.Key[]>([])
	// 表格数据
	const [ data, setData ] = useFetchState<T[]>([])
	const handleSetData = (data: T[]): void => {
		// TODO 数据响应 临时处理
		setLoading(true)
		setData([])
		setTimeout(
			() => {
				setData(data)
				setLoading(false)
			}
		)
	}
	// 数据总条数
	const [ total, setTotal ] = useFetchState(0)
	// 表格加载状态
	const [ loading, setLoading ] = useFetchState(false)
	// 每页显示条数
	const [ pageSize, setPageSize ] = useFetchState(props.match.params.limit === undefined ? defaultLimit : (toNumber(props.match.params.limit) ?? defaultLimit))
	// 当前页码
	const [ page, setPage ] = useFetchState(toNumber(props.match.params.page) ?? 0)
	// 设置默认排序
	const sortParams = props.match.params?.sort ?? defaultUrlParamsValue
	const sorts = sortParams.split('=')
	// 设置默认筛选
	const filterParams = props.match.params?.filter ?? defaultUrlParamsValue
	const filters: Array<FilterItem | null> = filterParams === defaultUrlParamsValue ? [] : filterParse(filterParams)

	// 路由跳转
	const routeRedirect = ({ page, pageSize, sort, filter }: RouteRedirectParams): void => {
		if (props.tableMode === 'inner') {
			return
		}

		history.push(
			pathJoin(
				props.pageRoute.list ?? routes[ Path.home ].path,
				page.toString(),
				(pageSize ?? defPageSize).toString(),
				sort ?? defaultUrlParamsValue,
				filter ?? defaultUrlParamsValue,
				!isEmpty(props.match.params.anchor) ? '/' + props.match.params.anchor : ''
			)
		)
	}
	// 请求参数解析
	const parse = ({ sort, filter, pageSize, page }: ParseParams): FetchDataParams<T> => {
		// 排序
		const _sort = sort.split('=')
		const orders: SortBy[] = []
		if (_sort.length === 2) {
			orders.push({
				column: _sort[ 0 ],
				value: _sort[ 1 ] === 'ascend' ? SortByEnum.asc : SortByEnum.desc
			})
		}

		const conditions: Array<Condition<T>> = []
		// 筛选
		filterParse(filter).forEach(
			item => {
				if (item === null) {
					return
				}

				const searchRowTypes = props.itemInstance?.searchRowTypes?.()
				if (searchRowTypes !== undefined) {
					switch (searchRowTypes[ item.name ]) {
						case 'string':
							conditions.push({
								column: item.name as keyof T,
								value: item.value[ 0 ]
							})
							return

						case 'number':
							conditions.push({
								column: item.name as keyof T,
								value: parseInt(item.value[ 0 ])
							})
							return
					}
				}

				if (typeof props.itemInstance[ item.name as keyof T ] === 'number') {
					const v: number[] = []
					for (let i = 0; i < item.value.length; i++) {
						v.push(parseInt(item.value[ i ]))
					}
					conditions.push({
						column: item.name as keyof T,
						values: v
					})
					return
				}

				conditions.push({
					column: item.name as keyof T,
					values: item.value
				})
			}
		)

		return { conditions, orders, pageSize, page }
	}
	// 获取列表
	const fetchData = (params?: FetchDataParams<T>): void => {
		setLoading(true)
		let { conditions, orders, pageSize: _pageSize, page: _page } = parse({
			sort: sortParams, filter: filterParams, page, pageSize
		})
		// table inner
		if (params?.conditions !== undefined) {
			conditions = params.conditions
		}

		if (params?.orders !== undefined) {
			orders = params.orders
		} else {
			if (props.defaultSortColumn !== undefined && (orders === undefined || orders.length <= 0)) {
				orders = [ { column: props.defaultSortColumn as string, value: props.defaultSortValue ?? SortByEnum.desc } ]
			}
		}

		if (params?.page !== undefined) {
			_page = params.page
		}

		if (params?.pageSize !== undefined) {
			_pageSize = params.pageSize
		}

		if (uniqueIdRef.current !== undefined && !isEmpty(uniqueIdRef.current)) {
			let value: any = uniqueIdRef.current
			if (props.itemInstance.anchorUniqueIdKeyColumn !== undefined) {
				conditions = [ { column: props.itemInstance.anchorUniqueIdKeyColumn() as any, value } ]
			} else if (typeof props.itemInstance.primaryKeyValue() === 'number') {
				value = parseInt(value as string)
				if (!isEmpty(value)) {
					conditions = [ { column: props.itemInstance.primaryKeyColumn() as any, value } ]
				}
			}
		}

		const parentUniqueIdColumn = props.itemInstance.parentUniqueIdKeyColumn?.()
		if (
			parentUniqueIdColumn !== undefined && (
				(parentUniqueIdRef.current !== undefined && !isEmpty(parentUniqueIdRef.current)) ||
				(parentUniqueIdWithCreateRef.current !== undefined && !isEmpty(parentUniqueIdWithCreateRef.current))
			)
		) {
			let value: any = parentUniqueIdRef.current ?? parentUniqueIdWithCreateRef.current
			if (typeof props.itemInstance.parentUniqueIdKeyValue?.() === 'number') {
				value = parseInt(value as string)
			}

			if (!isEmpty(value)) {
				conditions = [ { column: parentUniqueIdColumn as any, value } ]
			}
		}

		fetchListCancelTokenRef.current = getCancelSource()
		const fetchParams = {
			limit: _pageSize,
			page: _page,
			orders,
			conditions
		}

		const instance = props.fetchList(fetchParams, fetchListCancelTokenRef.current).then(
			res => {
				let records = res.data?.list ?? []
				if (props.handleListResponse !== undefined) {
					records = props.handleListResponse?.(res, fetchParams, setData)
					setData(records)
				}

				setData(records)
				setTotal(res.data?.count ?? 0)
				props.afterFetchList?.({
					records,
					setSelectedRow,
					handleSetPopupVisible
				})
			}
		)
		if (props.fetchListHint !== undefined) {
			void instance.catch(
				() => {
					MMessage({ message: props.fetchListHint ?? '', type: MessageType.error })
				}
			).finally(() => {
				setLoading(false)
			})
			return
		}

		void instance.finally(() => {
			setLoading(false)
		})
	}
	// 表格筛选条件变化
	const handleTableChange: TableProps<T>['onChange'] = (pagination, filters, sorter) => {
		// 排序
		let sort = defaultUrlParamsValue
		if (!Array.isArray(sorter) && !Array.isArray(sorter.field) && sorter.field !== undefined && sorter.order !== undefined) {
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			sort = `${ sorter.field }=${ sorter.order }`
		}
		// setSort(sort)

		// 筛选
		const tmpFilters = []
		for (const key in filters) {
			if (filters[ key ] === null) {
				continue
			}
			tmpFilters.push(`${ key }=${ filters[ key ]?.join(',') }`)
		}
		const f = tmpFilters.length > 0 ? tmpFilters.join('@') : defaultUrlParamsValue
		// setFilter(f)
		// filterRef.current = f

		// 分页
		const pageSize = pagination.pageSize ?? defPageSize
		const page = pagination.current ?? 1
		setPageSize(pageSize)
		setPage(page)

		// table inner
		if (props.tableMode === 'inner') {
			fetchData(
				parse({
					sort, filter: f, pageSize, page
				})
			)
			return
		}
		// 跳转
		routeRedirect({
			page, pageSize, sort, filter: f
		})
	}

	const expandableParams = (record: T): ExpandableProps<T> => ({
		record,
		records: data,
		setRecords: setData,
		update: props.update,
		setPopupVisible,
		popupVisible,
		setSelectedRow,
		setPopupExtData,
		deleteRow: (call?: () => void) => {
			handleDelete(props.primaryKey as keyof T, record.primaryKeyValue(), call)
		}
	})

	// 设置columns
	const columns = (props.columns ?? []).map(
		item => {
			// 默认排序选中
			item.defaultSortOrder = undefined
			if (sortParams !== defaultUrlParamsValue) {
				if (sorts.length === 2 && (item as any).dataIndex === sorts[ 0 ]) {
					item.defaultSortOrder = sorts[ 1 ] === 'ascend' ? 'ascend' : 'descend'
				}
			}

			// 默认筛选选中
			item.filteredValue = undefined
			if (filters.length > 0) {
				for (let i = 0; i < filters.length; i++) {
					const v = filters[ i ]
					if (v?.name === (item as any).dataIndex) {
						item.filteredValue = v?.value
					}
				}
			}

			// 设置render
			item.render = (value, record, index) => {
				const node = <Producer<T>
					params={
						{
							tips: item.tips,
							authority: props.authority,
							popupVerify: props.popupVerify,
							columnItem: item,
							setData: record => {
								setData(
									data.map(
										item => {
											if (item.primaryKeyValue() === record.primaryKeyValue()) {
												return record
											}

											return item
										}
									)
								)
							},
							fetchList: props.fetchList,
							minValue: item.minValue,
							maxValue: item.maxValue,
							update: props.update,
							type: item.renderStyle,
							options: typeof item.options === 'function' ? item.options({ record }) : (item.options ?? []),
							switchTextType: item.switchTextType,
							popupCall: item.popup !== undefined
								? () => {
									setSelectedRow(record)
									handleSetPopupVisible(item.popup ?? '', true)
								}
								: null
						}
					}
					primaryKey={ props.primaryKey }
					value={ value }
					record={ record }
					index={ index }
				/>

				if (item.renderHook !== undefined) {
					return item.renderHook({
						record,
						node,
						history,
						popupCall: item.popup !== undefined
							? () => {
								setSelectedRow(record)
								handleSetPopupVisible(item.popup ?? '', true)
							}
							: null,
						expandableParams: expandableParams(record)
					})
				}

				return node
			}

			// 其他属性
			item.ellipsis = true
			return item
		}
	)
	// 操作信息
	const handleDelete: DeleteActionType = (pk, val, call) => {
		let conditions: Array<Condition<T>> = [ { column: pk as keyof T, value: val } ]
		if (Array.isArray(val)) {
			conditions = [ { column: pk as keyof T, values: val } ]
		}

		if (props.beforeDelete !== undefined) {
			conditions = props.beforeDelete({ checkedIds: val, conditions, data })
		}

		Confirm({
			content: <div className="weight red">确认删除吗, 删除后将不可恢复</div>,
			success: (): void => {
				void props.delete?.({ conditions }).then(
					() => {
						setData([
							...data.filter(
								item => {
									const id = item.primaryKeyValue()
									if (Array.isArray(val)) {
										if (inArray(val, id)) {
											return false
										}
									} else {
										if (id === val) {
											return false
										}
									}

									return true
								}
							)
						])
						call?.()
					}
				)
			}
		})
	}

	// 暴露方法
	const reload = (): void => {
		// 刷新表格数据
		handleSetData(data)
	}

	const cellEditState = props.state?.hiddenCellEdit !== true && props.authority?.update === true
	const cellDeleteState = props.state?.hiddenCellDelete !== true && props.authority?.delete === true
	if (cellEditState || cellDeleteState || props.rowCustomActions !== undefined) {
		columns.push({
			title: '操作',
			width: props.rowCustomActions !== undefined ? 220 : 120,
			fixed: 'right',
			render: (_, record) => <Space size="middle">
				{
					props.rowCustomActions !== undefined
						? props.rowCustomActions({
							record,
							popupCall: (visible, key) => {
								setSelectedRow(record)
								handleSetPopupVisible(key, visible)
							},
							fetchData,
							reload
						})
						: <></>
				}
				{
					cellEditState
						? (
							!(record.hiddenEdit?.())
								? <>
									{
										record?.rowLoading?.() === true
											? <Icon className="i-2x rotating-ele" tap><IconLoading /></Icon>
											: <span
												onClick={
													() => {
														setSelectedRow(record)
														handleSetPopupVisible(PopupKey.update, true)
													}
												}
												className="cursor-pointer blue"
											>编辑</span>
									}
								</>
								: '-'
						)
						: ''
				}
				{
					cellDeleteState
						? (
							!(record.hiddenDelete?.())
								? (
									(variables.licenseError !== undefined || variables.showcase === true) && !(record.licenseErrorDeleteIgnore?.() === true)
										? <Tooltip title={ errorMessage() } arrow={ true }><span className="cursor-disabled">删除</span></Tooltip>
										: <span onClick={ () => { handleDelete(props.primaryKey as keyof T, record.primaryKeyValue()) } } className="cursor-pointer red">删除</span>
								)
								: '-'
						)
						: ''
				}
			</Space>
		})
	}
	// 分页
	const pagination = {
		total,
		current: Math.max(1, page),
		pageSize,
		showSizeChanger: true,
		showQuickJumper: true,
		hideOnSinglePage: total <= 0,
		pageSizeOptions,
		showLessItems: true
	}
	// 选中
	const rowSelection: TableRowSelection<T> = {
		selectedRowKeys: checkedIds,
		fixed: true,
		selections: true,
		// hiddenChecked
		renderCell: (_checked, record, _index, originNode) => <>{ record.hiddenChecked?.() ? <></> : originNode }</>,
		onChange: (_, records): void => {
			const checkedIds: Array<string | number> = []
			for (let i = 0; i < records.length; i++) {
				const item = records[ i ]
				if (item.hiddenChecked?.()) {
					continue
				}
				checkedIds.push(item.primaryKeyValue())
			}

			setCheckedIds(checkedIds as React.Key[])
		}
	}

	const exportExcel = (params: ExportExcelParams<T>): void => {
		if (params.title === '') {
			MMessage({
				message: '标题不能为空',
				type: MessageType.warning
			})
			return
		}

		const getSwitchTextType = (type: SwitchTextType | undefined, switchTextReversed: boolean, value: any): string => {
			const state = value === false || value === '0' || value === 0
			if (switchTextReversed) {
				switch (type) {
					case EnumSwitchTextType.default:
					case EnumSwitchTextType.ok:
					case EnumSwitchTextType.text:
						return state ? '打开' : '关闭'

					case EnumSwitchTextType.del:
						return state ? '未删除' : '删除'
				}

				return state ? 'ok' : '-'
			} else {
				switch (type) {
					case EnumSwitchTextType.default:
					case EnumSwitchTextType.ok:
					case EnumSwitchTextType.text:
						return state ? '关闭' : '打开'

					case EnumSwitchTextType.del:
						return state ? '删除' : '未删除'
				}

				return state ? '-' : 'ok'
			}
		}

		const getSelectTextType = (options: OptionItem[], value: any): string => {
			for (let i = 0; i < options.length; i++) {
				const item = options[ i ]
				if (item.value === value) {
					return item.title
				}
			}

			return '-'
		}

		const header = columns.map(async item => await item.title)
		const list = data.map(
			item => (columns as any[]).map(
				v => {
					const value = (item as any)[ v.dataIndex as keyof T ]
					switch (v.renderStyle) {
						case EnumRenderStyle.timestamp:
							return timestampFormat(value as number)

						case EnumRenderStyle.switch:
							return getSwitchTextType(v.switchTextType as SwitchTextType, v.switchTextReversed as boolean, value)

						case EnumRenderStyle.select:
							return getSelectTextType(
								(typeof v.options === 'function' ? v.options({ record: item }) : (v.options ?? [])) as OptionItem[],
								value
							)

						default:
							// 全部转成字符串
							return `${ value }`
					}
				}
			)
		)
		const ws = XLSX.utils.aoa_to_sheet([ header, ...list ])
		const wb = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
		XLSX.writeFile(wb, `${ params.title }.xlsx`)
		params.callback?.({
			original: data,
			list
		})
	}

	useImperativeHandle(
		props.tableRef,
		() => ({
			reload, exportExcel
		}),
		[ reload, exportExcel, data ]
	)

	const containerStyle = (): void => {
		const tableContainerEle = document.querySelector('.table-container')
		if (tableContainerEle === null) {
			return
		}

		let height = document.body.clientHeight
		// 顶部菜单
		const header = getElementHeightAdvanced('.layout-header-container')
		if (header !== null) {
			height = height - header.totalHeight - header.margin.bottom
		}
		// 底部菜单
		const layoutFooter = getElementHeightAdvanced('.layout-footer-container')
		if (layoutFooter !== null) {
			height = height - layoutFooter.totalHeight - layoutFooter.margin.bottom
		}

		const tableHeaderEle = getElementHeightAdvanced('.table-layout-header')
		if (tableHeaderEle !== null) {
			height = height - tableHeaderEle.totalHeight
		}

		const tableFooterEle = getElementHeightAdvanced('.table-layout-footer')
		if (tableFooterEle !== null) {
			console.log(tableFooterEle.totalHeight)
			height = height - tableFooterEle.totalHeight
		}

		// 设置宽度
		const menuLeft = getElementHeightAdvanced('.left-menu')
		if (props.components !== undefined || menuLeft !== null) {
			// const bodyEle = getElementHeightAdvanced('.table-layout-container')
			const bodyEle = getElementHeightAdvanced('body')
			let width = bodyEle?.width ?? 0
			// width = width - 20
			if (menuLeft !== null) {
				if (menuFold.state === true) {
					width = width - 260
				}
			}

			let ele: Element | null
			if (props.components !== undefined) {
				const bodyLeft = getElementHeightAdvanced('.table-layout-content-left')
				const bodyRight = getElementHeightAdvanced('.table-layout-content-right')
				if (bodyLeft !== null) {
					width = width - bodyLeft.margin.left - bodyLeft.margin.right - (props.components?.left?.width ?? 0)
				}

				if (bodyRight !== null) {
					width = width - bodyRight.margin.left - bodyRight.margin.right - (props.components?.right?.width ?? 0)
				}
				ele = document.querySelector('.table-layout-content-table')
			} else {
				ele = document.querySelector('.table-container')
			}

			if (ele !== null) {
				ele.setAttribute('style', `width: ${ width }px`)
			}
		}

		// 分页高度
		const pagination = getElementHeightAdvanced('.table-container .ant-pagination')
		if (pagination !== null) {
			height = height - pagination.height - 16 // 16 是marginTop
		}

		// 表格高度
		const ele = tableContainerEle.querySelector('.ant-table')
		if (ele !== null) {
			const footerEle = getElementHeightAdvanced('.ant-table-footer')
			let _height = height
			if (footerEle !== null) {
				_height = _height - footerEle.height
			}

			ele.setAttribute('style', `height: ${ _height + 20 }px`)
		}

		// 表格滚动
		const ele1 = tableContainerEle.querySelector('.ant-table-content')
		if (ele1 !== null) {
			ele1.setAttribute('style', 'overflow: auto auto')
		}

		handleTableStyle(tableStyle)
	}

	const expandable: ExpandableConfig<T> | undefined = props.expandableRender === undefined
		? undefined
		: {
			expandedRowRender: (record: T) => props.expandableRender?.(expandableParams(record)),
			rowExpandable: props.expandableState ?? (() => true),
			defaultExpandedRowKeys: uniqueIdRef.current === undefined
				? undefined
				: [
					typeof props.itemInstance.primaryKeyValue() === 'number' ? parseInt(uniqueIdRef.current) : uniqueIdRef.current
				]
		}

	const tableParams: TableProps<T> = {
		id: props.tableUniqueId,
		rowSelection: props.state?.hideRowSelection === true
			? undefined
			: (
				props.authority?.delete === true
					? { type: 'checkbox', ...rowSelection }
					: undefined
			),
		columns,
		rowKey: (item: T) => props.draggable === true && item.rowKey !== undefined ? item.rowKey() : item.primaryKeyValue(),
		dataSource: props.dataSourceFilter !== undefined ? props.dataSourceFilter(data) : data,
		pagination: props.state?.hidePagination === true || total <= pageSize ? false : pagination,
		loading,
		onChange: handleTableChange,
		scroll: { scrollToFirstRowOnChange: true, x: 'max-content' },
		tableLayout: 'fixed',
		expandable,
		footer: () => <Footer
			{ ...props }
			tableStyle={ tableStyle }
			setTableStyle={ setTableStyle }
			fetchData={ fetchData }
			popupExtData={ popupExtData }
			setData={ handleSetData }
			data={ data }
			checkedIds={ checkedIds }
			setCheckedIds={ setCheckedIds }
			handleDelete={ handleDelete }
			popups={ popups }
			setPopupVisible={ handleSetPopupVisible }
			popupVisible={ popupVisible }
			rowData={ selectedRow }
			setSelectedRow={ setSelectedRow }
			switchContentState={ switchContentState }
			handleSwitchContent={ setSwitchContentState }
			anchors={
				{
					uniqueId: uniqueIdRef.current,
					parentUniqueId: parentUniqueIdRef.current,
					parentUniqueIdWithCreate: parentUniqueIdWithCreateRef.current
				}
			}
		/>
	}

	const handleTableStyle = (style: TableStyle): void => {
		XTableStyle(props.tableUniqueId, style)
		tableParams.className = `table-container t3s ${ data.length <= 0 ? 'empty-table' : '' }`

		if (props.components === undefined) {
			tableParams.className = `${ tableParams.className } ${ props.className ?? '' }`
		}

		const delayFn = (): void => {
			const width = document.querySelector('.table-container.card')?.clientWidth ?? 0
			document.getElementById(props.tableUniqueId)?.querySelectorAll('table')?.forEach(
				item => {
					item.style.width = `${ width }px`
					const thead = item.querySelector('thead')
					const tbody = item.querySelector('tbody')
					if (tbody !== null) {
						if (style === 'card') {
							tbody.style.width = `${ width }px`
						} else {
							tbody.removeAttribute('style')
						}
					}

					const trEle = thead?.querySelector('tr')
					const trWidth = trEle?.offsetWidth ?? 0
					if (trEle !== null && trEle !== undefined) {
						trWidth <= width ? setClassName.add(trEle, 'flex-cc') : setClassName.remove(trEle, 'flex-cc')
					}

					if (thead !== null) {
						if (style === 'card') {
							thead.style.width = `${ width }px`

							// TODO 卡片样式没有数据 onWheel
							if (data.length <= 0) {
								thead.style.display = 'flex'
								thead.style.justifyContent = 'center'
							}
						} else {
							thead.removeAttribute('style')
						}
					}
				}
			)
		}
		if (style === 'card') {
			// tableParams.columns = columns.map(col => ({ ...col, title: null, render: () => null }))
			// tableParams.showHeader = true

			tableParams.rowSelection = undefined
			tableParams.columns = columns.filter(
				item => item.fixed === undefined && (item.sorter !== undefined || item.filters !== undefined || item.filterDropdown !== undefined) && item.filterDropdown === undefined
			)
			tableParams.onHeaderRow = () => ({
				onMouseLeave: () => {
					const tableEle = document.querySelector('.table-container')?.querySelector('.ant-table-content')
					if (tableEle !== null && tableEle !== undefined) {
						setClassName.remove(tableEle as HTMLElement, 'overflow-hidden')
					}
				},
				onWheel: e => {
					const trNodes = getParentNodes(e.target as HTMLElement, 'tr')
					if (trNodes.length <= 0) {
						return
					}

					e.stopPropagation()
					const tableEle = document.querySelector('.table-container')?.querySelector('.ant-table-content')
					if (tableEle !== null && tableEle !== undefined) {
						setClassName.add(tableEle as HTMLElement, 'overflow-hidden')
					}

					const parentTrNode = trNodes[ 0 ]
					const width = parentTrNode?.offsetWidth ?? 0
					const parentWidth = parseInt(parentTrNode.parentElement?.style?.width ?? '')
					const min = -(width - parentWidth)

					let scrollNum = parseInt(parentTrNode?.style?.left ?? '')
					scrollNum = isNaN(scrollNum) ? 0 : scrollNum
					if (e.deltaY < 0) {
						scrollNum += 20
					} else if (e.deltaY > 0) {
						scrollNum -= 20
					}

					if (scrollNum < 0) {
						if (scrollNum <= min) {
							scrollNum = min
						}
					} else {
						if (scrollNum >= 0) {
							scrollNum = 0
						}
					}

					parentTrNode.style.left = `${ scrollNum }px`
				}
			})
			tableParams.expandable = {
				expandedRowKeys: data.map(item => item.primaryKeyValue()),
				showExpandColumn: false,
				defaultExpandAllRows: true,
				expandedRowRender: (record) => props.cardRender?.({
					record,
					records: data,
					setRecords: setData,
					update: props.update,
					setPopupVisible,
					popupVisible,
					setSelectedRow,
					setPopupExtData,
					deleteRow: (call?: () => void) => {
						handleDelete(props.primaryKey as keyof T, record.primaryKeyValue(), call)
					}
				})
			}
			tableParams.className = `table-container card t3s ${ props.className ?? '' } ${ data.length <= 0 ? 'empty-table' : '' }`
			delayFn()
			setTimeout(delayFn, 200)
		} else {
			delayFn()
		}
	}

	handleTableStyle(tableStyle)

	// 弹窗
	useEffect(
		() => {
			const popupVisible: { [key: string]: boolean } = {}
			popups.forEach(
				item => {
					popupVisible[ item.key ] = false
				}
			)
			setPopupVisible(popupVisible)

			window.addEventListener('resize', containerStyle)
			return () => { window.removeEventListener('resize', containerStyle) }
		},
		[]
	)

	// 获取数据
	useEffect(
		() => {
			uniqueIdRef.current = parseAnchorId(props.match.params.anchor)
			parentUniqueIdRef.current = parseAnchorPId(props.match.params.anchor)
			parentUniqueIdWithCreateRef.current = parseAnchorPC(props.match.params.anchor)
			fetchData()
		},
		[ JSON.stringify(props.match.params) ]
	)

	// 设置表格高度
	useEffect(containerStyle, [ tableRef.current, menuFold.state, props.components, layoutUpdateState ])

	return props.draggable === true
		? <Components
			components={ props.components }
			content={
				<DraggableTable
					table={
						components => <Table<T>
							ref={ tableRef }
							{ ...tableParams as any }
							components={ components }
						/>
					}
					records={ data }
					setRecords={ setData }
					update={ props.update }
				/>
			}
			records={ data }
			setRecords={ setData }
			update={ props.update }
			switchContentState={ switchContentState }
			handleSwitchContent={ setSwitchContentState }
			className={ props.className }
			loading={ loading }
			fetchListCancelToken={
				() => {
					fetchListCancelTokenRef.current?.cancel()
				}
			}
		/>
		: <Components
			components={ props.components }
			content={ <Table<T> ref={ tableRef } { ...tableParams as any } className={ tableParams.className } /> }
			records={ data }
			setRecords={ setData }
			update={ props.update }
			switchContentState={ switchContentState }
			handleSwitchContent={ setSwitchContentState }
			className={ props.className }
			loading={ loading }
			fetchListCancelToken={
				() => {
					fetchListCancelTokenRef.current?.cancel()
				}
			}
		/>
}

const Main = <T extends RowDataType>(props: XTableProps<T>): ReactElement => {
	const tableRef = useRef<TableRef<T> | null>(null)
	const [ loading, setLoading ] = useFetchState(false)

	const reset = (): void => {
		setLoading(true)

		setTimeout(
			() => {
				setLoading(false)
			}
		)
	}

	useImperativeHandle(
		props.tableRef,
		() => ({ ...tableRef.current, reset }),
		[ tableRef.current, reset ]
	)

	return <>{ loading ? <></> : <TB { ...props } tableRef={ tableRef } /> }</>
}

export default Main
