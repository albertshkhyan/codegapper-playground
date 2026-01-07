# CodeGapper Playground 🎯

> An interactive JavaScript learning tool that generates fill-in-the-blanks exercises from your code using AST parsing.

![CodeGapper Screenshot](./src/assets/ilus-v1-2.png)

## 🎬 Demo

![CodeGapper Playground Demo](./src/assets/codegapper-playground-gif1.gif)

## ✨ Features

### Version 2.0 (Current)

- **🧠 Segment-Based Gap Generation**: Position-based gap rendering without placeholders for cleaner code
- **🎲 Smart Randomization**: Randomly selects 50-80% of eligible nodes for varied practice sessions
- **🎯 AST-Powered Gap Detection**: Identifies MemberExpression properties and CallExpression functions
- **✅ Real-Time Validation**: Instant feedback with detailed correct/incorrect gap tracking
- **🎨 Syntax Highlighting**: Prism.js-powered syntax highlighting for better code readability
- **💾 State Management**: Zustand-based state management for seamless user experience
- **🌓 Dark Theme**: Beautiful dark theme optimized for code readability

### Version 1.0

- **🧠 Intelligent Gap Generation**: Uses AST parsing to create meaningful gaps in JavaScript code
- **🎚️ Multiple Difficulty Levels**: Easy, Medium, and Hard modes with adaptive complexity
- **🔍 Gap Type Filtering**: Practice specific concepts (identifiers, operators, literals, etc.)
- **✅ Answer Validation**: Real-time feedback with detailed results
- **💾 Session Management**: Save and load your exercises
- **🌓 Theme Support**: Light and dark themes
- **🎲 Smart Randomization**: Diversity-aware gap selection with history tracking
- **📊 Type-Based Tracking**: Avoids repetitive type patterns

![Application Interface](./src/assets/ilust-v1.png)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/js-fill-blanks-exercises.git

# Navigate to project directory
cd js-fill-blanks-exercises

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 📖 Usage

### Version 2.0 Workflow

1. **Enter Code**: Paste or type JavaScript code in the Monaco editor (left panel)
2. **Generate Gaps**: Click "Generate Gaps" to create fill-in-the-blanks exercises
   - The system randomly selects 50-80% of eligible nodes (properties and function calls)
   - Gaps are rendered inline with syntax highlighting
3. **Fill the Blanks**: Type your answers in the generated input fields
4. **Check Answers**: View results in the bottom panel
   - See correct/incorrect counts
   - Click "Show Answers" to reveal solutions
5. **Regenerate**: Click "Generate Gaps" again for a new random set of gaps

### Version 1.0 Workflow

1. **Enter Code**: Paste or type JavaScript code in the editor
2. **Configure Settings**: 
   - Select difficulty level (Easy/Medium/Hard)
   - Choose gap types to practice
   - Adjust theme preferences
3. **Generate Gaps**: Click "Generate Gaps" to create fill-in-the-blanks
4. **Fill the Blanks**: Type your answers in the generated gaps
5. **Check Answers**: Click "Check Answers" to see results
6. **Save Session**: Save your progress for later

## 🏗️ Architecture

### Version 2.0 Architecture

#### Core Components

- **Gap Engine** (`src/shared/lib/gapEngine/`): AST parsing and segment-based gap generation
  - `parse.ts`: Code parsing using Acorn
  - `gapStrategy.ts`: Node collection and randomization logic
  - `index.ts`: Main pipeline orchestration
  - `types.ts`: Type definitions for segments and gaps
- **UI Components** (`src/app/components/`):
  - `CodeEditorPanel.tsx`: Monaco editor for code input
  - `GappedCodePanel.tsx`: Segment-based gap rendering with syntax highlighting
  - `ResultsPanel.tsx`: Answer validation and feedback display
  - `AppLayout.tsx`: Main application layout
  - `Header.tsx`: Application header
- **State Management** (`src/store/`):
  - `useGapStore.ts`: Zustand store for gap state and actions

#### Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Acorn** - JavaScript parser with location tracking
- **Estraverse** - AST traversal
- **Escodegen** - Code generation (for internal processing)
- **Zustand** - State management
- **Prism.js** - Syntax highlighting
- **Monaco Editor** - Code editor component
- **Tailwind CSS** - Utility-first CSS framework

### Version 1.0 Architecture

#### Core Components

- **Gap Engine** (`src/features/gapEngine/`): AST parsing and gap generation
- **Editor** (`src/features/editor/`): Interactive gap editing interface
- **Result Panel** (`src/features/resultPanel/`): Answer validation and feedback
- **State Management**: Zustand stores for app state

## 🎯 Gap Generation Strategy

### Version 2.0

The current implementation uses a **segment-based approach**:

1. **Parse**: Code is parsed to AST using Acorn with location tracking
2. **Collect**: All eligible nodes are collected (MemberExpression properties and CallExpression functions)
3. **Randomize**: Nodes are shuffled using Fisher-Yates algorithm
4. **Select**: 50-80% of nodes are randomly selected
5. **Sort**: Selected nodes are sorted by position in code
6. **Segment**: Code is split into text and gap segments based on node positions
7. **Render**: Segments are rendered with inline inputs and syntax highlighting

#### Supported Gap Types (v2.0)

- **MemberExpression Properties**: `user.isAdmin` → gap the property name
- **CallExpression Functions**: `grantAccess()` → gap the function name

### Version 1.0 Gap Types

The application supports 6 main gap type categories:

1. **Identifiers** - Variable names, function names
2. **Operators** - Assignment, binary, unary, logical operators
3. **Property Access** - Object properties, method calls
4. **Object Keys** - Object property keys
5. **Literals** - String, number, boolean values
6. **Template Elements** - Template literals, expressions

Each category maps to multiple internal AST node types for precise control.

## 🔧 Configuration

### Version 2.0

Currently uses default randomization (50-80% of eligible nodes). Future versions will support:

- Custom gap count (fixed or range)
- Node type filtering (properties vs functions)
- Difficulty presets
- Exclusion filters

### Version 1.0 Difficulty Levels

- **Easy**: 2 gaps, identifiers and literals only
- **Medium**: 4 gaps, adds object keys
- **Hard**: 6 gaps, all gap types available

### Gap Type Mapping

Customize gap type mappings in `src/features/gapEngine/lib/gapTypeMapping.ts`:

```typescript
export const GAP_TYPE_MAPPING: Record<string, GapTypeMapping> = {
  identifier: {
    uiType: 'identifier',
    mappedTypes: ['identifier'],
    description: 'Variable and function names'
  },
  // ... more types
};
```

## 📊 Project Status

### ✅ Version 2.0 Completed

- Segment-based gap generation (no placeholders)
- Position-based gap rendering
- Random node selection (50-80%)
- Syntax highlighting with Prism.js
- Real-time answer validation
- Show/Hide answers functionality
- Clean state management with Zustand
- Dark theme UI

### ✅ Version 1.0 Completed

- Core gap generation engine
- Multiple gap types support
- Difficulty-based filtering
- Answer validation
- Session persistence
- Theme support
- Per-code history tracking
- Type-based history tracking
- Diversity-aware selection

### 🚧 In Progress

- Gap generation settings panel (UI filters)
- Extended node type support (operators, literals, variables)
- Custom exclusion filters
- Gap count controls

### 📅 Planned

See [ROADMAP.md](./ROADMAP.md) for detailed roadmap.

## 🧪 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Project Structure (v2.0)

```
src/
├── app/                        # Main application
│   ├── components/             # UI components
│   │   ├── AppLayout.tsx      # Main layout
│   │   ├── Header.tsx         # App header
│   │   ├── CodeEditorPanel.tsx # Monaco editor
│   │   ├── GappedCodePanel.tsx # Gap rendering
│   │   └── ResultsPanel.tsx   # Results display
│   └── App.tsx                # Root component
├── shared/                     # Shared utilities
│   └── lib/
│       └── gapEngine/         # Gap generation engine
│           ├── parse.ts       # AST parsing
│           ├── gapStrategy.ts # Node collection & selection
│           ├── index.ts       # Main pipeline
│           └── types.ts       # Type definitions
├── store/                      # State management
│   └── useGapStore.ts         # Zustand store
└── assets/                     # Static assets
```

### Project Structure (v1.0)

```
src/
├── app/                 # Main application
├── features/            # Feature modules
│   ├── codeInput/      # Code input handling
│   ├── gapEngine/      # Gap generation logic
│   ├── editor/         # Gap editor UI
│   ├── resultPanel/    # Results display
│   ├── savedSessions/  # Session management
│   └── uiSettings/     # UI preferences
└── assets/             # Static assets
```

## 🔄 Version History

### Version 2.0 (Current)

**Major Changes:**
- Refactored to segment-based gap generation
- Removed placeholder-based approach (`___1___`)
- Implemented position-based gap rendering
- Added smart randomization (50-80% node selection)
- Enhanced syntax highlighting with Prism.js
- Improved state management with Zustand
- Cleaner, more maintainable codebase

**Key Features:**
- Segment-based gaps for cleaner code representation
- Random gap selection for varied practice
- Inline syntax highlighting
- Real-time validation with detailed feedback

### Version 1.0

**Initial Release:**
- AST-based gap generation
- Multiple gap types support
- Difficulty levels
- Session management
- Theme support

## 🤝 Contributing

Contributions are welcome! Please see [ROADMAP.md](./ROADMAP.md) for areas where help is needed.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

[Add your license here]

## 🙏 Acknowledgments

- [Acorn](https://github.com/acornjs/acorn) - JavaScript parser
- [Prism.js](https://prismjs.com/) - Syntax highlighting
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor component
- [Estraverse](https://github.com/estools/estraverse) - AST traversal utilities

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/js-fill-blanks-exercises/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/js-fill-blanks-exercises/discussions)

---

**Made with ❤️ for JavaScript learners**
