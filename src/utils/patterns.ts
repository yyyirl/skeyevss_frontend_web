/**
 * 检测是否是手机号码
 * @param val
 * @return {boolean}
 */
export function isPhone(val: string): boolean {
	return /^(((13[0-9])|(14[0-9])|(15[0-9])|(16[0-9])|(17[0-9])|(18[0-9])|(19[0-9]))+\d{8})$/.test(val)
}

/**
 * 检测是否是邮箱
 * @param val
 * @return {boolean}
 */
export function isEmail(val: string): boolean {
	return /^([a-zA-Z0-9]+[-_|_|.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[-_|_|.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/.test(val)
}

/**
 * 检测是否是qq
 * @param val
 * @return {boolean}
 */
export function isQQ(val: string): boolean {
	return /^[1-9]\d{4,10}$/.test(val)
}

/**
 * 检测密码
 * @param password
 * @return {boolean}
 */
export function isPassword(password: string): boolean {
	const hasLetter = /[a-zA-Z]/.test(password)
	const hasDigit = /\d/.test(password)
	const hasSpecial = /[^a-zA-Z0-9]/.test(password)
	const categories = [ hasLetter, hasDigit, hasSpecial ].filter(Boolean).length
	return categories >= 2
}

/**
 * 检测unique id
 * @param id
 */
export function isSevUniqueId(id: string): boolean {
	return /^[a-z0-9]{20}$/.test(id)
}

/**
 * 首位空白字符
 * @param val
 */
export function bothEndsSpace(val: string): boolean {
	return !/^\S.*\S$|(^\S{0,1}\S$)/.test(val)
}
