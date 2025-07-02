import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { FileItem } from '../types';
import { FileCode, Lightbulb, Bug, Wrench, TestTube } from 'lucide-react';
import { AgentManager } from '../agents/AgentManager';
import { ContextBuilder } from '../services/ContextBuilder';

interface SmartCodeEditorProps {
  file: FileItem | null;
  files: FileItem[];
  onUpdateFile?: (updatedFile: FileItem) => void;
}

export function SmartCodeEditor({ file, files, onUpdateFile }: SmartCodeEditorProps) {
  const [selectedText, setSelectedText] = useState<string>('');
  const [showActions, setShowActions] = useState(false);
  const [actionPosition, setActionPosition] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [editorContent, setEditorContent] = useState<string>(file?.content || '');
  
  const editorRef = useRef<any>(null);
  const agentManager = AgentManager.getInstance();
  const contextBuilder = ContextBuilder.getInstance();

  useEffect(() => {
    if (file) {
      setEditorContent(file.content || '');
    }
  }, [file]);

  const getLanguage = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'scss':
        return 'scss';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return 'plaintext';
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!file || !value) return;
    
    setEditorContent(value);
    
    if (onUpdateFile) {
      onUpdateFile({
        ...file,
        content: value
      });
    }

    // Track activity
    contextBuilder.addActivity({
      type: 'code_edited',
      data: {
        filename: file.name,
        changeLength: Math.abs(value.length - (file.content?.length || 0))
      }
    });
  };

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Add selection change listener
    editor.onDidChangeCursorSelection((e: any) => {
      const selection = editor.getSelection();
      if (selection && !selection.isEmpty()) {
        const selectedContent = editor.getModel()?.getValueInRange(selection);
        setSelectedText(selectedContent || '');
        
        // Show action buttons
        const position = editor.getScrolledVisiblePosition(selection.getStartPosition());
        if (position) {
          setActionPosition({ x: position.left, y: position.top });
          setShowActions(true);
        }

        contextBuilder.addActivity({
          type: 'text_selected',
          data: {
            text: selectedContent,
            filename: file?.name
          }
        });
      } else {
        setShowActions(false);
        setSelectedText('');
      }
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE, () => {
      handleAgentAction('explainer');
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      handleAgentAction('fixer');
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, () => {
      handleAgentAction('refactor');
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyT, () => {
      handleAgentAction('test');
    });
  };

  const handleAgentAction = async (agentType: string) => {
    if (!file || isProcessing) return;

    setIsProcessing(true);
    setShowActions(false);

    try {
      const context = contextBuilder.buildContext({
        currentFile: file.path,
        selectedText: selectedText || undefined,
        files,
        cursorPosition: { line: 0, column: 0 }
      });

      let response;
      const input = selectedText || editorContent;

      switch (agentType) {
        case 'explainer':
          response = await agentManager.explainCode(input, context);
          break;
        case 'fixer':
          response = await agentManager.fixCode(input, context);
          break;
        case 'refactor':
          response = await agentManager.refactorCode(input, context);
          break;
        case 'test':
          response = await agentManager.generateTest(input, context);
          break;
      }

      if (response?.success) {
        showAgentResult(response, agentType);
      } else {
        showNotification(response?.error || 'Operation failed', 'error');
      }
    } catch (error) {
      showNotification(`${agentType} failed: ${error}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const showAgentResult = (response: any, agentType: string) => {
    // Create a modal to show the result
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    const result = response.result;
    let content = '';

    if (agentType === 'explainer' && result.summary) {
      content = `
        <h4 class="font-semibold mb-2">Code Explanation</h4>
        <p class="text-sm mb-3">${result.summary}</p>
        ${result.patterns ? `
          <h5 class="font-medium mb-1">Patterns:</h5>
          <ul class="text-sm mb-3">
            ${result.patterns.map((p: string) => `<li>• ${p}</li>`).join('')}
          </ul>
        ` : ''}
        ${result.complexity ? `
          <h5 class="font-medium mb-1">Complexity:</h5>
          <p class="text-sm">${result.complexity}</p>
        ` : ''}
      `;
    } else if (agentType === 'fixer' && result.bugs) {
      content = `
        <h4 class="font-semibold mb-2">Bugs Found: ${result.bugs.length}</h4>
        ${result.bugs.map((bug: any, i: number) => `
          <div class="mb-3 p-2 bg-red-900 bg-opacity-30 rounded">
            <h5 class="font-medium text-red-400">${i + 1}. ${bug.description}</h5>
            <p class="text-xs text-gray-400">Severity: ${bug.severity}</p>
            <p class="text-sm">${bug.suggestion}</p>
          </div>
        `).join('')}
      `;
    } else if (agentType === 'refactor' && result.refactored) {
      content = `
        <h4 class="font-semibold mb-2">Refactored Code</h4>
        <pre class="bg-gray-900 p-3 rounded text-sm overflow-auto max-h-60">${result.refactored}</pre>
        ${result.improvements ? `
          <h5 class="font-medium mt-3 mb-1">Improvements:</h5>
          <ul class="text-sm">
            ${result.improvements.map((i: string) => `<li>• ${i}</li>`).join('')}
          </ul>
        ` : ''}
      `;
    } else if (agentType === 'test' && result.testCode) {
      content = `
        <h4 class="font-semibold mb-2">Generated Tests</h4>
        <p class="text-sm mb-2">Framework: ${result.framework}</p>
        <pre class="bg-gray-900 p-3 rounded text-sm overflow-auto max-h-60">${result.testCode}</pre>
      `;
    }

    modal.innerHTML = `
      <div class="bg-gray-800 rounded-lg p-6 max-w-3xl max-h-[80vh] overflow-auto text-white">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold capitalize">${agentType} Result</h3>
          <button class="close-modal text-gray-400 hover:text-white text-xl">&times;</button>
        </div>
        <div class="text-gray-300">${content}</div>
        <div class="mt-6 flex gap-3">
          ${(agentType === 'refactor' && result.refactored) || (agentType === 'fixer' && result.fixedCode) ? 
            '<button class="apply-btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">Apply Changes</button>' : 
            ''
          }
          <button class="close-modal bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => {
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    };

    // Event listeners
    modal.querySelector('.close-modal')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    const applyBtn = modal.querySelector('.apply-btn');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        applyChanges(result, agentType);
        closeModal();
      });
    }
  };

  const applyChanges = (result: any, agentType: string) => {
    if (!file || !editorRef.current) return;

    let newContent = '';
    
    if (agentType === 'refactor' && result.refactored) {
      newContent = result.refactored;
    } else if (agentType === 'fixer' && result.fixedCode) {
      newContent = result.fixedCode;
    }

    if (newContent) {
      if (selectedText && editorRef.current.getSelection && !editorRef.current.getSelection().isEmpty()) {
        // Replace selected text
        editorRef.current.executeEdits('smart-edit', [{
          range: editorRef.current.getSelection(),
          text: newContent
        }]);
      } else {
        // Replace entire content
        setEditorContent(newContent);
        if (onUpdateFile) {
          onUpdateFile({
            ...file,
            content: newContent
          });
        }
      }
      
      showNotification(`${agentType} applied successfully!`, 'success');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 transition-opacity ${
      type === 'success' ? 'bg-green-600' : 
      type === 'error' ? 'bg-red-600' : 'bg-blue-600'
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  };

  if (!file) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
          <FileCode className="w-8 h-8 text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-300 mb-2">No file selected</h3>
        <p className="text-gray-500 max-w-md">
          Select a file from the explorer to view and edit its contents with AI assistance.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <div className="absolute top-0 left-0 right-0 bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between z-10">
        <span className="text-sm font-mono text-gray-400">{file.path}</span>
        <div className="flex gap-2">
          <button
            onClick={() => handleAgentAction('explainer')}
            disabled={isProcessing}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded"
            title="Explain Code (Ctrl+E)"
          >
            <Lightbulb className="w-3 h-3" />
            Explain
          </button>
          <button
            onClick={() => handleAgentAction('fixer')}
            disabled={isProcessing}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white rounded"
            title="Fix Bugs (Ctrl+B)"
          >
            <Bug className="w-3 h-3" />
            Fix
          </button>
          <button
            onClick={() => handleAgentAction('refactor')}
            disabled={isProcessing}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded"
            title="Refactor (Ctrl+R)"
          >
            <Wrench className="w-3 h-3" />
            Refactor
          </button>
          <button
            onClick={() => handleAgentAction('test')}
            disabled={isProcessing}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 text-white rounded"
            title="Generate Tests (Ctrl+T)"
          >
            <TestTube className="w-3 h-3" />
            Test
          </button>
        </div>
      </div>

      {/* Floating Action Buttons */}
      {showActions && (
        <div 
          className="fixed bg-gray-800 rounded-lg p-1 shadow-lg border border-gray-700 z-20 flex gap-1"
          style={{ 
            left: `${actionPosition.x}px`, 
            top: `${actionPosition.y - 50}px` 
          }}
        >
          <button
            onClick={() => handleAgentAction('explainer')}
            className="p-2 hover:bg-gray-700 rounded text-blue-400 text-xs"
            title="Explain"
          >
            💡
          </button>
          <button
            onClick={() => handleAgentAction('fixer')}
            className="p-2 hover:bg-gray-700 rounded text-red-400 text-xs"
            title="Fix"
          >
            🔧
          </button>
          <button
            onClick={() => handleAgentAction('refactor')}
            className="p-2 hover:bg-gray-700 rounded text-green-400 text-xs"
            title="Refactor"
          >
            ⚡
          </button>
          <button
            onClick={() => handleAgentAction('test')}
            className="p-2 hover:bg-gray-700 rounded text-yellow-400 text-xs"
            title="Test"
          >
            🧪
          </button>
        </div>
      )}

      <div className="pt-12 h-full">
        <Editor
          height="100%"
          defaultLanguage={getLanguage(file.name)}
          theme="vs-dark"
          value={editorContent}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          options={{
            readOnly: false,
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            renderLineHighlight: 'all',
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            quickSuggestions: true,
            parameterHints: { enabled: true },
            suggest: {
              showKeywords: true,
              showSnippets: true,
              showFunctions: true
            }
          }}
        />
      </div>

      {isProcessing && (
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-30">
          <div className="bg-gray-800 rounded-lg p-6 flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white">AI is processing...</span>
          </div>
        </div>
      )}
    </div>
  );
}