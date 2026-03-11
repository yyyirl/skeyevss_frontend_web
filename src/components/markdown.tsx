import React, { useEffect } from 'react'
import MDEditor from '@uiw/react-md-editor'
import useFetchState from '#repositories/models'

interface EditorProps {
	className?: string
	content?: string
	update: (content: string) => void
	disabled?: boolean
	readonly?: boolean
	hideView?: boolean
	id?: string
	placeholder?: string
}

const Main: React.FC<EditorProps> = ({ className, content, update, disabled, readonly, hideView, id, placeholder }) => {
	const [ value, setValue ] = useFetchState('')

	const handleValue = (v?: string): void => {
		setValue(v ?? '')
		update(v ?? '')
	}

	useEffect(
		() => {
			setValue(content)
		},
		[]
	)

	return <div className={ `markdown-editor ${ className ?? '' }` } id={ id ?? '' }>
		{
			readonly === true || disabled === true
				? <MDEditor.Markdown source={ value } />
				: <>
					<MDEditor
						value={ value }
						onChange={ handleValue }
						height={ 400 }
						aria-placeholder={ placeholder }
					/>
					{ hideView === true ? <></> : <MDEditor.Markdown source={ value } /> }
				</>
		}
	</div>
}

export default Main