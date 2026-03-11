import React, { type ReactElement, useEffect, useRef } from 'react'
import { useHistory } from 'react-router-dom'
import type { Callbacks } from 'rc-field-form/lib/interface'
import { Button, Form, Spin } from 'antd'
import { createAnchors, replaceWithCreateAnchor } from '#routers/anchor'
import { hintError } from '#utils/err-hint'
import type { RowDataType } from '#types/base.d'
import type { FormItemProps, SetterMapsType, XFormItems, XFormProps } from '#types/ant.form.d'
import useFetchState from '#repositories/models'
import { type UpdateItem } from '#repositories/types/request'
import { MessageType, MMessage } from '#components/hint'
import Items from './items'

const Main = <T extends RowDataType>(props: XFormProps<T>): ReactElement => {
	const history = useHistory()
	// const formName = `form-${ uniqueId() }`
	// 表单类型
	type formTypes = XFormItems<T>
	const setterMaps = useRef<SetterMapsType<T>>({} as unknown as SetterMapsType<T>)
	const formColumnInstance = useRef<{ [ key: string ]: FormItemProps<T> }>({})
	// loading
	const [ loading, setLoading ] = useFetchState(false)
	// 详情是否获取完成
	const fetchRowComplete = useRef<boolean | null>(null)
	// 提交加载
	const [ submitLoading, setSubmitLoading ] = useFetchState(false)
	// 默认数据
	const [ data, setData ] = useFetchState<formTypes>(
		(props.renderRecord !== undefined ? props.renderRecord?.({} as any as formTypes) : {}) as formTypes
	)
	// 获取详情原始数据
	const fetchOriginalData = useRef<T | null>(null)
	// 表单
	const [ form ] = Form.useForm()
	// hidden
	const [ hiddenMaps, setHiddenMaps ] = useFetchState<Partial<{ [ key in keyof T ]: boolean }>>({})
	const hiddenMapsRef = useRef<Partial<{ [ key in keyof T ]: boolean }>>({})
	// hidden
	const [ readonlyMaps, setReadonlyMaps ] = useFetchState<Partial<{ [ key in keyof T ]: boolean }>>({})
	const readonlyMapsRef = useRef<Partial<{ [ key in keyof T ]: boolean }>>({})
	// 设置字段值
	const handleSetFieldValue: (key: keyof T, value: any) => void = (column, value): void => {
		data[ column ] = value
		form.setFieldsValue(data)
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		setterMaps.current[ column ]?.(value)
	}
	// 提交
	const submit = (values: T): void => {
		if (hintError()) {
			return
		}

		const call = (): void => {
			setSubmitLoading(true)
			if (props.data === null) {
				// 创建
				void props.create?.({
					record: typeof props.beforeCreateTransformData === 'function'
						? props.beforeCreateTransformData(values, props.records ?? [])
						: values
				}).then(
					() => {
						MMessage({
							message: '创建成功',
							type: MessageType.success
						})
						// 重新获取数据
						props.complete?.(values)
						// 关闭弹窗
						props.close()

						// 删除anchor
						let anchorIsSet = false
						createAnchors.forEach(
							item => {
								if (window.location.href.indexOf(item) > 0) {
									anchorIsSet = true
								}
							}
						)

						if (anchorIsSet) {
							history.push(replaceWithCreateAnchor(window.location.href))
						}
					}
				).finally(
					() => {
						setSubmitLoading(false)
					}
				)
			} else {
				// 更新
				const records: Array<UpdateItem<T>> = []
				for (const column in values) {
					const item = values[ column ]
					if (item === undefined || item === null) {
						continue
					}
					records.push({ column: column as keyof T, value: item })
				}
				const data = typeof props.beforeUpdateTransformData === 'function' ? props.beforeUpdateTransformData(records) : records
				void props.update?.({
					conditions: [
						{
							column: props.data?.primaryKeyColumn() as keyof T,
							value: props.data?.primaryKeyValue()
						}
					],
					data
				}).then(
					() => {
						MMessage({
							message: '更新成功',
							type: MessageType.success
						})

						props.afterUpdateCompletion?.(props.data, records)
						// 设置列表
						if (props.records !== undefined && props.records !== null) {
							const tmp: any = { ...values }
							if (props.data !== undefined && props.data?.primaryKeyColumn !== undefined) {
								tmp[ props.data.primaryKeyColumn() ] = props.data?.primaryKeyValue()
							}

							const v = props.afterUpdateTransformData(tmp as object)
							props.setRecords?.([
								...props.records.map(
									item => {
										if (item.primaryKeyValue() === props.data?.primaryKeyValue()) {
											data.forEach(
												val => {
													item[ val.column ] = v[ val.column ]
												}
											)
										}

										return item
									}
								)
							])
						}
						// 关闭弹窗
						props.close()
						if (fetchOriginalData.current !== null) {
							props.updateCompletion?.(
								props.convToItem({ ...fetchOriginalData.current }),
								props.convToItem({ ...fetchOriginalData.current, ...values })
							)
						}
					}
				).finally(
					() => {
						setSubmitLoading(false)
					}
				)
			}
		}
		if (props.beforeSubmit !== undefined) {
			props.beforeSubmit(values, props.data?.primaryKeyValue(), call)
			return
		}
		call()
	}
	// 失败
	const onFinishFailed: Callbacks<T>['onFinishFailed'] = () => {
		setSubmitLoading(false)
	}

	const columns = props.renderColumns !== undefined ? props.renderColumns(data) : props.columns ?? []

	useEffect(
		() => {
			// formIdRef.current = `form-${ uniqueId() }`
			if (props.data === undefined || props.data === null) {
				return
			}

			// 获取详情
			fetchRowComplete.current = false
			setLoading(true)
			void props.fetchRow<T>?.(props.data.primaryKeyValue()).then(
				res => {
					setLoading(false)
					if (res.data === undefined || res.data === null) {
						return
					}

					const data = props.renderRecord !== undefined ? props.renderRecord?.(res.data) : res.data
					fetchOriginalData.current = props.convToItem({ ...data })
					fetchRowComplete.current = true
					form.setFieldsValue(data)
					setData((data ?? {}) as formTypes)
					props.afterFetchRow?.(data, data => { setData((data ?? {}) as formTypes) })
				}
			)
		},
		[]
	)

	const labelColSpan = (props.wrapperCol?.span as number) ?? 5
	const contentColSpan = 24 - labelColSpan

	return <Spin spinning={ loading }>
		<Form
			// name={ formName }
			form={ form }
			onFinish={ submit }
			// initialValues={ { ...data as formTypes } }
			autoComplete="on"
			onFinishFailed={ onFinishFailed }
			labelAlign="left"
			labelWrap
			labelCol={ { span: labelColSpan } }
			wrapperCol={ { flex: 1 } }
			colon={ false }
			className={ `form-container ${ props.className ?? '' }` }
		>
			{
				columns.filter(
					item => {
						if ((hiddenMaps as any)[ item.dataIndex ] === true) {
							return false
						}

						if (item.hidden !== undefined) {
							return typeof item.hidden === 'function' ? !item.hidden(data) : !item.hidden
						}

						return true
					}
				).map(
					(item, key) => {
						const itemProps: FormItemProps<T> = {
							...item,
							fetchRowComplete,
							setFieldValue: handleSetFieldValue,
							original: data as T,
							columns,
							hiddenMaps,
							setHiddenMaps: (v, useCurrent) => {
								if (useCurrent === true) {
									const maps = { ...hiddenMapsRef.current, ...v }
									setHiddenMaps(maps)
									hiddenMapsRef.current = maps
									return
								}
								setHiddenMaps(v)
								hiddenMapsRef.current = v
							},
							readonlyMaps,
							setReadonlyMaps: (v, useCurrent) => {
								if (useCurrent === true) {
									const maps = { ...readonlyMapsRef.current, ...v }
									setReadonlyMaps(maps)
									readonlyMapsRef.current = maps
									return
								}
								setReadonlyMaps(v)
								readonlyMapsRef.current = v
							},
							setterMaps: setterMaps.current,
							formColumnInstance: formColumnInstance.current
						}
						formColumnInstance.current[ item.dataIndex as string ] = itemProps

						const content = <Form.Item<formTypes>
							wrapperCol={ { span: contentColSpan } }
							key={ key }
							label={ item.label }
							name={ item.dataIndex as any }
							rules={
								typeof item.rules === 'function'
									? item.rules({
										record: data,
										original: props.data as T | undefined,
										setLoading: setSubmitLoading
									})
									: item.rules
							}
							className={ item.type }
							// hidden={ (hiddenMaps as any)[ item.dataIndex ] === true }
						><Items{ ...itemProps } /></Form.Item>

						if (item.sightless !== undefined) {
							if ((typeof item.sightless === 'function' && item.sightless(data as T)) || item.sightless === true) {
								return <div className="hidden" key={ key }>{ content }</div>
							}
						}

						return content
					}
				)
			}
			{
				props.hiddenFooter === true
					? ''
					: <Form.Item wrapperCol={ { offset: 16, span: 8 } }>
						<Button htmlType="button" onClick={ props.close } style={ { marginRight: 20 } }>取消</Button>
						<Button type="primary" htmlType="submit" loading={ submitLoading }>{ props.submitText ?? '提交' }</Button>
					</Form.Item>
			}
		</Form>
	</Spin>
}

export default Main