/**
 * Renders the legal documents into static pages for the website.
 *
 * docs/legal/*.md stays the single source of truth — these pages are generated from it, so the
 * published policy cannot drift from the reviewed one. Re-run after editing any of the markdown.
 *
 * Output is written as directory indexes (privacy/index.html, not privacy.html) so the URLs in
 * the extension manifest — /privacy, /terms, /dpa — resolve on any host that serves directory
 * indexes, which is every common static host.
 *
 * Usage:  node website/scripts/build-legal.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const websiteRoot = resolve(scriptDir, '..');
const legalSource = resolve(websiteRoot, '..', 'docs', 'legal');

const pages = [
    {
        source: 'PRIVACY-POLICY.md',
        slug: 'privacy',
        title: 'Privacy Policy — TickPax',
        description: 'What personal data TickPax handles, why, and what rights people have.'
    },
    {
        source: 'TERMS-OF-SERVICE.md',
        slug: 'terms',
        title: 'Terms of Service — TickPax',
        description: 'The commercial terms for using TickPax: plans, seats, billing, and liability.'
    },
    {
        source: 'DATA-PROCESSING-ADDENDUM.md',
        slug: 'dpa',
        title: 'Data Processing Addendum — TickPax',
        description: 'GDPR Article 28 processor terms and the sub-processor list for TickPax.'
    }
];

// ── Markdown ───────────────────────────────────────────────────────────────
// A deliberately small converter covering exactly what these documents use.
// Anything richer belongs in the documents' own review, not in a template.

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function renderInline(text) {
    let out = escapeHtml(text);
    out = out.replace(/`([^`]+)`/g, (_, code) => `<code>${code}</code>`);
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
        const target = href.startsWith('http') ? ' target="_blank" rel="noopener"' : '';
        return `<a href="${href}"${target}>${label}</a>`;
    });
    // Bare mailto and https, once the explicit links above are already anchors.
    out = out.replace(/(^|[\s(])([\w.+-]+@[\w.-]+\.\w+)/g, '$1<a href="mailto:$2">$2</a>');
    return out;
}

function splitRow(line) {
    return line.replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
}

function markdownToHtml(markdown) {
    const lines = markdown.split(/\r?\n/);
    const html = [];
    let index = 0;

    while (index < lines.length) {
        const line = lines[index];

        if (line.trim() === '') { index++; continue; }

        if (/^---+$/.test(line.trim())) {
            html.push('<hr />');
            index++;
            continue;
        }

        const heading = line.match(/^(#{1,4})\s+(.*)$/);
        if (heading) {
            const level = heading[1].length;
            html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
            index++;
            continue;
        }

        // Table: a header row followed by a separator row.
        if (line.trim().startsWith('|') && (lines[index + 1] ?? '').includes('---')) {
            const head = splitRow(line);
            index += 2;
            const body = [];
            while (index < lines.length && lines[index].trim().startsWith('|')) {
                body.push(splitRow(lines[index]));
                index++;
            }
            html.push('<div class="table-scroll"><table>');
            html.push(`<thead><tr>${head.map(c => `<th>${renderInline(c)}</th>`).join('')}</tr></thead>`);
            html.push('<tbody>');
            for (const row of body) {
                html.push(`<tr>${row.map(c => `<td>${renderInline(c)}</td>`).join('')}</tr>`);
            }
            html.push('</tbody></table></div>');
            continue;
        }

        if (line.trim().startsWith('> ')) {
            const quote = [];
            while (index < lines.length && lines[index].trim().startsWith('>')) {
                quote.push(lines[index].trim().replace(/^>\s?/, ''));
                index++;
            }
            html.push(`<blockquote>${renderInline(quote.join(' '))}</blockquote>`);
            continue;
        }

        const bulletMatch = /^\s*[-*]\s+/;
        if (bulletMatch.test(line)) {
            const items = [];
            while (index < lines.length && bulletMatch.test(lines[index])) {
                items.push(lines[index].replace(bulletMatch, ''));
                index++;
            }
            html.push(`<ul>${items.map(i => `<li>${renderInline(i)}</li>`).join('')}</ul>`);
            continue;
        }

        const orderedMatch = /^\s*\d+\.\s+/;
        if (orderedMatch.test(line)) {
            const items = [];
            while (index < lines.length && orderedMatch.test(lines[index])) {
                items.push(lines[index].replace(orderedMatch, ''));
                index++;
            }
            html.push(`<ol>${items.map(i => `<li>${renderInline(i)}</li>`).join('')}</ol>`);
            continue;
        }

        // Paragraph: consecutive non-blank lines that start no other construct.
        const paragraph = [];
        while (index < lines.length
            && lines[index].trim() !== ''
            && !/^(#{1,4}\s|---+$|\||>\s|\s*[-*]\s|\s*\d+\.\s)/.test(lines[index])) {
            paragraph.push(lines[index].trim());
            index++;
        }
        if (paragraph.length > 0) {
            html.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
        }
    }

    return html.join('\n');
}

// ── Page shell ─────────────────────────────────────────────────────────────

function renderPage({ slug, title, description }, body) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta name="robots" content="index, follow" />
  <meta name="theme-color" content="#0a1628" />

  <link rel="canonical" href="https://tickpax.com/${slug}" />

  <meta property="og:site_name" content="TickPax" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="https://tickpax.com/${slug}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="https://tickpax.com/assets/og-image.png" />

  <link rel="icon" type="image/png" href="/assets/icon.png" />
  <link rel="apple-touch-icon" href="/assets/icon.png" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

  <link rel="stylesheet" href="/styles.css" />
  <link rel="stylesheet" href="/legal.css" />
</head>
<body class="legal-body">
  <header class="legal-header">
    <a href="/" class="legal-logo" aria-label="TickPax home">
      <img src="/assets/icon.png" alt="" width="28" height="28" />
      <span>TickPax</span>
    </a>
    <nav class="legal-nav" aria-label="Legal documents">
      <a href="/terms">Terms</a>
      <a href="/privacy">Privacy</a>
      <a href="/dpa">DPA</a>
      <a href="/support">Support</a>
    </nav>
  </header>

  <main class="legal-main">
${body}
  </main>

  <footer class="legal-footer">
    <p>
      <a href="/">TickPax</a> · Questions about this document:
      <a href="mailto:privacy@tickpax.com">privacy@tickpax.com</a>
    </p>
  </footer>
</body>
</html>
`;
}

// ── Build ──────────────────────────────────────────────────────────────────

for (const page of pages) {
    const markdown = readFileSync(join(legalSource, page.source), 'utf8');
    const outputDir = join(websiteRoot, page.slug);
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(join(outputDir, 'index.html'), renderPage(page, markdownToHtml(markdown)), 'utf8');
    console.log(`${page.source} -> ${page.slug}/index.html`);
}

console.log(`\n${pages.length} page(s) generated. Re-run after editing docs/legal/*.md.`);
