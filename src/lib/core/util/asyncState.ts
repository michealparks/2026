export interface AsyncState<T> extends Promise<T> {
	current: T | undefined
	error: Error | undefined
}

/**
 * ---
 * Creates a promise with runes attached for the resolved value and an error if rejected.
 * Can be used in `await` expressions and `{#await}` blocks of Svelte.
 *
 * ```svelte
 * <script>
 *  import { asyncState } from '@threlte/core'
 *
 *  const promise = asyncState(async () => {
 *    // Do something async
 *  })
 *
 *  $inspect(promise.current)
 * </script>
 *
 * {#await promise then data}
 *   / Do something with the data
 * {/await}
 * ```
 *
 * ---
 *
 * If an error occurs in the promise, it can be accessed via the `error` property.
 *
 * ```svelte
 * <script>
 *  import { asyncState } from '@threlte/core'
 *
 *  const promise = asyncState(async () => {
 *    throw new Error('Something went wrong')
 *  })
 *
 *  $inspect(promise.current) // undefined
 *  $inspect(promise.error) // Error: Something went wrong
 * </script>
 * ```
 */
export const asyncState = <T>(promise: Promise<T>): AsyncState<T> => {
	let current = $state<T>()
	let error = $state<Error>()

	promise
		.then((result) => {
			current = result
		})
		.catch((result) => {
			error = result
		})

	return Object.assign(promise, {
		get current() {
			return current
		},
		get error() {
			return error
		},
	})
}
