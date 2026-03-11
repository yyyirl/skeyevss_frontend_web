import { copyToClipboard } from '#utils/functions'
import React from 'react'
import { Tooltip } from 'antd'
import { MessageType, MMessage } from '#components/hint'

interface PropsType {
	text: string
	children: React.ReactElement | string
	className?: string
}

const Main: React.FC<PropsType> = ({ children, text, className }) => {
	return <Tooltip
		title="点击复制"
		arrow={ true }
	>
		<span className={ `cursor-pointer ${ className ?? '' }` } title={ text } onClick={
			() => {
				copyToClipboard(text)
				MMessage({
					message: '复制成功',
					type: MessageType.success
				})
			}
		}>{ children }</span>
	</Tooltip>
}

export default Main