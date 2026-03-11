import React from 'react'
import { useHistory } from 'react-router-dom'
import { Button } from 'antd'
import Icon from '#components/icon'
import { ReactComponent as Icon404 } from '#assets/svg/404.svg'

const Main: React.FC = () => {
	const history = useHistory()

	return <div className="page404-container">
		<Icon><Icon404 /></Icon>
		<Button
			className="go-back"
			onClick={
				() => {
					history.goBack()
				}
			}
		>返回</Button>
	</div>
}

export default Main