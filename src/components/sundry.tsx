import React, { type CSSProperties, type FC, forwardRef, type ReactElement, useEffect, useImperativeHandle, useRef } from 'react'
import { useHistory } from 'react-router-dom'
import { EyeInvisibleOutlined, EyeTwoTone, PlusOutlined, InboxOutlined, FileZipOutlined } from '@ant-design/icons'
import { type MenuClickEventHandler } from 'rc-menu/lib/interface'
import { Dropdown, Popconfirm, type UploadProps, Button, Divider, Form, Input, InputNumber, Upload, Menu, List, Checkbox, Tooltip, Select, Progress, Spin } from 'antd'
import type { FormInstance } from 'antd/es/form'
import { type UploadFile } from 'antd/es/upload/interface'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L, { type TileLayerOptions } from 'leaflet'
import { type ExtensionProps } from '#types/ant.form.d'
import type { MenuItem, OptionItem, RowDataType } from '#types/base.d'
import { defMapCenterPoints, variables } from '#constants/appoint'
import routes, { Path } from '#routers/constants'
import { makeDefRoutePathWithCreateAnchor } from '#routers/anchor'
import useFetchState from '#repositories/models'
import { FileUpload, SetPassword, SettingUpdate, type UserPasswordType, DeviceDiagnose as DeviceDiagnoseApi, RespQuery as RespQueryApi, QueryActivateCode as QueryActivateCodeApi, type QueryActivateCodeResp, SetActivateCode as SetActivateCodeApi, ServerUpdate, genUniqueId, GbcCatalog } from '#repositories/apis/base'
import { LastRoute } from '#repositories/cache/ls'
import { type ChannelItem, type ChannelsPopupType, type DCPopupType, Departments, type DeviceDiagnoseProps, type DeviceItem, type InputSetProps, InputSet as VInputSet, type QueryActivateCodeVisibleProps, type RequireDeviceDiagnoseProps, Setting as SSetting, type SevUpdateVisibleProps, SevCheckState, CurrentCascadeUniqueIdState, type GetMapPointsStateProps, GetMapPointsState } from '#repositories/models/recoil-state'
import { defPapTiles, type MapTiles, type SettingItem } from '#repositories/types/config'
import { TreeItem } from '#repositories/types/foundation'
import { type Condition, Operator, OperatorOuter } from '#repositories/types/request'
import { type CancelTokenSourceType, getCancelSource } from '#utils/axios'
import { isPassword } from '#utils/patterns'
import { clearCache, logout } from '#utils/token'
import { errorMessage } from '#utils/err-hint'
import { arrayIntersection, arrayUnique, getParentNodes, getUrlFileName, inArray, isEmpty, isSubset, rangeMaps, setClassName, throttle, uniqueId } from '#utils/functions'
import { ReactComponent as IconArrow } from '#assets/svg/arrow.svg'
import { ReactComponent as IconDeviceGroup } from '#assets/svg/device-groups-1.svg'
import { ReactComponent as IconCamera } from '#assets/svg/camera.svg'
import { ReactComponent as IconSuccess } from '#assets/svg/success.svg'
import { ReactComponent as IconFolder1 } from '#assets/svg/folder-1.svg'
import { ReactComponent as IconFolder2 } from '#assets/svg/folder-2.svg'
import { ReactComponent as IconLoading } from '#assets/svg/loading.svg'
import IconPos, { ReactComponent as IconPos1 } from '#assets/svg/pos-1.svg'
import { Alert, Confirm, MessageType, MMessage } from '#components/hint'
import Loading, { LoadingType, SpinSizes } from '#components/loading'
import InfiniteScroll, { type InfiniteScrollRef } from '#components/infinite-scroll'
import Icon from '#components/icon'
import { List as VideoPreviewListApi } from '#pages/video-filters/api'
import { type Item as DDeviceItem, Item as VDeviceItem } from '#pages/devices/items/model'
import { List as DeviceListApi, Update as DeviceUpdate } from '#pages/devices/items/api'
import { List as ChannelListApi, Update as ChannelUpdate } from '#pages/devices/channels/api'
import { type Item as CItem } from '#pages/devices/channels/model'
import { type Item as DepItem, Item as VDepItem } from '#pages/system/departments/model'
import { Update as DepUpdate } from '#pages/system/departments/api'

const { Dragger } = Upload

export const DepartMainAddOption = <T extends RowDataType>(_: ExtensionProps<T>): ReactElement => {
	const history = useHistory()
	return <Button
		onClick={
			() => {
				const url = makeDefRoutePathWithCreateAnchor(
					routes[ Path.system ].subs?.[ Path.departments ].path ?? ''
				)
				if (url !== '') {
					history.push(url)
				}
			}
		}
		type="primary"
	>添加部门</Button>
}

export const MediaServerAddOption = <T extends RowDataType>(_: ExtensionProps<T>): ReactElement => {
	const history = useHistory()
	return <Button
		onClick={
			() => {
				const url = makeDefRoutePathWithCreateAnchor(
					routes[ Path.configs ].subs?.[ Path.mediaServer ].path ?? ''
				)
				if (url !== '') {
					history.push(url)
				}
			}
		}
		type="primary"
	>添加媒体服务</Button>
}

interface SettingProps {
	close: () => void
}

export const Setting = (props: SettingProps): ReactElement => {
	const ref = useRef<FormInstance | null>(null)

	const getMapPoints = new GetMapPointsState()
	const setting = new SSetting()
	const settingState = new SSetting().shared()

	const [ loading, setLoading ] = useFetchState(false)
	const [ data, setData ] = useFetchState<SettingItem>(settingState.setting)

	const defLogo: UploadFile<SettingItem> = {
		uid: data?.logo,
		name: getUrlFileName(data?.logo) ?? uniqueId(),
		status: 'done',
		url: `${ settingState[ 'proxy-file-url' ] }/${ data?.logo.replace(/^\//, '') }`
	}

	const defMapTiles: UploadFile<SettingItem> = {
		uid: data?.mapTiles,
		name: getUrlFileName(data?.mapTiles) ?? uniqueId(),
		status: 'done',
		url: `${ settingState[ 'proxy-file-url' ] }/${ data?.mapTiles.replace(/^\//, '') }`
	}

	const handlePapCenterPoints = (): void => {
		getMapPoints.set({
			visible: true,
			points: isEmpty(data.mapCenterPoints) ? undefined : data.mapCenterPoints.split(',').map(item => parseFloat(item)) as [ number, number ],
			callback: (lat, lng) => {
				const mapCenterPoints = [ lat, lng ].join(',')
				setData({ ...data, mapCenterPoints })
				ref.current?.setFieldValue('mapCenterPoints', mapCenterPoints)
			}
		} satisfies GetMapPointsStateProps)
	}

	const submit = (values: SettingItem): void => {
		setLoading(true)

		void SettingUpdate({
			conditions: [],
			data: [ { column: 'content' as any, value: values } ]
		}).then(
			() => {
				setting.set({
					...settingState,
					setting: values
				})

				MMessage({ message: '设置成功', type: MessageType.success })
				props.close()
			}
		).finally(
			() => {
				setLoading(false)
			}
		)
	}

	return <Form
		ref={ ref }
		labelCol={ { span: 6 } }
		wrapperCol={ { span: 12 } }
		layout="horizontal"
		onFinish={ submit }
		initialValues={ data }
		style={ { maxWidth: '100%' } }
	>
		<Divider>Base</Divider>
		<Form.Item<SettingItem>
			label="官网地址"
			name="website"
		><Input allowClear placeholder="请输入官网地址" /></Form.Item>
		<Form.Item<SettingItem>
			label="管理系统标题"
			name="webManageTitle"
			rules={ [ { required: true, message: '平台名称不能为空' } ] }
		><Input allowClear placeholder="请输入平台名称" /></Form.Item>
		<Form.Item<SettingItem>
			label="logo"
			name="logo"
			valuePropName="file"
			getValueFromEvent={ e => e.file }
		>
			<Upload
				showUploadList={ { showRemoveIcon: true } }
				customRequest={
					res => {
						const fileReader = new FileReader()
						fileReader.readAsArrayBuffer(res.file as Blob)
						fileReader.onload = async() => {
							void FileUpload({
								file: fileReader.result,
								filename: (res.file as File).name
							}).then(
								res => {
									setData({
										...data, logo: res.data ?? ''
									})
									ref.current?.setFieldValue('logo', res.data)
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
						setData({ ...data, logo: '' })
						return true
					}
				}
				listType="picture-card"
				accept=".jpg,.jpeg,.png"
				fileList={ data?.logo === '' || isEmpty(data?.logo) ? [] : [ defLogo ] }
			>
				<button style={ { color: 'inherit', cursor: 'inherit', border: 0, background: 'none' } } type="button">
					<PlusOutlined />
					<div style={ { marginTop: 8 } }>Upload</div>
				</button>
			</Upload>
		</Form.Item>
		<Form.Item<SettingItem>
			label="mapTiles"
			name="mapTiles"
			valuePropName="file"
			getValueFromEvent={ e => e.file }
		>
			<Upload
				showUploadList={ { showRemoveIcon: true } }
				customRequest={
					res => {
						const fileReader = new FileReader()
						fileReader.readAsArrayBuffer(res.file as Blob)
						fileReader.onload = async() => {
							void FileUpload({
								file: fileReader.result,
								filename: (res.file as File).name
							}).then(
								res => {
									setData({
										...data, mapTiles: res.data ?? ''
									})
									ref.current?.setFieldValue('mapTiles', res.data)
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
						setData({ ...data, mapTiles: '' })
						return true
					}
				}
				listType="picture-card"
				accept=".zip"
				fileList={ data?.mapTiles === '' || isEmpty(data?.mapTiles) ? [] : [ defMapTiles ] }
			>
				<button style={ { color: 'inherit', cursor: 'inherit', border: 0, background: 'none' } } type="button">
					<PlusOutlined />
					<div style={ { marginTop: 8 } }>Upload</div>
				</button>
			</Upload>
		</Form.Item>
		<Form.Item<SettingItem>
			label="地图放大倍数"
			name="mapZoom"
		>
			<InputNumber
				min={ 6 }
				max={ 12 }
				suffix={ loading ? <Spin size="small" /> : null }
			/>
		</Form.Item>
		<Form.Item<SettingItem>
			label="视频播放地址默认类型"
			name="mediaServerVideoPlayAddressType"
		>
			<Select
				options={
					(settingState[ 'ms-video-play-address-types' ] ?? []).map(
						item => ({ value: item, label: item })
					).filter(
						item => item.value !== 'RTSP' && item.value !== 'RTMP'
					)
				}
			/>
		</Form.Item>
		<Form.Item<SettingItem>
			label="地图坐标中心点"
			name="mapCenterPoints"
		><Input readOnly onClick={ handlePapCenterPoints } className="cursor-pointer" placeholder="坐标中心点" /></Form.Item>
		<Form.Item<SettingItem>
			label="黑名单"
			name="banIp"
		><Input.TextArea style={ { resize: 'none' } } placeholder="请输入黑名单" rows={ 6 } /></Form.Item>
		<Divider />
		<Form.Item wrapperCol={ { offset: 4 } } style={ { marginTop: 'auto' } }>
			{
				variables.licenseError !== undefined || variables.showcase === true
					? <Tooltip title={ errorMessage() } arrow={ true }>
						<Button
							disabled={ true }
							loading={ loading }
						>提交</Button>
					</Tooltip>
					: <Button
						type="primary"
						htmlType="submit"
						loading={ loading }
					>提交</Button>
			}
		</Form.Item>
	</Form>
}

interface UserPasswordProps {
	close: () => void
}

export const UserPassword = (_: UserPasswordProps): ReactElement => {
	const ref = useRef<FormInstance | null>(null)
	const [ loading, setLoading ] = useFetchState(false)

	const submit = (values: UserPasswordType): void => {
		if (!isPassword(values.password)) {
			MMessage({ message: '密码格式错误, 不低于6位，需同时包括大小写字母、数字、特殊字符中的任意两种或者三种', type: MessageType.warning })
			return
		}

		setLoading(true)
		void SetPassword({
			password: values.password,
			oldPassword: values.oldPassword
		}).then(
			() => {
				clearCache()
				Alert({
					message: <div className="weight">设置成功, 请重新登录</div>,
					success: (): void => {
						logout({
							locationSign: true,
							callback: () => {
								LastRoute('set')
							}
						})
					}
				})
			}
		).finally(
			() => {
				setLoading(false)
			}
		)
	}

	return <Form
		ref={ ref }
		labelCol={ { span: 6 } }
		wrapperCol={ { span: 12 } }
		layout="horizontal"
		onFinish={ submit }
		style={ { maxWidth: '100%' } }
	>
		<Form.Item<UserPasswordType>
			label="旧密码"
			name="oldPassword"
			rules={ [ { required: true, message: '旧密码不能为空' } ] }
		>
			<Input.Password
				allowClear
				placeholder="请输入旧密码"
				iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
			/>
		</Form.Item>
		<Form.Item<UserPasswordType>
			label="新密码"
			name="password"
			rules={ [ { required: true, message: '新密码不能为空' } ] }
		>
			<Input.Password
				allowClear
				placeholder="请输入新密码"
				iconRender={ (visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />) }
			/>
		</Form.Item>
		<Form.Item<UserPasswordType>
			label="确认密码"
			name="repeatPassword"
			rules={
				[
					{ required: true, message: '请确认密码' },
					({ getFieldValue }) => ({
						async validator(_, value) {
							if (getFieldValue('password') === value) {
								await Promise.resolve()
								return
							}
							throw new Error('两次输入的密码不一致')
						}
					})
				]
			}
		>
			<Input.Password
				allowClear
				placeholder="请输入密码"
				iconRender={ (visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />) }
			/>
		</Form.Item>
		<Form.Item
			wrapperCol={ { offset: 4 } }
			style={ { marginTop: 'auto' } }
		>
			<Button
				type="primary"
				htmlType="submit"
				loading={ loading }
			>提交</Button>
		</Form.Item>
	</Form>
}

export interface DepartmentTreesRenderProps {
	record: MenuItem
	defaultOpenKeys: string[]
	selectedKeys: string[]
	hiddenChannel?: boolean
	original?: DepItem
	reload: () => void
	departments: OptionItem[]
	depMaps: { [ key: number ]: TreeItem }
}

interface DepartmentTreesProps {
	className?: string
	itemRender?: (data: DepartmentTreesRenderProps) => MenuItem
	selectedKey?: (key: string, openKeys: string[], item: DepItem) => void
	inlineIndent?: number
	defaultSelectedKeys?: string[]
	useDef?: boolean
	style?: CSSProperties
}

export interface DepartmentTreesRef {
	reload: () => void
	unfold: (v: boolean) => void
}

export const DepartmentTrees = forwardRef(
	(
		props: DepartmentTreesProps,
		ref: React.Ref<DepartmentTreesRef>
	): ReactElement => {
		const dep = new Departments()
		const departmentState = dep.shared()
		const depMaps = departmentState?.maps ?? {}
		const departments = (departmentState?.trees ?? []).filter(
			item => props.useDef === true ? true : item.value !== 0
		)

		const [ defaultOpenKeys, setDefaultOpenKeys ] = useFetchState<string[]>([])
		const [ selectedKeys, setSelectedKeys ] = useFetchState<string[]>([])
		const [ menuKey, setMenuKey ] = useFetchState(1)

		const onClick: MenuClickEventHandler = ({ key, keyPath, domEvent }): void => {
			setSelectedKeys([ key ])
			setDefaultOpenKeys(keyPath)
			const original: DepItem = depMaps[ parseInt(key) ].raw as DepItem
			props.selectedKey?.(key, keyPath, original)
			domEvent.stopPropagation()
		}

		const reload = (): void => {
			setMenuKey(menuKey + 1)
		}

		const toMenuItems = (list: OptionItem[], defaultOpenKeys: string[], selectedKeys: string[]): MenuItem[] => {
			const options: MenuItem[] = []
			for (let i = 0; i < list.length; i++) {
				const item = list[ i ]
				let children: MenuItem[] = []
				if ((item.children ?? []).length > 0) {
					children = toMenuItems(item.children ?? [], defaultOpenKeys, selectedKeys)
				}

				const record: MenuItem = {
					key: item.value,
					label: item.title,
					children: children.length > 0 ? children : undefined
				}
				options.push(
					props.itemRender !== undefined
						? props.itemRender({ record, defaultOpenKeys, selectedKeys, original: item.raw as DepItem, reload, departments, depMaps })
						: record
				)
			}

			return options
		}

		const onOpenChange = (keyPath: string[]): void => {
			const key = keyPath[ keyPath.length - 1 ]
			if (isEmpty(key)) {
				return
			}

			setDefaultOpenKeys(keyPath)
			setSelectedKeys([ key ])
			const original: DepItem = depMaps[ parseInt(key) ].raw as DepItem
			props.selectedKey?.(key, keyPath, original)
		}

		const unfold = (v: boolean): void => {
			const keys: any[] = []
			TreeItem.rangeOptions(
				departments, item => {
					const raw = item.raw as DepItem
					if (!isEmpty(raw)) {
						keys.push(`${ raw.id }`)
					}

					return item
				}
			)

			setDefaultOpenKeys(v ? keys : [])
		}

		useEffect(
			() => {
				if (props.defaultSelectedKeys === undefined || props.defaultSelectedKeys.length <= 0) {
					return
				}

				// 设置默认选中
				let parents: OptionItem[] = []
				props.defaultSelectedKeys.forEach(
					item => {
						parents = [ ...parents, ...TreeItem.findTreeParentsIterative(item, departments) ]
					}
				)

				setSelectedKeys(props.defaultSelectedKeys)
				setDefaultOpenKeys([ ...props.defaultSelectedKeys, ...parents.map(item => `${ item.value }`) ])
			},
			[]
		)

		useImperativeHandle(
			ref,
			() => ({
				reload,
				unfold
			}),
			[ menuKey, dep.state ]
		)

		return <div onClick={ e => { e.stopPropagation() } }>
			<Menu
				key={ menuKey }
				style={ props.style }
				className={ props.className }
				items={ toMenuItems(departments, defaultOpenKeys, selectedKeys) }
				mode="inline"
				defaultOpenKeys={ defaultOpenKeys }
				openKeys={ defaultOpenKeys }
				onOpenChange={ onOpenChange }
				selectedKeys={ selectedKeys }
				onClick={ onClick }
				inlineIndent={ props.inlineIndent }
			/>
		</div>
	}
)

DepartmentTrees.displayName = 'DepartmentTrees'

interface DeviceChannelGroupProps {
	close: () => void
}

export const DeviceChannelGroups = (props: DCPopupType & DeviceChannelGroupProps): ReactElement => {
	const defaultInterval = 10
	const defaultMaxInterval = 20
	const defaultOnline = -1
	const depIds = props.depIds ?? []
	const departmentState = (new Departments()).shared()
	const { maps: departmentMaps } = TreeItem.tidyOptions((departmentState?.trees ?? []).filter(item => item.value !== 0))

	const channelMapsRef = useRef<{ [key: string]: ChannelItem[] }>({})
	const channelOriginalMapsRef = useRef<{ [key: string]: ChannelItem }>({})
	const clearDepChannelUniqueIdsRef = useRef<string[]>([])

	const [ unfold, setUnfold ] = useFetchState(false)
	const [ selectedAll, setSelectedAll ] = useFetchState(false)
	const [ devices, setDevices ] = useFetchState<DeviceItem[]>([])
	const [ openKeys, setOpenKeys ] = useFetchState<number[]>([])
	const [ checkedChannelUniqueIds, setCheckedChannelUniqueIds ] = useFetchState<string[]>([])
	const [ checkedDeviceUniqueIds, setCheckedDeviceUniqueIds ] = useFetchState<string[]>([])
	const [ keyword, setKeyword ] = useFetchState('')
	const [ online, setOnline ] = useFetchState(defaultOnline)
	const [ interval, setInterval ] = useFetchState(defaultInterval)

	const channelsFilter = (deviceUniqueId: string): ChannelItem[] => {
		return (channelMapsRef.current?.[ deviceUniqueId ] ?? []).filter(
			item => keyword !== '' ? (item.label !== '' ? item.label : item.name).includes(keyword) : true
		).filter(
			item => online !== defaultOnline ? online === item.online : true
		)
	}

	const highlightText = (
		text: string,
		keyword: string,
		backgroundColor: string = 'yellow'
	): ReactElement => <>
		{
			keyword.trim() === ''
				? <>{ text }</>
				: text.split(new RegExp(`(${ keyword })`, 'gi')).map((part, index) => part.toLowerCase() === keyword.toLowerCase()
					? <span key={ index } style={ { backgroundColor } }>{ part }</span>
					: <span key={ index }>{ part }</span>
				)
		}
	</>

	const handleSelectedAll = (v: boolean): void => {
		if (v) {
			const deviceUniqueIds: string[] = []
			const channelUniqueIds: string[] = []
			for (const deviceUniqueId in channelMapsRef.current) {
				channelsFilter(deviceUniqueId).forEach(
					item => {
						channelUniqueIds.push(item.uniqueId)
						deviceUniqueIds.push(item.deviceUniqueId)
					}
				)
			}

			setCheckedDeviceUniqueIds(deviceUniqueIds)
			setCheckedChannelUniqueIds(channelUniqueIds)
			setUnfold(true)
		} else {
			setCheckedDeviceUniqueIds([])
			setCheckedChannelUniqueIds([])
		}

		setSelectedAll(v)
	}

	const handleFilter = ({ keyword, online, interval }: { keyword: string, online: number, interval: number }): void => {
		setKeyword(keyword)
		setOnline(online)
		setInterval(interval)
		setCheckedDeviceUniqueIds([])
		setCheckedChannelUniqueIds([])
		setSelectedAll(false)

		if (!unfold) {
			setUnfold(keyword !== '' || online !== defaultOnline)
		}
	}

	const channelMaps = (channels: ChannelItem[]): void => {
		const channelMaps: { [key: string]: ChannelItem[] } = {}
		const channelOriginalMaps: { [key: string]: ChannelItem } = {}
		channels.forEach(
			item => {
				if (isEmpty(channelMaps[ item.deviceUniqueId ])) {
					channelMaps[ item.deviceUniqueId ] = []
				}

				channelMaps[ item.deviceUniqueId ].push(item)
				channelOriginalMaps[ item.uniqueId ] = item
			}
		)

		channelMapsRef.current = channelMaps
		channelOriginalMapsRef.current = channelOriginalMaps
	}

	const makeChecked = ({ channels }: { channels: ChannelItem[], devices: DeviceItem[] }): void => {
		if (depIds.length > 0) {
			const channelIds: string[] = []
			const deviceIds: string[] = []
			const deviceMaps: { [key: string]: string[] } = {}

			channels.forEach(
				item => {
					if (isEmpty(deviceMaps[ item.deviceUniqueId ])) {
						deviceMaps[ item.deviceUniqueId ] = []
					}
					deviceMaps[ item.deviceUniqueId ].push(item.uniqueId)
					item.depIds.forEach(
						v => {
							if (inArray(depIds, v)) {
								channelIds.push(item.uniqueId)
							}
						}
					)
				}
			)

			for (const k in deviceMaps) {
				const item = deviceMaps[ k ]
				if (isSubset(item, channelIds)) {
					deviceIds.push(k)
				}
			}

			setCheckedChannelUniqueIds(arrayUnique(channelIds, v => v))
			setCheckedDeviceUniqueIds(arrayUnique(deviceIds, v => v))
		}
	}

	const fetchList = (): void => {
		void VideoPreviewListApi().then(
			res => {
				if (res.data === undefined) {
					return
				}

				const { devices, channels } = res.data
				setDevices(devices)
				channelMaps(channels)

				makeChecked({ devices, channels })
			}
		)
	}

	const onClick = (item: DeviceItem): void => {
		let keys = [ ...openKeys ]
		if (inArray(keys, item.id)) {
			keys = keys.filter(v => item.id !== v)
		} else {
			keys.push(item.id)
		}

		setOpenKeys(keys)
	}

	const handleClick = (v: boolean, data: { device: DeviceItem, channel?: ChannelItem }): void => {
		let channelIds = checkedChannelUniqueIds
		let deviceIds = checkedDeviceUniqueIds
		const uniqueIds = channelMapsRef.current[ data.device.deviceUniqueId ].map(item => item.uniqueId)
		if (data.channel !== undefined) {
			const uniqueId = data.channel.uniqueId
			if (v) {
				channelIds.push(uniqueId)

				clearDepChannelUniqueIdsRef.current = clearDepChannelUniqueIdsRef.current.filter(
					item => item !== data.channel?.uniqueId
				)
			} else {
				channelIds = channelIds.filter(item => uniqueId !== item)

				if (channelOriginalMapsRef.current[ data.channel.uniqueId ].depIds.length > 0) {
					clearDepChannelUniqueIdsRef.current.push(data.channel.uniqueId)
				}
			}

			if (isSubset(uniqueIds, channelIds)) {
				deviceIds.push(data.device.deviceUniqueId)
			} else {
				deviceIds = deviceIds.filter(item => data.device.deviceUniqueId !== item)
			}
		} else {
			if (v) {
				channelIds = [ ...channelIds, ...uniqueIds ]
				deviceIds.push(data.device.deviceUniqueId)

				clearDepChannelUniqueIdsRef.current = clearDepChannelUniqueIdsRef.current.filter(
					item => !inArray(channelIds, item)
				)
			} else {
				channelIds = channelIds.filter(item => !inArray(uniqueIds, item))
				deviceIds = deviceIds.filter(item => data.device.deviceUniqueId !== item)

				channelMapsRef.current[ data.device.deviceUniqueId ].map(item => item.uniqueId).forEach(
					item => {
						if (channelOriginalMapsRef.current[ item ].depIds.length > 0) {
							clearDepChannelUniqueIdsRef.current.push(item)
						}
					}
				)
			}
		}

		setCheckedChannelUniqueIds(arrayUnique(channelIds, v => v))
		setCheckedDeviceUniqueIds(arrayUnique(deviceIds, v => v))
	}

	const submit = (): void => {
		props.submit?.({
			close: props.close,
			checkedChannelUniqueIds,
			unCheckedChannelUniqueIds: arrayUnique(clearDepChannelUniqueIdsRef.current, v => v),
			keyword,
			online,
			interval
		})
	}

	useEffect(
		() => {
			fetchList()
		},
		[ ]
	)

	return <div className="dc-box">
		<p className="title">{ props.title }</p>
		{
			props.useFilterComponent === true
				? <div className="filters">
					<Tooltip title="搜索通道" arrow={ true }>
						<div className="item search">
							<Input
								value={ keyword }
								placeholder="请输入搜索内容"
								onChange={
									e => {
										handleFilter({ keyword: e.target.value, online, interval })
									}
								}
							/>
						</div>
					</Tooltip>
					<Tooltip title="在线状态" arrow={ true }>
						<div className="item state">
							<Select
								placeholder="在线状态"
								optionFilterProp="label"
								value={ online }
								options={[ { value: defaultOnline, label: '全部' }, { value: 0, label: '不在线' }, { value: 1, label: '在线' } ]}
								onChange={
									online => {
										handleFilter({ keyword, online, interval })
									}
								}
							/>
						</div>
					</Tooltip>
					<Tooltip title={ `轮播间隔(单位/s) 最小${ defaultInterval }s 最大${ defaultMaxInterval }s` } arrow={ true }>
						<div className="item interval">
							<InputNumber
								value={ interval }
								min={ defaultInterval }
								max={ defaultMaxInterval }
								onChange={
									interval => {
										handleFilter({ keyword, online, interval: interval ?? defaultInterval })
									}
								}
								placeholder="轮播间隔(单位/s)"
							/>
						</div>
					</Tooltip>
					<Checkbox checked={ unfold } onChange={ e => { setUnfold(e.target.checked) } }>展开通道</Checkbox>
					<Checkbox checked={ selectedAll } onChange={ e => { handleSelectedAll(e.target.checked) } }>{ selectedAll ? '取消全选' : '全选' }</Checkbox>
					{ checkedChannelUniqueIds.length > 0 ? <span className="select-count">已选择: <i>{ checkedChannelUniqueIds.length }</i> 个</span> : <></> }
				</div>
				: <></>
		}
		<div className="list-box">
			<List
				itemLayout="horizontal"
				dataSource={ devices }
				renderItem={
					item => {
						const channels = channelsFilter(item.deviceUniqueId)
						const length = channels.length
						if (length <= 0) {
							return <></>
						}

						return <List.Item>
							<div className={ `list-item ${ inArray(openKeys, item.id) ? 'active' : '' }` }>
								<div className="item-checkbox">
									<Checkbox
										checked={ inArray(checkedDeviceUniqueIds, item.deviceUniqueId) }
										onChange={ e => { handleClick(e.target.checked, { device: item }) } }
									/>
								</div>
								<Icon className="i-3x sp-1" tap><IconDeviceGroup /></Icon>
								<span className="label" onClick={ () => { onClick(item) } }>{ item.label !== '' ? item.label : item.name }</span>
								<span className="count">{ length }</span>
								<Icon className={ `i-lg sp ${ inArray(openKeys, item.id) ? 'rotate-270' : 'rotate-180' }` } tap><IconArrow /></Icon>
							</div>
							{
								inArray(openKeys, item.id) || unfold
									? channels.map(
										v => {
											const checked = inArray(checkedChannelUniqueIds, v.uniqueId)
											return <div
												className="list-item channel"
												key={ v.uniqueId }
												onClick={ () => { handleClick(!checked, { device: item, channel: v }) } }
											>
												<div className="item-checkbox"><Checkbox checked={ checked } /></div>
												<Icon className="i-3x sp-1" tap><IconCamera /></Icon>
												<span className="label">{ highlightText(v.label !== '' ? v.label : v.name, keyword) }</span>
												{
													v.depIds.map(
														(val, index) => isEmpty(departmentMaps[ val ])
															? <></>
															: <span className="department" key={ index }>{ departmentMaps[ val ].title }</span>
													)
												}
											</div>
										}
									)
									: <></>
							}
						</List.Item>
					}
				}
			/>
		</div>
		<div className="footer">
			<Button type="primary" onClick={ submit }>确定</Button>
		</div>
	</div>
}

export const InputSet = (props: InputSetProps): ReactElement => {
	const [ value, setValue ] = useFetchState(props.defaultValue ?? '')
	const [ loading, setLoading ] = useFetchState(false)

	const submit = (): void => {
		setLoading(true)

		props.submit?.(value, () => {
			setLoading(false)
			props.close?.()
		})
	}

	return <div className="box">
		<p className="title">{ props.title }</p>
		<div className="content">
			<Input value={ value } onChange={ e => { setValue(e.target.value) } } />
		</div>
		<div className="footer">
			{
				variables.licenseError !== undefined || variables.showcase === true
					? <Tooltip title={ errorMessage() } arrow={ true }><Button type="primary" disabled={ true }>确定</Button></Tooltip>
					: <Button type="primary" onClick={ submit } loading={ loading }>确定</Button>
			}
		</div>
	</div>
}

interface DeviceDiagnoseItem {
	done?: boolean
	title: string
	line?: string
	records: Array<{ line: string, color: string, title: string, value: string }>
}

interface DeviceDiagnoseResponse {
	data: DeviceDiagnoseItem
}

export const DeviceDiagnose = (props: DeviceDiagnoseProps & RequireDeviceDiagnoseProps): ReactElement => {
	const settingState = new SSetting().shared()
	const vssSseUrl = settingState?.vssSseUrl ?? ''

	const recordsRef = useRef<DeviceDiagnoseItem[]>([])
	const [ records, setRecords ] = useFetchState<DeviceDiagnoseItem[]>([])
	const [ loading, setLoading ] = useFetchState(true)

	useEffect(
		() => {
			const es = DeviceDiagnoseApi({
				type: `${ props.channelUniqueId !== undefined ? 'channel' : 'device' }_diagnose`,
				channelUniqueId: props.channelUniqueId,
				deviceUniqueId: props.deviceUniqueId,
				url: vssSseUrl,
				call: res => {
					const content = JSON.parse(res.data) as DeviceDiagnoseResponse
					recordsRef.current = [ ...recordsRef.current, content.data ]
					setRecords(recordsRef.current)
				},
				done: () => {
					setLoading(false)
				}
			})

			return () => {
				es.close()
			}
		},
		[]
	)

	return <div className="box">
		<p className="title">{ props.channelUniqueId !== undefined ? '通道' : '设备' }诊断</p>
		<ul className="item-box">
			{
				records.map(
					(item, key) => <li key={ key } className={ `item ${ item.done === true ? 's' : '' } ${ item.line !== undefined ? (item.line === '' ? 's2' : 's1') : '' }` }>
						{
							item.line === undefined && item.title !== ''
								? <>
									{
										item.done === true
											? <span className="success"><Icon className="i-4ax" tap><IconSuccess /></Icon></span>
											: <span className="index">{ key + 1 }</span>
									}
									<span className="title">{ item.title }</span>
									{
										!isEmpty(item.records)
											? <ul>
												{
													item.records.map(
														(val, index) => !isEmpty(val.line)
															? <li key={ index } className="line"><p dangerouslySetInnerHTML={ { __html: (val.line ?? '').replaceAll('\n', '<br />') } } /></li>
															: <li key={ index }>
																<span>{ val.title }</span>
																<span style={ { color: val.color } }>{ isEmpty(val.value) ? '-' : val.value }</span>
															</li>
													)
												}
											</ul>
											: <></>
									}
								</>
								: <span dangerouslySetInnerHTML={ { __html: (item.line ?? '').replaceAll('\r\n', '<br />') } } />
						}
					</li>
				)
			}
			<li className="loading">{ loading ? <Loading size={ SpinSizes.small } type={ LoadingType.inner } /> : <></> }</li>
		</ul>
	</div>
}

export const QueryActivateCode = (props: QueryActivateCodeVisibleProps): ReactElement => {
	const [ code, setCode ] = useFetchState('')
	const [ loading, setLoading ] = useFetchState(false)
	const [ queryInfo, setQueryInfo ] = useFetchState<QueryActivateCodeResp | undefined>(undefined)
	const [ fileList, setFileList ] = useFetchState<UploadFile[]>([])

	const handleProcessFile = async(file: File): Promise<string> => {
		return await new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = (e) => {
				const content = e.target?.result as string
				resolve(content)
			}

			reader.onerror = (error) => {
				reject(error)
			}

			reader.readAsText(file)
		})
	}

	const params: UploadProps = {
		fileList,
		name: 'file',
		multiple: false,
		action: '',
		beforeUpload: async(_file) => {
			return false
		},
		onChange: (info) => {
			setQueryInfo(undefined)
			const { file } = info
			if (info.fileList.length <= 0) {
				return
			}

			void handleProcessFile(file as unknown as File).then(
				res => {
					setCode(res)
				}
			).catch(
				() => {
					MMessage({ message: '文件处理失败', type: MessageType.error })
				}
			)

			setFileList([ info.fileList[ info.fileList.length - 1 ] ])
		},
		onRemove: () => {
			setFileList([])
			setCode('')
		}
	}

	const submit = (): void => {
		setLoading(true)
		if (props.type === 'query') {
			void QueryActivateCodeApi(code).then(
				res => {
					setFileList([])
					setCode('')
					setQueryInfo(res.data)
				}
			).finally(
				() => {
					setLoading(false)
				}
			)
			return
		}

		void SetActivateCodeApi(code).then(
			() => {
				setFileList([])
				setCode('')
				MMessage({ message: '设置成功', type: MessageType.success })
				props.close?.()
				props.afterClose?.()
			}
		).finally(
			() => {
				setLoading(false)
			}
		)
	}

	return <div className="box">
		<p className="title">{ props.type === 'query' ? '激活码查询' : '提交激活文件' }</p>
		<Dragger {...params}>
			<p className="ant-upload-drag-icon">
				<InboxOutlined />
			</p>
			<p className="ant-upload-hint">点击或拖动文件至此区域以上传</p>
		</Dragger>
		{
			queryInfo !== undefined
				? <div className="query-info">
					<p>机器码: <span>{ queryInfo.diskSerialCode }</span></p>
					<p>授权通道数: <span>{ queryInfo.channel }</span></p>
					<p>
						{
							queryInfo.unlimited
								? <>服务时间:<span> 永久</span></>
								: <>
									{
										queryInfo.days <= 0
											? <>剩余天数: <span>已过期</span></>
											: <>剩余天数: <span>{ queryInfo.days }</span></>
									}
								</>
						}
					</p>
				</div>
				: <></>
		}
		<div className="footer">
			<Button
				type="primary"
				loading={ loading }
				disabled={ code === '' }
				onClick={ submit }
			>{ props.type === 'query' ? '查询' : '提交' }</Button>
		</div>
	</div>
}

export const SevUpdate = (props: SevUpdateVisibleProps): ReactElement => {
	const sevState = new SevCheckState()
	const setting = new SSetting()
	const convAddress = (filename: string): string => `${ setting.state[ 'proxy-file-url' ] }/${ filename.replace(/^\//, '') }`

	const uploadCancelTokenRef = useRef<CancelTokenSourceType | undefined>(undefined)

	const [ loading, setLoading ] = useFetchState(false)
	const [ progress, setProgress ] = useFetchState(0)
	const [ fileList, setFileList ] = useFetchState<UploadFile[]>([])
	const [ filePath, setFilePath ] = useFetchState('')

	const params: UploadProps = {
		fileList,
		name: 'file',
		multiple: false,
		action: '',
		accept: '.zip',
		beforeUpload: async(_file) => {
			return false
		},
		onChange: (info) => {
			if (info.fileList.length <= 0) {
				return
			}

			setFilePath('')
			setFileList([ info.fileList[ info.fileList.length - 1 ] ])
		},
		onRemove: () => {
			setFileList([])
		}
	}

	const upload = (): void => {
		uploadCancelTokenRef.current = getCancelSource()
		const file = fileList[ 0 ]
		setLoading(true)
		void FileUpload(
			{
				file: file.originFileObj,
				onProgress: progress => {
					setProgress(progress)
				}
			},
			uploadCancelTokenRef.current
		).then(
			res => {
				MMessage({ message: '文件上传成功', type: MessageType.success })
				setFilePath(res.data ?? '')
			}
		).finally(
			() => {
				setFileList([])
				setLoading(false)
				setProgress(0)
			}
		)
	}

	const submit = (): void => {
		Confirm({
			content: <div><p className="weight">确认提交吗?</p><p>此操作将会替换服务文件并重启服务 .</p></div>,
			success: (): void => {
				setLoading(true)

				void ServerUpdate(filePath).then(
					() => {
						MMessage({ message: '更新成功', type: MessageType.success })
					}
				).finally(
					() => {
						setLoading(false)
						props.close?.()
						props.afterClose?.()
						sevState.set({ visible: true })
					}
				)
			}
		})
	}

	useEffect(
		() => {
			return () => {
				uploadCancelTokenRef.current?.cancel()
			}
		},
		[]
	)

	return <div className="box">
		<p className="title">更新服务</p>
		<Dragger {...params}>
			<p className="ant-upload-drag-icon">
				<FileZipOutlined />
			</p>
			<p className="ant-upload-hint">点击或拖动软件压缩包至此区域以上传</p>
		</Dragger>
		{ loading ? <Progress percent={ progress } /> : <></> }
		{ filePath !== '' ? <p className="filename-view">{ convAddress(filePath) }</p> : <></> }
		<div className="footer">
			{
				fileList.length > 0
					? <>
						{ loading ? <Button onClick={ () => { uploadCancelTokenRef.current?.cancel() } } style={ { marginRight: 10 } }>取消</Button> : <></> }
						<Button type="primary" loading={ loading } onClick={ upload }>上传</Button>
					</>
					: <></>
			}
			{ filePath === '' ? <></> : <Button type="primary" loading={ loading } onClick={ submit }>提交更新</Button> }
		</div>
	</div>
}

// 更新通道级联id ---------------------------------------------------------------------------------

export interface CascadeChannelUniqueIdProps {
	item: CItem
	call?: (item: CItem) => void
}

export const ChannelCascadeUniqueId = ({ item, call }: CascadeChannelUniqueIdProps): ReactElement => {
	const cascadeChannelUniqueId = item.cascadeChannelUniqueId ?? ''

	const [ value, setValue ] = useFetchState('')
	const [ loading, setLoading ] = useFetchState(false)

	const submit = (e: any): void => {
		e.stopPropagation()
		if (value.length !== 20) {
			MMessage({
				message: `级联通道id长度必须为20位, 当前长度为: ${ value.length }`,
				type: MessageType.error
			})
			return
		}

		setLoading(true)
		void ChannelUpdate<CItem>({
			conditions: [ { column: 'id', value: item.id } ],
			data: [ { column: 'cascadeChannelUniqueId', value } ]
		}).finally(
			() => {
				setLoading(false)
				const oldCascadeChannelUniqueId = item.cascadeChannelUniqueId
				item.cascadeChannelUniqueId = value
				call?.(item)
				MMessage({
					message: '设置成功',
					type: MessageType.success
				})

				void GbcCatalog({ channelUniqueId: value, oldChannelUniqueId: oldCascadeChannelUniqueId })
			}
		)
	}

	useEffect(
		() => {
			setValue(item.cascadeChannelUniqueId ?? '')

			if (isEmpty(cascadeChannelUniqueId)) {
				setLoading(true)
				void genUniqueId({ type: 'cascadeChannel', count: 1 }).then(
					res => {
						setValue(res.data !== undefined ? res.data[ 0 ] : '')
					}
				).finally(
					() => {
						setLoading(false)
					}
				)
			}
		},
		[]
	)

	return <div className="channel-cascade-id">
		<Input
			value={ value }
			prefix={ loading ? <Loading size={ SpinSizes.small } /> : <></> }
			onChange={ e => { setValue(e.target.value) } }
			placeholder="请输入级联通道id"
		/>
		<Button onClick={ submit }>确定</Button>
	</div>
}

export const SetChannelCascadeUniqueId = (props: CascadeChannelUniqueIdProps): ReactElement => {
	const currentCascadeUniqueIdState = new CurrentCascadeUniqueIdState()
	const ref = useRef<HTMLDivElement>(null)

	const [ visible, setVisible ] = useFetchState(false)

	useEffect(
		() => {
			if (currentCascadeUniqueIdState.state !== props.item.uniqueId) {
				setVisible(false)
			}
		},
		[ currentCascadeUniqueIdState.state ]
	)

	useEffect(
		() => {
			getParentNodes(ref.current, '.department-channel-line.sp').forEach(
				item => {
					visible ? setClassName.add(item, 'sp1') : setClassName.remove(item, 'sp1')
				}
			)
		},
		[ visible ]
	)

	return <div className={ `set-cascade-id ${ visible ? 'sp1' : '' }` } ref={ ref }>
		{ visible ? <ChannelCascadeUniqueId { ...props } /> : <span className="uniqueId-sp">{ isEmpty(props.item.cascadeChannelUniqueId) ? <i className="red">未设置编号</i> : props.item.cascadeChannelUniqueId }</span> }
		<span
			className="set-visible"
			onClick={
				e => {
					e.stopPropagation()
					const v = !visible
					currentCascadeUniqueIdState.set(v ? props.item.uniqueId : '')
					setVisible(v)
				}
			}
		>{ visible ? '收起' : '设置编号' }</span>
	</div>
}

// 更新通道级联id ---------------------------------------------------------------------------------

// 更新组织部门级联id ---------------------------------------------------------------------------------
export interface CascadeDepUniqueIdProps {
	item: DepItem
	reload: () => void
}

export const DepCascadeUniqueId = ({ item }: CascadeDepUniqueIdProps): ReactElement => {
	const cascadeDepUniqueId = item.cascadeDepUniqueId ?? ''
	const departments = new Departments()
	const trees = departments.shared().trees
	const maps = departments.shared().maps

	const [ value, setValue ] = useFetchState('')
	const [ loading, setLoading ] = useFetchState(false)

	const submit = (e: any): void => {
		e.stopPropagation()
		if (value.length !== 20) {
			MMessage({
				message: `级联编号长度必须为20位, 当前长度为: ${ value.length }`,
				type: MessageType.error
			})
			return
		}

		setLoading(true)
		void DepUpdate<DepItem>({
			conditions: [ { column: 'id', value: item.id } ],
			data: [ { column: 'cascadeDepUniqueId', value } ]
		}).finally(
			() => {
				setLoading(false)

				departments.set({
					trees: TreeItem.rangeOptions([ ...trees ], v => {
						const data: OptionItem = { ...v }
						if (data.value === item.id && !isEmpty(data.raw)) {
							const raw: DepItem = { ...data.raw, cascadeDepUniqueId: value }
							data.raw = new VDepItem({ ...raw })
						}

						return data
					}),
					maps: rangeMaps({ ...maps }, v => {
						const data: TreeItem = { ...v }
						if (!isEmpty(data.raw) && data.raw.id === item.id) {
							const raw: DepItem = { ...data.raw, cascadeDepUniqueId: value }
							data.raw = new VDepItem({ ...raw })
						}

						return data
					})
				})
				// reload()

				MMessage({
					message: '设置成功',
					type: MessageType.success
				})
			}
		)
	}

	useEffect(
		() => {
			setValue(item.cascadeDepUniqueId ?? '')

			if (isEmpty(cascadeDepUniqueId)) {
				setLoading(true)
				void genUniqueId({ type: 'cascadeDepCode', count: 1 }).then(
					res => {
						setValue(res.data !== undefined ? res.data[ 0 ] : '')
					}
				).finally(
					() => {
						setLoading(false)
					}
				)
			}
		},
		[]
	)

	return <div className="channel-cascade-id" onClick={ e => { e.stopPropagation() } }>
		<Input
			value={ value }
			prefix={ loading ? <Loading size={ SpinSizes.small } /> : <></> }
			onChange={ e => { setValue(e.target.value) } }
			placeholder="请输入组织级联编号"
		/>
		<Button onClick={ submit }>确定</Button>
	</div>
}

export const SetDepCascadeUniqueId = (props: CascadeDepUniqueIdProps): ReactElement => {
	const currentCascadeUniqueIdState = new CurrentCascadeUniqueIdState()
	const [ visible, setVisible ] = useFetchState(false)

	useEffect(
		() => {
			if (currentCascadeUniqueIdState.state !== props.item.cascadeDepUniqueId) {
				setVisible(false)
			}
		},
		[ currentCascadeUniqueIdState.state ]
	)

	return <div className="set-cascade-id" style={ { marginLeft: 'auto' } }>
		{ visible ? <DepCascadeUniqueId { ...props } /> : <span className="uniqueId-sp">{ isEmpty(props.item.cascadeDepUniqueId) ? <i className="red">未设置编号</i> : props.item.cascadeDepUniqueId }</span> }
		<span
			className="set-visible"
			onClick={
				e => {
					e.stopPropagation()
					const v = !visible
					currentCascadeUniqueIdState.set(v ? props.item.cascadeDepUniqueId : '')
					setVisible(v)
				}
			}
		>{ visible ? '收起' : '设置编号' }</span>
	</div>
}

// 更新组织部门级联id ---------------------------------------------------------------------------------

export const ChannelListMakeUniqueId = (item: CItem): string => {
	return item.deviceUniqueId + '@' + item.uniqueId
}

// 通道列表
export const ChannelList = (props: ChannelsPopupType): ReactElement => {
	const defaultMaxInterval = 20
	const defaultInterval = 10
	const defaultOnline = -1
	const scrollRef = useRef<InfiniteScrollRef<CItem>>(null)
	const initRef = useRef(false)

	const [ checkedChannelUniqueIds, setCheckedChannelUniqueIds ] = useFetchState<any[]>(props.checkedChannelUniqueIds ?? [])
	const [ keyword, setKeyword ] = useFetchState('')
	const [ online, setOnline ] = useFetchState(defaultOnline)
	const [ interval, setInterval ] = useFetchState(props.interval ?? defaultInterval)
	const [ list, setList ] = useFetchState<CItem[]>([])
	const [ deviceMaps, setDeviceMaps ] = useFetchState<{ [key: string]: DDeviceItem }>({})

	const handleFilter = ({ keyword, interval, online }: { keyword: string, interval: number, online: number }): void => {
		setKeyword(keyword.trim())
		setInterval(interval)
		setOnline(online)
		setCheckedChannelUniqueIds([])
	}

	const parseUniqueId = (uniqueId: string): { deviceUniqueId: string, channelUniqueId: any } => {
		if (props.useOriginalId === true) {
			return { deviceUniqueId: '', channelUniqueId: uniqueId }
		}

		const [ deviceUniqueId, channelUniqueId ] = uniqueId.split('@')
		return { deviceUniqueId, channelUniqueId }
	}

	const handleClick = (item: CItem): void => {
		const uniqueId = props.useOriginalId === true ? item.id : ChannelListMakeUniqueId(item)
		if (inArray(checkedChannelUniqueIds, uniqueId)) {
			setCheckedChannelUniqueIds(checkedChannelUniqueIds.filter(val => val !== uniqueId))
		} else {
			setCheckedChannelUniqueIds([ ...checkedChannelUniqueIds, uniqueId ])
		}
	}

	const submit = (): void => {
		const maps: { [key: string | number | symbol]: CItem } = {}
		list.forEach(
			item => {
				maps[ props.useOriginalId === true ? item.id : item.uniqueId ] = item
			}
		)

		const cancelCheckedChannelItems: CItem[] = []
		props.checkedChannelUniqueIds?.forEach(
			item => {
				if (!inArray(checkedChannelUniqueIds, item)) {
					if (props.useOriginalId === true) {
						const v = maps[ item ]
						if (!isEmpty(v)) {
							cancelCheckedChannelItems.push(v)
						}
						return
					}

					const { channelUniqueId } = parseUniqueId(item as string)
					const v = maps[ channelUniqueId ]
					if (!isEmpty(v)) {
						cancelCheckedChannelItems.push(v)
					}
				}
			}
		)

		const channelItems: CItem[] = []
		checkedChannelUniqueIds.forEach(
			item => {
				if (props.useOriginalId === true) {
					const v = maps[ item ]
					if (!isEmpty(v)) {
						channelItems.push(v)
					}
					return
				}

				const { channelUniqueId } = parseUniqueId(item as string)
				const v = maps[ channelUniqueId ]
				if (!isEmpty(v)) {
					channelItems.push(v)
				}
			}
		)

		props.submit?.({
			close: props.close,
			interval,
			channelItems,
			cancelCheckedChannelItems
		})
	}

	useEffect(
		() => {
			if (!initRef.current) {
				return
			}

			throttle(
				() => {
					scrollRef.current?.reset()
				},
				1000,
				'fetch-channel-list'
			)
		},
		[ keyword, online ]
	)

	return <div className="dc-box">
		{ props.title !== undefined ? <p className="title">{ props.title }</p> : <></> }
		{
			props.filterState === true
				? <div className="filters">
					<Tooltip title="搜索通道" arrow={ true }>
						<div className="item search">
							<Input
								value={ keyword }
								placeholder="请输入搜索内容"
								onChange={
									e => {
										handleFilter({ keyword: e.target.value, interval, online })
									}
								}
							/>
						</div>
					</Tooltip>
					<Tooltip title="在线状态" arrow={ true }>
						<div className="item state">
							<Select
								placeholder="在线状态"
								optionFilterProp="label"
								value={ online }
								options={[ { value: defaultOnline, label: '全部' }, { value: 0, label: '不在线' }, { value: 1, label: '在线' } ]}
								onChange={
									online => {
										handleFilter({ keyword, online, interval })
									}
								}
							/>
						</div>
					</Tooltip>
					{
						props.hideInterval === true
							? <></>
							: <Tooltip title={ `轮播间隔(单位/s) 最小${ defaultInterval }s 最大${ defaultMaxInterval }s` } arrow={ true }>
								<div className="item interval">
									<InputNumber
										value={ interval }
										min={ defaultInterval }
										max={ defaultMaxInterval }
										onChange={
											interval => {
												handleFilter({ keyword, interval: interval ?? defaultInterval, online })
											}
										}
										placeholder="轮播间隔(单位/s)"
									/>
								</div>
							</Tooltip>
					}
				</div>
				: <></>
		}
		<div className="list-box">
			<InfiniteScroll<CItem>
				uniqueId="channel-list"
				ref={ scrollRef }
				fetchData={
					async(page: number): Promise<CItem[]> => {
						const conditions: Array<Condition<CItem>> = [ { column: 'parental', value: 0 } ]
						if (keyword !== '') {
							conditions.push({
								column: 'name',
								value: keyword,
								inner: [
									{
										column: 'name',
										value: keyword,
										operator: Operator.like,
										logicalOperator: OperatorOuter.or
									},
									{
										column: 'label',
										value: keyword,
										operator: Operator.like,
										logicalOperator: OperatorOuter.or
									},
									{
										column: 'uniqueId',
										value: keyword,
										logicalOperator: OperatorOuter.or
									}
								]
							})
						}

						if (online !== defaultOnline) {
							conditions.push({
								column: 'online',
								value: online
							})
						}

						return await new Promise((resolve) => {
							void ChannelListApi({ page, limit: 20, conditions }).then(
								res => {
									if (res.data === undefined) {
										return
									}

									setDeviceMaps(
										{
											...deviceMaps,
											...rangeMaps(
												res.data.maps ?? {},
												item => new VDeviceItem(item as Partial<DDeviceItem>)
											)
										}
									)
									setList(res.data.list ?? [])
									resolve(res.data.list ?? [])
								}
							).finally(
								() => {
									initRef.current = true
								}
							)
						})
					}
				}
				renderItem={
					(item, key) => <div className="cursor-pointer flex column" key={ key }>
						<div
							className="item-1"
							onClick={ () => { handleClick(item) } }
						>
							<Checkbox checked={ inArray(checkedChannelUniqueIds, props.useOriginalId === true ? item.id : ChannelListMakeUniqueId(item)) } />
							<Icon className="i-4x" tap><IconCamera /></Icon>
							<span className="st">
								{ isEmpty(item.label) ? item.name : item.label }
								<span className="device-uniqueId">
									{ item.deviceUniqueId }
									{ isEmpty(deviceMaps[ item.deviceUniqueId ]) ? <></> : <i className="green">({ deviceMaps[ item.deviceUniqueId ]?.accessProtocolExample() })</i> }
								</span>
								<span className="device-uniqueId s">{ item.uniqueId }</span>
								{ item.online === 1 ? <span className="online blue">在线</span> : <span className="online red">离线</span> }
							</span>
						</div>
					</div>
				}
				pageSize={ 20 }
				threshold={ 50 }
				initialPage={ 1 }
			/>
		</div>
		<div className="footer">
			{ checkedChannelUniqueIds.length > 0 ? <span className="select-count">已选择: <i>{ checkedChannelUniqueIds.length }</i> 个</span> : <></> }
			<span className="flex-cc">
				<Checkbox
					checked={ checkedChannelUniqueIds.length > 0 && arrayIntersection(checkedChannelUniqueIds, list.map(item => props.useOriginalId === true ? item.id : ChannelListMakeUniqueId(item))).length === checkedChannelUniqueIds.length && list.length === checkedChannelUniqueIds.length }
					onChange={
						v => {
							setCheckedChannelUniqueIds(
								v.target.checked ? list.map(item => props.useOriginalId === true ? item.id : ChannelListMakeUniqueId(item)) : []
							)
						}
					}
				>全选</Checkbox>
			</span>
			{
				variables.licenseError !== undefined || variables.showcase === true
					? <Tooltip title={ errorMessage() } arrow={ true }><Button type="primary" disabled={ true }>确定</Button></Tooltip>
					: <Button type="primary" onClick={ submit }>确定</Button>
			}
		</div>
	</div>
}

interface ChannelPointComponentProps {
	item: CItem
	reloadChannelList?: () => void
	reloadMap?: (item: CItem) => void
}

interface PenetrateProps {
	onSelected: (item: CItem, clear: boolean) => void
	selectedChannelUniqueIds: string[]
	afterSetDepartment?: () => void
	customContextMenu?: (props: { deviceUniqueId: string, channelUniqueId: string, children: React.ReactElement }) => ReactElement
	useChannelUnique?: boolean
	pointComponent?: (props: ChannelPointComponentProps) => ReactElement
	reloadChannelList?: () => void
	reloadMap?: (item: CItem) => void
	channelClick?: (item: CItem) => void
}

// device ---------------------------------------------------------------------------------------------------------------------------------------------------------------------

const DeviceLabel = ({ item }: { item: DDeviceItem }): ReactElement => {
	const inputSet = new VInputSet()
	const setting = new SSetting()
	const permissions = setting.shared()?.permissionIds ?? []
	const Super = setting.shared()?.super ?? 0

	const [ label, setLabel ] = useFetchState(isEmpty(item.label) ? item.name : item.label)

	if (Super < 1 && !inArray(permissions, 'P_1_4_2_1')) {
		return <span className="flex-1 ellipsis-1">{ label }<i className="access-protocol">{ item.accessProtocolExample() }</i></span>
	}

	return <Dropdown
		getPopupContainer={ ele => ele.parentElement?.parentElement?.parentElement ?? ele }
		menu={
			{
				items: [
					{
						key: '1',
						label: '设置名称',
						onClick: e => {
							e.domEvent.stopPropagation()
							if (variables.licenseError !== undefined || variables.showcase === true) {
								MMessage({ message: errorMessage(), type: MessageType.warning })
								return
							}

							inputSet.set({
								visible: true,
								title: <>设置标题</>,
								defaultValue: label,
								submit: (value, close) => {
									void DeviceUpdate<DDeviceItem>({
										conditions: [ { column: 'deviceUniqueId', value: item.deviceUniqueId } ],
										data: [ { column: 'label', value } ]
									}).then(
										() => {
											close()
											MMessage({ message: '设置成功', type: MessageType.success })
											setLabel(value)
										}
									)
								}
							})
						}
					}
				]
			}
		}
		trigger={ [ 'contextMenu' ] }
		placement="top"
		arrow={ true }
		autoAdjustOverflow={ true }
	><span className="flex-1 ellipsis-1">{ label }<i className="access-protocol">{ item.accessProtocolExample() }</i></span></Dropdown>
}

interface CDeviceItemLoadedItem {
	// 选择设备
	selectDevice: (item?: CItem, clear?: boolean) => void
}

const CDeviceItem = (
	props: {
		item: DDeviceItem
		defDeviceUniqueId?: string
		loaded?: (
			deviceUniqueId: string,
			data: CDeviceItemLoadedItem
		) => void
	} & PenetrateProps
): ReactElement => {
	const [ loading, setLoading ] = useFetchState(false)
	const [ currentItem, setCurrentItem ] = useFetchState<DDeviceItem | undefined>(undefined)

	const channelLoadedRef = useRef<{ [ key: string ]: ChannelMenusLoadedItem }>({})
	const loadedChannelCompletionInterval = useRef(0)

	const handleClick = (item: DDeviceItem): void => {
		setCurrentItem(currentItem === undefined ? item : undefined)
	}

	useEffect(
		() => {
			if (props.defDeviceUniqueId === props.item.deviceUniqueId) {
				setCurrentItem(props.item)
			}
		},
		[ props.defDeviceUniqueId ]
	)

	useEffect(
		() => {
			props.loaded?.(
				props.item.deviceUniqueId ?? '',
				{
					selectDevice: (channelItem, clear) => {
						if (clear === true) {
							setCurrentItem(undefined)
							return
						}

						// 选中设备
						handleClick(props.item)
						if (channelItem === undefined) return

						// 选中通道 等待通道加载完成
						loadedChannelCompletionInterval.current = setInterval(
							() => {
								const tmp = channelItem.uniqueId.split('-')
								if (!isEmpty(channelLoadedRef.current[ tmp[ tmp.length - 1 ] ])) {
									clearInterval(loadedChannelCompletionInterval.current)
								}
								channelLoadedRef.current[ tmp[ tmp.length - 1 ] ]?.selectChannel()
							},
							300
						) as unknown as number
						// 超时处理
						setTimeout(
							() => {
								clearInterval(loadedChannelCompletionInterval.current)
							},
							3000
						)
					}
				}
			)

			return () => {
				clearInterval(loadedChannelCompletionInterval.current)
			}
		},
		[]
	)

	return <div className={ `item ${ currentItem !== undefined ? 'active' : '' }` } onClick={ () => { handleClick(props.item) } }>
		<div className="info">
			<Icon className="i-4x" tap><IconDeviceGroup /></Icon>
			<DeviceLabel item={ props.item } />
			{ loading ? <Icon className="i-2x rotating-ele" tap><IconLoading /></Icon> : <></> }
			<span className="channel-total">{ props.item.chanelCount ?? 0 }</span>
			<Icon className={ `i-lg ${ currentItem !== undefined ? 'rotate-270' : 'rotate-180' } arrow` } tap>
				<IconArrow />
			</Icon>
		</div>
		{
			currentItem !== undefined
				? <div className="wh100">
					<ChannelMenus
						useChannelUnique={ props.useChannelUnique }
						onSelected={ props.onSelected }
						setLoading={ setLoading }
						deviceItem={ props.item }
						selectedChannelUniqueIds={ props.selectedChannelUniqueIds }
						afterSetDepartment={ props.afterSetDepartment }
						customContextMenu={ props.customContextMenu }
						pointComponent={ props.pointComponent }
						channelClick={ props.channelClick }
						reloadMap={ props.reloadMap }
						loaded={
							(channelUniqueId, data) => {
								const tmp = channelUniqueId.split('-')
								channelLoadedRef.current[ tmp[ tmp.length - 1 ] ] = data
							}
						}
					/>
				</div>
				: <></>
		}
	</div>
}

interface DeviceMenusProps extends PenetrateProps {
	className?: string
	accessProtocols?: number[]
	hideEmptyState?: boolean
	defDeviceUniqueId?: string
}

export interface DeviceMenusRef {
	tracingChannel: (item: CItem, clear?: boolean) => void
}

export const DeviceMenus = forwardRef(
	(
		props: DeviceMenusProps,
		ref?: React.Ref<DeviceMenusRef>
	): ReactElement => {
		const deviceLoadedRef = useRef<{ [ key: string ]: CDeviceItemLoadedItem }>({})
		const scrollRef = useRef<InfiniteScrollRef<DDeviceItem>>(null)
		// 溯源通道
		const tracingChannel = (item: CItem, clear?: boolean): void => {
			// 清除所有设备选中
			for (const k in deviceLoadedRef.current) {
				deviceLoadedRef.current[ k ]?.selectDevice(item, true)
			}

			if (clear === true) return

			if (item.deviceUniqueId === '') {
				return
			}

			deviceLoadedRef.current[ item.deviceUniqueId ]?.selectDevice(item)
		}

		useImperativeHandle(
			ref,
			() => ({
				tracingChannel
			}),
			[ tracingChannel ]
		)

		return <InfiniteScroll<DDeviceItem>
			uniqueId="deviceMenus"
			ref={ scrollRef }
			endComponent={ props.hideEmptyState === true ? <></> : undefined }
			fetchData={
				async(page: number): Promise<DDeviceItem[]> => {
					return await new Promise((resolve) => {
						let conditions: Array<Condition<DDeviceItem>> = []
						if (props.accessProtocols !== undefined) {
							conditions = [ { column: 'accessProtocol', values: props.accessProtocols } ]
						}

						void DeviceListApi({ page, limit: 20, conditions }).then(
							res => {
								if (res.data === undefined) {
									return
								}

								resolve(res.data.list ?? [])
							}
						)
					})
				}
			}
			className={ `d-menus ${ props.className ?? '' }` }
			renderItem={
				(item, key) => <CDeviceItem
					useChannelUnique={ props.useChannelUnique }
					defDeviceUniqueId={ props.defDeviceUniqueId }
					onSelected={ props.onSelected }
					selectedChannelUniqueIds={ props.selectedChannelUniqueIds }
					afterSetDepartment={ props.afterSetDepartment }
					item={ item }
					key={ key }
					pointComponent={ props.pointComponent }
					channelClick={ props.channelClick }
					reloadMap={ props.reloadMap }
					customContextMenu={ props.customContextMenu }
					loaded={
						(deviceUniqueId, data) => {
							deviceLoadedRef.current[ deviceUniqueId ] = data
						}
					}
				/>
			}
			pageSize={ 20 }
			threshold={ 50 }
			initialPage={ 1 }
		/>
	}
)

DeviceMenus.displayName = 'DeviceMenus'

// channel ---------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const SetChannelPoints: FC<ChannelPointComponentProps> = props => {
	const getMapPoints = new GetMapPointsState()
	const data = props.item
	const setting = new SSetting()
	const settingState = setting.shared()
	const [ mapCenterPoints ] = useFetchState(
		isEmpty(settingState?.setting?.mapCenterPoints)
			? defMapCenterPoints
			: (settingState?.setting?.mapCenterPoints ?? '').split(',').map(item => parseFloat(item)) as [ number, number ]
	)
	const onClick = (e: React.MouseEvent<HTMLElement>): void => {
		e.stopPropagation()

		getMapPoints.set({
			visible: true,
			points: data.latitude === 0 || data.longitude === 0 ? mapCenterPoints : [ data.latitude, data.longitude ],
			callback: (lat, lng) => {
				void ChannelUpdate<CItem>({
					conditions: [ { column: 'id', value: data.id } ],
					data: [
						{ column: 'latitude', value: lat },
						{ column: 'longitude', value: lng }
					]
				}).then(
					() => {
						data.latitude = lat
						data.longitude = lng

						props.reloadChannelList?.()
						props.reloadMap?.(data)
						MMessage({ message: '设置成功', type: MessageType.success })
					}
				)
			}
		} satisfies GetMapPointsStateProps)
	}

	return <div onClick={ onClick }><Icon className="i-4x" tap><IconPos1 /></Icon></div>
}

export const CDepartmentRender = ({ record, defaultOpenKeys }: DepartmentTreesRenderProps): MenuItem => {
	if (record !== null) {
		const data = (record as any)
		data.icon = <Icon className="i-4x" tap>
			{ inArray(defaultOpenKeys, `${ record.key }`) ? <IconFolder1 /> : <IconFolder2 /> }
		</Icon>

		return data
	}

	return record
}

interface CChannelItemProps {
	item: CItem
	deviceItem: DDeviceItem
	loaded?: (
		channelUniqueId: string,
		data: ChannelMenusLoadedItem
	) => void
}

const CChannelItem = (props: CChannelItemProps & PenetrateProps): ReactElement => {
	const setting = new SSetting()
	const Super = setting.shared()?.super ?? 0
	const permissions = setting.shared()?.permissionIds ?? []

	const [ currentItem, setCurrentItem ] = useFetchState<CItem | undefined>(undefined)
	const [ selectedUniqueId, setSelectedUniqueId ] = useFetchState('')
	const [ loading, setLoading ] = useFetchState(false)

	useEffect(
		() => {
			props.loaded?.(
				props.item.uniqueId,
				{
					selectChannel: () => {
						handleClick(props.item)
					}
				}
			)
		},
		[]
	)

	const submit = (e: any): void => {
		e.stopPropagation()
		if (variables.licenseError !== undefined || variables.showcase === true) {
			MMessage({ message: errorMessage(), type: MessageType.warning })
			return
		}

		if (isEmpty(selectedUniqueId)) {
			MMessage({ message: '选择值错误', type: MessageType.error })
			return
		}

		const depIds = [ parseInt(selectedUniqueId) ]
		const tmp = props.item.uniqueId.split('-')
		void ChannelUpdate<CItem>({
			conditions: [ { column: 'uniqueId', value: tmp.length >= 2 ? tmp[ 1 ] : props.item.uniqueId } ],
			data: [ { column: 'depIds', value: depIds } ]
		}).then(props.afterSetDepartment)
	}

	const handleClick = (item: CItem): void => {
		if (variables.popConfirm) return

		setCurrentItem(currentItem === undefined ? item : undefined)
		if (props.item.parental === 1) { // 子目录
			return
		}

		props.onSelected(item, currentItem !== undefined)
		props.channelClick?.(item)
	}

	const inner = <div className="info">
		<Icon className="i-4x" tap><IconCamera /></Icon>
		<span className="flex-1 ellipsis-1">{ isEmpty(props.item.label) ? props.item.name : props.item.label }</span>
		{ loading ? <Icon className="i-2x rotating-ele" tap><IconLoading /></Icon> : <></> }
		{ props.item.parental === 1 ? <Icon className={ `i-lg ${ currentItem !== undefined ? 'rotate-270' : 'rotate-180' } arrow` } tap><IconArrow /></Icon> : <></> }
		{ props.pointComponent?.({ item: props.item, reloadMap: props.reloadMap, reloadChannelList: props.reloadChannelList }) }
	</div>

	useEffect(
		() => {
			if (props.item.parental === 1) {
				return
			}
			setCurrentItem(inArray(props.selectedChannelUniqueIds, props.item.uniqueId) ? props.item : undefined)
		},
		[ props.selectedChannelUniqueIds ]
	)

	return <div
		className={ `item s ${ currentItem !== undefined ? 'active' : '' }` }
		onClick={
			e => {
				e.stopPropagation()
				handleClick(props.item)
			}
		}
	>
		{
			Super >= 1 || inArray(permissions, 'P_1_4_2_1')
				? (
					props.customContextMenu !== undefined
						? props.customContextMenu({ children: inner, channelUniqueId: props.item.uniqueId, deviceUniqueId: props.item.deviceUniqueId })
						: <Popconfirm
							placement="bottomLeft"
							title="分配组织"
							icon={ null }
							description={
								<DepartmentTrees
									defaultSelectedKeys={ props.item.depIds.map(item => item.toString()) }
									className="filter-trees-menu department-popup-confirm"
									itemRender={ params => CDepartmentRender({ ...params, hiddenChannel: true }) }
									selectedKey={ v => { setSelectedUniqueId(v) } }
									inlineIndent={ 8 }
								/>
							}
							onConfirm={ submit }
							onOpenChange={
								v => {
									if (!v) {
										setTimeout(
											() => {
												variables.popConfirm = v
											},
											500
										)
										return
									}
									variables.popConfirm = v
								}
							}
							okButtonProps={ { disabled: selectedUniqueId === '' } }
							okText="确认"
							cancelText="取消"
							trigger="contextMenu"
						>{ inner }</Popconfirm>
				)
				: inner
		}
		{
			props.item.parental === 1 && currentItem !== undefined
				? <div className="wh100">
					<ChannelMenus
						onSelected={ props.onSelected }
						setLoading={ setLoading }
						deviceItem={ props.deviceItem }
						channelItem={ props.item }
						selectedChannelUniqueIds={ props.selectedChannelUniqueIds }
						afterSetDepartment={ props.afterSetDepartment }
					/>
				</div>
				: <></>
		}
	</div>
}

interface ChannelMenusLoadedItem {
	selectChannel: () => void
}

interface ChannelMenuProps extends PenetrateProps {
	deviceItem: DDeviceItem
	channelItem?: CItem
	setLoading: (value: boolean) => void
	loaded?: (
		channelUniqueId: string,
		data: ChannelMenusLoadedItem
	) => void
}

export const ChannelMenus = (props: ChannelMenuProps): ReactElement => {
	const scrollRef = useRef<InfiniteScrollRef<CItem>>(null)

	return <InfiniteScroll<CItem>
		uniqueId="channel-list-1"
		ref={ scrollRef }
		endComponent={ <></> }
		fetchData={
			async(page: number): Promise<CItem[]> => {
				props.setLoading(true)
				return await new Promise((resolve) => {
					let conditions: Array<Condition<CItem>> = [ { column: 'deviceUniqueId', value: props.deviceItem.deviceUniqueId } ]
					if (props.channelItem !== undefined) {
						conditions = [
							{ column: 'parentID', value: props.channelItem.uniqueId },
							{ column: 'deviceUniqueId', value: props.channelItem.deviceUniqueId }
						]
					}

					void ChannelListApi({ page, limit: 20, conditions }).then(
						res => {
							if (res.data === undefined) {
								return
							}

							if (props.useChannelUnique === true) {
								resolve(
									(res.data.list ?? []).map(
										item => {
											item.uniqueId = `${ item.id }-${ item.uniqueId }`
											return item
										}
									)
								)
								return
							}

							resolve(res.data.list ?? [])
						}
					).finally(
						() => {
							setTimeout(
								() => {
									props.setLoading(false)
								},
								300
							)
						}
					)
				})
			}
		}
		className="d-menus c"
		renderItem={
			(item, key) => <CChannelItem
				onSelected={ props.onSelected }
				item={ item }
				deviceItem={ props.deviceItem }
				selectedChannelUniqueIds={ props.selectedChannelUniqueIds }
				afterSetDepartment={ props.afterSetDepartment }
				key={ key }
				customContextMenu={ props.customContextMenu }
				pointComponent={ props.pointComponent }
				channelClick={ props.channelClick }
				reloadMap={ props.reloadMap }
				reloadChannelList={ () => { scrollRef.current?.reload() } }
				loaded={ props.loaded }
			/>
		}
		pageSize={ 20 }
		threshold={ 50 }
		initialPage={ 1 }
	/>
}

interface RespQueryProps {
	close: () => void
}

export const RespQuery = (_: RespQueryProps): ReactElement => {
	const [ loading, setLoading ] = useFetchState(false)
	const [ val, setVal ] = useFetchState('')
	const [ data, setData ] = useFetchState<string[]>([])

	const submit = (): void => {
		setLoading(true)
		void RespQueryApi(val).then(
			res => {
				setData(res.data ?? [])
			}
		)
		setLoading(false)
	}

	return <div className="resp-query-container">
		<div className="header">
			<Input value={ val } onChange={ e => { setVal(e.target.value) } } />
			<Button type="primary" loading={ loading } onClick={ submit }>查询</Button>
		</div>
		<div className="content">
			{ data.map((item, index) => <p key={ index }>{ item }</p>) }
		</div>
	</div>
}

// 地图 -------------------------------------------------------

// 天地图默认地址
const TIAN_DI_TU_URLS = {
	// 矢量底图
	vec: {
		normal: 'http://t{s}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk={key}',
		annotation: 'http://t{s}.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk={key}'
	},
	// 影像底图
	img: {
		normal: 'http://t{s}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk={key}',
		annotation: 'http://t{s}.tianditu.gov.cn/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk={key}'
	},
	// 地形底图
	ter: {
		normal: 'http://t{s}.tianditu.gov.cn/DataServer?T=ter_w&x={x}&y={y}&l={z}&tk={key}',
		annotation: 'http://t{s}.tianditu.gov.cn/DataServer?T=cta_w&x={x}&y={y}&l={z}&tk={key}'
	}
}

// 天地图图层组件
interface DirectTianDiTuLayerProps {
	type: 'vec' | 'img' | 'ter'
	apiKey: string
	showAnnotation?: boolean
}

export const DirectTianDiTuLayer: React.FC<DirectTianDiTuLayerProps> = ({
	type = 'vec',
	apiKey,
	showAnnotation = true
}) => {
	const map = useMap()

	useEffect(
		() => {
			// 主图层
			const mainLayer = L.tileLayer(
				TIAN_DI_TU_URLS[ type ].normal,
				{
					subdomains: [ '0', '1', '2', '3', '4', '5', '6', '7' ],
					key: apiKey,
					maxZoom: 18,
					minZoom: 1
				} as any as TileLayerOptions
			)

			// 注记图层
			let annotationLayer: L.TileLayer | null = null
			if (showAnnotation) {
				annotationLayer = L.tileLayer(
					TIAN_DI_TU_URLS[ type ].annotation,
					{
						subdomains: [ '0', '1', '2', '3', '4', '5', '6', '7' ],
						key: apiKey,
						maxZoom: 18,
						minZoom: 1
					} as any as TileLayerOptions
				)
			}

			// 添加到地图
			mainLayer.addTo(map)
			if (annotationLayer !== null) {
				annotationLayer.addTo(map)
			}

			return () => {
				map.removeLayer(mainLayer)

				if (annotationLayer !== null) {
					map.removeLayer(annotationLayer)
				}
			}
		}
		,
		[ map, type, apiKey, showAnnotation ]
	)

	return null
}

// 点击地图
export const MapClickHandler: React.FC<{
	onMapClick?: (lat: number, lng: number) => void
}> = ({ onMapClick }) => {
	useMapEvents({
		click: (e) => {
			onMapClick?.(e.latlng.lat, e.latlng.lng)
		}
	})

	return null
}

// 地图更新
export const MapSizeUpdater = ({ foldUpState }: { foldUpState?: boolean }): null => {
	const map = useMap()

	useEffect(
		() => {
			const handleResize = (): void => {
				setTimeout(() => {
					map.invalidateSize()
				}, 100)
			}

			window.addEventListener('resize', handleResize)
			handleResize()
			return () => {
				window.removeEventListener('resize', handleResize)
			}
		},
		[ map, foldUpState ]
	)

	return null
}

export interface MapPointControllerProps {
	center?: [ number, number ]
	zoom?: number
}

// 坐标跳转
export const MapPointController = ({ center, zoom }: MapPointControllerProps): null => {
	const map = useMap()

	useEffect(
		() => {
			if (center === undefined) {
				return
			}

			map.setView(center, zoom ?? map.getZoom())
		},
		[ center, zoom, map ]
	)

	return null
}

interface MapMarker {
	id: string | number
	position: [number, number] // [lat, lng]
}

export const GetMapPoints: FC<GetMapPointsStateProps> = ({ points, callback }) => {
	const setting = new SSetting()
	// 地图地址
	// 离线地图URL格式：{z}/{x}/{y}.png '/tiles/{z}/{x}/{y}.png'
	const proxyFileUrl = setting.shared()?.[ 'proxy-file-url' ] ?? ''
	const tmapKey = setting.shared()?.[ 'tmap-key' ] ?? ''
	const mapTilesTmp = setting.shared()?.setting?.mapTiles ?? ''

	const [ mapTiles, setMapTiles ] = useFetchState<MapTiles>(defPapTiles)
	const [ mapComplete, setMapComplete ] = useFetchState(false)
	const [ markers, setMarkers ] = useFetchState<MapMarker[]>([])

	useEffect(
		() => {
			// 默认在线地图
			let mapTiles = defPapTiles
			if (!isEmpty(mapTilesTmp)) {
				// 本地天地图
				mapTiles = { type: 0, url: `${ proxyFileUrl }/${ mapTilesTmp }`, key: '' }
			} else {
				// 在线天地图
				if (!isEmpty(tmapKey)) {
					mapTiles = { type: 1, url: '', key: tmapKey }
				}
			}

			setMapTiles(mapTiles)
			setMarkers([ { id: 1, position: points ?? defMapCenterPoints } ])
			setMapComplete(true)
		},
		[ proxyFileUrl, mapTilesTmp, tmapKey, points ]
	)

	return mapComplete
		? <div className="map-box">
			<MapContainer
				center={ markers.length > 0 ? markers[ 0 ].position : undefined }
				zoom={ 6 }
				scrollWheelZoom={ true }
				zoomControl={ true }
				dragging={ true }
				className="wh100"
			>
				{ mapTiles.type === 0 ? <TileLayer url={ mapTiles.url } /> : <></> }
				{ mapTiles.type === 1 ? <DirectTianDiTuLayer type="vec" apiKey={ mapTiles.key } showAnnotation={ true } /> : <></> }
				{ mapTiles.type === 2 ? <TileLayer url={ mapTiles.url } /> : <></> }
				<MapClickHandler
					onMapClick={
						(lat: number, lng: number) => {
							setMarkers([ { id: 1, position: [ lat, lng ] } ])
							callback?.(lat, lng)
						}
					}
				/>
				<MapSizeUpdater />
				{
					markers.map(
						item => <Marker
							key={ item.id }
							position={ item.position }
							icon={
								L.divIcon({
									html: `<div class="map-marker center"><img src="${ IconPos }" alt=""></div>`,
									className: 'text-marker-icon',
									iconAnchor: [ 50, 20 ],
									popupAnchor: [ 0, -20 ]
								})
							}
						/>
					)
				}
			</MapContainer>
		</div>
		: <></>
}

// 地图 -------------------------------------------------------