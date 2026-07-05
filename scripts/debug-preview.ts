import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { default: handler } = await import('../api/interviews/preview.ts');

const req = {
  method: 'POST',
  body: { jobId: undefined, county: undefined, notYetSent: false },
  headers: { 'content-type': 'application/json' },
};

const res = {
  code: 200,
  status(code: number) { this.code = code; return this; },
  setHeader() {},
  json(obj: unknown) { console.log('json', obj); },
  end() { console.log('end', this.code); },
};

try {
  await handler(req, res);
} catch (err) {
  console.error(err);
  process.exit(1);
}
