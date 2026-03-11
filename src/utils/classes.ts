type Constructor<T extends object = object> = new (...args: any[]) => T

const propertiesMap = new WeakMap<Constructor, string[]>()

export function TrackProperty(): PropertyDecorator {
	return (target: object, propertyKey: string | symbol) => {
		if (typeof propertyKey !== 'string') return

		const constructor = target.constructor as Constructor
		const properties = propertiesMap.get(constructor) ?? []

		if (!properties.includes(propertyKey)) {
			properties.push(propertyKey)
			propertiesMap.set(constructor, properties)
		}
	}
}

// 获取类属性的辅助函数
export function getClassProperties<T extends object>(cls: Constructor<T>): readonly string[] {
	const properties = propertiesMap.get(cls as Constructor)
	return properties !== undefined ? Object.freeze([ ...properties ]) : []
}