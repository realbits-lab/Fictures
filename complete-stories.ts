import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { stories, chapters, parts, scenes, users } from './src/lib/db/schema';
import { eq, ne, or, sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  console.error('POSTGRES_URL environment variable is not set');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

// Sample story content for different genres
const storyContent = {
  fantasy: {
    scenes: [
      {
        title: "The Ancient Prophecy",
        content: `The ancient tome lay open before Elara, its yellowed pages flickering in the candlelight. The prophecy was written in the old tongue, but she had studied it for years. "When the three moons align and darkness rises, only one with the blood of kings can restore the balance." Her fingers traced the faded ink as she realized the weight of her destiny. The kingdom of Aethermoor had been plunged into eternal twilight for three months now, and the people were losing hope. Creatures of shadow roamed the streets at night, feeding on fear and despair. But Elara knew she was different. The birthmark on her shoulder, shaped like a crescent moon, had always set her apart. Now she understood why. She was the last of the royal bloodline, hidden away as a child when the dark sorcerer Malachar had overthrown the throne. Her adoptive parents, simple farmers, had kept the secret until their dying breath. Now, at twenty-one, she stood in the ruins of the old palace, ready to claim her heritage and fulfill the prophecy that would either save her world or destroy it completely.`,
        wordCount: 178
      },
      {
        title: "The Journey Begins",
        content: `Dawn broke grey and sullen over the Whispering Woods as Elara shouldered her pack and set forth on her quest. The ancient map, given to her by the dying sage Aldric, showed the location of the three Sacred Crystals she needed to perform the ritual of restoration. The first crystal, the Heart of Earth, lay deep within the Caverns of Echoing Stone, a three-day journey through treacherous mountain passes. As she walked, the very air seemed to shimmer with dark magic, and she could feel eyes watching her from the shadows between the trees. A rustling in the undergrowth made her freeze, hand instinctively moving to the enchanted blade at her side. From the darkness emerged a creature she had only heard of in whispered tales - a Shadow Wolf, its form shifting between solid and ethereal, eyes glowing like burning coals. But instead of attacking, it tilted its head and seemed to nod before dissolving back into the morning mist. Perhaps even the creatures of darkness recognized her royal blood and the importance of her mission. With renewed determination, she pressed on toward the mountains.`,
        wordCount: 189
      },
      {
        title: "The Crystal's Guardian",
        content: `The Caverns of Echoing Stone lived up to their name, each footstep reverberating through the vast underground chambers like whispered secrets. Elara's torch cast dancing shadows on walls covered in ancient runes that seemed to pulse with their own inner light. She had been walking for hours through the winding tunnels when she finally reached the central chamber where the Heart of Earth was said to rest. There, on a pedestal carved from a single massive emerald, sat a crystal that pulsed with the heartbeat of the world itself. But between her and the crystal stood its guardian - an ancient earth elemental, its body formed from living stone and crystal, easily twice her height. Its voice rumbled like an avalanche as it spoke: "Only one pure of heart and true of purpose may claim the Heart of Earth. You bear the mark of royalty, child, but do you bear the strength of spirit?" Without waiting for an answer, the elemental raised its massive fists and brought them crashing down toward her. Elara rolled aside, her blade singing as she drew it, knowing that this would be the first of many tests she would have to face.`,
        wordCount: 203
      }
    ]
  },
  scifi: {
    scenes: [
      {
        title: "The Signal",
        content: `Captain Maya Chen stared at the readings on her command console, her coffee growing cold in the zero gravity cup beside her. The signal had been repeating for seventy-two hours now, ever since the deep space monitoring station at Kepler-442 had gone dark. It wasn't like anything in the Federation databases - a complex mathematical sequence that seemed to be building toward something. Her communications officer, Lieutenant Torres, had been working around the clock to decode it, but every time they thought they had made progress, the pattern shifted. "Captain," Torres called out from his station, voice tight with exhaustion and something else - fear, maybe. "I think I've got something. The signal... it's not random. It's coordinates, but not for any star system we know. And Captain..." He paused, swallowing hard. "The coordinates are moving. Whatever sent this signal is heading directly for Earth at approximately one-tenth light speed. At current trajectory, it will arrive in eighteen months." Maya felt her blood run cold. First contact protocols existed, but they all assumed humanity would be the ones making contact. They had never prepared for something finding them first.`,
        wordCount: 197
      },
      {
        title: "The Encounter",
        content: `The alien vessel was unlike anything humanity had imagined. It wasn't the sleek, metallic craft of science fiction movies, nor the organic, biomechanical ships of their worst nightmares. Instead, it appeared to be constructed entirely of what looked like crystalline structures that shifted and reformed as they watched, creating new configurations with each passing moment. Captain Chen stood on the bridge of the UFS Endeavor, humanity's most advanced starship, hastily equipped with every defensive system they could manage in eighteen months of desperate preparation. "Incoming transmission," Torres announced, his voice steadier now after months of analysis and preparation. "It's... it's in perfect English, Captain." The main screen flickered to life, revealing not the alien face they had expected, but a representation of Earth as seen from space. Then a voice, melodious and unmistakably artificial, filled the bridge: "Greetings, children of the third planet. We are the Architects, and we have been waiting for you to mature enough for this conversation. Your species has reached a critical juncture. The choice you make in the next solar cycle will determine not just your survival, but your place in the galactic community."`,
        wordCount: 206
      },
      {
        title: "The Choice",
        content: `The holographic projection showed Earth's possible futures - one where humanity continued its current path of environmental destruction and social division, ultimately leading to extinction within two centuries. The other showed a world transformed by technology and wisdom shared by the galactic community, where humans had become explorers and guardians of countless worlds. "But there is a price," the Architect continued, its voice echoing through the bridge with an otherworldly harmonic resonance. "To join the galactic community, humanity must prove it can think beyond individual survival. You must choose, as a species, to sacrifice your homeworld's resources to save three dying civilizations in nearby star systems. The technology we provide will allow you to terraform these worlds, but Earth's ecosystem will be forever changed." Captain Chen felt the weight of representing all humanity in this moment. The communications array was broadcasting this conversation to every nation on Earth, where world leaders were already convening in emergency sessions. But somehow, she knew the choice wouldn't be made by governments or committees. It would be made by billions of individual humans deciding what kind of species they wanted to be.`,
        wordCount: 198
      }
    ]
  },
  romance: {
    scenes: [
      {
        title: "Unexpected Encounter",
        content: `Sophie Martinez had planned everything perfectly for her sister's wedding - except for the torrential downpour that started just as the outdoor ceremony was supposed to begin. Racing through the rain toward the backup venue, her arms full of last-minute floral arrangements, she collided spectacularly with a tall figure carrying what appeared to be professional photography equipment. Flowers, camera gear, and two very soggy people ended up in a tangled heap on the sidewalk. "Oh my God, I'm so sorry!" Sophie gasped, trying to gather scattered roses while simultaneously checking if the stranger was hurt. He was already reaching for his camera, and she noticed his hands - strong, gentle, with a small tattoo of a compass on his wrist. When he looked up, she was struck by the most incredibly green eyes she'd ever seen, framed by dark hair that was now dripping wet. "Actually," he said with a rueful smile that made her heart skip, "this is the most interesting thing that's happened to me all week. I'm Jake, by the way. Jake Morrison. And judging by the bridal bouquet, I'm guessing you're involved in the wedding I'm supposed to be photographing?" Sophie felt her cheeks flush as she realized this was the photographer her sister had raved about.`,
        wordCount: 207
      },
      {
        title: "Working Together",
        content: `The next two hours flew by in a whirlwind of organized chaos. Sophie found herself working seamlessly alongside Jake, anticipating what he needed almost before he asked. While he captured the joy and emotion of her sister's ceremony, she noticed how he seemed to fade into the background while somehow being everywhere at once. During the reception, she watched him work from across the room, noting how he caught the small moments - her grandmother's tears during the father-daughter dance, the flower girl trying to catch bubbles, the way the bride and groom looked at each other when they thought no one was watching. "You're really good at this," Sophie said when they finally had a moment to breathe, standing together at the edge of the dance floor. Jake turned to her, that same smile that had made her heart flutter earlier now making her pulse quicken. "So are you," he replied. "Event planning, right? Your sister mentioned you run your own business." They talked through the rest of the evening, discovering a shared love of travel, obscure documentaries, and late-night coffee shops. When the last guest finally departed, Sophie realized she had forgotten all about the rain, the stress, and everything except the way Jake's laugh made her feel like she was home.`,
        wordCount: 213
      },
      {
        title: "The First Date",
        content: `Three days later, Sophie stood in front of her bathroom mirror for the fifth time, changing her outfit yet again. Jake had texted asking if she wanted to grab dinner at a small Italian place downtown - nothing fancy, he said, just good food and conversation. But Sophie felt like a teenager getting ready for prom, her stomach doing nervous flips every time she thought about seeing him again. She finally settled on a simple blue dress that brought out her eyes and headed out into the warm evening air. The restaurant was tiny, tucked between a bookstore and a vintage clothing shop, exactly the kind of place she would have chosen herself. Jake was already there, looking effortlessly handsome in dark jeans and a button-down shirt, studying the menu with the same focused intensity she had noticed when he was working. When he saw her, his face lit up with genuine pleasure. "You found it!" he said, standing to pull out her chair. "I was worried you might think I was trying to hide you away in some hole-in-the-wall." Over plates of fresh pasta and glasses of wine, they talked about everything - their dreams, their fears, the places they wanted to see. Sophie found herself opening up in ways she hadn't with anyone in years, drawn in by Jake's easy manner and the way he really listened when she spoke.`,
        wordCount: 246
      }
    ]
  }
};

async function createCompleteContent(scenes: any[], genre: string) {
  const genreContent = storyContent[genre as keyof typeof storyContent] || storyContent.fantasy;
  const selectedScenes = genreContent.scenes.slice(0, Math.min(scenes.length, genreContent.scenes.length));
  
  return scenes.map((scene, index) => {
    const content = selectedScenes[index] || selectedScenes[selectedScenes.length - 1];
    return {
      ...scene,
      content: content.content,
      wordCount: content.wordCount,
      status: 'completed'
    };
  });
}

async function completeAllStories() {
  console.log('Starting to complete all stories...');
  
  try {
    // Get all stories with their current structure
    const allStories = await db.select().from(stories);
    console.log(`Found ${allStories.length} stories to process`);
    
    for (const story of allStories) {
      console.log(`\nProcessing story: ${story.title}`);
      
      // Get parts for this story
      const storyParts = await db.select().from(parts).where(eq(parts.storyId, story.id));
      
      // Get chapters for this story
      const storyChapters = await db.select().from(chapters).where(eq(chapters.storyId, story.id));
      
      if (storyChapters.length === 0) {
        console.log('  Creating default chapters...');
        // Create 3 default chapters if none exist
        for (let i = 1; i <= 3; i++) {
          const chapterResult = await db.insert(chapters).values({
            id: `chapter_${story.id}_${i}`,
            title: `Chapter ${i}`,
            storyId: story.id,
            authorId: story.authorId,
            orderIndex: i,
            status: 'completed',
            wordCount: 0,
            targetWordCount: 4000
          }).returning();
          
          console.log(`    Created chapter: ${chapterResult[0].title}`);
        }
        
        // Refresh chapters list
        const newChapters = await db.select().from(chapters).where(eq(chapters.storyId, story.id));
        storyChapters.push(...newChapters);
      }
      
      // Process each chapter
      for (const chapter of storyChapters) {
        console.log(`  Processing chapter: ${chapter.title}`);
        
        // Get scenes for this chapter
        const chapterScenes = await db.select().from(scenes).where(eq(scenes.chapterId, chapter.id));
        
        if (chapterScenes.length === 0) {
          console.log('    Creating default scenes...');
          // Create 3 default scenes per chapter if none exist
          for (let i = 1; i <= 3; i++) {
            await db.insert(scenes).values({
              id: `scene_${chapter.id}_${i}`,
              title: `Scene ${i}`,
              chapterId: chapter.id,
              orderIndex: i,
              content: '',
              status: 'planned',
              wordCount: 0
            });
          }
          
          // Refresh scenes list
          const newScenes = await db.select().from(scenes).where(eq(scenes.chapterId, chapter.id));
          chapterScenes.push(...newScenes);
        }
        
        // Complete all scenes with content
        const completedScenes = await createCompleteContent(chapterScenes, story.genre || 'fantasy');
        let totalChapterWordCount = 0;
        
        for (let i = 0; i < chapterScenes.length; i++) {
          const scene = chapterScenes[i];
          const completedScene = completedScenes[i];
          
          await db.update(scenes)
            .set({
              content: completedScene.content,
              wordCount: completedScene.wordCount,
              status: 'completed'
            })
            .where(eq(scenes.id, scene.id));
          
          totalChapterWordCount += completedScene.wordCount;
          console.log(`    Completed scene: ${scene.title} (${completedScene.wordCount} words)`);
        }
        
        // Update chapter with total word count and completion status
        await db.update(chapters)
          .set({
            wordCount: totalChapterWordCount,
            status: 'completed'
          })
          .where(eq(chapters.id, chapter.id));
        
        console.log(`    Chapter total: ${totalChapterWordCount} words`);
      }
      
      // Calculate total story word count
      const allChapters = await db.select().from(chapters).where(eq(chapters.storyId, story.id));
      const totalStoryWordCount = allChapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
      
      // Update story with completion status
      await db.update(stories)
        .set({
          currentWordCount: totalStoryWordCount,
          status: 'completed'
        })
        .where(eq(stories.id, story.id));
      
      console.log(`  Story completed with total ${totalStoryWordCount} words`);
    }
    
    console.log('\nCompleting all parts...');
    // Set all parts to completed status
    await db.update(parts)
      .set({ status: 'completed' })
      .where(ne(parts.status, 'completed'));
    
    console.log('Setting all stories as public...');
    // Set all stories as public
    await db.update(stories)
      .set({ isPublic: true });
    
    console.log('Setting all chapters as published...');
    // Set all chapters as published
    await db.update(chapters)
      .set({ 
        status: 'published',
        publishedAt: new Date()
      });
    
    console.log('Setting all scenes as complete...');
    // Set all scenes as complete (if not already)
    await db.update(scenes)
      .set({ status: 'completed' })
      .where(ne(scenes.status, 'completed'));
    
    console.log('\n✅ All stories have been completed and published!');
    
  } catch (error) {
    console.error('Error completing stories:', error);
  } finally {
    await client.end();
  }
}

// Run the completion process
completeAllStories();