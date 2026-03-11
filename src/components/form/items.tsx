import React, { type MutableRefObject, type ReactElement, useEffect, useRef } from 'react'
import dayjs from 'dayjs'
import { Spin, type UploadFile, type UploadProps, Checkbox, ColorPicker, DatePicker, Image, Input, InputNumber, Radio, Select, Switch, TimePicker, TreeSelect, Upload, AutoComplete } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { type FormItemProps, XFormItemType } from '#types/ant.form.d'
import { type ANTOptionItem, type OptionItem, type RowDataType } from '#types/base.d'
import useFetchState from '#repositories/models'
import { TreeItem } from '#repositories/types/foundation'
import { antdGetBase64, arrayUnique, convertToRangeValue, getUrlFileName, inArray, isEmpty, makeRangePickerValue, throttle, timestampToDayjs, uniqueId } from '#utils/functions'
import { ReactComponent as LockIcon } from '#assets/svg/lock.svg'
import { toSelectOptionType } from '#components/table/model'
import Icon from '#components/icon'
import Markdown from '#components/markdown'
import { Editor } from '#components/editor'

type ImageUploadProps<T extends RowDataType> = FormItemProps<T> & {
	value: any
	handleChange: (val: any) => void
	id: string
	proxyPath?: string
}

interface ImagePreviewParams {
	visible: boolean
	onVisibleChange: (visible: boolean) => void
	afterOpenChange: (visible: boolean) => void
}

const FileUpload = <T extends RowDataType>(props: ImageUploadProps<T>): ReactElement => {
	const isSet = useRef(false)

	const [ previewImage, setPreviewImage ] = useFetchState('')
	const [ previewOpen, setPreviewOpen ] = useFetchState(false)
	const makeList = (): UploadFile[] => Array.isArray(props.value)
		? props.value.map(
			item => ({
				uid: item,
				name: getUrlFileName(item as string | null) ?? uniqueId(),
				status: 'done',
				url: item
			})
		)
		: (
			isEmpty(props.value)
				? []
				: [
					{
						uid: props.value,
						name: getUrlFileName(props.value as string | null) ?? uniqueId(),
						status: 'done',
						url: props.value
					}
				]
		)

	const [ fileList, setFileList ] = useFetchState<UploadFile[]>([])

	const handleSetFileList = (list: UploadFile[]): void => {
		setFileList(list)
		if (Array.isArray(props.value)) {
			const records: string[] = []
			list.forEach(
				item => {
					if (item.status === 'done') {
						records.push(item.response.data as string)
					}
				}
			)
			props.handleChange(records)
		} else {
			if (list.length > 0 && list[ 0 ].status === 'done') {
				props.handleChange(list[ 0 ].response.data ?? '')
			}
		}
	}

	const handlePreview = async(file: UploadFile): Promise<void> => {
		if ((file.preview === undefined || file.preview === '') && file.originFileObj !== undefined) {
			file.preview = await antdGetBase64(file.originFileObj)
		}

		setPreviewImage(file.url ?? (file?.preview ?? ''))
		setPreviewOpen(true)
	}

	const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
		if (newFileList.length <= 0) {
			handleSetFileList([])
			return
		}

		handleSetFileList(Array.isArray(props.value) ? newFileList : [ newFileList[ newFileList.length - 1 ] ])
	}

	// const handleRemove: UploadProps['onRemove'] = file => {
	//	 return true
	// }

	const uploadButton = (
		<button style={ { border: 0, background: 'none' } } type="button">
			<PlusOutlined />
			<div style={ { marginTop: 8 } }>Upload</div>
		</button>
	)

	const imagePreviewParams: ImagePreviewParams = {
		visible: previewOpen,
		onVisibleChange: (visible: boolean) => { setPreviewOpen(visible) },
		afterOpenChange: (visible: boolean) => { if (!visible) setPreviewImage('') }
	}

	useEffect(
		() => {
			throttle(
				() => {
					if (isSet.current) {
						return
					}

					setFileList(makeList)
					isSet.current = true
				},
				500
			)
		},
		[ props.value ]
	)

	return <>
		<Upload
			id={ props.id }
			action={ `/${ import.meta.env.VITE_BACKEND_PROXY }/tool/file/upload` }
			listType="picture-card"
			fileList={
				props.proxyPath !== undefined
					? fileList.map(
						item => ({
							...item,
							url: `${ props.proxyPath }${ item.url }`,
							preview: `${ props.proxyPath }${ item.preview }`
						})
					)
					: fileList
			}
			onPreview={ file => { void handlePreview(file) } }
			onChange={ handleChange }
			// onRemove={ handleRemove }
		>{ fileList.length >= 8 ? null : uploadButton }</Upload>
		{
			previewImage !== ''
				? <Image
					wrapperStyle={ { display: 'none' } }
					preview={ imagePreviewParams }
					src={ previewImage }
				/>
				: <></>
		}
	</>
}

interface CCheckboxProps<T extends RowDataType> {
	dataIndex: keyof T
	simple?: boolean
	value: any
	handleChange: (v: any) => void
	fetchRowComplete?: MutableRefObject<boolean | null>

	// 继承 props
	disabled?: (data: T | undefined) => boolean
	original: T | undefined
	options?: OptionItem[]
	valueRender?: (value: any, record?: T) => any

	labelRender?: (record: T) => ReactElement
}

interface CCCheckboxChangeParams {
	checked: boolean
	item: ANTOptionItem
	parent?: ANTOptionItem
}

export const CCheckbox = <T extends RowDataType>(props: CCheckboxProps<T>): ReactElement => {
	const isSet = useRef(false)
	const [ checkedValues, setCheckedValues ] = useFetchState<any[]>([])
	const handleChange = (values: any[]): void => {
		setCheckedValues(values)
		props.handleChange(values)
	}
	const change = ({ checked, item, parent }: CCCheckboxChangeParams): void => {
		if (props.simple === true) {
			let values = [ ...checkedValues ]
			if (checked) {
				values.push(item.value)
			} else {
				values = values.filter(
					v => v !== item.value
				)
			}

			values = typeof props.valueRender === 'function' ? props.valueRender(values, props.original) : values
			handleChange(values)
			return
		}

		const subs: any[] = []
		const fn = (list: ANTOptionItem[]): void => {
			list.forEach(
				item => {
					subs.push(item.value)
					fn(item.options ?? [])
				}
			)
		}
		fn(item.options ?? [])

		let values = [ item.value, ...subs ]
		if (checked) {
			values = [ ...checkedValues, ...values ]
		} else {
			values = checkedValues.filter(
				item => !inArray(values, item)
			)
		}

		// 选中父级
		const fn1 = (item: ANTOptionItem): void => {
			if (item.parentID !== undefined && item.parentID !== null) {
				values.push(item.parentID)
				const v = TreeItem.findANTOption(options, item.parentID)
				if (v !== null) {
					fn1(v)
				}
			}
		}
		fn1(item)

		// 取消父级选中
		const fn2 = (parent: ANTOptionItem): void => {
			let unchecked = true
			const list = parent.options ?? []
			for (let i = 0; i < list.length; i++) {
				const item = list[ i ]
				if (inArray(values, item.value)) {
					unchecked = false
					return
				}
			}

			if (unchecked) {
				values = values.filter(v => v !== parent.value)
				if (parent.parentID !== undefined && parent.parentID !== null) {
					const v = TreeItem.findANTOption(options, parent.parentID)
					if (v !== null) {
						fn2(v)
					}
				}
			}
		}

		if (!checked && parent !== undefined) {
			fn2(parent)
		}

		handleChange(arrayUnique(values, (v: any) => v))
	}
	const makeGroup = (data: ANTOptionItem[], parent?: ANTOptionItem): ReactElement[] => {
		let options: ReactElement[] = []
		const subs: ReactElement[] = []
		for (let i = 0; i < data.length; i++) {
			const item = data[ i ]
			let level = item.level
			if (item.level !== undefined && item.level >= 0) {
				level = item.level + 1
			}

			if ((item.options !== undefined && item.options.length > 0)) {
				options.push(
					<p className="group-header" style={ { paddingLeft: (level ?? 0) * 30 } } key={ item.value }>
						<Checkbox
							data-level={ level ?? 0 }
							className="group-header-item"
							value={ item.value }
							checked={ checkedValues.includes(item.value) }
							onChange={ e => { change({ checked: e.target.checked, item, parent }) } }
							disabled={ item.disabled }
						>{ item.title }</Checkbox>
					</p>
				)
				options = [ ...options, ...makeGroup(item.options ?? [], item) ]
				continue
			}

			subs.push(
				<Checkbox
					data-level={ level ?? 0 }
					key={ item.value }
					value={ item.value }
					checked={ checkedValues.includes(item.value) }
					disabled={ item.disabled }
					onChange={ e => { change({ checked: e.target.checked, item, parent }) } }
				>{ props.labelRender === undefined ? item.title : props.labelRender(item as unknown as T) }</Checkbox>
			)
		}
		return [
			...options,
			<p
				key={ uniqueId() }
				style={ parent?.level !== undefined ? { paddingLeft: (parent.level + 2) * 30 } : {} }
				className="group-items"
			>{ subs }</p>
		]
	}
	const options = toSelectOptionType(props.options ?? [])
	const content = makeGroup(options)

	useEffect(
		() => {
			if (isSet.current) {
				return
			}

			throttle(
				() => {
					setCheckedValues((props.value ?? []) as any[])
					if (props.fetchRowComplete?.current === null || props.fetchRowComplete?.current === true) {
						isSet.current = true
					}
				},
				300,
				props.dataIndex as string
			)
		},
		[ props.value ]
	)

	return <Checkbox.Group
		disabled={ props.disabled?.(props.original) }
		value={ typeof props.valueRender === 'function' ? props.valueRender(checkedValues, props.original) : checkedValues }
	>{ content }</Checkbox.Group>
}

const Main = <T extends RowDataType>(props: FormItemProps<T>): ReactElement => {
	const [ loading, setLoading ] = useFetchState(false)
	const DateComponent = props.dateMode === 'time' ? TimePicker : DatePicker
	const [ value, setValue ] = useFetchState<any>(
		props.type !== XFormItemType.input && props.type !== XFormItemType.password ? null : ''
	)
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	props.setterMaps[ props.dataIndex ] = setValue
	const handleChange = (v: any): void => {
		if (typeof props.handleChange === 'function') {
			props.handleChange(v, setValue, props.original)
		} else {
			setValue(v)
		}

		props.setFieldValue(props.dataIndex, v)

		if (typeof props.afterOnChange === 'function') {
			props.afterOnChange(
				{
					fetchRowComplete: props.fetchRowComplete,
					value: v,
					setFieldValue: props.setFieldValue,
					columns: props.columns,
					hiddenMaps: props.hiddenMaps,
					setHiddenMaps: props.setHiddenMaps,
					readonlyMaps: props.readonlyMaps,
					setReadonlyMaps: props.setReadonlyMaps,
					record: props.original,
					setLoading,
					formColumnInstance: props.formColumnInstance
				}
			)
		}
	}
	// 日期组件参数
	const datePickerParams = {
		allowClear: true,
		autoFocus: true,
		preserveInvalidOnBlur: true,
		disabled: props.disabled?.(props.original) === true || (props.readonlyMaps as any)[ props.dataIndex ] === true,
		minDate: props.min === undefined ? undefined : (props.min.toString().length === 13 ? dayjs(props.min) : dayjs.unix(props.min)),
		maxDate: props.max === undefined ? undefined : (props.max.toString().length === 13 ? dayjs(props.max) : dayjs.unix(props.max)),
		showTime: props.showTime
	}

	useEffect(
		() => {
			if (props.type !== XFormItemType.input && props.type !== XFormItemType.password) {
				if (props.original?.[ props.dataIndex ] === undefined && props?.defValue !== undefined) {
					handleChange(props.defValue)
					return
				}
			}

			if (props.original !== undefined && props.original !== null) {
				let data = props.original[ props.dataIndex ]
				if (typeof props?.valueRender === 'function') {
					data = props.valueRender?.(data, props.original)
				}

				// if (props.type !== XFormItemType.input && props.type !== XFormItemType.password) {
				// 	if (props.setDefValue !== undefined) {
				// 		setLoading(true)
				// 		handleChange(props.setDefValue?.(data, setLoading))
				// 		return
				// 	}
				// }

				if (props.fetchDefValue !== undefined) {
					setLoading(true)
					throttle(
						() => {
							void props.fetchDefValue?.(data).then(handleChange).finally(
								() => {
									setLoading(false)
								}
							)
						},
						500,
						`fetchDefValue-${ (props.dataIndex as unknown as string) ?? '' }`
					)

					return
				}

				handleChange(data)
			}
		},
		[ props.original ]
	)

	let content: ReactElement
	switch (props.type) {
		case XFormItemType.number:
			content = <InputNumber
				disabled={ props.disabled?.(props.original) === true || (props.readonlyMaps as any)[ props.dataIndex ] === true }
				style={ { width: 180 } }
				id={ props.dataIndex as string }
				value={ typeof props.valueRender === 'function' ? props.valueRender(value, props.original) : value }
				onChange={ v => { handleChange(v) } }
				min={ props.min }
				max={ props.max }
				placeholder={ props.placeholder !== undefined ? (typeof props.placeholder === 'function' ? props.placeholder(props.original) : props.placeholder) : `请设置${ props.label }` }
				suffix={ loading ? <Spin size="small" /> : null }
			/>
			break

		case XFormItemType.textarea:
			content = <Input.TextArea
				id={ props.dataIndex as string }
				disabled={ props.disabled?.(props.original) === true || (props.readonlyMaps as any)[ props.dataIndex ] === true }
				showCount
				value={ typeof props.valueRender === 'function' ? props.valueRender(value, props.original) : value }
				placeholder={ props.placeholder !== undefined ? (typeof props.placeholder === 'function' ? props.placeholder(props.original) : props.placeholder) : `请设置${ props.label }` }
				onChange={ e => { handleChange(e.target.value) } }
				style={ { resize: 'none' } }
				autoSize={ { minRows: 4, maxRows: 8 } }
			/>
			break

		case XFormItemType.markdown:
			content = <Markdown
				id={ props.dataIndex as string }
				readonly={ (props.readonlyMaps as any)[ props.dataIndex ] === true }
				disabled={ props.disabled?.(props.original) === true || (props.readonlyMaps as any)[ props.dataIndex ] === true }
				content={ (typeof props.valueRender === 'function' ? props.valueRender(value, props.original) : value) as string }
				placeholder={ props.placeholder !== undefined ? (typeof props.placeholder === 'function' ? props.placeholder(props.original) : props.placeholder) : `请设置${ props.label }` }
				update={ value => { handleChange(value) } }
			/>
			break

		case XFormItemType.editor:
			content = <Editor
				id={ props.dataIndex as string }
				readonly={ (props.readonlyMaps as any)[ props.dataIndex ] === true }
				disabled={ props.disabled?.(props.original) === true || (props.readonlyMaps as any)[ props.dataIndex ] === true }
				content={ (typeof props.valueRender === 'function' ? props.valueRender(value, props.original) : value) as string }
				update={ value => { handleChange(value) } }
			/>
			break

		case XFormItemType.radio:
			content = <Radio.Group
				disabled={ props.disabled?.(props.original) === true || (props.readonlyMaps as any)[ props.dataIndex ] === true }
				id={ props.dataIndex as string }
				value={ typeof props.valueRender === 'function' ? props.valueRender(value, props.original) : value }
				onChange={ e => { handleChange(e.target.value) } }
			>
				{
					(typeof props.optionsFilter === 'function' ? props.optionsFilter(props.original, props.options) : props.options)?.map(
						(item, key) => <Radio key={ key } value={ item.value }>{ item.title }</Radio>
					)
				}
			</Radio.Group>
			break

		case XFormItemType.checkbox:
			content = <CCheckbox
				fetchRowComplete={ props.fetchRowComplete }
				dataIndex={ props.dataIndex }
				disabled={ () => props.disabled?.(props.original) === true || (props.readonlyMaps as any)[ props.dataIndex ] === true }
				original={ props.original }
				options={ typeof props.optionsFilter === 'function' ? props.optionsFilter(props.original, props.options) : props.options }
				handleChange={ handleChange }
				valueRender={ props.valueRender }
				value={ value }
				simple={ props.simple }
			/>
			break

		case XFormItemType.select:
			content = <Select
				loading={ loading }
				disabled={ props.disabled?.(props.original) === true || (props.readonlyMaps as any)[ props.dataIndex ] === true }
				id={ props.dataIndex as string }
				mode={ props.multiple === true ? 'multiple' : undefined }
				value={ typeof props.valueRender === 'function' ? props.valueRender(value, props.original) : value }
				placeholder={ props.placeholder !== undefined ? (typeof props.placeholder === 'function' ? props.placeholder(props.original) : props.placeholder) : `请设置${ props.label }` }
				onChange={ value => { handleChange(value) } }
				options={ typeof props.antOptionsFilter === 'function' ? props.antOptionsFilter(props.original, toSelectOptionType(props.options ?? [])) : toSelectOptionType(props.options ?? []) }
			/>
			break

		case XFormItemType.treeSelect:
			content = <TreeSelect
				loading={ loading }
				disabled={ props.disabled?.(props.original) === true || (props.readonlyMaps as any)[ props.dataIndex ] === true }
				id={ props.dataIndex as string }
				multiple={ props.multiple }
				treeData={ typeof props.optionsFilter === 'function' ? props.optionsFilter(props.original, props.options) : props.options }
				defaultOpen={ props.defaultOpen }
				treeDefaultExpandAll={ props.treeDefaultExpandAll }
				value={ typeof props.valueRender === 'function' ? props.valueRender(value, props.original) : value }
				placeholder={ props.placeholder !== undefined ? (typeof props.placeholder === 'function' ? props.placeholder(props.original) : props.placeholder) : `请设置${ props.label }` }
				onChange={
					value => {
						if (Array.isArray(value)) {
							handleChange(value.filter(item => item !== 0))
						} else {
							handleChange(value)
						}
					}
				}
			/>
			break

		case XFormItemType.switch:
			content = <Switch
				loading={ loading }
				id={ props.dataIndex as string }
				disabled={ props.disabled?.(props.original) === true || (props.readonlyMaps as any)[ props.dataIndex ] === true }
				value={ typeof props.valueRender === 'function' ? props.valueRender(value, props.original) : value }
				onChange={
					v => {
						let checked: any = v
						if (typeof value === 'boolean') {
							checked = v
						} else if (typeof value === 'string') {
							checked = v ? '1' : '0'
						} else if (typeof value === 'number') {
							checked = v ? 1 : 0
						}

						handleChange(checked)
					}
				}
			/>
			break

		case XFormItemType.colorPicker:
			content = <ColorPicker
				disabled={ props.disabled?.(props.original) === true || (props.readonlyMaps as any)[ props.dataIndex ] === true }
				defaultValue={ value }
				onChange={ value => { handleChange(value.toHex()) } }
			/>
			break

		case XFormItemType.datePicker:
			content = <DateComponent
				{ ...datePickerParams }
				id={ props.dataIndex as string }
				value={ timestampToDayjs(value) }
				multiple={ props.multiple }
				placeholder={ props.placeholder !== undefined ? (typeof props.placeholder === 'function' ? props.placeholder(props.original) : props.placeholder) : `请设置${ props.label }` }
				onChange={
					v => {
						let data: any
						if (props.timestampStyle !== undefined) {
							data = v.unix()
							if (props.timestampStyle === 'milli') {
								data = data * 1000
							}
						} else {
							if (props.dateFormat !== undefined) {
								data = v.format(props.dateFormat)
							} else {
								data = v.format('YYYY-MM-DD HH:mm:ss')
							}
						}
						handleChange(data)
					}
				}
			/>
			break

		case XFormItemType.dateRangePicker:
			content = <DatePicker.RangePicker
				id={ props.dataIndex as string }
				readOnly={ props.disabled?.(props.original) === true || (props.readonlyMaps as any)[ props.dataIndex ] === true }
				{ ...datePickerParams }
				value={ makeRangePickerValue(value) }
				onChange={
					v => {
						const data = convertToRangeValue(v)
						if (data === null) {
							return
						}

						if (!Array.isArray(value)) {
							handleChange([ data[ 0 ].unix(), data[ 1 ].unix() ])
							return
						}

						let start: any = null
						let end: any = null
						value.forEach(
							(_, key) => {
								if (props.timestampStyle !== undefined) {
									if (key === 0) {
										start = data[ 0 ].unix()
									} else {
										end = data[ 1 ].unix()
									}
									// if (item.toString().length === 13) {
									//	 if (key === 0) {
									//		 start = start * 1000
									//	 } else {
									//		 end = end * 1000
									//	 }
									// }

									if (props.timestampStyle === 'milli') {
										if (key === 0) {
											start = start * 1000
										} else {
											end = end * 1000
										}
									}
								} else {
									if (props.dateFormat !== undefined) {
										if (key === 0) {
											start = data[ 0 ].format(props.dateFormat)
										} else {
											end = data[ 1 ].format(props.dateFormat)
										}
									} else {
										if (key === 0) {
											start = data[ 0 ].format('YYYY-MM-DD HH:mm:ss')
										} else {
											end = data[ 1 ].format('YYYY-MM-DD HH:mm:ss')
										}
									}
								}
							}
						)

						handleChange([ start, end ])
					}
				}
			/>
			break

		case XFormItemType.fileUpload:
			content = <FileUpload
				{ ...props }
				value={ typeof props.valueRender === 'function' ? props.valueRender(value, props.original) : value }
				id={ props.dataIndex as string }
				handleChange={ handleChange }
			/>
			break

		case XFormItemType.readonly:
		case XFormItemType.custom:
			if (props.render === undefined) {
				content = <span>{ value }</span>
			} else {
				content = props.render({ ...props, handleChange, value })
			}
			break

		case XFormItemType.password:
			content = <Input.Password
				id={ props.dataIndex as string }
				allowClear
				suffix={ loading ? <Spin size="small" /> : null }
				disabled={ props.disabled?.(props.original) === true || (props.readonlyMaps as any)[ props.dataIndex ] === true }
				value={ typeof props.valueRender === 'function' ? props.valueRender(value, props.original) : value }
				prefix={ props.prefix ?? <Icon><LockIcon /></Icon> }
				visibilityToggle={ { visible: false } }
				onChange={ e => { handleChange(e.target.value) } }
				placeholder={ props.placeholder !== undefined ? (typeof props.placeholder === 'function' ? props.placeholder(props.original) : props.placeholder) : `请设置${ props.label }` }
			/>
			break

		default:
			if (props.autoCompleteOptions !== undefined) {
				content = <AutoComplete
					options={
						props.autoCompleteOptions.map(
							item => ({
								label: item.title,
								value: item.value
							})
						)
					}
					onSearch={ v => { handleChange(props.autoCompleteAfter !== undefined ? props.autoCompleteAfter(v, props.original) : v) } }
					id={ props.dataIndex as string }
					allowClear
					disabled={ props.disabled?.(props.original) === true || (props.readonlyMaps as any)[ props.dataIndex ] === true }
					value={ typeof props.valueRender === 'function' ? props.valueRender(value, props.original) : value }
					onChange={ value => { handleChange(value) } }
					placeholder={ props.placeholder !== undefined ? (typeof props.placeholder === 'function' ? props.placeholder(props.original) : props.placeholder) : `请设置${ props.label }` }
				/>
			} else {
				content = <Input
					id={ props.dataIndex as string }
					allowClear
					suffix={ loading ? <Spin size="small" /> : null }
					disabled={ props.disabled?.(props.original) === true || (props.readonlyMaps as any)[ props.dataIndex ] === true }
					value={ typeof props.valueRender === 'function' ? props.valueRender(value, props.original) : value }
					prefix={ props.prefix }
					onChange={ e => { handleChange(e.target.value) } }
					placeholder={ props.placeholder !== undefined ? (typeof props.placeholder === 'function' ? props.placeholder(props.original) : props.placeholder) : `请设置${ props.label }` }
				/>
			}
	}

	if (props.dynamicAddOption !== undefined) {
		content = <div className="form-item-with-dynamic-add-options-box">
			<div className="item">{ content }</div>
			<div className="item blue">
				{ props.dynamicAddOption({ data: props.original }) }
			</div>
		</div>
	}

	if (props.explain !== undefined) {
		content = <div className="form-item-explain-box">
			<div className="item">{ content }</div>
			<div className="item">
				{ props.explain({ data: props.original }) }
			</div>
		</div>
	}

	return <div className="h100" style={ props.width !== undefined ? { width: props.width } : undefined }>{ content }</div>
}

export default Main
