# Image Prompt Specification for Gemini 2.5 Flash Image

> **For Claude Code**: This document provides comprehensive guidance for creating effective image generation prompts using Gemini 2.5 Flash Image. Use these templates and best practices when helping users with image generation tasks.

## Core Capabilities

Gemini 2.5 Flash Image is a natively multimodal model with these key capabilities:

1. **Text-to-image**: Generate high-quality images from text descriptions
2. **Image + text-to-image (editing)**: Modify existing images with text prompts
3. **Multi-image composition**: Combine multiple images into new scenes
4. **Iterative refinement**: Progressive image improvement through conversation
5. **Text rendering**: Generate images containing clear, well-placed text

## Fundamental Principle

**Describe the scene, don't just list keywords.** Use narrative, descriptive paragraphs rather than disconnected word lists for coherent, high-quality results.

## Text-to-Image Generation Templates

### 1. Photorealistic Scenes

**Template:**
```
A photorealistic [shot type] of [subject], [action or expression], set in [environment]. The scene is illuminated by [lighting description], creating a [mood] atmosphere. Captured with a [camera/lens details], emphasizing [key textures and details]. The image should be in a [aspect ratio] format.
```

**When to use:** User requests realistic photography, portraits, or documentary-style images.

**Example:**
```
A photorealistic close-up portrait of an elderly Japanese ceramicist with deep, sun-etched wrinkles and a warm, knowing smile. He is carefully inspecting a freshly glazed tea bowl. The setting is his rustic, sun-drenched workshop. The scene is illuminated by soft, golden hour light streaming through a window, highlighting the fine texture of the clay. Captured with an 85mm portrait lens, resulting in a soft, blurred background (bokeh). The overall mood is serene and masterful. Vertical portrait orientation.
```

### 2. Stylized Illustrations & Stickers

**Template:**
```
A [style] sticker of a [subject], featuring [key characteristics] and a [color palette]. The design should have [line style] and [shading style]. The background must be white.
```

**When to use:** User needs icons, stickers, logos, or stylized graphics.

**Example:**
```
A kawaii-style sticker of a happy red panda wearing a tiny bamboo hat. It's munching on a green bamboo leaf. The design features bold, clean outlines, simple cel-shading, and a vibrant color palette. The background must be white.
```

### 3. Text Rendering in Images

**Template:**
```
Create a [image type] for [brand/concept] with the text "[text to render]" in a [font style]. The design should be [style description], with a [color scheme].
```

**When to use:** User needs logos, banners, signage, or any image with specific text.

**Example:**
```
Create a modern, minimalist logo for a coffee shop called 'The Daily Grind'. The text should be in a clean, bold, sans-serif font. The design should feature a simple, stylized icon of a coffee bean seamlessly integrated with the text. The color scheme is black and white.
```

### 4. Product Mockups & Commercial Photography

**Template:**
```
A high-resolution, studio-lit product photograph of a [product description] on a [background surface/description]. The lighting is a [lighting setup] to [lighting purpose]. The camera angle is a [angle type] to showcase [specific feature]. Ultra-realistic, with sharp focus on [key detail]. [Aspect ratio].
```

**When to use:** E-commerce, advertising, product showcases.

**Example:**
```
A high-resolution, studio-lit product photograph of a minimalist ceramic coffee mug in matte black, presented on a polished concrete surface. The lighting is a three-point softbox setup designed to create soft, diffused highlights and eliminate harsh shadows. The camera angle is a slightly elevated 45-degree shot to showcase its clean lines. Ultra-realistic, with sharp focus on the steam rising from the coffee. Square image.
```

### 5. Minimalist & Negative Space Design

**Template:**
```
A minimalist composition featuring a single [subject] positioned in the [position] of the frame. The background is a vast, empty [color] canvas, creating significant negative space. Soft, subtle lighting. [Aspect ratio].
```

**When to use:** Backgrounds for websites, presentations, marketing materials with text overlay.

**Example:**
```
A minimalist composition featuring a single, delicate red maple leaf positioned in the bottom-right of the frame. The background is a vast, empty off-white canvas, creating significant negative space for text. Soft, diffused lighting from the top left. Square image.
```

### 6. Sequential Art (Comic/Storyboard)

**Template:**
```
A single comic book panel in a [art style] style. In the foreground, [character description and action]. In the background, [setting details]. The panel has a [dialogue/caption box] with the text "[Text]". The lighting creates a [mood] mood. [Aspect ratio].
```

**When to use:** Storyboards, comic creation, visual narratives.

**Example:**
```
A single comic book panel in a gritty, noir art style with high-contrast black and white inks. In the foreground, a detective in a trench coat stands under a flickering streetlamp, rain soaking his shoulders. In the background, the neon sign of a desolate bar reflects in a puddle. A caption box at the top reads "The city was a tough place to keep secrets." The lighting is harsh, creating a dramatic, somber mood. Landscape.
```

## Image Editing Templates

### 1. Adding & Removing Elements

**Template:**
```
Using the provided image of [subject], please [add/remove/modify] [element] to/from the scene. Ensure the change is [description of how the change should integrate].
```

**When to use:** User wants to modify existing images by adding or removing objects.

### 2. Inpainting (Specific Area Editing)

**Template:**
```
Using the provided image, change only the [specific element] to [new element/description]. Keep everything else in the image exactly the same, preserving the original style, lighting, and composition.
```

**When to use:** User wants to change only one specific part of an image.

### 3. Style Transfer

**Template:**
```
Transform the provided photograph of [subject] into the artistic style of [artist/art style]. Preserve the original composition but render it with [description of stylistic elements].
```

**When to use:** User wants to apply artistic styles to existing photos.

### 4. Multi-Image Composition

**Template:**
```
Create a new image by combining the elements from the provided images. Take the [element from image 1] and place it with/on the [element from image 2]. The final image should be a [description of the final scene].
```

**When to use:** User wants to combine elements from multiple images.

## Claude Code Best Practices

### Prompt Construction Guidelines

1. **Be hyper-specific**: Instead of "fantasy armor," use "ornate elven plate armor, etched with silver leaf patterns, with a high collar and pauldrons shaped like falcon wings."

2. **Provide context and intent**: Always explain the purpose. "Create a logo for a high-end, minimalist skincare brand" yields better results than just "Create a logo."

3. **Use photographic terminology**: Control composition with terms like:
   - Wide-angle shot, macro shot, low-angle perspective
   - 85mm portrait lens, Dutch angle
   - Three-point lighting, golden hour lighting

4. **Semantic negative prompts**: Instead of "no cars," describe positively: "an empty, deserted street with no signs of traffic."

### Iterative Refinement Strategy

When helping users refine images:

1. **Start with a detailed base prompt** using the templates above
2. **Make incremental changes**: "That's great, but can you make the lighting a bit warmer?"
3. **Maintain consistency**: "Keep everything the same, but change the character's expression to be more serious."
4. **Address specific issues**: If character features drift, restart with detailed descriptions

### Aspect Ratio Management

- **Editing preserves input ratios**: Gemini 2.5 Flash Image generally maintains the input image's aspect ratio
- **Multiple images**: Uses the aspect ratio of the last image provided
- **Explicit control**: If needed, state "Do not change the input aspect ratio" or provide reference images with correct dimensions

### Common Use Cases for Fictures Project

Given this is a story writing platform, prioritize these image generation scenarios:

1. **Character portraits**: Use photorealistic templates for character visualization
2. **Scene illustrations**: Use stylized illustration templates for story scenes
3. **Book covers**: Combine text rendering with artistic composition
4. **Story thumbnails**: Use minimalist compositions with negative space
5. **Sequential storytelling**: Use comic panel templates for storyboards

## Error Handling & Limitations

### When to Iterate

- Complex typography may need refinement
- Character consistency across multiple images requires careful prompting
- Highly nuanced requests often need multiple attempts

### Troubleshooting Prompts

If the initial result isn't satisfactory:

1. **Add more descriptive detail** to the prompt
2. **Break complex requests** into simpler components
3. **Use reference styles**: "in the style of [specific artist/movement]"
4. **Clarify technical aspects**: lighting, camera angles, composition

### Response Strategy for Claude Code

When a user requests image generation:

1. **Analyze the request** to determine the appropriate template
2. **Ask clarifying questions** if the request is vague
3. **Provide the structured prompt** using the templates above
4. **Offer refinement suggestions** based on the user's feedback
5. **Maintain conversation flow** for iterative improvements

## Template Quick Reference

| Use Case | Template Number | Best For |
|----------|----------------|----------|
| Realistic photos | 1 | Portraits, documentary style |
| Icons/stickers | 2 | UI elements, branding |
| Text in images | 3 | Logos, signage, banners |
| Product shots | 4 | E-commerce, advertising |
| Backgrounds | 5 | Website backgrounds, presentations |
| Comics/storyboards | 6 | Sequential art, narratives |

## Integration with Fictures Workflow

For the Fictures story writing platform, image generation should support:

- **Character development**: Generate character portraits from descriptions
- **Scene visualization**: Create illustrations of story scenes
- **Cover art**: Design book covers with integrated text
- **Marketing materials**: Create promotional graphics for stories
- **User interface**: Generate icons and decorative elements

Always consider the story context and maintain visual consistency across a user's story collection.