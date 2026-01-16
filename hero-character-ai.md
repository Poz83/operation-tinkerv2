# Creating Consistent Hero Characters Across Multiple AI Images (Coloring Page Style)

## Executive Summary

Maintaining consistent character appearance across multiple AI-generated images is challenging but achievable with a structured workflow. This guide focuses on creating and reusing a single “hero” character across many images using Gemini 3 Pro (Nano Banana Pro), specifically in black-and-white coloring page style. The core strategy combines:

- A detailed **Character DNA** template (identity anchors)
- **Reference images** (visual memory)
- **Seed control** for composition stability
- **Prompt engineering** tuned for coloring pages
- **Session-based iteration** to refine while preserving identity

Used together, these techniques can deliver professional, publishable consistency across multi-page projects like coloring books or storybooks.

---

## 1. Why Character Consistency Is Hard for AI

Modern image models generate each image from scratch. Unless you constrain the model with explicit anchors (text, references, or seeds), it will treat each prompt as a new problem and “re-imagine” the character.

### Core reasons for character drift

- **No persistent visual memory** between calls unless you use reference images or session context
- **Ambiguous descriptions** (e.g., “a strong man” instead of “square jaw, shaved head, heavy eyebrows”)
- **Style shifts** (different art-style wording across prompts)
- **Uncontrolled randomness** (changing seeds, resolutions, or aspect ratios without a plan)

Consistency is therefore a *process* problem, not just a model limitation.

---

## 2. Character DNA: The Foundation for Consistency

### 2.1 What is Character DNA?

Character DNA is a structured description of your hero character that you copy-paste into every prompt. It defines all the visual elements that must stay stable:

- Identity: name/role/age
- Face structure: jawline, nose, cheekbones, lips
- Eyes: shape, size, color, unique marks
- Hair: length, color, texture, parting
- Skin tone: clear descriptor
- Body type: build, proportions
- Signature features: scars, marks, accessories
- Outfit canon: default clothing and key details
- Style lock: overall art style (e.g., “coloring book line art, monoline”)

### 2.2 Identity Anchors (High-Impact Traits)

Not all traits carry equal weight. The most reliable “anchors” are:

- A **distinctive facial mark** (scar, mole, facial tattoo)
- A **clear hair concept** (color + style + length + parting)
- A **signature accessory** (necklace, pendant, emblem, hat)

Examples of strong anchors:

- “Vertical scar on left cheekbone”
- “Jet-black straight hair, shoulder-length, center-parted”
- “Always wears a silver star pendant on the chest”

Aim for 1–3 strong anchors that you repeat in every prompt.

### 2.3 Example Character DNA Block

```md
CHARACTER DNA:
- Name: Captain Nova
- Role: Elite space commander
- Age: Early 30s
- Face: Square jawline, high cheekbones, straight nose, full lips
- Eyes: Almond-shaped amber eyes, vertical scar on left cheekbone
- Hair: Jet-black, straight, shoulder-length, center-parted
- Skin: Deep warm brown with golden undertones
- Body: Athletic build, tall, long limbs
- Signature Features: Silver star pendant on chest, fingerless black gloves
- Outfit Canon: Deep blue tactical suit, black boots, silver armor accents
- Style Lock: Comic-book coloring book line art, clean monoline, bold black outlines
```

Use this block as the header for every generation.

---

## 3. Using Reference Images with Gemini 3 Pro (Nano Banana Pro)

Gemini 3 Pro can take multiple reference images at once and reason about them. That makes it very strong for character consistency.

### 3.1 Best Practices for Reference Images

- **Start from a great base:** Generate a clean, full-body front view of your hero using your Character DNA.
- **Save that image** as your primary reference.
- (Optional) Generate 2–4 additional references: close-up face, profile, 3/4 view, and an action pose.

Your ideal reference set should:

- Show the character clearly (no heavy shadows, no clutter)
- Match the **default outfit** and **signature accessories**
- Have a neutral or simple pose for the “main” reference

### 3.2 Single vs Multiple Reference Workflows

**Single reference (fast and simple):**

- Use *one* strong reference + Character DNA for all pages.
- Each new image: upload same reference, paste the DNA, change only the scene.

**Multiple references (maximum consistency):**

- Use 3–5 references (different angles/poses).
- Rely slightly less on text; let the references carry the look.

For most coloring-book projects, a **single hero reference + Character DNA** is usually enough.

---

## 4. Seed Strategy and Composition Control

Some systems (and Gemini via API) allow you to fix a seed value. A seed controls the initial randomness of the generation.

- Same prompt + same seed → nearly identical image
- Same Character DNA + similar prompt + same seed → similar composition, high identity stability

### 4.1 Practical Seed Strategy

- Pick a seed that produced your best hero image.
- Reuse that seed for scenes where you want similar framing and proportions.
- Increment the seed (e.g., `12345` → `12346`) when you change pose or outfit significantly.

Example:

```md
SEED: 12345
Prompt: Captain Nova [DNA], standing in a futuristic command center, hands on hips, full-body, frontal.

SEED: 12345
Prompt: Captain Nova [DNA], standing in same command center, pointing at a holographic map, 3/4 view.

SEED: 12346
Prompt: Captain Nova [DNA], running through a forest in tactical gear, dynamic action pose.
```

You keep the seed stable for related shots, and adjust it purposely when you need a big change.

---

## 5. Prompt Engineering for Coloring Page Style

### 5.1 Master Prompt Structure

Use a consistent structure for *every* page:

```md
[CHARACTER DNA BLOCK]

SCENE:
[What the character is doing, where, camera angle, expression]

TECHNICAL STYLE:
[Coloring page style, resolution, aspect ratio, negative prompts]
```

### 5.2 Coloring Page Style Directives

To get clean, printable coloring pages, include:

- “coloring book style”
- “black and white line art”
- “bold black outlines” / “thick lines”
- “monoline, uniform line thickness”
- “no shading, no gradients, no gray tones”
- “white background, high contrast”

Example technical block:

```md
TECHNICAL STYLE:
- Coloring book line art
- Clean monoline black outlines, bold thick lines
- Pure black and white, no shading, no gradients, no gray
- White background, high contrast
- Suitable for children’s coloring book
- Aspect ratio: 3:4 portrait

Negative: color, shading, gradients, gray, blur, messy lines, artifacts, filled areas.
```

### 5.3 Example Full Prompt (Page 1)

```md
CHARACTER DNA:
- Name: Captain Nova
- Role: Elite space commander
- Age: Early 30s
- Face: Square jawline, high cheekbones, straight nose, full lips
- Eyes: Almond-shaped amber eyes, vertical scar on left cheekbone
- Hair: Jet-black, straight, shoulder-length, center-parted
- Skin: Deep warm brown
- Body: Athletic build, tall
- Signature Features: Silver star pendant on chest, fingerless black gloves
- Outfit Canon: Deep blue tactical suit, black boots, silver armor accents
- Style Lock: Comic-book coloring book line art, clean monoline, bold black outlines

SCENE:
Captain Nova standing at attention in a futuristic command center, hands behind her back, neutral confident expression, full-body shot, low-angle view that makes her look heroic.

TECHNICAL STYLE:
Coloring book illustration, black and white line art, clean monoline black outlines, bold thick lines, no shading, no gradients, no gray. White background, high contrast. 3:4 portrait aspect ratio.

Negative: color, shading, gradients, gray, blur, messy lines, artifacts, backgrounds full of clutter.
```

### 5.4 Example Prompt (Page 2 – New Scene, Same Hero)

```md
CHARACTER DNA:
[Same as Page 1]

SCENE:
Captain Nova running down a spacecraft corridor, dynamic action pose, one arm forward, determined expression, full-body shot, corridor walls receding in perspective.

TECHNICAL STYLE:
[Same as Page 1]
```

Only the **SCENE** block changes; the Character DNA and Technical Style stay identical.

---

## 6. Multi-Page Workflow for a Project

### 6.1 Phase 1 – Define and Lock the Hero

1. Write your full **Character DNA**.
2. Generate multiple variations until you find the best hero image.
3. Save that image as your main **reference**.
4. If your platform exposes the seed, record it too.

### 6.2 Phase 2 – Generate the First 3 Pages

1. Use the full Character DNA + Scene + Technical Style.
2. Page 1: classic pose (standing or simple action).
3. Page 2–3: different poses and simple environments.
4. Check: face, hair, signature features, line quality.
5. If something drifts, refine your Character DNA text and regenerate.

### 6.3 Phase 3 – Expand to the Full Set

1. Keep Character DNA and Technical Style **unchanged**.
2. For each new page, change only the **Scene** block.
3. Generate 3–5 pages at a time.
4. After every small batch, line up thumbnails and check:
   - Face shape and features
   - Hair style and length
   - Signature accessories (scar, pendant, gloves)
   - Line weight and cleanliness

If you see drift, paste the full Character DNA back in (if you’d shortened it) and regenerate that page.

### 6.4 Phase 4 – Quality Control & Print Readiness

Before final export:

- Verify every page in sequence so the hero reads as the **same person**.
- Print at least one test page at 300 DPI to check line strength and clarity.
- Make minor touch-ups (e.g., adjust line thickness) in a vector or raster editor if needed.

---

## 7. Iteration Strategy: Refine, Don’t Restart

Avoid deleting imperfect generations and starting over from scratch. Instead, *tell* the model what to fix while keeping identity.

Examples of refinement prompts:

- “Keep the same character and pose, but make the lines thicker and bolder for a kids coloring book.”
- “Keep the same character and outfit, but change the pose to a running pose.”
- “Keep the same character and face, but simplify the background so it’s mostly empty and easy to color.”

This multi-turn approach uses the model’s internal memory of the previous image, which often preserves subtle identity traits better than a fresh generation.

---

## 8. Consistency Checklist (Per Page)

Use this quick checklist before accepting each image:

- **Face:** Same jawline, nose, cheekbones, lip shape
- **Eyes:** Same shape and size, same position on the face
- **Hair:** Same length, parting, and overall shape
- **Signature features:** Scar, pendant, gloves, etc., clearly visible
- **Proportions:** Height and body proportions consistent with other pages
- **Line art quality:** Monoline, no random thin/thick sections
- **Printability:** High contrast, no gray/gradient, clean edges, no cluttered tiny details

If one of these fails, ask the model to fix *that specific point* while keeping everything else the same.

---

## 9. Documentation and Reuse for Future Projects

Create a simple log for your project:

```md
# Coloring Book Project Log

## Hero: Captain Nova

### Global Settings
- Model: Gemini 3 Pro (Nano Banana Pro)
- Style: Black and white coloring book line art
- Base Resolution: 1024×1365 (3:4 portrait)
- Main Seed: 12345

### Character DNA (Master Copy)
[Paste your full Character DNA here]

### Pages

#### Page 1
- Seed: 12345
- Scene: Standing in command center, heroic pose
- Notes: Perfect face and proportions; use as main reference.

#### Page 2
- Seed: 12345
- Scene: Running down corridor
- Notes: Good consistency, slightly thinner lines → regenerated once with “thicker lines” instruction.

#### Page 3
- Seed: 12346
- Scene: Inspecting equipment in engineering bay
- Notes: Face and pendant consistent, background simplified.
```

With this log, you can:

- Recreate pages later
- Reuse the same hero in new books
- Hand off a clear spec to collaborators

---

## 10. Practical Summary (Step-by-Step)

1. **Design the hero on paper first**:
   - Decide name, role, age, personality, visual anchors (scar, hair, accessory).
2. **Write the Character DNA** with very concrete physical descriptions.
3. **Generate and refine a base hero image**, then save it as your main reference.
4. **Lock your style**: coloring book line art, monoline, bold outlines, no shading.
5. For every new page:
   - Paste Character DNA
   - Write a new Scene block
   - Reuse the same Technical Style block
   - Optionally reuse/adjust a seed
6. **Iterate by giving corrective feedback** (“thicker lines”, “simpler background”, “same hero but new pose”).
7. **Check consistency** using the checklist before accepting each page.
8. **Document everything**: Character DNA, seeds, prompts, notes for each page.

Follow this process and you’ll be able to:

- Create a distinct hero character with a clear identity
- Reuse that character reliably across many images/pages
- Maintain a clean, printable coloring-page style throughout an entire project

All of these steps translate directly to your work with Gemini 3 Pro (Nano Banana Pro) and can be adapted to other models if needed.
