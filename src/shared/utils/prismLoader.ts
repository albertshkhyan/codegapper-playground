import Prism, { type Grammar } from 'prismjs';

/**
 * Load Prism.js language component dynamically
 * Returns the Prism language grammar for the specified language
 */
export async function loadPrismLanguage(language: string): Promise<unknown> {
  // Map Monaco language IDs to Prism.js language identifiers
  const languageMap: Record<string, string> = {
    javascript: 'javascript',
    typescript: 'typescript',
    python: 'python',
    java: 'java',
    cpp: 'cpp',
    csharp: 'csharp',
    go: 'go',
    rust: 'rust',
    php: 'php',
    ruby: 'ruby',
  };

  const prismLang = languageMap[language] || 'javascript';

  // Dynamically import Prism language components
  try {
    switch (prismLang) {
      case 'javascript':
        await import('prismjs/components/prism-javascript');
        return Prism.languages.javascript;
      
      case 'typescript':
        await import('prismjs/components/prism-typescript');
        return Prism.languages.typescript;
      
      case 'python':
        await import('prismjs/components/prism-python');
        return Prism.languages.python;
      
      case 'java':
        await import('prismjs/components/prism-java');
        return Prism.languages.java;
      
      case 'cpp':
        await import('prismjs/components/prism-cpp');
        return Prism.languages.cpp;
      
      case 'csharp':
        await import('prismjs/components/prism-csharp');
        return Prism.languages.csharp;
      
      case 'go':
        await import('prismjs/components/prism-go');
        return Prism.languages.go;
      
      case 'rust':
        await import('prismjs/components/prism-rust');
        return Prism.languages.rust;
      
      case 'php':
        await import('prismjs/components/prism-php');
        return Prism.languages.php;
      
      case 'ruby':
        await import('prismjs/components/prism-ruby');
        return Prism.languages.ruby;
      
      default:
        await import('prismjs/components/prism-javascript');
        return Prism.languages.javascript;
    }
  } catch (error) {
    console.warn(`Failed to load Prism language: ${prismLang}`, error);
    // Fallback to JavaScript
    try {
      await import('prismjs/components/prism-javascript');
    } catch {
      // Ignore if already loaded
    }
    return Prism.languages.javascript || {};
  }
}

/**
 * Highlight code using Prism.js with the specified language
 */
export async function highlightCode(code: string, language: string): Promise<string> {
  try {
    const grammar = await loadPrismLanguage(language);
    const prismLang = language === 'cpp' ? 'cpp' : language === 'csharp' ? 'csharp' : language;
    return Prism.highlight(code, grammar as Grammar, prismLang);
  } catch (error) {
    console.warn(`Failed to highlight code with language: ${language}`, error);
    // Fallback to plain text
    return code;
  }
}
