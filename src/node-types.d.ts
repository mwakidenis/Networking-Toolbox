declare module 'node:dns' {
  export * from 'dns';
  export { promises } from 'dns';
}

declare module 'node:net' {
  export * from 'net';
  export { connect, Socket } from 'net';
}

declare module 'node:tls' {
  export * from 'tls';
}

declare module 'node:crypto' {
  export * from 'crypto';
}

declare module 'node:url' {
  export * from 'url';
}

declare module 'node:http' {
  export * from 'http';
}

declare module 'node:https' {
  export * from 'https';
}

declare module 'node:fs' {
  export * from 'fs';
}

declare module 'node:path' {
  export * from 'path';
}

declare module 'node:os' {
  export * from 'os';
}

declare module 'perf_hooks' {
  export interface PerformanceEntry {
    duration: number;
    entryType: string;
    name: string;
    startTime: number;
  }

  export interface PerformanceMark extends PerformanceEntry {
    entryType: 'mark';
  }

  export interface PerformanceMeasure extends PerformanceEntry {
    entryType: 'measure';
  }

  export class Performance {
    now(): number;
    mark(name: string): void;
    measure(name: string, startMark?: string, endMark?: string): void;
    getEntriesByName(name: string, type?: string): PerformanceEntry[];
    clearMarks(name?: string): void;
    clearMeasures(name?: string): void;
  }

  export const performance: Performance;
}

declare global {
  function setImmediate(callback: (...args: unknown[]) => void, ...args: unknown[]): NodeJS.Immediate;
  function clearImmediate(immediate: NodeJS.Immediate): void;

  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Immediate {}
  }
}
