---
name: ""
overview: ""
todos: []
---

# Tiered Resolution System with Cost Warning Modal

## Overview

Implement a three-tier resolution system that automatically selects image resolution based on complexity:

- **Low Detail** (Very Simple, Simple) → 1K (1024px)
- **Medium Detail** (Moderate) → 2K (2048px)  
- **High Detail** (Intricate, Extreme Detail) → 4K (4096px)

Add a confirmation modal warning users about higher costs when 4K generation is triggered.

## Architecture Changes

### Resolution Flow

```
User selects complexity → Setup.tsx checks → Warning modal (if 4K) → 
Process generation → Gemini client → Image generation
```

## File Changes

### 1. Type Definitions - `src/types.ts`

- No changes needed - `COMPLEXITY_LEVELS` already defined correctly

### 2. Type Definitions - `src/server/ai/gemini-client.ts`

**Changes:**

- Update `GenerateImageOptions.resolution` type from `'1K' | '2K'` to `'1K' | '2K' | '4K'`
- Update `getSmartDimensionConfig` parameter type to accept `'4K'`
- Add logic to infer `'4K'` when max dimension >= 3000px
- Update `imageSize` mapping (note: API may not support '4K' yet, but structure is ready)

**Key Code:**

```typescript
resolution?: '1K' | '2K' | '4K'; // Added '4K'

const getSmartDimensionConfig = (
  aspectRatio: string,
  resolution: '1K' | '2K' | '4K' | undefined, // Updated
  width?: number,
  height?: number
) => {
  if (!resolution) {
    const maxDim = Math.max(width ?? 0, height ?? 0);
    if (maxDim >= 3000) resolution = '4K';      // New
    else if (maxDim >= 1536) resolution = '2K';
    else resolution = '1K';
  }
  return { imageSize: resolution, aspectRatio };
};
```

### 3. Process Generation - `src/server/jobs/process-generation.ts`

**Changes:**

- Replace boolean `isHighDetail` with tiered resolution logic
- Update `ProcessGenerationParams` interface `qaResults` type to include `'4K'`
- Implement switch statement mapping complexity to resolution
- Update all `resolution` assignments to use new `targetResolution` variable
- Adjust cool-down timing: 1K=4s, 2K=8s, 4K=12s

**Key Code:**

```typescript
// Replace lines 114-119
let targetResolution: '1K' | '2K' | '4K' = '1K';
let baseSize = 1024;

switch (params.complexity) {
  case 'Very Simple':
  case 'Simple':
    targetResolution = '1K';
    baseSize = 1024;
    break;
  case 'Moderate':
    targetResolution = '2K';
    baseSize = 2048;
    break;
  case 'Intricate':
  case 'Extreme Detail':
    targetResolution = '4K';
    baseSize = 4096;
    break;
  default:
    targetResolution = '1K';
    baseSize = 1024;
}

// Update cool-down (line 129)
const coolDown = targetResolution === '4K' ? 12000 : 
                 (targetResolution === '2K' ? 8000 : 4000);

// Update all resolution references (lines 150, 162, 216, 270, 291)
resolution: targetResolution,
```

### 4. Logging Types - `src/logging/types.ts`

**Changes:**

- Update `GenerationPageLog.resolution` type to explicitly include `'4K'`
- Change from `'1K' | '2K' | string` to `'1K' | '2K' | '4K'` for better type safety

**Key Code:**

```typescript
resolution: '1K' | '2K' | '4K'; // Updated from '1K' | '2K' | string
```

### 5. Setup Component - `src/Setup.tsx`

**Changes:**

- Add `useState` import
- Add `showCostWarning` state
- Create `handleGenerateClick` wrapper function
- Add warning modal JSX before main content
- Update Generate button `onClick` to use wrapper

**Key Code:**

```typescript
import React, { useState } from 'react'; // Add useState

const [showCostWarning, setShowCostWarning] = useState(false);

const handleGenerateClick = () => {
  const highCostLevels = ['Intricate', 'Extreme Detail'];
  if (highCostLevels.includes(props.complexity)) {
    setShowCostWarning(true);
  } else {
    props.onGenerate();
  }
};

// Modal JSX (insert after line 93, before main content)
{showCostWarning && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div className="bg-zinc-900 border border-amber-500/30 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
      {/* Warning content */}
    </div>
  </div>
)}

// Update Generate button (line 271)
onClick={handleGenerateClick} // Changed from props.onGenerate
```

### 6. Batch Log Defaults - `src/logging/batchLog.ts`

**Changes:**

- Update default resolution from `'1K'` to handle all three tiers (no change needed, already uses string)

## Compatibility Notes

### API Compatibility

- **Current:** Gemini API may not support `'4K'` as `imageSize` enum value
- **Fallback Strategy:** If API rejects '4K', it will error gracefully. Consider adding try-catch with fallback to '2K' in future iteration
- **Testing Required:** Verify API accepts '4K' or implement fallback logic

### Backward Compatibility

- Existing logs with `'1K' | '2K'` remain valid (type allows string)
- Event system already supports string resolution values
- No breaking changes to existing functionality

### Type Safety

- All resolution references updated to union type `'1K' | '2K' | '4K'`
- TypeScript will catch any missing updates
- Logging system accepts all three values

## Testing Checklist

- [ ] Warning modal appears for 'Intricate' complexity
- [ ] Warning modal appears for 'Extreme Detail' complexity  
- [ ] Warning modal does NOT appear for 'Moderate' or lower
- [ ] Cancel button closes modal without generating
- [ ] Confirm button proceeds with generation
- [ ] 1K resolution used for Very Simple/Simple
- [ ] 2K resolution used for Moderate
- [ ] 4K resolution attempted for Intricate/Extreme Detail
- [ ] Logging captures correct resolution values
- [ ] Events include correct resolution in all callbacks