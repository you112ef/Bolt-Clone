import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AgentManager } from '../agents/AgentManager';
import { SearchService } from '../services/SearchService';
import { getLanguageByFilename, getAvailableActions } from '../config/languageMap';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokens?: number;
    action?: string;
    confidence?: number;
  };
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  description: string;
  action: () => void;
}

interface AIAssistantPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  currentFile?: string;
  selectedCode?: string;
  onCodeAction?: (action: string, result: string) => void;
  className?: string;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  isOpen,
  onToggle,
  currentFile,
  selectedCode,
  onCodeAction,
  className = ''
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [sessionContext, setSessionContext] = useState<any>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const agentManager = AgentManager.getInstance();
  const searchService = SearchService.getInstance();

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        type: 'system',
        content: `# مرحباً! أنا مساعدك الذكي 🤖

أستطيع مساعدتك في:
- **شرح الكود** وتحليله 💡
- **إصلاح الأخطاء** وتحسين الأداء 🔧  
- **إعادة هيكلة الكود** وتنظيمه 🔄
- **إنشاء الاختبارات** التلقائية 🧪
- **البحث الذكي** في المشروع 🔍
- **تنفيذ الأوامر** بأمان ⚡

اختر كود واسألني عنه، أو اكتب سؤالك مباشرة!`,
        timestamp: new Date()
      }]);
    }
  }, []);

  // Update quick actions based on current context
  useEffect(() => {
    updateQuickActions();
  }, [currentFile, selectedCode]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update quick actions based on context
  const updateQuickActions = () => {
    const actions: QuickAction[] = [];

    // Code-specific actions
    if (selectedCode) {
      actions.push(
        {
          id: 'explain',
          label: 'اشرح هذا',
          icon: '💡',
          description: 'شرح الكود المحدد',
          action: () => handleQuickAction('explain', selectedCode)
        },
        {
          id: 'fix',
          label: 'أصلح الأخطاء',
          icon: '🔧',
          description: 'البحث عن الأخطاء وإصلاحها',
          action: () => handleQuickAction('fix', selectedCode)
        },
        {
          id: 'optimize',
          label: 'حسّن الأداء',
          icon: '⚡',
          description: 'تحسين أداء الكود',
          action: () => handleQuickAction('optimize', selectedCode)
        },
        {
          id: 'test',
          label: 'أنشئ اختبارات',
          icon: '🧪',
          description: 'إنشاء اختبارات تلقائية',
          action: () => handleQuickAction('test', selectedCode)
        }
      );
    }

    // File-specific actions
    if (currentFile) {
      const langConfig = getLanguageByFilename(currentFile);
      if (langConfig) {
        const langActions = getAvailableActions(langConfig.id);
        langActions.slice(0, 2).forEach(action => {
          actions.push({
            id: action.id,
            label: action.label,
            icon: action.icon,
            description: action.description,
            action: () => handleLanguageAction(action.id, action.prompt)
          });
        });
      }
    }

    // General actions
    actions.push(
      {
        id: 'search',
        label: 'بحث ذكي',
        icon: '🔍',
        description: 'البحث في المشروع',
        action: () => setInputValue('/search ')
      },
      {
        id: 'command',
        label: 'تشغيل أمر',
        icon: '⚡',
        description: 'تشغيل أوامر الطرفية',
        action: () => setInputValue('/cmd ')
      }
    );

    setQuickActions(actions);
  };

  // Handle quick action
  const handleQuickAction = async (actionType: string, code: string) => {
    const question = `${actionType} this code:\n\`\`\`\n${code}\n\`\`\``;
    await sendMessage(question);
  };

  // Handle language-specific action
  const handleLanguageAction = async (actionId: string, prompt: string) => {
    if (!selectedCode) {
      setInputValue(prompt);
      inputRef.current?.focus();
      return;
    }

    const question = `${prompt}\n\nCode:\n\`\`\`\n${selectedCode}\n\`\`\``;
    await sendMessage(question);
  };

  // Send message
  const sendMessage = async (content?: string) => {
    const messageContent = content || inputValue.trim();
    if (!messageContent) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Handle special commands
      if (messageContent.startsWith('/')) {
        await handleSpecialCommand(messageContent);
      } else {
        await handleGeneralQuestion(messageContent);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `❌ عذراً، حدث خطأ: ${error}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle special commands
  const handleSpecialCommand = async (command: string) => {
    const [cmd, ...args] = command.slice(1).split(' ');
    const query = args.join(' ');

    switch (cmd) {
      case 'search':
        await handleSearchCommand(query);
        break;
      case 'cmd':
        await handleCommandQuestion(query);
        break;
      case 'explain':
        await handleExplainCommand(query);
        break;
      case 'fix':
        await handleFixCommand(query);
        break;
      case 'help':
        await handleHelpCommand();
        break;
      default:
        await handleGeneralQuestion(command);
    }
  };

  // Handle search command
  const handleSearchCommand = async (query: string) => {
    if (!query) {
      addAssistantMessage('🔍 **بحث ذكي**\n\nاكتب `/search <كلمة البحث>` للبحث في المشروع\n\nمثال: `/search function login`');
      return;
    }

    const results = await searchService.search(query, { limit: 5 });
    
    if (results.length === 0) {
      addAssistantMessage(`🔍 **نتائج البحث**\n\nلم أجد نتائج لـ "${query}"`);
      return;
    }

    const resultText = results.map((result, index) => 
      `${index + 1}. **${result.path}**\n   ${result.context || result.content.substring(0, 100)}...`
    ).join('\n\n');

    addAssistantMessage(`🔍 **نتائج البحث لـ "${query}"**\n\n${resultText}`);
  };

  // Handle command question
  const handleCommandQuestion = async (query: string) => {
    if (!query) {
      addAssistantMessage('⚡ **مساعد الأوامر**\n\nاكتب `/cmd <سؤالك>` لأساعدك في أوامر الطرفية\n\nمثال: `/cmd how to install packages`');
      return;
    }

    const result = await agentManager.runCommand(query, {
      currentFile,
      workingDirectory: '/workspace',
      language: currentFile ? getLanguageByFilename(currentFile)?.id : undefined
    });

    let response = `⚡ **مساعد الأوامر**\n\n${result.explanation}`;
    
    if (result.suggestedCommands && result.suggestedCommands.length > 0) {
      response += '\n\n**الأوامر المقترحة:**\n';
      result.suggestedCommands.forEach((cmd, index) => {
        response += `${index + 1}. \`${cmd}\`\n`;
      });
    }

    if (result.safetyWarning) {
      response += `\n\n⚠️ **تحذير:** ${result.safetyWarning}`;
    }

    addAssistantMessage(response, { action: 'command' });
  };

  // Handle explain command
  const handleExplainCommand = async (query: string) => {
    const codeToExplain = query || selectedCode;
    if (!codeToExplain) {
      addAssistantMessage('💡 **شرح الكود**\n\nحدد كود أو اكتب `/explain <كود>` لأشرحه لك');
      return;
    }

    const result = await agentManager.explainCode(codeToExplain, {
      language: currentFile ? getLanguageByFilename(currentFile)?.monacoLanguage : 'text',
      filename: currentFile || 'code',
      fullContext: ''
    });

    addAssistantMessage(`💡 **شرح الكود**\n\n${result.explanation}`, { action: 'explain' });
  };

  // Handle fix command
  const handleFixCommand = async (query: string) => {
    const codeToFix = query || selectedCode;
    if (!codeToFix) {
      addAssistantMessage('🔧 **إصلاح الكود**\n\nحدد كود أو اكتب `/fix <كود>` لأصلحه لك');
      return;
    }

    const result = await agentManager.fixCode(codeToFix, {
      language: currentFile ? getLanguageByFilename(currentFile)?.monacoLanguage : 'text',
      filename: currentFile || 'code',
      fullContext: ''
    });

    let response = `🔧 **إصلاح الكود**\n\n${result.explanation}`;
    
    if (result.code && result.code !== codeToFix) {
      response += '\n\n**الكود المحسن:**\n```\n' + result.code + '\n```';
      
      if (onCodeAction) {
        onCodeAction('fix', result.code);
      }
    }

    addAssistantMessage(response, { action: 'fix' });
  };

  // Handle help command
  const handleHelpCommand = async () => {
    const helpText = `# 🤖 مساعد الذكي - دليل الاستخدام

## الأوامر المتاحة:
- \`/search <كلمة>\` - البحث في المشروع
- \`/cmd <سؤال>\` - مساعدة في أوامر الطرفية  
- \`/explain\` - شرح الكود المحدد
- \`/fix\` - إصلاح الكود المحدد
- \`/help\` - عرض هذا الدليل

## أمثلة:
- "اشرح لي هذا الكود"
- "كيف أصلح هذا الخطأ؟"
- "أنشئ اختبارات لهذه الدالة"
- "ما أفضل طريقة لتحسين الأداء؟"

## اختصارات:
- **Ctrl+Enter** - إرسال الرسالة
- **Ctrl+L** - مسح المحادثة
- **Esc** - إخفاء اللوحة`;

    addAssistantMessage(helpText);
  };

  // Handle general question
  const handleGeneralQuestion = async (question: string) => {
    const context = {
      currentFile,
      selectedCode,
      sessionContext,
      language: currentFile ? getLanguageByFilename(currentFile)?.id : undefined
    };

    const result = await agentManager.processGeneralQuery(question, context);
    
    addAssistantMessage(result.explanation, { 
      model: result.model,
      confidence: result.confidence 
    });

    // Update session context
    setSessionContext(prev => ({
      ...prev,
      lastQuery: question,
      lastResponse: result.explanation,
      timestamp: new Date()
    }));
  };

  // Add assistant message
  const addAssistantMessage = (content: string, metadata?: any) => {
    const message: Message = {
      id: Date.now().toString(),
      type: 'assistant',
      content,
      timestamp: new Date(),
      metadata
    };
    setMessages(prev => [...prev, message]);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      sendMessage();
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setMessages([]);
    } else if (e.key === 'Escape') {
      onToggle();
    }
  };

  // Format message content (basic markdown support)
  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\n/g, '<br>');
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className={`fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 ${className}`}
        title="فتح المساعد الذكي"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
        </svg>
      </button>
    );
  }

  return (
    <div className={`fixed inset-y-0 right-0 z-40 w-full md:w-96 bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">المساعد الذكي</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currentFile ? `يعمل على ${currentFile}` : 'جاهز للمساعدة'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={onToggle}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Quick Actions */}
          {selectedCode && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">كود محدد - اختر إجراء:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.slice(0, 4).map(action => (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    title={action.description}
                  >
                    <span>{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-96">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.type === 'system'
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <div
                    className="text-sm prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                  />
                  <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                    <span>{message.timestamp.toLocaleTimeString('ar-SA')}</span>
                    {message.metadata?.model && (
                      <span className="bg-black bg-opacity-20 px-2 py-1 rounded">
                        {message.metadata.model}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب سؤالك أو استخدم / للأوامر..."
                className="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                rows={2}
                dir="rtl"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Ctrl+Enter للإرسال • Ctrl+L للمسح • Esc للإخفاء
            </p>
          </div>
        </>
      )}
    </div>
  );
};