import React, { useEffect, useRef } from 'react'
import { Button, Card, Empty, Input, InputNumber, Select, Tooltip } from 'antd'
import { variables } from '#constants/appoint'
import { downloadFile } from '#utils/functions'
import { type CancelTokenSourceType, getCancelSource } from '#utils/axios'
import { errorMessage } from '#utils/err-hint'
import { type ANTOptionItem } from '#types/base.d'
import { type XRouteComponentProps } from '#routers/sites'
import { PProfAnalyze, type PProfAnalyzeRequestType, type PProfAnalyzeResponse, PProfAnalyzeRequestType as VPProfAnalyzeRequestType } from '#repositories/apis/base'
import useFetchState from '#repositories/models'
import { Setting } from '#repositories/models/recoil-state'
import { toSelectOptionType } from '#components/table/model'
import { MessageType, MMessage } from '#components/hint'

const Main: React.FC<XRouteComponentProps> = () => {
	const cancelTokenRef = useRef<CancelTokenSourceType | null>(null)
	const setting = new Setting()
	const pprof = toSelectOptionType(setting.shared().pprof ?? [])
	const pprofFileDir = setting.shared()[ 'pprof-file-dir' ]
	const convAddress = (filename: string): string => `${ setting.state[ 'proxy-file-url' ] }/${ filename.replace(/^\//, '') }`

	const [ data, setData ] = useFetchState<PProfAnalyzeResponse | undefined>(undefined)
	const [ host, setHost ] = useFetchState('127.0.0.1')
	const [ loading, setLoading ] = useFetchState(false)
	const [ type, setType ] = useFetchState<PProfAnalyzeRequestType | undefined>(undefined)
	const [ duration, setDuration ] = useFetchState<number>(5)
	const [ sevType, setSevType ] = useFetchState<ANTOptionItem | undefined>(pprof.length > 0 ? pprof[ 0 ] : undefined)

	const handleType = (type: PProfAnalyzeRequestType): void => {
		setType(type)
	}

	const submit = (): void => {
		if (type === undefined || sevType === undefined || host === undefined) {
			return
		}

		setLoading(true)
		cancelTokenRef.current = getCancelSource()
		void PProfAnalyze({ type, services: [ { name: sevType.label, port: sevType.value as number, host } ], duration }, cancelTokenRef.current).then(
			res => {
				setData(res.data)
			}
		).finally(
			() => {
				setTimeout(() => { setLoading(false) }, 1000)
			}
		)
	}

	const cancel = (): void => {
		cancelTokenRef.current?.cancel()
	}

	useEffect(
		() => {
			setData(undefined)
		},
		[ host, sevType ]
	)

	useEffect(cancel, [ ])

	return <div className="pprof-container">
		<ul className="menus">
			<li className="options">
				{
					type === VPProfAnalyzeRequestType.cpu
						? <Tooltip title="CPU分析时长(秒)" arrow={ true }>
							<InputNumber min={ 5 } max={ 20 } style={ { width: 100 } } value={ duration } onChange={ v => { setDuration(v ?? 5) } } changeOnWheel />
						</Tooltip>
						: <></>
				}
				<Tooltip title="服务类型" arrow={ true }>
					<Select
						defaultValue={ pprof[ 0 ].value }
						style={ { width: 150 } }
						options={ toSelectOptionType(pprof) }
						onChange={ (_, record) => { setSevType(record as ANTOptionItem) } }
					/>
				</Tooltip>
				<Tooltip title="host" arrow={ true }>
					<Input value={ host } style={ { width: 150 } } onChange={ v => { setHost(v.target.value.trim()) } } />
				</Tooltip>
			</li>
			<li className={ type === VPProfAnalyzeRequestType.cpu ? 'active' : '' } onClick={ () => { handleType(VPProfAnalyzeRequestType.cpu) } }>{ VPProfAnalyzeRequestType.cpu }</li>
			<li className={ type === VPProfAnalyzeRequestType.heap ? 'active' : '' } onClick={ () => { handleType(VPProfAnalyzeRequestType.heap) } }>{ VPProfAnalyzeRequestType.heap }</li>
			<li className={ type === VPProfAnalyzeRequestType.goroutine ? 'active' : '' } onClick={ () => { handleType(VPProfAnalyzeRequestType.goroutine) } }>{ VPProfAnalyzeRequestType.goroutine }</li>
			<li className={ type === VPProfAnalyzeRequestType.block ? 'active' : '' } onClick={ () => { handleType(VPProfAnalyzeRequestType.block) } }>{ VPProfAnalyzeRequestType.block }</li>
			<li className={ type === VPProfAnalyzeRequestType.mutex ? 'active' : '' } onClick={ () => { handleType(VPProfAnalyzeRequestType.mutex) } }>{ VPProfAnalyzeRequestType.mutex }</li>
			<li className="submit">
				<Button disabled={ type === undefined || sevType === undefined || host === '' } loading={ loading } onClick={ submit } type="primary">查询</Button>
				{
					loading ? <Button onClick={ cancel }>取消</Button> : <></>
				}
			</li>
		</ul>
		<Card loading={ loading } className="pprof-analyze-content">
			{
				data === undefined
					? <div className="wh100 flex-cc"><Empty /></div>
					: <>
						<Card.Meta
							title={
								<div className="file">
									<p>{ pprofFileDir }/{ data?.results?.[ sevType?.label ?? '' ]?.data.file }</p>
									<span
										className="cursor-pointer blue"
										onClick={
											() => {
												if (variables.licenseError !== undefined || variables.showcase === true) {
													MMessage({ message: errorMessage(), type: MessageType.warning })
													return
												}

												void downloadFile(
													convAddress(`${ pprofFileDir }/${ data?.results?.[ sevType?.label ?? '' ]?.data.file }`),
													data?.results?.[ sevType?.label ?? '' ]?.data.file as string
												)
											}
										}
									>下载pprof</span>
									<span
										className="cursor-pointer blue"
										onClick={
											() => {
												if (variables.licenseError !== undefined || variables.showcase === true) {
													MMessage({ message: errorMessage(), type: MessageType.warning })
													return
												}

												const file = (data?.results?.[ sevType?.label ?? '' ]?.data.file ?? '').replace('.pprof', '.svg')
												void downloadFile(convAddress(`${ pprofFileDir }/${ file }`), file as string)
											}
										}
									>下载svg</span>
								</div>
							}
						/>
						<Card loading={ false } className="pprof-analyze-content-1">
							<div className="image-zoom-container wh100">
								<object type="image/svg+xml" className="wh100" data={ convAddress(`${ pprofFileDir }/${ data?.results?.[ sevType?.label ?? '' ]?.data.file }`.replace('.pprof', '.svg')) } />
							</div>
						</Card>
					</>
			}
		</Card>
	</div>
}

export default Main