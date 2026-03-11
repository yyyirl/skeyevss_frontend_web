import React from 'react'
import { type RouteComponentProps } from 'react-router-dom'
import type { RouteConfig, RouteConfigComponentProps } from 'react-router-config'
import routeMaps, { anchorPathParams, Path, pathParams } from '#routers/constants'
import Home from '#pages/home'
import Admins from '#pages/system/admins'
import Departments from '#pages/system/departments'
import Roles from '#pages/system/roles'
import SystemInfo from '#pages/system/info'
import Dictionaries from '#pages/configs/dictionaries'
import Crontab from '#pages/configs/crontab'
import MediaServer from '#pages/configs/media-server'
import Env from '#pages/configs/env'
import ApiDoc from '#pages/configs/api-doc'
import DeviceItems from '#pages/devices/items'
import DeviceChannels from '#pages/devices/channels'
import VideoFilters from '#pages/video-filters'
import OperationLogs from '#pages/logs/operation-logs'
import SipLogs from '#pages/logs/sip-logs'
import VssSevState from '#pages/logs/vss-sev-state'
import PProfAnalyze from '#pages/logs/pprof-analyze'
import RunLogs from '#pages/logs/run-logs'
import Alarms from '#pages/logs/alarms'

export interface PageRoute {
	// 列表路由
	list?: string
	// 详情路由
	row?: string
}

export interface RouteMatchParams {
	limit?: string
	page?: string

	sort?: string
	filter?: string
	anchor?: string

	id?: string
}

export interface RouteMatchAnchorParams {
	anchor?: string
}

interface ComponentProps {
	pageRoute: PageRoute
}

export type XRouteComponentProps = ComponentProps & RouteConfigComponentProps<RouteMatchParams>
export type XRouteAnchorComponentProps = ComponentProps & RouteConfigComponentProps<RouteMatchAnchorParams>
export type XSimpleRouteComponentProps = RouteConfigComponentProps<RouteMatchParams>

const routes: RouteConfig = [
	{
		title: import.meta.env.VITE_TITLE,
		path: routeMaps.home.path,
		exact: true,
		component: Home
	},
	{
		title: routeMaps[ Path.system ].subs?.[ Path.admins ].title,
		path: routeMaps[ Path.system ].subs?.[ Path.admins ].path + pathParams,
		exact: true,
		render: (props: RouteComponentProps) => <Admins
			{ ...{ ...props, pageRoute: { list: routeMaps[ Path.system ].subs?.[ Path.admins ].path } } }
		/>
	},
	{
		title: routeMaps[ Path.system ].subs?.[ Path.departments ].title,
		path: routeMaps[ Path.system ].subs?.[ Path.departments ].path + pathParams,
		exact: true,
		render: (props: RouteComponentProps) => <Departments
			{
				...{
					...props,
					pageRoute: { list: routeMaps[ Path.system ].subs?.[ Path.departments ].path }
				}
			}
			parentId={ 0 }
			parentName=""
			tableMode="page"
		/>
	},
	{
		title: routeMaps[ Path.system ].subs?.[ Path.roles ].title,
		path: routeMaps[ Path.system ].subs?.[ Path.roles ].path + pathParams,
		exact: true,
		render: (props: RouteComponentProps) => <Roles
			{ ...{ ...props, pageRoute: { list: routeMaps[ Path.system ].subs?.[ Path.roles ].path } } }
		/>
	},
	{
		title: routeMaps[ Path.logs ].subs?.[ Path.operationLogs ].title,
		path: routeMaps[ Path.logs ].subs?.[ Path.operationLogs ].path + pathParams,
		exact: true,
		render: (props: RouteComponentProps) => <OperationLogs
			{ ...{ ...props, pageRoute: { list: routeMaps[ Path.logs ].subs?.[ Path.operationLogs ].path } } }
		/>
	},
	{
		title: routeMaps[ Path.logs ].subs?.[ Path.runLogs ].title,
		path: routeMaps[ Path.logs ].subs?.[ Path.runLogs ].path + pathParams,
		exact: true,
		render: (props: RouteComponentProps) => <RunLogs
			{ ...{ ...props, pageRoute: { list: routeMaps[ Path.logs ].subs?.[ Path.runLogs ].path } } }
		/>
	},
	{
		title: routeMaps[ Path.system ].subs?.[ Path.systemInfo ].title,
		path: routeMaps[ Path.system ].subs?.[ Path.systemInfo ].path + pathParams,
		exact: true,
		render: (props: RouteComponentProps) => <SystemInfo
			{ ...{ ...props, pageRoute: { list: routeMaps[ Path.system ].subs?.[ Path.systemInfo ].path } } }
		/>
	},
	{
		title: routeMaps[ Path.logs ].subs?.[ Path.sipLog ].title,
		path: routeMaps[ Path.logs ].subs?.[ Path.sipLog ].path + pathParams,
		exact: true,
		render: (props: RouteComponentProps) => <SipLogs
			{ ...{ ...props, pageRoute: { list: routeMaps[ Path.logs ].subs?.[ Path.sipLog ].path } } }
		/>
	},
	{
		title: routeMaps[ Path.logs ].subs?.[ Path.vssSevState ].title,
		path: routeMaps[ Path.logs ].subs?.[ Path.vssSevState ].path + pathParams,
		exact: true,
		render: (props: RouteComponentProps) => <VssSevState
			{ ...{ ...props, pageRoute: { list: routeMaps[ Path.logs ].subs?.[ Path.vssSevState ].path } } }
		/>
	},
	{
		title: routeMaps[ Path.logs ].subs?.[ Path.pprofAnalyze ].title,
		path: routeMaps[ Path.logs ].subs?.[ Path.pprofAnalyze ].path + pathParams,
		exact: true,
		render: (props: RouteComponentProps) => <PProfAnalyze
			{ ...{ ...props, pageRoute: { list: routeMaps[ Path.logs ].subs?.[ Path.pprofAnalyze ].path } } }
		/>
	},
	{
		title: routeMaps[ Path.logs ].subs?.[ Path.alarms ].title,
		path: routeMaps[ Path.logs ].subs?.[ Path.alarms ].path + pathParams,
		exact: true,
		render: (props: RouteComponentProps) => <Alarms
			{ ...{ ...props, pageRoute: { list: routeMaps[ Path.logs ].subs?.[ Path.alarms ].path } } }
		/>
	},
	{
		title: routeMaps[ Path.configs ].subs?.[ Path.dictionaries ].title,
		path: routeMaps[ Path.configs ].subs?.[ Path.dictionaries ].path + pathParams,
		exact: true,
		render: (props: RouteComponentProps) => <Dictionaries
			{ ...{ ...props, pageRoute: { list: routeMaps[ Path.configs ].subs?.[ Path.dictionaries ].path } } }
		/>
	},
	{
		title: routeMaps[ Path.configs ].subs?.[ Path.crontab ].title,
		path: routeMaps[ Path.configs ].subs?.[ Path.crontab ].path + pathParams,
		exact: true,
		render: (props: RouteComponentProps) => <Crontab
			{ ...{ ...props, pageRoute: { list: routeMaps[ Path.configs ].subs?.[ Path.crontab ].path } } }
		/>
	},
	{
		title: routeMaps[ Path.configs ].subs?.[ Path.mediaServer ].title,
		path: routeMaps[ Path.configs ].subs?.[ Path.mediaServer ].path + pathParams,
		exact: true,
		render: (props: RouteComponentProps) => <MediaServer
			{ ...{ ...props, pageRoute: { list: routeMaps[ Path.configs ].subs?.[ Path.mediaServer ].path } } }
		/>
	},
	{
		title: routeMaps[ Path.configs ].subs?.[ Path.env ].title,
		path: routeMaps[ Path.configs ].subs?.[ Path.env ].path + anchorPathParams,
		exact: true,
		render: (props: RouteComponentProps) => <Env
			{ ...{ ...props, pageRoute: { list: routeMaps[ Path.configs ].subs?.[ Path.env ].path } } }
		/>
	},
	{
		title: routeMaps[ Path.configs ].subs?.[ Path.apiDoc ].title,
		path: routeMaps[ Path.configs ].subs?.[ Path.apiDoc ].path + pathParams,
		exact: true,
		render: (props: RouteComponentProps) => <ApiDoc />
	},
	{
		title: routeMaps[ Path.devices ].subs?.[ Path.deviceItems ].title,
		path: routeMaps[ Path.devices ].subs?.[ Path.deviceItems ].path + pathParams,
		exact: true,
		render: (props: RouteComponentProps) => <DeviceItems
			{ ...{ ...props, pageRoute: { list: routeMaps[ Path.devices ].subs?.[ Path.deviceItems ].path } } }
		/>
	},
	{
		title: routeMaps[ Path.devices ].subs?.[ Path.deviceChannels ].title,
		path: routeMaps[ Path.devices ].subs?.[ Path.deviceChannels ].path + pathParams,
		exact: true,
		render: (props: RouteComponentProps) => <DeviceChannels
			{ ...{ ...props, pageRoute: { list: routeMaps[ Path.devices ].subs?.[ Path.deviceChannels ].path } } }
		/>
	},
	{
		title: routeMaps[ Path.videoPreview ].title,
		path: routeMaps[ Path.videoPreview ].path + pathParams,
		exact: true,
		render: (props: RouteComponentProps) => <VideoFilters
			{
				...{
					...props,
					pageRoute: { list: routeMaps[ Path.videoPreview ].path },
					pageType: 'video-preview'
				}
			}
		/>
	},
	{
		path: '*',
		component: Home
	}
]

export default routes
