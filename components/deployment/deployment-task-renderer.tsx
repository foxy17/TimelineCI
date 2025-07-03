'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DeploymentTaskRendererProps {
  content: string;
  maxLines?: number;
}

export function DeploymentTaskRenderer({ content, maxLines = 5 }: DeploymentTaskRendererProps) {
  // Check if content has more than maxLines
  const lines = content.split('\n');
  const isLong = lines.length > maxLines;
  const truncatedContent = isLong ? lines.slice(0, maxLines).join('\n') : content;

  return (
    <div className="prose prose-xs max-w-none prose-slate break-words overflow-wrap-anywhere">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-1 last:mb-0 text-xs leading-relaxed break-words">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-1 last:mb-0 ml-3 list-disc text-xs break-words">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-1 last:mb-0 ml-3 list-decimal text-xs break-words">{children}</ol>
          ),
          li: ({ children }) => <li className="mb-0.5 text-xs break-words">{children}</li>,
          code: ({ children }) => (
            <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono break-all">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-gray-100 p-1 rounded text-xs font-mono overflow-x-auto break-all">
              {children}
            </pre>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-xs break-words">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-xs break-words">{children}</em>,
          del: ({ children }) => <del className="line-through text-xs break-words">{children}</del>,
          h1: ({ children }) => <h1 className="text-sm font-bold mb-1 break-words">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xs font-bold mb-1 break-words">{children}</h2>,
          h3: ({ children }) => (
            <h3 className="text-xs font-bold mb-0.5 break-words">{children}</h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-gray-300 pl-2 italic text-xs break-words">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-blue-600 hover:text-blue-800 underline underline-offset-1 text-xs break-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {truncatedContent}
      </ReactMarkdown>
      {isLong && (
        <div className="text-xs text-gray-500 mt-1 break-words">
          ...and {lines.length - maxLines} more lines
        </div>
      )}
    </div>
  );
}

export function getTaskLineCount(content: string): number {
  return content.split('\n').length;
}
