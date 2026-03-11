import { LicenseErrorHint, variables } from '#constants/appoint'
import { MessageType, MMessage } from '#components/hint'

export function errorMessage(): string {
	if (variables.showcase === true) {
		return '演示账号, 请使用完整功能账号'
	}

	return `${ LicenseErrorHint }[${ variables.licenseError ?? '' }]`
}

export function showcaseState(): boolean {
	if (variables.showcase === true) {
		MMessage({ message: errorMessage(), type: MessageType.warning })
		return true
	}

	return false
}

// skip 1 跳过showcase验证
export function hintError(skip?: 1): boolean {
	if (skip !== 1 && showcaseState()) {
		return true
	}

	if (variables.licenseError !== undefined) {
		MMessage({ message: `${ LicenseErrorHint }[${ variables.licenseError ?? '' }]`, type: MessageType.warning })
		return true
	}

	return false
}

export function hintError1(): string {
	if (variables.showcase === true) {
		return errorMessage()
	}

	return '激活后使用'
}