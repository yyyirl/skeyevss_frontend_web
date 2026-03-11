import React, { type ReactElement, useEffect } from 'react'
import { Button, Select, Spin } from 'antd'
import type { PopupItemContentParamsType } from '#types/ant.form.d'
import useFetchState from '#repositories/models'
import { MessageType, MMessage } from '#components/hint'
import { type Item } from './model'
import { Row } from './api'

export const CatLog = (props: PopupItemContentParamsType<Item>): ReactElement => {
	const [ pageSize, setPageSize ] = useFetchState(50)
	const [ page, setPage ] = useFetchState(0)
	const [ content, setContent ] = useFetchState<string[]>([])
	const [ loading, setLoading ] = useFetchState(true)
	const [ finish, setFinish ] = useFetchState(false)

	const fetch = (): void => {
		setLoading(true)
		setTimeout(
			() => {
				void Row(props.data?.path ?? '', page, pageSize).then(
					res => {
						if (res.data === null) {
							setFinish(true)
							MMessage({
								message: '已全部加载完成',
								type: MessageType.success
							})
						}
						setContent([ ...content, ...(res.data ?? []) ])
					}
				).finally(
					() => {
						setLoading(false)
					}
				)
			},
			200
		)
	}

	useEffect(fetch, [])

	return <Spin className="logs-box" spinning={ loading }>
		<div style={ { minHeight: 300 } } dangerouslySetInnerHTML={ { __html: content.length <= 0 ? '无内容' : content.join('<br />') } } />
		<div className="footer">
			<Button htmlType="button" onClick={ props.close } style={ { marginRight: 20 } }>取消</Button>
			<Button
				type="primary"
				onClick={
					() => {
						setPage(page + 1)
						fetch()
					}
				}
				loading={ loading }
				style={ { marginRight: 20 } }
				disabled={ finish }
			>加载更多</Button>
			<Select
				showSearch
				value={ pageSize }
				style={{ width: 80 }}
				optionFilterProp="label"
				onChange={ setPageSize }
				options={[
					{
						value: 50,
						label: '50'
					},
					{
						value: 100,
						label: '100'
					},
					{
						value: 200,
						label: '200'
					}
				]}
			/>
		</div>
	</Spin>
}
