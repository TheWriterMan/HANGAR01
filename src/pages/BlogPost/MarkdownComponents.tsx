import React from 'react';
import { AlertTriangle, CheckCircle2, Info, AlertOctagon } from 'lucide-react';
import PostChecklist from './PostChecklist';
import { parseChecklistLines } from '../../utils/postChecklist';

const calloutConfig: Record<
  string,
  { icon: typeof Info; border: string; bg: string; label: string; labelColor: string }
> = {
  info: {
    icon: Info,
    border: 'border-accent',
    bg: 'bg-accent/10',
    label: 'Info',
    labelColor: 'text-accent',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-warning',
    bg: 'bg-warning/10',
    label: 'Advisory',
    labelColor: 'text-warning',
  },
  success: {
    icon: CheckCircle2,
    border: 'border-success',
    bg: 'bg-success/10',
    label: 'Note',
    labelColor: 'text-success',
  },
  danger: {
    icon: AlertOctagon,
    border: 'border-danger',
    bg: 'bg-danger/10',
    label: 'Warning',
    labelColor: 'text-danger',
  },
};

export interface MarkdownBlock {
  type:
    | 'paragraph'
    | 'heading'
    | 'blockquote'
    | 'bullet-list'
    | 'number-list'
    | 'callout'
    | 'checklist'
    | 'code-block'
    | 'image'
    | 'link-card';
  level?: number;
  tone?: string;
  title?: string;
  filename?: string;
  language?: string;
  src?: string;
  lines: string[];
}

/**
 * Parses markdown inline styles: **bold**, *italic*, `code`, and [text](url).
 * Handles external links with target="_blank" and accessibility announcements.
 */
function parseInlineStyles(text: string): React.ReactNode[] {
  // Regex to split on markdown inline elements:
  // **bold**, *italic*, `code`, and [text](url)
  const tokenRegex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="italic text-muted">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="bg-surface px-1.5 py-0.5 text-accent font-mono text-sm border border-border"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        const label = match[1];
        const href = match[2];
        const isExternal = href.startsWith('http');
        const target = isExternal ? '_blank' : undefined;
        return (
          <a
            key={i}
            href={href}
            target={target}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className="prose-link"
          >
            {label}
            {isExternal && <span className="sr-only"> (opens in new tab)</span>}
          </a>
        );
      }
    }
    return part;
  });
}

const IMAGE_LINE = /^!\[(.*?)\]\((\S+?)\)$/;

/**
 * Splits raw markdown into structural blocks.
 */
export function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Code blocks
    if (line.trim().startsWith('```')) {
      const match = line.trim().match(/^```(\w+)?(?:\s+title=(.+))?$/);
      const language = match ? match[1] : undefined;
      const filename = match ? match[2] : undefined;

      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```
      blocks.push({
        type: 'code-block',
        language,
        filename,
        lines: codeLines,
      });
      continue;
    }

    // Callout blocks
    if (line.trim().startsWith(':::')) {
      const tone = line.trim().slice(3).trim(); // e.g. info, warning, success, danger
      const calloutLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(':::')) {
        calloutLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing :::
      // `:::link <url>` embeds a link preview card; its lines are `image:`, `title:` and `description:`
      if (tone.startsWith('link ')) {
        blocks.push({
          type: 'link-card',
          src: tone.slice('link '.length).trim(),
          lines: calloutLines,
        });
        continue;
      }
      // `:::checklist Title` embeds an interactive mini checklist
      if (tone.startsWith('checklist')) {
        blocks.push({
          type: 'checklist',
          title: tone.slice('checklist'.length).trim() || 'Checklist',
          lines: calloutLines,
        });
        continue;
      }
      blocks.push({
        type: 'callout',
        tone,
        lines: calloutLines,
      });
      continue;
    }

    // Headings
    if (line.startsWith('#')) {
      const match = line.match(/^(#+)\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        blocks.push({
          type: 'heading',
          level,
          lines: [text],
        });
        i++;
        continue;
      }
    }

    // Blockquotes
    if (line.startsWith('>')) {
      const blockquoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        // Strip the leading > and any spacing
        blockquoteLines.push(lines[i].slice(1).trim());
        i++;
      }
      blocks.push({
        type: 'blockquote',
        lines: blockquoteLines,
      });
      continue;
    }

    // Bullet Lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const listLines: string[] = [];
      while (
        i < lines.length &&
        (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))
      ) {
        listLines.push(lines[i].trim().slice(2).trim());
        i++;
      }
      blocks.push({
        type: 'bullet-list',
        lines: listLines,
      });
      continue;
    }

    // Numbered Lists
    if (/^\d+\.\s+/.test(line.trim())) {
      const listLines: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        listLines.push(
          lines[i]
            .trim()
            .replace(/^\d+\.\s+/, '')
            .trim(),
        );
        i++;
      }
      blocks.push({
        type: 'number-list',
        lines: listLines,
      });
      continue;
    }

    // Images: `![alt](src)` alone on a line
    const image = line.trim().match(IMAGE_LINE);
    if (image) {
      blocks.push({ type: 'image', src: image[2], lines: [image[1]] });
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith(':::') &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('>') &&
      !lines[i].trim().startsWith('- ') &&
      !lines[i].trim().startsWith('* ') &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !IMAGE_LINE.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    blocks.push({
      type: 'paragraph',
      lines: paraLines,
    });
  }

  return blocks;
}

interface MarkdownBlocksProps {
  blocks: MarkdownBlock[];
  /** Renders `:::checklist` blocks. Defaults to a self-contained PostChecklist. */
  renderChecklist?: (block: MarkdownBlock) => React.ReactNode;
}

export const MarkdownBlocks: React.FC<MarkdownBlocksProps> = ({ blocks, renderChecklist }) => {
  return (
    <>
      {blocks.map((block, index) => {
        const text = block.lines.join(' ');
        switch (block.type) {
          case 'paragraph':
            return (
              <p key={index} className="mb-4 text-primary leading-relaxed font-sans">
                {parseInlineStyles(text)}
              </p>
            );
          case 'heading': {
            const headingText = parseInlineStyles(text);
            if (block.level === 1 || block.level === 2) {
              return (
                <h2
                  key={index}
                  className="type-heading text-primary mt-10 mb-5 border-b border-border pb-2"
                >
                  {headingText}
                </h2>
              );
            }
            if (block.level === 3) {
              return (
                <h3 key={index} className="type-subheading text-primary mt-8 mb-4">
                  {headingText}
                </h3>
              );
            }
            return (
              <h4 key={index} className="type-subheading text-muted mt-6 mb-3">
                {headingText}
              </h4>
            );
          }
          case 'blockquote':
            return (
              <blockquote
                key={index}
                className="border-l-4 border-border pl-4 py-1 my-6 italic text-muted bg-surface/50 p-4"
              >
                {parseInlineStyles(text)}
              </blockquote>
            );
          case 'bullet-list':
            return (
              <ul key={index} className="my-6 space-y-2">
                {block.lines.map((line, li) => (
                  <li key={li} className="flex items-start gap-3 text-primary">
                    <span className="mt-1.5 w-1.5 h-1.5 bg-accent rounded-full shrink-0" />
                    <span>{parseInlineStyles(line)}</span>
                  </li>
                ))}
              </ul>
            );
          case 'number-list':
            return (
              <ol key={index} className="my-6 space-y-2 list-decimal list-inside text-primary">
                {block.lines.map((line, li) => (
                  <li key={li} className="pl-2">
                    {parseInlineStyles(line)}
                  </li>
                ))}
              </ol>
            );
          case 'callout': {
            const tone = block.tone || 'info';
            const config = calloutConfig[tone] || calloutConfig.info;
            const Icon = config.icon;
            const calloutText = block.lines.join('\n'); // Preserve line breaks inside callouts if any
            return (
              <div key={index} className={`my-6 p-4 ${config.bg} border-l-4 ${config.border}`}>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 sm:block">
                    <Icon
                      aria-hidden="true"
                      className={`${config.labelColor} shrink-0`}
                      size={16}
                    />
                    <p className={`font-bold ${config.labelColor} uppercase text-2xs sm:hidden`}>
                      {config.label}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`font-bold ${config.labelColor} mb-1 uppercase text-2xs hidden sm:block`}
                    >
                      {config.label}
                    </p>
                    <p className="type-body text-primary">{parseInlineStyles(calloutText)}</p>
                  </div>
                </div>
              </div>
            );
          }
          case 'checklist':
            if (renderChecklist) {
              return <React.Fragment key={index}>{renderChecklist(block)}</React.Fragment>;
            }
            return (
              <PostChecklist
                key={index}
                title={block.title || 'Checklist'}
                items={parseChecklistLines(block.lines)}
              />
            );
          case 'image':
            return (
              <figure key={index} className="my-8 border border-border bg-surface">
                <img
                  src={block.src}
                  alt={text}
                  loading="lazy"
                  decoding="async"
                  className="block w-full h-auto"
                />
              </figure>
            );
          case 'link-card': {
            const meta = Object.fromEntries(
              block.lines
                .map((l) => l.match(/^\s*(\w+):\s*(.*)$/))
                .filter((m): m is RegExpMatchArray => m !== null)
                .map((m) => [m[1], m[2].trim()]),
            );
            const host = block.src ? new URL(block.src).hostname.replace(/^www\./, '') : '';
            return (
              <a
                key={index}
                href={block.src}
                target="_blank"
                rel="noopener noreferrer"
                className="group my-8 block border border-border bg-surface no-underline hover:border-accent transition-colors duration-base"
              >
                {meta.image && (
                  <img
                    src={meta.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width={1200}
                    height={600}
                    className="block w-full h-auto border-b border-border"
                  />
                )}
                <span className="block px-4 py-3">
                  <span className="block font-mono text-xs text-muted">{host}</span>
                  <span className="block text-primary font-semibold mt-1 group-hover:text-accent">
                    {meta.title || block.src}
                  </span>
                  {meta.description && (
                    <span className="block text-muted text-sm mt-1">{meta.description}</span>
                  )}
                </span>
              </a>
            );
          }
          case 'code-block': {
            const codeContent = block.lines.join('\n');
            return (
              <div key={index} className="my-6 bg-surface border border-border overflow-hidden">
                {(block.filename || block.language) && (
                  <div className="px-4 py-2 border-b border-border flex items-center gap-2 text-xs text-muted font-mono">
                    {block.filename && <span>{block.filename}</span>}
                    {block.filename && block.language && <span className="text-border">|</span>}
                    {block.language && block.language !== 'plaintext' && (
                      <span>{block.language}</span>
                    )}
                  </div>
                )}
                <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
                  <code className="text-accent font-mono whitespace-pre">{codeContent}</code>
                </pre>
              </div>
            );
          }
          default:
            return null;
        }
      })}
    </>
  );
};

export const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => (
  <MarkdownBlocks blocks={parseMarkdown(content)} />
);
