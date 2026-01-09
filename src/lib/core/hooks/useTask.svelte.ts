import { Schedule, type Runnable, type SingleOptionsObject } from 'directed'
import { useSchedule } from './useSchedule.svelte.js'
import { useRenderer } from './useRenderer.svelte.js'

export interface UseTaskOptions {
	/**
	 * Sets the task to start or stop. Defaults to true.
	 */
	running?: () => boolean

	/**
	 * If false, the task handler will not automatically invalidate the task.
	 * This is useful if you want to manually invalidate the task. Defaults to
	 * true.
	 */
	autoInvalidate?: boolean
}

let buildQueued = false
const queueBuild = (schedule: Schedule) => {
	if (buildQueued) {
		return
	}

	buildQueued = true
	queueMicrotask(() => {
		schedule.build()
		buildQueued = false
	})
}

export const useTask = (
	callback: (dt: number) => void,
	options: UseTaskOptions & SingleOptionsObject = {}
) => {
	const schedule = useSchedule()
	const { autoInvalidations } = useRenderer()

	const isRunning = $derived(options.running?.() ?? true)

	if (!options.after && !options.before && !options.id && !options.tag) {
		options.tag ??= 'main'
	}

	$effect(() => {
		if (isRunning) {
			schedule.add(callback as Runnable, options)
			queueBuild(schedule)

			if (options.autoInvalidate ?? true) {
				autoInvalidations.add(callback)
			}

			return () => {
				schedule.remove(callback as Runnable)
				queueBuild(schedule)

				if (options.autoInvalidate ?? true) {
					autoInvalidations.delete(callback)
				}
			}
		}
	})
}
