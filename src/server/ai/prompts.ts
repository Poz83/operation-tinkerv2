/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PAINT-BY-NUMBERS PROMPT ENGINEERING PIPELINE v4.0
 * Production-Grade Specification for Gemini 3 Pro Image Preview
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Architecture:
 * 1. Universal Constraints (immutable physical laws)
 * 2. Style Specifications (drafting tool + aesthetic)
 * 3. Complexity Physics (information density)
 * 4. Audience Rules (mood + safety + motor skills)
 * 5. Compatibility Matrix (conflict resolution)
 * 6. Assembly Engine (constraint-first ordering)
 * 
 * Design Principles:
 * - Constraints BEFORE subject (model decides within rules, not retrofits)
 * - Markdown structure preserved for Gemini section parsing
 * - Style-specific negatives co-located with style specs
 * - Explicit conflict detection and resolution
 * 
 * Target Output:
 * - 300 DPI print-ready
 * - Amazon KDP compliant
 * - <0.5% region closure error rate
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import {
  CharacterDNA,
  StyleDNA,
  // CinematicOption,
  // VISUAL_STYLES,
  // TARGET_AUDIENCES
} from '../../types';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. UNIVERSAL HEADER — Immutable Physical Laws
// ═══════════════════════════════════════════════════════════════════════════════

const UNIVERSAL_HEADER = `
## CRITICAL REQUIREMENTS — READ FIRST

You are generating BLACK AND WHITE LINE ART for a colouring book.
These rules are ABSOLUTE and override all other instructions.

### Physical Laws (Non-Negotiable):
1. **OUTPUT**: Pure black lines (#000000) on pure white background (#FFFFFF)
2. **NO FILLS**: Zero solid black areas — everything is OUTLINE ONLY
3. **NO TONES**: Zero grey, zero gradients, zero shading, zero rendering
4. **CLOSED PATHS**: ALL shapes must be fully enclosed (no gaps)
5. **COLOURABLE**: Every white space must be a distinct colourable region
6. **CONVERT DARKS**: Pupils, shadows, hair = outlined regions, NOT filled black

### Purpose:
Users will colour this image. Every "would-be-dark" area must be an outlined shape they can fill with their chosen colour.
`.trim();

// ═══════════════════════════════════════════════════════════════════════════════
// 2. STYLE SPECIFICATIONS — Drafting Tool + Aesthetic + Negatives
// ═══════════════════════════════════════════════════════════════════════════════

interface StyleSpec {
  prompt: string;
  negatives: string;
  minRegionMm: number;
  minGapMm: number;
  maxRegions: number | null;
  allowsTextureMarks: boolean;
  compatibleComplexity: string[]; // Which complexity levels work with this style
}

const STYLE_SPECS: Record<string, StyleSpec> = {

  'Cozy Hand-Drawn': {
    prompt: `
### Style: Cozy Hand-Drawn

**Drafting Tool**: 0.5mm felt-tip pen on textured paper
**Line Character**: Organic ink bleed, imperfect wobble, stippling texture, rustic woodcut style, warm feeling, thick felt-tip pen texture, hygge aesthetic, whimsical but clean lines. Hand-drawn aesthetic — NOT vector-perfect.
**Line Weight**: 0.5mm nominal with natural pressure variation (0.4–0.7mm)
**Corners**: Rounded, soft transitions — no sharp angles
**Closure**: All shapes fully enclosed despite organic wobble
**Minimum Region**: 4mm²

**Texture Allowance**: Light stippling and hatching marks are PERMITTED to add warmth and texture.

**Aesthetic Goal**: Warm, rustic, approachable. Hygge comfort. Charm through imperfection.

**DO**: Organic ink bleed, slightly uneven lines, gentle curves, cosy domestic subjects, soft rounded forms, subtle stippling for warmth
**DO NOT**: Digital perfection, vector smoothness, mechanical lines, rigid geometry, sharp corners
    `.trim(),
    negatives: 'digital perfection, vector smoothness, mechanical lines, rigid geometry, sharp corners, sterile, precise',
    minRegionMm: 4,
    minGapMm: 1,
    maxRegions: 120,
    allowsTextureMarks: true,
    compatibleComplexity: ['Very Simple', 'Simple', 'Moderate']
  },

  'Bold & Easy': {
    prompt: `
### Style: Bold & Easy

**Drafting Tool**: 4mm chisel-tip marker
**Line Character**: Thick, uniform strokes. Smooth, confident curves. Maximum simplicity.
**Line Weight**: 4mm consistent — NO variation permitted
**Minimum Gap**: 2mm between any parallel lines
**Closure**: All shapes fully enclosed — no gaps
**Minimum Region**: 8mm² (no tiny spaces)
**Maximum Regions**: 50 total for entire image

**Aesthetic Goal**: Simple, bold, high-contrast. Readable at arm's length. Sticker-art clarity.

**DO**: Large simple shapes, thick confident lines, minimal detail, bold silhouettes
**DO NOT**: Fine details, intricate patterns, thin lines, small enclosed spaces, texture marks
    `.trim(),
    negatives: 'fine detail, thin lines, intricate, complex, hatching, texture, small shapes, delicate, wispy',
    minRegionMm: 8,
    minGapMm: 2,
    maxRegions: 50,
    allowsTextureMarks: false,
    compatibleComplexity: ['Very Simple', 'Simple'] // NOT compatible with Intricate/Extreme
  },

  'Kawaii': {
    prompt: `
### Style: Kawaii

**Drafting Tool**: 3mm vector brush
**Line Character**: Thick, smooth, uniform curves. Friendly and approachable.
**Line Weight**: 3mm consistent throughout
**Corner Radius**: Minimum 2mm on ALL corners — nothing sharp
**Closure**: All shapes fully enclosed with seamless joins
**Minimum Region**: 6mm²

**Proportions**: Chibi style — 1:2 head-to-body ratio for characters. Oversized heads.
**Eyes**: Large (30–40% of face width). Include 1–2 circular highlight areas as SEPARATE ENCLOSED REGIONS (colourable, not filled white).
**Hands**: Mitten-style simplification acceptable.

**Aesthetic Goal**: Cute, round, soft, cheerful. Japanese "kawaii" sensibility.

**DO**: Round everything, simple expressions, oversized features, blushing cheeks as circles
**DO NOT**: Sharp angles, realistic proportions, detailed anatomy, filled black pupils
    `.trim(),
    negatives: 'sharp angles, realistic, detailed anatomy, angular, pointy, aggressive, mature proportions',
    minRegionMm: 6,
    minGapMm: 1.5,
    maxRegions: 80,
    allowsTextureMarks: false,
    compatibleComplexity: ['Very Simple', 'Simple', 'Moderate']
  },

  'Whimsical': {
    prompt: `
### Style: Whimsical

**Drafting Tool**: Variable-width ink brush
**Line Character**: Flowing, gestural strokes with expressive width variation. Suggests movement and magic.
**Line Weight**: Variable 0.5mm–2mm (thicker for emphasis/foreground, thinner for detail/background)
**Closure**: ALL paths must close completely despite gestural quality — no open strokes
**Minimum Region**: 5mm²

**Aesthetic Goal**: Fairy-tale storybook illustration. Dreamlike, magical, gently surreal.

**Permitted Distortions**: Exaggerated scale, whimsical architecture, floating elements, curved horizons
**Forbidden Distortions**: Incomplete shapes, fading lines, open-ended strokes

**DO**: Flowing lines, magical subjects, enchanted scenes, playful scale distortion, dreamy atmosphere
**DO NOT**: Open strokes, incomplete shapes, harsh edges, realistic proportions, mundane subjects
    `.trim(),
    negatives: 'harsh, angular, realistic, mundane, incomplete, open strokes, rigid, stiff',
    minRegionMm: 5,
    minGapMm: 1,
    maxRegions: 100,
    allowsTextureMarks: false,
    compatibleComplexity: ['Simple', 'Moderate', 'Intricate']
  },

  'Cartoon': {
    prompt: `
### Style: Cartoon

**Drafting Tool**: Dynamic brush with taper control
**Line Character**: Dynamic strokes with purposeful tapering. Thick outer contours define silhouette; thinner inner lines define features.
**Line Weight Hierarchy**:
  - Outer silhouette: 2–3mm
  - Secondary forms: 1–1.5mm
  - Fine details: 0.8mm minimum
**Closure**: All shapes fully enclosed. Contour lines must connect cleanly.
**Minimum Region**: 5mm²

**Aesthetic Goal**: Western animation cel style (Disney/WB influence). Clear silhouettes, dynamic poses, energetic.

**Poses**: Exaggerated action, clear "line of action," strong silhouette readability.

**DO**: Bold outlines, expressive shapes, dynamic poses, clear hierarchy, squash-and-stretch
**DO NOT**: Static poses, tangent lines, ambiguous silhouettes, flat poses, uniform line weight
    `.trim(),
    negatives: 'static, stiff, tangent lines, ambiguous silhouette, lifeless, rigid pose, uniform weight',
    minRegionMm: 5,
    minGapMm: 1,
    maxRegions: 100,
    allowsTextureMarks: false,
    compatibleComplexity: ['Simple', 'Moderate', 'Intricate']
  },

  'Botanical': {
    prompt: `
### Style: Botanical

**Drafting Tool**: 0.3mm technical pen (copperplate engraving simulation)
**Line Character**: Fine, precise, controlled strokes. Elegant and scientific.
**Line Weight**: 0.3mm primary contours
**Closure**: All plant structures (leaves, petals, stems) must form closed colourable regions
**Minimum Region**: 3mm²

**Texture Indication** (CRITICAL):
- Use STIPPLING (scattered dots) for form suggestion — dots are decorative, NOT boundaries
- Use OPEN HATCHING (parallel lines that do NOT enclose regions) for texture
- Texture marks must NEVER create colourable sub-regions

**White Space**: Maintain 60%+ open white space within each plant form

**Aesthetic Goal**: Victorian scientific illustration. Precise, elegant, botanically accurate.

**DO**: Fine controlled lines, accurate plant anatomy, delicate stippling, open hatching
**DO NOT**: Solid black areas, closed hatching, dense rendering, over-stippling to grey
    `.trim(),
    negatives: 'solid black, dense shading, closed hatching, grey tones, muddy, over-rendered, sloppy',
    minRegionMm: 3,
    minGapMm: 0.5,
    maxRegions: 150,
    allowsTextureMarks: true,
    compatibleComplexity: ['Moderate', 'Intricate', 'Extreme Detail']
  },

  'Mandala': {
    prompt: `
### Style: Mandala

**Drafting Tool**: Precision vector compass and ruler
**Line Character**: Mathematically precise strokes with perfect geometric accuracy.
**Line Weight**: 1mm primary radial divisions, 0.5mm secondary pattern lines
**Symmetry**: Radial symmetry MANDATORY (8-fold, 12-fold, or 16-fold). Perfect rotational repetition.
**Structure**: Concentric bands radiating from defined centre point. Each band contains repeating pattern elements.
**Closure**: All segments fully enclosed — geometric construction ensures closure
**Minimum Region**: 4mm²
**Outer Boundary**: Complete circle or regular polygon required

**Aesthetic Goal**: Meditative, balanced, geometrically perfect. Spiritual symmetry.

**DO**: Perfect symmetry, repetitive patterns, concentric organisation, clean geometry, meditative complexity
**DO NOT**: Asymmetry, organic variation, incomplete patterns, freehand wobble
    `.trim(),
    negatives: 'asymmetric, organic, wobbly, incomplete, freehand, irregular, chaotic',
    minRegionMm: 4,
    minGapMm: 0.8,
    maxRegions: 150,
    allowsTextureMarks: false,
    compatibleComplexity: ['Moderate', 'Intricate', 'Extreme Detail']
  },

  'Zentangle': {
    prompt: `
### Style: Zentangle

**Drafting Tool**: 0.8mm fine liner
**Line Character**: Consistent, confident ink-style strokes. High contrast, uniform weight.
**Line Weight**: 0.8mm consistent
**Structure**: Divide composition into sections ("strings"). Each string is a closed region filled with decorative patterns.
**Closure**: Each string section must be a closed, colourable region
**Minimum Region**: 4mm² for string sections

**Pattern Rules** (CRITICAL):
- Patterns (dots, parallel lines, curves, grids) suggest texture
- Pattern elements are DECORATIVE MARKS, not boundaries
- Patterns must NOT create enclosed sub-regions smaller than 4mm²

**Aesthetic Goal**: Structured doodling. Meditative, rhythmic, abstract.

**DO**: Bold section divisions, decorative pattern fills, rhythmic repetition, clear string boundaries
**DO NOT**: Patterns creating tiny enclosed spaces, representational imagery, irregular string shapes
    `.trim(),
    negatives: 'representational, realistic imagery, tiny enclosed patterns, irregular, chaotic, figurative',
    minRegionMm: 4,
    minGapMm: 0.8,
    maxRegions: 120,
    allowsTextureMarks: true,
    compatibleComplexity: ['Moderate', 'Intricate', 'Extreme Detail']
  },

  'Fantasy': {
    prompt: `
### Style: Fantasy

**Drafting Tool**: Variable ink brush (RPG illustration style)
**Line Character**: Detailed ink work with weight variation suggesting drama and depth.
**Line Weight**:
  - Shadow-side contours: 1.5mm
  - Light-side contours: 0.5mm
  - Fine detail minimum: 0.3mm
**Closure**: All forms fully enclosed despite intricate detail
**Minimum Region**: 3.5mm²

**Lighting Convention**: Suggest single dramatic light source through LINE WEIGHT ONLY.
- Shadow side = thicker lines
- Light side = thinner lines
- NO solid black shadows

**Proportions**: Heroic (8–9 head heights for humanoid figures)

**Aesthetic Goal**: Classic RPG/tabletop illustration. Dramatic, detailed, epic.

**Subjects**: Warriors, mages, dragons, mythical creatures, armour, weapons, magical effects

**DO**: Line weight variation for drama, intricate costume/armour detail, heroic poses, epic scale
**DO NOT**: Solid black shadows, filled areas, modern elements, casual poses
    `.trim(),
    negatives: 'solid black shadows, filled areas, modern clothing, casual, mundane, simple, cartoonish',
    minRegionMm: 3.5,
    minGapMm: 0.5,
    maxRegions: 150,
    allowsTextureMarks: true,
    compatibleComplexity: ['Moderate', 'Intricate', 'Extreme Detail']
  },

  'Gothic': {
    prompt: `
### Style: Gothic

**Drafting Tool**: 5mm+ bold marker (stained glass / woodcut simulation)
**Line Character**: Very thick, angular strokes simulating stained glass leading or woodcut lines.
**Line Weight**: 5mm minimum for ALL lines — no line thinner than 3mm permitted
**Structure**: Image compartmentalised into distinct segments like stained glass panels
**Corners**: Angular preferred. Minimum curve radius 10mm where curves occur.
**Closure**: Mandatory — compartmentalised structure inherently creates closed regions
**Minimum Region**: 15mm² (large segments required due to thick lines)

**Aesthetic Goal**: Medieval stained glass or woodcut. Bold, angular, dramatic, ecclesiastical.

**DO**: Thick bold lines, angular shapes, compartmentalised composition, dramatic subjects, verticality
**DO NOT**: Thin lines, fine detail, soft curves, rounded shapes, delicate elements
    `.trim(),
    negatives: 'thin lines, fine detail, soft curves, delicate, rounded, wispy, intricate, gentle',
    minRegionMm: 15,
    minGapMm: 3,
    maxRegions: 60,
    allowsTextureMarks: false,
    compatibleComplexity: ['Very Simple', 'Simple', 'Moderate']
  },

  'Cozy': {
    prompt: `
### Style: Cozy

**Drafting Tool**: 1.5mm soft-tip marker with rounded caps
**Line Character**: Soft, rounded strokes with gentle, warm quality. Approachable and comforting.
**Line Weight**: 1.5mm with softened endpoints (rounded line caps)
**Corners**: No angles sharper than 90°. Prefer curves. Minimum 3mm radius on all corners.
**Closure**: All shapes fully enclosed
**Minimum Region**: 6mm²

**Aesthetic Goal**: Hygge/comfort illustration. Warm, soft, domestic, peaceful.

**Subjects**: Cosy interiors, comfort food, pets, blankets, beverages, candles, books, soft furnishings

**DO**: Rounded shapes, plump forms, gentle curves, domestic warmth, soft textures suggested through form
**DO NOT**: Sharp angles, cold subjects, harsh contrasts, industrial elements, outdoor adventure
    `.trim(),
    negatives: 'sharp angles, harsh, cold, industrial, angular, aggressive, outdoor adventure, action',
    minRegionMm: 6,
    minGapMm: 1.5,
    maxRegions: 100,
    allowsTextureMarks: false,
    compatibleComplexity: ['Very Simple', 'Simple', 'Moderate']
  },

  'Geometric': {
    prompt: `
### Style: Geometric

**Drafting Tool**: Ruler and 0.8mm technical pen ONLY
**Line Character**: Perfectly straight lines. Absolute mathematical precision.
**Line Weight**: 0.8mm consistent throughout
**Construction**: ZERO curves permitted. Entire image composed of straight-edged triangles and convex polygons.
**Closure**: Inherent to geometric construction — all polygons closed
**Minimum Region**: 5mm²
**Vertices**: Clean, precise intersections at polygon meeting points

**Aesthetic Goal**: Low-poly, faceted, crystalline, digital aesthetic.

**DO**: Straight lines only, triangular tessellation, clean vertices, mathematical precision, faceted forms
**DO NOT**: ANY curved lines whatsoever, organic shapes, soft transitions, freehand marks
    `.trim(),
    negatives: 'curves, curved lines, organic, soft, freehand, wobbly, rounded, natural forms',
    minRegionMm: 5,
    minGapMm: 0.8,
    maxRegions: 120,
    allowsTextureMarks: false,
    compatibleComplexity: ['Simple', 'Moderate', 'Intricate', 'Extreme Detail']
  },

  'Wildlife': {
    prompt: `
### Style: Wildlife

**Drafting Tool**: 1mm contour pen + 0.4mm texture pen
**Line Character**: Naturalistic contour drawing with directional strokes indicating texture.
**Line Weight**: 1mm primary contours, 0.4mm texture indication lines
**Closure**: All animal body regions (head, body, limbs, tail) must be closed colourable shapes
**Minimum Region**: 4mm²

**Texture Technique** (CRITICAL):
- Use line DIRECTION to suggest fur grain, feather barbs, scale patterns
- Texture lines indicate direction ONLY — they must remain OPEN-ENDED within regions
- Texture lines must NEVER enclose sub-spaces

**White Space**: Maintain 70%+ open white space — do not over-render

**Anatomy**: Accurate proportions for species identification

**Aesthetic Goal**: Naturalist field guide illustration. Scientific yet artistic.

**DO**: Accurate anatomy, directional texture strokes, natural poses, habitat elements
**DO NOT**: Solid black areas, over-rendering to dark, closed texture patterns, stylised distortion
    `.trim(),
    negatives: 'solid black, over-rendered, dark fur mass, stylised, cartoon, inaccurate anatomy, closed texture',
    minRegionMm: 4,
    minGapMm: 0.8,
    maxRegions: 120,
    allowsTextureMarks: true,
    compatibleComplexity: ['Moderate', 'Intricate']
  },

  'Floral': {
    prompt: `
### Style: Floral

**Drafting Tool**: 1.2mm flowing brush
**Line Character**: Flowing, continuous Art Nouveau "whiplash" curves. Elegant, sinuous, organic.
**Line Weight**: 1.2mm consistent, slightly thicker (1.5mm) at curve peaks
**Composition**: Interlocking plant elements filling the frame. Vines, leaves, flowers weave together.
**Closure**: All floral elements form closed colourable regions.
**Minimum Region**: 4mm²

**Space Filling**: Minimal empty background — fill negative space with secondary elements (small leaves, buds, tendrils)

**Aesthetic Goal**: Art Nouveau decorative pattern. Flowing, organic, elegant, rhythmic.

**DO**: Continuous flowing lines, interlocking organic forms, rhythmic curves, dense composition, natural elegance
**DO NOT**: Rigid geometric shapes, isolated floating elements, sharp angles, sparse composition
    `.trim(),
    negatives: 'geometric, rigid, angular, sparse, isolated elements, harsh, mechanical',
    minRegionMm: 4,
    minGapMm: 0.8,
    maxRegions: 130,
    allowsTextureMarks: false,
    compatibleComplexity: ['Moderate', 'Intricate', 'Extreme Detail']
  },

  'Abstract': {
    prompt: `
### Style: Abstract

**Drafting Tool**: Variable-width expressive brush
**Line Character**: Fluid, continuous, expressive strokes with intentional variation.
**Line Weight**: Variable 0.5mm–2.5mm based on compositional emphasis
**Closure**: ALL lines must form closed regions despite abstract nature — no open-ended strokes
**Minimum Region**: 5mm²

**Composition**: Non-representational. Focus on shape relationships, negative space, visual rhythm, movement.

**Aesthetic Goal**: Abstract line composition. Balanced, dynamic, visually engaging.

**DO**: Overlapping forms, interlocking shapes, continuous paths, compositional balance, visual rhythm
**DO NOT**: Recognisable subjects, representational imagery, open strokes, narrative content
    `.trim(),
    negatives: 'representational, figurative, recognisable subjects, realistic, narrative, open strokes',
    minRegionMm: 5,
    minGapMm: 1,
    maxRegions: 100,
    allowsTextureMarks: false,
    compatibleComplexity: ['Simple', 'Moderate', 'Intricate']
  },

  'Realistic': {
    prompt: `
### Style: Realistic (Ligne Claire)

**Drafting Tool**: 0.6mm technical pen — uniform weight
**Line Character**: Clean, precise, uniform strokes. Pure contour — form described through outline only.
**Line Weight**: 0.6mm consistent throughout — TRUE Ligne Claire with NO weight variation
**Closure**: All forms cleanly closed with precise endpoint connections
**Minimum Region**: 4mm²

**Proportions**: Anatomically correct. Adult figures 7.5–8 head heights. Accurate perspective.

**Style Reference**: Hergé (Tintin), technical illustration. Form through contour alone.

**Aesthetic Goal**: Clean, precise, professional technical illustration.

**DO**: Uniform line weight, accurate anatomy, correct perspective, clean closures, clarity
**DO NOT**: Line weight variation, hatching, cross-hatching, expressive marks, stylisation
    `.trim(),
    negatives: 'line weight variation, hatching, cross-hatching, expressive, stylised, sketchy, loose',
    minRegionMm: 4,
    minGapMm: 0.8,
    maxRegions: 120,
    allowsTextureMarks: false,
    compatibleComplexity: ['Moderate', 'Intricate']
  },

  'default': {
    prompt: `
### Style: Standard Commercial

**Drafting Tool**: 1mm consistent marker
**Line Character**: Clean, continuous vector strokes. Professional, neutral, versatile.
**Line Weight**: 1mm consistent throughout
**Minimum Gap**: 1.5mm between parallel lines
**Closure**: All regions fully enclosed — no gaps
**Minimum Region**: 5mm²
**Target Regions**: 80–120 distinct colourable regions

**Aesthetic Goal**: Standard commercial colouring book. Clean, clear, broadly appealing.

**DO**: Clear shapes, consistent lines, unambiguous regions, balanced composition
**DO NOT**: Stylistic flourishes, texture rendering, artistic interpretation
    `.trim(),
    negatives: 'stylised, artistic flourishes, texture, rendering, experimental',
    minRegionMm: 5,
    minGapMm: 1.5,
    maxRegions: 120,
    allowsTextureMarks: false,
    compatibleComplexity: ['Very Simple', 'Simple', 'Moderate', 'Intricate']
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. COMPLEXITY PHYSICS — Information Density Rules
// ═══════════════════════════════════════════════════════════════════════════════

interface ComplexitySpec {
  prompt: string;
  maxShapes: number | null;
  minGapMm: number;
  allowsBackground: boolean;
  allowsTexture: boolean;
  regionDensity: string;
}

const COMPLEXITY_SPECS: Record<string, ComplexitySpec> = {

  'Very Simple': {
    prompt: `
### Complexity: Very Simple

**Physics Model**: "Fat Marker" Standard
**Shape Budget**: Maximum 3–5 major shapes total
**Minimum Gap**: 5mm (crayon-safe for small hands)
**Internal Detail**: ZERO — shapes are solid silhouettes with no internal divisions
**Background**: NONE — subject floats on white
**Focus**: Instant recognition from across the room

**Rule**: If you can't draw it with a crayon in 30 seconds, it's too complex.
    `.trim(),
    maxShapes: 5,
    minGapMm: 5,
    allowsBackground: false,
    allowsTexture: false,
    regionDensity: 'minimal'
  },

  'Simple': {
    prompt: `
### Complexity: Simple

**Physics Model**: "Standard Marker" Standard
**Shape Budget**: 10–25 distinct regions
**Minimum Gap**: 3mm
**Internal Detail**: Minimal — only essential defining features (eyes, mouth, major divisions)
**Background**: Sparse or empty — maximum 2–3 background elements
**Focus**: Clear separation between all elements

**Rule**: A 4-year-old should be able to colour it without frustration.
    `.trim(),
    maxShapes: 25,
    minGapMm: 3,
    allowsBackground: true,
    allowsTexture: false,
    regionDensity: 'low'
  },

  'Moderate': {
    prompt: `
### Complexity: Moderate

**Physics Model**: "Sharp Pencil" Standard
**Shape Budget**: 40–80 distinct regions
**Minimum Gap**: 1.5mm
**Internal Detail**: Standard colouring book level — clothing folds, facial features, object details
**Background**: Balanced foreground/background interaction
**Focus**: Engaging without overwhelming

**Rule**: Standard commercial colouring book density.
    `.trim(),
    maxShapes: 80,
    minGapMm: 1.5,
    allowsBackground: true,
    allowsTexture: false,
    regionDensity: 'medium'
  },

  'Intricate': {
    prompt: `
### Complexity: Intricate

**Physics Model**: "Fine Liner" Standard
**Shape Budget**: 80–120 distinct regions
**Minimum Gap**: 0.8mm
**Internal Detail**: High — textures permitted (fur direction, fabric patterns, architectural detail)
**Background**: Dense environmental storytelling
**Focus**: Engaging for adults requiring fine motor control

**Rule**: Reward patience and precision.
    `.trim(),
    maxShapes: 120,
    minGapMm: 0.8,
    allowsBackground: true,
    allowsTexture: true,
    regionDensity: 'high'
  },

  'Extreme Detail': {
    prompt: `
### Complexity: Extreme Detail

**Physics Model**: "Micro-Pen" Standard
**Shape Budget**: 120–150+ distinct regions
**Minimum Gap**: 0.5mm
**Internal Detail**: Fractal subdivision — large shapes contain smaller shapes contain smaller shapes
**Background**: Fill 90% of negative space with pattern elements
**Focus**: Meditative, immersive, "hidden object" density

**Rule**: The image should reveal new details on each viewing.
    `.trim(),
    maxShapes: 150,
    minGapMm: 0.5,
    allowsBackground: true,
    allowsTexture: true,
    regionDensity: 'maximum'
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. AUDIENCE RULES — Motor Skills + Safety + Tone
// ═══════════════════════════════════════════════════════════════════════════════

interface AudienceSpec {
  prompt: string;
  safetyMargin: number; // Percentage margin around edges
  centreWeighted: boolean;
  maxComplexity: string;
  prohibitedContent: string[];
}

const AUDIENCE_SPECS: Record<string, AudienceSpec> = {

  'toddlers': {
    prompt: `
### Target Audience: Toddlers (Ages 1–3)

**Motor Skills**: Gross motor only — large arm movements, limited precision
**Composition**: Subject MUST be centre-weighted with 20% safety margin (no important elements near edges)
**Recognition**: Subject must be instantly recognisable — archetypal forms only
**Background**: ZERO background elements — subject floats alone on white
**Mood**: Calm, friendly, non-threatening

**Rule**: If it takes more than 1 second to identify the subject, it's too complex.
    `.trim(),
    safetyMargin: 20,
    centreWeighted: true,
    maxComplexity: 'Very Simple',
    prohibitedContent: ['scary', 'teeth', 'claws', 'fire', 'weapons', 'villains']
  },

  'preschool': {
    prompt: `
### Target Audience: Preschool (Ages 3–5)

**Motor Skills**: Developing fine motor — can stay within large boundaries
**Composition**: Centre-focused with simple scene context allowed
**Recognition**: Simple storytelling scenes with clearly defined characters
**Background**: Sparse — maximum 2–3 background elements, clearly separated
**Mood**: Happy, adventurous, wonder-filled

**Rule**: The scene should tell a simple story a child can narrate.
    `.trim(),
    safetyMargin: 15,
    centreWeighted: true,
    maxComplexity: 'Simple',
    prohibitedContent: ['scary', 'violence', 'weapons', 'death']
  },

  'kids': {
    prompt: `
### Target Audience: Kids (Ages 6–10)

**Motor Skills**: Competent fine motor — can handle standard colouring book detail
**Composition**: Dynamic, balanced — can fill the frame
**Recognition**: Fun, action-oriented scenes with character interaction
**Background**: Standard complexity — environmental storytelling permitted
**Mood**: Energetic, fun, imaginative, adventurous

**Rule**: Should make a child say "Cool!" and want to show their parents.
    `.trim(),
    safetyMargin: 10,
    centreWeighted: false,
    maxComplexity: 'Moderate',
    prohibitedContent: ['gore', 'sexual content', 'extreme violence']
  },

  'teens': {
    prompt: `
### Target Audience: Teens (Ages 11–17)

**Motor Skills**: Full fine motor competence
**Composition**: Dynamic, stylish — can handle complex layouts
**Recognition**: "Cool" factor important — pop culture awareness, dynamic poses
**Background**: Full complexity permitted
**Mood**: Stylish, dynamic, aspirational, culturally aware

**Rule**: Would this look good as a poster on a teenager's wall?
    `.trim(),
    safetyMargin: 5,
    centreWeighted: false,
    maxComplexity: 'Intricate',
    prohibitedContent: ['gore', 'sexual content', 'drug use']
  },

  'adults': {
    prompt: `
### Target Audience: Adults (18+)

**Motor Skills**: Full capability — precision is a feature, not a bug
**Composition**: Full-bleed permitted — sophisticated layouts, infinite canvas feel
**Recognition**: Artistic beauty and sophistication prioritised
**Background**: Complex layering encouraged
**Mood**: Sophisticated, meditative, artistic, challenging

**Texture Rules**: High intricacy. Fine liner detail. Complex patterns. Texture and shading (stippling/hatching) are ALLOWED for artistic effect. NO grayscale fills.

**Rule**: Should provide genuine relaxation and artistic satisfaction.
    `.trim(),
    safetyMargin: 0,
    centreWeighted: false,
    maxComplexity: 'Extreme Detail',
    prohibitedContent: ['illegal content']
  },

  'seniors': {
    prompt: `
### Target Audience: Seniors (65+)

**Motor Skills**: May have reduced fine motor / visual acuity
**Composition**: High visibility — distinct sections, generous spacing
**Recognition**: Clear, unambiguous imagery
**Background**: Moderate — avoid visual clutter
**Mood**: Nostalgic, peaceful, dignified

**Rule**: All details should be clearly visible without squinting.
    `.trim(),
    safetyMargin: 15,
    centreWeighted: false,
    maxComplexity: 'Moderate',
    prohibitedContent: ['tiny details', 'cluttered compositions']
  },

  'sen': {
    prompt: `
### Target Audience: Special Educational Needs

**Motor Skills**: Variable — prioritise predictability over precision
**Composition**: Structured, predictable — avoid chaotic elements or "busy" areas
**Recognition**: Familiar, calming subjects
**Background**: Minimal — reduce sensory overwhelm
**Mood**: Calming, predictable, safe, structured

**Rule**: Predictability is key. Every element should feel intentional and orderly.
    `.trim(),
    safetyMargin: 20,
    centreWeighted: true,
    maxComplexity: 'Simple',
    prohibitedContent: ['chaotic', 'busy', 'unpredictable', 'scary', 'overwhelming']
  },

  'default': {
    prompt: `
### Target Audience: General

**Motor Skills**: Standard capability assumed
**Composition**: Balanced, professional
**Background**: Moderate complexity
**Mood**: Broadly appealing

**Rule**: Should work for most audiences without specific optimisation.
    `.trim(),
    safetyMargin: 10,
    centreWeighted: false,
    maxComplexity: 'Moderate',
    prohibitedContent: ['inappropriate content']
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 5. COMPATIBILITY MATRIX — Conflict Detection & Resolution
// ═══════════════════════════════════════════════════════════════════════════════

interface CompatibilityResult {
  isCompatible: boolean;
  warnings: string[];
  adjustments: {
    complexity?: string;
    style?: string;
  };
  resolvedComplexity: string;
  resolvedStyle: string;
}

const checkCompatibility = (
  styleId: string,
  complexityId: string,
  audienceId: string
): CompatibilityResult => {
  const style = STYLE_SPECS[styleId] || STYLE_SPECS['default'];
  const audience = AUDIENCE_SPECS[audienceId] || AUDIENCE_SPECS['default'];

  const warnings: string[] = [];
  const adjustments: { complexity?: string; style?: string } = {};

  let resolvedComplexity = complexityId;
  let resolvedStyle = styleId;

  // Check 1: Style-Complexity compatibility
  if (!style.compatibleComplexity.includes(complexityId)) {
    const nearestCompatible = style.compatibleComplexity[style.compatibleComplexity.length - 1];
    warnings.push(
      `Style "${styleId}" is incompatible with complexity "${complexityId}". ` +
      `Adjusting to "${nearestCompatible}".`
    );
    adjustments.complexity = nearestCompatible;
    resolvedComplexity = nearestCompatible;
  }

  // Check 2: Audience-Complexity ceiling
  const complexityOrder = ['Very Simple', 'Simple', 'Moderate', 'Intricate', 'Extreme Detail'];
  const maxComplexityIndex = complexityOrder.indexOf(audience.maxComplexity);
  const requestedComplexityIndex = complexityOrder.indexOf(resolvedComplexity);

  if (requestedComplexityIndex > maxComplexityIndex) {
    warnings.push(
      `Audience "${audienceId}" has maximum complexity "${audience.maxComplexity}". ` +
      `Reducing from "${resolvedComplexity}".`
    );
    adjustments.complexity = audience.maxComplexity;
    resolvedComplexity = audience.maxComplexity;
  }

  // Check 3: Style-Audience suitability (soft warnings)
  if (audienceId === 'toddlers' && ['Botanical', 'Fantasy', 'Gothic', 'Realistic'].includes(styleId)) {
    warnings.push(
      `Style "${styleId}" may be too complex for toddlers. Consider "Bold & Easy" or "Kawaii".`
    );
  }

  if (audienceId === 'seniors' && style.minRegionMm < 4) {
    warnings.push(
      `Style "${styleId}" has small minimum regions (${style.minRegionMm}mm²) which may be difficult for seniors to see.`
    );
  }

  return {
    isCompatible: warnings.length === 0,
    warnings,
    adjustments,
    resolvedComplexity,
    resolvedStyle
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 6. HERO CHARACTER VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

interface HeroValidationResult {
  isValid: boolean;
  warnings: string[];
  adjustedDescription: string | null;
}

const validateHeroForAudience = (
  heroDNA: CharacterDNA,
  audienceId: string
): HeroValidationResult => {
  const audience = AUDIENCE_SPECS[audienceId] || AUDIENCE_SPECS['default'];
  const warnings: string[] = [];

  const heroDescription = `${heroDNA.body} ${heroDNA.face} ${heroDNA.outfitCanon}`.toLowerCase();

  // Check for prohibited content in hero description
  for (const prohibited of audience.prohibitedContent) {
    if (heroDescription.includes(prohibited.toLowerCase())) {
      warnings.push(
        `Hero character contains "${prohibited}" which is prohibited for audience "${audienceId}".`
      );
    }
  }

  // Check complexity of hero description vs audience
  const descriptionWordCount = heroDescription.split(/\s+/).length;
  if (audienceId === 'toddlers' && descriptionWordCount > 20) {
    warnings.push(
      `Hero description is too detailed (${descriptionWordCount} words) for toddlers. Simplify to ~10 words.`
    );
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    adjustedDescription: null // Future: auto-simplification
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 7. BASE NEGATIVE PROMPT — Safety Net
// ═══════════════════════════════════════════════════════════════════════════════

const BASE_NEGATIVE = `
photo, photograph, photorealistic, realism,
staged scene, flatlay, flat lay, product shot, promotional shot,
overhead shot of desk, drafting table background, art supplies on table,
pencils, pens, crayons, markers, brushes,
shadow, drop shadow, contact shadow, vignette, depth of field,
angled view, perspective shot, tilt shift,
crumpled paper, wrinkled paper, parchment texture,
cardboard, canvas grain, noise, dither,
color, colored, colorful, pigment, paint, watercolor,
red, blue, green, yellow, pink, purple,
colored fill, grey fill, multi-colored,
text, watermark, signature, logo, date,
human, people, man, woman, person, face, skin (unless explicitly prompted),
deformed hands, extra fingers, distorted face
`.trim();

// STYLE-SPECIFIC NEGATIVES — Override pattern for different styles
const STYLE_NEGATIVES: Record<string, string> = {
  // Bold & Easy hates texture - keep everything simple
  'Bold & Easy': 'sketch lines, hatching, stippling, texture, shading, grayscale, broken lines, fuzzy edges, fine detail',
  // Cozy Hand-Drawn ALLOWS texture for warmth
  'Cozy Hand-Drawn': 'digital perfection, vector smoothness, mechanical lines, rigid geometry, sharp corners, clinical',
  // Kawaii - keep smooth and cute
  'Kawaii': 'realistic proportions, sharp edges, mature style, detailed anatomy, harsh lines, gritty',
  // Whimsical - allow flowing lines, ban rigidity
  'Whimsical': 'rigid geometry, mechanical lines, straight edges, harsh angles, digital precision, sterile',
  // Cartoon - dynamic lines, ban static
  'Cartoon': 'static poses, uniform weight, rigid lines, photorealistic, detailed texture, stiff',
  // Botanical ALLOWS stippling and hatching
  'Botanical': 'cartoon style, thick lines, bold strokes, simplified shapes, chunky, wobbly',
  // Mandala - geometric precision required
  'Mandala': 'asymmetric patterns, organic shapes, irregular spacing, wobbly lines, freehand imperfection',
  // Zentangle ALLOWS decorative patterns
  'Zentangle': 'representational imagery, figurative, realistic subjects, smooth empty spaces',
  // Fantasy ALLOWS dramatic line weight variation
  'Fantasy': 'cartoon style, simple shapes, uniform lines, mundane subjects, casual style',
  // Gothic - thick bold lines only
  'Gothic': 'thin lines, delicate strokes, soft curves, rounded shapes, intricate detail, gentle',
  // Cozy - soft and warm
  'Cozy': 'sharp angles, harsh edges, cold tones, industrial, aggressive, clinical, geometric',
  // Geometric - pure straight lines
  'Geometric': 'curves, organic shapes, freehand, wobbly, natural forms, soft transitions',
  // Wildlife ALLOWS directional texture strokes
  'Wildlife': 'cartoon style, stylised, simplified anatomy, closed hatching, solid black',
  // Floral - Art Nouveau flowing
  'Floral': 'geometric rigidity, sharp angles, isolated elements, sparse composition, mechanical',
  // Abstract - expressive variation allowed
  'Abstract': 'representational subjects, figurative imagery, narrative content, recognisable objects',
  // Realistic (Ligne Claire) - uniform weight only
  'Realistic': 'line weight variation, hatching, cross-hatching, expressive marks, sketchy, loose',
  // Default fallback
  'default': 'grayscale, shading, gradients, 3d render, sketch lines, pencil lead, smudge'
};

// ═══════════════════════════════════════════════════════════════════════════════
// 8. CONTEXTUAL NEGATIVE GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

const getContextualNegatives = (
  prompt: string,
  styleId: string,
  audienceId: string
): string => {
  const p = prompt.toLowerCase();
  const negatives: string[] = [];

  // Scene-based negatives
  if (p.includes('room') || p.includes('inside') || p.includes('interior')) {
    negatives.push('outdoor elements', 'sun', 'clouds', 'mountains', 'trees in background');
  }
  if (p.includes('underwater') || p.includes('ocean') || p.includes('sea')) {
    negatives.push('fire', 'smoke', 'dust', 'clouds', 'land animals');
  }
  if (p.includes('space') || p.includes('galaxy') || p.includes('planet')) {
    negatives.push('water', 'grass', 'trees', 'ground', 'horizon line');
  }
  if (p.includes('forest') || p.includes('woods') || p.includes('jungle')) {
    negatives.push('buildings', 'cars', 'roads', 'urban elements');
  }

  // Style-specific negatives from STYLE_SPECS
  const style = STYLE_SPECS[styleId];
  if (style) {
    negatives.push(style.negatives);
  }

  // Style-specific OVERRIDES from STYLE_NEGATIVES (targeted bans)
  const styleNegative = STYLE_NEGATIVES[styleId] || STYLE_NEGATIVES['default'];
  if (styleNegative) {
    negatives.push(styleNegative);
  }

  // Audience-specific negatives
  const audience = AUDIENCE_SPECS[audienceId];
  if (audience) {
    negatives.push(...audience.prohibitedContent);
  }

  return negatives.join(', ');
};

// ═══════════════════════════════════════════════════════════════════════════════
// 9. PROMPT ASSEMBLY ENGINE — Constraint-First Architecture
// ═══════════════════════════════════════════════════════════════════════════════

export interface BuildPromptResult {
  fullPrompt: string;
  fullNegativePrompt: string;
  compatibility: CompatibilityResult;
  heroValidation: HeroValidationResult | null;
  resolvedParams: {
    style: string;
    complexity: string;
    audience: string;
  };
}

export const buildPrompt = (
  userPrompt: string,
  styleId: string,
  complexityId: string,
  requiresText: boolean,
  audiencePrompt: string,
  audienceId: string,
  styleDNA?: StyleDNA | null,
  heroDNA?: CharacterDNA
): BuildPromptResult => {

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 1: Compatibility Resolution
  // ─────────────────────────────────────────────────────────────────────────────

  const compatibility = checkCompatibility(styleId, complexityId, audienceId);
  const resolvedStyleId = compatibility.resolvedStyle;
  const resolvedComplexityId = compatibility.resolvedComplexity;

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 2: Hero Validation (if applicable)
  // ─────────────────────────────────────────────────────────────────────────────

  let heroValidation: HeroValidationResult | null = null;
  if (heroDNA) {
    heroValidation = validateHeroForAudience(heroDNA, audienceId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 3: Fetch Resolved Specifications
  // ─────────────────────────────────────────────────────────────────────────────

  const styleSpec = STYLE_SPECS[resolvedStyleId] || STYLE_SPECS['default'];
  const complexitySpec = COMPLEXITY_SPECS[resolvedComplexityId] || COMPLEXITY_SPECS['Moderate'];
  const audienceSpec = AUDIENCE_SPECS[audienceId] || AUDIENCE_SPECS['default'];

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 4: Build Subject Description
  // ─────────────────────────────────────────────────────────────────────────────

  let subjectBlock: string;
  let characterConsistencyBlock = '';

  if (heroDNA) {
    subjectBlock = `
## Subject Matter

**Main Character**: ${heroDNA.name}, ${heroDNA.role}
**Appearance**: ${heroDNA.body}. ${heroDNA.face}. ${heroDNA.hair}.
**Outfit**: ${heroDNA.outfitCanon}
**Action/Scene**: ${userPrompt}
    `.trim();

    characterConsistencyBlock = `
## Character Consistency Rules

- The character MUST match the description above exactly
- Do NOT transform the character (e.g., do not make an animal character human)
- Maintain established scale and proportions
- Preserve all identifying features across the image
    `.trim();
  } else {
    subjectBlock = `
## Subject Matter

${userPrompt}
    `.trim();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 5: Build Text Integration Block (if required)
  // ─────────────────────────────────────────────────────────────────────────────

  let textBlock = '';
  if (requiresText) {
    const quotedText = userPrompt.match(/"([^"]+)"/)?.[1] || userPrompt;
    textBlock = `
## Text Integration

**Text to Include**: "${quotedText}"
**Requirements**:
- Letters must be OUTLINED (hollow), not filled
- Text must be clearly legible at print size
- Treat text as a graphical element within the composition
- Each letter interior is a colourable region
    `.trim();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 6: Build Style DNA Override (if provided)
  // ─────────────────────────────────────────────────────────────────────────────

  let styleDNABlock = '';
  if (styleDNA) {
    styleDNABlock = `
## Style Mimicry Override

Apply these specific attributes from reference:
- **Line Weight**: ${styleDNA.lineWeight}
- **Density**: ${styleDNA.density}
- **Line Style**: ${styleDNA.lineStyle}

These override the default style parameters where they conflict.
    `.trim();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 7: Assemble Final Prompt (Constraint-First Order)
  // ─────────────────────────────────────────────────────────────────────────────

  // CRITICAL: Constraints come BEFORE subject matter
  // This ensures the model "decides within rules" rather than "retrofits rules to decisions"

  const sections = [
    UNIVERSAL_HEADER,
    styleSpec.prompt,
    complexitySpec.prompt,
    audienceSpec.prompt,
    styleDNABlock,
    '---', // Section divider
    subjectBlock,
    characterConsistencyBlock,
    textBlock
  ].filter(section => section.trim() !== '');

  const fullPrompt = sections.join('\n\n');

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 8: Build Negative Prompt
  // ─────────────────────────────────────────────────────────────────────────────

  const contextualNegatives = getContextualNegatives(userPrompt, resolvedStyleId, audienceId);
  const fullNegativePrompt = [BASE_NEGATIVE, contextualNegatives]
    .filter(n => n.trim() !== '')
    .join(', ')
    .replace(/\s+/g, ' ')
    .trim();

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 9: Return Complete Result
  // ─────────────────────────────────────────────────────────────────────────────

  return {
    fullPrompt,
    fullNegativePrompt,
    compatibility,
    heroValidation,
    resolvedParams: {
      style: resolvedStyleId,
      complexity: resolvedComplexityId,
      audience: audienceId
    }
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 10. EXPORTS FOR UI/VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

// Style metadata for UI dropdowns
export const getStyleMetadata = () => {
  return Object.entries(STYLE_SPECS).map(([id, spec]) => ({
    id,
    minRegionMm: spec.minRegionMm,
    maxRegions: spec.maxRegions,
    compatibleComplexity: spec.compatibleComplexity,
    allowsTexture: spec.allowsTextureMarks
  }));
};

// Complexity metadata for UI dropdowns
export const getComplexityMetadata = () => {
  return Object.entries(COMPLEXITY_SPECS).map(([id, spec]) => ({
    id,
    maxShapes: spec.maxShapes,
    minGapMm: spec.minGapMm,
    regionDensity: spec.regionDensity
  }));
};

// Audience metadata for UI dropdowns
export const getAudienceMetadata = () => {
  return Object.entries(AUDIENCE_SPECS).map(([id, spec]) => ({
    id,
    maxComplexity: spec.maxComplexity,
    safetyMargin: spec.safetyMargin
  }));
};

// Validate a combination before generation
export const validateCombination = (
  styleId: string,
  complexityId: string,
  audienceId: string
): CompatibilityResult => {
  return checkCompatibility(styleId, complexityId, audienceId);
};

// Legacy export for backwards compatibility
export const STYLE_RULES: Record<string, { recommendedTemperature: number; allowsTextureShading: boolean }> = {
  'Cozy Hand-Drawn': { recommendedTemperature: 0.9, allowsTextureShading: false },
  'Bold & Easy': { recommendedTemperature: 0.7, allowsTextureShading: false },
  'Kawaii': { recommendedTemperature: 0.8, allowsTextureShading: false },
  'Botanical': { recommendedTemperature: 0.7, allowsTextureShading: true },
  'Fantasy': { recommendedTemperature: 0.85, allowsTextureShading: true },
  'Gothic': { recommendedTemperature: 0.75, allowsTextureShading: false },
  'Geometric': { recommendedTemperature: 0.6, allowsTextureShading: false },
  'Wildlife': { recommendedTemperature: 0.75, allowsTextureShading: true },
  'Mandala': { recommendedTemperature: 0.7, allowsTextureShading: false },
  'Zentangle': { recommendedTemperature: 0.75, allowsTextureShading: true },
  'default': { recommendedTemperature: 0.8, allowsTextureShading: false }
};

export const SYSTEM_INSTRUCTION = `You are a professional coloring book illustrator specialising in black and white line art. Your output must ALWAYS be pure black lines on pure white background with NO shading, NO fills, and ALL shapes fully closed for colouring.`;