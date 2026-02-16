# JS Task Queue Visualizer — PRD

## Overview

A React app that visually demonstrates how JavaScript's event loop, task queues, and compilation pipeline work. Two screens: a **Task Queue Visualizer** (`/`) and a **Compilation Pipeline** (`/compilation`).

---

## Screen 1: Task Queue Visualizer (`/`)

### Purpose

Show how JavaScript code flows through the event loop and its various queues — making the invisible runtime visible.

### Layout

Three-column layout:

| Source Code | Queues & Event Loop | Execution Output |
|---|---|---|
| Editable code panel | Visual queue columns | Console-style output log |

### Queues Visualized

1. **Call Stack** — synchronous execution frames
2. **Microtask Queue** — `Promise.then`, `queueMicrotask`, `MutationObserver`
3. **Macrotask Queue (Task Queue)** — `setTimeout`, `setInterval`, `setImmediate`, I/O callbacks
4. **Animation Frame Queue** — `requestAnimationFrame`
5. **Idle Callback Queue** — `requestIdleCallback`

### Behavior

- **Default state**: ships with a pre-loaded code snippet that uses all queue types (promises, timeouts, rAF, microtasks, etc.)
- **Stepping**: user can step through execution or play it automatically at adjustable speed
- **Color coding**: each queue type gets a distinct color. As a task token moves from source → queue → call stack → output, it carries its color
- **Hover details**: hovering a task in the queue shows a tooltip with its source code and type.
- **Annotations**: each step shows a short label explaining *why* something moved (e.g., "Promise resolved → microtask queue", "Timer expired → macrotask queue")
- **Custom code**: user can clear the default and paste/type their own JS. The visualizer parses and animates it the same way
- **Summary panel**: collapsible section (top or bottom) with a concise explanation of the full event loop flow and queue priority order

### Interaction

- Play / Pause / Step / Reset controls
- Speed slider
- "Reset to default" button to restore the demo snippet
- Hovering a queued item highlights its origin in the source code

---

## Screen 2: Compilation Pipeline (`/compilation`)

### Purpose

Visualize how JavaScript source code is compiled and executed by a modern engine (V8-style pipeline).

### Layout

Horizontal pipeline with 5 stages connected by animated arrows:

```
Source Code → Parsing (AST) → Bytecode → Machine Code → Execution
```

### Behavior

- **Input**: editable code panel on the left
- **Stages**: each stage is a card/column showing a simplified representation:
  - **Source Code** — the raw JS
  - **Parsing** — token list + simplified AST tree view
  - **Bytecode** — pseudo-bytecode representation (readable, not actual V8 bytecode)
  - **Machine Code** — stylized hex/assembly-like output (illustrative)
  - **Execution** — final output / return value
- **Animation**: code flows left-to-right through the pipeline with smooth transitions
- **Annotations**: each stage has a short explanation card underneath describing what happens there
- **Optimization hints**: highlight when something would trigger optimization (e.g., hot functions) or deoptimization (e.g., hidden class changes) — shown as colored badges

### Interaction

- "Compile" button triggers the pipeline animation
- Each stage is clickable to expand a detailed explanation
- Default demo code pre-loaded; user can replace it

---

## Shared Requirements

- **Stack**: React (Vite), React Router, Tailwind CSS
- **Responsive**: works on desktop; tablet-friendly at minimum
- **No backend**: everything runs client-side
- **Routing**: `/` → Task Queue Visualizer, `/compilation` → Compilation Pipeline
- **Nav**: minimal top nav to switch between the two screens
- **Design**: dark theme, monospace code fonts, clean and dense — developer-tool aesthetic, not marketing-site aesthetic

---

## Non-Goals

- Not a real JS engine — we simulate/illustrate behavior, not replicate V8 internals
- No server-side execution or sandboxing — code visualization is conceptual
- No mobile-first design (desktop is primary)
