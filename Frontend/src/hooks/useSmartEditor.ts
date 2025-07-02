import { useRef, useCallback, useEffect } from 'react';
import { editor } from 'monaco-editor';
import { AgentManager } from '../agents/AgentManager';
import { ContextBuilder } from '../services/ContextBuilder';
import { SearchService } from '../services/SearchService';

export interface SmartEditorActions {
  explainSelection: () => Promise<void>;
  fixBugs: () => Promise<void>;
  refactorCode: () => Promise<void>;
  generateTests: () => Promise<void>;
  search: (query: string) => Promise<void>;
}

export function useSmartEditor() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const agentManager = AgentManager.getInstance();
  const contextBuilder = ContextBuilder.getInstance();
  const searchService = SearchService.getInstance();

  const getEditorContext = useCallback(() => {
    if (!editorRef.current) return null;

    const model = editorRef.current.getModel();
    if (!model) return null;

    const selection = editorRef.current.getSelection();
    const position = editorRef.current.getPosition();
    
    return {
      selectedText: selection && !selection.isEmpty() 
        ? model.getValueInRange(selection)
        : undefined,
      cursorPosition: position 
        ? { line: position.lineNumber, column: position.column }
        : undefined,
      fullContent: model.getValue(),
      fileName: model.uri.path
    };
  }, []);

  const showActionButtons = useCallback((position: { lineNumber: number; column: number }) => {
    if (!editorRef.current) return;

    // Add floating action buttons near the cursor
    const contentWidget = {
      getId: () => 'smart.actions',
      getDomNode: () => {
        const node = document.createElement('div');
        node.className = 'smart-actions-widget';
        node.innerHTML = `
          <div class="flex gap-1 bg-gray-800 rounded-lg p-1 shadow-lg border border-gray-700">
            <button data-action="explain" class="p-2 hover:bg-gray-700 rounded text-blue-400 text-xs" title="Explain">
              💡
            </button>
            <button data-action="fix" class="p-2 hover:bg-gray-700 rounded text-red-400 text-xs" title="Fix">
              🔧
            </button>
            <button data-action="refactor" class="p-2 hover:bg-gray-700 rounded text-green-400 text-xs" title="Refactor">
              ⚡
            </button>
            <button data-action="test" class="p-2 hover:bg-gray-700 rounded text-yellow-400 text-xs" title="Test">
              🧪
            </button>
          </div>
        `;

        // Add click handlers
        node.addEventListener('click', (e) => {
          const target = e.target as HTMLButtonElement;
          const action = target.getAttribute('data-action');
          
          if (action) {
            handleAction(action);
            editorRef.current?.removeContentWidget(contentWidget);
          }
        });

        return node;
      },
      getPosition: () => ({
        position: { lineNumber: position.lineNumber, column: position.column },
        preference: [1, 2] // Above, then below
      })
    };

    editorRef.current.addContentWidget(contentWidget);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.removeContentWidget(contentWidget);
      }
    }, 5000);
  }, []);

  const handleAction = useCallback(async (action: string) => {
    const context = getEditorContext();
    if (!context) return;

    const agentContext = contextBuilder.buildContext({
      currentFile: context.fileName,
      selectedText: context.selectedText,
      cursorPosition: context.cursorPosition
    });

    try {
      let response;
      
      switch (action) {
        case 'explain':
          response = await agentManager.explainCode(
            context.selectedText || context.fullContent,
            agentContext
          );
          break;
        
        case 'fix':
          response = await agentManager.fixCode(
            context.selectedText || context.fullContent,
            agentContext
          );
          break;
        
        case 'refactor':
          response = await agentManager.refactorCode(
            context.selectedText || context.fullContent,
            agentContext
          );
          break;
        
        case 'test':
          response = await agentManager.generateTest(
            context.selectedText || context.fullContent,
            agentContext
          );
          break;
      }

      if (response) {
        showResponseModal(response, action);
      }
    } catch (error) {
      console.error(`Failed to execute ${action}:`, error);
      showNotification(`Failed to ${action}: ${error}`, 'error');
    }
  }, [getEditorContext, contextBuilder, agentManager]);

  const showResponseModal = useCallback((response: any, action: string) => {
    // Create and show a modal with the response
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-gray-800 rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-white font-semibold capitalize">${action} Result</h3>
          <button class="close-modal text-gray-400 hover:text-white">✕</button>
        </div>
        <div class="text-gray-300 whitespace-pre-wrap text-sm">
          ${JSON.stringify(response.result, null, 2)}
        </div>
        <div class="mt-4 flex gap-2">
          <button class="apply-changes bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
            Apply Changes
          </button>
          <button class="close-modal bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm">
            Close
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    modal.querySelector('.close-modal')?.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.querySelector('.apply-changes')?.addEventListener('click', () => {
      applyChanges(response, action);
      document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }, []);

  const applyChanges = useCallback((response: any, action: string) => {
    if (!editorRef.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    const selection = editorRef.current.getSelection();
    
    if (action === 'refactor' && response.result?.refactored) {
      if (selection && !selection.isEmpty()) {
        // Replace selected text
        editorRef.current.executeEdits('smart-refactor', [{
          range: selection,
          text: response.result.refactored
        }]);
      } else {
        // Replace entire content
        model.setValue(response.result.refactored);
      }
    } else if (action === 'fix' && response.result?.fixedCode) {
      if (selection && !selection.isEmpty()) {
        editorRef.current.executeEdits('smart-fix', [{
          range: selection,
          text: response.result.fixedCode
        }]);
      } else {
        model.setValue(response.result.fixedCode);
      }
    }

    showNotification(`${action} applied successfully!`, 'success');
  }, []);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${
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
  }, []);

  const setupEditor = useCallback((editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE, () => {
      handleAction('explain');
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      handleAction('fix');
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, () => {
      handleAction('refactor');
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyT, () => {
      handleAction('test');
    });

    // Show action buttons on text selection
    editor.onDidChangeCursorSelection((e) => {
      if (!e.selection.isEmpty()) {
        const position = editor.getPosition();
        if (position) {
          showActionButtons(position);
        }
      }
    });

    // Track file changes for context
    editor.onDidChangeModelContent(() => {
      contextBuilder.addActivity({
        type: 'code_edited',
        data: {
          filename: editor.getModel()?.uri.path || 'unknown',
          changeCount: 1
        }
      });
    });
  }, [handleAction, showActionButtons, contextBuilder]);

  const smartActions: SmartEditorActions = {
    explainSelection: () => handleAction('explain'),
    fixBugs: () => handleAction('fix'),
    refactorCode: () => handleAction('refactor'),
    generateTests: () => handleAction('test'),
    search: async (query: string) => {
      try {
        const results = await searchService.search(query);
        console.log('Search results:', results);
        // Handle search results display
      } catch (error) {
        console.error('Search failed:', error);
      }
    }
  };

  useEffect(() => {
    // Initialize search service
    searchService.initialize().catch(console.error);
  }, []);

  return {
    setupEditor,
    smartActions,
    getEditorContext
  };
}