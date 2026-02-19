export const DEFAULT_JSX_INPUT = `import { useState, useEffect, useCallback } from 'react'

function Button({ label, onClick }) {
  return (
    <button className="btn" onClick={onClick}>
      {label}
    </button>
  )
}

function Counter({ initialCount = 0 }) {
  const [count, setCount] = useState(initialCount)
  const [doubled, setDoubled] = useState(initialCount * 2)

  useEffect(() => {
    document.title = \`Count: \${count}\`
    return () => {
      document.title = 'App'
    }
  }, [count])

  const increment = useCallback(() => {
    setCount(c => c + 1)
    setDoubled(c => c + 2)
  }, [])

  return (
    <div className="counter">
      <h2>Count: {count}</h2>
      <p>Doubled: {doubled}</p>
      <Button label="Increment" onClick={increment} />
    </div>
  )
}

export default function App() {
  return (
    <main>
      <h1>React Counter</h1>
      <Counter initialCount={5} />
    </main>
  )
}`
