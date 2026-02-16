import type { PipelineStage, OptimizationHint } from '../types/pipeline-types'

export function generatePipelineStages(code: string): PipelineStage[] {
  return [
    buildSourceStage(code),
    buildParsingStage(code),
    buildBytecodeStage(code),
    buildMachineCodeStage(code),
    buildExecutionStage(code),
  ]
}

function buildSourceStage(code: string): PipelineStage {
  return {
    id: 'source',
    title: 'Source Code',
    description: 'Raw JavaScript as written by the developer',
    detailedExplanation:
      'The V8 engine receives raw JavaScript source code as a UTF-16 encoded string. ' +
      'Before any execution can happen, this text must be parsed into a structured format ' +
      'the engine can understand. The source is first scanned by a lexer/tokenizer.',
    color: 'text-stage-source',
    colorBg: 'bg-stage-source/15',
    colorBorder: 'border-stage-source/40',
    content: code,
    optimizationHints: [],
  }
}

function buildParsingStage(code: string): PipelineStage {
  const tokens = tokenize(code)
  const ast = buildSimplifiedAST(code)
  const content = `// Tokens:\n${tokens}\n\n// Simplified AST:\n${ast}`

  return {
    id: 'parsing',
    title: 'Parsing (AST)',
    description: 'Tokenization + Abstract Syntax Tree generation',
    detailedExplanation:
      'The parser converts source code into an Abstract Syntax Tree (AST). ' +
      'V8 uses two parsers: a fast "pre-parser" that skips function bodies not immediately needed ' +
      '(lazy parsing), and a full parser for code that runs right away. ' +
      'This avoids parsing code that may never execute.',
    color: 'text-stage-parse',
    colorBg: 'bg-stage-parse/15',
    colorBorder: 'border-stage-parse/40',
    content,
    optimizationHints: detectParsingHints(code),
  }
}

function buildBytecodeStage(code: string): PipelineStage {
  const bytecode = generatePseudoBytecode(code)

  return {
    id: 'bytecode',
    title: 'Bytecode',
    description: 'Ignition interpreter generates bytecode',
    detailedExplanation:
      'V8\'s Ignition interpreter compiles the AST into compact bytecode. ' +
      'Bytecode is a lower-level representation that\'s faster to interpret than re-parsing the AST. ' +
      'Ignition also collects type feedback — profiling data about the types of values ' +
      'flowing through each operation. This feedback drives optimization decisions.',
    color: 'text-stage-bytecode',
    colorBg: 'bg-stage-bytecode/15',
    colorBorder: 'border-stage-bytecode/40',
    content: bytecode,
    optimizationHints: detectBytecodeHints(code),
  }
}

function buildMachineCodeStage(code: string): PipelineStage {
  const machineCode = generatePseudoMachineCode(code)

  return {
    id: 'machine',
    title: 'Machine Code',
    description: 'TurboFan JIT compiler optimizes hot functions',
    detailedExplanation:
      'When Ignition detects a "hot" function (called many times), it triggers TurboFan — ' +
      'V8\'s optimizing JIT compiler. TurboFan uses the type feedback collected by Ignition ' +
      'to generate highly optimized machine code with speculative optimizations. ' +
      'If assumptions are violated (e.g., a number becomes a string), the code is "deoptimized" ' +
      'back to bytecode interpretation.',
    color: 'text-stage-machine',
    colorBg: 'bg-stage-machine/15',
    colorBorder: 'border-stage-machine/40',
    content: machineCode,
    optimizationHints: detectMachineCodeHints(code),
  }
}

function buildExecutionStage(code: string): PipelineStage {
  const output = simulateExecution(code)

  return {
    id: 'execution',
    title: 'Execution',
    description: 'Code runs and produces output',
    detailedExplanation:
      'The optimized machine code (or interpreted bytecode for cold functions) ' +
      'executes on the CPU. Results are produced, side effects occur, and the ' +
      'program\'s observable behavior manifests. The event loop manages async operations ' +
      'while the call stack handles synchronous execution.',
    color: 'text-stage-execute',
    colorBg: 'bg-stage-execute/15',
    colorBorder: 'border-stage-execute/40',
    content: output,
    optimizationHints: [],
  }
}

// --- Helpers ---

function tokenize(code: string): string {
  const keywords = ['function', 'const', 'let', 'var', 'return', 'for', 'if', 'else', 'while', 'new']
  const tokens: string[] = []
  const words = code.match(/[a-zA-Z_$][a-zA-Z0-9_$]*|[{}();\[\],.<>=+\-*/!&|]+|"[^"]*"|'[^']*'|\d+/g) ?? []

  for (const word of words.slice(0, 30)) {
    if (keywords.includes(word)) {
      tokens.push(`KEYWORD(${word})`)
    } else if (/^\d+$/.test(word)) {
      tokens.push(`NUMBER(${word})`)
    } else if (/^["']/.test(word)) {
      tokens.push(`STRING(${word})`)
    } else if (/^[{}();\[\],.<>=+\-*/!&|]+$/.test(word)) {
      tokens.push(`PUNCT(${word})`)
    } else {
      tokens.push(`IDENT(${word})`)
    }
  }

  if (words.length > 30) tokens.push(`... +${words.length - 30} more tokens`)
  return tokens.join('  ')
}

function buildSimplifiedAST(code: string): string {
  const lines: string[] = ['Program']
  const functions = code.match(/function\s+(\w+)\s*\(([^)]*)\)/g) ?? []
  const forLoops = code.match(/for\s*\(/g) ?? []
  const constDecls = code.match(/const\s+(\w+)/g) ?? []
  const consoleLogs = code.match(/console\.log\(/g) ?? []

  for (const fn of functions) {
    const match = fn.match(/function\s+(\w+)\s*\(([^)]*)\)/)
    if (match) {
      lines.push(`  FunctionDeclaration "${match[1]}"`)
      lines.push(`    Params: [${match[2]}]`)
      lines.push(`    Body: BlockStatement`)
      lines.push(`      ReturnStatement`)
    }
  }

  for (let i = 0; i < forLoops.length; i++) {
    lines.push(`  ForStatement`)
    lines.push(`    Init: VariableDeclaration`)
    lines.push(`    Test: BinaryExpression (<)`)
    lines.push(`    Update: UpdateExpression (++)`)
    lines.push(`    Body: BlockStatement`)
  }

  for (const decl of constDecls) {
    const name = decl.replace('const ', '')
    lines.push(`  VariableDeclaration (const)`)
    lines.push(`    "${name}" = CallExpression`)
  }

  for (let i = 0; i < consoleLogs.length; i++) {
    lines.push(`  ExpressionStatement`)
    lines.push(`    CallExpression: console.log`)
  }

  return lines.join('\n')
}

function generatePseudoBytecode(code: string): string {
  const lines: string[] = []
  const functions = code.match(/function\s+(\w+)\s*\(([^)]*)\)/g) ?? []

  for (const fn of functions) {
    const match = fn.match(/function\s+(\w+)\s*\(([^)]*)\)/)
    if (!match) continue
    const name = match[1]
    const params = match[2].split(',').map((p) => p.trim()).filter(Boolean)

    lines.push(`; Function: ${name}`)
    lines.push(`  CreateFunctionContext`)
    for (let i = 0; i < params.length; i++) {
      lines.push(`  Ldar a${i}              ; load ${params[i]}`)
    }

    if (code.includes(`return ${params.join(' + ')}`)) {
      lines.push(`  Add a0, a1            ; binary op +`)
      lines.push(`  Return                ; return result`)
    } else {
      lines.push(`  LdaConstant [0]       ; load string constant`)
      lines.push(`  Add a0, [0]           ; concatenate`)
      lines.push(`  Star r0               ; store to register`)
      lines.push(`  Return                ; return r0`)
    }
    lines.push('')
  }

  if (code.includes('for')) {
    lines.push('; Loop')
    lines.push('  LdaZero               ; i = 0')
    lines.push('  Star r1')
    lines.push('LOOP:')
    lines.push('  TestLessThan r1, [10000]')
    lines.push('  JumpIfFalse END')
    lines.push('  CallFunction add, r1, r1+1')
    lines.push('  Inc r1')
    lines.push('  Jump LOOP')
    lines.push('END:')
    lines.push('')
  }

  if (code.includes('console.log')) {
    lines.push('; console.log call')
    lines.push('  LdaGlobal [console]')
    lines.push('  GetNamedProperty [log]')
    lines.push('  CallProperty1 r0')
  }

  return lines.join('\n')
}

function generatePseudoMachineCode(code: string): string {
  const lines: string[] = []

  lines.push('; x86-64 optimized output (TurboFan)')
  lines.push('; ====================================')
  lines.push('')

  const hasFunctions = code.includes('function')
  const hasLoop = code.includes('for')

  if (hasFunctions) {
    lines.push('; -- add(a, b) [OPTIMIZED - monomorphic]')
    lines.push('  0x00: 55                 push  rbp')
    lines.push('  0x01: 48 89 e5           mov   rbp, rsp')
    lines.push('  0x04: 48 03 c7           add   rax, rdi    ; integer add')
    lines.push('  0x07: 5d                 pop   rbp')
    lines.push('  0x08: c3                 ret')
    lines.push('')
  }

  if (hasLoop) {
    lines.push('; -- hot loop [OPTIMIZED - OSR entry]')
    lines.push('  0x10: 31 c0              xor   eax, eax    ; i = 0')
    lines.push('  0x12: 3d 10 27 00 00     cmp   eax, 10000')
    lines.push('  0x17: 7d 08              jge   0x21')
    lines.push('  0x19: e8 xx xx xx xx     call  add_opt')
    lines.push('  0x1e: ff c0              inc   eax')
    lines.push('  0x20: eb f0              jmp   0x12')
    lines.push('  0x21: ...               ; loop exit')
    lines.push('')
  }

  lines.push('; -- string operations [INTERPRETED]')
  lines.push(';    (not hot enough for TurboFan)')
  lines.push('  [bytecode fallback for greet()]')

  return lines.join('\n')
}

function simulateExecution(code: string): string {
  const outputs: string[] = []

  // Find all console.log calls
  const logMatches = code.match(/console\.log\(([^)]+)\)/g) ?? []
  for (const match of logMatches) {
    const argMatch = match.match(/console\.log\((.+)\)/)
    if (argMatch) {
      let arg = argMatch[1].trim()
      // Simple string resolution
      if (arg.startsWith('"') || arg.startsWith("'")) {
        outputs.push(arg.replace(/["']/g, ''))
      } else {
        outputs.push(`> ${arg}`)
      }
    }
  }

  // Simulate function results
  if (code.includes('greet("World")')) {
    outputs.push('> "Hello, World!"')
  }

  if (outputs.length === 0) {
    outputs.push('(no console output)')
  }

  return outputs.join('\n')
}

function detectParsingHints(code: string): OptimizationHint[] {
  const hints: OptimizationHint[] = []

  const functions = code.match(/function\s+\w+/g) ?? []
  if (functions.length > 1) {
    hints.push({
      type: 'optimization',
      label: 'Lazy Parsing',
      description: `${functions.length} functions detected — V8 will pre-parse function bodies not immediately invoked`,
    })
  }

  return hints
}

function detectBytecodeHints(code: string): OptimizationHint[] {
  const hints: OptimizationHint[] = []

  if (code.includes('for') && code.match(/\d{4,}/)) {
    hints.push({
      type: 'optimization',
      label: 'Type Feedback',
      description: 'Loop body executes many times — Ignition collects type profiles for optimization',
    })
  }

  return hints
}

function detectMachineCodeHints(code: string): OptimizationHint[] {
  const hints: OptimizationHint[] = []

  if (code.includes('for') && code.match(/\d{4,}/)) {
    hints.push({
      type: 'optimization',
      label: 'Hot Function',
      description: 'Function called 10,000+ times — TurboFan compiles to optimized machine code',
    })
    hints.push({
      type: 'optimization',
      label: 'OSR (On-Stack Replacement)',
      description: 'Hot loop detected — V8 replaces running bytecode with optimized code mid-execution',
    })
  }

  if (code.includes('"') && code.includes('+')) {
    hints.push({
      type: 'deoptimization',
      label: 'String Concatenation',
      description: 'Dynamic string building may prevent full optimization — consider template literals',
    })
  }

  return hints
}
