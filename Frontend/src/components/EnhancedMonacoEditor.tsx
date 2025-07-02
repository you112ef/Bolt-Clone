import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import { getLanguageByFilename, getAvailableActions, LANGUAGE_MAP } from '../config/languageMap';
import { AgentManager } from '../agents/AgentManager';
import { SearchService } from '../services/SearchService';
import { ImageAnalyzer } from '../services/ImageAnalyzer';

interface EnhancedMonacoEditorProps {
  value: string;
  language?: string;
  filename?: string;
  onChange: (value: string) => void;
  onSelectionChange?: (selection: monaco.Selection) => void;
  theme?: 'vs-dark' | 'light';
  readOnly?: boolean;
  className?: string;
}

interface FloatingAction {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  action: () => void;
}

interface SearchPopup {
  isOpen: boolean;
  query: string;
  results: any[];
  selectedIndex: number;
}

export const EnhancedMonacoEditor: React.FC<EnhancedMonacoEditorProps> = ({
  value,
  language: propLanguage,
  filename,
  onChange,
  onSelectionChange,
  theme = 'vs-dark',
  readOnly = false,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [floatingActions, setFloatingActions] = useState<FloatingAction[]>([]);
  const [showFloatingButtons, setShowFloatingButtons] = useState(false);
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [searchPopup, setSearchPopup] = useState<SearchPopup>({
    isOpen: false,
    query: '',
    results: [],
    selectedIndex: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const agentManager = AgentManager.getInstance();
  const searchService = SearchService.getInstance();
  const imageAnalyzer = new ImageAnalyzer();

  // Detect language from filename or prop
  const detectedLanguage = useCallback(() => {
    if (propLanguage) return propLanguage;
    if (filename) {
      const langConfig = getLanguageByFilename(filename);
      return langConfig?.monacoLanguage || 'plaintext';
    }
    return 'plaintext';
  }, [propLanguage, filename]);

  // Initialize Monaco Editor
  useEffect(() => {
    if (!containerRef.current) return;

    // Create editor
    const editor = monaco.editor.create(containerRef.current, {
      value,
      language: detectedLanguage(),
      theme,
      fontSize: 14,
      lineNumbers: 'on',
      readOnly,
      minimap: { enabled: true },
      automaticLayout: true,
      wordWrap: 'on',
      contextmenu: true,
      quickSuggestions: true,
      tabSize: 2,
      insertSpaces: true,
      folding: true,
      foldingStrategy: 'auto',
      renderLineHighlight: 'all',
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      multiCursorModifier: 'ctrlCmd',
      formatOnPaste: true,
      formatOnType: true
    });

    editorRef.current = editor;

    // Handle text changes
    const disposableChange = editor.onDidChangeModelContent(() => {
      onChange(editor.getValue());
    });

    // Handle selection changes
    const disposableSelection = editor.onDidChangeCursorSelection((e) => {
      const selection = editor.getSelection();
      if (selection && onSelectionChange) {
        onSelectionChange(selection);
      }
      
      // Show floating buttons for non-empty selections
      if (selection && !selection.isEmpty()) {
        showFloatingActionButtons(selection);
      } else {
        setShowFloatingButtons(false);
      }
    });

    // Register keyboard shortcuts
    registerKeyboardShortcuts(editor);

    // Handle drag and drop for images
    setupDragAndDrop(editor);

    return () => {
      disposableChange.dispose();
      disposableSelection.dispose();
      editor.dispose();
    };
  }, []);

  // Update editor value when prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  // Update editor language
  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, detectedLanguage());
      }
    }
  }, [detectedLanguage]);

  // Register keyboard shortcuts
  const registerKeyboardShortcuts = (editor: monaco.editor.IStandaloneCodeEditor) => {
    // CTRL+K for search
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      openSearchPopup();
    });

    // CTRL+E for explain
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE, () => {
      handleQuickAction('explain');
    });

    // CTRL+B for fix bugs
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      handleQuickAction('fix');
    });

    // CTRL+R for refactor
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, () => {
      handleQuickAction('refactor');
    });

    // CTRL+T for tests
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyT, () => {
      handleQuickAction('test');
    });

    // ESC to close popups
    editor.addCommand(monaco.KeyCode.Escape, () => {
      setSearchPopup(prev => ({ ...prev, isOpen: false }));
      setShowFloatingButtons(false);
    });
  };

  // Setup drag and drop for images
  const setupDragAndDrop = (editor: monaco.editor.IStandaloneCodeEditor) => {
    const domNode = editor.getDomNode();
    if (!domNode) return;

    domNode.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    domNode.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer?.files || []);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));

      if (imageFiles.length > 0) {
        await handleImageDrop(imageFiles[0]);
      }
    });
  };

  // Handle image drop
  const handleImageDrop = async (file: File) => {
    try {
      setIsLoading(true);
      setNotification('Analyzing image...');

      const result = await imageAnalyzer.analyzeImage(file);
      
      if (result.extractedCode.length > 0) {
        const codeBlock = result.extractedCode.join('\n');
        const position = editorRef.current?.getPosition();
        
        if (position && editorRef.current) {
          editorRef.current.executeEdits('image-drop', [{
            range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
            text: `\n// Extracted from image\n${codeBlock}\n`
          }]);
        }

        setNotification(`Extracted ${result.extractedCode.length} code blocks from image`);
      } else {
        setNotification('No code found in image');
      }
    } catch (error) {
      setNotification('Failed to analyze image');
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Show floating action buttons
  const showFloatingActionButtons = (selection: monaco.Selection) => {
    if (!editorRef.current) return;

    const langConfig = filename ? getLanguageByFilename(filename) : null;
    const actions = langConfig ? getAvailableActions(langConfig.id) : [];

    const floatingActions: FloatingAction[] = [
      {
        id: 'explain',
        label: 'Explain',
        icon: '💡',
        shortcut: 'Ctrl+E',
        action: () => handleAction('explain', selection)
      },
      {
        id: 'fix',
        label: 'Fix',
        icon: '🔧',
        shortcut: 'Ctrl+B',
        action: () => handleAction('fix', selection)
      },
      {
        id: 'refactor',
        label: 'Refactor',
        icon: '🔄',
        shortcut: 'Ctrl+R',
        action: () => handleAction('refactor', selection)
      },
      {
        id: 'test',
        label: 'Tests',
        icon: '🧪',
        shortcut: 'Ctrl+T',
        action: () => handleAction('test', selection)
      },
      ...actions.slice(0, 3).map(action => ({
        id: action.id,
        label: action.label,
        icon: action.icon,
        action: () => handleLanguageAction(action.id, selection)
      }))
    ];

    setFloatingActions(floatingActions);

    // Calculate position
    const domNode = editorRef.current.getDomNode();
    if (domNode) {
      const rect = domNode.getBoundingClientRect();
      const position = editorRef.current.getScrolledVisiblePosition(selection.getEndPosition());
      
      if (position) {
        setSelectionPosition({
          x: rect.left + position.left,
          y: rect.top + position.top - 50
        });
        setShowFloatingButtons(true);
      }
    }
  };

  // Handle quick actions via keyboard
  const handleQuickAction = async (actionType: string) => {
    if (!editorRef.current) return;

    const selection = editorRef.current.getSelection();
    if (!selection || selection.isEmpty()) {
      setNotification('Please select some code first');
      setTimeout(() => setNotification(null), 2000);
      return;
    }

    await handleAction(actionType, selection);
  };

  // Handle generic actions
  const handleAction = async (actionType: string, selection: monaco.Selection) => {
    if (!editorRef.current) return;

    try {
      setIsLoading(true);
      setShowFloatingButtons(false);

      const selectedText = editorRef.current.getModel()?.getValueInRange(selection) || '';
      const fullCode = editorRef.current.getValue();
      
      let result;
      switch (actionType) {
        case 'explain':
          result = await agentManager.explainCode(selectedText, {
            language: detectedLanguage(),
            filename: filename || 'untitled',
            fullContext: fullCode
          });
          break;
        case 'fix':
          result = await agentManager.fixCode(selectedText, {
            language: detectedLanguage(),
            filename: filename || 'untitled',
            fullContext: fullCode
          });
          break;
        case 'refactor':
          result = await agentManager.refactorCode(selectedText, {
            language: detectedLanguage(),
            filename: filename || 'untitled',
            fullContext: fullCode
          });
          break;
        case 'test':
          result = await agentManager.generateTests(selectedText, {
            language: detectedLanguage(),
            filename: filename || 'untitled',
            fullContext: fullCode
          });
          break;
        default:
          throw new Error(`Unknown action: ${actionType}`);
      }

      if (result.code && actionType !== 'explain') {
        // Replace selected text with improved code
        editorRef.current.executeEdits('ai-action', [{
          range: selection,
          text: result.code
        }]);
      }

      setNotification(result.explanation || `${actionType} completed`);
    } catch (error) {
      setNotification(`Failed to ${actionType}: ${error}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Handle language-specific actions
  const handleLanguageAction = async (actionId: string, selection: monaco.Selection) => {
    if (!editorRef.current || !filename) return;

    try {
      setIsLoading(true);
      setShowFloatingButtons(false);

      const langConfig = getLanguageByFilename(filename);
      const action = langConfig?.actions.find(a => a.id === actionId);
      
      if (!action) return;

      const selectedText = editorRef.current.getModel()?.getValueInRange(selection) || '';
      const fullCode = editorRef.current.getValue();

      const result = await agentManager.processCustomAction(action.prompt, selectedText, {
        language: detectedLanguage(),
        filename,
        fullContext: fullCode
      });

      if (result.code) {
        editorRef.current.executeEdits('language-action', [{
          range: selection,
          text: result.code
        }]);
      }

      setNotification(result.explanation || `${action.label} completed`);
    } catch (error) {
      setNotification(`Action failed: ${error}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Open search popup
  const openSearchPopup = () => {
    setSearchPopup({
      isOpen: true,
      query: '',
      results: [],
      selectedIndex: 0
    });
  };

  // Handle search
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchPopup(prev => ({ ...prev, results: [], selectedIndex: 0 }));
      return;
    }

    try {
      const results = await searchService.search(query, { limit: 10 });
      setSearchPopup(prev => ({
        ...prev,
        results,
        selectedIndex: 0
      }));
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  // Jump to search result
  const jumpToResult = (result: any) => {
    if (!editorRef.current) return;

    // If it's the same file, jump to the line
    if (result.path === filename && result.metadata?.startLine) {
      editorRef.current.revealLineInCenter(result.metadata.startLine);
      editorRef.current.setPosition({
        lineNumber: result.metadata.startLine,
        column: 1
      });
    }

    setSearchPopup(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Monaco Editor Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating Action Buttons */}
      {showFloatingButtons && selectionPosition && (
        <div
          className="fixed z-50 flex items-center space-x-2 bg-gray-800 rounded-lg shadow-lg border border-gray-600 p-2"
          style={{
            left: selectionPosition.x,
            top: selectionPosition.y,
            transform: 'translateX(-50%)'
          }}
        >
          {floatingActions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              title={`${action.label} ${action.shortcut ? `(${action.shortcut})` : ''}`}
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Search Popup */}
      {searchPopup.isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="p-4 border-b border-gray-200 dark:border-gray-600">
              <input
                type="text"
                placeholder="Search codebase... (CTRL+K)"
                value={searchPopup.query}
                onChange={(e) => {
                  const query = e.target.value;
                  setSearchPopup(prev => ({ ...prev, query }));
                  handleSearch(query);
                }}
                className="w-full px-4 py-2 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                autoFocus
              />
            </div>
            
            {searchPopup.results.length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                {searchPopup.results.map((result, index) => (
                  <div
                    key={index}
                    onClick={() => jumpToResult(result)}
                    className={`p-4 cursor-pointer border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      index === searchPopup.selectedIndex ? 'bg-blue-50 dark:bg-blue-900' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {result.path}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                        {result.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
                      {result.context || result.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-lg font-medium dark:text-white">Processing...</span>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg">
          {notification}
        </div>
      )}
    </div>
  );
};