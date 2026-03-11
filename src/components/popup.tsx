import React from 'react'
import { Modal } from 'antd'
import { execFunc } from '#utils/functions'

interface ConfirmProps {
	content: string | React.ReactElement
}

/**
 * confirm
 * @param content
 * @constructor
 */
export const Confirm: React.FC<ConfirmProps> = ({ content }) => <div className="confirm-popup">
	<div className="p-content">
		{ content }
	</div>
</div>

interface ModalsProps {
	// 显示隐藏
	visible?: boolean
	setVisible?: (v: boolean) => void
	// 确认
	ok?: () => void
	// 取消
	cancel?: () => void
	// 标题
	title?: string
	// 内容区域
	content: React.ReactElement
	// 底部内容区域
	footer?: React.ReactElement
	width?: number
	className?: string
	maskClosable?: boolean
	destroyOnHidden?: boolean
}

/**
 * 模态框
 * @param props
 * @constructor
 */
export const CModals: React.FC<ModalsProps> = (
	{
		// 显示隐藏
		visible,
		setVisible,
		// 确认
		ok,
		// 取消
		cancel,
		// 标题
		title,
		// 内容区域
		content,
		// 底部内容区域
		footer,
		width,
		className,
		maskClosable,
		destroyOnHidden
	}
) => {
	const onOk = (e: React.MouseEvent<HTMLButtonElement>): void => {
		execFunc(ok)
		execFunc(setVisible, false)
	}

	/**
	 * 确认
	 */
	const onCancel = (e: React.MouseEvent<HTMLButtonElement>): void => {
		execFunc(cancel)
		execFunc(setVisible, false)
	}

	const afterClose = (): void => {
		execFunc(setVisible, false)
	}

	return <Modal
		title={ title }
		centered
		open={ visible }
		onOk={ onOk }
		onCancel={ onCancel }
		footer={ footer }
		width={ width }
		className={ className ?? '' }
		maskClosable={ maskClosable }
		destroyOnHidden={ destroyOnHidden }
		afterClose={ afterClose }
	>{ content }</Modal>
}
