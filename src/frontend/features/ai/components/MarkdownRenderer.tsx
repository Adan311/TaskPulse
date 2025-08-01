import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Simple markdown parser for basic formatting
  const parseMarkdown = (text: string) => {
    // Convert **bold** to <strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    
    // Convert *italic* to <em>
    text = text.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    
    // Convert `code` to <code>
    text = text.replace(/`(.*?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
    
    // Convert ## Heading to h2
    text = text.replace(/^## (.*$)/gm, '<h2 class="text-base font-semibold mb-2 text-foreground">$1</h2>');
    
    // Convert # Heading to h1
    text = text.replace(/^# (.*$)/gm, '<h1 class="text-lg font-semibold mb-2 text-foreground">$1</h1>');
    
    // Convert - list items to ul/li
    text = text.replace(/^- (.*$)/gm, '<li class="mb-1 leading-relaxed">$1</li>');
    text = text.replace(/(<li.*<\/li>)/s, '<ul class="mb-3 pl-4 space-y-1 list-disc list-inside">$1</ul>');
    
    // Convert numbered lists
    text = text.replace(/^\d+\. (.*$)/gm, '<li class="mb-1 leading-relaxed">$1</li>');
    
    // Convert line breaks to paragraphs
    const lines = text.split('\n');
    const processedLines = lines.map(line => {
      if (line.trim() === '') return '';
      if (line.includes('<h1>') || line.includes('<h2>') || line.includes('<ul>') || line.includes('<li>')) {
        return line;
      }
      return `<p class="mb-3 last:mb-0 leading-relaxed">${line}</p>`;
    });
    
    return processedLines.join('\n');
  };

  const processedContent = parseMarkdown(content);

  return (
    <div 
      className="prose prose-sm max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
} 