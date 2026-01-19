# Release Notes

## [5.0.0] - v5.0 AI & Unified Pipeline
- **Gemini 3 Pro Image (Nano Banana Pro)**: Upgraded the entire AI core to leverage the latest model, featuring superior prompt adherence, text rendering, and native style understanding.
- **Unified Style System (v5.0)**: Standardized 12 distinct styles (including new additions like Geometric, Botanical, Gothic, and refined existing ones) across the entire platform (Studio, Hero Lab, Book Planner).
- **Prompt Engine v5.0**:
  - **No Negative Prompts**: Deprecated negative prompts in favor of positive constraints, aligning with Gemini 3 best practices.
  - **Critical Constraint Placement**: Constraints are now strategically placed at the end of prompts for maximum adherence.
  - **Audience-Specific Complexity**: 5 complexity levels (Very Simple to Extreme Detail) tailored to 6 specific audience age groups.
- **Service Architecture v2.0**:
  - **Unified Orchestrator**: A single "brain" now manages the entire pipeline: Prompt Enhancement -> Generation -> QA -> Auto-Repair.
  - **Agentic QA v2.1**: Enhanced inspection for texture leaks, mockup artifacts, and grey tones with stricter rubrics.
  - **Auto-Repair v2.1**: Comprehensive repair strategies for every potential failure mode (e.g., "Horror Vacui" detection for simple pages).
- **Hero Lab v2.0**:
  - **Style Lock**: Heroes now carry precise v5.0 style DNA.
  - **Constraint Inheritance**: Character consistency rules are now fully compatible with the new prompt engine.
- **Performance**:
  - **Optimized Caching**: Smarter image and API response caching.
  - **Cost Estimation**: Real-time tracking of generation costs based on complexity and resolution.

## [2.2.1] - Cinematic Intelligence
- **Dynamic Camera System**: The AI now acts as a cinematographer, automatically choosing from 8 distinct camera angles (Low, High, Dutch, etc.) found in professional comics to create dynamic, non-repetitive compositions.
- **Clean Login Flow**: Fixed the "duplicate tab" annoyance. If you log in via a magic link in a new tab, the old tab will now stay put and confirm your success, rather than opening a second dashboard.
- **Reliable Export**: Fixed a bug where exporting saved projects resulted in empty files. The system now correctly downloads images from cloud storage before zipping.
- **Friendly Filenames**: Exported files now respect your project name (e.g., "My Cool Project.zip" instead of "my_cool_project.zip").

## [2.2.2] - Safety First & Smart Context
- **Audience Safety Guardrails**: Added strict, age-specific safety checks (e.g., Toddlers get "100% Cute" enforcement with zero scare-factor, while Adults allow for horror themes if requested).
- **Smart Context Hygiene**: The AI now "reads the room"—automatically preventing outdoor hallucinations (like clouds/sun) when you ask for an indoor scene, or fire/dust for underwater scenes.
- **Tone-Aware Generation**: Each audience setting now drives a specific emotional tone, ensuring content isn't just visually appropriate but emotionally resonant (e.g., "Innocent & Joyful" for Toddlers vs "Adventurous" for Kids).
- **Expanded QA Vision**: The Agentic QA now specifically scans for `scary_content` and `wrong_tone`, adding an extra layer of protection before images reach the user.

## [2.2.3] - Wizard Flow & Smart Enhancer
- **Settings First Wizard**: Reorganized Studio sidebar to force Context (Audience/Style) selection BEFORE Prompt entry. This enables smarter AI-assisted prompt enhancement.
- **Context-Aware "Make It Better"**: The prompt enhancer now reads your selected Audience, Style, and Hero settings to write age-appropriate, style-aware prompts (e.g., simpler for Toddlers, more detailed for Adults).
- **Smarter Style Keywords**: Enhanced prompts now include specific style keywords (e.g., "thick lines, sticker-style" for Bold & Easy, "intricate patterns, symmetry" for Mandala).

## [2.2.4] - Instant Image Loading
- **Client-Side Caching**: Generated images are now cached in your browser's IndexedDB, enabling instant loading when switching between pages.
- **LRU Eviction**: Cache automatically clears old images when it exceeds 500MB, keeping your browser light.
- **Memory Management**: Blob URLs are properly revoked to prevent memory leaks during long sessions.

## [2.2.5] - Production-Ready Prompt Engineering
- **"Nuclear" Negative Prompt**: Aggressively bans "Midjourney-style" artifacts like staged photos, flatlays, and wood textures, ensuring pure digital line art.
- **Digital Flatness Enforcer**: New positive prompt structure forces the AI to "think" in vector 2D, eliminating angled shots and paper textures.
- **Enhanced Color Bans**: Stricter rules against color leakage (red/blue/green) and 3D anaglyph effects.
- **Smart Context Hygiene**: Automatically removes nature debris from indoor scenes and fire/dust from underwater scenes.

## [2.2.6] - Gallery & Network Optimization
- **Smart Network Caching**: Signed URLs for gallery images are now cached in memory for 24 hours.
- **Browser Disk Usage**: By stabilizing signed URLs, your browser can now effectively disk-cache community images, making navigation instant.
- **Bandwidth Reduction**: Significantly reduced unnecessary R2 signing requests.

## [2.2.7] - Creative Loading Experience
- **Magic Pencil Animation**: Replaced the standard loading spinner with a whimsical "Magic Pencil" animation that sketches while you wait.
- **Dynamic Status**: Floating icons and cycling messages ("Dreaming...", "Inking...") keep the wait engaging.

## [2.2.8] - Engineering Logic Upgrade
- **Smart Enhancer Upgrade**: The "Make it Better" brain now understands **Coloring Book Engineering**.
- **Constraint Awareness**: It explicitly knows to ask for "closed shapes", "distinct outlines", and "center composition".
- **Translation Logic**: It knows how to translate "glowing" into "radiating lines" and "furry" into "texture lines" for perfect B&W results.

## [2.2.9] - Compliance Force
- **The "Footer" Check**: Added a forceful `[FINAL COMPLIANCE CHECK]` to every prompt.
- **Artifact Protection**: Forces the AI to ask itself: "Is this a photo of paper?" before outputting. If YES, it fails and retries (internally).
- **Zero-Gray Policy**: Strict enforcement of #000000 and #FFFFFF only.

## [2.2.10] - Strict QA Auditing
- **New Audit Rules**: The "Inspector" (QA AI) now strictly fails any image containing colored pixels (red/blue leaks) or "mockup" aesthetics.
- **Smart Tags**: Added `colored_artifacts` and `mockup_style` tags to help the retry system understand *why* it failed and correct it faster.

## [2.2.11] - "Perfect Match" Consistency
- **Purity Lock**: The Auto-Consistency engine now demands a **90% Quality Score** before locking onto a style reference.
- **Anti-Poison**: If the first image has ANY color artifacts or mockup vibes, the system refuses to use it as a reference for the next pages. This prevents one bad image from ruining the whole book.

## [2.2.12] - UI Visibility Patch
- **Planning Visibility**: Wired up the "Magic Pencil" to appear immediately when you click Generate (during the "Planning" phase), not just when images start loading.
- **Fixed Wiring**: The `Book` view was ignoring the global `isGenerating` signal. Fixed it.

## [2.2.13] - Ghost Data Patch
- **Anti-Leak**: Fixed a rare bug where images from a previous project would "haunt" a new project if the network glitched.
- **Strict Clearing**: The studio now aggressively wipes the slate clean when you switch projects, ensuring no data pollution.

## [2.2.14] - Safety Stop
- **Confirmation Dial**: Added a safety check when you click "Stop Creating".
- **Clean Break**: Confirming "Stop" now instantly aborts generation AND clears the workspace, preventing half-baked projects from sticking around.

## [2.2.15] - Prompt Engine Tuning
- **Cozy Authenticity**: Updated the "Cozy Hand-Drawn" style to allow textures and stippling for a richer, more organic look.
- **Audience Physics**: Refined rules for "Adults" to permit complexity while keeping "Toddlers" strictly simple.
- **Negative Prompts**: Overhauled the ban list to be smarter about context (e.g., allowing "clouds" unless indoors).

## [2.2.16] - Vault Rescue & Gentle QA
- **Vault 500 Fix**: Simplified the dashboard data loading to prevent server crashes/timeouts when loading your project list.
- **QA Compassion**: The Quality Assurance AI has been taught that "Simple" != "Bad". It now awards high scores to bold, simple toddler pages instead of failing them for "lack of detail".
- **Prompt Balance**: Relaxed the "Toddler" rules to ensure the AI generates *bold* lines instead of confusing "giant shapes only" scribbles.

## [2.2.17] - Gemini 3 Pro & Style Reform
- **Prompt Engine 3.0**: Completely refactored the prompt generation to align with **Gemini 3 Pro Image (Imagen 3)** best practices.
- **Prompt Engine v4.0**: Implemented a "Production-Grade" architecture with a **Compatibility Matrix** that actively resolves conflicts (e.g. downgrading "Extreme" complexity if the audience is "Toddlers").
- **Constraint-First Assembly**: The AI is now instructed on *Rules* before *Subject*, preventing it from ignoring constraints to serve the subject.
- **Structured Logic**: Switched to a type-safe architecture (`StyleSpec`, `AudienceSpec`) for robotic consistency.
- **Positive Framing**: Replaced confusing negative constraints ("No broken lines") with clear, positive goals ("Ensure all shapes are closed").
- **Style Restoration**: Fixed the "Cozy Hand-Drawn" style by removing conflicting texture instructions that were causing messy shading.
- **Text Support Fixed**: Enabled the previously ignored `requiresText` feature, allowing you to ask for specific titles to be integrated into the design.
- **Zero-Color Enforcement**: Overhauled negative prompts to strictly ban shading, grays, and solid fills, ensuring pure coloring-book-ready output.











## [2.2.0] - Agentic QA & Smart Repairs
- **Agentic Quality Assurance**: Integrated Gemini 1.5 Pro to semantically analyze every image (detects unwanted text, anatomy issues, etc.).
- **Self-Healing AI**: The new "Smart Repair" system automatically translates QA failures into precise engineering directives for retries.
- **Hybrid Validation**: Combines fast pixel heuristics with deep AI analysis for the best balance of speed and safety.
- **Smart Retry Loop**: Optimized logic skips redundant processing on successful repairs.

## [0.5.0] - 2026-01-17

### 🚀 New Features

#### **Smart Hero Injection (Auto-Consistency)**
- **Intelligent Context Awareness**: The Studio now automatically detects when your prompt conflicts with the active Hero character (e.g., asking for a "Sloth Couple" while "Joe" is the active hero).
- **Auto-Exclusion**: If a conflict is found, the system intelligently excludes the Hero to respect your specific subject request.
- **Ambiguity Handling**: For generic prompts like "Walking in the park", the Hero is still automatically included.
- **Manual Override**: You can still force the Hero into any scene by setting "Hero Presence" to 100% in the toolbar.

#### **Hero Lab & Vault Integration**
- **Direct Transfer**: Seamlessly send Hero Reference Cards from Hero Lab to the Coloring Studio.
- **Vault Storage**: Projects are now saved to the Supabase Vault with full metadata (Character DNA, Style Lock).
- **Style Locking**: Heroes now carry their visual style preference (DNA) into the Studio.

### ✨ Improvements
- **Project Load Performance**: Optimized project loading speed by implementing batched signed URL generation, reducing network requests by 90% for large projects.
- **Magic Edit Popup**: Enhanced image editing experience with a dedicated popup and chat interface.
- **UI Polish**: Updated Dashboard icons, renamed "Paint by Numbers" to "Color by Numbers", and refined various UI elements.
- **Logo Update**: New "myjoe" brand logo integrated across the application.

### 🐛 Bug Fixes
- **Sloth/Human Hybrid Fix**: Resolved issue where "Hero" mode was overriding specific subject prompts (like Sloths).
- **Transfer Errors**: Fixed 400/406 errors when transferring images between Lab and Studio.
- **Supabase Connectivity**: Resolved RLS recursion issues and missing `dna` columns.

