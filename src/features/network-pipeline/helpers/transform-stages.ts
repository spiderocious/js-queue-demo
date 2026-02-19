import type { GenericPipelineStage, PipelineBadge } from '@shared/types/pipeline'

export function generateNetworkStages(url: string): GenericPipelineStage[] {
  const parsed = safeParseUrl(url)
  return [
    buildUrlParsingStage(url, parsed),
    buildCacheCheckStage(url, parsed),
    buildDnsStage(parsed),
    buildTcpStage(parsed),
    buildTlsStage(parsed),
    buildHttpRequestStage(url, parsed),
    buildServerProcessingStage(parsed),
    buildHttpResponseStage(parsed),
    buildBrowserProcessingStage(parsed),
  ]
}

interface ParsedUrl {
  scheme: string
  host: string
  path: string
  query: string
  fragment: string
  port: string
  isHttps: boolean
  isValid: boolean
}

function safeParseUrl(url: string): ParsedUrl {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    return {
      scheme: u.protocol.replace(':', ''),
      host: u.hostname,
      path: u.pathname,
      query: u.search,
      fragment: u.hash,
      port: u.port || (u.protocol === 'https:' ? '443' : '80'),
      isHttps: u.protocol === 'https:',
      isValid: true,
    }
  } catch {
    return { scheme: 'https', host: url, path: '/', query: '', fragment: '', port: '443', isHttps: true, isValid: false }
  }
}

// ─── Stage 1: URL Parsing ─────────────────────────────────────────────────
function buildUrlParsingStage(url: string, p: ParsedUrl): GenericPipelineStage {
  const content = [
    `Input URL: ${url}`,
    '',
    'Parsed components:',
    `  Scheme:    ${p.scheme}`,
    `  Host:      ${p.host}`,
    `  Port:      ${p.port} (${p.isHttps ? 'HTTPS default' : 'HTTP default'})`,
    `  Path:      ${p.path || '/'}`,
    `  Query:     ${p.query || '(none)'}`,
    `  Fragment:  ${p.fragment || '(none) — never sent to server'}`,
    '',
    'Checks:',
    `  Protocol allowed?  ${['http', 'https', 'ftp'].includes(p.scheme) ? '✓ yes' : '✗ blocked'}`,
    `  HSTS preloaded?    ${p.isHttps ? '✓ yes — upgrade enforced' : '✗ no — plain HTTP'}`,
    `  Safe URL chars?    ✓ (percent-encoded if needed)`,
    `  Punycode needed?   ${/[^\x00-\x7F]/.test(p.host) ? '✓ IDN hostname → punycode' : '✗ ASCII hostname, no conversion'}`,
  ].join('\n')

  return {
    id: 'url-parsing',
    title: 'URL Parsing',
    description: 'Decompose URL into scheme, host, path, query, fragment',
    explanation:
      'The browser parses the URL per RFC 3986. The fragment (#) is never sent to the server — it\'s handled entirely client-side. The host must be resolved to an IP address via DNS. If the URL uses a non-ASCII hostname (IDN), it\'s converted to Punycode before DNS lookup. The browser also checks HSTS (HTTP Strict Transport Security) lists to upgrade HTTP to HTTPS.',
    colorText: 'text-sky-400',
    colorBg: 'bg-sky-400/10',
    colorBorder: 'border-sky-400/30',
    content,
    badges: detectUrlBadges(p),
  }
}

// ─── Stage 2: Cache Check ─────────────────────────────────────────────────
function buildCacheCheckStage(_url: string, p: ParsedUrl): GenericPipelineStage {
  const content = [
    'Browser cache lookup order:',
    '',
    '1. Service Worker Cache (if registered)',
    `   → intercept fetch? No SW registered for ${p.host}`,
    '',
    '2. Memory Cache (in-process RAM)',
    '   → hit? No (first visit)',
    '',
    '3. Disk Cache (HTTP cache)',
    '   → hit? No (first visit)',
    '   Cache-Control: no-cache → must revalidate',
    '',
    '4. Push Cache (HTTP/2 server push, per-session)',
    '   → hit? No',
    '',
    'Result: CACHE MISS → proceed to DNS',
    '',
    'On subsequent visits:',
    '  Cache-Control: max-age=3600 → serve from disk cache',
    '  ETag / Last-Modified → conditional GET (304 Not Modified)',
  ].join('\n')

  return {
    id: 'cache-check',
    title: 'Cache Check',
    description: 'Service Worker → Memory → Disk → Push cache',
    explanation:
      'Before making any network request the browser checks its multi-layered cache. A Service Worker can intercept any request and return a cached response. The memory cache stores recently used resources in RAM (fast, but cleared on tab close). The disk cache persists across sessions and respects Cache-Control headers. A 304 Not Modified response revalidates with a conditional request, saving bandwidth.',
    colorText: 'text-lime-400',
    colorBg: 'bg-lime-400/10',
    colorBorder: 'border-lime-400/30',
    content,
    badges: [{ type: 'info', label: 'Cache MISS', detail: 'First visit — all cache layers empty, full DNS + TCP + HTTP required' }],
  }
}

// ─── Stage 3: DNS Resolution ──────────────────────────────────────────────
function buildDnsStage(p: ParsedUrl): GenericPipelineStage {
  const parts = p.host.split('.')
  const tld = parts[parts.length - 1]
  const sld = parts.length >= 2 ? parts[parts.length - 2] : ''

  const content = [
    `Resolving: ${p.host}`,
    '',
    '① OS DNS cache check',
    `   → MISS — TTL expired or first visit`,
    '',
    '② Recursive Resolver (ISP / 8.8.8.8 / 1.1.1.1)',
    `   → Not cached locally, querying root servers…`,
    '',
    '③ Root Name Servers (13 clusters, anycast)',
    `   → Query: "Who handles .${tld}?"`,
    `   ← Referral: TLD nameservers for .${tld}`,
    '',
    `④ TLD Name Servers (.${tld})`,
    `   → Query: "Who handles ${sld}.${tld}?"`,
    `   ← Referral: Authoritative nameservers for ${p.host}`,
    '',
    `⑤ Authoritative Name Server (${sld}.${tld})`,
    `   → Query: "What is the A/AAAA record for ${p.host}?"`,
    `   ← Answer: A record = 93.184.216.34  (TTL: 3600s)`,
    '',
    `Result: ${p.host} → 93.184.216.34`,
    `Cached by resolver for TTL=3600s (~1 hour)`,
    '',
    'Parallel: AAAA record for IPv6 also queried',
    'DNS-over-HTTPS (DoH) encrypts this lookup',
  ].join('\n')

  return {
    id: 'dns',
    title: 'DNS Resolution',
    description: 'Hostname → IP via recursive resolver + nameserver chain',
    explanation:
      'DNS is a distributed hierarchical database. The browser first checks its own cache, then the OS cache (/etc/hosts, systemd-resolved), then queries a recursive resolver (ISP or public like 8.8.8.8). The resolver walks the delegation chain: root servers (.) → TLD servers (.com) → authoritative servers for the domain. The resolved IP is cached at each level for the TTL duration. Modern browsers support DNS-over-HTTPS to encrypt lookups.',
    colorText: 'text-amber-400',
    colorBg: 'bg-amber-400/10',
    colorBorder: 'border-amber-400/30',
    content,
    badges: [
      { type: 'info', label: '4 roundtrips', detail: 'A cold DNS lookup can require 4 network roundtrips: recursive resolver + root + TLD + authoritative' },
      { type: 'optimization', label: 'DNS prefetch', detail: '<link rel="dns-prefetch" href="//example.com"> resolves DNS before the resource is needed' },
    ],
  }
}

// ─── Stage 4: TCP Handshake ───────────────────────────────────────────────
function buildTcpStage(p: ParsedUrl): GenericPipelineStage {
  const content = [
    `Connecting: ${p.host}:${p.port}`,
    '',
    'TCP 3-Way Handshake:',
    '',
    '  Client                              Server',
    '    │                                   │',
    '    │──── SYN ──────────────────────────▶│  seq=1000',
    '    │                                   │  (RTT start)',
    '    │◀─── SYN-ACK ───────────────────────│  seq=8000, ack=1001',
    '    │                                   │',
    '    │──── ACK ──────────────────────────▶│  ack=8001',
    '    │                                   │  (connection OPEN)',
    '',
    'Timing: 1 full RTT (round-trip time)',
    'Typical RTT: 10-200ms depending on geography',
    '',
    'After handshake:',
    '  TCP slow start: initial congestion window = 10 MSS',
    '  MSS (Max Segment Size): ~1460 bytes per segment',
    '  Sliding window: up to cwnd segments in-flight',
    '',
    `Connection reuse: ${p.isHttps ? 'HTTP/2 multiplexing — 1 TCP connection for all requests' : 'HTTP/1.1 keep-alive reuses this connection'}`,
  ].join('\n')

  return {
    id: 'tcp',
    title: 'TCP Handshake',
    description: '3-way handshake establishes reliable connection',
    explanation:
      'TCP provides reliable, ordered, error-checked delivery. The 3-way handshake (SYN → SYN-ACK → ACK) takes exactly 1 RTT before any data can be sent. TCP also uses slow start — beginning conservatively and ramping up throughput, which is why initial page loads can feel slow even on fast connections. HTTP/2 multiplexes multiple streams over a single TCP connection, avoiding head-of-line blocking at the HTTP layer.',
    colorText: 'text-blue-400',
    colorBg: 'bg-blue-400/10',
    colorBorder: 'border-blue-400/30',
    content,
    badges: [
      { type: 'info', label: '1 RTT overhead', detail: 'TCP handshake adds 1 full round-trip time before any data flows' },
      { type: 'optimization', label: 'TCP Fast Open', detail: 'TFO can send data on the SYN packet for repeat connections, saving 1 RTT' },
    ],
  }
}

// ─── Stage 5: TLS Handshake ───────────────────────────────────────────────
function buildTlsStage(p: ParsedUrl): GenericPipelineStage {
  if (!p.isHttps) {
    return {
      id: 'tls',
      title: 'TLS Handshake',
      description: 'Not applicable — HTTP (unencrypted)',
      explanation: 'This URL uses plain HTTP — no TLS. The browser may show a "Not Secure" warning. HTTPS should be used for all sites, especially those with user data.',
      colorText: 'text-purple-400',
      colorBg: 'bg-purple-400/10',
      colorBorder: 'border-purple-400/30',
      content: '⚠ Plain HTTP — no encryption\n\nConsider upgrading to HTTPS:\n  - Free certs: Let\'s Encrypt\n  - HTTP → HTTPS redirect\n  - HSTS header to enforce',
      badges: [{ type: 'warning', label: 'No TLS', detail: 'Connection is unencrypted — data is visible to anyone on the network path' }],
    }
  }

  const content = [
    'TLS 1.3 Handshake (1 RTT):',
    '',
    '  Client                              Server',
    '    │                                   │',
    '    │── ClientHello ─────────────────────▶│',
    '    │   supported TLS versions: [1.3, 1.2]│',
    '    │   cipher suites: [AES_256_GCM...]   │',
    '    │   key_share: [X25519 public key]    │',
    '    │                                   │',
    '    │◀─ ServerHello ─────────────────────│',
    '    │   selected: TLS_AES_256_GCM_SHA384  │',
    '    │   key_share: [server X25519 pub key]│',
    '    │◀─ Certificate ─────────────────────│  (RSA 2048 or EC P-256)',
    '    │◀─ CertificateVerify ───────────────│  (server signs with private key)',
    '    │◀─ Finished ────────────────────────│',
    '    │                                   │',
    '    │── Finished ───────────────────────▶│  (now encrypted!)',
    '    │── HTTP Request ────────────────────▶│  (piggyback on same flight)',
    '',
    'Total: 1 RTT (TLS 1.3) vs 2 RTT (TLS 1.2)',
    '',
    'Certificate validation:',
    `  CN: ${p.host}`,
    '  Issuer: DigiCert / Let\'s Encrypt / etc.',
    '  Valid until: check not expired',
    '  CT log: Certificate Transparency verified',
    '  OCSP: check revocation status',
  ].join('\n')

  return {
    id: 'tls',
    title: 'TLS Handshake',
    description: 'Authenticate server + establish encrypted channel',
    explanation:
      'TLS 1.3 (current standard) reduces the handshake to 1 RTT using key agreement (X25519 ECDH). The server authenticates with its certificate (signed by a trusted CA). The browser validates the cert chain, checks for revocation (OCSP), and verifies Certificate Transparency logs. After the handshake, all traffic is encrypted with symmetric keys derived from the key exchange.',
    colorText: 'text-purple-400',
    colorBg: 'bg-purple-400/10',
    colorBorder: 'border-purple-400/30',
    content,
    badges: [
      { type: 'optimization', label: 'TLS 1.3 — 1 RTT', detail: 'TLS 1.3 halved the handshake cost vs TLS 1.2 (2 RTT → 1 RTT)' },
      { type: 'optimization', label: '0-RTT resumption', detail: 'TLS session resumption can send data immediately on reconnect (0-RTT)' },
    ],
  }
}

// ─── Stage 6: HTTP Request ────────────────────────────────────────────────
function buildHttpRequestStage(url: string, p: ParsedUrl): GenericPipelineStage {
  const queryParams = p.query
    ? p.query.slice(1).split('&').map((kv) => {
        const [k, v] = kv.split('=')
        return `  ${decodeURIComponent(k ?? '')}: ${decodeURIComponent(v ?? '')}`
      }).join('\n')
    : '  (none)'

  const content = [
    `GET ${p.path}${p.query} HTTP/2`,
    `Host: ${p.host}`,
    'Accept: text/html,application/xhtml+xml,*/*;q=0.9',
    'Accept-Encoding: gzip, br, deflate',
    'Accept-Language: en-US,en;q=0.9',
    `Sec-Fetch-Site: none`,
    'Sec-Fetch-Mode: navigate',
    'Sec-Fetch-Dest: document',
    'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'Connection: keep-alive',
    `Cookie: session_id=abc123; _ga=GA1.2.xxxx  (if set)`,
    '',
    'Query parameters:',
    queryParams,
    '',
    'HTTP/2 advantages:',
    '  ✓ Multiplexing — multiple streams on 1 TCP conn',
    '  ✓ Header compression (HPACK)',
    '  ✓ Server push',
    '  ✓ Binary framing (not text)',
    '',
    `Full URL: ${url}`,
  ].join('\n')

  return {
    id: 'http-request',
    title: 'HTTP Request',
    description: 'Browser sends GET request with headers',
    explanation:
      'The browser sends an HTTP/2 request with rich headers: Accept tells the server what content types are acceptable, Accept-Encoding requests compression (Brotli is most efficient), and Sec-Fetch-* headers are security hints. Cookies are automatically attached. HTTP/2 uses binary framing and HPACK header compression, significantly reducing overhead vs HTTP/1.1.',
    colorText: 'text-indigo-400',
    colorBg: 'bg-indigo-400/10',
    colorBorder: 'border-indigo-400/30',
    content,
    badges: [
      { type: 'optimization', label: 'HTTP/2', detail: 'HTTP/2 multiplexes requests, compresses headers, and supports server push' },
      { type: 'info', label: 'Brotli compression', detail: 'br encoding is 20-30% smaller than gzip for text content' },
    ],
  }
}

// ─── Stage 7: Server Processing ───────────────────────────────────────────
function buildServerProcessingStage(p: ParsedUrl): GenericPipelineStage {
  const pathParts = p.path.split('/').filter(Boolean)
  const content = [
    `Server receives: GET ${p.path}${p.query}`,
    '',
    '① Load Balancer',
    '   → Route to least-loaded application server',
    '   → Health check: server alive? Yes',
    '',
    '② Web Server (Nginx / Apache)',
    '   → Match route: ' + (pathParts[0] ? `/${pathParts[0]}` : '/') + ' → app server',
    '   → Static file? No → proxy to app',
    '',
    '③ Application Server (Node.js / Python / Go etc.)',
    `   → Route match: GET ${p.path}`,
    `   → Query params: ${p.query || '(none)'}`,
    '   → Middleware: auth, logging, rate-limit',
    '   → Business logic: fetch data',
    '',
    '④ Database / Cache Query (if dynamic)',
    '   → Redis cache check: MISS',
    '   → SQL: SELECT * FROM products WHERE id=42',
    '   → Result: { id: 42, name: "Widget", price: 29.99 }',
    '',
    '⑤ Render Response',
    '   → Template engine / JSON serializer',
    '   → Compress with Brotli',
    '   → Set Cache-Control, ETag headers',
    '   → Send HTTP response',
  ].join('\n')

  return {
    id: 'server',
    title: 'Server Processing',
    description: 'Load balancer → app server → DB → response',
    explanation:
      'The server side involves multiple hops: a load balancer distributes traffic, a web server handles static files and proxies dynamic requests, an application server runs business logic, and a database serves data. CDNs can serve cached responses from edge nodes close to the user, dramatically reducing latency. The entire server processing time is called "Time to First Byte" (TTFB).',
    colorText: 'text-orange-400',
    colorBg: 'bg-orange-400/10',
    colorBorder: 'border-orange-400/30',
    content,
    badges: [
      { type: 'info', label: 'TTFB metric', detail: 'Time to First Byte (TTFB) measures server processing + network latency. Target: <200ms' },
      { type: 'optimization', label: 'CDN edge node', detail: 'A CDN serves cached content from a server physically close to the user, reducing RTT' },
    ],
  }
}

// ─── Stage 8: HTTP Response ───────────────────────────────────────────────
function buildHttpResponseStage(p: ParsedUrl): GenericPipelineStage {
  const content = [
    'HTTP/2 200 OK',
    '',
    'Response Headers:',
    '  Content-Type: text/html; charset=UTF-8',
    '  Content-Encoding: br  (Brotli compressed)',
    '  Content-Length: 4821',
    '  Cache-Control: public, max-age=3600, stale-while-revalidate=86400',
    '  ETag: "abc123def456"',
    '  Last-Modified: Thu, 19 Feb 2026 10:00:00 GMT',
    '  Strict-Transport-Security: max-age=31536000; includeSubDomains',
    '  X-Frame-Options: SAMEORIGIN',
    '  X-Content-Type-Options: nosniff',
    '  Content-Security-Policy: default-src \'self\'',
    `  Server: nginx/1.25.3`,
    '  CF-Ray: 8a1b2c3d4e5f6a7b  (Cloudflare)',
    '',
    'Body (Brotli compressed):',
    '  Compressed: 4,821 bytes',
    '  Uncompressed: ~18,400 bytes',
    '  Savings: ~74%',
    '',
    'HTTP/2 delivery:',
    '  DATA frames stream in chunks',
    '  Browser can start parsing before all bytes arrive',
    `  → Streamed to ${p.host} browser renderer`,
  ].join('\n')

  return {
    id: 'http-response',
    title: 'HTTP Response',
    description: '200 OK + headers + compressed body',
    explanation:
      'The server returns an HTTP response with status code, headers, and body. Security headers (HSTS, CSP, X-Frame-Options) protect against common attacks. Cache-Control tells the browser and CDNs how long to cache the response. The body is typically Brotli-compressed, saving 70-80% bandwidth. The browser can start parsing the HTML before the entire response arrives — incremental rendering.',
    colorText: 'text-emerald-400',
    colorBg: 'bg-emerald-400/10',
    colorBorder: 'border-emerald-400/30',
    content,
    badges: [
      { type: 'optimization', label: 'HSTS', detail: 'Strict-Transport-Security enforces HTTPS on subsequent visits, eliminating redirect overhead' },
      { type: 'optimization', label: 'Brotli 74% smaller', detail: 'Brotli compression typically achieves 70-80% size reduction on HTML/CSS/JS' },
      { type: 'info', label: 'Streaming parse', detail: 'Browser begins rendering before the full response arrives — incremental HTML parsing' },
    ],
  }
}

// ─── Stage 9: Browser Processing ─────────────────────────────────────────
function buildBrowserProcessingStage(p: ParsedUrl): GenericPipelineStage {
  const content = [
    'Browser receives response → starts rendering pipeline',
    '',
    '① Decompress: Brotli → raw HTML bytes',
    '② Character encoding: UTF-8 bytes → characters',
    '',
    '③ HTML Parser starts (incremental)',
    '   → Tokenization → DOM construction',
    '   → Encounter <link rel="stylesheet"> → fetch CSS (blocks render)',
    '   → Encounter <script> → fetch + execute (blocks parser)',
    '   → Encounter <img> → fetch in parallel (non-blocking)',
    '',
    '④ CSS Parser (parallel with HTML parsing)',
    '   → Build CSSOM',
    '',
    '⑤ Render Tree = DOM + CSSOM',
    '⑥ Layout → compute geometry',
    '⑦ Paint → draw commands',
    '⑧ Composite → GPU layers → screen',
    '',
    'Key metrics:',
    '  TTFB (Time to First Byte):  ~120ms',
    '  FCP  (First Contentful Paint): ~800ms',
    '  LCP  (Largest Contentful Paint): ~1200ms',
    '  TTI  (Time to Interactive): ~1800ms',
    '  CLS  (Cumulative Layout Shift): 0.03',
    '',
    `→ Next: see /rendering to visualize this in detail!`,
  ].join('\n')

  return {
    id: 'browser-processing',
    title: 'Browser Processing',
    description: 'Decompress → parse → render → display',
    explanation:
      'After receiving the response, the browser decompresses, decodes, and feeds the bytes into the HTML parser. This triggers the full Critical Rendering Path: DOM → CSSOM → Render Tree → Layout → Paint → Composite. Core Web Vitals (LCP, FID, CLS) measure the user-perceived performance of this process. The browser continues fetching sub-resources (CSS, JS, images, fonts) in parallel via the preload scanner.',
    colorText: 'text-teal-400',
    colorBg: 'bg-teal-400/10',
    colorBorder: 'border-teal-400/30',
    content,
    badges: [
      { type: 'optimization', label: 'Preload scanner', detail: 'The browser\'s preload scanner speculatively fetches resources found in HTML before the parser reaches them' },
      { type: 'info', label: 'Core Web Vitals', detail: 'LCP, FID/INP, and CLS are Google\'s user-experience metrics for web performance' },
    ],
  }
}

// ─── Badge helpers ────────────────────────────────────────────────────────
function detectUrlBadges(p: ParsedUrl): PipelineBadge[] {
  const badges: PipelineBadge[] = []
  if (p.isHttps) badges.push({ type: 'optimization', label: 'HTTPS', detail: 'Connection will be encrypted via TLS' })
  else badges.push({ type: 'warning', label: 'HTTP (insecure)', detail: 'Plain HTTP — no encryption, vulnerable to MITM attacks' })
  if (p.fragment) badges.push({ type: 'info', label: 'Fragment (#) present', detail: 'Fragment is never sent to the server — handled entirely by the browser/JS' })
  if (p.query) badges.push({ type: 'info', label: 'Query string', detail: 'Query parameters are sent to the server in the request URL' })
  return badges
}
