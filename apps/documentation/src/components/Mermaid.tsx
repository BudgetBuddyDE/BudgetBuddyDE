import {renderMermaidSVG} from 'beautiful-mermaid';

export function Mermaid({chart}: {chart: string}) {
  try {
    const svg = renderMermaidSVG(chart, {
      bg: 'var(--color-fd-background)',
      fg: 'var(--color-fd-foreground)',
      transparent: true,
    });

    return (
      <div
        role="img"
        aria-label="Mermaid diagram"
        className="my-6 overflow-x-auto"
        dangerouslySetInnerHTML={{__html: svg}}
      />
    );
  } catch {
    return (
      <div className="my-6">
        <p>Unable to render this Mermaid diagram.</p>
        <pre className="overflow-x-auto">
          <code>{chart}</code>
        </pre>
      </div>
    );
  }
}
