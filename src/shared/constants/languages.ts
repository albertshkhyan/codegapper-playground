export interface Language {
  value: string;
  label: string;
  prismLang: string; // Prism.js language identifier
}

/**
 * Top 10 popular programming languages for syntax highlighting
 * Note: Gap generation only works for JavaScript
 */
export const SUPPORTED_LANGUAGES: Language[] = [
  { value: 'javascript', label: 'JavaScript', prismLang: 'javascript' },
  { value: 'typescript', label: 'TypeScript', prismLang: 'typescript' },
  { value: 'python', label: 'Python', prismLang: 'python' },
  { value: 'java', label: 'Java', prismLang: 'java' },
  { value: 'cpp', label: 'C++', prismLang: 'cpp' },
  { value: 'csharp', label: 'C#', prismLang: 'csharp' },
  { value: 'go', label: 'Go', prismLang: 'go' },
  { value: 'rust', label: 'Rust', prismLang: 'rust' },
  { value: 'php', label: 'PHP', prismLang: 'php' },
  { value: 'ruby', label: 'Ruby', prismLang: 'ruby' },
];

export const DEFAULT_LANGUAGE = 'javascript';
