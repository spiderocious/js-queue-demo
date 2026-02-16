import type { ExecutionStep, QueueType } from '@shared/types/queue-types'

interface ParsedTask {
  code: string
  label: string
  queueType: QueueType
  sourceLine: number
  output: string
  children?: ParsedTask[]
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function buildExecutionSteps(code: string): ExecutionStep[] {
  const lines = code.split('\n')
  const tasks = parseCode(lines)
  return flattenToSteps(tasks)
}

function parseCode(lines: string[]): ParsedTask[] {
  const tasks: ParsedTask[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const lineNum = i + 1

    // Synchronous console.log at top level (not indented inside a callback)
    if (isTopLevelConsolelog(lines, i)) {
      const output = extractConsoleOutput(line)
      tasks.push({
        code: line,
        label: extractShortLabel(output),
        queueType: 'callStack',
        sourceLine: lineNum,
        output,
      })
    }

    // setTimeout
    if (line.startsWith('setTimeout(')) {
      const output = findConsoleLogsInBlock(lines, i)
      const nestedTasks = findNestedAsyncInBlock(lines, i)
      tasks.push({
        code: `setTimeout(() => { ... }, 0)`,
        label: extractShortLabel(output[0] ?? 'setTimeout callback'),
        queueType: 'macrotask',
        sourceLine: lineNum,
        output: output[0] ?? '',
        children: nestedTasks.length > 0
          ? nestedTasks.map((nt) => ({
              ...nt,
              sourceLine: lineNum + nt.sourceLine,
            }))
          : output.slice(1).map((o, idx) => ({
              code: `console.log(...)`,
              label: extractShortLabel(o),
              queueType: 'callStack' as QueueType,
              sourceLine: lineNum + idx + 1,
              output: o,
            })),
      })
    }

    // Promise.resolve().then(...)
    if (line.startsWith('Promise.resolve()')) {
      const outputs = findConsoleLogsInBlock(lines, i)
      const chainedPromises = outputs.map((output, idx) => ({
        code: `.then(() => { console.log(...) })`,
        label: extractShortLabel(output),
        queueType: 'microtask' as QueueType,
        sourceLine: lineNum + idx,
        output,
      }))

      if (chainedPromises.length > 0) {
        tasks.push(chainedPromises[0])
        for (let c = 1; c < chainedPromises.length; c++) {
          tasks.push(chainedPromises[c])
        }
      }
    }

    // queueMicrotask
    if (line.startsWith('queueMicrotask(')) {
      const output = findConsoleLogsInBlock(lines, i)
      tasks.push({
        code: `queueMicrotask(() => { ... })`,
        label: extractShortLabel(output[0] ?? 'queueMicrotask'),
        queueType: 'microtask',
        sourceLine: lineNum,
        output: output[0] ?? '',
      })
    }

    // requestAnimationFrame
    if (line.startsWith('requestAnimationFrame(')) {
      const output = findConsoleLogsInBlock(lines, i)
      tasks.push({
        code: `requestAnimationFrame(() => { ... })`,
        label: extractShortLabel(output[0] ?? 'rAF callback'),
        queueType: 'animation',
        sourceLine: lineNum,
        output: output[0] ?? '',
      })
    }

    // requestIdleCallback
    if (line.startsWith('requestIdleCallback(')) {
      const output = findConsoleLogsInBlock(lines, i)
      tasks.push({
        code: `requestIdleCallback(() => { ... })`,
        label: extractShortLabel(output[0] ?? 'idle callback'),
        queueType: 'idle',
        sourceLine: lineNum,
        output: output[0] ?? '',
      })
    }
  }

  return tasks
}

function flattenToSteps(tasks: ParsedTask[]): ExecutionStep[] {
  const steps: ExecutionStep[] = []

  // Phase 1: synchronous tasks go to call stack and execute immediately
  const syncTasks = tasks.filter((t) => t.queueType === 'callStack' && !t.children)
  const asyncTasks = tasks.filter((t) => t.queueType !== 'callStack' || t.children)

  // Execute sync tasks first
  for (const task of syncTasks) {
    steps.push({
      id: generateId(),
      code: task.code,
      label: task.label,
      annotation: `Synchronous code executes immediately on the call stack`,
      queueType: 'callStack',
      sourceLine: task.sourceLine,
      phase: 'execute',
      output: task.output,
    })
  }

  // Phase 2: enqueue async tasks
  for (const task of asyncTasks) {
    steps.push({
      id: generateId(),
      code: task.code,
      label: task.label,
      annotation: getEnqueueAnnotation(task.queueType),
      queueType: task.queueType,
      sourceLine: task.sourceLine,
      phase: 'enqueue',
    })
  }

  // Phase 3: drain microtask queue first (priority order)
  const microtasks = asyncTasks.filter((t) => t.queueType === 'microtask')
  for (const task of microtasks) {
    steps.push({
      id: generateId(),
      code: task.code,
      label: task.label,
      annotation: `Microtask queue drains first — higher priority than macrotasks`,
      queueType: task.queueType,
      sourceLine: task.sourceLine,
      phase: 'dequeue',
    })
    steps.push({
      id: generateId(),
      code: task.code,
      label: task.label,
      annotation: `Executing microtask on the call stack`,
      queueType: task.queueType,
      sourceLine: task.sourceLine,
      phase: 'execute',
      output: task.output,
    })
  }

  // Phase 4: macrotasks (one at a time, check microtasks between each)
  const macrotasks = asyncTasks.filter((t) => t.queueType === 'macrotask')
  for (const task of macrotasks) {
    steps.push({
      id: generateId(),
      code: task.code,
      label: task.label,
      annotation: `Timer expired — dequeue from macrotask queue`,
      queueType: task.queueType,
      sourceLine: task.sourceLine,
      phase: 'dequeue',
    })
    steps.push({
      id: generateId(),
      code: task.code,
      label: task.label,
      annotation: `Executing macrotask callback on the call stack`,
      queueType: task.queueType,
      sourceLine: task.sourceLine,
      phase: 'execute',
      output: task.output,
    })

    // Nested microtasks from within this macrotask
    if (task.children) {
      for (const child of task.children) {
        steps.push({
          id: generateId(),
          code: child.code,
          label: child.label,
          annotation: `Microtask created inside macrotask — enqueued to microtask queue`,
          queueType: child.queueType,
          sourceLine: child.sourceLine,
          phase: 'enqueue',
        })
        steps.push({
          id: generateId(),
          code: child.code,
          label: child.label,
          annotation: `Draining microtask queue before next macrotask`,
          queueType: child.queueType,
          sourceLine: child.sourceLine,
          phase: 'dequeue',
        })
        steps.push({
          id: generateId(),
          code: child.code,
          label: child.label,
          annotation: `Executing nested microtask`,
          queueType: child.queueType,
          sourceLine: child.sourceLine,
          phase: 'execute',
          output: child.output,
        })
      }
    }
  }

  // Phase 5: animation frame queue
  const animationTasks = asyncTasks.filter((t) => t.queueType === 'animation')
  for (const task of animationTasks) {
    steps.push({
      id: generateId(),
      code: task.code,
      label: task.label,
      annotation: `Browser ready to paint — executing rAF callback`,
      queueType: task.queueType,
      sourceLine: task.sourceLine,
      phase: 'dequeue',
    })
    steps.push({
      id: generateId(),
      code: task.code,
      label: task.label,
      annotation: `Executing animation frame callback`,
      queueType: task.queueType,
      sourceLine: task.sourceLine,
      phase: 'execute',
      output: task.output,
    })
  }

  // Phase 6: idle callbacks
  const idleTasks = asyncTasks.filter((t) => t.queueType === 'idle')
  for (const task of idleTasks) {
    steps.push({
      id: generateId(),
      code: task.code,
      label: task.label,
      annotation: `Browser idle — executing idle callback`,
      queueType: task.queueType,
      sourceLine: task.sourceLine,
      phase: 'dequeue',
    })
    steps.push({
      id: generateId(),
      code: task.code,
      label: task.label,
      annotation: `Executing idle callback (lowest priority)`,
      queueType: task.queueType,
      sourceLine: task.sourceLine,
      phase: 'execute',
      output: task.output,
    })
  }

  return steps
}

function isTopLevelConsolelog(lines: string[], index: number): boolean {
  const line = lines[index].trim()
  if (!line.startsWith('console.log(')) return false

  // Check indentation — top level should not be indented much
  const indent = lines[index].length - lines[index].trimStart().length
  return indent <= 0
}

function extractConsoleOutput(line: string): string {
  const match = line.match(/console\.log\(["'`](.+?)["'`]/)
  return match ? match[1] : 'output'
}

function extractShortLabel(output: string): string {
  // Take just the last meaningful part
  const parts = output.split(' - ')
  return parts[parts.length - 1]?.trim() ?? output
}

function findConsoleLogsInBlock(lines: string[], startIndex: number): string[] {
  const outputs: string[] = []
  let depth = 0
  let started = false

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i]
    if (line.includes('{') || line.includes('(')) {
      depth += (line.match(/{/g) ?? []).length + (line.match(/\(/g) ?? []).length
      started = true
    }
    if (line.includes('}') || line.includes(')')) {
      depth -= (line.match(/}/g) ?? []).length + (line.match(/\)/g) ?? []).length
    }

    if (line.trim().startsWith('console.log(')) {
      outputs.push(extractConsoleOutput(line.trim()))
    }

    if (started && depth <= 0) break
  }

  return outputs
}

function findNestedAsyncInBlock(lines: string[], startIndex: number): ParsedTask[] {
  const tasks: ParsedTask[] = []
  let depth = 0
  let started = false

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (lines[i].includes('{') || lines[i].includes('(')) {
      depth += (lines[i].match(/{/g) ?? []).length + (lines[i].match(/\(/g) ?? []).length
      started = true
    }
    if (lines[i].includes('}') || lines[i].includes(')')) {
      depth -= (lines[i].match(/}/g) ?? []).length + (lines[i].match(/\)/g) ?? []).length
    }

    if (line.startsWith('Promise.resolve()')) {
      const outputs = findConsoleLogsInBlock(lines, i)
      for (const output of outputs) {
        tasks.push({
          code: `.then(() => { console.log(...) })`,
          label: extractShortLabel(output),
          queueType: 'microtask',
          sourceLine: i - startIndex,
          output,
        })
      }
    }

    if (started && depth <= 0) break
  }

  return tasks
}

function getEnqueueAnnotation(queueType: QueueType): string {
  switch (queueType) {
    case 'microtask':
      return 'Promise resolved — callback added to microtask queue'
    case 'macrotask':
      return 'setTimeout registered — callback added to macrotask queue'
    case 'animation':
      return 'requestAnimationFrame registered — callback added to animation frame queue'
    case 'idle':
      return 'requestIdleCallback registered — callback added to idle queue'
    case 'callStack':
      return 'Pushed to call stack'
  }
}
