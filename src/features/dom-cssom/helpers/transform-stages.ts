import type { GenericPipelineStage, PipelineBadge } from '@shared/types/pipeline'

export function generateDomCssomStages(html: string, css: string): GenericPipelineStage[] {
  return [
    buildBytesStage(html, css),
    buildHtmlTokenizationStage(html),
    buildDomConstructionStage(html),
    buildCssTokenizationStage(css),
    buildCssomConstructionStage(css),
    buildCascadeStage(html, css),
    buildRenderTreeStage(html, css),
  ]
}

// ─── Stage 1: Raw Bytes ───────────────────────────────────────────────────
function buildBytesStage(html: string, css: string): GenericPipelineStage {
  const htmlBytes = new TextEncoder().encode(html.slice(0, 100))
  const hexParts = Array.from(htmlBytes).slice(0, 24).map((b) => b.toString(16).padStart(2, '0'))
  const content = [
    `HTML: ${html.length.toLocaleString()} chars → ${new TextEncoder().encode(html).length.toLocaleString()} bytes (UTF-8)`,
    `CSS:  ${css.length.toLocaleString()} chars → ${new TextEncoder().encode(css).length.toLocaleString()} bytes (UTF-8)`,
    '',
    'First 24 bytes of HTML (hex):',
    hexParts.slice(0, 8).join(' '),
    hexParts.slice(8, 16).join(' '),
    hexParts.slice(16, 24).join(' '),
    '',
    'ASCII decode:',
    `"${html.slice(0, 24).replace(/\n/g, '↵')}"`,
    '',
    'Encoding detection:',
    '  1. BOM (Byte Order Mark): not present',
    '  2. HTTP header: Content-Type: text/html; charset=UTF-8',
    '  3. <meta charset="UTF-8"> (fallback)',
    '  4. Prescan first 1024 bytes',
    '',
    'Result: UTF-8 encoding confirmed',
    'Begin character-by-character feed to tokenizer →',
  ].join('\n')

  return {
    id: 'bytes',
    title: 'Raw Bytes',
    description: 'Network bytes decoded to characters via encoding detection',
    explanation:
      'The browser receives raw bytes and must determine the character encoding before parsing can begin. It checks (in priority order): an explicit BOM, the Content-Type HTTP header, a <meta charset> tag in the first 1024 bytes, and finally falls back to a byte-frequency heuristic. UTF-8 is the universal standard. The decoded character stream is immediately fed into the HTML tokenizer.',
    colorText: 'text-slate-400',
    colorBg: 'bg-slate-400/10',
    colorBorder: 'border-slate-400/30',
    content,
    badges: [{ type: 'info', label: 'UTF-8', detail: 'UTF-8 is the default encoding for HTML5 and covers all Unicode characters' }],
  }
}

// ─── Stage 2: HTML Tokenization ───────────────────────────────────────────
function buildHtmlTokenizationStage(html: string): GenericPipelineStage {
  const tokens = tokenizeHtml(html)
  const content = [
    'HTML5 Tokenizer State Machine',
    '(Per WHATWG HTML Living Standard)',
    '',
    'Token stream:',
    ...tokens,
    '',
    'Parser states encountered:',
    '  Data → Tag Open → Tag Name → Before Attr Name',
    '  Attr Name → Before Attr Value → Attr Value → After Attr',
    '  Data (text) → Tag Open (next tag) → …',
    '',
    'Quirks mode: OFF (DOCTYPE present)',
  ].join('\n')

  return {
    id: 'html-tokenization',
    title: 'HTML Tokenization',
    description: 'State-machine tokenizer → typed token stream',
    explanation:
      'The HTML5 tokenizer is a state machine with 80+ states. It processes characters one at a time, transitioning between states like Data, TagOpen, TagName, BeforeAttributeName etc. It emits typed tokens: DOCTYPE, StartTag (with attribute pairs), Character, Comment, EndTag. The tokenizer handles malformed HTML gracefully — unknown tags become generic elements, missing close tags are inferred.',
    colorText: 'text-amber-400',
    colorBg: 'bg-amber-400/10',
    colorBorder: 'border-amber-400/30',
    content,
    badges: detectHtmlTokenBadges(html),
  }
}

// ─── Stage 3: DOM Construction ────────────────────────────────────────────
function buildDomConstructionStage(html: string): GenericPipelineStage {
  const tree = buildDomTree(html)
  const nodeCount = countNodes(html)

  const content = [
    `DOM Tree (${nodeCount} nodes)`,
    '─────────────────────────────',
    tree,
    '',
    'Node types created:',
    '  Document           — 1',
    `  Element            — ${countTags(html)}`,
    `  Text               — ~${countTextNodes(html)}`,
    `  Comment            — ${(html.match(/<!--/g) ?? []).length}`,
    '',
    'Live properties:',
    '  document.readyState = "loading" → "interactive" → "complete"',
    '  DOMContentLoaded fires when parser finishes',
    '  load event fires when all resources loaded',
    '',
    'Parser stack (open elements):',
    '  [html, body, main, section] — at deepest point',
  ].join('\n')

  return {
    id: 'dom-construction',
    title: 'DOM Construction',
    description: 'Tree constructor builds live DOM from token stream',
    explanation:
      'The tree constructor processes tokens and maintains an "open elements" stack. StartTag pushes, EndTag pops. Foster parenting handles misplaced table content. The DOM is built incrementally — the browser can start rendering before the full document arrives. Parser-blocking scripts (sync <script> tags) halt construction entirely. The DOM exposes a live JS API: any mutation is immediately reflected in the tree.',
    colorText: 'text-emerald-400',
    colorBg: 'bg-emerald-400/10',
    colorBorder: 'border-emerald-400/30',
    content,
    badges: detectDomBadges(html),
  }
}

// ─── Stage 4: CSS Tokenization ────────────────────────────────────────────
function buildCssTokenizationStage(css: string): GenericPipelineStage {
  const tokens = tokenizeCss(css)
  const content = [
    'CSS Tokenizer (CSS Syntax Level 3)',
    '',
    'Token stream:',
    ...tokens.slice(0, 30),
    tokens.length > 30 ? `… +${tokens.length - 30} more tokens` : '',
    '',
    'CSS token types:',
    '  IDENT-TOKEN        — property names, selectors',
    '  DELIM-TOKEN        — . # > + ~ * etc.',
    '  COLON-TOKEN        — property: value separator',
    '  SEMICOLON-TOKEN    — declaration end',
    '  OPEN/CLOSE-CURLY   — rule blocks',
    '  DIMENSION-TOKEN    — 16px, 2rem, 1.6 etc.',
    '  HASH-TOKEN         — #id, #color',
    '  STRING-TOKEN       — "value", \'value\'',
  ].join('\n')

  return {
    id: 'css-tokenization',
    title: 'CSS Tokenization',
    description: 'CSS source → typed token stream (runs in parallel with HTML)',
    explanation:
      'CSS is tokenized separately from HTML, in parallel. The CSS tokenizer (defined in CSS Syntax Level 3) produces tokens: IDENT (identifiers), DELIM (delimiters), COLON, SEMICOLON, OPEN/CLOSE-CURLY, DIMENSION (numbers with units), STRING, HASH, URL, etc. Unlike HTML, malformed CSS is handled by error recovery — unknown properties are ignored, not fatal.',
    colorText: 'text-cyan-400',
    colorBg: 'bg-cyan-400/10',
    colorBorder: 'border-cyan-400/30',
    content,
    badges: [{ type: 'info', label: 'Parallel parsing', detail: 'CSS tokenization runs concurrently with HTML parsing on a separate thread in modern browsers' }],
  }
}

// ─── Stage 5: CSSOM Construction ──────────────────────────────────────────
function buildCssomConstructionStage(css: string): GenericPipelineStage {
  const rules = parseCssRules(css)
  const content = [
    `CSSStyleSheet (${rules.length} rules)`,
    '───────────────────────────────────',
    '',
    ...rules.slice(0, 15).map((r) => {
      const spec = calcSpecificity(r.selector)
      return [
        `CSSStyleRule`,
        `  selector:     "${r.selector}"`,
        `  specificity:  (${spec.ids},${spec.classes},${spec.tags})`,
        `  declarations: {`,
        ...r.props.slice(0, 3).map((p) => `    ${p}`),
        r.props.length > 3 ? `    … +${r.props.length - 3} more` : '',
        '  }',
        '',
      ].filter(Boolean).join('\n')
    }),
    '',
    '+ UA (User-Agent) stylesheet rules',
    '+ Inherited properties resolved per element',
  ].join('\n')

  return {
    id: 'cssom-construction',
    title: 'CSSOM Construction',
    description: 'CSS rules → typed style tree with specificity',
    explanation:
      'The CSSOM is structured as a tree of CSSStyleSheet → CSSRule → CSSStyleDeclaration. Each rule has its selector parsed and its specificity calculated as (a,b,c) — a=ID count, b=class/attribute/pseudo-class count, c=type/element count. The browser also applies the user-agent stylesheet (browser defaults). CSSOM construction is render-blocking — the browser waits for a complete CSSOM before producing the render tree.',
    colorText: 'text-sky-400',
    colorBg: 'bg-sky-400/10',
    colorBorder: 'border-sky-400/30',
    content,
    badges: [
      { type: 'blocking', label: 'Render-blocking', detail: 'CSSOM must be fully built before rendering can begin — even one slow CSS file blocks everything' },
      { type: 'info', label: 'Specificity calculated', detail: 'Each rule\'s (a,b,c) specificity tuple is computed to determine which styles win conflicts' },
    ],
  }
}

// ─── Stage 6: Cascade & Inheritance ──────────────────────────────────────
function buildCascadeStage(html: string, css: string): GenericPipelineStage {
  const elements = extractElementsWithStyles(html, css)
  const content = [
    'Cascade Resolution (per element)',
    '──────────────────────────────────────────────',
    '',
    ...elements.slice(0, 8).map((el) => [
      `<${el.tag}${el.id ? '#' + el.id : ''}${el.cls ? '.' + el.cls : ''}>`,
      ...el.styles.slice(0, 4).map((s) => `  ${s}`),
      '',
    ].join('\n')),
    'Cascade origin priority:',
    '  1. !important user styles',
    '  2. !important author styles',
    '  3. !important UA styles',
    '  4. Author styles   ← most CSS rules',
    '  5. User styles',
    '  6. UA styles       ← browser defaults',
    '',
    'Within same origin → specificity wins',
    'Same specificity → last-declared wins (source order)',
    '',
    'Inheritance:',
    '  Inherited: color, font-*, line-height, visibility, cursor…',
    '  Not inherited: margin, padding, border, background, display…',
  ].join('\n')

  return {
    id: 'cascade',
    title: 'Cascade & Inheritance',
    description: 'Resolve style conflicts per element: origin → specificity → order',
    explanation:
      'The cascade resolves which CSS declaration wins when multiple rules target the same element. Priority: !important > author styles > user-agent styles. Within the same origin, higher specificity wins. For equal specificity, the last declaration in source order wins. Inheritance propagates certain properties (font, color, visibility) from parent to child without explicit declaration.',
    colorText: 'text-violet-400',
    colorBg: 'bg-violet-400/10',
    colorBorder: 'border-violet-400/30',
    content,
    badges: detectCascadeBadges(css),
  }
}

// ─── Stage 7: Render Tree ────────────────────────────────────────────────
function buildRenderTreeStage(html: string, css: string): GenericPipelineStage {
  const renderTree = buildRenderTree(html, css)
  const content = [
    'Render Tree (visible nodes only)',
    '─────────────────────────────────',
    renderTree,
    '',
    'Excluded from render tree:',
    '  ✗ <head> and all children',
    '  ✗ <script>, <style>, <link>, <meta>',
    '  ✗ display:none elements (+ descendants)',
    '  ✗ HTML comments',
    '',
    'Included (even if invisible):',
    '  ✓ visibility:hidden — occupies space',
    '  ✓ opacity:0 — occupies space',
    '',
    'Each node has:',
    '  - Computed style object (final resolved values)',
    '  - Reference to corresponding DOM node',
    '  - Box type (inline, block, flex, grid, table…)',
    '',
    '→ Ready for Layout phase',
  ].join('\n')

  return {
    id: 'render-tree',
    title: 'Render Tree',
    description: 'DOM + CSSOM merged → only visible nodes with computed styles',
    explanation:
      'The render tree is built by walking the DOM top-down and attaching computed styles from the CSSOM. Non-visible nodes are excluded: head, script, meta, display:none elements and their subtrees. Each render tree node (called RenderObject or LayoutObject in Blink) holds its final computed style — all percentages and relative units already resolved to computed values. This tree drives layout.',
    colorText: 'text-fuchsia-400',
    colorBg: 'bg-fuchsia-400/10',
    colorBorder: 'border-fuchsia-400/30',
    content,
    badges: [{ type: 'info', label: 'Computed styles', detail: 'All CSS values are resolved to computed values at this stage — no more relative units in the render tree' }],
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function tokenizeHtml(html: string): string[] {
  const tokens: string[] = []
  const chunks = html.match(/<[^>]+>|[^<]+/g) ?? []
  let count = 0
  for (const chunk of chunks) {
    if (count >= 25) { tokens.push('…'); break }
    const t = chunk.trim()
    if (!t) continue
    if (t.startsWith('<!--')) { tokens.push(`Comment     ${t.slice(0, 40)}`); count++; continue }
    if (t.startsWith('<!DOCTYPE')) { tokens.push('DOCTYPE     html'); count++; continue }
    if (t.startsWith('</')) {
      const name = t.match(/<\/([a-zA-Z][^\s>]*)/)?.[1] ?? '?'
      tokens.push(`EndTag      </${name}>`)
    } else if (t.startsWith('<')) {
      const name = t.match(/<([a-zA-Z][^\s>]*)/)?.[1] ?? '?'
      const hasAttrs = t.includes('=')
      tokens.push(`StartTag    <${name}>${hasAttrs ? '  [attrs]' : ''}`)
    } else {
      const text = t.replace(/\s+/g, ' ').trim().slice(0, 40)
      if (text) tokens.push(`Character   "${text}"`)
    }
    count++
  }
  return tokens
}

function buildDomTree(html: string): string {
  const lines: string[] = ['Document']
  const tags = html.match(/<(?!!)(?!\/)([a-zA-Z][^\s>]*)[^>]*>/g) ?? []
  let depth = 1
  let prev = ''

  for (const tag of tags.slice(0, 28)) {
    const name = tag.match(/<([a-zA-Z][^\s>]*)/)?.[1]?.toLowerCase() ?? ''
    if (!name) continue
    const indent = '  '.repeat(Math.min(depth, 7))
    const idMatch = tag.match(/id=["']([^"']+)["']/)
    const classMatch = tag.match(/class=["']([^"']+)["']/)
    const annotation = [idMatch ? `#${idMatch[1]}` : '', classMatch ? `.${classMatch[1]}` : ''].filter(Boolean).join('')
    lines.push(`${indent}└─ ${name}${annotation ? ' ' + annotation : ''}`)
    const isBlock = ['div', 'section', 'main', 'header', 'footer', 'nav', 'ul', 'ol', 'article', 'body', 'html', 'head'].includes(name)
    if (isBlock && name !== prev) depth = Math.min(depth + 1, 8)
    prev = name
  }
  return lines.join('\n')
}

function countNodes(html: string): number {
  return (html.match(/<[^!/][^>]*>/g) ?? []).length * 2 + 5
}

function countTags(html: string): number {
  return (html.match(/<[^!/][^>]*>/g) ?? []).length
}

function countTextNodes(html: string): number {
  return (html.match(/>([^<\n]{3,})</g) ?? []).length
}

function tokenizeCss(css: string): string[] {
  const tokens: string[] = []
  const rules = css.match(/([^{;]+)(?:[{;][^}]*}?|;?)/g) ?? []
  for (const r of rules.slice(0, 20)) {
    const t = r.trim()
    if (t.includes('{')) {
      const sel = t.split('{')[0].trim()
      tokens.push(`SELECTOR    "${sel}"`)
      tokens.push(`OPEN-CURLY  {`)
    } else if (t.includes(':')) {
      const [prop, val] = t.split(':').map((s) => s.trim())
      if (prop && val) tokens.push(`DECL        ${prop}: ${val.replace(';', '').trim()}`)
    }
  }
  return tokens
}

interface CssRule { selector: string; props: string[] }

function parseCssRules(css: string): CssRule[] {
  const rules: CssRule[] = []
  const ruleRe = /([^{]+)\{([^}]*)\}/g
  let m: RegExpExecArray | null
  while ((m = ruleRe.exec(css))) {
    const selector = m[1].trim()
    const props = m[2].split(';').map((p) => p.trim()).filter(Boolean)
    if (selector && props.length) rules.push({ selector, props })
  }
  return rules
}

function calcSpecificity(selector: string): { ids: number; classes: number; tags: number } {
  return {
    ids: (selector.match(/#\w+/g) ?? []).length,
    classes: (selector.match(/[.:\[]\w+/g) ?? []).length,
    tags: (selector.match(/\b[a-z]+[^(]/g) ?? []).filter((t) => !['and', 'not', 'is', 'has', 'where'].includes(t)).length,
  }
}

interface ElementStyle { tag: string; id: string; cls: string; styles: string[] }

function extractElementsWithStyles(html: string, css: string): ElementStyle[] {
  const elements: ElementStyle[] = []
  const tags = html.match(/<(?!\/)(?!head|script|style|link|meta|html|!)[a-zA-Z][^>]*>/gi) ?? []
  const rules = parseCssRules(css)

  for (const tag of tags.slice(0, 8)) {
    const name = tag.match(/<([a-zA-Z][^\s>]*)/)?.[1]?.toLowerCase() ?? ''
    if (!name || ['html', 'head'].includes(name)) continue
    const id = tag.match(/id=["']([^"']+)["']/)?.[1] ?? ''
    const cls = tag.match(/class=["']([^"']+)["']/)?.[1]?.split(' ')[0] ?? ''

    const matchedStyles: string[] = []
    for (const rule of rules) {
      const sel = rule.selector.trim()
      if (
        sel === name ||
        (id && sel === `#${id}`) ||
        (cls && sel === `.${cls}`) ||
        (id && sel === `${name}#${id}`) ||
        sel === '*'
      ) {
        const spec = calcSpecificity(sel)
        matchedStyles.push(`(${spec.ids},${spec.classes},${spec.tags}) ${sel} → ${rule.props.slice(0, 2).join('; ')}`)
      }
    }
    if (matchedStyles.length || name === 'body' || name === 'html') {
      elements.push({ tag: name, id, cls, styles: matchedStyles.length ? matchedStyles : ['(UA defaults apply)'] })
    }
  }
  return elements
}

function buildRenderTree(html: string, css: string): string {
  const lines: string[] = ['RenderView']
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (!bodyMatch) return 'No <body> found'

  const rules = parseCssRules(css)
  const hiddenClasses = rules.filter((r) => r.props.some((p) => p.includes('display: none') || p.includes('display:none'))).map((r) => r.selector.replace('.', '').trim())

  const tags = bodyMatch[1].match(/<(?!\/)(?!script|style|link|meta)([a-zA-Z][^\s>]*)[^>]*>/gi) ?? []
  lines.push('  └─ RenderBlock <body>')

  for (const tag of tags.slice(0, 15)) {
    const name = tag.match(/<([a-zA-Z][^\s>]*)/)?.[1]?.toLowerCase()
    if (!name || ['script', 'style', 'link', 'meta'].includes(name)) continue
    const cls = tag.match(/class=["']([^"']+)["']/)?.[1]?.split(' ')[0] ?? ''
    const isHidden = hiddenClasses.includes(cls) || tag.includes('display: none') || tag.includes('display:none')
    if (isHidden) {
      lines.push(`       ✗ <${name}>${cls ? '.' + cls : ''} — omitted (display:none)`)
    } else {
      const id = tag.match(/id=["']([^"']+)["']/)?.[1] ?? ''
      lines.push(`       └─ ${getBoxType(name)} <${name}>${id ? '#' + id : ''}${cls ? '.' + cls : ''}`)
    }
  }
  return lines.join('\n')
}

function getBoxType(tag: string): string {
  const inline = ['span', 'a', 'em', 'strong', 'img', 'input', 'button', 'label', 'code', 'b', 'i']
  if (inline.includes(tag)) return 'RenderInline'
  return 'RenderBlock '
}

function detectHtmlTokenBadges(html: string): PipelineBadge[] {
  const badges: PipelineBadge[] = []
  if (html.includes('<!DOCTYPE')) badges.push({ type: 'optimization', label: 'Standards mode', detail: 'DOCTYPE triggers HTML5 standards mode parsing (not quirks mode)' })
  if (html.match(/<script(?![^>]*(async|defer))[^>]*src/i)) badges.push({ type: 'blocking', label: 'Parser-blocking script', detail: 'Sync <script> tags halt tokenization until script loads and executes' })
  return badges
}

function detectDomBadges(html: string): PipelineBadge[] {
  const badges: PipelineBadge[] = []
  const depth = estimateMaxDepth(html)
  if (depth > 8) badges.push({ type: 'warning', label: `Deep nesting (${depth}+)`, detail: 'Deep DOM trees slow layout and increase memory usage' })
  badges.push({ type: 'info', label: 'Incremental build', detail: 'DOM is built incrementally — browser renders partial content as bytes arrive' })
  return badges
}

function estimateMaxDepth(html: string): number {
  let depth = 0; let max = 0
  for (const ch of html) {
    if (ch === '<') depth++
    else if (ch === '>') { max = Math.max(max, depth); if (depth > 0) depth-- }
  }
  return max
}

function detectCascadeBadges(css: string): PipelineBadge[] {
  const badges: PipelineBadge[] = []
  if (css.includes('!important')) badges.push({ type: 'warning', label: '!important used', detail: '!important overrides specificity and is hard to override — use sparingly' })
  const rules = parseCssRules(css)
  const highSpec = rules.filter((r) => calcSpecificity(r.selector).ids > 0)
  if (highSpec.length > 0) badges.push({ type: 'info', label: 'ID selectors', detail: 'ID selectors (specificity 1,0,0) can be hard to override — prefer classes' })
  return badges
}
