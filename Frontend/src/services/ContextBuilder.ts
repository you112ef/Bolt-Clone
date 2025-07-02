import { AIContext, FileNode, ActivityItem } from '../types/agents';
import { FileItem } from '../types';

export class ContextBuilder {
  private static instance: ContextBuilder;
  private recentActivity: ActivityItem[] = [];
  private maxActivityItems = 50;

  static getInstance(): ContextBuilder {
    if (!ContextBuilder.instance) {
      ContextBuilder.instance = new ContextBuilder();
    }
    return ContextBuilder.instance;
  }

  // Build comprehensive context for AI agents
  buildContext(options: {
    currentFile?: string;
    selectedText?: string;
    cursorPosition?: { line: number; column: number };
    openTabs?: string[];
    files?: FileItem[];
    unsavedChanges?: Record<string, string>;
  }): AIContext {
    const {
      currentFile,
      selectedText,
      cursorPosition,
      openTabs,
      files,
      unsavedChanges
    } = options;

    return {
      currentFile,
      selectedText,
      cursorPosition,
      openTabs: openTabs || [],
      unsavedChanges: unsavedChanges || {},
      projectStructure: files ? this.buildProjectStructure(files) : [],
      recentActivity: [...this.recentActivity].reverse().slice(0, 10)
    };
  }

  // Convert FileItem[] to FileNode[] with dependency analysis
  private buildProjectStructure(files: FileItem[]): FileNode[] {
    const processFile = (file: FileItem): FileNode => {
      const node: FileNode = {
        path: file.path,
        name: file.name,
        type: file.type,
        lastModified: Date.now()
      };

      if (file.type === 'file' && file.content) {
        node.size = file.content.length;
        
        // Analyze dependencies for code files
        if (this.isCodeFile(file.name)) {
          const analysis = this.analyzeCodeDependencies(file.content);
          node.imports = analysis.imports;
          node.exports = analysis.exports;
          node.dependencies = analysis.dependencies;
        }
      }

      return node;
    };

    const flattenFiles = (files: FileItem[]): FileNode[] => {
      const result: FileNode[] = [];
      
      for (const file of files) {
        result.push(processFile(file));
        
        if (file.type === 'folder' && file.children) {
          result.push(...flattenFiles(file.children));
        }
      }
      
      return result;
    };

    return flattenFiles(files);
  }

  // Analyze code dependencies (imports/exports)
  private analyzeCodeDependencies(content: string): {
    imports: string[];
    exports: string[];
    dependencies: string[];
  } {
    const imports: string[] = [];
    const exports: string[] = [];
    const dependencies: string[] = [];

    // Match ES6 imports
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"`]([^'"`]+)['"`]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      imports.push(importPath);
      
      if (!importPath.startsWith('.')) {
        dependencies.push(importPath.split('/')[0]);
      }
    }

    // Match CommonJS requires
    const requireRegex = /require\(['"`]([^'"`]+)['"`]\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      const requirePath = match[1];
      imports.push(requirePath);
      
      if (!requirePath.startsWith('.')) {
        dependencies.push(requirePath.split('/')[0]);
      }
    }

    // Match exports
    const exportRegex = /export\s+(?:default\s+)?(?:const\s+|let\s+|var\s+|function\s+|class\s+)?(\w+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    return {
      imports: [...new Set(imports)],
      exports: [...new Set(exports)],
      dependencies: [...new Set(dependencies)]
    };
  }

  // Check if file is a code file based on extension
  private isCodeFile(filename: string): boolean {
    const codeExtensions = [
      'js', 'jsx', 'ts', 'tsx', 'vue', 'py', 'java', 'cpp', 'c', 'h',
      'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'dart'
    ];
    
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? codeExtensions.includes(extension) : false;
  }

  // Track user activity for context
  addActivity(activity: Omit<ActivityItem, 'timestamp'>): void {
    this.recentActivity.push({
      ...activity,
      timestamp: Date.now()
    });

    // Keep only recent activities
    if (this.recentActivity.length > this.maxActivityItems) {
      this.recentActivity = this.recentActivity.slice(-this.maxActivityItems);
    }
  }

  // Get activity summary for context
  getActivitySummary(): string {
    if (this.recentActivity.length === 0) {
      return 'No recent activity';
    }

    const recent = this.recentActivity.slice(-5);
    const summary = recent.map(activity => {
      switch (activity.type) {
        case 'file_opened':
          return `Opened file: ${activity.data.filename}`;
        case 'text_selected':
          return `Selected text: "${activity.data.text?.substring(0, 50)}..."`;
        case 'code_edited':
          return `Edited ${activity.data.filename}`;
        case 'search_performed':
          return `Searched for: "${activity.data.query}"`;
        default:
          return `${activity.type}`;
      }
    }).join('\n');

    return summary;
  }

  // Clear old activity
  clearOldActivity(olderThan: number = 1000 * 60 * 60): void {
    const cutoff = Date.now() - olderThan;
    this.recentActivity = this.recentActivity.filter(
      activity => activity.timestamp > cutoff
    );
  }

  // Get context for specific code selection
  getSelectionContext(
    selectedText: string,
    cursorPosition: { line: number; column: number },
    fileContent: string
  ): string {
    const lines = fileContent.split('\n');
    const startLine = Math.max(0, cursorPosition.line - 5);
    const endLine = Math.min(lines.length - 1, cursorPosition.line + 5);
    
    const contextLines = lines.slice(startLine, endLine + 1);
    const contextWithNumbers = contextLines.map((line, index) => {
      const lineNumber = startLine + index + 1;
      const isCurrentLine = lineNumber === cursorPosition.line + 1;
      const prefix = isCurrentLine ? '>>>' : '   ';
      return `${prefix} ${lineNumber.toString().padStart(3, ' ')}: ${line}`;
    });

    return contextWithNumbers.join('\n');
  }
}