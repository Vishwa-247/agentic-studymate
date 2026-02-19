import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContentRendererProps {
  content: string;
}

const CodeBlock = ({ language, value }: { language: string; value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      <Button
        onClick={handleCopy}
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 mr-1" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </>
        )}
      </Button>
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          padding: '1rem',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

export const ContentRenderer = ({ content }: ContentRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Check if content is HTML (starts with < or contains HTML tags)
  // Also check if it contains HTML tags even if there's text before them
  const trimmedContent = content.trim();
  const isHTML = trimmedContent.startsWith('<') || 
                  /^<[a-z][\s\S]*>/.test(trimmedContent) ||
                  /<[a-z]+[^>]*>[\s\S]*<\/[a-z]+>/i.test(trimmedContent);
  
  // If content contains HTML tags, extract and render only the HTML part
  let htmlContent = trimmedContent;
  if (isHTML && !trimmedContent.startsWith('<')) {
    // Extract HTML portion (everything from first < to last >)
    const htmlMatch = trimmedContent.match(/<[\s\S]*>/);
    if (htmlMatch) {
      htmlContent = htmlMatch[0];
    }
  }
  
  // Add copy buttons to code blocks after rendering
  useEffect(() => {
    if (!containerRef.current || !isHTML) return;
    
    const codeBlocks = containerRef.current.querySelectorAll('pre code');
    codeBlocks.forEach((codeElement) => {
      const pre = codeElement.parentElement;
      if (!pre || pre.classList.contains('has-copy-button')) return;
      
      pre.classList.add('has-copy-button', 'relative', 'group');
      
      const copyButton = document.createElement('button');
      copyButton.className = 'absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-card text-foreground px-3 py-1.5 rounded-md border border-border text-xs font-medium flex items-center gap-1.5 hover:bg-muted';
      copyButton.innerHTML = `
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
        <span>Copy</span>
      `;
      
      const codeText = codeElement.textContent || '';
      let copied = false;
      
      copyButton.addEventListener('click', async () => {
        await navigator.clipboard.writeText(codeText);
        copied = true;
        copyButton.innerHTML = `
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>Copied</span>
        `;
        setTimeout(() => {
          copied = false;
          copyButton.innerHTML = `
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
            <span>Copy</span>
          `;
        }, 2000);
      });
      
      pre.appendChild(copyButton);
    });
  }, [content, isHTML]);
  
  if (isHTML) {
    const sanitizedHTML = DOMPurify.sanitize(htmlContent, {
      // Keep a conservative set of tags/attrs since this content can be AI-produced.
      ALLOWED_TAGS: [
        'h1','h2','h3','h4','h5','h6',
        'p','br','hr',
        'ul','ol','li',
        'strong','em','b','i',
        'code','pre',
        'a',
        'blockquote',
        'table','thead','tbody','tr','th','td',
        'span','div',
        'img',
      ],
      ALLOWED_ATTR: ['href','title','target','rel','class','src','alt'],
      ALLOW_DATA_ATTR: false,
    });

    // Render sanitized HTML with proper styling
    return (
      <div
        ref={containerRef}
        className="prose prose-slate max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
      />
    );
  }
  
  // Fallback to markdown for old content
  return (
    <div className="prose prose-slate max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const value = String(children).replace(/\n$/, '');
            const inline = !match;
            
            return !inline && match ? (
              <CodeBlock language={match[1]} value={value} />
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          img({ src, alt }) {
            // Handle placeholder images
            if (src === 'placeholder') {
              return (
                <div className="my-6 p-8 bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center text-center">
                  <div>
                    <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground font-medium">{alt}</p>
                  </div>
                </div>
              );
            }
            return <img src={src} alt={alt} className="rounded-lg" />;
          },
          table({ children }) {
            return (
              <div className="my-6 overflow-x-auto">
                <table className="w-full border-collapse">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border border-border bg-muted px-4 py-2 text-left font-semibold">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border border-border px-4 py-2">
                {children}
              </td>
            );
          },
          h1({ children }) {
            return <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-2xl font-bold mt-6 mb-3">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-xl font-semibold mt-4 mb-2">{children}</h3>;
          },
          p({ children }) {
            return <p className="my-4 leading-7">{children}</p>;
          },
          ul({ children }) {
            return <ul className="my-4 ml-6 list-disc">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="my-4 ml-6 list-decimal">{children}</ol>;
          },
          li({ children }) {
            return <li className="my-2">{children}</li>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
