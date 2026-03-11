export interface LangType {
	zhSimplified: string
	zhTraditional: string
	en: string
}

export interface SevConfigLangTitle {
	en: string
	mzh: string
	zh: string
}

export interface SevConfLangItem {
	id: number
	title: SevConfigLangTitle
}

export interface SevConfLangMaps { [key: number]: SevConfLangItem }