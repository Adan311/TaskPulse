import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Simple markdown parser for basic formatting
  const parseMarkdown = (text: string) => {
    // Convert **bold** to <strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert *italic* to <em>
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert `code` to <code>
    text = text.replace(/`(.*?)`/g, '<code class="bg-accent px-1 py-0.5 rounded text-sm font-mono">$1</code>');
    
    // Convert ## Heading to h2
    text = text.replace(/^## (.*$)/gm, '<h2 class="text-lg font-bold mb-2">$1</h2>');
    
    // Convert # Heading to h1
    text = text.replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold mb-2">$1</h1>');
    
    // Convert - list items to ul/li
    text = text.replace(/^- (.*$)/gm, '<li class="mb-1">$1</li>');
    text = text.replace(/(<li.*<\/li>)/s, '<ul class="mb-2 pl-4 list-disc">$1</ul>');
    
    // Convert numbered lists
    text = text.replace(/^\d+\. (.*$)/gm, '<li class="mb-1">$1</li>');
    
    // Convert line breaks to paragraphs
    const lines = text.split('\n');
    const processedLines = lines.map(line => {
      if (line.trim() === '') return '';
      if (line.includes('<h1>') || line.includes('<h2>') || line.includes('<ul>') || line.includes('<li>')) {
        return line;
      }
      return `<p class="mb-2 last:mb-0">${line}</p>`;
    });
    
    return processedLines.join('\n');
  };

  const processedContent = parseMarkdown(content);

  return (
    <div 
      className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}; 