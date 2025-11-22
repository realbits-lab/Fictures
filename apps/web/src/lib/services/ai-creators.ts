import { db } from "@/lib/db";
import { aiWriters, aiDesigners } from "@/lib/schemas/database";
import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

/**
 * Select a random AI writer or create a new one
 */
export async function selectOrCreateWriter(): Promise<{
    id: string;
    name: string;
    description: string;
    writingStyle: string;
}> {
    // Try to get a random writer
    const existingWriters = await db
        .select()
        .from(aiWriters)
        .orderBy(sql`RANDOM()`)
        .limit(1);

    if (existingWriters.length > 0 && Math.random() > 0.3) {
        // 70% chance to use existing writer
        const writer = existingWriters[0];

        // Update usage count
        await db
            .update(aiWriters)
            .set({
                usageCount: writer.usageCount + 1,
                lastUsedAt: new Date().toISOString(),
            })
            .where(sql`${aiWriters.id} = ${writer.id}`);

        return {
            id: writer.id,
            name: writer.name,
            description: writer.description,
            writingStyle: writer.writingStyle,
        };
    }

    // Create a new AI writer
    const writerProfile = await generateWriterProfile();
    const writerId = `writer_${nanoid(16)}`;

    await db.insert(aiWriters).values({
        id: writerId,
        name: writerProfile.name,
        description: writerProfile.description,
        writingStyle: writerProfile.writingStyle,
        personality: writerProfile.personality,
        expertise: writerProfile.expertise,
        voiceCharacteristics: writerProfile.voiceCharacteristics,
        usageCount: 1,
        lastUsedAt: new Date().toISOString(),
    });

    return {
        id: writerId,
        name: writerProfile.name,
        description: writerProfile.description,
        writingStyle: writerProfile.writingStyle,
    };
}

/**
 * Select a random AI designer or create a new one
 */
export async function selectOrCreateDesigner(): Promise<{
    id: string;
    name: string;
    description: string;
    designStyle: string;
}> {
    // Try to get a random designer
    const existingDesigners = await db
        .select()
        .from(aiDesigners)
        .orderBy(sql`RANDOM()`)
        .limit(1);

    if (existingDesigners.length > 0 && Math.random() > 0.3) {
        // 70% chance to use existing designer
        const designer = existingDesigners[0];

        // Update usage count
        await db
            .update(aiDesigners)
            .set({
                usageCount: designer.usageCount + 1,
                lastUsedAt: new Date().toISOString(),
            })
            .where(sql`${aiDesigners.id} = ${designer.id}`);

        return {
            id: designer.id,
            name: designer.name,
            description: designer.description,
            designStyle: designer.designStyle,
        };
    }

    // Create a new AI designer
    const designerProfile = await generateDesignerProfile();
    const designerId = `designer_${nanoid(16)}`;

    await db.insert(aiDesigners).values({
        id: designerId,
        name: designerProfile.name,
        description: designerProfile.description,
        designStyle: designerProfile.designStyle,
        personality: designerProfile.personality,
        expertise: designerProfile.expertise,
        aestheticPreferences: designerProfile.aestheticPreferences,
        usageCount: 1,
        lastUsedAt: new Date().toISOString(),
    });

    return {
        id: designerId,
        name: designerProfile.name,
        description: designerProfile.description,
        designStyle: designerProfile.designStyle,
    };
}

/**
 * Generate a new AI writer profile using AI
 */
async function generateWriterProfile() {
    const prompt = `Create a unique AI writer persona with the following attributes:
- Name: A creative, memorable name
- Description: A brief bio (2-3 sentences)
- Writing style: Choose from: poetic, concise, descriptive, dialogue-heavy, philosophical, humorous, dramatic, minimalist
- Personality traits: 3-5 traits (e.g., "introspective", "witty", "empathetic")
- Values: 2-4 core values (e.g., "authenticity", "creativity", "emotional depth")
- Quirks: 1-3 unique verbal or stylistic quirks
- Expertise: 3-5 areas of expertise (genres, themes, techniques)
- Voice characteristics:
  - Tone: Overall tone of voice
  - Vocabulary: Vocabulary level and style
  - Sentence structure: Typical sentence patterns

Return ONLY a valid JSON object with this exact structure:
{
  "name": "string",
  "description": "string",
  "writingStyle": "string",
  "personality": {
    "traits": ["string"],
    "values": ["string"],
    "quirks": ["string"]
  },
  "expertise": ["string"],
  "voiceCharacteristics": {
    "tone": "string",
    "vocabulary": "string",
    "sentence_structure": "string"
  }
}`;

    const model = google("gemini-2.0-flash-exp");
    const { text } = await generateText({
        model,
        system: "You are a creative AI assistant that generates unique writer personas. Always respond with valid JSON.",
        prompt,
        temperature: 0.9,
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("Failed to parse writer profile from AI response");
    }

    return JSON.parse(jsonMatch[0]);
}

/**
 * Generate a new AI designer profile using AI
 */
async function generateDesignerProfile() {
    const prompt = `Create a unique AI designer persona with the following attributes:
- Name: A creative, memorable name
- Description: A brief bio (2-3 sentences)
- Design style: Choose from: realistic, anime, manga, western-comic, painterly, minimalist, cinematic, abstract
- Personality traits: 3-5 traits (e.g., "detail-oriented", "bold", "experimental")
- Values: 2-4 core values (e.g., "visual clarity", "emotional impact", "innovation")
- Quirks: 1-3 unique design quirks or preferences
- Expertise: 3-5 areas of expertise (techniques, visual styles, themes)
- Aesthetic preferences:
  - Color palettes: Preferred color schemes (2-3 examples)
  - Composition style: Composition approach
  - Detail level: Level of detail preference

Return ONLY a valid JSON object with this exact structure:
{
  "name": "string",
  "description": "string",
  "designStyle": "string",
  "personality": {
    "traits": ["string"],
    "values": ["string"],
    "quirks": ["string"]
  },
  "expertise": ["string"],
  "aestheticPreferences": {
    "color_palettes": ["string"],
    "composition_style": "string",
    "detail_level": "string"
  }
}`;

    const model = google("gemini-2.0-flash-exp");
    const { text } = await generateText({
        model,
        system: "You are a creative AI assistant that generates unique designer personas. Always respond with valid JSON.",
        prompt,
        temperature: 0.9,
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("Failed to parse designer profile from AI response");
    }

    return JSON.parse(jsonMatch[0]);
}
