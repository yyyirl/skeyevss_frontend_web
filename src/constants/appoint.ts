import { type OptionItem } from '#types/base.d'
import { type ModalStyles } from 'rc-dialog/lib/IDialogPropTypes'
import { type CSSStyle } from '#repositories/types/foundation'

export const DEV_ENV = 'development'

export const themeDark = 'dark'
export const themeLight = 'light'

interface Variables {
	loginPopupSign: boolean
	timestamp: number
	popConfirm: boolean
	showcase?: boolean
	licenseError?: string
	channelUnlimited?: boolean
	modalStyles: {
		modalStyles: ModalStyles
		okButtonStyles: CSSStyle
		cancelButtonStyles: CSSStyle
	}
	downloadFileState: { [ key: string ]: boolean }
}

export const variables: Variables = {
	loginPopupSign: false,
	timestamp: new Date().valueOf() / 1000,
	popConfirm: false,
	modalStyles: {
		modalStyles: {},
		okButtonStyles: {},
		cancelButtonStyles: {}
	},
	downloadFileState: {}
}

/**
 * 默认分页条数
 * @type {number}
 */
export const defaultLimit = 20
export const defaultLimit1 = 16
export const defaultManyLimit = 40

/**
 * 格式化时间
 * @type {string}
 */
export const dateFormat = 'YYYY-MM-DD HH:mm:ss'
export const dateFormatHis = 'HH:mm:ss'
export const dateFormatYmd = 'YYYY-MM-DD'
export const dateFormat1 = 'YYYY/MM/DD HH:mm'
export const dateFormat2 = 'YYYY/MM/DD'
export const dateFormat3 = 'YYYY年MM月DD日'
export const dateFormat4 = 'DD日'
export const dateFormatHis1 = 'HH:mm'

// 显示条数选择
export const defPageSize = 20
export const pageSizeOptions = [ 10, 16, defPageSize, 30, 40, 50, 80, 100, 200 ]

export enum SortBy {
	desc = 'desc',
	asc = 'asc'
}

export const deleteOptions: OptionItem[] = [
	{ title: '未删除', value: 0 },
	{ title: '已删除', value: 1 }
]

export const genderOptions: OptionItem[] = [
	{ title: '未知', value: 0 },
	{ title: '男', value: 1 },
	{ title: '女', value: 2 }
]

export const stateOptions: OptionItem[] = [
	{ title: '已启用', value: 1 },
	{ title: '未启用', value: 0 }
]

export const onlineOptions: OptionItem[] = [
	{ title: '在线', value: 1 },
	{ title: '不在线', value: 0 }
]

export const okOptions: OptionItem[] = [
	{ title: '是', value: 1 },
	{ title: '否', value: 0 }
]
export const defOption: OptionItem = { title: '未设置', value: 0, disabled: true }

export const resetPwdHash = '#reset-password'
export const showcaseHash = '#showcase'

export const smsIPDef = 'default'

export const LicenseErrorHint = '请激活'

const presets = [
	'magenta',
	'red',
	'volcano',
	'orange',
	'gold',
	'lime',
	'green',
	'cyan',
	'blue',
	'geekblue',
	'purple'
]
export const pickColor = (index: number): string => presets[ index % presets.length ]

export const tagVariants = [ 'filled', 'solid', 'outlined' ] as const

export const defMapCenterPoints: [ number, number ] = [ 35.0, 105.0 ]