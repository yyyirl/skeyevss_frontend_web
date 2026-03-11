import type React from 'react'
import { useEffect, useCallback, useRef } from 'react'
import useFetchState from '#repositories/models'

interface UseDoubleClickOptions {
	timeout?: number
	onSingleClick?: (event: React.MouseEvent) => void
	onDoubleClick?: (event: React.MouseEvent) => void
}

export const useDoubleClick = (options: UseDoubleClickOptions = {}): ((event: React.MouseEvent) => void) => {
	const { timeout = 300, onSingleClick, onDoubleClick } = options
	const clickCountRef = useRef(0)
	const timerRef = useRef<any>(null)

	return useCallback(
		(event: React.MouseEvent) => {
			clickCountRef.current += 1

			if (clickCountRef.current === 1) {
				timerRef.current = setTimeout(
					() => {
						if (clickCountRef.current === 1) {
							onSingleClick?.(event)
						}
						clickCountRef.current = 0
					},
					timeout
				)
				return
			}

			if (clickCountRef.current === 2) {
				clearTimeout(timerRef.current as number)
				onDoubleClick?.(event)
				clickCountRef.current = 0
			}
		},
		[ timeout, onSingleClick, onDoubleClick ]
	)
}

interface UseMicrophoneResult {
	hasMicrophone: boolean
	isLoading: boolean
	permission: 'granted' | 'denied' | 'prompt' | 'unknown'
	error: string | null
	requestPermission: () => Promise<boolean>
	devices: MediaDeviceInfo[]
	refresh: () => Promise<void>
}

export function useMicrophone(): UseMicrophoneResult {
	const [ hasMicrophone, setHasMicrophone ] = useFetchState<boolean>(false)
	const [ isLoading, setIsLoading ] = useFetchState<boolean>(true)
	const [ permission, setPermission ] = useFetchState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown')
	const [ error, setError ] = useFetchState<string | null>(null)
	const [ devices, setDevices ] = useFetchState<MediaDeviceInfo[]>([])

	const checkMicrophone = useCallback(async(): Promise<void> => {
		setIsLoading(true)
		setError(null)

		try {
			// 检查API支持
			if (navigator.mediaDevices?.getUserMedia === null || navigator.mediaDevices?.getUserMedia === undefined) {
				setError('浏览器不支持媒体设备API')
				setIsLoading(false)
				return
			}

			// 检查权限
			let permissionState: 'granted' | 'denied' | 'prompt' | 'unknown' = 'unknown'

			if (navigator.permissions.query !== undefined && navigator.permissions.query !== null) {
				try {
					const result = await navigator.permissions.query({
						name: 'microphone' as PermissionName
					})
					permissionState = result.state as 'granted' | 'denied' | 'prompt'
				} catch {
					// 权限API可能不支持
				}
			}

			setPermission(permissionState)

			// 枚举设备
			const allDevices = await navigator.mediaDevices.enumerateDevices()
			const audioInputDevices = allDevices.filter(device => device.kind === 'audioinput')
			setDevices(audioInputDevices)

			// 检查是否有麦克风
			if (audioInputDevices.length === 0) {
				setHasMicrophone(false)
				setError('未检测到麦克风设备')
			} else {
				// 如果有已授权的设备（label不为空）
				const hasAuthorizedDevice = audioInputDevices.some(device => device.label !== '')
				// 如果有设备则认为可访问
				// setHasMicrophone(hasAuthorizedDevice)
				setHasMicrophone(true)
				if (!hasAuthorizedDevice && permissionState === 'denied') {
					setError('麦克风访问被拒绝')
				}
			}
		} catch (err) {
			const error = err as Error
			setError(`检测失败: ${ error.message }`)
			setHasMicrophone(false)
		} finally {
			setIsLoading(false)
		}
	}, [])

	const requestPermission = useCallback(async(): Promise<boolean> => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true
			})
			stream.getTracks().forEach(track => { track.stop() })

			// 刷新状态
			await checkMicrophone()
			return true
		} catch {
			return false
		}
	}, [ checkMicrophone ])

	useEffect(
		() => {
			void checkMicrophone()

			// 监听设备变化
			if (navigator.mediaDevices !== undefined && navigator.mediaDevices !== null) {
				const handleDeviceChange = (): void => {
					void checkMicrophone()
				}

				navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)

				return (): void => {
					navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
				}
			}
		},
		[ checkMicrophone ]
	)

	return {
		hasMicrophone,
		isLoading,
		permission,
		error,
		devices,
		requestPermission,
		refresh: checkMicrophone
	}
}