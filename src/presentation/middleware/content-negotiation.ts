import { Request, Response, NextFunction } from 'express';

export function contentNegotiation(req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);

  res.json = function (data: unknown) {
    if (req.accepts('html') && !req.accepts('json')) {
      const html = renderDataAsHtml(data, req.method, req.originalUrl);
      res.type('text/html').send(html);
      return res;
    }
    return originalJson(data);
  };

  next();
}

function renderDataAsHtml(data: unknown, method: string, url: string): string {
  let body = '';

  if (Array.isArray(data)) {
    if (data.length === 0) {
      body = '<p>No records found.</p>';
    } else {
      const keys = Object.keys(data[0]);
      const headerRow = keys.map(k => `<th>${escapeHtml(k)}</th>`).join('');
      const rows = data.map(item => {
        const cells = keys.map(k => {
          const val = typeof item[k] === 'object' ? JSON.stringify(item[k]) : String(item[k] ?? '');
          return `<td>${escapeHtml(val)}</td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
      }).join('\n');
      body = `<table border="1" cellpadding="6" cellspacing="0">
        <tr>${headerRow}</tr>
        ${rows}
      </table>`;
    }
  } else if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data as Record<string, unknown>);
    const rows = entries.map(([k, v]) => {
      const val = typeof v === 'object' ? JSON.stringify(v) : String(v ?? '');
      return `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(val)}</td></tr>`;
    }).join('\n');
    body = `<table border="1" cellpadding="6" cellspacing="0">${rows}</table>`;
  } else {
    body = `<p>${escapeHtml(String(data))}</p>`;
  }

  return `<!DOCTYPE html>
<html>
<head><title>${method} ${escapeHtml(url)}</title></head>
<body>
<h1>${method} ${escapeHtml(url)}</h1>
${body}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
