import type { GenericPipelineStage, PipelineBadge } from '@shared/types/pipeline'

export function generateReactStages(jsx: string): GenericPipelineStage[] {
  return [
    buildJsxSourceStage(jsx),
    buildBabelTransformStage(jsx),
    buildReactElementsStage(jsx),
    buildFiberTreeStage(jsx),
    buildReconciliationStage(jsx),
    buildCommitPhaseStage(jsx),
    buildEffectsStage(jsx),
    buildBrowserPaintStage(jsx),
  ]
}

// ─── Stage 1: JSX Source ──────────────────────────────────────────────────
function buildJsxSourceStage(jsx: string): GenericPipelineStage {
  return {
    id: 'jsx-source',
    title: 'JSX Source',
    description: 'Developer writes declarative JSX — not valid JS yet',
    explanation:
      'JSX is syntactic sugar — it\'s not valid JavaScript. A transpiler (Babel or TypeScript) must transform it before the browser can run it. JSX describes the UI in a familiar HTML-like syntax, but it\'s actually calls to React.createElement() under the hood. The new JSX transform (React 17+) uses a separate "jsx" runtime instead of React.createElement, enabling smaller bundles.',
    colorText: 'text-sky-400',
    colorBg: 'bg-sky-400/10',
    colorBorder: 'border-sky-400/30',
    content: jsx.trim(),
    badges: detectJsxBadges(jsx),
  }
}

// ─── Stage 2: Babel Transform ────────────────────────────────────────────
function buildBabelTransformStage(jsx: string): GenericPipelineStage {
  const transformed = transformJsxToCalls(jsx)
  return {
    id: 'babel-transform',
    title: 'Babel / TS Transform',
    description: 'JSX → React.createElement() calls at build time',
    explanation:
      'At build time (Webpack/Vite + Babel/SWC), JSX is compiled to JavaScript. The new JSX transform (React 17+) imports from "react/jsx-runtime" and uses _jsx()/_jsxs() instead of React.createElement — React no longer needs to be in scope. Hooks like useState are left as-is since they\'re plain function calls. TypeScript types are erased. The output is standard ESM JavaScript.',
    colorText: 'text-amber-400',
    colorBg: 'bg-amber-400/10',
    colorBorder: 'border-amber-400/30',
    content: transformed,
    badges: [
      { type: 'info', label: 'Build-time only', detail: 'JSX transformation happens at build time, not in the browser — zero runtime cost for the transform itself' },
      { type: 'optimization', label: 'New JSX transform', detail: 'React 17+ jsx-runtime eliminates the need to import React in every file' },
    ],
  }
}

// ─── Stage 3: React Elements ──────────────────────────────────────────────
function buildReactElementsStage(jsx: string): GenericPipelineStage {
  const elements = buildElementTree(jsx)
  return {
    id: 'react-elements',
    title: 'React Element Tree',
    description: 'Plain JS objects describing what to render',
    explanation:
      'React.createElement() / _jsx() returns plain JavaScript objects called "React elements". These are lightweight descriptors — they\'re not real DOM nodes. An element has a "type" (string for DOM, function/class for components), "props" (including children), and a "key" for reconciliation. This is the "virtual DOM" — a cheap, disposable JS representation used to diff against the previous render.',
    colorText: 'text-indigo-400',
    colorBg: 'bg-indigo-400/10',
    colorBorder: 'border-indigo-400/30',
    content: elements,
    badges: [
      { type: 'optimization', label: 'Lightweight objects', detail: 'React elements are plain JS objects — cheap to create and discard on every render' },
      { type: 'info', label: 'Virtual DOM', detail: 'The element tree is the "virtual DOM" — a description of the desired UI, not actual DOM nodes' },
    ],
  }
}

// ─── Stage 4: Fiber Tree ──────────────────────────────────────────────────
function buildFiberTreeStage(jsx: string): GenericPipelineStage {
  const fiberTree = buildFiberTreeText(jsx)
  return {
    id: 'fiber-tree',
    title: 'Fiber Tree',
    description: 'React\'s internal work unit tree — enables concurrent rendering',
    explanation:
      'React\'s "Fiber" architecture (introduced in React 16) represents each component as a "fiber" node — a JS object holding the component type, props, state, hooks, effects, and pointers to parent/child/sibling fibers. Fibers enable React to pause, resume, and abort rendering work (concurrent mode). There are two fiber trees: "current" (what\'s on screen) and "work-in-progress" (being rendered). React alternates between them.',
    colorText: 'text-violet-400',
    colorBg: 'bg-violet-400/10',
    colorBorder: 'border-violet-400/30',
    content: fiberTree,
    badges: [
      { type: 'optimization', label: 'Concurrent rendering', detail: 'Fiber enables time-slicing — React can yield to the browser mid-render to keep the UI responsive' },
      { type: 'info', label: 'Double buffering', detail: 'React maintains two fiber trees: "current" (displayed) and "work-in-progress" (building)' },
    ],
  }
}

// ─── Stage 5: Reconciliation ──────────────────────────────────────────────
function buildReconciliationStage(jsx: string): GenericPipelineStage {
  const reconciliation = buildReconciliationText(jsx)
  return {
    id: 'reconciliation',
    title: 'Reconciliation (Diffing)',
    description: 'Compare prev fiber tree vs new → find minimal DOM changes',
    explanation:
      'Reconciliation diffs the previous fiber tree against the new element tree to find the minimum set of DOM operations needed. React\'s heuristic algorithm is O(n) (not O(n³)): same type at same position → update in place; different type → unmount old, mount new. Keys help React identify moved items in lists. In concurrent mode, this work is split into small chunks (5ms each) to avoid blocking the main thread.',
    colorText: 'text-fuchsia-400',
    colorBg: 'bg-fuchsia-400/10',
    colorBorder: 'border-fuchsia-400/30',
    content: reconciliation,
    badges: detectReconciliationBadges(jsx),
  }
}

// ─── Stage 6: Commit Phase ────────────────────────────────────────────────
function buildCommitPhaseStage(jsx: string): GenericPipelineStage {
  const commit = buildCommitText(jsx)
  return {
    id: 'commit-phase',
    title: 'Commit Phase',
    description: 'Apply DOM mutations — synchronous and uninterruptible',
    explanation:
      'The commit phase is synchronous — it cannot be interrupted or paused. It walks the "effects list" (fibers with pending work) and applies them in three sub-phases: Before Mutation (getSnapshotBeforeUpdate, schedule passive effects), Mutation (insert/update/delete DOM nodes), Layout (useLayoutEffect runs synchronously after DOM updates but before browser paint). After commit, "current" tree is swapped to the work-in-progress tree.',
    colorText: 'text-emerald-400',
    colorBg: 'bg-emerald-400/10',
    colorBorder: 'border-emerald-400/30',
    content: commit,
    badges: [
      { type: 'warning', label: 'Synchronous', detail: 'Commit phase is synchronous and uninterruptible — long commits block the main thread' },
      { type: 'info', label: 'Effects list', detail: 'Only fibers with pending effects are visited — React tracks them during reconciliation' },
    ],
  }
}

// ─── Stage 7: Effects ────────────────────────────────────────────────────
function buildEffectsStage(jsx: string): GenericPipelineStage {
  const effects = buildEffectsText(jsx)
  return {
    id: 'effects',
    title: 'Effects (useEffect)',
    description: 'Passive effects fire after browser paint — async',
    explanation:
      'useEffect runs asynchronously after the browser has painted. React schedules effects using MessageChannel/setTimeout to yield to the browser. useLayoutEffect runs synchronously in the commit phase (before paint) — use it for DOM measurements. Effects run in order: cleanup of previous effects first, then new effects. In Strict Mode (dev only), effects run twice to detect side-effect bugs.',
    colorText: 'text-orange-400',
    colorBg: 'bg-orange-400/10',
    colorBorder: 'border-orange-400/30',
    content: effects,
    badges: detectEffectBadges(jsx),
  }
}

// ─── Stage 8: Browser Paint ───────────────────────────────────────────────
function buildBrowserPaintStage(jsx: string): GenericPipelineStage {
  const components = extractComponentNames(jsx)
  const content = [
    'React → DOM → Browser Paint',
    '',
    'DOM nodes created/updated:',
    ...buildDomSnapshot(jsx),
    '',
    'Browser rendering triggered by DOM mutations:',
    '  Layout (reflow): recalculate affected elements',
    '  Paint: redraw changed regions',
    '  Composite: merge layers → screen',
    '',
    'React DevTools Profiler data (simulated):',
    ...components.map((c) => `  ${c.padEnd(18)} render: ${Math.floor(Math.random() * 5 + 1)}ms  reason: props changed`),
    '',
    'Performance tips:',
    '  React.memo — skip render if props unchanged',
    '  useMemo    — memoize expensive calculations',
    '  useCallback — stable function references',
    '  key prop   — help reconciler identify list items',
    '  Suspense   — defer non-critical rendering',
    '  Transition — mark updates as non-urgent',
  ].join('\n')

  return {
    id: 'browser-paint',
    title: 'Browser Paint',
    description: 'React\'s DOM mutations trigger browser layout → paint → composite',
    explanation:
      'After React commits DOM mutations, the browser runs its own rendering pipeline: style recalculation, layout (reflow), paint, and compositing. React batches DOM updates to minimize reflows. Using CSS transforms instead of layout properties (top/left), and promoting animated elements to compositor layers (will-change), keeps renders off the main thread. React 18\'s automatic batching reduces unnecessary renders.',
    colorText: 'text-teal-400',
    colorBg: 'bg-teal-400/10',
    colorBorder: 'border-teal-400/30',
    content,
    badges: [
      { type: 'optimization', label: 'Batched updates', detail: 'React 18 automatically batches all state updates (including in timeouts/promises) to minimize renders' },
    ],
  }
}

// ─── Transform helpers ────────────────────────────────────────────────────

function transformJsxToCalls(jsx: string): string {
  const lines: string[] = [
    '// Compiled output (React 17+ new JSX transform):',
    'import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"',
    'import { useState, useEffect, useCallback } from "react"',
    '',
  ]

  const components = extractComponentNames(jsx)
  for (const comp of components.slice(0, 3)) {
    const isDefault = jsx.includes(`export default function ${comp}`)
    lines.push(`${isDefault ? 'export default ' : ''}function ${comp}(${comp === 'App' ? '' : 'props'}) {`)
    if (jsx.includes('useState')) lines.push('  const [count, setCount] = useState(0)')
    if (jsx.includes('useEffect')) lines.push('  useEffect(() => { /* effect */ }, [count])')
    if (jsx.includes('useCallback')) lines.push('  const increment = useCallback(() => setCount(c=>c+1), [])')
    lines.push('  return _jsxs("div", {')
    lines.push(`    className: "${comp.toLowerCase()}",`)
    lines.push('    children: [')
    lines.push(`      _jsx("h2", { children: "Count: " + count }),`)
    if (comp !== 'App') lines.push('      _jsx(Button, { label: "Increment", onClick: increment }),')
    lines.push('    ]')
    lines.push('  })')
    lines.push('}')
    lines.push('')
  }

  return lines.join('\n')
}

function buildElementTree(jsx: string): string {
  const components = extractComponentNames(jsx)
  const lines: string[] = ['React Element Tree (plain JS objects):']
  lines.push('')

  const rootComp = components.find((c) => jsx.includes(`export default function ${c}`)) ?? components[0]
  lines.push(`{`)
  lines.push(`  type: ${rootComp},         // component function`)
  lines.push(`  key: null,`)
  lines.push(`  ref: null,`)
  lines.push(`  props: {`)
  lines.push(`    children: {`)
  lines.push(`      type: "main",           // DOM element`)
  lines.push(`      props: {`)
  lines.push(`        children: [`)
  lines.push(`          { type: "h1", props: { children: "React Counter" } },`)
  lines.push(`          {`)
  lines.push(`            type: Counter,    // component function`)
  lines.push(`            props: { initialCount: 5 }`)
  lines.push(`          }`)
  lines.push(`        ]`)
  lines.push(`      }`)
  lines.push(`    }`)
  lines.push(`  }`)
  lines.push(`}`)
  lines.push('')
  lines.push('Key insight: elements are PLAIN OBJECTS — not DOM nodes.')
  lines.push('React creates them fresh on every render call.')
  lines.push('Cost: ~1μs per element (extremely cheap)')
  return lines.join('\n')
}

function buildFiberTreeText(jsx: string): string {
  const components = extractComponentNames(jsx)
  const hasUseState = jsx.includes('useState')
  const hasUseEffect = jsx.includes('useEffect')
  const hasUseCallback = jsx.includes('useCallback')

  const lines: string[] = ['Fiber Tree (work-in-progress):']
  lines.push('')
  lines.push('FiberNode {')
  lines.push(`  tag: HostRoot,        // root`)
  lines.push('  child → FiberNode {')
  lines.push(`    tag: FunctionComponent`)
  lines.push(`    type: App`)
  lines.push(`    pendingProps: {}`)
  lines.push(`    memoizedState: null`)
  lines.push(`    child → FiberNode {`)
  lines.push(`      tag: HostComponent,  type: "main"`)
  lines.push(`      child → FiberNode {`)
  if (components.includes('Counter')) {
    lines.push(`        tag: FunctionComponent`)
    lines.push(`        type: Counter`)
    lines.push(`        memoizedState: Hook {  // useState`)
    if (hasUseState) lines.push(`          memoizedState: 5,   // count`)
    lines.push(`          next: Hook {       // ${hasUseEffect ? 'useEffect' : 'null'}`)
    if (hasUseEffect) lines.push(`            tag: HookEffect`)
    if (hasUseCallback) lines.push(`            next: Hook { tag: HookCallback }`)
    lines.push(`          }`)
    lines.push(`        }`)
    lines.push(`        flags: Update | ChildDeletion`)
  }
  for (const comp of components.slice(0, 2)) {
    if (comp !== 'App' && comp !== 'Counter') {
      lines.push(`        sibling → FiberNode { type: ${comp} }`)
    }
  }
  lines.push(`      }`)
  lines.push(`    }`)
  lines.push(`  }`)
  lines.push('}')
  lines.push('')
  lines.push('Each fiber tracks:')
  lines.push('  - type, key, ref')
  lines.push('  - pendingProps / memoizedProps / memoizedState')
  lines.push('  - hooks linked list (useState, useEffect…)')
  lines.push('  - effects flags (Placement | Update | Deletion)')
  lines.push('  - parent / child / sibling pointers')
  return lines.join('\n')
}

function buildReconciliationText(jsx: string): string {
  const hasList = jsx.includes('map') || jsx.includes('<li') || jsx.includes('key=')
  const lines: string[] = ['Reconciliation diff (re-render triggered by state change):']
  lines.push('')
  lines.push('Previous tree          →  New tree')
  lines.push('──────────────────────────────────────────────')
  lines.push('<App>                     <App>              (same type, update props)')
  lines.push('  <main>                    <main>           (same type, skip)')
  lines.push('    <h1>React Counter</h1>    <h1>…</h1>    (same, skip)')
  lines.push('    <Counter count=5>         <Counter count=5> (same, recurse)')
  lines.push('      <div>                     <div>        (same, skip)')
  lines.push('        <h2>Count: 5</h2>         <h2>Count: 6</h2>  ← TEXT CHANGED')
  lines.push('        <p>Doubled: 10</p>        <p>Doubled: 12</p> ← TEXT CHANGED')
  lines.push('        <Button …/>              <Button …/>  (same, props check)')
  lines.push('')
  lines.push('Effects computed:')
  lines.push('  Update  h2 textContent: "Count: 5" → "Count: 6"')
  lines.push('  Update  p  textContent: "Doubled: 10" → "Doubled: 12"')
  lines.push('')
  lines.push('Rules:')
  lines.push('  1. Same type + same position → update in place (FAST)')
  lines.push('  2. Different type → unmount + remount (SLOW, avoidable)')
  lines.push('  3. List items → use "key" to preserve identity')
  if (hasList) lines.push('  ✓ key prop detected — list reconciliation optimized')
  return lines.join('\n')
}

function buildCommitText(jsx: string): string {
  const hasUseLayoutEffect = jsx.includes('useLayoutEffect')
  const hasRef = jsx.includes('useRef') || jsx.includes('ref=')

  const lines: string[] = ['Commit Phase (synchronous — cannot be interrupted)']
  lines.push('')
  lines.push('Sub-phase 1: Before Mutation')
  lines.push('  getSnapshotBeforeUpdate (class components)')
  lines.push('  Schedule passive effects (useEffect cleanups)')
  lines.push('')
  lines.push('Sub-phase 2: Mutation')
  lines.push('  Walk effects list (fibers with pending flags):')
  lines.push('    FiberNode h2:  commitUpdate()')
  lines.push('      DOM: h2.textContent = "Count: 6"')
  lines.push('    FiberNode p:   commitUpdate()')
  lines.push('      DOM: p.textContent = "Doubled: 12"')
  if (hasRef) {
    lines.push('    FiberNode ref: attach ref.current = domNode')
  }
  lines.push('')
  lines.push('Sub-phase 3: Layout')
  if (hasUseLayoutEffect) {
    lines.push('  useLayoutEffect cleanup (synchronous)')
    lines.push('  useLayoutEffect callback (synchronous, before paint)')
  } else {
    lines.push('  No useLayoutEffect in this tree')
  }
  lines.push('  componentDidMount / componentDidUpdate (class components)')
  lines.push('')
  lines.push('After commit:')
  lines.push('  current = workInProgress  (swap trees)')
  lines.push('  workInProgress = null')
  lines.push('  Schedule useEffect callbacks (async, after paint)')
  return lines.join('\n')
}

function buildEffectsText(jsx: string): string {
  const effects = extractEffects(jsx)
  const lines: string[] = ['Effects Timeline (relative to render)']
  lines.push('')
  lines.push('⓪ State update: setCount(6)')
  lines.push('① React schedules re-render (batched)')
  lines.push('② Render phase (reconciliation) ────── main thread')
  lines.push('③ Commit phase (DOM mutations) ─────── main thread')
  lines.push('④ Browser paint ────────────────────── GPU')
  lines.push('⑤ useEffect callbacks ──────────────── main thread (async)')
  lines.push('')
  lines.push('Effects found in this component:')
  for (const effect of effects) {
    lines.push('')
    lines.push(`  ${effect.hook}: ${effect.desc}`)
    lines.push(`  Deps: [${effect.deps}]`)
    lines.push(`  Runs: ${effect.timing}`)
    if (effect.cleanup) lines.push(`  Cleanup: ${effect.cleanup}`)
  }
  lines.push('')
  lines.push('Strict Mode (dev): effects run TWICE')
  lines.push('  Run 1: mount → effect runs')
  lines.push('  Unmount: cleanup runs')
  lines.push('  Run 2: remount → effect runs again')
  lines.push('  Purpose: expose missing cleanup functions')
  return lines.join('\n')
}

function buildDomSnapshot(jsx: string): string[] {
  const components = extractComponentNames(jsx)
  const tags = jsx.match(/<([a-z][a-zA-Z]*)[^>]*>/g) ?? []
  const domTags = [...new Set(tags.map((t) => t.match(/<([a-z]+)/)?.[1]).filter(Boolean))]
  return [
    `  <main>`,
    `    <h1>React Counter</h1>`,
    `    <div class="counter">`,
    `      <h2>Count: 6</h2>  ← updated`,
    `      <p>Doubled: 12</p> ← updated`,
    `      <button class="btn">Increment</button>`,
    `    </div>`,
    `  </main>`,
    ``,
    `  Components in tree: ${components.join(', ')}`,
    `  Native DOM tags: ${domTags.slice(0, 6).join(', ')}`,
  ]
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function extractComponentNames(jsx: string): string[] {
  const matches = jsx.match(/function\s+([A-Z][a-zA-Z]*)/g) ?? []
  return [...new Set(matches.map((m) => m.replace('function ', '')))]
}

interface Effect { hook: string; desc: string; deps: string; timing: string; cleanup?: string }

function extractEffects(jsx: string): Effect[] {
  const effects: Effect[] = []
  if (jsx.includes('useEffect')) {
    const depsMatch = jsx.match(/useEffect\([^,)]+,\s*\[([^\]]*)\]/)?.[1] ?? 'no deps'
    effects.push({
      hook: 'useEffect',
      desc: 'document.title update',
      deps: depsMatch || 'count',
      timing: 'after every render where [count] changed',
      cleanup: 'document.title = "App"',
    })
  }
  if (jsx.includes('useLayoutEffect')) {
    effects.push({
      hook: 'useLayoutEffect',
      desc: 'DOM measurement / mutation',
      deps: '',
      timing: 'synchronously BEFORE browser paint',
    })
  }
  if (effects.length === 0) {
    effects.push({ hook: 'useEffect', desc: '(no effects detected — add useEffect to see)', deps: '', timing: 'after paint' })
  }
  return effects
}

// ─── Badge detectors ──────────────────────────────────────────────────────

function detectJsxBadges(jsx: string): PipelineBadge[] {
  const badges: PipelineBadge[] = []
  const compCount = (jsx.match(/function\s+[A-Z]/g) ?? []).length
  badges.push({ type: 'info', label: `${compCount} component(s)`, detail: 'Each function starting with a capital letter is a React component' })
  if (jsx.includes('useCallback')) badges.push({ type: 'optimization', label: 'useCallback', detail: 'Memoizes the function reference — prevents child re-renders when reference changes' })
  if (jsx.includes('useMemo')) badges.push({ type: 'optimization', label: 'useMemo', detail: 'Memoizes expensive computed values' })
  return badges
}

function detectReconciliationBadges(jsx: string): PipelineBadge[] {
  const badges: PipelineBadge[] = []
  if (jsx.includes('key=') || (jsx.includes('.map(') && jsx.includes('key'))) {
    badges.push({ type: 'optimization', label: 'keys used', detail: 'Keys help React identify which list items changed, moved, or were added/removed' })
  } else if (jsx.includes('.map(')) {
    badges.push({ type: 'warning', label: 'Missing keys?', detail: 'List rendering without keys forces React to re-render all items on any change' })
  }
  if (jsx.includes('React.memo') || jsx.includes('memo(')) {
    badges.push({ type: 'optimization', label: 'React.memo', detail: 'Component skips re-render if props are shallowly equal' })
  }
  return badges
}

function detectEffectBadges(jsx: string): PipelineBadge[] {
  const badges: PipelineBadge[] = []
  if (jsx.includes('useEffect') && !jsx.match(/useEffect\([^)]+,\s*\[[^\]]*\]/)) {
    badges.push({ type: 'warning', label: 'Effect w/o deps?', detail: 'useEffect without a dependency array runs after EVERY render — likely unintentional' })
  }
  if (jsx.includes('useLayoutEffect')) {
    badges.push({ type: 'warning', label: 'useLayoutEffect', detail: 'Runs synchronously before paint — blocks visual updates. Use only for DOM measurements' })
  }
  if (jsx.includes('return () =>') || jsx.includes('return () =>')) {
    badges.push({ type: 'optimization', label: 'Cleanup function', detail: 'Effect returns a cleanup function — prevents memory leaks and stale closures' })
  }
  return badges
}
