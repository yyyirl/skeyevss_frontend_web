import React, { type ReactElement, useEffect, useRef } from 'react'
import { Button, Divider, Input, InputNumber, Select, Switch, Tooltip, Upload } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { getUrlFileName, isEmpty, uniqueId } from '#utils/functions'
import { errorMessage } from '#utils/err-hint'
import { variables } from '#constants/appoint'
import { type XRouteAnchorComponentProps } from '#routers/sites'
import routeMaps, { Path } from '#routers/constants'
import useFetchState from '#repositories/models'
import { Setting } from '#repositories/models/recoil-state'
import { configApiCall, configs as configsApi, FileUpload } from '#repositories/apis/base'
import type { Setting as SettingType } from '#repositories/types/config'
import { ReactComponent as IconLoading } from '#assets/svg/loading.svg'
import { ReactComponent as IconAll } from '#assets/svg/all.svg'
import { ReactComponent as IconModule } from '#assets/svg/module.svg'
import Icon from '#components/icon'
import { Confirm, MessageType, MMessage } from '#components/hint'
import { Row, Update } from './api'

interface UploadProps {
	type: 'crt' | 'key'
}

type UploadParamsType = ContentProps & UploadProps & { onChange: (value: any) => void, useFilename?: boolean }

interface GroupItemRow1 {
	labelClassName?: string
	label: string
	column: string
	value: string
	explain?: string
	options?: string[]
	type?: 'string' | 'number' | 'boolean' | 'select'
	upload?: (props: UploadParamsType) => ReactElement
}

interface GroupItemRow2 { split?: boolean }

type GroupItemRow = GroupItemRow1 | GroupItemRow2

interface GroupItem {
	label: string
	items: GroupItemRow[]
}

interface ContentProps {
	item: GroupItemRow
	index: number
	syncContent: (value: string, column: string) => void
	groups: GroupItem[]
	activeTabIndex: number
}

const Item = (props: ContentProps & { children: ReactElement, onChange: (value: any) => void }): ReactElement => {
	const item = props.item as GroupItemRow1
	return <div className="flex column" style={ { gap: 10 } }>
		{ item.upload !== undefined ? <div className="upload-box">{ item.upload(props as unknown as UploadParamsType) }</div> : <></> }
		<div className="item-c">{ props.children }</div>
		{ item.explain !== undefined ? <p className="explain">{ item.explain }</p> : <></> }
	</div>
}

const Content = (props: ContentProps): ReactElement => {
	const { groups, activeTabIndex, item, index, syncContent } = props
	const v = item as GroupItemRow1
	const [ value, setValue ] = useFetchState('')

	useEffect(
		() => {
			setValue(v.value)
		},
		[ v ]
	)

	if (v.type === 'number') {
		const onChange = (val: number | null): void => {
			(groups[ activeTabIndex ].items[ index ] as GroupItemRow1).value = `${ val ?? 0 }`
			setValue((groups[ activeTabIndex ].items[ index ] as GroupItemRow1).value)
			syncContent((groups[ activeTabIndex ].items[ index ] as GroupItemRow1).value, (groups[ activeTabIndex ].items[ index ] as GroupItemRow1).column)
		}

		return <Item { ...props } onChange={ onChange }>
			<InputNumber value={ parseInt(value) } style={ { width: 500 } } onChange={ onChange } />
		</Item>
	}

	if (v.type === 'boolean') {
		const onChange = (value: boolean): void => {
			(groups[ activeTabIndex ].items[ index ] as GroupItemRow1).value = value ? 'true' : 'false'
			setValue((groups[ activeTabIndex ].items[ index ] as GroupItemRow1).value)
			syncContent((groups[ activeTabIndex ].items[ index ] as GroupItemRow1).value, (groups[ activeTabIndex ].items[ index ] as GroupItemRow1).column)
		}

		return <Item { ...props } onChange={ onChange }>
			<Switch value={ value === 'true' } onChange={ onChange } />
		</Item>
	}

	if (v.type === 'select') {
		const onChange = (value: string): void => {
			(groups[ activeTabIndex ].items[ index ] as GroupItemRow1).value = value
			setValue((groups[ activeTabIndex ].items[ index ] as GroupItemRow1).value)
			syncContent((groups[ activeTabIndex ].items[ index ] as GroupItemRow1).value, (groups[ activeTabIndex ].items[ index ] as GroupItemRow1).column)
		}

		return <Item { ...props } onChange={ onChange }>
			<Select
				value={ value }
				options={ (v.options ?? []).map(item => ({ value: item, label: item })) }
				style={ { width: 200 } }
				onChange={ onChange}
			/>
		</Item>
	}

	const onChange = (value: string): void => {
		(groups[ activeTabIndex ].items[ index ] as GroupItemRow1).value = value
		setValue((groups[ activeTabIndex ].items[ index ] as GroupItemRow1).value)
		syncContent((groups[ activeTabIndex ].items[ index ] as GroupItemRow1).value, (groups[ activeTabIndex ].items[ index ] as GroupItemRow1).column)
	}

	return <Item { ...props } onChange={ onChange }>
		<Input
			value={ value }
			style={ { width: 500 } }
			placeholder="type a value"
			onChange={
				e => {
					onChange(e.target.value)
				}
			}
		/>
	</Item>
}

const CUpload = (props: UploadParamsType): ReactElement => {
	const v = props.item as GroupItemRow1
	return <Upload
		showUploadList={ { showRemoveIcon: true } }
		customRequest={
			res => {
				const fileReader = new FileReader()
				fileReader.readAsArrayBuffer(res.file as Blob)
				fileReader.onload = async() => {
					void FileUpload({
						file: fileReader.result,
						filename: (res.file as File).name,
						abs: true,
						useOriginalFilename: true
					}).then(
						res => {
							props.onChange(res.data ?? '')
						}
					)
				}

				fileReader.onerror = () => {
					throw new Error('File reading failed')
				}
			}
		}
		onRemove={
			() => {
				props.onChange('')
				return true
			}
		}
		listType="picture-card"
		accept={ `.${ props.type }` }
		fileList={
			isEmpty(v.value)
				? []
				: [
					{
						uid: v.value,
						name: getUrlFileName(v.value) ?? uniqueId(),
						status: 'done',
						url: v.value
					}
				]
		}
	>
		<button style={ { color: 'inherit', cursor: 'inherit', border: 0, background: 'none' } } type="button">
			<PlusOutlined />
			<div style={ { marginTop: 8 } }>Upload</div>
		</button>
	</Upload>
}

const Main: React.FC<XRouteAnchorComponentProps> = props => {
	const setting = new Setting()
	const permissionMaps = setting.shared().permissionMaps
	const { update } = Setting.authorities(permissionMaps, [ 'P_1_4_5', 'P_1_4_5_1' ])

	const checkIntervalRef = useRef<any>(null)
	const contentRef = useRef('')

	const [ groups, setGroups ] = useFetchState<GroupItem[]>([])
	const [ envFile, setEnvFile ] = useFetchState('')
	const [ content, setContent ] = useFetchState('')
	const handleContent = (v: string): void => {
		contentRef.current = v
		setContent(v)
	}

	const [ loading, setLoading ] = useFetchState(false)
	const [ restarting, setRestarting ] = useFetchState(false)
	const [ mode, setMode ] = useFetchState<'all' | 'module'>('module')
	const [ activeTabIndex, setActiveTabIndex ] = useFetchState(
		props.match.params.anchor !== undefined && !isEmpty(props.match.params.anchor)
			? parseInt(props.match.params.anchor)
			: 0
	)

	const fetch = (): void => {
		void Row().then(
			res => {
				contentRef.current = res.data?.content ?? ''
				handleContent(contentRef.current)
				setEnvFile(res.data?.file ?? '')

				const maps: { [ key: string ]: string } = {}
				contentRef.current.split('\n').filter(
					item => {
						const content = item.trim()

						return content !== '' && content.indexOf('#') !== 0
					}
				).map(
					item => {
						const data = item.split('=', 2)
						const content = data[ 1 ].trim()
						return {
							name: data[ 0 ],
							content: content === '""' || content === '\'\'' ? '' : content
						}
					}
				).forEach(
					item => {
						maps[ item.name ] = item.content
					}
				)

				const groups: GroupItem[] = [
					{
						label: '服务配置',
						items: [
							{
								label: '内网ip',
								column: 'SKEYEVSS_INTERNAL_IP',
								value: maps.SKEYEVSS_INTERNAL_IP
							},
							{
								label: '外网ip',
								column: 'SKEYEVSS_EXTERNAL_IP',
								value: maps.SKEYEVSS_EXTERNAL_IP
							},
							{
								label: 'web 代理服务器端口',
								column: 'SKEYEVSS_WEB_SEV_PORT',
								value: maps.SKEYEVSS_WEB_SEV_PORT,
								type: 'number'
							},
							{
								label: 'cron 端口',
								column: 'SKEYEVSS_CRON_PORT',
								value: maps.SKEYEVSS_CRON_PORT,
								type: 'number'
							},
							{
								label: 'db-rpc 端口',
								column: 'SKEYEVSS_DB_GRPC_PORT',
								value: maps.SKEYEVSS_DB_GRPC_PORT,
								type: 'number'
							},
							{
								label: 'backend-api 端口',
								column: 'SKEYEVSS_BACKEND_API_PORT',
								value: maps.SKEYEVSS_BACKEND_API_PORT,
								type: 'number'
							},
							{
								label: 'guard 端口',
								column: 'SKEYEVSS_GUARD_PORT',
								value: maps.SKEYEVSS_GUARD_PORT,
								type: 'number'
							},
							{ split: true } satisfies GroupItemRow2,
							{
								label: 'sip端口',
								column: 'SKEYEVSS_VSS_PORT',
								value: maps.SKEYEVSS_VSS_PORT,
								type: 'number'
							},
							{
								label: 'sip是否使用密码认证',
								column: 'SKEYEVSS_VSS_SIP_USE_PASSWORD',
								value: maps.SKEYEVSS_VSS_SIP_USE_PASSWORD,
								type: 'boolean'
							},
							{
								label: 'sip id',
								column: 'SKEYEVSS_VSS_SIP_ID',
								value: maps.SKEYEVSS_VSS_SIP_ID
							},
							{
								label: 'sip 域',
								column: 'SKEYEVSS_VSS_SIP_DOMAIN',
								value: maps.SKEYEVSS_VSS_SIP_DOMAIN
							},
							{
								label: 'sip 密码',
								column: 'SKEYEVSS_VSS_SIP_PASSWORD',
								value: maps.SKEYEVSS_VSS_SIP_PASSWORD
							},
							{
								label: 'vss http端口',
								column: 'SKEYEVSS_VSS_HTTP_PORT',
								value: maps.SKEYEVSS_VSS_HTTP_PORT,
								type: 'number'
							},
							{
								label: 'vss sse端口',
								column: 'SKEYEVSS_VSS_SSE_PORT',
								value: maps.SKEYEVSS_VSS_SSE_PORT,
								type: 'number'
							},
							{ split: true } satisfies GroupItemRow2,
							{
								label: '流媒体服务器http端口',
								column: 'SKEYEVSS_MEDIA_SERVER_PORT',
								value: maps.SKEYEVSS_MEDIA_SERVER_PORT,
								type: 'number'
							},
							{
								label: '流媒体服务器https端口',
								column: 'SKEYEVSS_MEDIA_SERVER_HTTPS_PORT',
								value: maps.SKEYEVSS_MEDIA_SERVER_HTTPS_PORT,
								type: 'number'
							},
							{
								label: '流媒体服务器rtsp端口',
								column: 'SKEYEVSS_MEDIA_SERVER_RTSP_PORT',
								value: maps.SKEYEVSS_MEDIA_SERVER_RTSP_PORT,
								type: 'number'
							},
							{
								label: '流媒体服务器rtmp端口',
								column: 'SKEYEVSS_MEDIA_SERVER_RTMP_PORT',
								value: maps.SKEYEVSS_MEDIA_SERVER_RTMP_PORT,
								type: 'number'
							},
							{
								label: '流媒体端口最大值',
								column: 'SKEYEVSS_VSS_MEDIA_SERVER_STREAM_PORT_MAX',
								value: maps.SKEYEVSS_VSS_MEDIA_SERVER_STREAM_PORT_MAX,
								type: 'number'
							},
							{
								label: '流媒体端口最小值',
								column: 'SKEYEVSS_VSS_MEDIA_SERVER_STREAM_PORT_MIN',
								value: maps.SKEYEVSS_VSS_MEDIA_SERVER_STREAM_PORT_MIN,
								type: 'number'
							},
							{ split: true } satisfies GroupItemRow2,
							{
								label: 'pprof backend-api 端口',
								column: 'SKEYEVSS_PPROF_BACKEND_API_PORT',
								value: maps.SKEYEVSS_PPROF_BACKEND_API_PORT,
								type: 'number'
							},
							{
								label: 'pprof db-rpc 端口',
								column: 'SKEYEVSS_PPROF_DB_RPC_PORT',
								value: maps.SKEYEVSS_PPROF_DB_RPC_PORT,
								type: 'number'
							},
							{
								label: 'pprof vss 端口',
								column: 'SKEYEVSS_PPROF_VSS_PORT',
								value: maps.SKEYEVSS_PPROF_VSS_PORT,
								type: 'number'
							},
							{
								label: 'pprof web 端口',
								column: 'SKEYEVSS_PPROF_WEB_PORT',
								value: maps.SKEYEVSS_PPROF_WEB_PORT,
								type: 'number'
							},
							{
								label: 'pprof cron 端口',
								column: 'SKEYEVSS_PPROF_CRON_PORT',
								value: maps.SKEYEVSS_PPROF_CRON_PORT,
								type: 'number'
							}
						]
					},
					{
						label: '数据库',
						items: [
							{
								label: '数据库类型',
								options: [ 'mysql', 'sqlite' ],
								column: 'SKEYEVSS_DATABASE_TYPE',
								value: maps.SKEYEVSS_DATABASE_TYPE,
								type: 'select'
							},
							{ split: true } satisfies GroupItemRow2,
							{
								label: '是否启用本地mysql',
								column: 'SKEYEVSS_ENABLED_MYSQL',
								value: maps.SKEYEVSS_ENABLED_MYSQL,
								explain: '关闭后服务启动时将不会运行mysql',
								type: 'boolean'
							},
							{
								label: 'mysql端口',
								column: 'SKEYEVSS_MYSQL_PORT',
								value: maps.SKEYEVSS_MYSQL_PORT,
								type: 'number'
							},
							{
								label: 'mysql host',
								column: 'SKEYEVSS_MYSQL_HOST',
								value: maps.SKEYEVSS_MYSQL_HOST
							},
							{
								label: 'mysql 用户名',
								column: 'SKEYEVSS_MYSQL_USERNAME',
								value: maps.SKEYEVSS_MYSQL_USERNAME
							},
							{
								label: 'mysql 密码',
								column: 'SKEYEVSS_MYSQL_PASSWORD',
								value: maps.SKEYEVSS_MYSQL_PASSWORD
							},
							{
								label: '数据库名称',
								column: 'SKEYEVSS_MYSQL_DB_NAME_BASE',
								value: maps.SKEYEVSS_MYSQL_DB_NAME_BASE
							},
							{ split: true } satisfies GroupItemRow2,
							{
								label: 'sqllite文件保存路径',
								column: 'SKEYEVSS_SQLITE_DB_FILE',
								value: maps.SKEYEVSS_SQLITE_DB_FILE
							},
							{ split: true } satisfies GroupItemRow2,
							{
								label: '是否启用本地redis',
								column: 'SKEYEVSS_ENABLED_REDIS',
								value: maps.SKEYEVSS_ENABLED_REDIS,
								explain: '关闭后服务启动时将不会运行redis',
								type: 'boolean'
							},
							{
								label: 'redis 端口',
								column: 'SKEYEVSS_REDIS_PORT',
								value: maps.SKEYEVSS_REDIS_PORT,
								type: 'number'
							},
							{
								label: 'redis host',
								column: 'SKEYEVSS_REDIS_HOST',
								value: maps.SKEYEVSS_REDIS_HOST
							},
							{
								label: 'redis 密码',
								column: 'SKEYEVSS_REDIS_PASSWORD',
								value: maps.SKEYEVSS_REDIS_PASSWORD
							}
						]
					},
					{
						label: '证书',
						items: [
							{
								labelClassName: 'sp',
								label: '公钥',
								column: 'SKEYEVSS_SSL_CERT_PUBLIC_KEY',
								value: maps.SKEYEVSS_SSL_CERT_PUBLIC_KEY,
								explain: '证书公钥, 请上传.crt文件, 例: www.skeyevss.cn.crt',
								upload: props => <CUpload { ...props } type="crt" />
							},
							{
								labelClassName: 'sp',
								label: '私钥',
								column: 'SKEYEVSS_SSL_CERT_PRIVATE_KEY',
								value: maps.SKEYEVSS_SSL_CERT_PRIVATE_KEY,
								explain: '证书公钥, 请上传.key文件, 例: www.skeyevss.cn.key',
								upload: props => <CUpload { ...props } type="key" />
							}
						]
					},
					{
						label: '文件存储',
						items: [
							{
								label: '文件存储路径根路径',
								column: 'SKEYEVSS_SAVE_FILE_DIR',
								value: maps.SKEYEVSS_SAVE_FILE_DIR
							},
							{
								label: '设备录像保存目录',
								column: 'SKEYEVSS_SAVE_VIDEO_DIR',
								value: maps.SKEYEVSS_SAVE_VIDEO_DIR
							},
							{
								label: '视频快照保存目录',
								column: 'SKEYEVSS_SAVE_VIDEO_SNAPSHOT_DIR',
								value: maps.SKEYEVSS_SAVE_VIDEO_SNAPSHOT_DIR
							},
							{
								label: 'pprof文件存储目录',
								column: 'SKEYEVSS_SAVE_PPROF_DIR',
								value: maps.SKEYEVSS_SAVE_PPROF_DIR
							},
							{
								label: '运行日志存储路径',
								column: 'SKEYEVSS_SERVER_LOG_PATH',
								value: maps.SKEYEVSS_SERVER_LOG_PATH
							},
							{
								label: '运行日志格式',
								column: 'SKEYEVSS_LOG_ENCODING',
								value: maps.SKEYEVSS_LOG_ENCODING
							},
							{
								label: '运行日志级别',
								column: 'SKEYEVSS_LOG_LEVEL',
								value: maps.SKEYEVSS_LOG_LEVEL
							}
						]
					}
				]
				setGroups(groups)
			}
		)
	}

	const check = (): void => {
		void configsApi(true).then(
			(res) => {
				clearInterval(checkIntervalRef.current as number)
				configApiCall(setting, res.data as SettingType | undefined)
				setRestarting(false)
				fetch()
				MMessage({ type: MessageType.success, message: '操作成功' })
			}
		).catch(
			() => {
				checkIntervalRef.current = setTimeout(check, 2000)
			}
		)
	}

	const handleMode = (): void => {
		setMode(mode === 'all' ? 'module' : 'all')
	}

	const handleTabModule = (key: number): void => {
		setActiveTabIndex(key)
		props.history.push(`${ routeMaps[ Path.configs ].subs?.[ Path.env ].path }/${ key }`)
	}

	const submit = (): void => {
		Confirm({
			content: <div><p className="weight">确认提交吗?</p></div>,
			success: (): void => {
				setLoading(true)
				void Update(contentRef.current).then(
					() => {
						setRestarting(true)
						check()
					}
				).finally(
					() => {
						setLoading(false)
					}
				)
			}
		})
	}

	const syncContent = (value: string, column: string): void => {
		handleContent(
			contentRef.current.split('\n').map(
				item => {
					const data = item.split('=', 2)
					if (data[ 0 ] === column) {
						data[ 1 ] = value
					}

					return data.join('=')
				}
			).join('\n')
		)
	}

	useEffect(fetch, [])

	return <div className="env-content">
		{
			mode === 'all'
				? <Input.TextArea value={ content } onChange={ e => { handleContent(e.target.value) } } />
				: <div className="modules">
					<ul className="tab">
						{
							groups.map(
								(item, key) => <li
									key={ key }
									onClick={ () => { handleTabModule(key) } }
									className={ activeTabIndex === key ? 'active' : '' }
								>{ item.label }</li>
							)
						}
					</ul>
					<ul className="content">
						{
							groups[ activeTabIndex ]?.items.map(
								(item, key) => 'split' in item
									? <li key={ key }><Divider /></li>
									: <li key={ key } className="item">
										<span className={ `label ${ (item as GroupItemRow1).labelClassName ?? '' }` }>{ (item as GroupItemRow1).label }:</span>
										<span className="val">
											<Content
												item={ item }
												index={ key }
												syncContent={ syncContent }
												groups={ groups }
												activeTabIndex={ activeTabIndex }
											/>
										</span>
									</li>
							)
						}
					</ul>
				</div>
		}
		{
			update
				? <div className="footer">
					<div className="mode">
						{
							mode === 'all'
								? <span onClick={ handleMode }><Icon className="i-3x" tap><IconModule /></Icon>模块化更新</span>
								: <span onClick={ handleMode }><Icon className="i-3x" tap><IconAll /></Icon>所有配置更新</span>
						}
					</div>
					<span className="flex-cc">配置文件: { envFile } </span>
					{ restarting ? <span className="flex-cc" style={ { display: 'flex', gap: 4 } }><Icon className="i-2x rotating-ele" tap><IconLoading /></Icon>服务重启中...</span> : <></> }
					{
						variables.licenseError !== undefined || variables.showcase === true
							? <Tooltip title={ errorMessage() } arrow={ true }><Button type="primary" disabled={ true }>保存并重启</Button></Tooltip>
							: <Button type="primary" loading={ loading } onClick={ submit } disabled={ restarting }>保存并重启</Button>
					}
				</div>
				: <></>
		}

	</div>
}

export default Main
