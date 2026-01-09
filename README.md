This is an experimental prototype of a possible future version of Threlte.

The library itself can be found at [src/lib/core](https://github.com/michealparks/2026/tree/main/src/lib/core).

The result of this experiment was discovering that there was a lot of possible downsizing, simplification, and redundancy removal. 

Also, a lot less work can still be done by the library while achieving the same results.

Finally, I think there are some areas where API ergonomics can be improved.

# Changes

## `useThrelte` 

All Writables have been replaced with runes accessed by `.current` and modifiable by `.current = value`.

```ts
const {
  dom, // HTMLElement
  size, // { current: { width: number, height: number } }
  canvas, // HTMLCanvasElement
  camera, // { current: PerspectiveCamera | OrthographicCamera }
  scene, // Scene
  dpr, // { current: number }
  renderer, // WebGLRenderer
  renderMode, // { current: 'always' | 'on-demand' | 'manual' }
  autoRender, // { current: boolean }
  invalidate, // () => void
  scheduler, // Scheduler
  mainStage, // Stage
  renderStage, // Stage
  autoRenderTask, // Task
  shouldRender, // () => boolean
  toneMapping, // { current: THREE.ToneMapping }
  shadows // { current: boolean | THREE.ShadowMapType }
} = useThrelte()
```

```colorManagementEnabled``` is removed. The THREE.js default is `true` now, and this can be easily set to `false` with `ColorManagement.enabled = false`.

```colorSpace``` is removed. The THREE.js default is `THREE.SRGBColorSpace` now, and this can be easily changed with `renderer.outputColorSpace`.

```advance``` is removed. If renderMode is set to 'manual', you can trigger a render by calling `invalidate()`. This removes duplication since advance and invalidate do very similar things.

## `useCache`

`useCache` and `remember` calls are removed. THREE's internal FileLoader cache is now turned on by default, accomplishing the same thing.

```ts
THREE.Cache.enabled = true;
```

It can be turned off in the canvas component.

```svelte
<Canvas cache={false}>
 ...
</Canvas>
```

## `<Canvas>` 

The properties removed above have also been removed from the canvas component.

The canvas component also now always creates the renderer passed to `useRenderer`, which will make it easier to create a WebGL and WebGPU canvas component.

Resizing also no longer is in a callback from a ResizeObserver, but is now rather tested on each frame from cached ResizeObserver values. This is more stable and solves the jittering issue noticed when resizing the canvas, since that is caused by calling `renderer.setSize()` multiple times per frame.

## utilities

`asyncWritable` has been replaced with `asyncState`, a promise with `.current` and `.error` runes attached.

```ts
import { asyncState } from '@threlte/core'

const promise = asyncState(async () => {
  throw new Error('Something went wrong')
})

$inspect(promise.current) // undefined
$inspect(promise.error) // Error: Something went wrong
```

`watch` is removed. Only `$effect` / `$effect.pre` are used internally to improve tree shaking. `observe` is kept for users.

`currentWritable` has been removed.

`resolvePropertyPath` has been removed.

`isInstanceOf` is still exported for users, but not used internally to reduce function call overhead.

## `useLoader`

useLoader now returns an asyncState object.

## `useTask`

useTask no longer returns a `start` or `stop` function, and the `autoStart` option is removed. 

Instead, a `running` signal option can toggle the task.

```ts
let running = $state(false)

useTask(() => {
  // Do something... 
}, {
  running: () => running
})
```

I found that this removed a lot of code in experiments, specifically killing $effects, which I'm a fan of.

### `useProps`

Memoization has been completely removed since it did not provide any significant performance benefits and created instantiation overhead. Svelte's built-in memoization is sufficient.

`useEvents` has been removed because this hook now calls `addEventListener` and `removeEventListener` when prop values are functions and keys start with 'on'.

This also means that `interactivity` can now fire THREE events through `dispatchEvent` since these props are registered as EventDispatcher events.

Calling functions through props is now supported as well:

```svelte
<T.PerspectiveCamera
    makeDefault
    position={[5, 5, 5]}
    lookAt={[0, 1, 0]}
/>
```

### `useParentObject3d`

This hook has been removed. All use cases were examined and found to be unnecessary and replacable by useParent.

### `useDispose`

Disposal is now no longer scheduled for the next frame. Instead, it is done immediately after the component is unmounted.

### Scheduling

I used the `directed` library under the hood for scheduling tasks to quickly prototype without importing Threlte's scheduling library. I sort of like the API more than Threlte's. It's a bit simpler, but changing it may be too much of a shock.
