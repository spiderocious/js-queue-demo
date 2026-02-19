export const DEFAULT_HTML_INPUT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My Page</title>
  <link rel="stylesheet" href="styles.css" />
  <script src="app.js"></script>
  <style>
    body {
      margin: 0;
      font-family: sans-serif;
      background: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
    }
    h1 {
      color: #1a1a1a;
      font-size: 2rem;
      will-change: transform;
    }
    .card {
      background: white;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transform: translateZ(0);
    }
    .hidden-el {
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 id="title">Hello, Browser!</h1>
    <div class="card">
      <p>This card is rendered and painted.</p>
      <img src="photo.jpg" alt="A photo" width="400" height="300" />
      <button onclick="handleClick()">Click me</button>
    </div>
    <p class="hidden-el">I am hidden — not in render tree.</p>
  </div>
  <script>
    function handleClick() {
      document.getElementById('title').textContent = 'Clicked!';
    }
  </script>
</body>
</html>`
