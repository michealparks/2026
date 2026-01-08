/* eslint-disable @typescript-eslint/no-explicit-any */

import { getContext, setContext } from 'svelte'

import type { Object3D } from 'three'

type BaseProps = {
	ref: any
	args?: any[] | undefined
	attach?:
		| string
		| Object3D
		| ((args: { ref: any; parent: unknown; parentObject3D: Object3D }) => void | (() => void))
		| false
		| undefined
	manual?: boolean | undefined
	makeDefault?: boolean | undefined
	dispose?: boolean | undefined
}

type AnyProps = Record<string, any>

type Plugin<Props extends AnyProps = AnyProps> = (
	args: BaseProps & {
		props: Props & AnyProps
	}
) => {
	pluginProps?: (keyof Props)[] | string[]
} | void

interface PluginContext {
	plugins: Record<string, Plugin<AnyProps>>
	pluginsArray: Plugin<AnyProps>[]
}

const key = Symbol('plugin-context')

export function injectPlugin<Props extends AnyProps = AnyProps>(
	name: string,
	plugin: Plugin<Props>
): void {
	const context = getContext<PluginContext | undefined>(key) ?? {
		plugins: {},
		pluginsArray: [],
	}

	context.plugins[name] = plugin as Plugin
	context.pluginsArray.push(plugin as Plugin)

	setContext<PluginContext>(key, context)
}

export const usePlugins = (pluginArgs: Parameters<Plugin>[0]) => {
	const plugins = getContext<PluginContext | undefined>(key)

	if (!plugins) return

	const pluginsProps: string[] = []
	const pluginsArray = plugins.pluginsArray

	// initalize plugins
	for (const plugin of pluginsArray) {
		const p = plugin(pluginArgs)
		if (p?.pluginProps) {
			pluginsProps.push(...p.pluginProps)
		}
	}

	return {
		pluginsProps,
	}
}
