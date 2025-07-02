import { BaseAgent } from './BaseAgent';
import { AgentRequest, AgentResponse, AgentType } from '../types/agents';

interface Bug {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  line?: number;
  column?: number;
  fix?: string;
  suggestion: string;
}

export class FixerAgent extends BaseAgent {
  type: AgentType = 'fixer';
  name = 'Bug Fixer';
  description = 'Detects and fixes common programming bugs and issues';

  canHandle(request: AgentRequest): boolean {
    return request.type === 'fixer' && 
           (!!request.context.selectedText || !!request.context.currentFile);
  }

  async process(request: AgentRequest): Promise<AgentResponse> {
    try {
      const { selectedText, currentFile } = request.context;
      const codeToAnalyze = selectedText || request.input;

      if (!codeToAnalyze) {
        return this.createErrorResponse(
          'No code selected or provided to analyze',
          ['Select some code in the editor', 'Provide code in your request']
        );
      }

      const language = this.getLanguageFromContext(request);
      const analysis = this.analyzeCode(codeToAnalyze, language);

      if (analysis.bugs.length === 0) {
        return this.createSuccessResponse(
          {
            message: 'No obvious bugs detected! The code looks good.',
            codeQuality: analysis.quality,
            suggestions: analysis.improvements
          },
          [
            'Consider running the refactor agent for code improvements',
            'Add unit tests to verify functionality',
            'Check for edge cases and error handling'
          ]
        );
      }

      const fixes = this.generateFixes(codeToAnalyze, analysis.bugs);

      return this.createSuccessResponse(
        {
          bugs: analysis.bugs,
          fixes,
          codeQuality: analysis.quality,
          fixedCode: this.applyFixes(codeToAnalyze, fixes)
        },
        [
          'Review each fix before applying',
          'Test the fixed code thoroughly',
          'Consider adding tests to prevent regressions'
        ],
        analysis.bugs.map(bug => ({
          type: 'edit_code',
          payload: { fix: bug.fix },
          description: bug.suggestion
        }))
      );
    } catch (error) {
      return this.createErrorResponse(
        `Failed to analyze code: ${error}`,
        ['Ensure the code is properly formatted', 'Try analyzing a smaller code snippet']
      );
    }
  }

  private analyzeCode(code: string, language: string): {
    bugs: Bug[];
    quality: string;
    improvements: string[];
  } {
    const bugs: Bug[] = [];
    const improvements: string[] = [];

    // Syntax and structural issues
    bugs.push(...this.detectSyntaxIssues(code, language));
    bugs.push(...this.detectLogicIssues(code, language));
    bugs.push(...this.detectSecurityIssues(code, language));
    bugs.push(...this.detectPerformanceIssues(code, language));
    bugs.push(...this.detectBestPracticeViolations(code, language));

    // Code quality assessment
    const quality = this.assessCodeQuality(code, bugs);
    
    // General improvements
    improvements.push(...this.suggestImprovements(code, language));

    return { bugs, quality, improvements };
  }

  private detectSyntaxIssues(code: string, language: string): Bug[] {
    const bugs: Bug[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmed = line.trim();

      // Missing semicolons (JavaScript/TypeScript)
      if ((language === 'javascript' || language === 'typescript') && 
          trimmed && 
          !trimmed.endsWith(';') && 
          !trimmed.endsWith('{') && 
          !trimmed.endsWith('}') &&
          !trimmed.startsWith('//') &&
          !trimmed.startsWith('if') &&
          !trimmed.startsWith('else') &&
          !trimmed.startsWith('for') &&
          !trimmed.startsWith('while') &&
          !trimmed.includes('return')) {
        bugs.push({
          type: 'missing_semicolon',
          severity: 'low',
          description: 'Missing semicolon',
          line: lineNumber,
          fix: line + ';',
          suggestion: 'Add semicolon at the end of the statement'
        });
      }

      // Unclosed brackets
      const openBrackets = (line.match(/[\{\[\(]/g) || []).length;
      const closeBrackets = (line.match(/[\}\]\)]/g) || []).length;
      
      if (openBrackets > closeBrackets) {
        bugs.push({
          type: 'unclosed_brackets',
          severity: 'high',
          description: 'Unclosed brackets detected',
          line: lineNumber,
          suggestion: 'Check for missing closing brackets'
        });
      }

      // Undefined variables (basic detection)
      const undefinedMatches = line.match(/\b(\w+)\s*(?:=|\.|\[)/g);
      if (undefinedMatches) {
        undefinedMatches.forEach(match => {
          const varName = match.replace(/[=\.\[].*/, '').trim();
          if (varName && !this.isKnownVariable(varName, code) && !this.isBuiltinIdentifier(varName)) {
            bugs.push({
              type: 'potentially_undefined',
              severity: 'medium',
              description: `Potentially undefined variable: ${varName}`,
              line: lineNumber,
              suggestion: `Ensure '${varName}' is defined before use`
            });
          }
        });
      }
    });

    return bugs;
  }

  private detectLogicIssues(code: string, language: string): Bug[] {
    const bugs: Bug[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Infinite loops
      if (line.includes('while(true)') || line.includes('while (true)')) {
        bugs.push({
          type: 'infinite_loop',
          severity: 'critical',
          description: 'Potential infinite loop detected',
          line: lineNumber,
          suggestion: 'Add a break condition or use a finite loop'
        });
      }

      // Assignment in conditions
      if (line.includes('if') && line.includes('=') && !line.includes('==') && !line.includes('!=')) {
        bugs.push({
          type: 'assignment_in_condition',
          severity: 'high',
          description: 'Assignment used in condition instead of comparison',
          line: lineNumber,
          fix: line.replace(/=(?!=)/g, '=='),
          suggestion: 'Use == or === for comparison, not ='
        });
      }

      // Missing break in switch cases
      if (line.includes('case') && !code.includes('break', code.indexOf(line))) {
        bugs.push({
          type: 'missing_break',
          severity: 'medium',
          description: 'Missing break statement in switch case',
          line: lineNumber,
          suggestion: 'Add break statement to prevent fall-through'
        });
      }

      // Comparing with null using ==
      if (line.includes('== null') || line.includes('!= null')) {
        bugs.push({
          type: 'loose_null_comparison',
          severity: 'medium',
          description: 'Loose null comparison',
          line: lineNumber,
          fix: line.replace('== null', '=== null').replace('!= null', '!== null'),
          suggestion: 'Use strict equality (=== or !==) for null comparisons'
        });
      }
    });

    return bugs;
  }

  private detectSecurityIssues(code: string, language: string): Bug[] {
    const bugs: Bug[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // eval() usage
      if (line.includes('eval(')) {
        bugs.push({
          type: 'eval_usage',
          severity: 'critical',
          description: 'Use of eval() function',
          line: lineNumber,
          suggestion: 'Avoid eval() as it can execute arbitrary code'
        });
      }

      // innerHTML with user input
      if (line.includes('innerHTML') && (line.includes('input') || line.includes('params'))) {
        bugs.push({
          type: 'xss_vulnerability',
          severity: 'high',
          description: 'Potential XSS vulnerability',
          line: lineNumber,
          suggestion: 'Sanitize user input before using innerHTML'
        });
      }

      // Hardcoded credentials
      const credentialPatterns = [
        /password\s*=\s*['"]\w+['"]/i,
        /api[_-]?key\s*=\s*['"]\w+['"]/i,
        /secret\s*=\s*['"]\w+['"]/i
      ];

      credentialPatterns.forEach(pattern => {
        if (pattern.test(line)) {
          bugs.push({
            type: 'hardcoded_credentials',
            severity: 'critical',
            description: 'Hardcoded credentials detected',
            line: lineNumber,
            suggestion: 'Move credentials to environment variables'
          });
        }
      });
    });

    return bugs;
  }

  private detectPerformanceIssues(code: string, language: string): Bug[] {
    const bugs: Bug[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Multiple DOM queries
      if (line.includes('document.querySelector') || line.includes('document.getElementById')) {
        const sameElement = lines.filter(l => 
          l.includes('document.querySelector') || l.includes('document.getElementById')
        ).length;
        
        if (sameElement > 2) {
          bugs.push({
            type: 'repeated_dom_queries',
            severity: 'medium',
            description: 'Multiple DOM queries detected',
            line: lineNumber,
            suggestion: 'Cache DOM elements in variables'
          });
        }
      }

      // Synchronous operations in loops
      if (line.includes('for') && code.includes('await', code.indexOf(line))) {
        bugs.push({
          type: 'sync_in_loop',
          severity: 'medium',
          description: 'Synchronous operations in loop',
          line: lineNumber,
          suggestion: 'Consider using Promise.all() for parallel execution'
        });
      }
    });

    return bugs;
  }

  private detectBestPracticeViolations(code: string, language: string): Bug[] {
    const bugs: Bug[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // var usage in modern JavaScript
      if ((language === 'javascript' || language === 'typescript') && 
          line.includes('var ') && !line.includes('//')) {
        bugs.push({
          type: 'var_usage',
          severity: 'low',
          description: 'Use of var instead of const/let',
          line: lineNumber,
          fix: line.replace('var ', 'const '),
          suggestion: 'Use const or let instead of var'
        });
      }

      // console.log in production code
      if (line.includes('console.log')) {
        bugs.push({
          type: 'console_log',
          severity: 'low',
          description: 'Console.log statement',
          line: lineNumber,
          suggestion: 'Remove console.log statements from production code'
        });
      }

      // Magic numbers
      const magicNumbers = line.match(/\b\d{2,}\b/g);
      if (magicNumbers && !line.includes('//')) {
        bugs.push({
          type: 'magic_numbers',
          severity: 'low',
          description: 'Magic numbers detected',
          line: lineNumber,
          suggestion: 'Replace magic numbers with named constants'
        });
      }
    });

    return bugs;
  }

  private generateFixes(code: string, bugs: Bug[]): string[] {
    return bugs
      .filter(bug => bug.fix)
      .map(bug => bug.fix!)
      .filter(Boolean);
  }

  private applyFixes(code: string, fixes: string[]): string {
    let fixedCode = code;
    const lines = code.split('\n');
    
    // Apply line-specific fixes
    // This is a simplified implementation
    return fixedCode;
  }

  private assessCodeQuality(code: string, bugs: Bug[]): string {
    const criticalBugs = bugs.filter(b => b.severity === 'critical').length;
    const highBugs = bugs.filter(b => b.severity === 'high').length;
    const mediumBugs = bugs.filter(b => b.severity === 'medium').length;
    const lowBugs = bugs.filter(b => b.severity === 'low').length;

    if (criticalBugs > 0) {
      return 'Poor - Critical issues need immediate attention';
    } else if (highBugs > 2) {
      return 'Below Average - Multiple high-severity issues detected';
    } else if (mediumBugs > 5) {
      return 'Average - Several medium-severity issues present';
    } else if (lowBugs > 10) {
      return 'Good - Minor issues that can be improved';
    } else {
      return 'Excellent - High quality code with minimal issues';
    }
  }

  private suggestImprovements(code: string, language: string): string[] {
    const improvements: string[] = [];

    if (!code.includes('try') && code.includes('fetch')) {
      improvements.push('Add error handling for network requests');
    }

    if (code.includes('any') && language === 'typescript') {
      improvements.push('Replace "any" types with more specific types');
    }

    if (code.length > 500) {
      improvements.push('Consider breaking large functions into smaller ones');
    }

    return improvements;
  }

  private isKnownVariable(varName: string, code: string): boolean {
    const declarationPatterns = [
      new RegExp(`\\b(const|let|var)\\s+${varName}\\b`),
      new RegExp(`\\bfunction\\s+${varName}\\b`),
      new RegExp(`\\b${varName}\\s*:`), // Object property
      new RegExp(`\\bimport.*${varName}`)
    ];

    return declarationPatterns.some(pattern => pattern.test(code));
  }

  private isBuiltinIdentifier(varName: string): boolean {
    const builtins = [
      'console', 'document', 'window', 'process', 'global', 'require',
      'exports', 'module', 'Buffer', 'setTimeout', 'setInterval',
      'JSON', 'Math', 'Date', 'Array', 'Object', 'String', 'Number',
      'Boolean', 'RegExp', 'Error', 'Promise', 'Map', 'Set'
    ];

    return builtins.includes(varName);
  }
}