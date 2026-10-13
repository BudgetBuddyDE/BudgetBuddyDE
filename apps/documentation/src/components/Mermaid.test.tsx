import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {renderToStaticMarkup} from 'react-dom/server';
import {Mermaid} from './Mermaid';

test('renders the CI flowchart as a theme-aware SVG', () => {
  const markdown = readFileSync(new URL('../../docs/ci/architecture.md', import.meta.url), 'utf8');
  const chart = /```mermaid\n([\s\S]*?)```/.exec(markdown)?.[1];
  assert(chart);
  const html = renderToStaticMarkup(<Mermaid chart={chart} />);
  assert(html.includes('<svg'));
  assert(html.includes('var(--color-fd-foreground)'));
  assert(html.includes('aria-label="Mermaid diagram"'));
});

test('invalid syntax falls back to escaped source text', () => {
  const html = renderToStaticMarkup(<Mermaid chart={'invalid <script>alert(1)</script>'} />);
  assert(html.includes('Unable to render'));
  assert(html.includes('&lt;script&gt;'));
  assert(!html.includes('<script>'));
});
