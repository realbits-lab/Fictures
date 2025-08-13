import '@testing-library/jest-dom'

// Mock Next.js server environment with Web API polyfills
global.Request = global.Request || class MockRequest {
  constructor(input, init) {
    this.url = input;
    this.method = init?.method || 'GET';
    this.headers = new Map(Object.entries(init?.headers || {}));
    this.body = init?.body;
  }
  json() { return Promise.resolve(JSON.parse(this.body || '{}')); }
  text() { return Promise.resolve(this.body || ''); }
};

global.Response = global.Response || class MockResponse {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = init?.statusText || 'OK';
    this.headers = new Map(Object.entries(init?.headers || {}));
  }
  json() { return Promise.resolve(JSON.parse(this.body || '{}')); }
  text() { return Promise.resolve(this.body || ''); }
  static json(data) { return new this(JSON.stringify(data)); }
};

global.fetch = global.fetch || jest.fn();

// Mock Web Crypto API for Next.js auth
const { webcrypto } = require('crypto');
Object.defineProperty(global, 'crypto', {
  value: webcrypto,
});

// Mock TextEncoder/TextDecoder for Web APIs
global.TextEncoder = global.TextEncoder || require('util').TextEncoder;
global.TextDecoder = global.TextDecoder || require('util').TextDecoder;

// Mock next-auth completely
jest.mock('@/app/auth', () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock clearImmediate for postgres
global.clearImmediate = global.clearImmediate || jest.fn();

// Mock Web Streams API for AI SDK
global.TransformStream = global.TransformStream || class {
  constructor() {
    this.readable = new ReadableStream();
    this.writable = new WritableStream();
  }
};

global.ReadableStream = global.ReadableStream || class {
  constructor() {
    this.locked = false;
  }
  getReader() {
    return {
      read() {
        return Promise.resolve({ done: true, value: undefined });
      },
      releaseLock() {}
    };
  }
};

global.WritableStream = global.WritableStream || class {
  constructor() {
    this.locked = false;
  }
  getWriter() {
    return {
      write() { return Promise.resolve(); },
      close() { return Promise.resolve(); },
      releaseLock() {}
    };
  }
};

// Mock localStorage for hooks that use it
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Suppress React act() warnings in tests
const originalConsoleError = console.error;
global.console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('not wrapped in act(...)')) {
    return;
  }
  originalConsoleError.apply(console, args);
};