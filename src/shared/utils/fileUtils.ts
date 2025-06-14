/**
 * Shared file utilities
 * Eliminates duplication of formatFileSize across 4 files
 */

export function formatFileSize(size?: number): string {
  if (size === undefined) return '~';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
} 