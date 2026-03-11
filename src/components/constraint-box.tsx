import React from 'react'
import { isEmpty } from '#utils/functions'

interface PropsType {
	title: string
	className?: string
	children: React.ReactElement
}

const Main: React.FC<PropsType> = (
	{
		title,
		className,
		children
	}
) => <div className={ `constraint-box${ className !== undefined && isEmpty(className) ? ' ' + className : '' }` }>
	<span className="box-title">{ title }</span>
	{ children }
</div>

export default Main