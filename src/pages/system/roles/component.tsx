import React, { type ReactElement } from 'react'
import { Button, Input, Space } from 'antd'
import { type OptionItem } from '#types/base.d'
import { type ExpandableProps } from '#types/ant.table.d'
import useFetchState from '#repositories/models'
import { type Item } from './model'
import { MessageType, MMessage } from '#components/hint'
import { CCheckbox } from '#components/form/items'

const { TextArea } = Input

interface SubmitParams {
	column: keyof Item
	value: any
}

interface CExpandableProps extends ExpandableProps<Item> {
	permissions: OptionItem[]
}

export const RowExpandable = (props: CExpandableProps): ReactElement => {
	const [ loadings, setLoadings ] = useFetchState<{ [key: string]: boolean }>({
		remark: false
	})
	const [ remark, setRemark ] = useFetchState(props.record.remark)
	const [ permissionUniqueIds, setPermissionUniqueIds ] = useFetchState(props.record.permissionUniqueIds)

	const submit = ({ column, value }: SubmitParams): void => {
		if (props.update !== undefined) {
			setLoadings({ ...loadings, [ column ]: true })
			void props.update<Item>({
				conditions: [ { column: props.record.primaryKeyColumn(), value: props.record.primaryKeyValue() } ],
				data: [ { column, value } ]
			}).then(
				() => {
					// 更新列表
					MMessage({
						message: '更新成功',
						type: MessageType.success
					})
					// 设置列表
					if (props.records !== undefined && props.records !== null) {
						switch (column) {
							case 'remark':
								props.record.remark = value
							break
							default:
						}
						props.setRecords?.([
							...props.records.map(
								item => {
									if (item.primaryKeyValue() === props.record.primaryKeyValue()) {
										return props.record
									}

									return item
								}
							)
						])
					}
				}
			).finally(
				() => {
					setLoadings({ ...loadings, [ column ]: false })
				}
			)
		}
	}

	return <div className="expandable-container">
		<Space align="end" className="w100">
			<span className="title">备注:</span>
			<TextArea
				style={{ resize: 'none' }}
				placeholder="请输入备注"
				rows={ 6 }
				onChange={ e => { setRemark(e.target.value) } }
			/>
			<Button type="primary" loading={ loadings.remark } onClick={ () => { submit({ column: 'remark', value: remark }) } }>提交</Button>
		</Space>
		<Space align="end" className="w100">
			<span className="title">权限:</span>
			<div className="checkbox-group-box">
				<CCheckbox<Item>
					dataIndex="permissionUniqueIds"
					original={ props.record }
					options={ props.permissions }
					handleChange={ val => { setPermissionUniqueIds(val as string[]) } }
					value={ permissionUniqueIds }
				/>
			</div>
			<Button type="primary" loading={ loadings.remark } onClick={ () => { submit({ column: 'permissionUniqueIds', value: permissionUniqueIds }) } }>提交</Button>
		</Space>
	</div>
}
