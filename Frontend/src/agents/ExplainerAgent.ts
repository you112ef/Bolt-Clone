import { BaseAgent } from './BaseAgent';
import { AgentRequest, AgentResponse, AgentType } from '../types/agents';

export class ExplainerAgent extends BaseAgent {
  type: AgentType = 'explainer';
  name = 'Code Explainer';
  description = 'Analyzes and explains code functionality, patterns, and structure';

  canHandle(request: AgentRequest): boolean {
    return request.type === 'explainer' && 
           (!!request.context.selectedText || !!request.context.currentFile);
  }

  async process(request: AgentRequest): Promise<AgentResponse> {
    try {
      const { selectedText, currentFile } = request.context;
      const codeToExplain = selectedText || request.input;

      if (!codeToExplain) {
        return this.createErrorResponse(
          'No code selected or provided to explain',
          ['Select some code in the editor', 'Provide code in your request']
        );
      }

      const language = this.getLanguageFromContext(request);
      const explanation = this.generateExplanation(codeToExplain, language, currentFile);

      return this.createSuccessResponse(
        explanation,
        [
          'You can ask follow-up questions about this code',
          'Try selecting a specific function or class for detailed analysis',
          'Use the refactor agent to improve this code'
        ]
      );
    } catch (error) {
      return this.createErrorResponse(
        `Failed to explain code: ${error}`,
        ['Try selecting a smaller code snippet', 'Ensure the code is valid']
      );
    }
  }

  private generateExplanation(code: string, language: string, filename?: string): {
    summary: string;
    structure: any;
    patterns: string[];
    complexity: string;
    suggestions: string[];
  } {
    const structure = this.extractCodeStructure(code);
    const patterns = this.identifyPatterns(code, language);
    const complexity = this.assessComplexity(code);
    const summary = this.generateSummary(code, language, structure);
    const suggestions = this.generateSuggestions(code, language, structure);

    return {
      summary,
      structure,
      patterns,
      complexity,
      suggestions
    };
  }

  private generateSummary(code: string, language: string, structure: any): string {
    const lines = code.split('\n').length;
    const { functions, classes, interfaces, variables } = structure;

    let summary = `This ${language} code snippet contains ${lines} lines`;

    if (functions.length > 0) {
      summary += ` and defines ${functions.length} function(s): ${functions.join(', ')}`;
    }

    if (classes.length > 0) {
      summary += ` and ${classes.length} class(es): ${classes.join(', ')}`;
    }

    if (interfaces.length > 0) {
      summary += ` and ${interfaces.length} interface(s): ${interfaces.join(', ')}`;
    }

    if (variables.length > 0) {
      summary += ` and declares ${variables.length} variable(s)`;
    }

    // Analyze the main purpose
    const purpose = this.identifyPurpose(code, language);
    if (purpose) {
      summary += `.\n\nMain purpose: ${purpose}`;
    }

    return summary;
  }

  private identifyPatterns(code: string, language: string): string[] {
    const patterns: string[] = [];

    // Common patterns
    if (code.includes('async') && code.includes('await')) {
      patterns.push('Asynchronous programming with async/await');
    }

    if (code.includes('Promise') || code.includes('.then(')) {
      patterns.push('Promise-based asynchronous operations');
    }

    if (code.includes('useState') || code.includes('useEffect')) {
      patterns.push('React Hooks pattern');
    }

    if (code.includes('class') && code.includes('extends')) {
      patterns.push('Object-oriented inheritance');
    }

    if (code.includes('interface') || code.includes('type')) {
      patterns.push('TypeScript type definitions');
    }

    if (code.includes('try') && code.includes('catch')) {
      patterns.push('Error handling with try-catch');
    }

    if (code.includes('map(') || code.includes('filter(') || code.includes('reduce(')) {
      patterns.push('Functional programming with array methods');
    }

    if (code.includes('export') || code.includes('import')) {
      patterns.push('ES6 modules');
    }

    if (code.includes('useState') && code.includes('useEffect')) {
      patterns.push('React component with state management');
    }

    if (code.includes('const') && code.includes('=>')) {
      patterns.push('Arrow functions and const declarations');
    }

    if (code.includes('?.') || code.includes('??')) {
      patterns.push('Optional chaining and nullish coalescing');
    }

    return patterns;
  }

  private assessComplexity(code: string): string {
    const lines = code.split('\n').filter(line => line.trim()).length;
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(code);
    
    let assessment = '';
    
    if (lines < 10) {
      assessment = 'Low complexity - Simple and easy to understand';
    } else if (lines < 50) {
      assessment = 'Medium complexity - Moderate size with manageable logic';
    } else {
      assessment = 'High complexity - Large code block that might benefit from refactoring';
    }

    assessment += `\n\nMetrics:
- Lines of code: ${lines}
- Cyclomatic complexity: ${cyclomaticComplexity}
- Functions: ${(code.match(/function|=>/g) || []).length}
- Conditionals: ${(code.match(/if|switch|case|\?/g) || []).length}
- Loops: ${(code.match(/for|while|forEach|map|filter/g) || []).length}`;

    return assessment;
  }

  private calculateCyclomaticComplexity(code: string): number {
    // Basic cyclomatic complexity calculation
    const conditionalKeywords = ['if', 'else if', 'case', 'catch', 'while', 'for', '&&', '||', '?'];
    let complexity = 1; // Base complexity

    for (const keyword of conditionalKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = code.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private identifyPurpose(code: string, language: string): string {
    // Analyze code to determine its main purpose
    if (code.includes('render') && code.includes('return')) {
      return 'React component that renders UI elements';
    }

    if (code.includes('fetch') || code.includes('axios') || code.includes('XMLHttpRequest')) {
      return 'Makes HTTP requests to external APIs';
    }

    if (code.includes('addEventListener') || code.includes('onClick')) {
      return 'Handles user interface events';
    }

    if (code.includes('localStorage') || code.includes('sessionStorage')) {
      return 'Manages browser storage operations';
    }

    if (code.includes('useState') || code.includes('state')) {
      return 'Manages component state and data';
    }

    if (code.includes('class') && code.includes('constructor')) {
      return 'Defines a class with initialization logic';
    }

    if (code.includes('export') && code.includes('function')) {
      return 'Exports utility functions for reuse';
    }

    if (code.includes('interface') || code.includes('type')) {
      return 'Defines TypeScript type structures';
    }

    if (code.includes('test') || code.includes('expect') || code.includes('describe')) {
      return 'Contains unit tests or test specifications';
    }

    return 'General purpose code logic';
  }

  private generateSuggestions(code: string, language: string, structure: any): string[] {
    const suggestions: string[] = [];

    // General suggestions based on code analysis
    if (code.length > 1000) {
      suggestions.push('Consider breaking this large code block into smaller functions');
    }

    if (!code.includes('const') && code.includes('var')) {
      suggestions.push('Consider using const or let instead of var for better scoping');
    }

    if (code.includes('any') && language === 'typescript') {
      suggestions.push('Try to avoid "any" type and use more specific types');
    }

    if (code.includes('console.log')) {
      suggestions.push('Remove or replace console.log statements in production code');
    }

    if (structure.functions.length > 5) {
      suggestions.push('Consider organizing functions into a class or separate modules');
    }

    if (code.includes('fetch') && !code.includes('catch')) {
      suggestions.push('Add error handling for network requests');
    }

    if (code.includes('async') && !code.includes('try')) {
      suggestions.push('Consider adding try-catch blocks for async operations');
    }

    if (code.includes('innerHTML') || code.includes('dangerouslySetInnerHTML')) {
      suggestions.push('Be cautious with dynamic HTML to prevent XSS vulnerabilities');
    }

    return suggestions;
  }
}