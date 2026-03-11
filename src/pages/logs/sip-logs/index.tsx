import React, { useEffect, useRef } from 'react'
import { Divider, Dropdown, Menu } from 'antd'
import { type MenuClickEventHandler } from 'rc-menu/lib/interface'
import { type XRouteComponentProps } from '#routers/sites'
import useFetchState from '#repositories/models'
import { SipLogs as SipLogsApi } from '#repositories/apis/base'
import { Setting as SSetting } from '#repositories/models/recoil-state'
import Icon from '#components/icon'
import Copy from '#components/copy'
import ScrollToBottom from '#components/scroll-to-bottom'
import { ReactComponent as IconLoading } from '#assets/svg/loading.svg'
import { ReactComponent as IconFileLog } from '#assets/svg/file-log.svg'
import { ReactComponent as IconRealtimeLog } from '#assets/svg/realtime-log.svg'
import { Files } from '#pages/logs/sip-logs/api'
import { type SipFileResp } from '#pages/logs/sip-logs/model'

type SipLogType = 'SipSevReceive' | 'SipSevRequest'

interface SipLogItem {
	type: SipLogType
	content: string
	error?: string
}

const defRecords: { [key in SipLogType]: string[] } = {
	SipSevReceive: [],
	SipSevRequest: []
}

const processLines = (lines: string[]): string[] => {
	const result: string[] = []

	for (let i = 0; i < lines.length; i++) {
		if (lines[ i ] === '' && lines[ i + 1 ] === '') {
			result.push('<br />')
			i++
		} else {
			result.push(lines[ i ])
		}
	}

	return result
}

const Main: React.FC<XRouteComponentProps> = () => {
	const settingState = new SSetting().shared()
	const vssSseUrl = settingState?.vssSseUrl ?? ''
	const recordsRef = useRef(defRecords)
	const fileNameRef = useRef('def')

	const [ records, setRecords ] = useFetchState(defRecords)
	const [ filterTab, setFilterTab ] = useFetchState('0')
	const [ sipFileLog, setSipFileLog ] = useFetchState<SipFileResp | undefined>(undefined)
	const [ page, setPage ] = useFetchState(0)
	const [ lines, setLines ] = useFetchState<string[]>([])

	const fetchFiles = (page: number): void => {
		void Files(fileNameRef.current, page, 100).then(
			res => {
				setLines(
					processLines(
						[
							...lines,
							...(res.data?.lines ?? [])
						]
					)
				)
				setSipFileLog(res.data)
			}
		)
	}

	const onClick: MenuClickEventHandler = ({ key }): void => {
		setLines([])
		if (key.includes('.log')) {
			fileNameRef.current = key
			setPage(0)
			fetchFiles(0)
		}

		setFilterTab(key)
	}

	useEffect(
		() => {
			fetchFiles(page)

			if (vssSseUrl === '') {
				return
			}

			const es = SipLogsApi({
				url: vssSseUrl,
				call: res => {
					const { data } = JSON.parse(res.data) as { data: SipLogItem }
					if ((data.type as any) === '') {
						return
					}

					recordsRef.current = { ...recordsRef.current, [ data.type ]: [ data.content, ...recordsRef.current[ data.type ] ] }
					setRecords(recordsRef.current)
				}
			})

			return () => {
				es.close()
			}
		},
		[ vssSseUrl ]
	)

	return <div className="sip-logs">
		<div className="filter">
			<Menu
				defaultSelectedKeys={ [ '0' ] }
				mode="inline"
				items={
					[
						{ key: '0', icon: <Icon className="i-2x" tap><IconRealtimeLog /></Icon>, label: '实时日志' },
						{
							key: '1',
							icon: <Icon className="i-2x" tap><IconFileLog /></Icon>,
							label: '文件日志',
							children: sipFileLog?.files === undefined
								? undefined
								: sipFileLog?.files.map(
									item => ({
										key: item.name,
										label: item.name
									})
								)
						}
					]
				}
				onClick={ onClick }
			/>
		</div>
		<>
			{
				filterTab === '0'
					? <>
						<Dropdown
							menu={
								{
									items: [
										{
											key: '1',
											label: '清空',
											onClick: () => {
												recordsRef.current = { ...recordsRef.current, SipSevReceive: [] }
												setRecords(recordsRef.current)
											}
										}
									]
								}
							}
							trigger={ [ 'contextMenu' ] }
							placement="bottomLeft"
						>
							<div className="item">
								<div className="w100 flex flex-cc"><span>接收记录... </span> <Icon className="i-2x rotating-ele" tap><IconLoading /></Icon></div>
								{
									records.SipSevReceive.map(
										(item, index) => <Copy text={ item } key={ index }>
											<pre
												className={ `line ${ index === 0 ? 'sp' : '' }` }
												key={ index }
											>{ item }</pre>
										</Copy>
									)
								}
							</div>
						</Dropdown>
						<Dropdown
							menu={
								{
									items: [
										{
											key: '1',
											label: '清空',
											onClick: () => {
												recordsRef.current = { ...recordsRef.current, SipSevRequest: [] }
												setRecords(recordsRef.current)
											}
										}
									]
								}
							}
							trigger={ [ 'contextMenu' ] }
							placement="bottomLeft"
						>
							<div className="item">
								<div className="w100 flex flex-cc"><span>发送记录... </span> <Icon className="i-2x rotating-ele" tap><IconLoading /></Icon></div>
								{
									records.SipSevRequest.map(
										(item, index) => <Copy text={ item } key={ index }>
											<pre
												className={ `line ${ index === 0 ? 'sp' : '' }` }
												key={ index }
											>{ item }</pre>
										</Copy>
									)
								}
							</div>
						</Dropdown>
					</>
					: <ScrollToBottom
						className="files"
						call={
							() => {
								const _page = page + 1
								setPage(_page)
								fetchFiles(_page)
							}
						}
					>
						<div className="wh100">
							{
								lines.map(
									(item, key) => item === '<br />' ? <Divider key={ key } /> : <pre key={ key }>{ item }</pre>
								)
							}
						</div>
					</ScrollToBottom>
			}
		</>
	</div>
}

export default Main
