import React from 'react'
import { Pagination } from 'antd'
import { pageSizeOptions } from '#constants/appoint'

interface PropsType {
	page: number
	total: number
	pageSize?: number
	className?: string
	callback: (current: number, pageSize: number) => void
	showSizeChanger?: boolean
	showQuickJumper?: boolean
}

const Main: React.FC<PropsType> = (
	{
		total,
		pageSize = 20,
		callback,
		className,
		page = 1,
		showSizeChanger = true,
		showQuickJumper = true
	}
) => <Pagination
	responsive
	showSizeChanger={ showSizeChanger }
	showQuickJumper={ showQuickJumper }
	showLessItems
	className={ className }
	total={ total }
	current={ page }
	defaultCurrent={ page }
	hideOnSinglePage={ true }
	pageSize={ pageSize }
	pageSizeOptions={ pageSizeOptions }
	onShowSizeChange={ callback }
	onChange={ callback }
/>

export default Main