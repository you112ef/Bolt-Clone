# 🤖 AI-Powered Bolt.diy - Advanced Code Builder

> **bolt.diy** enhanced with comprehensive AI Agents system for intelligent application development

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy%20to-Cloudflare%20Pages-orange)](https://pages.cloudflare.com/)
[![Built with Vite](https://img.shields.io/badge/Built%20with-Vite-purple)](https://vitejs.dev/)
[![Powered by React 19](https://img.shields.io/badge/React-19-blue)](https://react.dev/)

## 🎯 **What's New**

We've completely enhanced bolt.diy with a powerful **AI Agents System** while maintaining all original functionality. Now you can build applications with intelligent assistance at every step.

### ⚡ **Key Features**

- **🧠 6 Specialized AI Agents** - Expert assistance for every development task
- **📝 Smart Code Editor** - Enhanced Monaco editor with AI-powered floating actions
- **🖥️ Intelligent Terminal** - AI command suggestions and safety checks
- **🔍 Advanced Search** - Semantic, fuzzy, and exact text search capabilities
- **🖼️ Image-to-Code** - OCR powered code extraction from screenshots
- **⚡ Real-time Analysis** - Live code quality assessment and suggestions
- **📱 Context-Aware** - Intelligent understanding of your project structure

## 🤖 **AI Agents System**

### **1. 📚 Explainer Agent**
- **Code Analysis**: Detects patterns, functions, classes, and complexity
- **Documentation**: Generates comprehensive explanations
- **Learning**: Helps understand complex codebases

### **2. � Fixer Agent**
- **Bug Detection**: Syntax, logic, runtime, and type errors
- **Security Scanning**: Identifies vulnerabilities and security issues
- **Performance**: Detects bottlenecks and optimization opportunities

### **3. ♻️ Refactor Agent**
- **Code Optimization**: Improves structure and readability
- **Pattern Recognition**: Suggests modern coding patterns
- **Quality Enhancement**: Maintains functionality while improving code

### **4. 🧪 Test Agent**
- **Test Generation**: Creates comprehensive test suites
- **Framework Support**: Jest, Vitest, Cypress, Playwright
- **Coverage Analysis**: Ensures thorough testing

### **5. 🏗️ Scaffold Agent**
- **Project Setup**: Creates complete project structures
- **Component Generation**: Builds reusable components
- **Boilerplate**: Generates starter templates

### **6. ⚡ Command Runner Agent**
- **Smart Execution**: Analyzes and safely runs terminal commands
- **Safety Checks**: Prevents dangerous operations
- **Suggestions**: Recommends optimal commands for tasks

## 🚀 **Enhanced User Experience**

### **Smart Code Editor**
- **Floating Actions**: AI-powered buttons appear on text selection
- **Real-time Analysis**: Live feedback on code quality
- **Keyboard Shortcuts**: 
  - `Ctrl+E` - Explain selected code
  - `Ctrl+B` - Fix bugs in selection
  - `Ctrl+R` - Refactor code
  - `Ctrl+T` - Generate tests
  - `Ctrl+K` - Global search

### **AI Assistant Panel**
- **Natural Language**: Chat with AI about your code
- **Slash Commands**: `/search`, `/cmd`, `/explain`, `/fix`, `/help`
- **Context Aware**: Understands your current file and project
- **Quick Actions**: One-click AI operations

### **Smart Terminal**
- **AI Commands**: Type `/ai <question>` for natural language assistance
- **Command Suggestions**: Auto-complete with smart recommendations
- **Safety Warnings**: Prevents destructive operations
- **Context Integration**: Understands your project structure

## �️ **Technical Architecture**

### **Frontend Stack**
- **React 19** - Latest React with concurrent features
- **TypeScript** - Full type safety
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Monaco Editor** - VS Code-level editing experience
- **Framer Motion** - Smooth animations

### **AI Integration**
- **AgentManager** - Central coordinator for AI operations
- **AgentRouter** - Intelligent query routing
- **ContextBuilder** - Project structure understanding
- **SearchService** - Multi-modal search capabilities
- **ImageAnalyzer** - OCR and code extraction

### **WebContainer Integration**
- **Secure Execution** - Run code safely in browser
- **File System** - Full file operations
- **Package Management** - npm/yarn support
- **Live Preview** - Real-time application preview

## � **Installation & Setup**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Modern browser with WebContainer support

### **Local Development**
```bash
# Clone the repository
git clone https://github.com/you112ef/Bolt-Clone.git
cd Bolt-Clone/Frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### **Environment Variables**
```bash
# Optional AI API Keys for enhanced features
OPENAI_API_KEY=your-openai-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
GOOGLE_AI_API_KEY=your-google-key-here
MISTRAL_API_KEY=your-mistral-key-here
```

## 🚀 **Deployment**

### **Cloudflare Pages (Recommended)**
1. Connect your GitHub repository
2. Set build settings:
   - **Framework**: Vite
   - **Build command**: `npm run build`
   - **Build output**: `dist`
   - **Root directory**: `/Frontend`

3. Add environment variables (optional)
4. Deploy!

### **Other Platforms**
- **Vercel**: Works out of the box
- **Netlify**: Compatible with standard settings
- **AWS Amplify**: Supports Vite builds
- **Any Static Host**: Upload `dist` folder

## 🎮 **Usage Guide**

### **Getting Started**
1. **Home Page**: Enter your app description
2. **AI Builder**: Watch as AI agents create your application
3. **Smart Editor**: Edit code with AI assistance
4. **Live Preview**: See changes in real-time
5. **Terminal**: Run commands with AI guidance

### **AI Assistant Usage**
```
# Chat Commands
/search <query>     - Search your codebase
/cmd <command>      - Get terminal command help
/explain <code>     - Explain code functionality
/fix <issue>        - Get bug fix suggestions
/help               - Show all commands

# Keyboard Shortcuts
Ctrl+K              - Global search
Ctrl+E              - Explain selection
Ctrl+B              - Fix bugs
Ctrl+R              - Refactor code
Ctrl+T              - Generate tests
```

## � **Configuration**

### **Language Support**
The system supports 15+ programming languages with specialized AI models:
- **JavaScript/TypeScript** → GPT-4
- **Python** → Claude
- **HTML/CSS** → Gemini Vision
- **SQL** → Mistral
- And many more...

### **Agent Customization**
```typescript
// Configure agent behavior
const agentConfig = {
  explainer: { detailLevel: 'comprehensive' },
  fixer: { includeSecurityScans: true },
  refactor: { preserveStyle: true },
  test: { framework: 'jest' }
};
```

## 🤝 **Contributing**

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### **Development Guidelines**
- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Ensure AI agents work properly
- Test with WebContainer integration

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **bolt.diy** - Original project foundation
- **WebContainer** - Browser-based development environment
- **Monaco Editor** - VS Code editor in the browser
- **OpenAI, Anthropic, Google, Mistral** - AI model providers

## 📞 **Support**

- **Issues**: [GitHub Issues](https://github.com/you112ef/Bolt-Clone/issues)
- **Discussions**: [GitHub Discussions](https://github.com/you112ef/Bolt-Clone/discussions)
- **Documentation**: [Full Documentation](./DOCS.md)

---

**Built with ❤️ by the community • Enhanced with 🤖 AI Agents**
