/**
 * Utility functions to clean HNS data before storing in database
 * Removes phase-specific information and keeps only story structure data
 */

export function cleanStoryHnsData(hnsData: any, existingHnsData?: any): Record<string, unknown> {
  if (!hnsData || typeof hnsData !== 'object') {
    return existingHnsData || {};
  }

  const cleaned = { ...hnsData };

  // Remove phase-specific keys
  const phaseKeys = [
    'phase1_story',
    'phase2_parts',
    'phase3_characters',
    'phase4_settings',
    'phase5_6_data',
    'phase7_content'
  ];

  phaseKeys.forEach(key => {
    delete cleaned[key];
  });

  // Clean metadata to remove phase information
  if (cleaned.metadata && typeof cleaned.metadata === 'object') {
    const cleanedMetadata = { ...cleaned.metadata };
    delete cleanedMetadata.phase;
    delete cleanedMetadata.current_phase;
    delete cleanedMetadata.phase_timestamp;

    // Only keep essential metadata
    cleaned.metadata = {
      version: cleanedMetadata.version,
      language: cleanedMetadata.language,
      generation_prompt: cleanedMetadata.generation_prompt,
      created_at: cleanedMetadata.created_at || new Date().toISOString()
    };
  }

  // Preserve storyImage from existing data if it exists
  if (existingHnsData?.storyImage) {
    cleaned.storyImage = existingHnsData.storyImage;
  }

  return cleaned;
}

export function cleanComponentHnsData(componentData: any): Record<string, unknown> {
  if (!componentData || typeof componentData !== 'object') {
    return {};
  }

  // For individual components (parts, chapters, scenes, characters, settings),
  // we want to store the actual component data without phase information
  const cleaned = { ...componentData };

  // Remove any phase-specific metadata
  delete cleaned.phase;
  delete cleaned.phase_generated;
  delete cleaned.phase_timestamp;
  delete cleaned.generation_phase;

  // Remove any internal processing fields
  delete cleaned.id; // Don't duplicate the ID in hnsData
  delete cleaned.story_id;
  delete cleaned.part_id;
  delete cleaned.chapter_id;
  delete cleaned.scene_id;
  delete cleaned.character_id;
  delete cleaned.setting_id;

  // Remove ID arrays from objects - these are managed in database fields
  // Note: We only remove the ID reference arrays, not the actual character/setting data objects
  if (cleaned.parts && Array.isArray(cleaned.parts)) {
    // If parts is an array of strings (IDs), remove it
    if (cleaned.parts.length > 0 && typeof cleaned.parts[0] === 'string') {
      delete cleaned.parts;
    }
  }

  if (cleaned.chapters && Array.isArray(cleaned.chapters)) {
    // If chapters is an array of strings (IDs), remove it
    if (cleaned.chapters.length > 0 && typeof cleaned.chapters[0] === 'string') {
      delete cleaned.chapters;
    }
  }

  if (cleaned.scenes && Array.isArray(cleaned.scenes)) {
    // If scenes is an array of strings (IDs), remove it
    if (cleaned.scenes.length > 0 && typeof cleaned.scenes[0] === 'string') {
      delete cleaned.scenes;
    }
  }

  return cleaned;
}