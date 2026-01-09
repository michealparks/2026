import { Schedule } from 'directed'
import { getContext, setContext } from 'svelte'

const key = Symbol('scheduler-context')

export const provideScheduler = () => {
	let schedule = useSchedule()

	if (!schedule) {
		schedule = new Schedule()
		schedule.createTag('render')
		schedule.createTag('main', { after: 'render' })

		setContext(key, schedule)
	}

	return schedule
}

export const useSchedule = () => {
	return getContext<Schedule>(key)
}
