import React, { type ReactElement, useEffect, useRef } from 'react'
import { useHistory } from 'react-router-dom'
import { type JSX } from 'react/jsx-runtime'
import HHighlighter from 'react-highlight-words'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { arrayMoveImmutable } from 'array-move'
import { Button, Input, InputNumber, type InputRef, Select, Space, Switch, Tooltip } from 'antd'
import { type FilterConfirmProps, type FilterDropdownProps } from 'antd/es/table/interface'
import { CheckOutlined, CloseOutlined, MenuOutlined, SearchOutlined } from '@ant-design/icons'
import { RenderStyle, SwitchTextType } from '#types/ant.table.d'
import type { PopupItemContentParamsType } from '#types/ant.form.d'
import { variables } from '#constants/appoint'
import { type RowDataType } from '#types/base.d'
import { Anchor } from '#routers/anchor'
import { arrayUnique, findNeighbors, isEmpty, throttle, timestampFormat } from '#utils/functions'
import { errorMessage } from '#utils/err-hint'
import useFetchState from '#repositories/models'
import type { UpdateRequestCall } from '#repositories/types/request'
import { Modals } from '#components/hint'
import Icon from '#components/icon'
import { ReactComponent as IconCards } from '#assets/svg/table-cards.svg'
import { ReactComponent as IconList } from '#assets/svg/table-list.svg'
import { type CellProducerPropsType, type CellProducerUpdateParams, pickOption, type ProducerPropsType, type TableCheckIdType, type TableFooterType, type XTableComponents, PopupKey, toSelectOptionType, type ComponentProps, SwitchContentStyle } from './model'

const Highlighter = HHighlighter as any

const CSwitch = <T extends RowDataType>(props: CellProducerPropsType<T>): ReactElement => {
	let checkedChildren: ReactElement | string | null = null
	let unCheckedChildren: ReactElement | string | null = null
	switch (props.params.columnItem.switchTextType) {
		case SwitchTextType.ok:
			if (props.params.columnItem.switchTextReversed === true) {
				unCheckedChildren = <CheckOutlined />
				checkedChildren = <CloseOutlined />
			} else {
				checkedChildren = <CheckOutlined />
				unCheckedChildren = <CloseOutlined />
			}
			break

		case SwitchTextType.text:
			if (props.params.columnItem.switchTextReversed === true) {
				unCheckedChildren = '打开'
				checkedChildren = '关闭'
			} else {
				checkedChildren = '打开'
				unCheckedChildren = '关闭'
			}
			break

		case SwitchTextType.del:
			if (props.params.columnItem.switchTextReversed === true) {
				unCheckedChildren = '已删除'
				checkedChildren = '未删除'
			} else {
				checkedChildren = '已删除'
				unCheckedChildren = '未删除'
			}
			break
	}
	// 修改加载状态
	const [ loading, setLoading ] = useFetchState(false)
	// 选中状态
	let checked = false
	const record = props.record as any
	let dataType: 'string' | 'number' | 'boolean' = 'boolean'
	if (typeof record[ props.column ] === 'boolean') {
		checked = record[ props.column ]
		dataType = 'boolean'
	} else if (typeof record[ props.column ] === 'string') {
		checked = record[ props.column ] !== '0'
		dataType = 'string'
	} else if (typeof record[ props.column ] === 'number') {
		checked = record[ props.column ] !== 0
		dataType = 'number'
	} else {
		return <span className="red">unsupported type: [ { typeof record[ props.column ] } ]</span>
	}

	const onChange = (checked: boolean): void => {
		let value: any = checked
		if (dataType === 'string') {
			value = checked ? '1' : '0'
		} else if (dataType === 'number') {
			value = checked ? 1 : 0
		}

		props.handleUpdate({
			setLoading,
			value
		})
	}

	if (props.params.authority?.update === true && !(props.record.hiddenEdit?.())) {
		return <Switch
			onChange={ onChange }
			defaultChecked={ checked }
			loading={ loading }
			checkedChildren={ checkedChildren }
			unCheckedChildren={ unCheckedChildren }
			disabled={ variables.licenseError !== undefined || variables.showcase === true }
		/>
	}

	if (checked) {
		return <>{ checkedChildren ?? '是' }</>
	}

	return <>{ unCheckedChildren ?? '否' }</>
}

const CInput = <T extends RowDataType>(props: CellProducerPropsType<T>): ReactElement => {
	// 修改加载状态
	const [ loading, setLoading ] = useFetchState(false)
	const record = props.record as any
	// 输入值
	const [ value, setValue ] = useFetchState(
		typeof props.params.columnItem.defaultValueFilter === 'function'
			? props.params.columnItem.defaultValueFilter(record[ props.column ])
			: record[ props.column ]
	)
	// 提交更新
	const submit = (): void => {
		props.handleUpdate({
			setLoading,
			value
		})
	}
	const params: any = {
		disabled: loading || variables.licenseError !== undefined || variables.showcase === true,
		onPressEnter: submit,
		value,
		width: props.params.columnItem.width,
		placeholder: props.params.columnItem.placeholder ?? 'typing value'
	}

	if (props.params.minValue !== undefined) {
		params.min = props.params.minValue
	}

	if (props.params.maxValue !== undefined) {
		params.max = props.params.maxValue
	}

	if (props.params.authority?.update === true && !(props.record.hiddenEdit?.())) {
		return <Space.Compact style={ { width: '100%' } }>
			{
				props.number === true
					? <InputNumber{ ...params } onChange={ setValue } />
					: <Input
						{ ...params }
						onChange={
							e => {
								setValue(e.target.value)
							}
						}
					/>
			}
			<Button type="primary" onClick={ submit } disabled={ variables.licenseError !== undefined || variables.showcase === true } loading={ loading }>更新</Button>
		</Space.Compact>
	}

	return value
}

const CTimestamp = <T extends RowDataType>(props: CellProducerPropsType<T>): ReactElement => {
	return <span onClick={ props.params.popupCall ?? undefined }>{ timestampFormat(props.value as number) }</span>
}

const CSelect = <T extends RowDataType>(props: CellProducerPropsType<T>): ReactElement => {
	const [ loading, setLoading ] = useFetchState(false)
	const record = props.record as any
	const [ value, setValue ] = useFetchState(
		typeof props.params.columnItem.defaultValueFilter === 'function'
			? props.params.columnItem.defaultValueFilter(record[ props.column ])
			: record[ props.column ]
	)

	const onChange = (value: string | number | string[] | number[]): void => {
		setValue(value)
		if (props.params.columnItem.multiple === true) {
			throttle(() => {
				props.handleUpdate({
					setLoading,
					value
				})
			}, 1000)
			return
		}
		props.handleUpdate({
			setLoading,
			value
		})
	}

	const options = toSelectOptionType(
		// props.params.columnItem.options ?? []
		typeof props.params.columnItem.options === 'function' ? props.params.columnItem.options({ record }) : (props.params.columnItem.options ?? [])
	)
	if (props.params.authority?.update === true && !(props.record.hiddenEdit?.())) {
		return <Select
			loading={ loading }
			value={ value }
			style={ { width: '100%' } }
			showSearch={ true }
			placeholder={ props.params.columnItem.placeholder ?? 'typing value' }
			optionFilterProp={ 'label' }
			onChange={ onChange }
			mode={ props.params.columnItem.multiple === true ? 'multiple' : undefined }
			options={ options }
			disabled={ variables.licenseError !== undefined || variables.showcase === true }
		/>
	}

	return <>{ pickOption(value, options)?.label ?? '-' }</>
}

export const Producer = <T extends RowDataType>(props: ProducerPropsType<T>): ReactElement => {
	const { params: { type, tips, update, setData, columnItem, popupCall, popupVerify }, record, value, primaryKey } = props

	const Tips = (params: { children: ReactElement }): ReactElement => {
		if (tips !== undefined) {
			return <Tooltip
				title={ tips }
				arrow={ true }
			><div>{ params.children }</div></Tooltip>
		}

		return params.children
	}

	if (type !== undefined && Object.values(RenderStyle).includes(type)) {
		if (columnItem.renderVerify !== undefined) {
			const data = columnItem.renderVerify(record)
			if (data === '-') {
				return <>-</>
			}

			if (!data) {
				return <>{ value }</>
			}
		}

		const column = columnItem.dataIndex as keyof T
		const handleUpdate = ({ setLoading, value }: CellProducerUpdateParams<T>): void => {
			if (update !== undefined) {
				setLoading(true)
				void update({
					conditions: [ { column: primaryKey as keyof T, value: record.primaryKeyValue() } ],
					data: [ { column, value } ]
				}).then(
					() => {
						// 更新列表
						setData((record.updateProperty?.(column, value) ?? record) as T)
					}
				).finally(
					() => {
						setLoading(false)
					}
				)
			}
		}

		if (type === RenderStyle.switch) {
			return <Tips><CSwitch { ...props } column={ column } handleUpdate={ handleUpdate } /></Tips>
		} else if (type === RenderStyle.input) {
			return <Tips><CInput { ...props } column={ column } handleUpdate={ handleUpdate } /></Tips>
		} else if (type === RenderStyle.number) {
			return <Tips><CInput { ...props } number={ true } column={ column } handleUpdate={ handleUpdate } /></Tips>
		} else if (type === RenderStyle.select) {
			return <Tips><CSelect { ...props } column={ column } handleUpdate={ handleUpdate } /></Tips>
		} else if (type === RenderStyle.timestamp) {
			return <Tips><CTimestamp { ...props } column={ column } handleUpdate={ handleUpdate } /></Tips>
		}
	}

	let content = <>{ value }</>
	if (columnItem.filteredValue !== undefined && columnItem.filteredValue !== null) {
		content = <Highlighter
			highlightStyle={ { backgroundColor: '#ffc069', padding: 0 } }
			searchWords={ Array.isArray(columnItem.filteredValue) ? columnItem.filteredValue as string[] : [ columnItem.filteredValue as string ] }
			autoEscape
			textToHighlight={ value }
		/>
	}

	return <Tips>
		<div
			onClick={
				popupVerify === undefined
					? popupCall ?? undefined
					: (
						popupVerify?.(record) ? (popupCall ?? undefined) : undefined
					)
			}
			style={ { width: columnItem.width } }
		>{ content }</div>
	</Tips>
}

export const Footer = <T extends RowDataType>(props: TableFooterType<T>): ReactElement => {
	const history = useHistory()
	const [ loadings, setLoadings ] = useFetchState<{ [key: string]: boolean }>({})

	useEffect(
		() => {
			const loadings: { [key: string]: boolean } = {}
			props.footerComponentItems?.forEach(
				item => {
					loadings[ item.index ] = false
				}
			)
			setLoadings(loadings)
		},
		[]
	)

	// 编辑弹窗
	const onCreate = (): void => {
		props.setSelectedRow(null)
		props.setPopupVisible(PopupKey.create, true)
	}
	// 选中id
	const checkedIds = props.checkedIds as TableCheckIdType
	// 表单创建完成
	const formComplete: (data: T) => void = () => {
		// 刷新列表
		props.fetchData()
	}

	if (props.state?.hiddenCreate !== true && props.form !== undefined && props.authority?.create === true) {
		props.popups?.push({
			title: '创建',
			key: PopupKey.create,
			width: props.popupDCWidth ?? 600,
			content: props.form
		})

		useEffect(
			() => {
				if (!isEmpty(props.anchors.parentUniqueIdWithCreate) || props.match.params.anchor === Anchor.create) {
					setTimeout(
						() => {
							props.setPopupVisible(PopupKey.create, true)
						},
						300
					)
				}
			},
			[]
		)
	}

	if (props.state?.hiddenCellEdit !== true && props.form !== undefined && props.authority?.update === true) {
		props.popups?.push({
			title: '编辑',
			key: PopupKey.update,
			width: props.popupDCWidth ?? 600,
			content: props.form
		})
	}

	const buttonDisabledState = (Array.isArray(checkedIds) && checkedIds.length <= 0) || checkedIds === '' || checkedIds === 0

	return <>
		{
			arrayUnique(props.popups ?? [], item => item.key).map(
				(item, key) => <Modals
					key={ key }
					visible={ props.popupVisible[ item.key ] }
					setVisible={
						v => { props.setPopupVisible(item.key, v) }
					}
					title={ typeof item.title === 'string' ? item.title : item.title(props.rowData ?? null) }
					destroyOnHidden={ true }
					className={ item.className }
					footer={ item.footer }
					width={ item.width ?? 500 }
					height={ item.height }
					maskClosable={ true }
					content={
						<PopupContent<T>
							visible={ props.popupVisible[ item.key ] ?? false }
							content={ item.content }
							data={
								{
									fetchRow: props.fetchRow,
									popupKey: item.key,
									data: props.rowData,
									close: () => {
										props.setPopupVisible(item.key, false)

										if (props.pageRoute.list !== undefined && props.match.params.anchor === Anchor.create) {
											history.push(props.pageRoute.list)
										}
									},
									create: props.create,
									update: props.update,
									complete: formComplete,
									autoClose: props.autoCloseForm,
									setRecords: props.setData,
									records: props.data,
									extData: props.popupExtData,
									convToItem: props.convToItem
								}
							}
						/>
					}
				/>
			)
		}
		<ul className="table-footer-box">
			{
				props.state?.hiddenCreate === true || props.state?.hiddenCreateCall?.(props) === true
					? <></>
					: (
						props.authority?.create === true
							? <li>
								{
									variables.licenseError !== undefined || variables.showcase === true
										? <Tooltip placement="rightTop" title={ errorMessage() } arrow={ true }><Button type="primary" disabled={ true }>创建</Button></Tooltip>
										: <Button type="primary" onClick={ onCreate }>创建</Button>
								}
							</li>
							: <></>
					)
			}
			{
				((props.state?.hiddenDelete === true || props.state?.hiddenDeleteCall?.(props) === true) && props.authority?.delete === true) || props.tableStyle === 'card'
					? <></>
					: (
						props.authority?.delete === true
							? <li>
								{
									(variables.licenseError !== undefined || variables.showcase === true) && !(props.licenseErrorDeleteIgnore === true)
										? <Tooltip placement="rightTop" title={ errorMessage() } arrow={ true }><Button type="dashed" disabled={ true }>{ props.footerDeleteButtonText ?? '删除' }</Button></Tooltip>
										: <Button
											type="dashed"
											onClick={
												() => {
													props.handleDelete(props.primaryKey as keyof T, checkedIds)
												}
											}
											disabled={ buttonDisabledState }
											className="red"
										>{ props.footerDeleteButtonText ?? '删除' }</Button>
								}
							</li>
							: <></>
					)
			}
			{
				(props.footerComponentItems ?? []).map(
					(item, key) => <li
						key={ key }
					>{ item.content({ ...props, disabled: buttonDisabledState, loadings, setLoadings }) }</li>
				)
			}
			{
				props.cardRender !== undefined
					? <li className="table-content-style">
						<Tooltip title={ props.tableStyle === 'card' ? '卡片样式' : '列表样式' } arrow={ true }>
							<span className="cursor-pointer" onClick={ () => { props.setTableStyle(props.tableStyle === 'card' ? 'list' : 'card') } }>
								<Icon className="i-4x" tap>{ props.tableStyle === 'list' ? <IconList /> : <IconCards /> }</Icon>
							</span>
						</Tooltip>
					</li>
					: <></>
			}
		</ul>
	</>
}

interface PopupContentProps<T extends RowDataType> {
	visible: boolean
	content: (data: PopupItemContentParamsType<T>) => ReactElement
	data: PopupItemContentParamsType<T>
}

export const PopupContent = <T extends RowDataType>({
	visible,
	data,
	content
}: PopupContentProps<T>): ReactElement => !visible ? <></> : content(data)

const FilterDropdown = <T extends RowDataType>(
	{
		setSelectedKeys,
		selectedKeys,
		confirm,
		clearFilters,
		dataIndex
	}: FilterDropdownProps & { dataIndex: keyof T }
): ReactElement => {
	// 搜索输入框内容
	const [ searchText, setSearchText ] = useFetchState(selectedKeys.length > 0 ? selectedKeys[ 0 ] : '')
	// table 搜索框的值
	const ref = useRef<InputRef | null>(null)
	// 搜索计数
	const searchCounter = useRef(0)

	// 搜索
	const handleSearch = (selectedKeys: React.Key[], confirm: (param?: FilterConfirmProps) => void, _: keyof T): void => {
		confirm()
		setSearchText(selectedKeys[ 0 ] as string)
		searchCounter.current = searchCounter.current += 1
	}

	// 重置
	const handleReset = (clearFilters: (() => void) | undefined, confirm: (param?: FilterConfirmProps) => void, _: keyof T): void => {
		clearFilters?.()
		setSearchText('')
		confirm()
	}

	useEffect(
		() => {
			setTimeout(() => {
				if (ref.current !== null) {
					ref.current.focus()
					ref.current.select()
				}
			}, 2000)
		},
		[ searchCounter.current ]
	)

	return <div className="table-column-search-box">
		<Input
			ref={ ref }
			autoFocus={ true }
			allowClear={ true }
			width={ 200 }
			placeholder="typing a search value ..."
			value={ searchText }
			onChange={
				e => {
					setSearchText(e.target.value)
					setSelectedKeys((e.target.value !== '') ? [ e.target.value ] : [])
				}
			}
			onPressEnter={
				e => {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					const value = e.target.value
					setSearchText(value)
					setSelectedKeys(((value !== '') ? [ value ] : []) as React.Key[])
					handleSearch(selectedKeys, confirm, dataIndex)
				}
			}
		/>
		<Button
			type="primary"
			onClick={
				() => {
					handleSearch(selectedKeys, confirm, dataIndex)
				}
			}
			icon={ <SearchOutlined /> }
			style={ { width: 90 } }
		>搜索</Button>
		<Button
			onClick={
				() => {
					handleReset(clearFilters, confirm, dataIndex)
				}
			}
		>重置</Button>
	</div>
}

interface ColumnSearch {
	filterIcon?: ReactElement | ((filtered: boolean) => ReactElement)
	filterDropdown?: ReactElement | ((props: FilterDropdownProps) => ReactElement)
}

export const columnSearchProps = <T extends RowDataType>(dataIndex: keyof T): ColumnSearch => {
	return {
		filterDropdown: props => <FilterDropdown<T> { ...props } dataIndex={ dataIndex } />,
		filterIcon: (filtered: boolean) => <SearchOutlined style={ { color: filtered ? '#1677ff' : undefined } } />
	}
}

// ------------------------------------------------- 拖拽组件
export const CDragItem = <MenuOutlined style={ { cursor: 'grab', color: 'red', marginRight: 15 } } />

export const dragClassName = 'x-drag-cell'

interface DraggableBodyRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
	index: number
	moveRow: (dragIndex: number, hoverIndex: number) => void
}

interface DragItem {
	index: number
	type: string
}

const DraggableBodyRow: React.FC<DraggableBodyRowProps> = ({
	index,
	moveRow,
	className,
	style,
	...restProps
}) => {
	const ref = React.useRef<HTMLTableRowElement | null>(null)
	const [
		{
			isOver,
			dropClassName
		},
		drop
	] = useDrop({
		accept: 'DraggableTableRow',
		collect: (monitor) => {
			const { index: dragIndex } = monitor.getItem() ?? {}
			if (dragIndex === index) {
				return {}
			}
			return {
				isOver: monitor.isOver(),
				dropClassName: dragIndex < index ? ' drop-over-downward' : ' drop-over-upward',
				canDrop: monitor.canDrop()
			}
		},
		drop: (item: DragItem) => {
			moveRow(item.index, index)
		}
		// canDrop: () => {
		//	 return ref.current?.querySelector(`.${ dragClassName }`) !== null
		// }
	})

	const [ , drag ] = useDrag({
		type: 'DraggableTableRow',
		item: { index },
		collect: (monitor) => ({
			isDragging: monitor.isDragging()
		})
	})

	drop(drag(ref))
	return <tr
		ref={ ref }
		className={ `${ className }${ (isOver === true) ? dropClassName : '' }` }
		style={ { cursor: 'move', ...style } }
		{ ...restProps }
	/>
}

export interface DragProps<T extends RowDataType> {
	table: (components: XTableComponents<T>) => ReactElement
	records: T[]
	setRecords: (data: T[]) => void
	update?: UpdateRequestCall
}

export const DraggableTable = <T extends RowDataType>(props: DragProps<T>): ReactElement => {
	const components: XTableComponents<T> = {
		body: {
			row: (rowProps: JSX.IntrinsicAttributes & DraggableBodyRowProps): ReactElement => <DraggableBodyRow
				{ ...rowProps }
				index={ (props.records ?? []).findIndex((x: T) => x.rowKey?.() === (rowProps as any)[ 'data-row-key' ]) }
				moveRow={
					(oldIndex: number, newIndex: number) => {
						if (oldIndex === newIndex) {
							return
						}
						const uniqueId = props.records[ oldIndex ].primaryKeyValue() as keyof T
						const column = props.records[ oldIndex ].primaryKeyColumn() as keyof T
						const records = arrayMoveImmutable(
							props.records.slice(),
							oldIndex,
							newIndex
						).filter(item => !isEmpty(item))
						const sortColumn = (records[ 0 ].getSortColumn?.() ?? 'sort') as keyof T

						// 提交保存
						const {
							previous,
							next
						} = findNeighbors(records, 'uniqueId', uniqueId)
						const value = ((previous !== null ? (previous.getSortValue?.() ?? 0) : 0) + (next !== null ? (next.getSortValue?.() ?? 0) : 0)) / 2
						props.setRecords(
							records.map(
								item => uniqueId === item.primaryKeyValue() && item.updateProperty !== undefined
									? item.updateProperty?.(sortColumn, value)
									: item
							) as T[]
						)
						void props.update?.<T>(
							{
								conditions: [ { column, value: uniqueId } ],
								data: [ { column: sortColumn, value } ]
							}
						)
					}
				}
			/>
		}
	}

	return <DndProvider backend={ HTML5Backend }>{
		props.table(components)
	}</DndProvider>
}

// ------------------------------------------------- 拖拽组件

export const Components = <T extends RowDataType>(props: ComponentProps<T>): ReactElement => {
	if (props.components === undefined) {
		return props.content
	}

	let header = <></>
	if (props.components.header !== undefined) {
		header = <div
			className="table-layout-header"
			style={ { width: props.components.header.width } }
		>{ props.components.header.content(props) }</div>
	}

	let footer = <></>
	if (props.components.footer !== undefined) {
		footer = <div
			className="table-layout-footer"
			style={ { height: props.components.footer.height } }
		>{ props.components.footer.content(props) }</div>
	}

	return <div className={ `table-layout-container ${ props.className }` }>
		{ header }
		<div className="table-layout-content">
			{
				props.components.left !== undefined
					? <div
						className="table-layout-content-left"
						style={ { width: props.components.left.width } }
					>{ props.components.left.content(props) }</div>
					: <></>
			}
			<div className="table-layout-content-table">
				{
					props.components.customSwitchContent !== undefined
						? <>{
							props.switchContentState === SwitchContentStyle.table
								? props.content
								: props.components.customSwitchContent.content(props)
						}</>
						: props.content
				}
			</div>
			{
				props.components.right !== undefined
					? <div
						className="table-layout-content-right"
						style={ { width: props.components.right.width } }
					>{ props.components.right.content(props) }</div>
					: <></>
			}
		</div>
		{ footer }
	</div>
}
