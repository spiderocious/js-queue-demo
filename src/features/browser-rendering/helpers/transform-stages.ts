import type { GenericPipelineStage, PipelineBadge } from '@shared/types/pipeline'

export function generateRenderingStages(html: string): GenericPipelineStage[] {
  return [
    buildHtmlSourceStage(html),
    buildTokenizationStage(html),
    buildDomTreeStage(html),
    buildCssomStage(html),
    buildRenderTreeStage(html),
    buildLayoutStage(html),
    buildPaintStage(html),
    buildCompositingStage(html),
  ]
}

// ─── Stage 1: HTML Source ──────────────────────────────────────────────────
function buildHtmlSourceStage(html: string): GenericPipelineStage {
  return {
    id: 'html-source',
    title: 'HTML Source',
    description: 'Raw bytes received from network',
    explanation:
      'The browser receives raw UTF-8 (or UTF-16) bytes over the network. Before anything can be displayed, these bytes must be decoded into characters and then parsed into a structured document. This is the very start of the Critical Rendering Path (CRP).',
    colorText: 'text-indigo-400',
    colorBg: 'bg-indigo-400/10',
    colorBorder: 'border-indigo-400/30',
    content: html.trim(),
    badges: detectSourceBadges(html),
  }
}

// ─── Stage 2: Tokenization ────────────────────────────────────────────────
function buildTokenizationStage(html: string): GenericPipelineStage {
  const tokens = tokenizeHtml(html)
  return {
    id: 'tokenization',
    title: 'Tokenization',
    description: 'HTML tokenizer converts bytes → token stream',
    explanation:
      'The HTML parser uses a state machine defined by the HTML5 spec. It scans the character stream and emits typed tokens: DOCTYPE, StartTag (with attribute key/value pairs), Character (text nodes), Comment, and EndTag. This is NOT a simple regex — it handles malformed HTML, optional closing tags, and quirks mode.',
    colorText: 'text-amber-400',
    colorBg: 'bg-amber-400/10',
    colorBorder: 'border-amber-400/30',
    content: tokens.join('\n'),
    badges: detectTokenizationBadges(html),
  }
}

// ─── Stage 3: DOM Tree ────────────────────────────────────────────────────
function buildDomTreeStage(html: string): GenericPipelineStage {
  const tree = buildDomTreeText(html)
  return {
    id: 'dom-tree',
    title: 'DOM Construction',
    description: 'Token stream → DOM tree (in-order, incremental)',
    explanation:
      'The tree constructor takes tokens and builds the Document Object Model. Nodes are created and linked incrementally — the browser does NOT wait for the full HTML before starting. Parser-blocking resources (sync <script> tags) pause DOM construction entirely. Async/defer scripts do not block. The DOM is also a live API — JS can mutate it at any time.',
    colorText: 'text-emerald-400',
    colorBg: 'bg-emerald-400/10',
    colorBorder: 'border-emerald-400/30',
    content: tree,
    badges: detectDomBadges(html),
  }
}

// ─── Stage 4: CSSOM ──────────────────────────────────────────────────────
function buildCssomStage(html: string): GenericPipelineStage {
  const cssom = buildCssomText(html)
  return {
    id: 'cssom',
    title: 'CSSOM Construction',
    description: 'CSS → typed style rules with specificity',
    explanation:
      'Whenever the parser encounters a <link rel="stylesheet"> or <style> tag, it fetches/parses CSS and builds the CSS Object Model. CSSOM construction is render-blocking — the browser will not render anything until it has a complete CSSOM (to avoid a flash of unstyled content). Specificity is calculated per rule. Inheritance and the cascade are resolved here.',
    colorText: 'text-cyan-400',
    colorBg: 'bg-cyan-400/10',
    colorBorder: 'border-cyan-400/30',
    content: cssom,
    badges: detectCssomBadges(html),
  }
}

// ─── Stage 5: Render Tree ────────────────────────────────────────────────
function buildRenderTreeStage(html: string): GenericPipelineStage {
  const renderTree = buildRenderTreeText(html)
  return {
    id: 'render-tree',
    title: 'Render Tree',
    description: 'DOM + CSSOM merged → only visible nodes',
    explanation:
      'The render tree combines the DOM and CSSOM. Only visible nodes make it in — <head>, <script>, <meta> are excluded, as are elements with display:none. Elements with visibility:hidden are included (they occupy space but are invisible). Each render tree node (called a "render object" or "layout object") holds its computed CSS styles.',
    colorText: 'text-violet-400',
    colorBg: 'bg-violet-400/10',
    colorBorder: 'border-violet-400/30',
    content: renderTree,
    badges: detectRenderTreeBadges(html),
  }
}

// ─── Stage 6: Layout / Reflow ─────────────────────────────────────────────
function buildLayoutStage(html: string): GenericPipelineStage {
  const layout = buildLayoutText(html)
  return {
    id: 'layout',
    title: 'Layout (Reflow)',
    description: 'Compute exact position & size of every element',
    explanation:
      'Layout (also called reflow) computes the exact pixel position and size of every render object. It starts from the root and flows down. Percentages, auto widths, flexbox/grid, and relative units are all resolved here into absolute pixels. Layout is expensive — reading certain DOM properties (offsetWidth, getBoundingClientRect) from JS forces a synchronous layout called "forced reflow", which can cause jank.',
    colorText: 'text-orange-400',
    colorBg: 'bg-orange-400/10',
    colorBorder: 'border-orange-400/30',
    content: layout,
    badges: detectLayoutBadges(html),
  }
}

// ─── Stage 7: Paint ──────────────────────────────────────────────────────
function buildPaintStage(html: string): GenericPipelineStage {
  const paint = buildPaintText(html)
  return {
    id: 'paint',
    title: 'Paint',
    description: 'Convert layout boxes → draw commands per layer',
    explanation:
      'The paint stage converts each layout object into a series of draw calls (fill rect, draw text, draw image, draw border, draw shadow). These are recorded into a display list. The browser paints in stacking context order (z-index layers). Some elements get their own compositor layer — promoted by will-change: transform, transform: translateZ(0), or opacity animations. Painting to a layer is cheap; compositing layers together is even cheaper.',
    colorText: 'text-rose-400',
    colorBg: 'bg-rose-400/10',
    colorBorder: 'border-rose-400/30',
    content: paint,
    badges: detectPaintBadges(html),
  }
}

// ─── Stage 8: Compositing ────────────────────────────────────────────────
function buildCompositingStage(html: string): GenericPipelineStage {
  const composite = buildCompositingText(html)
  return {
    id: 'compositing',
    title: 'Compositing',
    description: 'GPU assembles layers → final pixels on screen',
    explanation:
      'The compositor thread takes the painted layers (bitmaps), uploads them to the GPU as textures, and composites them together in the correct order. This happens on the GPU — completely off the main thread. This is why transform and opacity animations are "cheap": they only trigger compositing, not layout or paint. The final result is handed to the OS display system and shown on screen.',
    colorText: 'text-teal-400',
    colorBg: 'bg-teal-400/10',
    colorBorder: 'border-teal-400/30',
    content: composite,
    badges: detectCompositingBadges(html),
  }
}

// ─── Tokenizer ────────────────────────────────────────────────────────────
function tokenizeHtml(html: string): string[] {
  const tokens: string[] = []
  const doctypeMatch = html.match(/<!DOCTYPE[^>]*>/i)
  if (doctypeMatch) tokens.push(`DOCTYPE       html`)

  const tagMatches = html.match(/<\/?[a-zA-Z][^>]*>|[^<]+/g) ?? []
  let count = 0
  for (const chunk of tagMatches) {
    if (count > 35) { tokens.push('…'); break }
    const t = chunk.trim()
    if (!t) continue
    if (t.startsWith('<!--')) {
      tokens.push(`Comment       ${t.slice(0, 40)}`)
    } else if (t.startsWith('</')) {
      const tag = t.match(/<\/([a-zA-Z][^\s>]*)/)?.[1] ?? '?'
      tokens.push(`EndTag        </${tag}>`)
    } else if (t.startsWith('<')) {
      const tag = t.match(/<([a-zA-Z][^\s>]*)/)?.[1] ?? '?'
      const attrs: string[] = []
      const attrRe = /(\w[\w-]*)(?:=["']([^"']*)["'])?/g
      let m: RegExpExecArray | null
      let ac = 0
      while ((m = attrRe.exec(t.slice(tag.length + 1))) && ac < 3) {
        if (m[1] === tag) continue
        attrs.push(m[2] !== undefined ? `${m[1]}="${m[2]}"` : m[1])
        ac++
      }
      tokens.push(`StartTag      <${tag}>${attrs.length ? '  attrs: [' + attrs.join(', ') + ']' : ''}`)
    } else {
      const text = t.slice(0, 50).replace(/\s+/g, ' ')
      if (text.trim()) tokens.push(`Character     "${text.trim()}"`)
    }
    count++
  }
  return tokens
}

// ─── DOM Tree builder ─────────────────────────────────────────────────────
function buildDomTreeText(html: string): string {
  const lines: string[] = ['Document']
  const tags = html.match(/<(?!!)(?!\/)([a-zA-Z][^\s>]*)[^>]*>/g) ?? []
  const seen = new Set<string>()
  let depth = 1

  for (const tag of tags.slice(0, 25)) {
    const name = tag.match(/<([a-zA-Z][^\s>]*)/)?.[1]?.toLowerCase()
    if (!name) continue
    const key = `${depth}-${name}`
    if (seen.has(key)) { depth++; seen.clear() }
    seen.add(key)
    const indent = '  '.repeat(Math.min(depth, 6))
    const idMatch = tag.match(/id=["']([^"']+)["']/)
    const classMatch = tag.match(/class=["']([^"']+)["']/)
    const attrs = [idMatch ? `#${idMatch[1]}` : '', classMatch ? `.${classMatch[1].split(' ')[0]}` : ''].filter(Boolean).join('')
    lines.push(`${indent}└─ <${name}>${attrs ? ' ' + attrs : ''}`)

    if (['head', 'body', 'div', 'main', 'section', 'nav', 'article', 'ul', 'ol', 'table'].includes(name)) {
      depth = Math.min(depth + 1, 7)
    }
  }
  return lines.join('\n')
}

// ─── CSSOM builder ────────────────────────────────────────────────────────
function buildCssomText(html: string): string {
  const lines: string[] = ['CSSStyleSheet']
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i)

  if (styleMatch) {
    const css = styleMatch[1]
    const rules = css.match(/([^{]+)\{([^}]+)\}/g) ?? []
    for (const rule of rules.slice(0, 12)) {
      const selectorMatch = rule.match(/([^{]+)/)
      const propsMatch = rule.match(/\{([^}]+)\}/)
      if (!selectorMatch || !propsMatch) continue
      const selector = selectorMatch[1].trim()
      const specificity = calcSpecificity(selector)
      lines.push(`  Rule (specificity: ${specificity})`)
      lines.push(`    selector: "${selector}"`)
      const props = propsMatch[1].trim().split(';').filter(Boolean)
      for (const p of props.slice(0, 4)) {
        const [prop, val] = p.split(':').map((s) => s.trim())
        if (prop && val) lines.push(`    ${prop}: ${val}`)
      }
    }
  } else {
    lines.push('  (no <style> tag found — browser fetches external CSS)')
    lines.push('  Rule { selector: "body", font-family: system-ui }  ← UA stylesheet')
    lines.push('  Rule { selector: "h1",   display: block }          ← UA stylesheet')
    lines.push('  Rule { selector: "div",  display: block }          ← UA stylesheet')
  }

  lines.push('')
  lines.push('  + User-Agent stylesheet (browser defaults)')
  return lines.join('\n')
}

function calcSpecificity(selector: string): string {
  const ids = (selector.match(/#/g) ?? []).length
  const classes = (selector.match(/\.|:/g) ?? []).length
  const tags = (selector.match(/\b[a-z]+/g) ?? []).length
  return `(${ids},${classes},${tags})`
}

// ─── Render Tree builder ──────────────────────────────────────────────────
function buildRenderTreeText(html: string): string {
  const lines: string[] = ['RenderView (root)']
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (!bodyMatch) {
    lines.push('  (no <body> found)')
    return lines.join('\n')
  }

  const body = bodyMatch[1]
  const visibleTags = body.match(/<(?!\/)(?!script|style|meta|link|noscript)([a-zA-Z][^\s>]*)[^>]*>/gi) ?? []
  const hiddenPatterns = /display\s*:\s*none|visibility\s*:\s*hidden/i

  lines.push('  └─ RenderBlock <body>')
  for (const tag of visibleTags.slice(0, 15)) {
    const name = tag.match(/<([a-zA-Z][^\s>]*)/)?.[1]?.toLowerCase()
    if (!name || ['script', 'style', 'link', 'meta'].includes(name)) continue
    const isHidden = hiddenPatterns.test(tag)
    const idMatch = tag.match(/id=["']([^"']+)["']/)
    const classMatch = tag.match(/class=["']([^"']+)["']/)
    const label = `${idMatch ? '#' + idMatch[1] : ''}${classMatch ? '.' + classMatch[1].split(' ')[0] : ''}`
    if (isHidden) {
      lines.push(`       ✗ <${name}>${label ? ' ' + label : ''} — excluded (display:none)`)
    } else {
      const boxType = getBoxType(name)
      lines.push(`       └─ ${boxType} <${name}>${label ? ' ' + label : ''}`)
    }
  }
  return lines.join('\n')
}

function getBoxType(tag: string): string {
  const inline = ['span', 'a', 'em', 'strong', 'img', 'input', 'button', 'label', 'code']
  const block = ['div', 'p', 'h1', 'h2', 'h3', 'section', 'article', 'main', 'nav', 'ul', 'ol', 'li', 'form']
  if (inline.includes(tag)) return 'RenderInline'
  if (block.includes(tag)) return 'RenderBlock'
  return 'RenderObject'
}

// ─── Layout builder ───────────────────────────────────────────────────────
function buildLayoutText(html: string): string {
  const lines: string[] = ['Layout Tree (computed geometry)']
  lines.push('')
  lines.push('Element                  x      y      width    height')
  lines.push('─────────────────────────────────────────────────────')

  const tags = html.match(/<(?!\/)(?!head|script|style|link|meta|html|!)[a-zA-Z][^\s>]*[^>]*>/gi) ?? []
  const seen = new Set<string>()
  let y = 0

  for (const tag of tags.slice(0, 12)) {
    const name = tag.match(/<([a-zA-Z][^\s>]*)/)?.[1]?.toLowerCase()
    if (!name || ['html', 'head', 'body', 'script', 'style', 'link', 'meta', 'title'].includes(name)) continue
    if (seen.has(name)) continue
    seen.add(name)

    const widthAttr = tag.match(/width=["']?(\d+)["']?/)?.[1]
    const heightAttr = tag.match(/height=["']?(\d+)["']?/)?.[1]
    const w = widthAttr ?? estimateWidth(name)
    const h = heightAttr ?? estimateHeight(name)
    const x = isInlineTag(name) ? 24 : 0
    lines.push(`<${name.padEnd(22)}> ${String(x).padStart(5)}px ${String(y).padStart(5)}px ${String(w).padStart(6)}px ${String(h).padStart(6)}px`)
    if (!isInlineTag(name)) y += parseInt(h)
  }

  lines.push('')
  lines.push('Note: percentages, auto, flex/grid resolved to absolute px')
  return lines.join('\n')
}

function estimateWidth(tag: string): string {
  const widths: Record<string, string> = { h1: '760', h2: '760', p: '760', div: '760', button: '120', img: '400', span: '80', a: '60' }
  return widths[tag] ?? '760'
}

function estimateHeight(tag: string): string {
  const heights: Record<string, string> = { h1: '48', h2: '36', p: '24', div: '200', button: '36', img: '300', span: '20', a: '20' }
  return heights[tag] ?? '20'
}

function isInlineTag(tag: string): boolean {
  return ['span', 'a', 'em', 'strong', 'button', 'label', 'code', 'img'].includes(tag)
}

// ─── Paint builder ────────────────────────────────────────────────────────
function buildPaintText(html: string): string {
  const lines: string[] = ['Paint display list (stacking order)']
  lines.push('')
  lines.push('Layer 0 — Root (main document layer)')
  lines.push('  [drawColor]    fill viewport #f5f5f5')
  lines.push('  [drawRect]     body: (0,0,1440,900) fill=#f5f5f5')

  if (html.includes('background') || html.includes('.card')) {
    lines.push('')
    lines.push('  [drawRect]     .container: (320,0,800,900)')
  }

  const textTags = html.match(/<(h[1-6]|p|button|a|span|li)[^>]*>([^<]{1,60})</g) ?? []
  for (const m of textTags.slice(0, 5)) {
    const textMatch = m.match(/>([^<]+)</)
    if (textMatch && textMatch[1].trim()) {
      lines.push(`  [drawText]     "${textMatch[1].trim().slice(0, 40)}"`)
    }
  }

  if (html.includes('<img')) {
    lines.push('  [drawImage]    <img> — decode + blit bitmap')
  }
  if (html.includes('box-shadow') || html.includes('.card')) {
    lines.push('  [drawShadow]   box-shadow on .card')
  }

  lines.push('')
  lines.push('Layer 1 — Composited (will-change / transform3d)')
  lines.push('  [drawRect]     <h1> promoted — own GPU layer')
  lines.push('  [drawText]     text on GPU layer')

  lines.push('')
  lines.push('Tip: transform/opacity only → skips paint → compositor layer only')
  return lines.join('\n')
}

// ─── Compositing builder ──────────────────────────────────────────────────
function buildCompositingText(html: string): string {
  const lines: string[] = ['Compositor thread (off main thread)']
  lines.push('')

  const hasWillChange = html.includes('will-change')
  const hasTranslateZ = html.includes('translateZ') || html.includes('translate3d')
  const hasImg = html.includes('<img')

  lines.push('GPU Layers:')
  lines.push('  Layer 0 (root)           → DocumentLayer  — z:0')
  if (hasWillChange || hasTranslateZ) {
    lines.push('  Layer 1 (h1#title)       → CompositedLayer — z:1  ← will-change:transform')
  }
  if (hasImg) {
    lines.push('  Layer 2 (img)            → ImageLayer — decoded texture uploaded to GPU')
  }
  lines.push('')
  lines.push('Composite steps:')
  lines.push('  1. Rasterize each layer → bitmap (can be threaded)')
  lines.push('  2. Upload bitmaps to GPU as textures')
  lines.push('  3. GPU composites in correct z-order')
  lines.push('  4. Hand off to OS display system (swap buffer)')
  lines.push('  5. Monitor displays at next VSync (~16.67ms @ 60fps)')
  lines.push('')
  lines.push('Cheap animations (compositor only):')
  lines.push('  ✓ transform: translate/scale/rotate')
  lines.push('  ✓ opacity')
  lines.push('Expensive (triggers layout/paint):')
  lines.push('  ✗ width, height, top, left, margin, font-size…')
  return lines.join('\n')
}

// ─── Badge detectors ──────────────────────────────────────────────────────
function detectSourceBadges(html: string): PipelineBadge[] {
  const badges: PipelineBadge[] = []
  const linkCount = (html.match(/<link/gi) ?? []).length
  const scriptCount = (html.match(/<script/gi) ?? []).length
  const styleCount = (html.match(/<style/gi) ?? []).length
  if (linkCount > 0) badges.push({ type: 'blocking', label: `${linkCount} CSS link(s)`, detail: '<link rel="stylesheet"> is render-blocking — browser waits for CSSOM before rendering' })
  if (scriptCount > 0 && !html.includes('async') && !html.includes('defer')) badges.push({ type: 'blocking', label: `${scriptCount} sync script(s)`, detail: 'Synchronous <script> tags block HTML parsing entirely until the script loads and executes' })
  if (styleCount > 0) badges.push({ type: 'info', label: `${styleCount} <style> block(s)`, detail: 'Inline styles are parsed immediately without a network request' })
  return badges
}

function detectTokenizationBadges(html: string): PipelineBadge[] {
  const badges: PipelineBadge[] = []
  if (html.includes('<!--')) badges.push({ type: 'info', label: 'Comments found', detail: 'HTML comments are tokenized but produce no DOM nodes' })
  if (html.includes('<!DOCTYPE')) badges.push({ type: 'optimization', label: 'DOCTYPE present', detail: 'DOCTYPE declaration triggers standards mode parsing (not quirks mode)' })
  return badges
}

function detectDomBadges(html: string): PipelineBadge[] {
  const badges: PipelineBadge[] = []
  if (html.match(/<script(?![^>]*(?:async|defer))[^>]*src/i)) badges.push({ type: 'blocking', label: 'Parser-blocking script', detail: 'A <script src="..."> without async/defer blocks DOM construction until script loads + executes' })
  if (html.includes('async') || html.includes('defer')) badges.push({ type: 'optimization', label: 'async/defer used', detail: 'Scripts with async or defer do not block the HTML parser' })
  return badges
}

function detectCssomBadges(html: string): PipelineBadge[] {
  const badges: PipelineBadge[] = []
  badges.push({ type: 'blocking', label: 'Render-blocking', detail: 'CSSOM construction is always render-blocking — the browser will not paint until CSSOM is complete' })
  if (html.includes('will-change') || html.includes('transform')) badges.push({ type: 'optimization', label: 'GPU hint found', detail: 'will-change or transform properties signal the browser to promote elements to compositor layers' })
  if (html.includes('display: none') || html.includes('display:none')) badges.push({ type: 'info', label: 'display:none found', detail: 'Elements with display:none are in the CSSOM but excluded from the render tree' })
  return badges
}

function detectRenderTreeBadges(html: string): PipelineBadge[] {
  const badges: PipelineBadge[] = []
  if (html.includes('display: none') || html.includes('display:none') || html.includes('class="hidden')) badges.push({ type: 'info', label: 'Elements excluded', detail: 'display:none elements are in the DOM but omitted from the render tree — they consume no layout space' })
  return badges
}

function detectLayoutBadges(html: string): PipelineBadge[] {
  const badges: PipelineBadge[] = []
  if (html.includes('getBoundingClientRect') || html.includes('offsetWidth')) badges.push({ type: 'warning', label: 'Forced reflow risk', detail: 'Reading layout properties (offsetWidth, getBoundingClientRect) from JS forces synchronous layout — can cause jank' })
  if (html.includes('flex') || html.includes('grid')) badges.push({ type: 'info', label: 'Flex/Grid layout', detail: 'Flexbox/Grid layout algorithms run during this phase' })
  return badges
}

function detectPaintBadges(html: string): PipelineBadge[] {
  const badges: PipelineBadge[] = []
  if (html.includes('will-change') || html.includes('translateZ')) badges.push({ type: 'optimization', label: 'Layer promoted', detail: 'Elements with will-change:transform get their own compositor layer, painted independently' })
  if (html.includes('box-shadow') || html.includes('border-radius')) badges.push({ type: 'warning', label: 'Expensive paint', detail: 'box-shadow and border-radius add significant paint cost — avoid animating these' })
  return badges
}

function detectCompositingBadges(html: string): PipelineBadge[] {
  const badges: PipelineBadge[] = []
  const layerCount = (html.match(/will-change|translateZ|translate3d/g) ?? []).length + 1
  badges.push({ type: 'optimization', label: `~${layerCount} GPU layer(s)`, detail: 'Each compositor layer is a separate GPU texture, composited off the main thread' })
  if (html.includes('<img')) badges.push({ type: 'info', label: 'Image decode', detail: 'Images are decoded and uploaded to GPU memory as textures' })
  return badges
}
