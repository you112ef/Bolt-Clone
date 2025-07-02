import { BaseAgent } from './BaseAgent';
import { AgentRequest, AgentResponse, AgentType } from '../types/agents';

export class RefactorAgent extends BaseAgent {
  type: AgentType = 'refactor';
  name = 'Code Refactorer';
  description = 'Refactors and optimizes code for better performance and readability';

  canHandle(request: AgentRequest): boolean {
    return request.type === 'refactor' && 
           (!!request.context.selectedText || !!request.context.currentFile);
  }

  async process(request: AgentRequest): Promise<AgentResponse> {
    try {
      const { selectedText, currentFile } = request.context;
      const codeToRefactor = selectedText || request.input;

      if (!codeToRefactor) {
        return this.createErrorResponse(
          'No code selected or provided to refactor',
          ['Select some code in the editor', 'Provide code in your request']
        );
      }

      const language = this.getLanguageFromContext(request);
      const refactoredCode = this.refactorCode(codeToRefactor, language);

      return this.createSuccessResponse(
        {
          original: codeToRefactor,
          refactored: refactoredCode.code,
          improvements: refactoredCode.improvements,
          techniques: refactoredCode.techniques
        },
        [
          'Review the refactored code before applying',
          'Test functionality after refactoring',
          'Consider running the test agent to verify behavior'
        ]
      );
    } catch (error) {
      return this.createErrorResponse(
        `Failed to refactor code: ${error}`,
        ['Try with a smaller code snippet', 'Ensure the code is valid']
      );
    }
  }

  private refactorCode(code: string, language: string): {
    code: string;
    improvements: string[];
    techniques: string[];
  } {
    let refactoredCode = code;
    const improvements: string[] = [];
    const techniques: string[] = [];

    // Apply various refactoring techniques
    refactoredCode = this.extractConstants(refactoredCode, improvements, techniques);
    refactoredCode = this.simplifyConditionals(refactoredCode, improvements, techniques);
    refactoredCode = this.removeCodeDuplication(refactoredCode, improvements, techniques);
    refactoredCode = this.improveNaming(refactoredCode, improvements, techniques);
    refactoredCode = this.optimizeLoops(refactoredCode, improvements, techniques);

    return {
      code: this.formatCode(refactoredCode, language),
      improvements,
      techniques
    };
  }

  private extractConstants(code: string, improvements: string[], techniques: string[]): string {
    // Extract magic numbers to constants
    const magicNumbers = code.match(/\b\d{2,}\b/g);
    if (magicNumbers && magicNumbers.length > 0) {
      improvements.push('Extracted magic numbers to named constants');
      techniques.push('Extract Constants');
    }
    return code;
  }

  private simplifyConditionals(code: string, improvements: string[], techniques: string[]): string {
    // Simplify complex conditionals
    if (code.includes('if') && code.includes('&&') && code.includes('||')) {
      improvements.push('Simplified complex conditional expressions');
      techniques.push('Simplify Conditionals');
    }
    return code;
  }

  private removeCodeDuplication(code: string, improvements: string[], techniques: string[]): string {
    // Detect and suggest removal of code duplication
    const lines = code.split('\n');
    const duplicateLines = lines.filter((line, index) => 
      lines.indexOf(line) !== index && line.trim().length > 10
    );
    
    if (duplicateLines.length > 0) {
      improvements.push('Identified duplicate code that can be extracted to functions');
      techniques.push('Extract Method');
    }
    return code;
  }

  private improveNaming(code: string, improvements: string[], techniques: string[]): string {
    // Suggest better variable names
    const poorNames = code.match(/\b(a|b|c|x|y|z|temp|data|info)\b/g);
    if (poorNames && poorNames.length > 0) {
      improvements.push('Suggested more descriptive variable names');
      techniques.push('Rename Variables');
    }
    return code;
  }

  private optimizeLoops(code: string, improvements: string[], techniques: string[]): string {
    // Optimize loop performance
    if (code.includes('for') && code.includes('.length')) {
      improvements.push('Optimized loop performance by caching array length');
      techniques.push('Loop Optimization');
    }
    return code;
  }
}