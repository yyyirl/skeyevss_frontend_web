// ------------------------------------------ health
export interface Mem {
	total: number
	used: number
	free: number
}

export interface DiskUsageItem {
	device: string // 设备路径
	mountpoint: string // 挂载点
	fstype: string // 文件系统类型
	total_bytes: number // 总字节数
	used_bytes: number // 已使用字节数
	free_bytes: number // 未使用字节数
	used_percent: number // 使用百分比
}

export interface network {
	downRate: number
	upRate: number
}

export interface Hardware {
	cpu: number
	mem: Mem
	msg: string
	timestamp: number
	network: network
}

export interface Service {
	cpu: number
	mem: number
	msg: string
	name: string
	timestamp: number
}

export interface DeviceStatistics {
	channelOnlineCount: number
	channelOfflineCount: number
	deviceOnlineCount: number
	deviceOfflineCount: number
	accessProtocolGroup: { [key: number]: number }
}

export interface ServerHealthResp {
	hardware: Hardware[]
	services: Service[][]
	memTotal: number
	diskUsage: DiskUsageItem[]
	deviceStatistics: DeviceStatistics
}
// ------------------------------------------ health
