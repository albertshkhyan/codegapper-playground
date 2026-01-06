// gapRules.ts

// Trivial variable names to skip
export const TRIVIAL_NAMES = new Set(['i', 'j', 'k', 'x', 'y', 'z']);

// Curated whitelist of standard JS method names
export const JS_METHOD_WHITELIST = new Set([
  // Array methods
  'map', 'forEach', 'filter', 'reduce', 'find', 'some', 'every', 'push', 'pop', 'shift', 'unshift', 'slice', 'splice', 'concat', 'join', 'reverse', 'sort', 'includes', 'indexOf', 'lastIndexOf', 'flat', 'flatMap', 'fill', 'copyWithin', 'entries', 'keys', 'values', 'findIndex', 'from', 'isArray', 'of',
  // String methods
  'charAt', 'charCodeAt', 'concat', 'includes', 'endsWith', 'indexOf', 'lastIndexOf', 'match', 'repeat', 'replace', 'search', 'slice', 'split', 'startsWith', 'substr', 'substring', 'toLowerCase', 'toUpperCase', 'trim', 'padStart', 'padEnd', 'codePointAt', 'normalize', 'valueOf',
  // Object methods
  'assign', 'create', 'defineProperties', 'defineProperty', 'entries', 'freeze', 'fromEntries', 'getOwnPropertyDescriptor', 'getOwnPropertyDescriptors', 'getOwnPropertyNames', 'getOwnPropertySymbols', 'is', 'isExtensible', 'isFrozen', 'isSealed', 'keys', 'preventExtensions', 'seal', 'setPrototypeOf', 'values', 'hasOwnProperty', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'valueOf',
  // Function methods
  'apply', 'bind', 'call', 'toString',
  // Number/Math methods
  'isFinite', 'isInteger', 'isNaN', 'isSafeInteger', 'parseFloat', 'parseInt', 'toExponential', 'toFixed', 'toLocaleString', 'toPrecision', 'toString', 'valueOf', 'abs', 'acos', 'acosh', 'asin', 'asinh', 'atan', 'atan2', 'atanh', 'cbrt', 'ceil', 'clz32', 'cos', 'cosh', 'exp', 'expm1', 'floor', 'fround', 'hypot', 'imul', 'log', 'log10', 'log1p', 'log2', 'max', 'min', 'pow', 'random', 'round', 'sign', 'sin', 'sinh', 'sqrt', 'tan', 'tanh', 'trunc',
  // Date methods
  'getDate', 'getDay', 'getFullYear', 'getHours', 'getMilliseconds', 'getMinutes', 'getMonth', 'getSeconds', 'getTime', 'getTimezoneOffset', 'getUTCDate', 'getUTCDay', 'getUTCFullYear', 'getUTCHours', 'getUTCMilliseconds', 'getUTCMinutes', 'getUTCMonth', 'getUTCSeconds', 'setDate', 'setFullYear', 'setHours', 'setMilliseconds', 'setMinutes', 'setMonth', 'setSeconds', 'setTime', 'setUTCDate', 'setUTCFullYear', 'setUTCHours', 'setUTCMilliseconds', 'setUTCMinutes', 'setUTCMonth', 'setUTCSeconds', 'toDateString', 'toISOString', 'toJSON', 'toLocaleDateString', 'toLocaleString', 'toLocaleTimeString', 'toTimeString', 'toUTCString', 'valueOf',
  // Promise methods
  'then', 'catch', 'finally', 'resolve', 'reject', 'all', 'allSettled', 'race', 'any',
  // Set/Map/WeakSet/WeakMap methods
  'add', 'clear', 'delete', 'entries', 'forEach', 'get', 'has', 'keys', 'set', 'values',
  // RegExp methods
  'exec', 'test', 'compile', 'flags', 'global', 'ignoreCase', 'multiline', 'source', 'sticky', 'unicode',
  // JSON methods
  'parse', 'stringify',
  // Misc
  'alert', 'prompt', 'confirm', 'log', 'warn', 'error', 'info', 'debug', 'trace', 'group', 'groupEnd', 'table', 'time', 'timeEnd', 'timeLog', 'clear', 'count', 'countReset', 'assert', 'dir', 'dirxml', 'groupCollapsed', 'profile', 'profileEnd', 'timeStamp',
]);

export function isTrivialName(name: string): boolean {
  return TRIVIAL_NAMES.has(name);
}

export function isAllowedMethodName(name: string): boolean {
  return JS_METHOD_WHITELIST.has(name);
}

export function isShortValue(value: string, hardMode: boolean): boolean {
  return !hardMode && value.length < 2;
} 