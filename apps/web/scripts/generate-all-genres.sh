#!/bin/bash

# Generate All Genre Stories Script
# Launches all remaining genre story generation pipelines sequentially

cd "$(dirname "$0")/.."

echo "🚀 Starting All Genre Stories Generation"
echo "========================================"

# Action - after 30 min
sleep 1800 && pnpm dotenv -e .env.local -- pnpm exec tsx scripts/generate-full-pipeline.ts \
  --prompt "Reformed getaway driver Sun-hee has left her criminal past behind and now works as a driving instructor in Seoul. Her quiet life shatters when her teenage student Ji-woo is kidnapped. The ransom: Sun-hee must be the getaway driver for one last heist that will frame Dae-jung, her old partner who took the fall for her crimes 10 years ago and just got out of prison. Sun-hee's internal flaw: she runs from consequences—she's never faced what she truly owes to those she hurt. The virtue tested: accountability and the courage to stop running. The action escalates: high-speed chases through Seoul, but the real tension is moral—can she sacrifice Dae-jung to save Ji-woo? The triumph: she realizes true freedom isn't escape, it's taking responsibility. She must turn herself in and confess the truth about the old crime to save both Ji-woo and Dae-jung." \
  --characters 3 --settings 3 --parts 1 --chapters-per-part 2 --scenes-per-chapter 3 --language English --skip-comic-panels \
  > ../../logs/action-pipeline.log 2>&1 &

# Isekai - after 40 min
sleep 2400 && pnpm dotenv -e .env.local -- pnpm exec tsx scripts/generate-full-pipeline.ts \
  --prompt "Office worker Joon-ho dies from overwork and reincarnates into his favorite web novel 'Chronicles of the Azure Blade'—but as a nameless side character destined to die in chapter three during the hero's awakening scene. Every time he changes events to save himself, the butterfly effect causes the main character Min-su to fail his quests. Joon-ho's internal flaw: in his previous life, he was invisible, too afraid to stand out or take risks. The virtue tested: self-worth and realizing every life matters, even background characters. The twist: he discovers his 'death' was meant to inspire Min-su to fight injustice. The triumph: instead of avoiding death or forcing survival, he chooses to die meaningfully—but in doing so, he unlocks a hidden class 'Guardian of Forgotten Stories' and learns that even small lives create massive ripples." \
  --characters 3 --settings 3 --parts 1 --chapters-per-part 2 --scenes-per-chapter 3 --language English --skip-comic-panels \
  > ../../logs/isekai-pipeline.log 2>&1 &

# LitRPG - after 50 min
sleep 3000 && pnpm dotenv -e .env.local -- pnpm exec tsx scripts/generate-full-pipeline.ts \
  --prompt "In a world where everyone has a System with combat classes, Ren is the last pure Healer—everyone else switched to damage builds after healing was nerfed in patch 3.7. Mocked as deadweight, Ren works odd jobs. When a world-ending Raid Boss 'The Entropic Devourer' appears, requiring sustained healing over a 72-hour marathon battle, Ren is humanity's only hope. Ren's internal flaw: he measures worth by others' DPS numbers and believes support roles are inferior. The virtue tested: finding value in helping others without glory or recognition. The LitRPG elements: unique healing combos, mana management across days, and the realization that 'meta' doesn't mean 'meaningful.' The triumph: Ren learns that carrying others through pain is the truest strength, and the world finally sees support classes aren't weak—they're what makes heroes possible." \
  --characters 3 --settings 3 --parts 1 --chapters-per-part 2 --scenes-per-chapter 3 --language English --skip-comic-panels \
  > ../../logs/litrpg-pipeline.log 2>&1 &

# Cultivation - after 60 min
sleep 3600 && pnpm dotenv -e .env.local -- pnpm exec tsx scripts/generate-full-pipeline.ts \
  --prompt "Lin Wei was the Celestial Peak Sect's most talented disciple until her cultivation core was shattered in a sabotage by a jealous rival. Cast out, she becomes a wandering healer in villages scorned by cultivators. When a plague specifically targeting high-level cultivators sweeps the land, Lin Wei's broken core makes her immune—and uniquely able to study and cure it. Lin Wei's internal flaw: she defined herself entirely by cultivation potential; without it, she believes she's worthless. The virtue tested: finding meaning beyond power. The cultivation elements: she develops a revolutionary 'Broken Core Technique' that uses fractures to absorb plague energy. The triumph: she realizes true cultivation isn't ascending to heaven—it's staying grounded enough to heal earth. She saves the sects but refuses to rejoin them, choosing to remain with common people." \
  --characters 3 --settings 3 --parts 1 --chapters-per-part 2 --scenes-per-chapter 3 --language English --skip-comic-panels \
  > ../../logs/cultivation-pipeline.log 2>&1 &

# Slice of Life - after 70 min
sleep 4200 && pnpm dotenv -e .env.local -- pnpm exec tsx scripts/generate-full-pipeline.ts \
  --prompt "When her estranged father dies, Ha-na inherits his failing vinyl record shop in Busan and a box labeled 'For Ha-na—one cassette per birthday.' Inside are cassette tapes he made for every birthday she refused to visit him for (ages 15-30). Each tape contains songs and his voice explaining why he chose them, revealing the father she thought abandoned her actually fought for custody, was falsely accused, and spent years trying to reconnect. Ha-na's internal flaw: she blamed her father for her mother's death in a car accident he was driving, never forgiving him. The virtue tested: forgiveness and accepting people contain multitudes. The slice-of-life unfolds: each tape reveals small moments, quiet regrets, deep love. The triumph: Ha-na reopens the record shop, playing his tapes for customers, learning that grief doesn't mean love ended—and that understanding comes too late is still understanding." \
  --characters 3 --settings 3 --parts 1 --chapters-per-part 2 --scenes-per-chapter 3 --language English --skip-comic-panels \
  > ../../logs/slice-pipeline.log 2>&1 &

# Paranormal - after 80 min
sleep 4800 && pnpm dotenv -e .env.local -- pnpm exec tsx scripts/generate-full-pipeline.ts \
  --prompt "Half-vampire Sera mediates supernatural disputes in modern Seoul, belonging to neither human nor vampire worlds. When murders threaten to expose vampires to humans, the Vampire Council orders all witnesses eliminated—including Sera's human mother, who has no idea what Sera truly is. Sera must solve the murders before the Council acts, while hiding her identity from her mother. Sera's internal flaw: she hides her true self from everyone, belonging nowhere because she won't be vulnerable anywhere. The virtue tested: authenticity and the courage to be fully seen. The paranormal escalates: the real killer is framing vampires to start a war, and Sera realizes her half-blood nature makes her the only bridge between species. The triumph: she reveals herself to her mother, accepts both halves of her identity, and stops the war—learning that belonging isn't about choosing sides, it's about being wholly yourself." \
  --characters 3 --settings 3 --parts 1 --chapters-per-part 2 --scenes-per-chapter 3 --language English --skip-comic-panels \
  > ../../logs/paranormal-pipeline.log 2>&1 &

# Dystopian - after 90 min
sleep 5400 && pnpm dotenv -e .env.local -- pnpm exec tsx scripts/generate-full-pipeline.ts \
  --prompt "In 2089 Seoul, memories can be extracted, taxed, and sold. Memory Auditor Hae-won enforces compliance, ensuring no one hoards undeclared memories. Her life is perfect obedience—until she discovers gaps in her own childhood. Someone has been erasing her past, and the memories she's been confiscating might be pieces of herself. Hae-won's internal flaw: she follows rules without question because she has no foundation of self to stand on. The virtue tested: identity and discovering who you are without memories. The dystopian horror: she learns she was the architect of the Memory Tax system, but chose to erase that fact. The triumph: she must decide whether to restore her memories and live with guilt, or stay ignorant and complicit—and learns that choosing who you are is more important than remembering who you were. She destroys the system she created." \
  --characters 3 --settings 3 --parts 1 --chapters-per-part 2 --scenes-per-chapter 3 --language English --skip-comic-panels \
  > ../../logs/dystopian-pipeline.log 2>&1 &

# Historical - after 100 min
sleep 6000 && pnpm dotenv -e .env.local -- pnpm exec tsx scripts/generate-full-pipeline.ts \
  --prompt "Joseon Dynasty Korea, 1750. When the royal potter goes blind, his daughter Young-soo secretly takes his place—but women are forbidden from the craft. She creates a masterpiece that catches Crown Prince Sado's eye, and he demands to meet the artist. Young-soo's internal flaw: she hides behind her father's name, believing her art is unworthy because she's a woman. The virtue tested: courage to claim her own identity and worth. The historical stakes: if discovered, she faces death; if she reveals herself, she destroys her father's legacy. The twist: Prince Sado is himself trapped by impossible expectations, and he sees in her pottery a freedom he craves. The triumph: she signs her masterpiece with her real name at the palace exhibition, risking everything—and Prince Sado, understanding the cost, protects her by declaring women's pottery a new royal tradition." \
  --characters 3 --settings 3 --parts 1 --chapters-per-part 2 --scenes-per-chapter 3 --language English --skip-comic-panels \
  > ../../logs/historical-pipeline.log 2>&1 &

# LGBTQ - after 110 min
sleep 6600 && pnpm dotenv -e .env.local -- pnpm exec tsx scripts/generate-full-pipeline.ts \
  --prompt "Ji-yeon is Seoul's top wedding planner, creating perfect ceremonies for others while secretly in love with her best friend Soo-min. When Soo-min asks Ji-yeon to plan her wedding to Min-ho, Ji-yeon agrees, believing she doesn't deserve happiness. As she designs the perfect day, both women must confront hidden feelings. Ji-yeon's internal flaw: she built her entire life around others' happy endings, believing she's not worthy of her own love story. Soo-min's flaw: she's marrying Min-ho because it's 'expected,' not because it's right. The virtue tested: self-acceptance and pursuing your own happiness. The romance unfolds: creating the wedding forces them to articulate what love truly means—and recognize it in each other. The triumph: three days before the ceremony, Soo-min cancels the wedding, and they both choose courage over comfort, love over fear, building their own happy ending together in a society slowly learning to accept them." \
  --characters 3 --settings 3 --parts 1 --chapters-per-part 2 --scenes-per-chapter 3 --language English --skip-comic-panels \
  > ../../logs/lgbtq-pipeline.log 2>&1 &

echo "✅ All genre story generation pipelines scheduled!"
echo "📊 Monitoring logs in ../../logs/*-pipeline.log"
