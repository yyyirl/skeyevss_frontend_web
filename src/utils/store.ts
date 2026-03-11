import { isArrOrObj } from '#utils/functions'

const store = {
	/**
	 * 获取存储对象
	 * @returns {Storage}
	 */
	getStore() {
		return window.localStorage
	},

	/**
	 * 获取存储
	 * @param key
	 * @param origin
	 * @returns {string}
	 */
	get(key: string, origin = false): any {
		const data = this.getStore().getItem(key)
		if (data === null || data === '') {
			return data
		}

		try {
			return !origin ? JSON.parse(data) : data
		} catch (e) {
			return data
		}
	},

	/**
	 * 设置存储
	 * @param key
	 * @param value
	 */
	set(key: string, value: any) {
		if (isArrOrObj(value)) {
			value = JSON.stringify(value)
		}

		this.getStore().setItem(key, value as string)
	},

	/**
	 * 删除
	 * @param key
	 */
	remove(key: string) {
		this.getStore().removeItem(key)
	},

	/**
	 * 全部清除
	 */
	clear() {
		this.getStore().clear()
	}
}

export default store
