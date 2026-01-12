import type { AnyClass, MaybeInstance } from '../types.js'

let currentIs: unknown | undefined

export const setIs = <T>(is: T) => {
	currentIs = is
}

export const useIs = <T>(): T => {
	const is = currentIs
	currentIs = undefined
	return is as T
}

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
