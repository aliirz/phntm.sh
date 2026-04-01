/**
 * File type categorization for trust signals and contextual icons
 */

export type FileCategory = 
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'pdf'
  | 'image'
  | 'video'
  | 'audio'
  | 'archive'
  | 'code'
  | 'executable'
  | 'unknown';

export type FileInfo = {
  category: FileCategory;
  icon: 'file-text' | 'file-spreadsheet' | 'file-presentation' | 'file-image' | 'file-video' | 'file-audio' | 'archive' | 'code' | 'alert-triangle' | 'file';
  description: string;
  isSuspicious: boolean;
  warning?: string;
};

const EXTENSION_MAP: Record<string, FileInfo> = {
  // Documents
  'doc': { category: 'document', icon: 'file-text', description: 'Word document', isSuspicious: false },
  'docx': { category: 'document', icon: 'file-text', description: 'Word document', isSuspicious: false },
  'txt': { category: 'document', icon: 'file-text', description: 'Text file', isSuspicious: false },
  'rtf': { category: 'document', icon: 'file-text', description: 'Rich text document', isSuspicious: false },
  'odt': { category: 'document', icon: 'file-text', description: 'OpenDocument text', isSuspicious: false },
  
  // Spreadsheets
  'xls': { category: 'spreadsheet', icon: 'file-spreadsheet', description: 'Excel spreadsheet', isSuspicious: false },
  'xlsx': { category: 'spreadsheet', icon: 'file-spreadsheet', description: 'Excel spreadsheet', isSuspicious: false },
  'csv': { category: 'spreadsheet', icon: 'file-spreadsheet', description: 'CSV data file', isSuspicious: false },
  'ods': { category: 'spreadsheet', icon: 'file-spreadsheet', description: 'OpenDocument spreadsheet', isSuspicious: false },
  
  // Presentations
  'ppt': { category: 'presentation', icon: 'file-presentation', description: 'PowerPoint presentation', isSuspicious: false },
  'pptx': { category: 'presentation', icon: 'file-presentation', description: 'PowerPoint presentation', isSuspicious: false },
  'odp': { category: 'presentation', icon: 'file-presentation', description: 'OpenDocument presentation', isSuspicious: false },
  
  // PDF
  'pdf': { category: 'pdf', icon: 'file-text', description: 'PDF document', isSuspicious: false },
  
  // Images
  'jpg': { category: 'image', icon: 'file-image', description: 'JPEG image', isSuspicious: false },
  'jpeg': { category: 'image', icon: 'file-image', description: 'JPEG image', isSuspicious: false },
  'png': { category: 'image', icon: 'file-image', description: 'PNG image', isSuspicious: false },
  'gif': { category: 'image', icon: 'file-image', description: 'GIF image', isSuspicious: false },
  'webp': { category: 'image', icon: 'file-image', description: 'WebP image', isSuspicious: false },
  'svg': { category: 'image', icon: 'file-image', description: 'SVG image', isSuspicious: false },
  'bmp': { category: 'image', icon: 'file-image', description: 'Bitmap image', isSuspicious: false },
  
  // Video
  'mp4': { category: 'video', icon: 'file-video', description: 'MP4 video', isSuspicious: false },
  'mov': { category: 'video', icon: 'file-video', description: 'QuickTime video', isSuspicious: false },
  'avi': { category: 'video', icon: 'file-video', description: 'AVI video', isSuspicious: false },
  'mkv': { category: 'video', icon: 'file-video', description: 'Matroska video', isSuspicious: false },
  'webm': { category: 'video', icon: 'file-video', description: 'WebM video', isSuspicious: false },
  
  // Audio
  'mp3': { category: 'audio', icon: 'file-audio', description: 'MP3 audio', isSuspicious: false },
  'wav': { category: 'audio', icon: 'file-audio', description: 'WAV audio', isSuspicious: false },
  'ogg': { category: 'audio', icon: 'file-audio', description: 'OGG audio', isSuspicious: false },
  'flac': { category: 'audio', icon: 'file-audio', description: 'FLAC audio', isSuspicious: false },
  'm4a': { category: 'audio', icon: 'file-audio', description: 'M4A audio', isSuspicious: false },
  
  // Archives
  'zip': { category: 'archive', icon: 'archive', description: 'ZIP archive', isSuspicious: false },
  'tar': { category: 'archive', icon: 'archive', description: 'TAR archive', isSuspicious: false },
  'gz': { category: 'archive', icon: 'archive', description: 'GZIP archive', isSuspicious: false },
  'rar': { category: 'archive', icon: 'archive', description: 'RAR archive', isSuspicious: false },
  '7z': { category: 'archive', icon: 'archive', description: '7-Zip archive', isSuspicious: false },
  
  // Code
  'js': { category: 'code', icon: 'code', description: 'JavaScript file', isSuspicious: false },
  'ts': { category: 'code', icon: 'code', description: 'TypeScript file', isSuspicious: false },
  'py': { category: 'code', icon: 'code', description: 'Python script', isSuspicious: false },
  'java': { category: 'code', icon: 'code', description: 'Java source', isSuspicious: false },
  'go': { category: 'code', icon: 'code', description: 'Go source', isSuspicious: false },
  'rs': { category: 'code', icon: 'code', description: 'Rust source', isSuspicious: false },
  'c': { category: 'code', icon: 'code', description: 'C source', isSuspicious: false },
  'cpp': { category: 'code', icon: 'code', description: 'C++ source', isSuspicious: false },
  'h': { category: 'code', icon: 'code', description: 'C/C++ header', isSuspicious: false },
  'json': { category: 'code', icon: 'code', description: 'JSON data', isSuspicious: false },
  'xml': { category: 'code', icon: 'code', description: 'XML data', isSuspicious: false },
  'yaml': { category: 'code', icon: 'code', description: 'YAML data', isSuspicious: false },
  'yml': { category: 'code', icon: 'code', description: 'YAML data', isSuspicious: false },
  'md': { category: 'code', icon: 'code', description: 'Markdown document', isSuspicious: false },
  'html': { category: 'code', icon: 'code', description: 'HTML document', isSuspicious: false },
  'css': { category: 'code', icon: 'code', description: 'CSS stylesheet', isSuspicious: false },
  
  // Executables (suspicious)
  'exe': { 
    category: 'executable', 
    icon: 'alert-triangle', 
    description: 'Windows executable', 
    isSuspicious: true,
    warning: 'This is a Windows program. Only download if you trust the sender.'
  },
  'bat': { 
    category: 'executable', 
    icon: 'alert-triangle', 
    description: 'Windows batch script', 
    isSuspicious: true,
    warning: 'This is a Windows script. Only download if you trust the sender.'
  },
  'cmd': { 
    category: 'executable', 
    icon: 'alert-triangle', 
    description: 'Windows command script', 
    isSuspicious: true,
    warning: 'This is a Windows script. Only download if you trust the sender.'
  },
  'ps1': { 
    category: 'executable', 
    icon: 'alert-triangle', 
    description: 'PowerShell script', 
    isSuspicious: true,
    warning: 'This is a PowerShell script. Only download if you trust the sender.'
  },
  'vbs': { 
    category: 'executable', 
    icon: 'alert-triangle', 
    description: 'VBScript file', 
    isSuspicious: true,
    warning: 'This is a script. Only download if you trust the sender.'
  },
  'sh': { 
    category: 'executable', 
    icon: 'alert-triangle', 
    description: 'Shell script', 
    isSuspicious: true,
    warning: 'This is a shell script. Only download if you trust the sender.'
  },
  'bash': { 
    category: 'executable', 
    icon: 'alert-triangle', 
    description: 'Bash script', 
    isSuspicious: true,
    warning: 'This is a shell script. Only download if you trust the sender.'
  },
  'app': { 
    category: 'executable', 
    icon: 'alert-triangle', 
    description: 'macOS application', 
    isSuspicious: true,
    warning: 'This is a macOS app. Only download if you trust the sender.'
  },
  'dmg': { 
    category: 'executable', 
    icon: 'alert-triangle', 
    description: 'macOS disk image', 
    isSuspicious: true,
    warning: 'This is a macOS installer. Only download if you trust the sender.'
  },
  'scr': { 
    category: 'executable', 
    icon: 'alert-triangle', 
    description: 'Windows screensaver', 
    isSuspicious: true,
    warning: 'This is a Windows screensaver. Only download if you trust the sender.'
  },
  'msi': { 
    category: 'executable', 
    icon: 'alert-triangle', 
    description: 'Windows installer', 
    isSuspicious: true,
    warning: 'This is a Windows installer. Only download if you trust the sender.'
  },
};

/**
 * Get file info from filename
 */
export function getFileInfo(fileName: string): FileInfo {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return EXTENSION_MAP[ext] || { 
    category: 'unknown', 
    icon: 'file', 
    description: 'File', 
    isSuspicious: false 
  };
}