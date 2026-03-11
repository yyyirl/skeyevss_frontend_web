import { type Response } from '#types/axios'
import { inArray, isEmpty, mapFilter } from '#utils/functions'

export interface Receive { [ key: string ]: (data: WSResponse) => void }

interface WSResponse {
	type: string
	connType?: string
	msg?: string
	data?: any
	errors?: string
}

export default class WS {
	private interval = 0
	private static instance?: WS
	private wsInstance?: WebSocket
	private receiveCaller?: Receive

	private constructor() {
	}

	static async shared(url: string, getToken: () => Promise<Response<string>>, close?: () => void): Promise<WS> {
		if (this.instance === undefined) {
			const instance = new WS()
			let token = ''
			await getToken().then(
				res => {
					token = res.data ?? ''
				}
			)

			instance.wsInstance = new WebSocket(url, [ 'backend-api', token ])
			instance.wsInstance.onclose = (): void => {
				this.instance = undefined
				clearInterval(instance.interval)
				close?.()
			}

			instance.wsInstance.onmessage = (event: MessageEvent<string>): void => {
				const data = JSON.parse(event.data) as WSResponse
				if (!isEmpty(data.type)) {
					instance?.receiveCaller?.[ data.type ]?.(data)
				}
			}

			instance.wsInstance.onopen = (): void => {
				instance.wsInstance?.send(JSON.stringify({ type: 'heartbeat' }))

				instance.interval = setInterval(
					() => {
						instance.wsInstance?.send(JSON.stringify({ type: 'heartbeat' }))
					}, 5000
				) as any
			}

			this.instance = instance
		}

		return this.instance
	}

	receiver(caller: Receive): this {
		this.receiveCaller = caller
		return this
	}

	sender(type: string, data: { [ key: string ]: any }): void {
		this.wsInstance?.send(JSON.stringify({ type, data }))
	}

	cleanup(caller: Receive): void {
		const keys = Object.keys(caller)
		this.receiveCaller = mapFilter(this.receiveCaller ?? {}, (k, v) => !inArray(keys, k))
		clearInterval(this.interval)
		WS.instance = undefined
	}
}