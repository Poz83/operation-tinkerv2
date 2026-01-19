# Gemini API Pricing & Models (Captured Jan 2026)

Reference: [Google AI Pricing](https://ai.google.dev/gemini-api/docs/pricing)

## Core Models Pricing

| Model | Input Price (per 1M tokens) | Output Price (per 1M tokens) | Context Window | Best For |
| :--- | :--- | :--- | :--- | :--- |
| **Gemini 2.5 Flash-Lite Preview** | TBD | TBD | 1M | Ultra-fast text generation |
| **Gemini 1.5 Flash** | $0.075 | $0.30 | 1M | High-volume, low-latency tasks |
| **Gemini 1.5 Flash-8B** | $0.0375 | $0.15 | 1M | Extremely high volume, simple tasks |
| **Gemini 1.5 Pro** | $3.50 | $10.50 | 2M | Complex reasoning, strict instructions (Book Planning) |
| **Gemini 1.0 Pro** | $0.50 | $1.50 | 32k | Legacy text tasks |

*(Note: Prices >128k context window are typically 2x higher)*

## Image Generation Pricing (Imagen 3 / Gemini 3 Image)

| Model | Price per Image |
| :--- | :--- |
| **Imagen 3 (Standard)** | $0.04 |
| **Imagen 3 (Fast)** | $0.02 |

## Cost Estimation Formula for "Make a Book"

**Scenario: 10-Page Book**

1.  **Brainstorming ("Make It Better")**:
    *   Model: `Gemini 1.5 Flash` (or 2.0 Flash Exp - Free tier/Preview pricing often applies)
    *   Input: ~500 tokens | Output: ~200 tokens
    *   Cost: Negligible ($0.00004)

2.  **Planning (JSON)**:
    *   Model: `Gemini 1.5 Pro`
    *   Input: ~2k tokens | Output: ~1k tokens
    *   Cost: ~$0.01

3.  **Generation (10 Pages)**:
    *   Model: `Gemini 3 Pro Image`
    *   Cost: 10 * $0.04 = $0.40

**Total Est. Cost per Book**: ~$0.41

> [!TIP]
> **Gemini 2.0 Flash** is currently in "Experimental/Preview", which often means **free rate limits** or similar low pricing to 1.5 Flash. Once GA, it usually targets the Flash price point.
