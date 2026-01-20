# Gemini Image Generation API Reference

Based on official documentation for `gemini-2.5-flash-image` and `gemini-3-pro-image-preview`.

## 1. Aspect Ratios and Image Size

The model defaults to a 1:1 square matching the input image size. specific aspect ratios and sizes can be requested via `imageConfig`.

### Code Example (JavaScript/TypeScript)

```javascript
import { GoogleGenAI } from "@google/genai";

// For gemini-2.5-flash-image
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash-image",
  contents: prompt,
  config: {
    imageConfig: {
      aspectRatio: "16:9",
    },
  }
});

// For gemini-3-pro-image-preview
const response_gemini3 = await ai.models.generateContent({
  model: "gemini-3-pro-image-preview",
  contents: prompt,
  config: {
    imageConfig: {
      aspectRatio: "16:9",
      imageSize: "2K",
    },
  }
});
```

### Supported Resolutions

| Aspect Ratio | 1K Resolution | 2K Resolution | 4K Resolution |
| :--- | :--- | :--- | :--- |
| **1:1** | 1024x1024 | 2048x2048 | 4096x4096 |
| **2:3** | 848x1264 | 1696x2528 | 3392x5056 |
| **3:2** | 1264x848 | 2528x1696 | 5056x3392 |
| **3:4** | 896x1200 | 1792x2400 | 3584x4800 |
| **4:3** | 1200x896 | 2400x1792 | 4800x3584 |
| **4:5** | 928x1152 | 1856x2304 | 3712x4608 |
| **5:4** | 1152x928 | 2304x1856 | 4608x3712 |
| **9:16** | 768x1376 | 1536x2752 | 3072x5504 |
| **16:9** | 1376x768 | 2752x1536 | 5504x3072 |
| **21:9** | 1584x672 | 3168x1344 | 6336x2688 |

---

## 2. Character Consistency: 360 View

Generate 360-degree views by iteratively prompting for different angles. Include previously generated images or a reference image to maintain consistency.

```javascript
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

async function main() {
  const ai = new GoogleGenAI({});

  const imagePath = "/path/to/your/man_in_white_glasses.jpg";
  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString("base64");

  const prompt = [
    { text: "A studio portrait of this man against white, in profile looking right" },
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Image,
      },
    },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: prompt,
  });

  // Save the output...
}
```

---

## 3. Advanced Composition: Combining Multiple Images

Provide multiple images as context to create a new, composite scene. Perfect for product mockups or creative collages.

```javascript
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

async function main() {
  const ai = new GoogleGenAI({});

  // ... read files to base64 ...

  const prompt = [
    {
      inlineData: {
        mimeType: "image/png",
        data: base64Image1, // e.g. dress.png
      },
    },
    {
      inlineData: {
        mimeType: "image/png",
        data: base64Image2, // e.g. model.png
      },
    },
    { text: "Create a professional e-commerce fashion photo. Take the blue floral dress from the first image and let the model from the second image wear it..." }
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
  });
  
  // ... handle response ...
}
```

---

## 4. Style Transfer

Provide an image and ask the model to recreate its content in a different artistic style.

```javascript
const prompt = [
  {
    inlineData: {
      mimeType: "image/png",
      data: base64Image,
    },
  },
  { text: "Transform the provided photograph of a modern city street at night into the artistic style of Vincent van Gogh" }
];

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash-image",
  contents: prompt,
});
```

---

## 5. Inpainting (Semantic Masking)

Conversationally define a "mask" to edit a specific part of an image while leaving the rest untouched.

### Code Example

```javascript
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

async function main() {
  const ai = new GoogleGenAI({});

  const imagePath = "/path/to/your/living_room.png";
  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString("base64");

  const prompt = [
    {
      inlineData: {
        mimeType: "image/png",
        data: base64Image,
      },
    },
    { text: "Using the provided image of a living room, change only the blue sofa to be a vintage, brown leather chesterfield" }
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
  });
  
  // Save output...
}
```

---

## 6. Adding and Removing Elements

Provide an image and describe your change. The model will match the original image's style, lighting, and perspective.

### Code Example

```javascript
const prompt = [
  { text: "Using the provided image of my cat, please add a small, knitted wizard hat on its head. Make it look like..." },
  {
    inlineData: {
      mimeType: "image/png",
      data: base64Image,
    },
  },
];
// (Standard generateContent call)
```

---

## 7. Sequential Art (Comic Panel / Storyboard)

Builds on character consistency and scene description to create panels for visual storytelling. **Best used with Gemini 3 Pro Image Preview.**

### Code Example

```javascript
const prompt = [
  { text: "Make a 3 panel comic in a gritty, noir art style with high-contrast black and white inks. Put the character..." },
  {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image, // Reference character
    },
  },
];

const response = await ai.models.generateContent({
  model: "gemini-3-pro-image-preview",
  contents: prompt,
});
```

---

## 8. Accurate Text in Images

Gemini excels at rendering text. Be clear about the text, the font style (descriptively), and the overall design. **Use Gemini 3 Pro Image Preview for professional asset production.**

### Code Example

```javascript
const prompt = "Create a modern, minimalist logo for a coffee shop called 'The Daily Grind'. The text should be in a clean, bold...";

const response = await ai.models.generateContent({
  model: "gemini-3-pro-image-preview",
  contents: prompt,
  config: {
    imageConfig: {
      aspectRatio: "1:1",
    },
  }
});
```

---

## 9. Stylized Illustrations & Stickers

To create stickers, icons, or assets, be explicit about the style and request a transparent background.

### Code Example

```javascript
const prompt = "A kawaii-style sticker of a happy red panda wearing a tiny bamboo hat. It's munching on a green bamboo leaf... The background should be transparent.";

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash-image",
  contents: prompt,
});
```

---

## 10. New Features in Gemini 3 Pro Image

**Model:** `gemini-3-pro-image-preview`

Gemini 3 Pro Image is optimized for professional asset production with advanced reasoning.

*   **High-Resolution Output**: Built-in 1K, 2K, and 4K generation.
*   **Advanced Text Rendering**: Legible, stylized text for infographics and layouts.
*   **Grounding**: Uses Google Search for real-time data (e.g., weather maps, stock charts).
*   **Thinking Mode**: Generates interim "thought images" (visible in backend, not charged) to refine composition before final output.
*   **Deep Reasoning**: Excels at complex, multi-turn modification tasks.

### Generating up to 4K Resolution

Specify `imageSize` using explicit uppercase 'K' values (`'1K'`, `'2K'`, `'4K'`).

```javascript
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

async function main() {
  const ai = new GoogleGenAI({});

  const prompt = 'Da Vinci style anatomical sketch of a dissected Monarch butterfly...';
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: prompt,
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: '1:1',
        imageSize: '1K', // Must use uppercase 'K': '1K', '2K', '4K'
      },
    },
  });
  
  // Save output...
}
```

### Using Up to 14 Reference Images

You can mix up to 14 reference images, including:
*   Up to **6 high-fidelity objects**
*   Up to **5 humans** for character consistency

```javascript
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

async function main() {
  const ai = new GoogleGenAI({});

  const prompt = 'An office group photo of these people, they are making funny faces.';
  
  const contents = [
    { text: prompt },
    // Add up to 14 images (shown here as pseudo-code for brevity)
    { inlineData: { mimeType: "image/jpeg", data: base64ImageFile1 } },
    { inlineData: { mimeType: "image/jpeg", data: base64ImageFile2 } },
    { inlineData: { mimeType: "image/jpeg", data: base64ImageFile3 } },
    // ...
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: contents,
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: '5:4',
        imageSize: '2K',
      },
    },
  });

  // Handle response (saving image)
  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      // Save image...
    }
  }
}
```

---

## 11. Model Terminology: "Nano Banana"

"Nano Banana" is the internal codename/branding for Gemini's native image generation capabilities.

*   **Nano Banana**: Refers to `gemini-2.5-flash-image`. Designed for **speed and efficiency**. Optimized for high-volume, low-latency tasks.
*   **Nano Banana Pro**: Refers to `gemini-3-pro-image-preview`. Designed for **professional asset production**. Utilizes advanced reasoning ("Thinking") to follow complex instructions and render high-fidelity text.

All generated images include a **SynthID watermark**.

---

## 12. Multi-Turn Image Editing

Keep generating and editing images conversationally. Chat or multi-turn conversation is the recommended way to iterate on images.

### Code Example: Conversational Editing

```javascript
import { GoogleGenAI } from "@google/genai";

async function main() {
  const ai = new GoogleGenAI({});
  
  // Initialize chat with the Pro model
  const chat = ai.chats.create({
    model: "gemini-3-pro-image-preview",
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      tools: [{googleSearch: {}}], // Optional: Enable grounding
    },
  });

  // Turn 1: Initial Creation
  const message1 = "Create a vibrant infographic that explains photosynthesis as if it were a recipe for a plant's favorite meal";
  let response = await chat.sendMessage(message1);
  // ... save response image ...

  // Turn 2: Modification (maintains context)
  const message2 = "Update this infographic to be in Spanish. Do not change any other elements of the image.";
  response = await chat.sendMessage({
    text: message2,
    config: {
      imageConfig: {
        aspectRatio: '16:9',
        imageSize: '2K',
      },
      responseModalities: ['TEXT', 'IMAGE'],
    }
  });
  
  // ... save updated response image ...
}
```

### Code Example: Editing with Mixed Input (Image + Text)

Provide an image and use text prompts to add, remove, or modify elements.

```javascript
const prompt = [
  { text: "Create a picture of my cat eating a nano-banana in a fancy restaurant under the Gemini constellation" },
  {
    inlineData: {
      mimeType: "image/png",
      data: base64Image, // Cat photo
    },
  },
];

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash-image",
  contents: prompt,
});
```
