/// <reference types="vite/client" />

declare namespace NodeJS {
	interface ProcessEnv {
		readonly NODE_ENV: 'development' | 'production' | 'test'
		readonly PUBLIC_URL: string
	}
}

declare module '*.avif' {
	const src: string
	export default src
}

declare module '*.bmp' {
	const src: string
	export default src
}

declare module '*.gif' {
	const src: string
	export default src
}

declare module '*.jpg' {
	const src: string
	export default src
}

declare module '*.jpeg' {
	const src: string
	export default src
}

declare module '*.png' {
	const src: string
	export default src
}

declare module '*.webp' {
	const src: string
	export default src
}

declare module '*.svg' {
	import type * as React from 'react'

	export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>

	const src: string
	export default src
}

declare module '*.module.css' {
	const classes: Readonly<{ [key: string]: string }>
	export default classes
}

declare module '*.module.scss' {
	const classes: Readonly<{ [key: string]: string }>
	export default classes
}

declare module '*.module.sass' {
	const classes: Readonly<{ [key: string]: string }>
	export default classes
}

interface ImportMetaEnv {
	readonly BROWSER: string
	readonly PORT: number
	readonly VITE_PRO_NAME: string
	readonly VITE_ENV: string
	readonly VITE_TITLE: string

	readonly VITE_DESCRIPTION: string
	readonly VITE_KEYWORDS: string
	readonly VITE_HEADER_VERSION: string

	readonly VITE_BACKEND_PROXY: string
	readonly VITE_BACKEND_API_URL: string

	readonly VITE_EXTERNAL_PROXY: string
	readonly VITE_EXTERNAL_API_URL: string

	readonly VITE_BUILD_DATE: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
