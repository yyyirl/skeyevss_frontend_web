import React from 'react'
import { Modal, message } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { execFunc, isUndefined } from '#utils/functions'
import { Confirm as ConfirmTmp } from './popup'
import { variables } from '#constants/appoint'

type closureType = () => void

export enum MessageType {
	info = 'info',
	success = 'success',
	error = 'error',
	warning = 'warning',
	loading = 'loading'
}

interface AlertProps {
	success?: closureType
	message: string | React.ReactElement
	width?: number
	className?: string
	type?: MessageType
}

export const Alert = ({ success, message, width, className }: AlertProps): void => {
	const m = Modal.confirm({
		keyboard: false,
		onOk: () => {
			m.destroy()
			execFunc(success)
		},
		onCancel: () => {
			m.destroy()
			execFunc(success)
		},
		icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
		title: null,
		content: <ConfirmTmp content={ message }/>,
		okText: '确认',
		className: `confirm-popup-con ${ className ?? '' }`,
		centered: true,
		width,
		cancelText: null,
		okCancel: false,
		styles: variables.modalStyles.modalStyles,
		okButtonProps: { style: variables.modalStyles.okButtonStyles ?? {} },
		cancelButtonProps: { style: variables.modalStyles.cancelButtonStyles ?? {} }
	})
}

export interface ModalsProps {
	// 显示隐藏
	visible?: boolean
	setVisible?: (v: boolean) => void
	// 确认
	ok?: closureType
	// 取消
	cancel?: closureType
	// 标题
	title?: string
	// 内容区域
	content: React.ReactElement
	// 底部内容区域
	footer?: React.ReactElement
	width?: number | string
	height?: number | string
	className?: string
	maskClosable?: boolean
	destroyOnHidden?: boolean
	centered?: boolean
}

/**
 * 模态框
 * @param props
 * @constructor
 */
export const Modals: React.FC<ModalsProps> = props => {
	const {
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
		destroyOnHidden,
		centered,
		height
	} = props
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
		centered={ isUndefined(centered) ? true : centered }
		open={ visible }
		onOk={ onOk }
		onCancel={ onCancel }
		keyboard={ true }
		footer={ footer ?? null }
		width={ width }
		height={ height }
		className={ className ?? '' }
		maskClosable={ maskClosable }
		destroyOnHidden={ destroyOnHidden }
		afterClose={ afterClose }
	>{ content }</Modal>
}

interface ConfirmProps {
	// 确认
	success: closureType
	// 取消
	cancel?: closureType
	// 内容区域
	content: string | React.ReactElement
	// 标题
	title?: string
	icon?: React.ReactElement
	cancelText?: string
	okText?: string
	closable?: boolean
}

/**
 * confirm
 * @param success 确认
 * @param cancel 取消
 * @param title 标题
 * @param content 内容区域
 * @param icon 图标
 * @param cancelText 取消按钮文字
 * @param okText 确认按钮文字
 * @param closable 空白区域是否可关闭
 * @constructor
 */
export const Confirm = (
	{
		success,
		cancel,
		title,
		content,
		icon,
		cancelText,
		okText,
		closable
	}: ConfirmProps
): boolean => {
	const m = Modal.confirm({
		keyboard: true,
		onOk: () => {
			m.destroy()
			execFunc(success)
		},
		onCancel: () => {
			m.destroy()
			execFunc(cancel)
		},
		icon,
		title,
		content: <ConfirmTmp content={ content }/>,
		cancelText: cancelText ?? '取消',
		okText: okText ?? '确认',
		className: 'confirm-popup-con',
		// 垂直居中
		centered: true,
		closable: closable ?? true,
		styles: variables.modalStyles.modalStyles,
		okButtonProps: { style: variables.modalStyles.okButtonStyles ?? {} },
		cancelButtonProps: { style: variables.modalStyles.cancelButtonStyles ?? {} }
	})

	return true
}

interface MMessageProps {
	message: string
	type: MessageType
	duration?: number
	onClose?: closureType
	icon?: React.ReactElement
	className?: string
	style?: React.CSSProperties
}

/**
 * 轻提示
 * @param msg
 * @param type
 * @param duration
 * @param onClose
 * @param icon
 * @param className
 * @param style
 * @returns {boolean}
 */
export const MMessage = (
	{
		message: msg,
		type,
		duration,
		onClose,
		icon,
		className,
		style
	}: MMessageProps
): boolean => {
	// 定时器解决由于生命周期的问题
	setTimeout(() => {
		const key = type ?? 'warning'
		void message.open({
			content: msg ?? 'no information',
			duration: duration ?? 3,
			onClose,
			icon,
			type: key,
			className,
			style
		})
	})

	return true
}
//
// /**
//  * 关闭message弹窗
//  * @param key
//  */
// export const closeMessage = (key: boolean | string): void => {
//	 if (key as boolean) {
//		 message.destroy()
//		 return
//	 }
//
//	 message.destroy(key as string)
// }