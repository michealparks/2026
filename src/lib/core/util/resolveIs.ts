import type { AnyClass, MaybeInstance } from './types.js'

const isClass = (input: unknown): input is AnyClass => {
	return typeof input === 'function' && Function.prototype.toString.call(input).startsWith('class ')
}

export const resolveIs = <Type>(Is: unknown, args?: unknown): MaybeInstance<Type> => {
	if (isClass(Is)) {
		if (Array.isArray(args)) {
			return new Is(...args)
		} else {
			return new Is()
		}
	}

	return Is as MaybeInstance<Type>
}
