import React from 'react'
import type { MenuProps } from 'antd'
import routes, { Path } from '#routers/constants'
import Location from '#components/location'
import Icon from '#components/icon'
import { ReactComponent as IconHome } from '#assets/svg/home.svg'
import { ReactComponent as IconSetting } from '#assets/svg/setting.svg'
import { ReactComponent as IconConfig } from '#assets/svg/config.svg'
import { ReactComponent as IconGroupDevice } from '#assets/svg/device-groups.svg'
import { ReactComponent as IconVideo2 } from '#assets/svg/video-2.svg'
import { ReactComponent as IconLog } from '#assets/svg/log.svg'

type MenuItem = Required<MenuProps>['items'][number]

interface MenuParams {
	permissions: string[]
	super: number
	showRespQuery: () => void
}

export const menus = (props: MenuParams): MenuItem[] => [
	props.super === 1 || props.permissions.includes(routes[ Path.home ].uniqueId ?? '')
		? {
			label: <Location to={ routes[ Path.home ].path }>
				<>{ routes[ Path.home ].title }</>
			</Location>,
			key: routes[ Path.home ].path,
			icon: <Icon className="i-4x" tap><IconHome /></Icon>
		}
		: null,
	props.super === 1 || props.permissions.includes(routes[ Path.videoPreview ].uniqueId ?? '')
		? {
			label: <Location to={ routes[ Path.videoPreview ].path ?? '' }>
				<>{ routes[ Path.videoPreview ].title }</>
			</Location>,
			key: routes[ Path.videoPreview ].path,
			icon: <Icon className="i-4x" tap><IconVideo2 /></Icon>
		}
		: null,
	props.super === 1 || props.permissions.includes(routes[ Path.devices ].uniqueId ?? '')
		? {
			label: routes[ Path.devices ].title,
			key: routes[ Path.devices ].path,
			icon: <Icon className="i-4x" tap><IconGroupDevice /></Icon>,
			children: [
				props.super === 1 || props.permissions.includes(routes[ Path.devices ].subs?.[ Path.deviceItems ].uniqueId ?? '')
					? {
						label: <Location to={ routes[ Path.devices ].subs?.[ Path.deviceItems ].path ?? '' }>
							<>{ routes[ Path.devices ].subs?.[ Path.deviceItems ].title }</>
						</Location>,
						key: routes[ Path.devices ].subs?.[ Path.deviceItems ].path ?? Path.deviceItems
					}
					: null,
				props.super === 1 || props.permissions.includes(routes[ Path.devices ].subs?.[ Path.deviceChannels ].uniqueId ?? '')
					? {
						label: <Location to={ routes[ Path.devices ].subs?.[ Path.deviceChannels ].path ?? '' }>
							<>{ routes[ Path.devices ].subs?.[ Path.deviceChannels ].title }</>
						</Location>,
						key: routes[ Path.devices ].subs?.[ Path.deviceChannels ].path ?? Path.deviceChannels
					}
					: null
			]
		}
		: null,
	props.super === 1 || props.permissions.includes(routes[ Path.system ].uniqueId ?? '')
		? {
			label: routes[ Path.system ].title,
			key: routes[ Path.system ].path,
			icon: <Icon className="i-4x" tap><IconSetting /></Icon>,
			children: [
				props.super === 1 || props.permissions.includes(routes[ Path.system ].subs?.[ Path.admins ].uniqueId ?? '')
					? {
						label: <Location to={ routes[ Path.system ].subs?.[ Path.admins ].path ?? '' }>
							<>{ routes[ Path.system ].subs?.[ Path.admins ].title }</>
						</Location>,
						key: routes[ Path.system ].subs?.[ Path.admins ].path ?? Path.admins
					}
					: null,
				props.super === 1 || props.permissions.includes(routes[ Path.system ].subs?.[ Path.departments ].uniqueId ?? '')
					? {
						label: <Location to={ routes[ Path.system ].subs?.[ Path.departments ].path ?? '' }>
							<>{ routes[ Path.system ].subs?.[ Path.departments ].title }</>
						</Location>,
						key: routes[ Path.system ].subs?.[ Path.departments ].path ?? Path.departments
					}
					: null,
				props.super === 1 || props.permissions.includes(routes[ Path.system ].subs?.[ Path.roles ].uniqueId ?? '')
					? {
						label: <Location to={ routes[ Path.system ].subs?.[ Path.roles ].path ?? '' }>
							<>{ routes[ Path.system ].subs?.[ Path.roles ].title }</>
						</Location>,
						key: routes[ Path.system ].subs?.[ Path.roles ].path ?? Path.roles
					}
					: null,
				props.super === 1 || props.permissions.includes(routes[ Path.system ].subs?.[ Path.systemInfo ].uniqueId ?? '')
					? {
						label: <Location to={ routes[ Path.system ].subs?.[ Path.systemInfo ].path ?? '' }>
							<>{ routes[ Path.system ].subs?.[ Path.systemInfo ].title }</>
						</Location>,
						key: routes[ Path.system ].subs?.[ Path.systemInfo ].path ?? Path.systemInfo
					}
					: null
			]
		}
		: null,
	props.super === 1 || props.permissions.includes(routes[ Path.configs ].uniqueId ?? '')
		? {
			label: routes[ Path.configs ].title,
			key: routes[ Path.configs ].path,
			icon: <Icon className="i-4x" tap><IconConfig /></Icon>,
			children: [
				props.super === 1 || props.permissions.includes(routes[ Path.configs ].subs?.[ Path.dictionaries ].uniqueId ?? '')
					? {
						label: <Location to={ routes[ Path.configs ].subs?.[ Path.dictionaries ].path ?? '' }>
							<>{ routes[ Path.configs ].subs?.[ Path.dictionaries ].title }</>
						</Location>,
						key: routes[ Path.configs ].subs?.[ Path.dictionaries ].path ?? Path.dictionaries
					}
					: null,
				props.super === 1 || props.permissions.includes(routes[ Path.configs ].subs?.[ Path.crontab ].uniqueId ?? '')
					? {
						label: <Location to={ routes[ Path.configs ].subs?.[ Path.crontab ].path ?? '' }>
							<>{ routes[ Path.configs ].subs?.[ Path.crontab ].title }</>
						</Location>,
						key: routes[ Path.configs ].subs?.[ Path.crontab ].path ?? Path.crontab
					}
					: null,
				props.super === 1 || props.permissions.includes(routes[ Path.configs ].subs?.[ Path.mediaServer ].uniqueId ?? '')
					? {
						label: <Location to={ routes[ Path.configs ].subs?.[ Path.mediaServer ].path ?? '' }>
							<>{ routes[ Path.configs ].subs?.[ Path.mediaServer ].title }</>
						</Location>,
						key: routes[ Path.configs ].subs?.[ Path.mediaServer ].path ?? Path.mediaServer
					}
					: null,
				props.super === 1 || props.permissions.includes(routes[ Path.configs ].subs?.[ Path.env ].uniqueId ?? '')
					? {
						label: <Location to={ routes[ Path.configs ].subs?.[ Path.env ].path ?? '' }>
							<>{ routes[ Path.configs ].subs?.[ Path.env ].title }</>
						</Location>,
						key: routes[ Path.configs ].subs?.[ Path.env ].path ?? Path.env
					}
					: null,
				props.super === 1 || props.permissions.includes(routes[ Path.configs ].subs?.[ Path.apiDoc ].uniqueId ?? '')
					? {
						label: <Location to={ routes[ Path.configs ].subs?.[ Path.apiDoc ].path ?? '' }>
							<>{ routes[ Path.configs ].subs?.[ Path.apiDoc ].title }</>
						</Location>,
						key: routes[ Path.configs ].subs?.[ Path.apiDoc ].path ?? Path.apiDoc
					}
					: null
			]
		}
		: null,
	props.super === 1 || props.permissions.includes(routes[ Path.logs ].uniqueId ?? '')
		? {
			label: routes[ Path.logs ].title,
			key: routes[ Path.logs ].path,
			icon: <Icon className="i-4x" tap><IconLog /></Icon>,
			children: [
				props.super === 1 || props.permissions.includes(routes[ Path.logs ].subs?.[ Path.alarms ].uniqueId ?? '')
					? {
						label: <Location to={ routes[ Path.logs ].subs?.[ Path.alarms ].path ?? '' }>
							<>{ routes[ Path.logs ].subs?.[ Path.alarms ].title }</>
						</Location>,
						key: routes[ Path.logs ].subs?.[ Path.alarms ].path ?? Path.alarms
					}
					: null,
				props.super === 1 || props.permissions.includes(routes[ Path.logs ].subs?.[ Path.operationLogs ].uniqueId ?? '')
					? {
						label: <Location to={ routes[ Path.logs ].subs?.[ Path.operationLogs ].path ?? '' }>
							<>{ routes[ Path.logs ].subs?.[ Path.operationLogs ].title }</>
						</Location>,
						key: routes[ Path.logs ].subs?.[ Path.operationLogs ].path ?? Path.operationLogs
					}
					: null,
				props.super === 1 || props.permissions.includes(routes[ Path.logs ].subs?.[ Path.runLogs ].uniqueId ?? '')
					? {
						label: <Location to={ routes[ Path.logs ].subs?.[ Path.runLogs ].path ?? '' }>
							<>{ routes[ Path.logs ].subs?.[ Path.runLogs ].title }</>
						</Location>,
						key: routes[ Path.logs ].subs?.[ Path.runLogs ].path ?? Path.runLogs
					}
					: null,
				props.super === 1 || props.permissions.includes(routes[ Path.logs ].subs?.[ Path.sipLog ].uniqueId ?? '')
					? {
						label: <Location to={ routes[ Path.logs ].subs?.[ Path.sipLog ].path ?? '' }>
							<>{ routes[ Path.logs ].subs?.[ Path.sipLog ].title }</>
						</Location>,
						key: routes[ Path.logs ].subs?.[ Path.sipLog ].path ?? Path.sipLog
					}
					: null,
				props.super === 1 || props.permissions.includes(routes[ Path.logs ].subs?.[ Path.vssSevState ].uniqueId ?? '')
					? {
						label: <Location to={ routes[ Path.logs ].subs?.[ Path.vssSevState ].path ?? '' }>
							<>{ routes[ Path.logs ].subs?.[ Path.vssSevState ].title }</>
						</Location>,
						key: routes[ Path.logs ].subs?.[ Path.vssSevState ].path ?? Path.vssSevState
					}
					: null,
				props.super === 1 || props.permissions.includes(routes[ Path.logs ].subs?.[ Path.pprofAnalyze ].uniqueId ?? '')
					? {
						label: <Location to={ routes[ Path.logs ].subs?.[ Path.pprofAnalyze ].path ?? '' }>
							<>{ routes[ Path.logs ].subs?.[ Path.pprofAnalyze ].title }</>
						</Location>,
						key: routes[ Path.logs ].subs?.[ Path.pprofAnalyze ].path ?? Path.pprofAnalyze
					}
					: null,
				props.super === 1 || props.permissions.includes(routes[ Path.logs ].subs?.[ Path.pprofAnalyze ].uniqueId ?? '')
					? {
						label: <span onClick={ props.showRespQuery }>
							{ routes[ Path.logs ].subs?.[ Path.respQuery ].title }
						</span>,
						key: routes[ Path.logs ].subs?.[ Path.respQuery ].path ?? Path.respQuery
					}
					: null
			]
		}
		: null
]
