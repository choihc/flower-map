
  (function (global) {
    global.__granite = global.__granite || {};
    global.__granite.meta = global.__granite.meta || {};
    global.__granite.meta.env = global.__granite.meta.env || {};
    
  })(
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof global !== 'undefined'
      ? global
      : typeof window !== 'undefined'
      ? window
      : this
  );
  