import React, { useEffect, type ReactElement } from 'react'
import { useHistory } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import routes, { Path } from '#routers/constants'
import useFetchState from '#repositories/models'
import { Setting as SSetting } from '#repositories/models/recoil-state'
import { getQuery, throttle } from '#utils/functions'
import Loading, { LoadingType } from '#components/loading'

const doc1 = 'api.api'
const doc2 = 'common.md'
const doc3 = 'fqa.md'

const Markdown = ({ url }: { url: string }): ReactElement => {
	const [ content, setContent ] = useFetchState('')
	const [ loading, setLoading ] = useFetchState(true)

	useEffect(
		() => {
			setLoading(true)
			throttle(
				() => {
					void fetch(url).then(
						res => {
							void res.text().then(
								v => {
									setContent(v)
								}
							)
						}
					).finally(
						() => {
							setLoading(false)
						}
					)
				}
			)
		},
		[ url ]
	)

	return loading
		? <div className="wh100 flex flex-cc"><Loading type={ LoadingType.inner } /></div>
		: <ReactMarkdown
			remarkPlugins={ [ remarkGfm ] }
			components={
				{
					h1: ({ children }) => (
						<h1
							style={
								{
									borderBottom: '2px solid #eaecef',
									paddingBottom: '0.3em',
									marginBottom: '1em'
								}
							}
						>{ children }</h1>
					),
					h2: ({ children }) => (
						<h2
							style={
								{
									borderBottom: '1px solid #eaecef',
									paddingBottom: '0.3em',
									marginBottom: '0.8em',
									marginTop: '1.5em'
								}
							}
						>{ children }</h2>
					),
					code: ({ children, className }) => {
						const isInline = className !== undefined
						return <code
							style={
								{
									backgroundColor: isInline ? '#f6f8fa' : 'transparent',
									padding: isInline ? '0.2em 0.4em' : '0',
									borderRadius: '3px',
									fontSize: '0.9em',
									fontFamily: 'SFMono-Regular, Consolas, monospace'
								}
							}
						>{ children }</code>
					},
					pre: ({ children }) => (
						<pre
							style={
								{
									backgroundColor: '#f6f8fa',
									padding: '16px',
									borderRadius: '6px',
									overflow: 'auto',
									fontSize: '0.9em',
									lineHeight: '1.45'
								}
							}
						>{ children }</pre>
					),
					blockquote: ({ children }) => (
						<blockquote
							style={
								{
									borderLeft: '4px solid #dfe2e5',
									paddingLeft: '1em',
									marginLeft: 0,
									color: '#6a737d'
								}
							}
						>{ children }</blockquote>
					),
					table: ({ children }) => (
						<table
							style={
								{
									borderCollapse: 'collapse',
									width: '100%',
									margin: '1em 0'
								}
							}
						>{ children }</table>
					),
					th: ({ children }) => (
						<th
							style={
								{
									border: '1px solid #dfe2e5',
									padding: '6px 13px',
									fontWeight: '600',
									backgroundColor: '#f6f8fa'
								}
							}
						>{ children }</th>
					),
					td: ({ children }) => (
						<td
							style={
								{
									border: '1px solid #dfe2e5',
									padding: '6px 13px'
								}
							}
						>{ children }</td>
					),
					a: ({ href, children }) => (
						<a
							href={ href }
							style={
								{
									color: '#0366d6',
									textDecoration: 'none'
								} }
							target="_blank"
							rel="noopener noreferrer"
						>{ children }</a>
					)
				}
			}
		>{ content }</ReactMarkdown>
}

const Iframe = ({ url }: { url: string }): ReactElement => {
	const [ content, setContent ] = useFetchState('')
	const [ loading, setLoading ] = useFetchState(true)

	useEffect(
		() => {
			setLoading(true)
			throttle(
				() => {
					void fetch(url).then(
						res => {
							void res.text().then(
								v => {
									setContent(
										v.replace(
											/http:\/\/localhost(?::\d+)?/g,
											window.location.origin
										)
									)
								}
							)
						}
					).finally(
						() => {
							setLoading(false)
						}
					)
				}
			)
		},
		[ url ]
	)

	return loading
		? <div className="wh100 flex flex-cc"><Loading type={ LoadingType.inner } /></div>
		: <iframe
			className="wh100"
			srcDoc={ content }
			title="api doc"
			sandbox="allow-scripts allow-same-origin" // 根据需要调整权限
		/>
}

const Main: React.FC = () => {
	const proxyFileUrl = new SSetting().shared()[ 'proxy-file-url' ] + '/source/doc/api'
	const history = useHistory()

	const [ activate, setActivate ] = useFetchState('0')
	const [ path, setPath ] = useFetchState(doc1)

	useEffect(
		() => {
			let activate = getQuery('activate').trim()
			if (activate === '1') {
				setPath(doc2)
			} else if (activate === '2') {
				setPath(doc3)
			} else {
				activate = '0'
				setPath(doc1)
			}

			setActivate(activate)
		},
		[ window.location.href ]
	)

	return <div className="api-doc-container">
		<div className="modules">
			<ul className="tab">
				<li
					className={ activate === '0' ? 'active' : '' }
					onClick={
						() => {
							history.push(`${ routes[ Path.configs ].subs?.[ Path.apiDoc ].path ?? '' }`)
						}
					}
				>Api文档
				</li>
				<li
					className={ activate === '1' ? 'active' : '' }
					onClick={
						() => {
							history.push(`${ routes[ Path.configs ].subs?.[ Path.apiDoc ].path ?? '' }?activate=1`)
						}
					}
				>公共参数
				</li>
				<li
					className={ activate === '2' ? 'active' : '' }
					onClick={
						() => {
							history.push(`${ routes[ Path.configs ].subs?.[ Path.apiDoc ].path ?? '' }?activate=2`)
						}
					}
				>常见问题
				</li>
			</ul>
			<ul className="content wh100">
				{ activate === '0' ? <li className="item wh100"><Iframe url={ proxyFileUrl + '/' + path } /></li> : <></> }
				{ activate === '1' ? <li className="item wh100 markdown"><Markdown url={ proxyFileUrl + '/' + path } /></li> : <></> }
				{ activate === '2' ? <li className="item wh100 markdown"><Markdown url={ proxyFileUrl + '/' + path } /></li> : <></> }
			</ul>
		</div>
	</div>
}

export default Main
