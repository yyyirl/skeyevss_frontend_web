import store from '#utils/store'
import { execFunc, isEmpty, isObject } from '#utils/functions'
import type { Response } from '#types/axios.d'
import { type TokenType } from '#repositories/types/local-store'
import { variables } from '#constants/appoint'
import { MessageType, MMessage } from '#components/hint'
import { profileCheck } from '#repositories/models/recoil-state'

// const authorizationKey: string = 'user'

/**
 * 存储token
 * @param type
 * @param data
 */
export function authorization(type: string, data?: TokenType): TokenType | null {
	if (type === 'set') {
		store.set('user', data)
		return data as TokenType | null
	}

	const results = store.get('user')
	if (!isObject(results) || isEmpty(results)) {
		store.remove('user')
		return null
	}

	const res = results as TokenType
	if (new Date().valueOf() / 1000 > (res.expires ?? 0)) {
		store.remove('user')
		return null
	}

	return res
}

export function tokenRenewal(data: Response<any>): void {
	const { token, timestamp, logout, code } = data
	if (code === 1000013 || code === 1000014) {
		// ip被封
		// if (window.location.pathname !== Routes.banned) {
		//	 window.location.href = Routes.banned
		// }
	}

	if (isEmpty(data)) {
		return
	}

	if (logout === true) {
		MMessage({
			message: '账号已在他处登录',
			type: MessageType.warning
		})

		profileCheck.neededUpdate = true
		clearCache()
	}

	variables.timestamp = timestamp ?? 0
	const results = store.get('user')
	if (!isEmpty(results)) {
		return
	}

	if (token !== '' && token !== undefined) {
		const res = results as TokenType
		res.token = token
		void authorization('set', res)
	}
}

interface LogoutProps {
	useShowCase?: boolean
	locationSign: boolean
	callback?: () => void
}

/**
 * 退出登录清除所有缓存
 * @param locationSign
 * @param callback
 * @param useShowCase
 * @constructor
 */
export function logout({ locationSign, callback, useShowCase }: LogoutProps): void {
	// 清除缓存
	clearCache()
	if (!locationSign) {
		return
	}

	execFunc(callback)
	if (useShowCase === true) {
		window.location.href = '/login?showcase=1'
		return
	}
	window.location.href = '/login'
}

export function clearCache(): void {
	store.remove('user')
}