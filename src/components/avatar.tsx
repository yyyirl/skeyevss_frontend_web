import React from 'react'
import { Avatar } from 'antd'
import { trim } from '#utils/functions'
import useFetchState from '#repositories/models'

interface PropsType {
	path: string
	name: string
}

interface CharProps {
	name: string
}

const Char: React.FC<CharProps> = ({ name }) => {
	name = trim(name) === '' ? '?' : trim(name)
	const imageName = trim(name).toUpperCase().slice(0, 1)
	const colorList = [ '#E8503F', '#F5BA00', '#00A999', '#054BC3' ]
	const strList = trim(name).split('')

	let count = 0
	strList.forEach((v) => {
		count += v.charCodeAt(0)
	})
	const styleJson = {
		backgroundColor: colorList[ count % 4 ]
	}

	return <span className="avatar-font" style={ styleJson }>{ imageName }</span>
}

const Main: React.FC<PropsType> = ({ path, name }) => {
	const [ avatarCharStyle, setAvatarCharStyle ] = useFetchState(path === '')
	return avatarCharStyle
		? <Char name={ name } />
		: <Avatar
			src={ path }
			onError={
				() => {
					setAvatarCharStyle(true)
					return false
				}
			}
		/>
}

export default Main