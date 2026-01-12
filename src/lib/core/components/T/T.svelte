<script
	lang="ts"
	generics="Type"
>
	import { untrack } from 'svelte'
	import type { PerspectiveCamera, OrthographicCamera } from 'three'
	import type { TProps } from './types.js'
	import { useIs, resolveIs } from './hooks/useIs.svelte.js'
	import { provideParent, useParent } from './hooks/useParent.svelte.js'
	import { useAttach } from './hooks/useAttach.svelte.js'
	import { useProps } from './hooks/useProps.svelte.js'
	import { provideDispose, useDispose } from './hooks/useDispose.svelte.js'
	import { getPlugins, usePlugins } from './hooks/plugin.svelte.js'
	import { useScene } from '../../hooks/useScene.js'
	import { useManageCamera } from '../../hooks/useCamera.svelte.js'

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
	const resolvedParent = $derived(parent?.current ?? scene)
	const resolvedAttach = $derived(attach ?? resolvedParent)

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
		() => resolvedParent,
		() => resolvedAttach
	)

	provideParent(() => object, scene)
	provideDispose(() => dispose)

	useDispose(() => object)

	$effect.pre(() => {
		if (
			(object as PerspectiveCamera).isPerspectiveCamera ||
			(object as OrthographicCamera).isOrthographicCamera
		) {
			useManageCamera(
				() => object as PerspectiveCamera | OrthographicCamera,
				() => makeDefault,
				() => manual,
				() => props
			)
		}
	})

	$effect.pre(() => {
		object

		return untrack(() => {
			ref = object
			return oncreate?.(object)
		})
	})
</script>

{@render children?.({ ref: object })}
