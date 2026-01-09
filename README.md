# Changes

## `<Canvas>` component



## `useThrelte` hook

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

## useCache

`useCache` and `remember` calls are removed. THREE's internal FileLoader cache is instead turned on by default, accomplishing the same thing.

```ts
THREE.Cache.enabled = true;
```

It can be turned off by the canvas component.

```svelte
<Canvas cache={false}>
 ...
</Canvas>
```

## Utilities

`watch` and `observe` are removed. `$effect` / `$effect.pre` is used purely internally.

`asyncWritable` has been replaced with `asyncState`, a promise with `.current` and `.error` runes attached.

`resolvePropertyPath` is no longer exported.

```ts
import { asyncState } from '@threlte/core'

const promise = asyncState(async () => {
  throw new Error('Something went wrong')
})

$inspect(promise.current) // undefined
$inspect(promise.error) // Error: Something went wrong
```

## useLoader

useLoader now returns an asyncState object.

## useTask

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
