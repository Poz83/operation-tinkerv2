# Source Files Reference

A brief description and purpose of each file in the `src/` directory.

---

## Root Level Files

### `index.tsx`
**Purpose:** React application entry point  
**Description:** Initializes the React application by creating a root element and rendering the `App` component with React.StrictMode. This is the main entry point that gets loaded from `index.html`.

---

### `App.tsx`
**Purpose:** Main application component and state management  
**Description:** The core application component that orchestrates the entire coloring book generation workflow. Manages all application state including project settings (name, page count, size, style, complexity), generation state (progress, loading, pages array), and UI state (dark mode, dialogs). Handles page generation, PDF/ZIP export, project save/load, and API key validation. Renders the main layout with `Setup` and `Book` components.

---

### `types.ts`
**Purpose:** TypeScript type definitions and constants  
**Description:** Defines all TypeScript interfaces, types, and configuration constants used throughout the application. Includes page size configurations (Square, Portrait), visual style options (13 styles from Bold & Easy to Abstract), complexity levels, target audience configurations, and the `ColoringPage` interface.

---

### `useApiKey.ts`
**Purpose:** Custom React hook for API key management  
**Description:** Provides API key validation and dialog state management. Checks if an API key is selected using the AI Studio API, manages the API key dialog visibility, and handles the continue action. Returns functions for validation and dialog control.

---

### `styles.css`
**Purpose:** Global CSS styles  
**Description:** Contains global styles, custom CSS variables, animations, and utility classes used throughout the application. Includes styling for the overall theme, animations, and component-specific styles.

---

## Components

### `Setup.tsx`
**Purpose:** Configuration panel component  
**Description:** Provides the user interface for configuring coloring book generation parameters. Displays form controls for project name, page count, page size, visual style, complexity level, target audience, user prompt, hero image upload, and text inclusion options. Handles file uploads, prompt enhancement, and triggers generation actions.

---

### `Book.tsx`
**Purpose:** Book display and navigation component  
**Description:** Displays generated coloring book pages in a scrollable gallery view with navigation controls. Manages page transitions, scroll-to-center functionality for active pages, and renders individual pages using the `Panel` component. Handles page navigation and maintains scroll position.

---

### `Panel.tsx`
**Purpose:** Individual page display component  
**Description:** Renders a single coloring book page with loading states, error handling, and download functionality. Displays page images, handles image loading states, shows loading animation during fetch, and provides individual page download capability. Also renders blank back pages for double-sided printing.

---

### `ApiKeyDialog.tsx`
**Purpose:** API key dialog modal component  
**Description:** Displays a modal dialog when an API key is required. Shows informational content about API key requirements, billing information, and provides a button to connect an API key. Styled as a centered modal with backdrop blur.

---

### `LoadingFX.tsx`
**Purpose:** Loading animation component  
**Description:** Visual loading indicator displayed during page generation. Features animated rings, gradient effects, and text status indicators. Used to provide visual feedback while AI generation is in progress.

---

### `ErrorBoundary.tsx`
**Purpose:** React error boundary component  
**Description:** Catches JavaScript errors anywhere in the child component tree, logs those errors, and displays a fallback UI instead of crashing the entire application. Implements React's error boundary pattern to handle runtime errors gracefully.

---

## Server Logic (`server/`)

### `server/ai/gemini-client.ts`
**Purpose:** Google Gemini API client  
**Description:** Low-level client for interacting with Google's Gemini API. Exports model constants (GEMINI_TEXT_MODEL, GEMINI_IMAGE_MODEL) and the `generateWithGemini` function that handles image generation requests. Manages API configuration, aspect ratios, resolutions, and converts base64 image data to blob URLs.

---

### `server/ai/prompts.ts`
**Purpose:** AI prompt templates and rules  
**Description:** Contains all prompt engineering logic for generating coloring book pages. Defines style rules and complexity rules that modify prompts based on user selections. Includes the `buildPrompt` function that constructs detailed prompts for the AI, and the `SYSTEM_INSTRUCTION` constant with guidelines for the AI model.

---

### `server/jobs/process-generation.ts`
**Purpose:** Page generation orchestration  
**Description:** Coordinates the entire page generation workflow. First generates a book plan using `DirectPromptService`, then processes each page in the plan by building prompts and calling the Gemini API. Manages progress callbacks, handles cancellation via AbortSignal, and processes pages sequentially with progress updates.

---

## Services (`services/`)

### `services/geminiService.ts`
**Purpose:** High-level Gemini service wrapper  
**Description:** Provides a simplified interface for Gemini API operations. Currently exports the `brainstormPrompt` function which uses `DirectPromptService` to enhance user prompts. Acts as a service layer abstraction for AI operations.

---

### `services/direct-prompt-service.ts`
**Purpose:** Direct prompt generation and book planning service  
**Description:** Service class that handles book plan generation and prompt enhancement. Uses the Gemini text model to generate structured book plans with page-by-page descriptions. Implements the `generateBookPlan` method that creates coherent book plans based on user input, and the `brainstormPrompt` method that enhances user prompts. Contains business logic for coordinating multiple pages into a cohesive book.

---

## Utilities (`utils/`)

### `utils/pdf-generator.ts`
**Purpose:** PDF generation utility  
**Description:** Generates PDF files from coloring book pages using jsPDF. Converts the array of `ColoringPage` objects into a multi-page PDF document. Handles page sizing (including KDP margin logic for print-on-demand), image embedding, and file download. Supports both square and portrait page formats.

---

## File Dependencies

### Entry Flow
```
index.html → index.tsx → App.tsx
```

### Component Hierarchy
```
App.tsx
├── Setup.tsx (configuration panel)
├── Book.tsx (page display)
│   └── Panel.tsx (individual pages)
├── ApiKeyDialog.tsx (modal)
├── LoadingFX.tsx (loading indicator)
└── ErrorBoundary.tsx (error handling)
```

### Service Flow
```
App.tsx
├── processGeneration (server/jobs/process-generation.ts)
│   ├── DirectPromptService (services/direct-prompt-service.ts)
│   ├── buildPrompt (server/ai/prompts.ts)
│   └── generateWithGemini (server/ai/gemini-client.ts)
├── brainstormPrompt (services/geminiService.ts)
│   └── DirectPromptService (services/direct-prompt-service.ts)
└── generateColoringBookPDF (utils/pdf-generator.ts)
```

---

*Last Updated: Based on current repository structure*
