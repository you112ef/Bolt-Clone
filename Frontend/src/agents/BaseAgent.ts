import { Agent, AgentRequest, AgentResponse, AgentType } from '../types/agents';

export abstract class BaseAgent implements Agent {
  abstract type: AgentType;
  abstract name: string;
  abstract description: string;

  constructor() {}

  abstract process(request: AgentRequest): Promise<AgentResponse>;

  abstract canHandle(request: AgentRequest): boolean;

  // Helper method to create successful response
  protected createSuccessResponse(
    result: any,
    suggestions?: string[],
    actions?: any[]
  ): AgentResponse {
    return {
      success: true,
      result,
      suggestions,
      actions
    };
  }

  // Helper method to create error response
  protected createErrorResponse(
    error: string,
    suggestions?: string[]
  ): AgentResponse {
    return {
      success: false,
      error,
      suggestions
    };
  }

  // Helper method to extract code language from context
  protected getLanguageFromContext(request: AgentRequest): string {
    if (request.context.currentFile) {
      const extension = request.context.currentFile.split('.').pop()?.toLowerCase();
      
      switch (extension) {
        case 'js':
        case 'jsx':
          return 'javascript';
        case 'ts':
        case 'tsx':
          return 'typescript';
        case 'py':
          return 'python';
        case 'java':
          return 'java';
        case 'cpp':
        case 'cc':
        case 'cxx':
          return 'cpp';
        case 'c':
          return 'c';
        case 'h':
          return 'c';
        case 'cs':
          return 'csharp';
        case 'php':
          return 'php';
        case 'rb':
          return 'ruby';
        case 'go':
          return 'go';
        case 'rs':
          return 'rust';
        case 'swift':
          return 'swift';
        case 'kt':
          return 'kotlin';
        case 'scala':
          return 'scala';
        case 'dart':
          return 'dart';
        case 'vue':
          return 'vue';
        case 'html':
          return 'html';
        case 'css':
          return 'css';
        case 'scss':
        case 'sass':
          return 'scss';
        case 'json':
          return 'json';
        case 'xml':
          return 'xml';
        case 'md':
          return 'markdown';
        case 'sh':
        case 'bash':
          return 'bash';
        case 'sql':
          return 'sql';
        default:
          return 'text';
      }
    }
    
    return 'text';
  }

  // Helper method to validate if text appears to be code
  protected isValidCode(text: string): boolean {
    if (!text || text.trim().length === 0) {
      return false;
    }

    // Check for common code patterns
    const codePatterns = [
      /function\s+\w+\s*\(/,
      /class\s+\w+/,
      /interface\s+\w+/,
      /import\s+.+from/,
      /export\s+(default\s+)?/,
      /const\s+\w+\s*=/,
      /let\s+\w+\s*=/,
      /var\s+\w+\s*=/,
      /\w+\s*:\s*\w+/,
      /\{\s*[\w\s:,]*\}/,
      /\[\s*[\w\s,]*\]/,
      /\/\/.+|\/\*[\s\S]*?\*\//,
      /^\s*<\w+/m,
      /^\s*#include/m,
      /^\s*package\s+/m
    ];

    return codePatterns.some(pattern => pattern.test(text));
  }

  // Helper method to format code with proper indentation
  protected formatCode(code: string, language: string): string {
    // Basic formatting - in a real implementation, you might use a proper formatter
    const lines = code.split('\n');
    let indentLevel = 0;
    const formatted: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (!trimmed) {
        formatted.push('');
        continue;
      }

      // Decrease indent for closing braces
      if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      // Add the line with proper indentation
      const indent = '  '.repeat(indentLevel);
      formatted.push(indent + trimmed);

      // Increase indent for opening braces
      if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
        indentLevel++;
      }
    }

    return formatted.join('\n');
  }

  // Helper method to extract function/class names from code
  protected extractCodeStructure(code: string): {
    functions: string[];
    classes: string[];
    interfaces: string[];
    variables: string[];
  } {
    const structure = {
      functions: [] as string[],
      classes: [] as string[],
      interfaces: [] as string[],
      variables: [] as string[]
    };

    const lines = code.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Extract functions
      const functionMatch = trimmed.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
      if (functionMatch) {
        structure.functions.push(functionMatch[1]);
      }

      // Extract arrow functions
      const arrowFunctionMatch = trimmed.match(/(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(/);
      if (arrowFunctionMatch) {
        structure.functions.push(arrowFunctionMatch[1]);
      }

      // Extract classes
      const classMatch = trimmed.match(/(?:export\s+)?class\s+(\w+)/);
      if (classMatch) {
        structure.classes.push(classMatch[1]);
      }

      // Extract interfaces
      const interfaceMatch = trimmed.match(/(?:export\s+)?interface\s+(\w+)/);
      if (interfaceMatch) {
        structure.interfaces.push(interfaceMatch[1]);
      }

      // Extract variables
      const variableMatch = trimmed.match(/(?:export\s+)?(?:const|let|var)\s+(\w+)/);
      if (variableMatch) {
        structure.variables.push(variableMatch[1]);
      }
    }

    return structure;
  }
}