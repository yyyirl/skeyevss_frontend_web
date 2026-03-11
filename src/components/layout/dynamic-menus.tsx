import { type MenuItem } from '#types/base.d'
import type { DepartmentsType } from '#repositories/types/config'

interface DynamicMenusParams {
	departments: DepartmentsType
	depIds: number[]
	super: number
}

export const dynamicMenus = (_props: DynamicMenusParams): MenuItem[] => {
	return []
}