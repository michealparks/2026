import { Schedule, type Runnable, type SingleOptionsObject } from 'directed'
import { useSchedule } from './useSchedule.svelte.js'

interface UseTaskOptions {
	running?: () => boolean
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
	const isRunning = $derived(options.running?.() ?? true)

	if (!options.after && !options.before && !options.id && !options.tag) {
		options.tag ??= 'main'
	}

	$effect(() => {
		if (isRunning) {
			schedule.add(callback as Runnable, options)
			queueBuild(schedule)

			return () => {
				schedule.remove(callback as Runnable)
				queueBuild(schedule)
			}
		}
	})
}
