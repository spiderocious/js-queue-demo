import type { RouteObject } from 'react-router-dom'
import { ROUTES } from '@shared/constants/routes'
import { lazy } from 'react'

const TaskQueueVisualizerScreen = lazy(() =>
  import('@features/task-queue-visualizer/screen/task-queue-visualizer-screen').then((m) => ({
    default: m.TaskQueueVisualizerScreen,
  })),
)

const CompilationPipelineScreen = lazy(() =>
  import('@features/compilation-pipeline/screen/compilation-pipeline-screen').then((m) => ({
    default: m.CompilationPipelineScreen,
  })),
)

const BrowserRenderingScreen = lazy(() =>
  import('@features/browser-rendering/screen/browser-rendering-screen').then((m) => ({
    default: m.BrowserRenderingScreen,
  })),
)

const NetworkPipelineScreen = lazy(() =>
  import('@features/network-pipeline/screen/network-pipeline-screen').then((m) => ({
    default: m.NetworkPipelineScreen,
  })),
)

const DomCssomScreen = lazy(() =>
  import('@features/dom-cssom/screen/dom-cssom-screen').then((m) => ({
    default: m.DomCssomScreen,
  })),
)

const ReactRenderingScreen = lazy(() =>
  import('@features/react-rendering/screen/react-rendering-screen').then((m) => ({
    default: m.ReactRenderingScreen,
  })),
)

export const routes: RouteObject[] = [
  { path: ROUTES.TASK_QUEUE, Component: TaskQueueVisualizerScreen },
  { path: ROUTES.COMPILATION, Component: CompilationPipelineScreen },
  { path: ROUTES.RENDERING, Component: BrowserRenderingScreen },
  { path: ROUTES.NETWORK, Component: NetworkPipelineScreen },
  { path: ROUTES.DOM_CSSOM, Component: DomCssomScreen },
  { path: ROUTES.REACT, Component: ReactRenderingScreen },
]
