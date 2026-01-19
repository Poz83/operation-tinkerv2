# Implementation Plan - Backend Server Sync

## Goal
Synchronize the backend `server/` directory with the updated `src/server/` AI pipeline (v5.0) and update the `process-generation` job to use the new architecture.

## Proposed Changes

### 1. Synchronize Common AI Modules
- **File**: `server/ai/prompts.ts`
  - [MODIFY] Overwrite with content from `src/server/ai/prompts.ts` (v5.0).
- **File**: `server/ai/gemini-client.ts`
  - [MODIFY] Overwrite with content from `src/server/ai/gemini-client.ts` (v3.0).

### 2. Update Generation Job
- **File**: `server/jobs/process-generation.ts`
  - [MODIFY] Update imports to use `generateColoringPage` from `gemini-client.ts`.
  - [MODIFY] Remove manual `buildPrompt` call (let `generateColoringPage` handle it).
  - [MODIFY] Update `processGeneration` function to call `generateColoringPage` with correct parameters (`styleId`, `complexityId`, `audienceId`, `userPrompt`).
  - [MODIFY] Handle response formatting (v3.0 returns `GenerateImageResult` with metadata).

## Verification Plan

### Automated Verification
- Run TypeScript compiler check manually on the updated file:
  `npx tsc server/jobs/process-generation.ts --noEmit --target esnext --moduleResolution node --esModuleInterop --skipLibCheck`
- If that fails due to missing global types, I will inspect the file for visible type errors.

### Manual Verification
- Review code to ensure no deprecated parameters (like `negative_prompt`) are used.
