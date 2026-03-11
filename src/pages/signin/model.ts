import type { Rule } from 'rc-field-form/lib/interface'
import type { Profile } from '#repositories/models/recoil-state'
import { authorization } from '#utils/token'
import type { TokenType } from '#repositories/types/local-store'
import { execFunc } from '#utils/functions'
import { LastRoute } from '#components/location'
import { type HistoryType } from '#repositories/types/foundation'

export const passwordRule = (message: string): Rule[] => [
	{ required: true, message }
]

export const usernameRule = (message: string): Rule[] => [
	{ required: true, message }
]

export const wrapperCol = { offset: 3, span: 18 }

export interface LoginReqType {
	username: string
	password: string
	remember?: boolean

	// dots: CoordinatesList
	// key: string
}

export interface LoginResp {
	expire: number
	email: string
	head: string
	id: number
	nickname: string
	token: string
	depIds: number[]
	username: string
}

export interface LoginFieldType {
	username: string
	password: string
	remember?: boolean
}

export interface LoginSuccessParams {
	history: HistoryType
	data: LoginResp
	profile: Profile
	callback?: () => void
}

// 登录成功回调
export const success = ({ history, data, profile, callback }: LoginSuccessParams): void => {
	const state: TokenType = {
		token: data.token,
		expires: data.expire,
		avatar: data.head,
		nickname: data.nickname,
		username: data.username,
		email: data.email,
		depIds: data.depIds,
		id: data.id
	}
	void authorization('set', state)
	profile.set(state)
	execFunc(callback, state)
	history.push(LastRoute('get') ?? '/')
}
