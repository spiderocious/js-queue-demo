export const DEFAULT_DEMO_CODE = `console.log("1: Synchronous - Start");

setTimeout(() => {
  console.log("2: Macrotask - setTimeout");
}, 0);

Promise.resolve().then(() => {
  console.log("3: Microtask - Promise.then");
});

queueMicrotask(() => {
  console.log("4: Microtask - queueMicrotask");
});

requestAnimationFrame(() => {
  console.log("5: Animation - rAF callback");
});

requestIdleCallback(() => {
  console.log("6: Idle - requestIdleCallback");
});

Promise.resolve()
  .then(() => {
    console.log("7: Microtask - Chained Promise 1");
    return "data";
  })
  .then((val) => {
    console.log("8: Microtask - Chained Promise 2:", val);
  });

setTimeout(() => {
  console.log("9: Macrotask - setTimeout 2");
  Promise.resolve().then(() => {
    console.log("10: Microtask inside Macrotask");
  });
}, 0);

console.log("11: Synchronous - End");`
