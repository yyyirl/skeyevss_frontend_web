import { pathJoin } from '#utils/functions'

export enum Path {
	// 系统设置
	system = 'system',
	// 管理员管理
	admins = 'admins',
	// 组织架构管理
	departments = 'departments',
	// 角色管理
	roles = 'roles',
	// 系统信息
	systemInfo = 'info',

	logs = 'logs',
	// 操作日志
	operationLogs = 'operations',
	// 运行日志
	runLogs = 'runtime',
	// sip日志信息
	sipLog = 'sip',
	// vss 状态
	vssSevState = 'vss-sev-state',
	// 报警查询
	alarms = 'alarms',
	// pprof
	pprofAnalyze = 'pprof-analyze',
	// pprof
	respQuery = 'resp-query',

	// 登录
	login = 'login',
	// 首页
	home = 'home',

	// 配置中心
	configs = 'configs',
	// 字典
	dictionaries = 'dictionaries',
	// 计划任务
	crontab = 'crontab',
	// 媒体服务
	mediaServer = 'media-server',
	// 录像计划
	videoProjects = 'video-projects',
	// 服务器配置
	env = 'env',
	// 接口文档
	apiDoc = 'apidoc',

	// 设备管理
	devices = 'devices',
	// 设备
	deviceItems = 'items',
	// 通道
	deviceChannels = 'channels',
	// 设备级联
	deviceCascades = 'cascades',

	// 视频调阅
	videoPreview = 'video-preview',

	// 录像管理
	videos = 'videos',
	// 设备录像
	videoDevices = 'device',
	// 平台录像
	videoSK = 'sk',

	// 电子地图
	maps = 'maps',
}

export function toPath(value: string): Path | undefined {
	if (Object.values(Path).includes(value as Path)) {
		return value as Path
	}

	return undefined
}

interface Item {
	path: string
	uniqueId?: string
	title: string
	subs?: { [ key: string ]: Item }
	className?: string
}

export const pathParams = '/:page?/:limit?/:sort?/:filter?/:anchor?'
export const anchorPathParams = '/:anchor?'

const routes: { [ key: string ]: Item } = {
	[ Path.login ]: {
		path: `/${ Path.login }`,
		title: '登录',
		className: 'login'
	},

	[ Path.home ]: {
		path: '/home',
		title: '首页概览',
		uniqueId: 'P_1_0',
		className: 'home'
	},

	[ Path.system ]: {
		path: `/${ Path.system }`,
		title: '系统管理',
		uniqueId: 'P_1_1',
		subs: {
			[ Path.admins ]: {
				title: '管理员管理',
				path: `/${ pathJoin(Path.system, Path.admins) }`,
				uniqueId: 'P_1_1_4'
			},
			[ Path.departments ]: {
				title: '组织架构管理',
				path: `/${ pathJoin(Path.system, Path.departments) }`,
				uniqueId: 'P_1_1_3'
			},
			[ Path.roles ]: {
				title: '角色管理',
				path: `/${ pathJoin(Path.system, Path.roles) }`,
				uniqueId: 'P_1_1_2'
			},
			[ Path.systemInfo ]: {
				title: '系统信息',
				path: `/${ pathJoin(Path.system, Path.systemInfo) }`,
				uniqueId: 'P_1_1_6'
			}
		}
	},

	[ Path.logs ]: {
		path: `/${ Path.logs }`,
		title: '日志',
		uniqueId: 'P_1_6',
		subs: {
			[ Path.alarms ]: {
				path: `/${ pathJoin(Path.logs, Path.alarms) }`,
				title: '报警查询',
				uniqueId: 'P_1_6_4'
			},
			[ Path.operationLogs ]: {
				title: '操作日志',
				path: `/${ pathJoin(Path.logs, Path.operationLogs) }`,
				uniqueId: 'P_1_6_3'
			},
			[ Path.runLogs ]: {
				title: '运行日志',
				path: `/${ pathJoin(Path.logs, Path.runLogs) }`,
				uniqueId: 'P_1_6_2'
			},
			[ Path.sipLog ]: {
				title: 'sip日志',
				path: `/${ pathJoin(Path.logs, Path.sipLog) }`,
				uniqueId: 'P_1_6_5'
			},
			[ Path.pprofAnalyze ]: {
				title: '性能分析',
				path: `/${ pathJoin(Path.logs, Path.pprofAnalyze) }`,
				uniqueId: 'P_1_6_6'
			},
			[ Path.vssSevState ]: {
				title: 'vss状态',
				path: `/${ pathJoin(Path.logs, Path.vssSevState) }`,
				uniqueId: 'P_1_6_8'
			},
			[ Path.respQuery ]: {
				title: '响应查询',
				path: `/${ pathJoin(Path.logs, Path.respQuery) }`,
				uniqueId: 'P_1_6_7'
			}
		}
	},

	[ Path.configs ]: {
		path: `/${ Path.configs }`,
		title: '配置中心',
		uniqueId: 'P_1_2',
		subs: {
			[ Path.dictionaries ]: {
				title: '字典管理',
				path: `/${ pathJoin(Path.configs, Path.dictionaries) }`,
				uniqueId: 'P_1_2_1'
			},
			[ Path.crontab ]: {
				title: '计划任务',
				path: `/${ pathJoin(Path.configs, Path.crontab) }`,
				uniqueId: 'P_1_2_2'
			},
			[ Path.mediaServer ]: {
				title: '媒体服务',
				path: `/${ pathJoin(Path.configs, Path.mediaServer) }`,
				uniqueId: 'P_1_4_3'
			},
			[ Path.videoProjects ]: {
				title: '录像计划',
				path: `/${ pathJoin(Path.configs, Path.videoProjects) }`,
				uniqueId: 'P_1_4_4'
			},
			[ Path.env ]: {
				title: '服务器配置',
				path: `/${ pathJoin(Path.configs, Path.env) }`,
				uniqueId: 'P_1_4_5'
			},
			[ Path.apiDoc ]: {
				title: '接口文档',
				path: `/${ pathJoin(Path.configs, Path.apiDoc) }`,
				uniqueId: 'P_1_4_6'
			}
		}
	},

	[ Path.devices ]: {
		path: `/${ Path.devices }`,
		title: '设备管理',
		uniqueId: 'P_1_3',
		subs: {
			[ Path.deviceItems ]: {
				title: '设备',
				path: `/${ pathJoin(Path.devices, Path.deviceItems) }`,
				uniqueId: 'P_1_3_1'
			},
			[ Path.deviceChannels ]: {
				title: '通道',
				path: `/${ pathJoin(Path.devices, Path.deviceChannels) }`,
				uniqueId: 'P_1_3_2'
			},
			[ Path.deviceCascades ]: {
				title: '平台级联',
				path: `/${ pathJoin(Path.devices, Path.deviceCascades) }`,
				uniqueId: 'P_0_3_4'
			}
		}
	},

	[ Path.videoPreview ]: {
		path: `/${ Path.videoPreview }`,
		title: '视频调阅',
		uniqueId: 'P_1_4',
		className: 'vp'
	},

	[ Path.maps ]: {
		path: `/${ Path.maps }`,
		title: '电子地图',
		uniqueId: 'P_1_7',
		className: 'maps'
	},

	[ Path.videos ]: {
		path: `/${ Path.videos }`,
		title: '录像管理',
		uniqueId: 'P_1_5',
		subs: {
			[ Path.videoDevices ]: {
				title: '设备录像',
				path: `/${ pathJoin(Path.videos, Path.videoDevices) }`,
				uniqueId: 'P_1_5_1'
			},
			[ Path.videoSK ]: {
				title: '平台录像',
				path: `/${ pathJoin(Path.videos, Path.videoSK) }`,
				uniqueId: 'P_1_5_2'
			}
		}
	}
}

export function findRoute(path: Path, routes: { [ key: string ]: Item }, call?: (data: { path: Path, item: Item, key: string }) => boolean): Item | undefined {
	for (const key in routes) {
		const item = routes[ key ]
		if (call !== undefined) {
			if (call({ path, item, key })) {
				return item
			}
		} else if (key === path) {
			return item
		}

		if (item.subs !== undefined) {
			if (Object.keys(item.subs).length > 0) {
				const data = findRoute(path, item.subs)
				if (data !== undefined) {
					return data
				}
			}
		}
	}

	return undefined
}

export default routes
