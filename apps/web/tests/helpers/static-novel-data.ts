/**
 * Static Novel Test Data for Playwright Tests
 *
 * Provides comprehensive, pre-defined static data for novels testing.
 * This data is inserted directly into the database for consistent,
 * reliable test execution.
 *
 * Structure:
 * - 1 Story (fantasy genre, published)
 * - 2 Characters (protagonist, antagonist)
 * - 2 Settings (castle, enchanted forest)
 * - 1 Part
 * - 2 Chapters
 * - 3 Scenes per chapter (6 total)
 */

import { loadAuthData } from "./auth";

// =============================================================================
// Test Data IDs (Fixed for consistency)
// =============================================================================

export const TEST_IDS = {
    story: "test-story-novel-001",
    characters: {
        protagonist: "test-char-protagonist-001",
        antagonist: "test-char-antagonist-001",
    },
    settings: {
        castle: "test-setting-castle-001",
        forest: "test-setting-forest-001",
    },
    part: "test-part-001",
    chapters: {
        chapter1: "test-chapter-001",
        chapter2: "test-chapter-002",
    },
    scenes: {
        scene1_1: "test-scene-001-001",
        scene1_2: "test-scene-001-002",
        scene1_3: "test-scene-001-003",
        scene2_1: "test-scene-002-001",
        scene2_2: "test-scene-002-002",
        scene2_3: "test-scene-002-003",
    },
} as const;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get writer user ID from auth profiles
 */
export function getWriterUserId(): string {
    const authData = loadAuthData();
    return authData.profiles.writer.userId;
}

// =============================================================================
// Static Test Data Definitions
// =============================================================================

/**
 * Static story data following Adversity-Triumph Engine
 */
export function getTestStory() {
    return {
        id: TEST_IDS.story,
        authorId: getWriterUserId(),
        title: "Test Novel: The Shadow's Edge",
        summary:
            "A young knight must confront her deepest fears when an ancient darkness threatens to consume her kingdom. Through trials of courage and sacrifice, she discovers that true strength comes not from the absence of fear, but from the choice to act despite it.",
        genre: "fantasy" as const,
        tone: "hopeful" as const,
        moralFramework:
            "Courage is not the absence of fear, but the triumph over it. True heroes are those who choose to act despite their fears, protecting others at great personal cost.",
        status: "published" as const,
        viewCount: 150,
        rating: 4,
        ratingCount: 25,
        imageUrl:
            "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/cover.png",
        imageVariants: {
            imageId: "img_test_I6FEGVua",
            originalUrl:
                "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/story/original/img_test_I6FEGVua-dcPr66d3UJeFWC9TqNWukykHmsY40l.png",
            variants: [
                {
                    format: "avif",
                    device: "mobile",
                    resolution: "1x",
                    url: "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/story/variants/img_test_I6FEGVua_1x-1IyJHY1HBENBiM8uZbct4GNpPYbI27.avif",
                    width: 832,
                    height: 468,
                    size: 34438,
                },
                {
                    format: "avif",
                    device: "mobile",
                    resolution: "2x",
                    url: "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/story/variants/img_test_I6FEGVua_2x-UdcolX8PlcXFLKEZrygFoaEUzHSvCa.avif",
                    width: 1664,
                    height: 936,
                    size: 83929,
                },
            ],
            generatedAt: "2025-11-19T14:07:24.982Z",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Static protagonist character data
 */
export function getTestProtagonist() {
    return {
        id: TEST_IDS.characters.protagonist,
        storyId: TEST_IDS.story,
        name: "Elena Brightblade",
        role: "protagonist" as const,
        isMain: true,
        summary:
            "Courageous young knight haunted by past failure, seeking redemption through protecting others at any cost.",
        coreTrait: "courage" as const,
        internalFlaw:
            "Fears failure because she once froze during a crucial battle, leading to her mentor's death",
        externalGoal:
            "Defeat the Shadow Lord and prove herself worthy of her knight's oath",
        personality: {
            traits: [
                "determined",
                "protective",
                "self-doubting",
                "compassionate",
            ],
            values: [
                "honor",
                "duty",
                "sacrifice",
                "loyalty to friends",
                "redemption",
            ],
        },
        backstory:
            "Elena was raised in the Order of the Silver Dawn, trained by the legendary Knight Commander Aldric. During the Battle of Thornhaven, she froze when faced with overwhelming darkness, and Aldric sacrificed himself to save her. Now she carries the guilt of his death and the burden of living up to his legacy. She has trained relentlessly since that day, but the fear of freezing again haunts her every moment.",
        physicalDescription: {
            age: "mid-20s",
            appearance:
                "Athletic build with sun-bronzed skin and keen brown eyes that constantly scan for threats",
            distinctiveFeatures:
                "A thin scar across her left cheekbone from the Battle of Thornhaven, and calloused hands that speak to years of sword training",
            style: "Practical knight's attire with well-maintained armor bearing the Silver Dawn crest, always carries her mentor's sword",
        },
        voiceStyle: {
            tone: "steady and measured, but with underlying tension",
            vocabulary:
                "military precision mixed with occasional moments of poetic reflection",
            quirks: [
                "touches her sword hilt when nervous",
                "speaks in clipped sentences during stress",
            ],
            emotionalRange:
                "Restrained but capable of deep emotion when barriers break",
        },
        imageUrl:
            "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/characters/test-char-protagonist-001/portrait.png",
        imageVariants: {
            imageId: "img_test_xZL5J2E9",
            originalUrl:
                "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/character/original/img_test_xZL5J2E9-LBUm9QiZTmJ7d7AaTtb5JlelpQldJv.png",
            variants: [
                {
                    format: "avif",
                    device: "mobile",
                    resolution: "1x",
                    url: "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/character/variants/img_test_xZL5J2E9_1x-5tauNJsg5Sx5dS0Xy3VYJ0ofhWoMxE.avif",
                    width: 512,
                    height: 512,
                    size: 30455,
                },
                {
                    format: "avif",
                    device: "mobile",
                    resolution: "2x",
                    url: "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/character/variants/img_test_xZL5J2E9_2x-GAaQOj0sPz1ZlxOBIpRZ40iHF3GvaS.avif",
                    width: 1024,
                    height: 1024,
                    size: 64098,
                },
            ],
            generatedAt: "2025-11-19T14:07:53.086Z",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Static antagonist character data
 */
export function getTestAntagonist() {
    return {
        id: TEST_IDS.characters.antagonist,
        storyId: TEST_IDS.story,
        name: "Lord Malachar",
        role: "antagonist" as const,
        isMain: true,
        summary:
            "Ancient sorcerer whose pursuit of knowledge corrupted into obsession with power and control.",
        coreTrait: "wisdom" as const,
        internalFlaw:
            "Believes emotions are weakness because showing vulnerability led to betrayal in his past",
        externalGoal:
            "Achieve immortality through consuming the kingdom's life force",
        personality: {
            traits: [
                "calculating",
                "patient",
                "manipulative",
                "emotionally detached",
            ],
            values: [
                "knowledge",
                "control",
                "order",
                "self-preservation",
                "power",
            ],
        },
        backstory:
            "Once a respected scholar of the Royal Academy, Malachar sought to preserve his beloved wife through forbidden magic when she fell ill. His desperation led him to dark arts, but his attempt failed, and his wife died cursing his name. The grief transformed him, convincing him that emotional attachments were the source of all suffering. Now he seeks to transcend mortality entirely, becoming something beyond human feeling.",
        physicalDescription: {
            age: "appears ageless, actual age unknown",
            appearance:
                "Tall and gaunt with unnaturally pale skin that seems to absorb light rather than reflect it",
            distinctiveFeatures:
                "Eyes that shift between black and violet, and shadows that move independently around him",
            style: "Flowing dark robes adorned with arcane symbols, hands covered in intricate tattoos of binding runes",
        },
        voiceStyle: {
            tone: "cold and melodic, like wind through dead trees",
            vocabulary:
                "archaic and formal, speaks as if lecturing inferior students",
            quirks: [
                "never uses contractions",
                "refers to himself in third person when making declarations",
            ],
            emotionalRange:
                "Deliberately suppressed, but ancient grief leaks through in unguarded moments",
        },
        imageUrl:
            "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/characters/test-char-antagonist-001/portrait.png",
        imageVariants: {
            imageId: "img_test_WahaDdl3",
            originalUrl:
                "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/character/original/img_test_WahaDdl3-FguTaQRynphD4KRGvzZebXp60xNJcQ.png",
            variants: [
                {
                    format: "avif",
                    device: "mobile",
                    resolution: "1x",
                    url: "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/character/variants/img_test_WahaDdl3_1x-246UmIv4p9xBRmN0QNOrppiFATRiHH.avif",
                    width: 512,
                    height: 512,
                    size: 20832,
                },
                {
                    format: "avif",
                    device: "mobile",
                    resolution: "2x",
                    url: "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/character/variants/img_test_WahaDdl3_2x-vYaFp69BIT28Z2ESnA264aQzh7Zyqd.avif",
                    width: 1024,
                    height: 1024,
                    size: 46478,
                },
            ],
            generatedAt: "2025-11-19T14:08:17.750Z",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Static castle setting data
 */
export function getTestCastleSetting() {
    return {
        id: TEST_IDS.settings.castle,
        storyId: TEST_IDS.story,
        name: "Silverhold Castle",
        summary:
            "The ancestral fortress of the Silver Dawn Order, now shadowed by creeping darkness. Its once-gleaming spires now stand as monuments to fading hope, while within its walls, the last defenders prepare for a final stand against the encroaching Shadow.",
        adversityElements: {
            physicalObstacles: [
                "crumbling battlements",
                "darkened corridors",
                "sealed ancient vaults",
            ],
            scarcityFactors: [
                "dwindling supplies",
                "few remaining knights",
                "fading magical wards",
            ],
            dangerSources: [
                "shadow creatures infiltrating walls",
                "corrupted guardians",
                "unstable magic",
            ],
            socialDynamics: [
                "fear spreading among defenders",
                "questioning of old traditions",
                "tension between duty and survival",
            ],
        },
        virtueElements: {
            witnessElements: [
                "portraits of past heroes watching",
                "younger knights observing veterans",
                "civilians sheltering within",
            ],
            contrastElements: [
                "gleaming armor against shadow",
                "candle flames defying darkness",
                "hope amid despair",
            ],
            opportunityElements: [
                "great hall for rallying speeches",
                "armory for equipping others",
                "infirmary for tending wounded",
            ],
            sacredSpaces: [
                "Chapel of the Silver Dawn",
                "Memorial Hall of Fallen Knights",
            ],
        },
        consequenceElements: {
            transformativeElements: [
                "restored ward stones",
                "relit beacon towers",
                "recovered sacred relics",
            ],
            rewardSources: [
                "ancestral spirits granting blessing",
                "hidden armory of legendary weapons",
                "allies arriving from distant lands",
            ],
            revelationTriggers: [
                "ancient tomes with forgotten knowledge",
                "visions in the sacred pool",
                "whispers of past heroes",
            ],
            communityResponses: [
                "renewed oaths of loyalty",
                "volunteers for dangerous missions",
                "songs of courage spreading",
            ],
        },
        symbolicMeaning:
            "The castle represents the last bastion of hope and the weight of tradition - it can either become a tomb for outdated ways or a foundation for rebirth.",
        mood: "somber but resolute",
        emotionalResonance: "hope",
        sensory: {
            sight: [
                "silver banners catching fading light",
                "shadow creeping along stone walls",
                "candlelit windows in darkness",
                "armored knights standing vigil",
                "ancient tapestries telling heroic tales",
            ],
            sound: [
                "clash of training swords",
                "wind howling through battlements",
                "distant prayers in chapel",
                "warning bells",
            ],
            smell: [
                "forge smoke",
                "incense from chapel",
                "musty ancient halls",
            ],
            touch: [
                "cold stone walls",
                "weight of armor",
                "smooth sword hilts",
            ],
            taste: ["metallic tang of fear"],
        },
        architecturalStyle:
            "Gothic fortress with silver-inlaid stone and defensive wards woven into every arch",
        imageUrl:
            "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/settings/test-setting-castle-001/visual.png",
        imageVariants: {
            imageId: "img_test_snF7ChDM",
            originalUrl:
                "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/setting/original/img_test_snF7ChDM-e06AxwqHbzU9grv2V1lPvyu5zVeKOf.png",
            variants: [
                {
                    format: "avif",
                    device: "mobile",
                    resolution: "1x",
                    url: "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/setting/variants/img_test_snF7ChDM_1x-SqtSwnny2BF7voYZnME6xvYwlP2TQr.avif",
                    width: 512,
                    height: 512,
                    size: 31015,
                },
                {
                    format: "avif",
                    device: "mobile",
                    resolution: "2x",
                    url: "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/setting/variants/img_test_snF7ChDM_2x-6Hq6C6i6MxCuDx8VXzAK5QAiXhKY5a.avif",
                    width: 1024,
                    height: 1024,
                    size: 74666,
                },
            ],
            generatedAt: "2025-11-19T14:08:43.210Z",
        },
        visualReferences: ["Minas Tirith from LOTR", "Hogwarts in darkness"],
        colorPalette: [
            "silver and steel gray",
            "deep shadow purple",
            "fading gold light",
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Static forest setting data
 */
export function getTestForestSetting() {
    return {
        id: TEST_IDS.settings.forest,
        storyId: TEST_IDS.story,
        name: "The Whispering Woods",
        summary:
            "An ancient forest that serves as the boundary between the mortal realm and the Shadow Lord's domain. Its trees remember when the world was young, and their whispers can guide or mislead those who enter.",
        adversityElements: {
            physicalObstacles: [
                "thorned undergrowth",
                "shifting paths",
                "treacherous ravines",
            ],
            scarcityFactors: [
                "clean water rare",
                "safe shelter scarce",
                "light barely penetrating canopy",
            ],
            dangerSources: [
                "shadow wolves",
                "corrupted tree spirits",
                "illusions that lead astray",
            ],
            socialDynamics: [
                "isolation from allies",
                "temptation to give up",
                "voices of doubt",
            ],
        },
        virtueElements: {
            witnessElements: [
                "ancient trees observing",
                "forest spirits watching",
                "companions depending on leader",
            ],
            contrastElements: [
                "single flower blooming in shadow",
                "stream of pure water amid corruption",
                "birdsong in silence",
            ],
            opportunityElements: [
                "crossroads requiring choice",
                "wounded creature needing aid",
                "lost travelers to guide",
            ],
            sacredSpaces: [
                "Ancient Grove of the First Tree",
                "Moonlit Clearing of Truth",
            ],
        },
        consequenceElements: {
            transformativeElements: [
                "corruption receding from trees",
                "paths becoming clear",
                "light breaking through canopy",
            ],
            rewardSources: [
                "forest spirits offering guidance",
                "hidden shortcuts revealed",
                "healing herbs appearing",
            ],
            revelationTriggers: [
                "reflection in moonlit pool",
                "tree showing memories",
                "whispers revealing truth",
            ],
            communityResponses: [
                "forest creatures aiding journey",
                "trees parting to show way",
                "nature's blessing granted",
            ],
        },
        symbolicMeaning:
            "The forest represents the journey into one's own darkness and the choice between giving in to despair or finding light within.",
        mood: "mysterious and testing",
        emotionalResonance: "fear",
        sensory: {
            sight: [
                "gnarled ancient trees",
                "shifting shadows between trunks",
                "occasional shafts of golden light",
                "silver moonbeams at night",
                "glowing fungi on bark",
            ],
            sound: [
                "whispers in the leaves",
                "distant howling",
                "snap of twigs",
                "eerie silence",
            ],
            smell: [
                "damp earth",
                "rotting leaves",
                "sweet night-blooming flowers",
            ],
            touch: [
                "rough bark",
                "cold mist on skin",
                "thorns catching clothes",
            ],
            taste: ["bitter berries"],
        },
        architecturalStyle:
            "Natural cathedral of interlocking branches with ancient carved stones marking boundaries",
        imageUrl:
            "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/settings/test-setting-forest-001/visual.png",
        imageVariants: {
            imageId: "img_test_Uw7Vjk78",
            originalUrl:
                "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/setting/original/img_test_Uw7Vjk78-XqBzjDP0oL6jxNE6chF0c0tSjlVkfL.png",
            variants: [
                {
                    format: "avif",
                    device: "mobile",
                    resolution: "1x",
                    url: "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/setting/variants/img_test_Uw7Vjk78_1x-VV8g3UNLrYIEZ5SNiazRbAoksINWCf.avif",
                    width: 512,
                    height: 512,
                    size: 26434,
                },
                {
                    format: "avif",
                    device: "mobile",
                    resolution: "2x",
                    url: "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/setting/variants/img_test_Uw7Vjk78_2x-Pwm73IabvpotTss9429JvWwWe0qOtC.avif",
                    width: 1024,
                    height: 1024,
                    size: 68480,
                },
            ],
            generatedAt: "2025-11-19T14:09:09.934Z",
        },
        visualReferences: ["Mirkwood from Hobbit", "Forbidden Forest"],
        colorPalette: [
            "deep forest green",
            "shadow black",
            "occasional golden light",
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Static part data
 */
export function getTestPart() {
    return {
        id: TEST_IDS.part,
        storyId: TEST_IDS.story,
        title: "Part I: Into the Shadow",
        summary:
            "Elena must overcome her fear of failure to lead a desperate mission into the Whispering Woods, where she will confront both the Shadow Lord's minions and her own traumatic memories.",
        characterArcs: [
            {
                characterId: TEST_IDS.characters.protagonist,
                macroAdversity: {
                    internal:
                        "Fear of freezing again when others depend on her",
                    external:
                        "Shadow Lord's forces growing stronger, threatening the kingdom",
                },
                macroVirtue:
                    "Chooses to lead despite fear, accepting that she may fail but must try",
                macroConsequence:
                    "Earns the trust of her companions and begins to heal from her guilt",
                macroNewAdversity:
                    "Success draws the Shadow Lord's personal attention",
            },
        ],
        settingIds: [TEST_IDS.settings.castle, TEST_IDS.settings.forest],
        orderIndex: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Static chapter 1 data
 */
export function getTestChapter1() {
    return {
        id: TEST_IDS.chapters.chapter1,
        storyId: TEST_IDS.story,
        partId: TEST_IDS.part,
        title: "Chapter 1: The Weight of Legacy",
        summary:
            "Elena struggles with accepting command of a critical mission while haunted by memories of her past failure and her mentor's sacrifice.",
        characterId: TEST_IDS.characters.protagonist,
        arcPosition: "beginning" as const,
        contributesToMacroArc:
            "Establishes Elena's internal conflict and sets up the stakes for her journey",
        characterArc: {
            characterId: TEST_IDS.characters.protagonist,
            microAdversity: {
                internal:
                    "Doubt about her worthiness to lead after her past failure",
                external:
                    "Knight Commander assigns her the most dangerous mission",
            },
            microVirtue:
                "Accepts the mission despite her fears, choosing duty over self-protection",
            microConsequence:
                "Gains a small measure of confidence and the loyalty of her team",
            microNewAdversity:
                "Discovers the mission is more dangerous than anticipated",
        },
        focusCharacters: [TEST_IDS.characters.protagonist],
        adversityType: "both" as const,
        virtueType: "courage" as const,
        settingIds: [TEST_IDS.settings.castle],
        seedsPlanted: [
            {
                id: "seed-001",
                description:
                    "Elena's mentor's sword glows faintly when she accepts the mission",
                expectedPayoff:
                    "The sword will fully awaken when Elena truly embodies courage",
            },
        ],
        seedsResolved: [],
        connectsToPreviousChapter: "Opening of the story - no previous chapter",
        createsNextAdversity:
            "The team must now enter the dangerous Whispering Woods",
        orderIndex: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Static chapter 2 data
 */
export function getTestChapter2() {
    return {
        id: TEST_IDS.chapters.chapter2,
        storyId: TEST_IDS.story,
        partId: TEST_IDS.part,
        title: "Chapter 2: Whispers in the Dark",
        summary:
            "Deep in the Whispering Woods, Elena faces illusions of her past failure and must choose between saving her companions or pursuing the mission.",
        characterId: TEST_IDS.characters.protagonist,
        arcPosition: "middle" as const,
        contributesToMacroArc:
            "Deepens Elena's internal struggle and forces her to confront her trauma directly",
        characterArc: {
            characterId: TEST_IDS.characters.protagonist,
            microAdversity: {
                internal:
                    "Forest illusions force her to relive her mentor's death",
                external:
                    "Shadow wolves separate the team, putting companions in danger",
            },
            microVirtue:
                "Chooses to save her companions even though it means revealing her fears to them",
            microConsequence:
                "Companions survive and trust deepens; Elena begins to forgive herself",
            microNewAdversity:
                "The Shadow Lord senses her growing strength and sends more powerful minions",
        },
        focusCharacters: [TEST_IDS.characters.protagonist],
        adversityType: "both" as const,
        virtueType: "courage" as const,
        settingIds: [TEST_IDS.settings.forest],
        seedsPlanted: [
            {
                id: "seed-002",
                description:
                    "A forest spirit whispers that 'the shadow remembers what the heart forgets'",
                expectedPayoff:
                    "This hint will help Elena understand the Shadow Lord's true weakness",
            },
        ],
        seedsResolved: [],
        connectsToPreviousChapter:
            "Accepting the mission leads the team into the dangerous forest",
        createsNextAdversity:
            "Direct confrontation with the Shadow Lord's lieutenant becomes unavoidable",
        orderIndex: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Static scene 1-1 data (Chapter 1, Scene 1)
 */
export function getTestScene1_1() {
    return {
        id: TEST_IDS.scenes.scene1_1,
        chapterId: TEST_IDS.chapters.chapter1,
        title: "The Commander's Summons",
        summary:
            "Elena is summoned to the Knight Commander's chamber where she receives news of the critical mission. The weight of expectation hangs heavy as she enters the ancient hall where her mentor once stood.",
        cyclePhase: "setup" as const,
        emotionalBeat: "tension" as const,
        characterFocus: [TEST_IDS.characters.protagonist],
        settingId: TEST_IDS.settings.castle,
        sensoryAnchors: [
            "cold stone underfoot",
            "silver banners rustling",
            "weight of mentor's sword",
        ],
        dialogueVsDescription: "40% dialogue, 60% description",
        suggestedLength: "medium" as const,
        content: `The summons came at dawn, carried by a young squire whose eyes held a mixture of awe and pity. Elena knew that look well—it was the same one she had worn when delivering messages to knights marked for dangerous duty.

She found Knight Commander Varen in the Hall of Echoes, standing before the great map table where her mentor had once plotted the kingdom's defense. Morning light filtered through stained glass windows, casting colored shadows across strategy markers that seemed to multiply with each passing day.

"Sir Elena," Varen said without preamble. His voice echoed in the vast chamber. "The Shadow Lord's forces have seized the Northern Pass. If we don't retake it within a fortnight, Silverhold will be surrounded."

Elena's hand moved unconsciously to the sword at her hip—Aldric's sword. The metal was cold through her glove, but she could have sworn she felt a faint pulse of warmth.

"You want me to lead the mission." It wasn't a question.

Varen turned to face her. Despite his age, his eyes remained sharp, seeing everything. "You are the finest blade we have, Elena. You were trained by the best."

*And I failed him*, she thought. The words pressed against her throat, but she swallowed them down.

"The Whispering Woods is the only viable approach," Varen continued. "We cannot risk a direct assault on their fortifications."

The Whispering Woods. Where shadow and light played tricks on the mind. Where even seasoned knights had lost themselves to despair.

"I'll need a team," Elena said, surprised by how steady her voice sounded. "Volunteers only. I won't order anyone into those woods."

For a moment, something like respect flickered in Varen's weathered face. "I expected nothing less. Choose wisely, Sir Elena. The kingdom's fate may rest on this mission."

As she left the Hall of Echoes, Elena felt the weight of every portrait watching her—past heroes who had never hesitated, never frozen when duty called.

*I will not fail again*, she promised them silently. *Whatever it costs me.*`,
        imageUrl:
            "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/scenes/test-scene-001-001/image.png",
        imageVariants: {
            imageId: "img_test_vCdLI2sW",
            originalUrl:
                "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/scene/original/img_test_vCdLI2sW-JJXUTIOEKGKb1mGik3WytPh6Bpp4Ud.png",
            variants: [
                {
                    format: "avif",
                    device: "mobile",
                    resolution: "1x",
                    url: "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/scene/variants/img_test_vCdLI2sW_1x-PHJLAnMoWLUK8jgmG1PvDBB3mWb0V1.avif",
                    width: 832,
                    height: 468,
                    size: 65222,
                },
                {
                    format: "avif",
                    device: "mobile",
                    resolution: "2x",
                    url: "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/scene/variants/img_test_vCdLI2sW_2x-fIkrc9LFx2O59D20zjnjXoeFTQmLAo.avif",
                    width: 1664,
                    height: 936,
                    size: 141486,
                },
            ],
            generatedAt: "2025-11-19T14:09:42.690Z",
        },
        novelStatus: "published" as const,
        publishedAt: new Date().toISOString(),
        publishedBy: getWriterUserId(),
        unpublishedAt: null,
        unpublishedBy: null,
        scheduledFor: null,
        autoPublish: false,
        comicStatus: "draft" as const,
        comicToonplay: null,
        comicPublishedAt: null,
        comicPublishedBy: null,
        comicUnpublishedAt: null,
        comicUnpublishedBy: null,
        comicGeneratedAt: null,
        comicPanelCount: 0,
        comicVersion: 1,
        viewCount: 45,
        uniqueViewCount: 32,
        novelViewCount: 45,
        novelUniqueViewCount: 32,
        comicViewCount: 0,
        comicUniqueViewCount: 0,
        lastViewedAt: new Date().toISOString(),
        orderIndex: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Static scene 1-2 data (Chapter 1, Scene 2)
 */
export function getTestScene1_2() {
    return {
        id: TEST_IDS.scenes.scene1_2,
        chapterId: TEST_IDS.chapters.chapter1,
        title: "Ghosts of the Memorial Hall",
        summary:
            "Elena visits the Memorial Hall of Fallen Knights, confronting her guilt over Aldric's death while struggling with her worthiness to lead the mission.",
        cyclePhase: "adversity" as const,
        emotionalBeat: "despair" as const,
        characterFocus: [TEST_IDS.characters.protagonist],
        settingId: TEST_IDS.settings.castle,
        sensoryAnchors: [
            "incense smoke drifting",
            "cold marble of memorial stones",
            "echo of her own breathing",
        ],
        dialogueVsDescription: "20% dialogue, 80% description",
        suggestedLength: "medium" as const,
        content: `The Memorial Hall was always coldest at twilight, when the sun's last rays painted crimson across the names carved into marble walls. Elena stood before the newest stone, where the chiseled letters of Aldric's name still held sharp edges that time had not yet worn smooth.

*Knight Commander Aldric Stormwind*
*Fell at Thornhaven, defending the innocent*
*His courage lives eternal*

Courage. The word mocked her.

"I should have been faster," she whispered to the stone. "I should have—"

*You froze*, her memory supplied. *While darkness swallowed him, you stood there with your sword raised and your limbs turned to ice.*

She remembered it all with terrible clarity. The way the shadow had coiled around him. His voice, commanding even then: "Run, Elena. Complete the mission." And her body, betraying her, refusing to move.

By the time the paralysis broke, by the time her scream tore free, he was gone. The shadow had retreated, but it had taken him with it.

"Why did you save me?" She pressed her palm against his name, feeling the grooves of each letter. "I wasn't worth it."

The silence of the hall offered no absolution.

Elena closed her eyes and let the weight of her failure settle over her. How could she lead others into danger when she had proven herself a coward? How could she ask them to trust her with their lives?

*You cannot*, whispered the voice of doubt. *You will freeze again. You will fail again. They will die because of you.*

Her hand trembled against the marble. Maybe the voice was right. Maybe she should refuse the mission, admit her unworthiness.

But then the kingdom would fall. And everyone in it—the young squires, the families in the villages, the people who still believed that the Silver Dawn could protect them.

Aldric had died believing in her. Was she going to prove him wrong?

The question hung in the cold air, unanswered.`,
        imageUrl:
            "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/scenes/test-scene-001-002/image.png",
        imageVariants: {
            imageId: "img_test_teJcOy4t",
            originalUrl:
                "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/scene/original/img_test_teJcOy4t-mEehfxMLkDY8A1o5XifQgbyL20clLn.png",
            variants: [
                {
                    format: "avif",
                    device: "mobile",
                    resolution: "1x",
                    url: "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/scene/variants/img_test_teJcOy4t_1x-2jIWXTfmxSIqsRnBcPJiNMRnCqmVSf.avif",
                    width: 832,
                    height: 468,
                    size: 40653,
                },
                {
                    format: "avif",
                    device: "mobile",
                    resolution: "2x",
                    url: "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/scene/variants/img_test_teJcOy4t_2x-XSbsCxc9MkmmG3mAAspi8U6hM2p5kt.avif",
                    width: 1664,
                    height: 936,
                    size: 96432,
                },
            ],
            generatedAt: "2025-11-19T14:10:15.536Z",
        },
        novelStatus: "published" as const,
        publishedAt: new Date().toISOString(),
        publishedBy: getWriterUserId(),
        unpublishedAt: null,
        unpublishedBy: null,
        scheduledFor: null,
        autoPublish: false,
        comicStatus: "draft" as const,
        comicToonplay: null,
        comicPublishedAt: null,
        comicPublishedBy: null,
        comicUnpublishedAt: null,
        comicUnpublishedBy: null,
        comicGeneratedAt: null,
        comicPanelCount: 0,
        comicVersion: 1,
        viewCount: 38,
        uniqueViewCount: 28,
        novelViewCount: 38,
        novelUniqueViewCount: 28,
        comicViewCount: 0,
        comicUniqueViewCount: 0,
        lastViewedAt: new Date().toISOString(),
        orderIndex: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Static scene 1-3 data (Chapter 1, Scene 3)
 */
export function getTestScene1_3() {
    return {
        id: TEST_IDS.scenes.scene1_3,
        chapterId: TEST_IDS.chapters.chapter1,
        title: "The Choice to Lead",
        summary:
            "Despite her fears, Elena makes the choice to accept the mission and address her volunteer team, taking the first step toward facing her trauma.",
        cyclePhase: "virtue" as const,
        emotionalBeat: "hope" as const,
        characterFocus: [TEST_IDS.characters.protagonist],
        settingId: TEST_IDS.settings.castle,
        sensoryAnchors: [
            "torchlight on determined faces",
            "clatter of armor as knights stand",
            "her own voice growing stronger",
        ],
        dialogueVsDescription: "50% dialogue, 50% description",
        suggestedLength: "long" as const,
        content: `The great hall fell silent as Elena stepped onto the raised platform. Before her stood two dozen knights—volunteers who had answered the call despite knowing the mission's dangers. Their faces held a range of expressions: determination, fear, curiosity. All of them watching her.

*They're waiting for you to inspire them*, she thought. *And all you feel is terror.*

Her hand found Aldric's sword again, and this time, she could have sworn she felt genuine warmth emanating from the hilt. As if he was there with her.

*Tell them the truth*, she thought. *They deserve that much.*

"You all know what we face," Elena began, her voice ringing in the hall. "The Whispering Woods is no ordinary forest. It will test you in ways you cannot prepare for. It will show you your deepest fears and whisper your greatest doubts."

Murmurs rippled through the gathered knights. She saw some exchange uncertain glances.

"I will not pretend otherwise," she continued. "Some of us may not return. The Shadow Lord's forces grow stronger every day, and this mission is our best—perhaps our only—chance to stop them."

She paused, looking at each face in turn. Young Sir Brennan, barely twenty, with his father's sword at his hip. Lady Mira, who had lost her brother to the shadow and burned for vengeance. Garrett the Shield, who had never broken an oath in forty years of service.

"I also will not pretend that I am without fear."

The admission rippled through the hall. Knights shifted, uncertain.

"At Thornhaven, I failed." The words scraped her throat raw. "I froze when it mattered most, and a better knight than I will ever be paid the price. Every day since, I have carried that failure. Every day, I have feared that it would happen again."

The silence was absolute now.

"But I have realized something." Elena drew Aldric's sword, and this time, there was no mistaking it—the blade gleamed with a soft silver light. "Fear is not the enemy. Giving in to fear is. We cannot control what frightens us, but we can choose what we do despite it."

She looked at her volunteers, seeing not subordinates but companions.

"I am asking you to walk into darkness with me. I cannot promise that we will all survive. But I can promise you this: I will not freeze again. I will stand with you, fight with you, and if necessary, fall with you. Because that is what it means to be a knight of the Silver Dawn."

The hall remained silent for a long moment. Then Sir Brennan stepped forward and drew his sword. "For the Silver Dawn."

One by one, the others followed, blades gleaming in the torchlight. "For the Silver Dawn!"

As their voices echoed through the ancient hall, Elena felt something shift in her chest. Not the absence of fear—she could still feel it coiled in her stomach—but the presence of something stronger.

Purpose.

"We leave at first light," she said. "May the Dawn guide us into shadow."`,
        imageUrl:
            "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/scenes/test-scene-001-003/image.png",
        imageVariants: {
            imageId: "img_test_MSs0vSlH",
            originalUrl:
                "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/scene/original/img_test_MSs0vSlH-3EDdFsxgFMmFpPaPEnBcGyVE0XPuMV.png",
            variants: [
                {
                    format: "avif",
                    device: "mobile",
                    resolution: "1x",
                    url: "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/scene/variants/img_test_MSs0vSlH_1x-mKESv5WN1KLTxVUv5tkqmV85VlmLLq.avif",
                    width: 832,
                    height: 468,
                    size: 57237,
                },
                {
                    format: "avif",
                    device: "mobile",
                    resolution: "2x",
                    url: "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/scene/variants/img_test_MSs0vSlH_2x-xCjQL4TYsFnSvJDgYERkpDAnho1P90.avif",
                    width: 1664,
                    height: 936,
                    size: 128644,
                },
            ],
            generatedAt: "2025-11-19T14:10:49.726Z",
        },
        novelStatus: "published" as const,
        publishedAt: new Date().toISOString(),
        publishedBy: getWriterUserId(),
        unpublishedAt: null,
        unpublishedBy: null,
        scheduledFor: null,
        autoPublish: false,
        comicStatus: "draft" as const,
        comicToonplay: null,
        comicPublishedAt: null,
        comicPublishedBy: null,
        comicUnpublishedAt: null,
        comicUnpublishedBy: null,
        comicGeneratedAt: null,
        comicPanelCount: 0,
        comicVersion: 1,
        viewCount: 52,
        uniqueViewCount: 40,
        novelViewCount: 52,
        novelUniqueViewCount: 40,
        comicViewCount: 0,
        comicUniqueViewCount: 0,
        lastViewedAt: new Date().toISOString(),
        orderIndex: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Static scene 2-1 data (Chapter 2, Scene 1)
 */
export function getTestScene2_1() {
    return {
        id: TEST_IDS.scenes.scene2_1,
        chapterId: TEST_IDS.chapters.chapter2,
        title: "Into the Whispering Woods",
        summary:
            "The team enters the Whispering Woods and immediately feels the forest's oppressive presence. Elena must keep her companions focused as the environment begins testing their resolve.",
        cyclePhase: "setup" as const,
        emotionalBeat: "fear" as const,
        characterFocus: [TEST_IDS.characters.protagonist],
        settingId: TEST_IDS.settings.forest,
        sensoryAnchors: [
            "leaves whispering overhead",
            "ground soft with decay",
            "light fading rapidly",
        ],
        dialogueVsDescription: "35% dialogue, 65% description",
        suggestedLength: "medium" as const,
        content: `The boundary between ordinary forest and Whispering Woods was marked by nothing so obvious as a fence or sign. One moment the team rode through autumn woods painted in gold and crimson; the next, the colors leached away as if drained by an unseen force.

"Hold formation," Elena commanded, reining her horse to a walk. "Stay alert and stay together."

The trees here were ancient beyond counting, their trunks twisted into shapes that seemed almost deliberate. Faces in the bark, reaching arms in the branches. The air hung thick and still, yet the leaves above rustled constantly—whispering.

"What are they saying?" young Brennan asked, his voice pitched higher than usual.

"Nothing we need to hear," Garrett rumbled. The old knight's hand rested on his shield, eyes scanning the shadows. "Focus on the path, boy."

But there was no path. Not truly. The ground showed no signs of passage, no tracks from previous travelers. As if the forest swallowed all evidence of those who entered.

*Or none ever left*, Elena's fear whispered.

She pushed the thought aside. "We make camp before nightfall. Lady Mira, how far to the first waypoint?"

Mira consulted her map, then looked up with troubled eyes. "According to this, we should have reached it an hour ago."

The whispers seemed to grow louder, amused.

Elena felt her companions' fear like a physical weight. It would be easy to let it spread, to let doubt take root. That was what the forest wanted.

"Then the map is wrong," she said firmly. "Or the forest is playing tricks. Either way, we press on. Eyes forward, minds clear."

She urged her horse ahead, projecting confidence she didn't feel. Behind her, she heard the others fall in line, trusting her to lead them through the dark.

The whispers followed them, patient as only ancient things can be.`,
        imageUrl:
            "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/scenes/test-scene-002-001/image.png",
        imageVariants: {
            imageId: "img_test_Ynf6Tmez",
            originalUrl:
                "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/scene/original/img_test_Ynf6Tmez-mlfwzqQ3C2lqiAZ9waBEaqVW740wgW.png",
            variants: [
                {
                    format: "avif",
                    device: "mobile",
                    resolution: "1x",
                    url: "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/scene/variants/img_test_Ynf6Tmez_1x-SwDAC76CTsy30x1JODRgXUKRA3DfhI.avif",
                    width: 832,
                    height: 468,
                    size: 47254,
                },
                {
                    format: "avif",
                    device: "mobile",
                    resolution: "2x",
                    url: "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/scene/variants/img_test_Ynf6Tmez_2x-oSiedi3PtvvO5nAS9THxxJKydXudoK.avif",
                    width: 1664,
                    height: 936,
                    size: 120679,
                },
            ],
            generatedAt: "2025-11-19T14:11:27.281Z",
        },
        novelStatus: "published" as const,
        publishedAt: new Date().toISOString(),
        publishedBy: getWriterUserId(),
        unpublishedAt: null,
        unpublishedBy: null,
        scheduledFor: null,
        autoPublish: false,
        comicStatus: "draft" as const,
        comicToonplay: null,
        comicPublishedAt: null,
        comicPublishedBy: null,
        comicUnpublishedAt: null,
        comicUnpublishedBy: null,
        comicGeneratedAt: null,
        comicPanelCount: 0,
        comicVersion: 1,
        viewCount: 35,
        uniqueViewCount: 26,
        novelViewCount: 35,
        novelUniqueViewCount: 26,
        comicViewCount: 0,
        comicUniqueViewCount: 0,
        lastViewedAt: new Date().toISOString(),
        orderIndex: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Static scene 2-2 data (Chapter 2, Scene 2)
 */
export function getTestScene2_2() {
    return {
        id: TEST_IDS.scenes.scene2_2,
        chapterId: TEST_IDS.chapters.chapter2,
        title: "The Forest's Test",
        summary:
            "The Whispering Woods shows Elena an illusion of her worst memory—Aldric's death—forcing her to relive her failure while shadow wolves attack the separated team.",
        cyclePhase: "adversity" as const,
        emotionalBeat: "despair" as const,
        characterFocus: [TEST_IDS.characters.protagonist],
        settingId: TEST_IDS.settings.forest,
        sensoryAnchors: [
            "Aldric's voice echoing",
            "shadow wolves howling",
            "cold sweat on skin",
        ],
        dialogueVsDescription: "30% dialogue, 70% description",
        suggestedLength: "long" as const,
        content: `The attack came without warning.

One moment Elena was leading her team through a fog-shrouded ravine; the next, shadow wolves burst from the mist on all sides—black-furred creatures with eyes like dying embers and jaws that dripped darkness.

"Defensive positions!" she shouted, drawing her sword. "Protect each other's—"

The world lurched. The ravine vanished, replaced by another place. Another time.

Thornhaven.

"No," Elena whispered, recognizing the broken walls, the fallen knights. The sky burning red above.

She was back. The forest had dragged her back to the moment of her greatest failure.

There—across the shattered courtyard—Aldric stood against the swirling mass of shadow. His silver armor was stained with ichor, his shield arm hung broken, but he still fought. Still held the line.

"ELENA!" His voice reached her across the chaos. "GET THE SURVIVORS OUT! NOW!"

She tried to move. Tried to run to him. But her body wouldn't respond. Her limbs were frozen, locked in the same paralysis that had trapped her three years ago.

*Not again. Not again not again not again—*

"Run, Elena!" Aldric's voice cracked as the shadow engulfed him. "Complete the mis—"

The darkness swallowed his words. Swallowed him whole.

And still she couldn't move. Still she stood there, useless, while her mentor died.

*You failed him then. You'll fail them now.*

Them. Her team.

Through the illusion, Elena heard howling. Real howling. Shadow wolves. Her companions' distant shouts.

*They need you.*

Brennan's terrified cry cut through the memory: "SIR ELENA!"

The forest wanted her to stay frozen. Wanted her to relive her failure forever while her team died. It fed on guilt and fear.

But she was not the same knight who had frozen at Thornhaven.

"No," she growled, and with every ounce of will, she forced her hand to grip her sword hilt. The blade pulsed with warmth.

"I said NO!"

She wrenched free of the paralysis, and the illusion shattered like glass.

She was back in the ravine, surrounded by chaos. Three shadow wolves circled young Brennan, who fought desperately with an injured arm. Further away, she could hear the clash of steel as the others battled.

Elena charged.

*I will not freeze. I will not fail.*

Her blade sang through the first wolf's neck. She caught the second's leap on her armored forearm and drove her sword through its chest. The third tried to flee, but she was faster.

Brennan stared at her with wide eyes, breathing hard. Blood ran down his arm.

"Regroup," she ordered. "Everyone, to me!"

As her team fought their way back together, Elena caught a glimpse of something watching from the shadows between the trees. A face. Aldric's face.

But he was smiling. Proud.

Then he was gone, and there was only the forest, and the fight, and the choice she made in every moment not to give in.`,
        imageUrl:
            "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/scenes/test-scene-002-002/image.png",
        imageVariants: {
            imageId: "img_test_yy_XZmgj",
            originalUrl:
                "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/scene/original/img_test_yy_XZmgj-4vmKFhoRTkPYuY5xETQP9uyZ6tB3qE.png",
            variants: [
                {
                    format: "avif",
                    device: "mobile",
                    resolution: "1x",
                    url: "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/scene/variants/img_test_yy_XZmgj_1x-IL1wcuF6dtT7JMQhwgDbB4WDPVKEwY.avif",
                    width: 832,
                    height: 468,
                    size: 31377,
                },
                {
                    format: "avif",
                    device: "mobile",
                    resolution: "2x",
                    url: "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/scene/variants/img_test_yy_XZmgj_2x-aUGz0B2Q8KVMG9xKYlrxOWH9FwEAhN.avif",
                    width: 1664,
                    height: 936,
                    size: 74400,
                },
            ],
            generatedAt: "2025-11-19T14:12:02.370Z",
        },
        novelStatus: "published" as const,
        publishedAt: new Date().toISOString(),
        publishedBy: getWriterUserId(),
        unpublishedAt: null,
        unpublishedBy: null,
        scheduledFor: null,
        autoPublish: false,
        comicStatus: "draft" as const,
        comicToonplay: null,
        comicPublishedAt: null,
        comicPublishedBy: null,
        comicUnpublishedAt: null,
        comicUnpublishedBy: null,
        comicGeneratedAt: null,
        comicPanelCount: 0,
        comicVersion: 1,
        viewCount: 48,
        uniqueViewCount: 35,
        novelViewCount: 48,
        novelUniqueViewCount: 35,
        comicViewCount: 0,
        comicUniqueViewCount: 0,
        lastViewedAt: new Date().toISOString(),
        orderIndex: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Static scene 2-3 data (Chapter 2, Scene 3)
 */
export function getTestScene2_3() {
    return {
        id: TEST_IDS.scenes.scene2_3,
        chapterId: TEST_IDS.chapters.chapter2,
        title: "A Light in the Darkness",
        summary:
            "After the battle, Elena tends to her wounded companions and earns their deeper trust by being honest about what she experienced. A forest spirit appears with cryptic guidance.",
        cyclePhase: "consequence" as const,
        emotionalBeat: "relief" as const,
        characterFocus: [TEST_IDS.characters.protagonist],
        settingId: TEST_IDS.settings.forest,
        sensoryAnchors: [
            "soft glow of healing herbs",
            "companions breathing steadily",
            "whisper of spirit voice",
        ],
        dialogueVsDescription: "45% dialogue, 55% description",
        suggestedLength: "medium" as const,
        content: `They made camp in a small clearing where moonlight broke through the canopy—one of those rare pockets where the forest's malevolence seemed to hold less power. Elena moved among her wounded, applying healing salves and binding injuries with practiced hands.

"That was..." Brennan started, then stopped. His bandaged arm lay in a sling. "Sir Elena, your eyes. During the fight. They were... somewhere else."

The others looked up. Even Garrett, stoic as ever, watched her with concern.

Elena paused in her work. She could lie. Could tell them it was nothing, just the forest's tricks. That was what a commander was supposed to do—appear unshakable.

But she remembered what she had promised them in the great hall. Truth.

"The forest showed me Thornhaven," she said quietly. "It showed me watching Aldric die. Tried to make me freeze again while you were being attacked."

Silence stretched. Mira's hand tightened on her sword.

"But you didn't," Garrett said. His voice was rough but not unkind. "You came for us."

"I almost didn't." Elena met his eyes. "The forest knows our fears and uses them. That's why we have to be honest with each other about what we carry. If it tries to use your past against you, don't face it alone. Call out. We fight together."

Brennan nodded slowly. "When I was small, I got lost in the woods near my village. It was only a few hours, but... I've never forgotten the fear. During the fight, I could have sworn I heard my mother calling me to go deeper into the forest."

"And you didn't go," Elena said. "That's what matters."

A soft light flickered at the edge of the clearing. The knights rose, reaching for weapons, but Elena held up a hand. The light coalesced into a form—a woman made of silver mist and starlight, with eyes old as the trees themselves.

A forest spirit.

"Young knight," the spirit said, her voice like wind through leaves, "you broke free of the forest's mirror. Few have done so."

"We mean no harm to your woods," Elena said carefully. "We seek only passage to the Northern Pass."

The spirit tilted her head, studying Elena with those ancient eyes. "The shadow remembers what the heart forgets. When the time comes, remember that you remembered. The way forward lies in what you choose to carry."

Before Elena could ask what that meant, the spirit dissolved into motes of light that drifted upward through the canopy.

"Helpful," Garrett muttered.

But Elena tucked the words away carefully. The shadow remembers what the heart forgets.

She suspected she would need them before the end.

"Rest while you can," she told her team. "We move at dawn."

As her companions settled into uneasy sleep, Elena stood watch, one hand on Aldric's sword. The forest whispered around her, but it felt different now. Less certain of its victory.

She smiled grimly.

*Let's see what else you have*, she thought.`,
        imageUrl:
            "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/scenes/test-scene-002-003/image.png",
        imageVariants: {
            imageId: "img_test_vWTcW_3P",
            originalUrl:
                "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/scene/original/img_test_vWTcW_3P-oLuFpwm4f2mhZvKEfpIrmGrzszdrxM.png",
            variants: [
                {
                    format: "avif",
                    device: "mobile",
                    resolution: "1x",
                    url: "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/scene/variants/img_test_vWTcW_3P_1x-c65x4Wzb3VhWb5bqAk0QdNs6R7bfts.avif",
                    width: 832,
                    height: 468,
                    size: 43588,
                },
                {
                    format: "avif",
                    device: "mobile",
                    resolution: "2x",
                    url: "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/test/stories/test-story-novel-001/scene/variants/img_test_vWTcW_3P_2x-doNA53o4XYiFAeHjtjrEVFVWxnVIXk.avif",
                    width: 1664,
                    height: 936,
                    size: 113057,
                },
            ],
            generatedAt: "2025-11-19T14:12:34.349Z",
        },
        novelStatus: "published" as const,
        publishedAt: new Date().toISOString(),
        publishedBy: getWriterUserId(),
        unpublishedAt: null,
        unpublishedBy: null,
        scheduledFor: null,
        autoPublish: false,
        comicStatus: "draft" as const,
        comicToonplay: null,
        comicPublishedAt: null,
        comicPublishedBy: null,
        comicUnpublishedAt: null,
        comicUnpublishedBy: null,
        comicGeneratedAt: null,
        comicPanelCount: 0,
        comicVersion: 1,
        viewCount: 42,
        uniqueViewCount: 30,
        novelViewCount: 42,
        novelUniqueViewCount: 30,
        comicViewCount: 0,
        comicUniqueViewCount: 0,
        lastViewedAt: new Date().toISOString(),
        orderIndex: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Get all static test data in the correct order for database insertion
 */
export function getAllTestData() {
    return {
        story: getTestStory(),
        characters: [getTestProtagonist(), getTestAntagonist()],
        settings: [getTestCastleSetting(), getTestForestSetting()],
        part: getTestPart(),
        chapters: [getTestChapter1(), getTestChapter2()],
        scenes: [
            getTestScene1_1(),
            getTestScene1_2(),
            getTestScene1_3(),
            getTestScene2_1(),
            getTestScene2_2(),
            getTestScene2_3(),
        ],
    };
}
