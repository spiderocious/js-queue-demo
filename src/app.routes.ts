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

export const routes: RouteObject[] = [
  {
    path: ROUTES.TASK_QUEUE,
    Component: TaskQueueVisualizerScreen,
  },
  {
    path: ROUTES.COMPILATION,
    Component: CompilationPipelineScreen,
  },
]
