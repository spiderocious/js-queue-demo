export const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>DOM Demo</title>
</head>
<body>
  <header>
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
    </nav>
  </header>
  <main>
    <h1 id="title">Welcome</h1>
    <section class="content">
      <p>First <strong>paragraph</strong> with <em>emphasis</em>.</p>
      <p class="hidden">This paragraph is hidden.</p>
      <ul>
        <li>Item one</li>
        <li>Item two</li>
        <li>Item three</li>
      </ul>
    </section>
  </main>
  <footer>
    <p>Footer content</p>
  </footer>
</body>
</html>`

export const DEFAULT_CSS = `/* Reset */
* { box-sizing: border-box; margin: 0; }

body {
  font-family: sans-serif;
  font-size: 16px;
  color: #1a1a1a;
  line-height: 1.6;
}

header {
  background: #1e293b;
  padding: 12px 24px;
}

nav a {
  color: white;
  text-decoration: none;
  margin-right: 16px;
  font-weight: 500;
}

h1#title {
  font-size: 2rem;
  color: #0f172a;
  margin: 24px 0;
}

.content {
  max-width: 760px;
  margin: 0 auto;
}

p {
  margin-bottom: 12px;
  color: #374151;
}

.hidden {
  display: none;
}

strong { font-weight: 700; }
em { font-style: italic; color: #6366f1; }

ul { padding-left: 24px; }
li { margin-bottom: 6px; }

footer {
  border-top: 1px solid #e5e7eb;
  padding: 16px 24px;
  color: #9ca3af;
  font-size: 0.875rem;
}`
