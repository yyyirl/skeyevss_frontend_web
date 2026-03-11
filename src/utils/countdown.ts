import store from '#utils/store'
import { isEmpty } from '#utils/functions'

type SetCallType = (val: number) => void

export class Countdown {
	private countdown = 60
	private readonly key: string = ''
	private readonly setCallType: SetCallType
	private interval: ReturnType<typeof setInterval> | null = null

	constructor(key: string, setCallType: SetCallType) {
		this.key = key
		this.setCallType = setCallType
	}

	check(): boolean {
		const cache = store.get(this.key, true) as number
		return !(isEmpty(cache) || cache <= 0)
	}

	do(): void {
		const cache = store.get(this.key, true) as number
		if (!isEmpty(cache) && cache > 0) {
			this.countdown = cache
		}

		this.interval = setInterval(
			(): void => {
				this.countdown -= 1
				if (this.countdown <= 0 && this.interval !== null) {
					clearInterval(this.interval)
					store.remove(this.key)
					this.setCallType(0)
					return
				}

				store.set(this.key, this.countdown)
				this.setCallType(this.countdown)
			},
			1000
		)
	}
}
