<script
	lang="ts"
	generics="Type"
>
	import { untrack } from 'svelte'
	import type { TProps } from '../util/types.js'
	import { resolveIs } from '../util/resolveIs.js'
	import { useIs } from '../hooks/useIs.svelte.js'
	import { provideParent, useParent } from '../hooks/useParent.svelte.js'
	import { useAttach } from '../hooks/useAttach.svelte.js'
	import { useProps } from '../hooks/useProps.svelte.js'
	import { provideDispose, useDispose } from '../hooks/useDispose.svelte.js'
	import { useManageCamera } from '../hooks/useCamera.svelte.js'
	import { getPlugins, usePlugins } from '../hooks/plugin.svelte.js'
	import { useScene } from '../hooks/useScene.js'

	let {
		is = useIs<Type>(),
		ref = $bindable(),
		args,
		attach,
		dispose,
		manual,
		makeDefault,
		oncreate,
		children,
		...props
	}: TProps<Type> = $props()

	const scene = useScene()
	const parent = useParent<Type>()
	const object = $derived(resolveIs<Type>(is, args))
	const resolvedAttach = $derived(attach ?? parent?.current ?? scene)

	const plugins = getPlugins()
	const pluginProps = plugins
		? usePlugins({
				get ref() {
					return object
				},
				get args() {
					return args
				},
				get attach() {
					return attach
				},
				get manual() {
					return manual
				},
				get makeDefault() {
					return makeDefault
				},
				get dispose() {
					return dispose
				},
				get props() {
					return props
				},
			})
		: undefined

	useProps(
		() => object,
		() => props
	)

	useAttach(
		() => object,
		() => parent.current,
		() => resolvedAttach
	)

	useManageCamera(
		() => object,
		() => makeDefault,
		() => manual
	)

	provideParent(() => object)
	provideDispose(() => dispose)

	useDispose(() => object)

	$effect.pre(() => {
		object

		return untrack(() => {
			ref = object
			return oncreate?.(object)
		})
	})
</script>

{@render children?.({ ref: object })}
