import puppeteer from 'puppeteer';

function sanitizeMermaidCode(code) {
  if (!code) return '';
  const lines = code.split('\n');
  
  return lines.map(rawLine => {
    let commentIdx = rawLine.indexOf('%%');
    let line = commentIdx >= 0 ? rawLine.slice(0, commentIdx) : rawLine;
    let comment = commentIdx >= 0 ? rawLine.slice(commentIdx) : '';

    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('---') || trimmed.startsWith('style ') || trimmed.startsWith('classDef ') || trimmed.startsWith('class ')) {
      return rawLine;
    }

    // 1. Protect and sanitize edge pipe labels first: -->|some text (with parens)|
    const pipes = [];
    line = line.replace(/\|([^|\r\n]*)\|/g, (m, lbl) => {
      const clean = lbl.trim();
      let safe = clean;
      if (!((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'")))) {
        safe = `"${clean.replace(/"/g, "'")}"`;
      }
      const ph = `__MMD_PIPE_${pipes.length}__`;
      pipes.push(`|${safe}|`);
      return ph;
    });

    // 2. Sanitize subgraph titles: subgraph id [Label (v1)]
    line = line.replace(/^(\s*subgraph\s+[A-Za-z0-9_.-]+\s*\[)([^"\n]+)(\]\s*)$/i, (m, p1, lbl, p3) => {
      const clean = lbl.trim();
      if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) return m;
      return `${p1}"${clean}"${p3}`;
    });

    // 3. Shape openers and closers
    const shapes = [
      { open: '([', close: '])' },
      { open: '[[', close: ']]' },
      { open: '[(', close: ')]' },
      { open: '((', close: '))' },
      { open: '{{', close: '}}' },
      { open: '{',  close: '}' },
      { open: '[/', close: '/]' },
      { open: '[\\', close: '\\]' },
      { open: '>',  close: ']' },
      { open: '(',  close: ')' },
      { open: '[',  close: ']' },
    ];

    let result = '';
    let idx = 0;

    while (idx < line.length) {
      const match = line.slice(idx).match(/([A-Za-z0-9_.-]+)\s*(\(\[|\[\[|\[\(|\(\(|\{\{|\{|\[\/|\[\\|>|\(|\[)/);
      if (!match) {
        result += line.slice(idx);
        break;
      }

      const matchOffset = idx + match.index;
      const nodeId = match[1];
      const openerStr = match[2];
      const shape = shapes.find(s => s.open === openerStr);

      if (!shape) {
        result += line.slice(idx, matchOffset + match[0].length);
        idx = matchOffset + match[0].length;
        continue;
      }

      result += line.slice(idx, matchOffset);
      const afterOpenerIdx = matchOffset + match[0].length;

      const rest = line.slice(afterOpenerIdx);

      // Find matching closer searching backwards from connectors or placeholders or line end
      const nextConnectorIdx = rest.search(/(--+|==+|-\.-|<--+|<==+|-\.\->|-->|==>|---|===|--o|--x|<-->|__MMD_PIPE_|\s+style\s+|\s+class\s+)/);
      const searchLimit = nextConnectorIdx >= 0 ? nextConnectorIdx : rest.length;
      const searchTarget = rest.slice(0, searchLimit);

      const closerIdx = searchTarget.lastIndexOf(shape.close);

      if (closerIdx !== -1) {
        const innerText = searchTarget.slice(0, closerIdx).trim();

        const isQuoted = (innerText.startsWith('"') && innerText.endsWith('"')) ||
                         (innerText.startsWith("'") && innerText.endsWith("'"));

        if (isQuoted || !innerText) {
          result += `${nodeId}${shape.open}${innerText}${shape.close}`;
        } else {
          const safeInner = innerText.replace(/"/g, "'");
          result += `${nodeId}${shape.open}"${safeInner}"${shape.close}`;
        }

        idx = afterOpenerIdx + closerIdx + shape.close.length;
      } else {
        result += match[0];
        idx = afterOpenerIdx;
      }
    }

    // Restore pipes
    let finalLine = result + comment;
    pipes.forEach((pVal, pIdx) => {
      finalLine = finalLine.replace(`__MMD_PIPE_${pIdx}__`, pVal);
    });

    return finalLine;
  }).join('\n');
}

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(`
    <html>
      <head>
        <script type="module">
          import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
          window.mermaid = mermaid;
          mermaid.initialize({ startOnLoad: false });
        </script>
      </head>
      <body></body>
    </html>
  `);

  await page.waitForFunction(() => window.mermaid !== undefined);

  const testCodes = [
    'flowchart TD\n  A(....)',
    'flowchart TD\n  A( (....) )',
    'flowchart TD\n  A[ (....) ]',
    'flowchart TD\n  A(Text (v1))',
    'flowchart TD\n  A(....) --> B',
    'flowchart TD\n  A --> B(....)',
    'flowchart TD\n  A --> B( (....) )',
    'flowchart TD\n  A --> B(text (1))',
    'flowchart TD\n  A(....) --> B( (....) )',
    'flowchart TD\n  A[Text (with brackets)]',
    'flowchart TD\n  A(Text (with parens))',
    'flowchart TD\n  A((Text (with parens)))',
    'flowchart TD\n  A --> B(....) --> C',
    'flowchart TD\n  A( (....) ) -->|link (label)| B(( (....) ))',
    'flowchart TD\n  subgraph sg1 [Group (....)]\n    A( (....) )\n  end',
  ];

  for (const rawCode of testCodes) {
    const sanitized = sanitizeMermaidCode(rawCode);
    const res = await page.evaluate(async (c) => {
      try {
        const id = 'm_' + Math.random().toString(36).substr(2, 5);
        const { svg } = await window.mermaid.render(id, c);
        return { ok: true, svgLength: svg.length };
      } catch (e) {
        return { ok: false, error: e?.str || e?.message || String(e) };
      }
    }, sanitized);
    console.log(res.ok ? 'SUCCESS' : 'FAILED ', 'Raw:', JSON.stringify(rawCode), '-> Sanitized:', JSON.stringify(sanitized), res.ok ? '' : 'Err:' + res.error.split('\n')[0]);
  }

  await browser.close();
}

main();
