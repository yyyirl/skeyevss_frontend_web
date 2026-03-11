import React from 'react'
import type { XSimpleRouteComponentProps } from '#routers/sites'
import { Health } from './components'

const Main: React.FC<XSimpleRouteComponentProps> = props => {
	return <div className="home-container">
		<Health />
	</div>
}

export default Main