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

```colorManagementEnabled``` is removed. The default is `true` now and this can be easily set to `false` with `ColorManagement.enabled = false`.

```colorSpace``` is removed. The default is `THREE.SRGBColorSpace` now and this can be easily changed with `renderer.outputColorSpace`.

```advance``` is removed. If renderMode is set to 'manual', you can trigger a render by calling `invalidate()`.

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

Resizing also no longer is in a callback from a ResizeObserver, but is now rather tested each frame. This is more stable and solves the jittering issue noticed when resizing the canvas.

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

`watch` is removed. `$effect` / `$effect.pre` are purely used internally. `observe` is kept.

`currentWritable` has been removed.

`resolvePropertyPath` has been removed.

`isInstanceOf` is still exported for users, but not used internally to reduce function calls.

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

### `useProps`

Memoization has been completely removed since it did not provide any significant performance benefits. Svelte's built-in memoization is sufficient.

`useEvents` has been removed because this hook now calls `addEventListener` and `removeEventListener` under the correct circumstances.

This also means that `interactivity` can now fire THREE events through `dispatchEvent`.

Calling functions through props is now supported as well:

```svelte
<T.PerspectiveCamera makeDefault lookAt={[0, 1, 0]} />
```

### `useParentObject3d`

This hook has been removed. All use cases were examined and found to be unnecessary and replacable by useParent.

### `useDispose`

Disposal is now no longer scheduled for the next frame. Instead, it is done immediately after the component is unmounted.

### Scheduling

I used the `directed` library under the hood for scheduling tasks to quickly prototype without importing Threlte's scheduling library. I sort of like the API more than Threlte's. It's a bit simpler.
