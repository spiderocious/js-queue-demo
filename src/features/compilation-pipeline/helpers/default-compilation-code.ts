export const DEFAULT_COMPILATION_CODE = `function add(a, b) {
  return a + b;
}

function greet(name) {
  const message = "Hello, " + name + "!";
  return message;
}

// Hot function - called many times
for (let i = 0; i < 10000; i++) {
  add(i, i + 1);
}

const result = greet("World");
console.log(result);`
