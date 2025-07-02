import { createWorker } from 'tesseract.js';
import { ImageAnalysisResult } from '../types/agents';

export class ImageAnalyzer {
  private static instance: ImageAnalyzer;
  private worker: any = null;
  private isInitialized = false;

  static getInstance(): ImageAnalyzer {
    if (!ImageAnalyzer.instance) {
      ImageAnalyzer.instance = new ImageAnalyzer();
    }
    return ImageAnalyzer.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.worker = await createWorker();
      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');
      this.isInitialized = true;
      console.log('ImageAnalyzer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ImageAnalyzer:', error);
      throw error;
    }
  }

  async analyzeImage(imageFile: File | string): Promise<ImageAnalysisResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const { data: { text } } = await this.worker.recognize(imageFile);
      
      return {
        text,
        codeBlocks: this.extractCodeBlocks(text),
        language: this.detectLanguage(text),
        confidence: this.calculateConfidence(text)
      };
    } catch (error) {
      console.error('Image analysis failed:', error);
      return {
        text: '',
        codeBlocks: [],
        confidence: 0
      };
    }
  }

  private extractCodeBlocks(text: string): string[] {
    const codeBlocks: string[] = [];
    
    // Look for common code patterns
    const codePatterns = [
      /function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/g,
      /class\s+\w+\s*\{[^}]*\}/g,
      /const\s+\w+\s*=\s*[^;]+;/g,
      /import\s+[^;]+;/g,
      /export\s+[^;]+;/g
    ];

    codePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        codeBlocks.push(...matches);
      }
    });

    return codeBlocks;
  }

  private detectLanguage(text: string): string | undefined {
    const languageIndicators = {
      javascript: ['function', 'const', 'let', 'var', 'import', 'export'],
      typescript: ['interface', 'type', 'function', 'const', 'import'],
      python: ['def', 'class', 'import', 'from', 'if __name__'],
      java: ['public class', 'private', 'public', 'static void'],
      cpp: ['#include', 'using namespace', 'int main'],
      html: ['<html>', '<div>', '<span>', '<!DOCTYPE'],
      css: ['{', '}', ':', ';', 'color:', 'background:']
    };

    let maxScore = 0;
    let detectedLanguage = '';

    Object.entries(languageIndicators).forEach(([lang, indicators]) => {
      const score = indicators.reduce((count, indicator) => {
        return count + (text.includes(indicator) ? 1 : 0);
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        detectedLanguage = lang;
      }
    });

    return maxScore > 0 ? detectedLanguage : undefined;
  }

  private calculateConfidence(text: string): number {
    if (!text || text.trim().length === 0) return 0;

    let confidence = 0.3; // Base confidence

    // Check for code-like patterns
    const codeIndicators = [
      /[{}()[\];]/g,
      /\b(function|class|const|let|var|if|else|for|while)\b/g,
      /[=<>!]+/g,
      /\w+\.\w+/g
    ];

    codeIndicators.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        confidence += Math.min(matches.length * 0.1, 0.3);
      }
    });

    // Check text quality (fewer OCR errors = higher confidence)
    const cleanText = text.replace(/[^\w\s]/g, '');
    const ratio = cleanText.length / text.length;
    confidence *= ratio;

    return Math.min(confidence, 1.0);
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }

  // Helper method to create file suggestions
  createFileSuggestions(analysis: ImageAnalysisResult): Array<{
    filename: string;
    content: string;
    description: string;
  }> {
    const suggestions: Array<{
      filename: string;
      content: string;
      description: string;
    }> = [];

    if (analysis.codeBlocks && analysis.codeBlocks.length > 0) {
      const extension = this.getFileExtension(analysis.language);
      
      analysis.codeBlocks.forEach((code, index) => {
        suggestions.push({
          filename: `extracted_code_${index + 1}.${extension}`,
          content: code,
          description: `Code block ${index + 1} extracted from image`
        });
      });
    }

    if (analysis.text && analysis.text.trim()) {
      suggestions.push({
        filename: 'extracted_text.txt',
        content: analysis.text,
        description: 'All text extracted from image'
      });
    }

    return suggestions;
  }

  private getFileExtension(language?: string): string {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      html: 'html',
      css: 'css'
    };

    return language ? extensions[language] || 'txt' : 'txt';
  }

  // Process screenshot for code analysis
  async processScreenshot(imageData: string): Promise<{
    success: boolean;
    analysis?: ImageAnalysisResult;
    suggestions?: Array<{
      filename: string;
      content: string;
      description: string;
    }>;
    error?: string;
  }> {
    try {
      const analysis = await this.analyzeImage(imageData);
      
      if (analysis.confidence < 0.3) {
        return {
          success: false,
          error: 'Low confidence in text recognition. Image quality may be poor.'
        };
      }

      const suggestions = this.createFileSuggestions(analysis);

      return {
        success: true,
        analysis,
        suggestions
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to process screenshot: ${error}`
      };
    }
  }
}