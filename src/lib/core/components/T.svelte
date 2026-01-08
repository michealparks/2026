<script
	lang="ts"
	generics="Type"
>
	import { untrack } from 'svelte'
	import type { TProps } from '../fn/types'
	import { resolveIs } from '../fn/resolveIs'
	import { useThree } from '../hooks/useThree.svelte'
	import { useIs } from '../hooks/useIs.svelte'
	import { provideParent, useParent } from '../hooks/useParent.svelte'
	import { useAttach } from '../hooks/useAttach.svelte'
	import { useProps } from '../hooks/useProps.svelte'
	import { provideDispose, useDispose } from '../hooks/useDispose.svelte'
	import { useManageCamera } from '../hooks/useCamera.svelte'
	import { usePlugins } from '../hooks/plugin.svelte'

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

	const { scene } = useThree()
	const parent = useParent<Type>()
	const object = $derived(resolveIs<Type>(is, args))
	const resolvedAttach = $derived(attach ?? parent?.current ?? scene)

	const plugins = usePlugins({
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
