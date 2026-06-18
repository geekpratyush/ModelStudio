/*
 * Self-authored Monaco language definition for Mermaid flowchart syntax.
 * No third-party code — safe to ship under an open-source licence.
 *
 * Provides:
 *  - a Monarch tokenizer (keywords, node ids, shapes, edges, labels, comments)
 *  - light & dark colour themes
 *  - basic auto-closing pairs + snippet completions
 */

let registered = false;

export const MERMAID_DARK = 'mermaid-dark';
export const MERMAID_LIGHT = 'mermaid-light';

export function registerMermaidLanguage(monaco) {
  if (!monaco || registered) return;
  registered = true;

  monaco.languages.register({ id: 'mermaid' });

  monaco.languages.setMonarchTokensProvider('mermaid', {
    defaultToken: '',
    keywords: [
      'graph', 'flowchart', 'subgraph', 'end', 'direction',
      'classDef', 'class', 'style', 'linkStyle', 'click',
    ],
    directions: ['TB', 'TD', 'BT', 'RL', 'LR'],
    tokenizer: {
      root: [
        [/%%.*$/, 'comment'],
        [/\b(graph|flowchart|subgraph|end|direction|classDef|class|style|linkStyle|click)\b/, 'keyword'],
        [/\b(TB|TD|BT|RL|LR)\b/, 'type'],

        // edge labels  -->|text|
        [/\|/, { token: 'delimiter.label', next: '@edgeLabel' }],

        // edge operators
        [/<?[ox]?[-.=]{2,}[ox]?>?/, 'operator'],

        // node text inside shapes
        [/\[\[/, { token: 'delimiter.bracket', next: '@bracketText' }],
        [/\[\(/, { token: 'delimiter.bracket', next: '@cylText' }],
        [/\(\[/, { token: 'delimiter.bracket', next: '@stadiumText' }],
        [/\(\(/, { token: 'delimiter.bracket', next: '@circleText' }],
        [/\{\{/, { token: 'delimiter.bracket', next: '@hexText' }],
        [/\[/, { token: 'delimiter.bracket', next: '@squareText' }],
        [/\(/, { token: 'delimiter.bracket', next: '@roundText' }],
        [/\{/, { token: 'delimiter.bracket', next: '@curlyText' }],

        // class assignment  :::name
        [/:::[A-Za-z0-9_-]+/, 'attribute.name'],

        // identifiers
        [/[A-Za-z_][\w-]*/, 'identifier'],
        [/[0-9]+/, 'number'],
        [/[;,]/, 'delimiter'],
        [/\s+/, ''],
      ],
      edgeLabel: [
        [/[^|]+/, 'string.label'],
        [/\|/, { token: 'delimiter.label', next: '@pop' }],
      ],
      squareText:  [[/\]/, { token: 'delimiter.bracket', next: '@pop' }], [/[^\]]+/, 'string']],
      roundText:   [[/\)/, { token: 'delimiter.bracket', next: '@pop' }], [/[^)]+/, 'string']],
      curlyText:   [[/\}/, { token: 'delimiter.bracket', next: '@pop' }], [/[^}]+/, 'string']],
      bracketText: [[/\]\]/, { token: 'delimiter.bracket', next: '@pop' }], [/[^\]]+/, 'string']],
      cylText:     [[/\)\]/, { token: 'delimiter.bracket', next: '@pop' }], [/[^)]+/, 'string']],
      stadiumText: [[/\]\)/, { token: 'delimiter.bracket', next: '@pop' }], [/[^\]]+/, 'string']],
      circleText:  [[/\)\)/, { token: 'delimiter.bracket', next: '@pop' }], [/[^)]+/, 'string']],
      hexText:     [[/\}\}/, { token: 'delimiter.bracket', next: '@pop' }], [/[^}]+/, 'string']],
    },
  });

  monaco.languages.setLanguageConfiguration('mermaid', {
    comments: { lineComment: '%%' },
    brackets: [['[', ']'], ['(', ')'], ['{', '}']],
    autoClosingPairs: [
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '{', close: '}' },
      { open: '"', close: '"' },
      { open: '|', close: '|' },
    ],
    surroundingPairs: [
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '{', close: '}' },
      { open: '"', close: '"' },
    ],
  });

  const rules = [
    { token: 'keyword',        foreground: 'c678dd', fontStyle: 'bold' },
    { token: 'type',           foreground: 'e5c07b', fontStyle: 'bold' },
    { token: 'operator',       foreground: '56b6c2' },
    { token: 'identifier',     foreground: '61afef' },
    { token: 'string',         foreground: '98c379' },
    { token: 'string.label',   foreground: 'd19a66', fontStyle: 'italic' },
    { token: 'attribute.name', foreground: 'e06c75' },
    { token: 'delimiter.bracket', foreground: '7f848e' },
    { token: 'delimiter.label',   foreground: '7f848e' },
    { token: 'comment',        foreground: '5c6370', fontStyle: 'italic' },
    { token: 'number',         foreground: 'd19a66' },
  ];

  monaco.editor.defineTheme(MERMAID_DARK, {
    base: 'vs-dark',
    inherit: true,
    rules,
    colors: {
      'editor.background': '#0f1115',
      'editor.lineHighlightBackground': '#1a1d24',
      'editorLineNumber.foreground': '#3b4048',
      'editorCursor.foreground': '#61afef',
    },
  });

  monaco.editor.defineTheme(MERMAID_LIGHT, {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword',        foreground: 'a626a4', fontStyle: 'bold' },
      { token: 'type',           foreground: '986801', fontStyle: 'bold' },
      { token: 'operator',       foreground: '0184bc' },
      { token: 'identifier',     foreground: '4078f2' },
      { token: 'string',         foreground: '50a14f' },
      { token: 'string.label',   foreground: 'c18401', fontStyle: 'italic' },
      { token: 'attribute.name', foreground: 'e45649' },
      { token: 'delimiter.bracket', foreground: 'a0a1a7' },
      { token: 'delimiter.label',   foreground: 'a0a1a7' },
      { token: 'comment',        foreground: 'a0a1a7', fontStyle: 'italic' },
      { token: 'number',         foreground: 'c18401' },
    ],
    colors: {
      'editor.background': '#fafafa',
    },
  });

  monaco.languages.registerCompletionItemProvider('mermaid', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      const K = monaco.languages.CompletionItemKind;
      const I = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
      const suggestions = [
        { label: 'flowchart', kind: K.Keyword, insertText: 'flowchart ${1|TB,LR,RL,BT|}\n\t', insertTextRules: I, documentation: 'New flowchart with a direction' },
        { label: 'subgraph', kind: K.Snippet, insertText: 'subgraph ${1:id} ["${2:Title}"]\n\t$0\nend', insertTextRules: I, documentation: 'Group nodes into a container' },
        { label: 'rectangle', kind: K.Snippet, insertText: '${1:id}["${2:Label}"]', insertTextRules: I, documentation: 'Rectangle node' },
        { label: 'round', kind: K.Snippet, insertText: '${1:id}("${2:Label}")', insertTextRules: I, documentation: 'Rounded node' },
        { label: 'decision', kind: K.Snippet, insertText: '${1:id}{"${2:Decision?}"}', insertTextRules: I, documentation: 'Diamond / decision node' },
        { label: 'database', kind: K.Snippet, insertText: '${1:id}[("${2:Database}")]', insertTextRules: I, documentation: 'Cylinder / database node' },
        { label: 'circle', kind: K.Snippet, insertText: '${1:id}(("${2:Label}"))', insertTextRules: I, documentation: 'Circle node' },
        { label: 'edge', kind: K.Snippet, insertText: '${1:A} --> ${2:B}', insertTextRules: I, documentation: 'Arrow edge' },
        { label: 'edge-label', kind: K.Snippet, insertText: '${1:A} -->|${2:label}| ${3:B}', insertTextRules: I, documentation: 'Labelled edge' },
        { label: 'edge-dotted', kind: K.Snippet, insertText: '${1:A} -.-> ${2:B}', insertTextRules: I, documentation: 'Dotted edge' },
        { label: 'classDef', kind: K.Keyword, insertText: 'classDef ${1:name} fill:${2:#3b82f6}22,stroke:${2:#3b82f6}', insertTextRules: I, documentation: 'Define a reusable style' },
      ];
      return { suggestions: suggestions.map(s => ({ ...s, range })) };
    },
  });
}
