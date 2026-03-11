import React, { useEffect, useRef } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { getElementHeightAdvanced, isEmpty, throttle } from '#utils/functions'
import { FileUpload } from '#repositories/apis/base'

interface EditorProps {
	id?: string
	className?: string
	content?: string
	update: (content: string) => void
	disabled?: boolean
	readonly?: boolean
}

const Main: React.FC<EditorProps> = ({ id, className, content, update, disabled, readonly }) => {
	const ref = useRef<HTMLDivElement | null>(null)
	const quillRef = useRef<ReactQuill | null>(null)

	const uploadFile = (file: File): void => {
		void FileUpload({ file }).then(
			res => {
				if (quillRef.current === null || isEmpty(res.data)) {
					return
				}

				const editor = quillRef.current.getEditor()
				editor.insertEmbed(editor.getSelection()?.index ?? 0, 'image', `/${ import.meta.env.VITE_BACKEND_PROXY }/${ res.data?.replace(/^\//, '') }`)
			}
		)
	}

	const quillImageUploader = (): void => {
		const input = document.createElement('input')
		input.setAttribute('type', 'file')
		input.setAttribute('accept', 'image/*')
		input.setAttribute('multiple', 'multiple')
		input.click()
		input.onchange = async() => {
			if (input.files === null) {
				return
			}

			Array.from(input.files).forEach(uploadFile)
		}
	}

	const setQuillEdit = (ref: ReactQuill | null): void => {
		if (ref !== null && ref !== undefined) {
			quillRef.current = ref
			ref.getEditor().getModule('toolbar').handlers.image = quillImageUploader
		}
	}

	const handlePaste = (e: React.ClipboardEvent): void => {
		const clipboardData = e.clipboardData
		const items = clipboardData.items

		for (let i = 0; i < items.length; i++) {
			const item = items[ i ]
			if (item.type.includes('image')) {
				e.preventDefault()
				const file = item.getAsFile()
				if (file !== null) {
					uploadFile(file)
				}
				break
			}
		}
	}

	const styleCall = (): void => {
		if (ref.current === null) {
			return
		}

		type tmp = HTMLElement | string | null
		const toolbar = ref.current.querySelector('.ql-toolbar')
		const box = ref.current.querySelector('.ql-container')
		if (toolbar === null || box === null) {
			return
		}

		const height = getElementHeightAdvanced(ref.current)?.totalHeight ?? 0
		const toolbarHeight = getElementHeightAdvanced(toolbar as tmp)?.totalHeight ?? 0
		const ele = box as HTMLDivElement
		ele.style.height = (height - toolbarHeight) + 'px'
	}

	useEffect(
		() => {
			styleCall()
			setTimeout(
				styleCall,
				500
			)
		},
		[]
	)

	return <div className={ `editor ${ className ?? '' }` } ref={ ref } id={ id } onPaste={ handlePaste }>
		<ReactQuill
			ref={ setQuillEdit }
			theme="snow"
			value={ content }
			readOnly={ disabled ?? readonly }
			modules={
				{
					toolbar: [
						[ { header: [ 1, 2, 3, 4, 5, 6, false ] } ],
						[ { font: [] } ],
						[ 'bold', 'italic', 'underline', 'strike', 'blockquote' ],
						[ { color: [] }, { background: [] } ],
						[ { list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' } ],
						[ 'link', 'image' ],
						[ 'clean' ]
					]
				}
			}
			formats={
				[
					'header',
					'size', 'font', 'bold', 'italic', 'underline', 'strike', 'blockquote',
					'color', 'background',
					'list', 'bullet', 'indent',
					'link', 'image'
				]
			}
			onChange={
				v => {
					throttle(
						() => {
							update(v)
						},
						500,
						`editor.${ id }`
					)
				}
			}
		/>
	</div>
}

export { Main as Editor, type EditorProps }