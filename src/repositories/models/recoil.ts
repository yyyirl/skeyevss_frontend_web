/* eslint-disable */
import { type RecoilState, type RecoilValue, useRecoilState, useRecoilValue } from 'recoil'

// https://recoiljs.org/zh-hans/docs/introduction/getting-started/
const URValue = <T>(v: RecoilValue<T>): T => useRecoilValue(v)

export default class State {
	readonly atom: RecoilState<any>
	state: any
	private readonly doSet: any

	constructor(v: RecoilState<any>) {
		this.atom = v
		const [ val, setVal ] = useRecoilState(v)
		this.state = val
		this.doSet = setVal
	}

	shared(): any {
		return URValue(this.atom)
	}

	setState(v: any): void {
		this.doSet(v)
	}
}