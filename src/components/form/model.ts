import type { Rule } from 'rc-field-form/lib/interface'
import { isEmpty } from '#utils/functions'
import type { RejectFunction, ResolveFunction } from '#types/base.d'

export const layout = {
	labelCol: { span: 3 },
	wrapperCol: { span: 19 }
}

const offset = 3

export const wrapperCol = { offset, span: 18 }

export const requiredRule = (message: string): Rule[] => [
	{ required: true, message }
]

export const gt0: Rule = {
	validator: async(_, value) => {
		if (value === null || value === undefined || value === '') {
			return
		}

		if (typeof value !== 'number' || isNaN(value)) {
			throw new Error('请输入有效的数字')
		}

		if (value <= 0) {
			throw new Error('数值必须大于0')
		}
	}
}

interface CompareRuleOptions {
	field: string
	message?: string
	compareFn: (value: any, compareValue: any) => boolean
}

export const createCompareRule = (options: CompareRuleOptions): Rule => ({ getFieldValue }) => ({
	async validator(_, value) {
		const compare = getFieldValue(options.field)
		if (value !== undefined && compare !== undefined) {
			if (!options.compareFn(value, compare)) {
				throw new Error(options.message)
			}
		}

		await Promise.resolve()
	}
})

interface RemoteRule {
	message: string
	// completeMessage: string
	uniqueId?: string
	call: (value: any, resolve: ResolveFunction<boolean>, reject: RejectFunction) => void
}

export const remoteRule = (params: RemoteRule): Rule[] => [
	{ required: true, message: params.message },
	() => ({
		validator: async(_, value) => {
			if (isEmpty(value)) {
				return
			}

			await new Promise<any>(
				(resolve, reject) => {
					params.call(value, resolve, reject)
					// throttle(
					//	 () => {
					//	 },
					//	 500,
					//	 params.uniqueId
					// )
				}
			)
		}
	})
]