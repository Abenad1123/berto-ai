# Graph Report - berto-ai  (2026-10-25)

## Corpus Check
- Corpus is ~41,798 words - fits in a single context window. You may not need a graph.

## Summary
- 265 nodes · 555 edges · 18 communities (13 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.95)
- Token cost: 2,800 input · 1,050 output

## Community Hubs (Navigation)
- Tactile UI & Responsive Layout
- Quiz Arena & Study Sessions
- AI Deck Forge & Heuristics
- Development Tooling & Types
- App TypeScript Configuration
- Settings & Theme Customization
- Core Production Dependencies
- Node TypeScript Configuration
- PWA Web App Manifest
- Document Ingestion & File Parsing
- Automated Screenshot Capture
- Vite & Tailwind Build Pipeline
- Web Audio Sound Synthesis
- Oxlint Code Quality Rules
- NPM Lifecycle Scripts
- TypeScript Solution References
- Celebratory Confetti Effects

## God Nodes (most connected - your core abstractions)
1. `App()` - 24 edges
2. `react` - 18 edges
3. `Deck` - 18 edges
4. `compilerOptions` - 18 edges
5. `lucide-react` - 17 edges
6. `Card` - 17 edges
7. `compilerOptions` - 15 edges
8. `sounds` - 14 edges
9. `getCategoryIcon()` - 12 edges
10. `generateOfflineQuiz()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Tactile Neo-Brutalism Design System` --rationale_for--> `DeckCard()`  [INFERRED]
  docs/brand-guidelines.md → src/components/DeckCard.tsx
- `Local-First Offline PWA Architecture` --rationale_for--> `db`  [INFERRED]
  docs/ideas/berto-ai.md → src/lib/db.ts
- `Dashboard Dark UI Screenshot` --references--> `App()`  [EXTRACTED]
  docs/screenshots/dashboard-dark.png → src/App.tsx
- `Dashboard Light UI Screenshot` --references--> `App()`  [EXTRACTED]
  docs/screenshots/dashboard-light.png → src/App.tsx
- `SPA Web Entrypoint` --references--> `App()`  [EXTRACTED]
  index.html → src/App.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Tactile Neo-Brutalist Visual Design Framework** — docs_brand_guidelines_tactile_neobrutalism, docs_brand_guidelines_color_tokens, docs_brand_guidelines_sound_synthesis [INFERRED 0.85]
- **FSRS Spaced Repetition Mastery Flow** — readme_fsrs_spaced_repetition, readme_interactive_quiz_arena, readme_offline_smart_heuristics [INFERRED 0.85]
- **Mobile Responsive Layout Showcase** — docs_screenshots_mobile_dashboard, docs_screenshots_mobile_deck_view, docs_screenshots_mobile_quiz_session [INFERRED 0.85]

## Communities (18 total, 5 thin omitted)

### Community 0 - "Tactile UI & Responsive Layout"
Cohesion: 0.08
Nodes (41): Web Audio Procedural Sound Synthesis, Dashboard Dark UI Screenshot, Dashboard Light UI Screenshot, Deck Overview UI Screenshot, Mobile 360px Dashboard Screenshot, Mobile Dashboard UI Screenshot, Mobile Deck View Screenshot, SPA Web Entrypoint (+33 more)

### Community 1 - "Quiz Arena & Study Sessions"
Cohesion: 0.14
Nodes (23): Mobile Quiz Session Screenshot, Desktop Quiz Session UI Screenshot, FSRS Spaced Repetition Engine, Interactive Quiz Arena System, colorThemes, CreateDeckPageProps, deckColorThemes, DeckViewPageProps (+15 more)

### Community 2 - "AI Deck Forge & Heuristics"
Cohesion: 0.16
Nodes (24): Mobile Study Launcher Screenshot, Study Mode Launcher UI Screenshot, Offline Smart Heuristic Generator, CreateDeckPage(), ManualCardItem, StudyLauncherModal(), callGeminiGenerateContent(), generateCardsFromText() (+16 more)

### Community 3 - "Development Tooling & Types"
Cohesion: 0.14
Nodes (19): devDependencies, oxlint@^1.88.0, @types/canvas-confetti@^1.9.0, @types/node@^24.19.2, @types/react@^19.3.0, @types/react-dom@^19.3.0, typescript@~6.0.3, vitest@^5.0.5 (+11 more)

### Community 4 - "App TypeScript Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 5 - "Settings & Theme Customization"
Cohesion: 0.14
Nodes (16): Color Architecture and Theme Accents, Settings Hub UI Screenshot, ACCENT_COLORS, AI_DIFFICULTIES, AUTO_ADVANCE_OPTIONS, CARD_STYLES, FSRS_TARGETS, QUIZ_FORMATS (+8 more)

### Community 6 - "Core Production Dependencies"
Cohesion: 0.12
Nodes (17): dependencies, clsx@^2.1.1, dexie@^4.4.7, dexie-react-hooks@^4.4.0, lucide-react@^1.61.0, react@^19.3.1, react-dom@^19.3.1, tailwind-merge@^3.7.0 (+9 more)

### Community 7 - "Node TypeScript Configuration"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 8 - "PWA Web App Manifest"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 9 - "Document Ingestion & File Parsing"
Cohesion: 0.25
Nodes (6): jszip@^3.10.2, pdfjs-dist@^6.4.299, jszip, pdfjs-dist, decodeXmlEntities(), extractTextFromFile()

### Community 11 - "Vite & Tailwind Build Pipeline"
Cohesion: 0.29
Nodes (6): @tailwindcss/vite@^4.3.3, vite@^8.3.4, @vitejs/plugin-react@^6.1.2, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 13 - "Oxlint Code Quality Rules"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 14 - "NPM Lifecycle Scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, preview, test

## Knowledge Gaps
- **22 isolated node(s):** `Berto AI Mastery Arena`, `FSRS Spaced Repetition Engine`, `Interactive Quiz Arena System`, `Offline Smart Heuristic Generator`, `Color Architecture and Theme Accents` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 104 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Tactile UI & Responsive Layout` to `Quiz Arena & Study Sessions`, `AI Deck Forge & Heuristics`, `Development Tooling & Types`, `Settings & Theme Customization`, `Core Production Dependencies`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **What connects `Berto AI Mastery Arena`, `FSRS Spaced Repetition Engine`, `Interactive Quiz Arena System` to the rest of the system?**
  _22 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Tactile UI & Responsive Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.08148148148148149 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `Tactile UI & Responsive Layout` to `Quiz Arena & Study Sessions`, `AI Deck Forge & Heuristics`, `Development Tooling & Types`, `Settings & Theme Customization`, `Core Production Dependencies`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Should `Quiz Arena & Study Sessions` be split into smaller, more focused modules?**
  _Cohesion score 0.1425287356321839 - nodes in this community are weakly interconnected._
- **Why does `App()` connect `Tactile UI & Responsive Layout` to `Quiz Arena & Study Sessions`, `AI Deck Forge & Heuristics`, `Settings & Theme Customization`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `Development Tooling & Types` be split into smaller, more focused modules?**
  _Cohesion score 0.1368421052631579 - nodes in this community are weakly interconnected._