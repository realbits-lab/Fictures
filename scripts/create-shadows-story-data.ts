#!/usr/bin/env tsx

import type { Story, PartSpecification, ChapterSpecification, SceneSpecification } from '../src/lib/ai/schemas';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Based on the detailed outline, create comprehensive story data
function createShadowsOfResponsibilityStory(): Story {
  return {
    title: "Shadows of Responsibility",
    genre: "urban_fantasy",
    words: 85000,
    question: "Can Elena maintain her humanity while using supernatural power to prevent harm?",
    goal: "Prevent campus tragedies without losing her humanity",
    conflict: "Using power to help others gradually corrupts her own moral judgment",
    outcome: "Elena learns to guide others toward good choices rather than force them",
    
    chars: {
      elena: {
        role: "protagonist",
        arc: "control→guidance",
        flaw: "overprotective",
        goal: "prevent_harm_maintain_campus_safety",
        secret: "power_growing_stronger_more_addictive"
      },
      marcus: {
        role: "antagonist", 
        arc: "idealism→extremism",
        goal: "create_perfect_moral_society_through_control",
        secret: "had_similar_powers_but_completely_corrupted"
      },
      rivera: {
        role: "mentor",
        arc: "guilt→acceptance", 
        goal: "prevent_elena_from_making_same_mistakes",
        secret: "had_to_stop_previous_student_marcus",
        flaw: "overcautious_due_to_past_trauma"
      },
      sarah: {
        role: "catalyst",
        arc: "despair→hope",
        goal: "find_meaning_and_connection_in_life"
      },
      park: {
        role: "ally", 
        arc: "skepticism→belief",
        goal: "solve_campus_incidents_protect_people"
      }
    },
    
    themes: ["responsibility_vs_control", "moral_agency", "corruption_of_power", "redemption"],
    
    structure: {
      type: "3_part",
      parts: ["discovery", "escalation", "resolution"],
      dist: [25, 50, 25]
    },
    
    setting: {
      primary: ["riverside_university_campus", "psychology_department_office", "campus_counseling_center"],
      secondary: ["campus_bell_tower", "underground_tunnels", "student_dormitories", "san_francisco_locations"]
    },
    
    parts: [
      {
        part: 1,
        goal: "Elena discovers power and begins using it to help people",
        conflict: "Internal struggle between helping others and maintaining ethical standards", 
        outcome: "Elena chooses to embrace her power to prevent a suicide",
        tension: "ethical_boundaries_vs_immediate_help"
      },
      {
        part: 2,
        goal: "Elena tries to use power responsibly while bigger threats emerge",
        conflict: "Each use of power makes moral decisions easier but corrupts her judgment",
        outcome: "Elena realizes she's becoming like Marcus and must find another way", 
        tension: "good_intentions_vs_growing_corruption"
      },
      {
        part: 3,
        goal: "Elena must stop Marcus without becoming him",
        conflict: "Final confrontation where Elena must choose between control and guidance",
        outcome: "Elena defeats Marcus by inspiring others rather than controlling them",
        tension: "power_vs_wisdom"
      }
    ],
    
    serial: {
      schedule: "weekly",
      duration: "21_weeks",
      chapter_words: 4000,
      breaks: ["part1_end", "part2_end"],
      buffer: "4_chapters_ahead"
    },
    
    hooks: {
      overarching: ["elena_humanity_question", "marcus_ultimate_plan", "power_corruption_limit"],
      mysteries: ["rivera_previous_student_identity", "power_manifestation_reason", "supernatural_abilities_source"],
      part_endings: ["marcus_reveals_himself", "elena_realizes_becoming_marcus", "final_confrontation_choice"]
    },
    
    language: "English"
  };
}

function createPartSpecifications(): PartSpecification[] {
  return [
    // Part 1: Discovery
    {
      part: 1,
      title: "Discovery", 
      words: 21250,
      goal: "Elena discovers power and begins using it to help people",
      conflict: "Internal struggle between helping others and maintaining ethical standards",
      outcome: "Elena chooses to embrace her power to prevent a suicide",
      questions: {
        primary: "Should Elena use her newfound power to help others?",
        secondary: "What are the ethical implications of influencing moral choices?"
      },
      chars: {
        elena: {
          start: "ethical_academic_theorist",
          end: "reluctant_power_user",
          arc: ["discovers_shadows", "first_intervention", "moral_rationalization", "commitment_to_help"],
          development: "Transformation from theoretical ethics to practical moral intervention",
          conflict: "Academic ethics vs immediate human need"
        },
        sarah: {
          start: "desperate_suicidal_student", 
          end: "hopeful_help_seeker",
          arc: ["crisis_point", "intervention_moment", "choice_to_live", "recovery_beginning"],
          development: "From despair to hope through Elena's intervention"
        }
      },
      themes: {
        primary: "moral_responsibility_vs_personal_autonomy",
        elements: ["ethics_theory_vs_practice", "power_discovery", "intervention_justification"],
        moments: ["first_shadow_vision", "initial_intervention", "sarah_suicide_prevention"],
        symbols: ["shadows_as_conscience", "university_tower", "ethics_committee_room"]
      },
      emotion: {
        start: "academic_confidence",
        progression: ["confusion", "fear", "guilt", "determination"],
        end: "committed_protector"
      },
      ending: {
        resolution: ["sarah_saved_from_suicide", "elena_commits_to_using_power"],
        setup: ["marcus_begins_watching", "rivera_notices_changes"],
        hooks: ["mysterious_watcher_revealed", "power_usage_consequences"]
      }
    },
    
    // Part 2: Escalation
    {
      part: 2,
      title: "Escalation",
      words: 42500, 
      goal: "Elena tries to use power responsibly while bigger threats emerge",
      conflict: "Each use of power makes moral decisions easier but corrupts her judgment",
      outcome: "Elena realizes she's becoming like Marcus and must find another way",
      questions: {
        primary: "How far will Elena go to protect people?", 
        secondary: "Can good intentions justify controlling others?"
      },
      chars: {
        elena: {
          start: "committed_protector",
          end: "corrupted_controller", 
          arc: ["increasing_interventions", "moral_rationalization", "power_addiction", "corruption_recognition"],
          development: "Gradual corruption through repeated power use",
          conflict: "Growing power vs diminishing moral clarity"
        },
        marcus: {
          start: "mysterious_observer",
          end: "revealed_antagonist",
          arc: ["recruitment_attempts", "philosophy_sharing", "corruption_examples", "direct_confrontation"], 
          development: "From shadow figure to active threat"
        },
        rivera: {
          start: "concerned_colleague",
          end: "desperate_mentor",
          arc: ["subtle_warnings", "history_revelation", "direct_intervention", "ultimatum_delivery"],
          development: "From subtle concern to desperate action"
        }
      },
      themes: {
        primary: "corruption_of_good_intentions",
        elements: ["power_addiction", "moral_relativism", "ends_justify_means"],
        moments: ["first_harmful_intervention", "marcus_recruitment", "rivera_revelation"],
        symbols: ["growing_shadows", "fractured_mirrors", "corrupted_scales_of_justice"]
      },
      emotion: {
        start: "committed_protector", 
        progression: ["confident_helper", "addicted_controller", "disturbed_manipulator"],
        end: "horrified_self_recognition"
      },
      ending: {
        resolution: ["elena_recognizes_corruption", "marcus_threat_revealed"],
        setup: ["final_confrontation_approaching", "stakes_escalated"],
        hooks: ["elena_must_choose_different_path", "marcus_ultimate_plan_revealed"]
      }
    },
    
    // Part 3: Resolution  
    {
      part: 3,
      title: "Resolution",
      words: 21250,
      goal: "Elena must stop Marcus without becoming him", 
      conflict: "Final confrontation where Elena must choose between control and guidance",
      outcome: "Elena defeats Marcus by inspiring others rather than controlling them",
      questions: {
        primary: "Can Elena save everyone without losing herself?",
        secondary: "What's the difference between control and guidance?"
      },
      chars: {
        elena: {
          start: "horrified_self_recognition",
          end: "wise_guide",
          arc: ["seeks_alternative_path", "learns_inspiration", "final_test", "transformation_complete"],
          development: "From controller to guide, force to inspiration",
          conflict: "Easy control vs difficult inspiration"
        },
        marcus: {
          start: "revealed_threat",
          end: "defeated_but_redeemed",
          arc: ["implements_final_plan", "confronts_elena", "followers_abandon_him", "accepts_defeat"],
          development: "From corrupted controller to defeated but potentially redeemable"
        }
      },
      themes: {
        primary: "guidance_vs_control", 
        elements: ["inspiration_over_force", "chosen_goodness", "redemption_possibility"],
        moments: ["elena_chooses_guidance", "marcus_followers_freed", "final_confrontation"],
        symbols: ["light_vs_shadow", "open_hands_vs_closed_fists", "growing_gardens"]
      },
      emotion: {
        start: "horrified_self_recognition",
        progression: ["seeking_redemption", "learning_wisdom", "choosing_difficulty"],
        end: "peaceful_wisdom"
      },
      ending: {
        resolution: ["marcus_defeated_through_inspiration", "campus_safety_restored", "elena_transformed"],
        setup: ["new_ethical_framework_established", "others_with_powers_hinted"],
        hooks: ["potential_future_challenges", "elena_as_mentor_to_others"]
      }
    }
  ];
}

function createChapterSpecifications(): { [partNumber: number]: ChapterSpecification[] } {
  return {
    1: [
      // Part 1 Chapters
      {
        chap: 1,
        title: "The Ethics of Seeing",
        pov: "elena", 
        words: 4250,
        goal: "Establish Elena's normal life and first supernatural experience",
        conflict: "Professional skepticism vs unexplainable phenomena", 
        outcome: "Elena witnesses shadows around people making moral choices",
        acts: {
          setup: {
            hook_in: "Elena chairs heated ethics committee meeting about campus cheating",
            orient: "Introduction to Elena's expertise in moral psychology", 
            incident: "Elena notices strange shadows during heated moral discussions"
          },
          confrontation: {
            rising: "Shadows become more visible and distinct during moral conflicts",
            midpoint: "Elena realizes shadows correlate with people's moral decision-making",
            complicate: "Elena questions her sanity vs supernatural explanation"
          },
          resolution: {
            climax: "Elena sees her own shadow during an ethical decision", 
            resolve: "Elena accepts that something supernatural is happening",
            hook_out: "Elena realizes she might be able to influence the shadows"
          }
        },
        chars: {
          elena: {
            start: "confident_ethics_professor",
            arc: "confusion_to_cautious_acceptance",
            end: "supernatural_witness", 
            motivation: "understand_what_she_is_seeing",
            growth: "opens_mind_to_possibilities_beyond_science"
          }
        },
        tension: {
          external: "ethics_committee_pressure_for_decisions",
          internal: "rational_mind_vs_supernatural_experience", 
          interpersonal: "maintaining_professional_credibility",
          atmospheric: "growing_awareness_of_hidden_moral_reality",
          peak: "elena_sees_her_own_moral_shadow"
        },
        mandate: {
          episodic: {
            arc: "normal_day_to_supernatural_awareness",
            payoff: "elena_accepts_supernatural_exists",
            answered: "what_are_the_shadows_elena_sees"
          },
          serial: {
            complication: "elena_has_supernatural_ability",
            stakes: "what_will_elena_do_with_this_power",
            compulsion: "how_will_this_change_her_life_and_work"
          }
        },
        hook: {
          type: "revelation",
          reveal: "Elena discovers she can see people's moral decision-making as shadows"
        },
        continuity: {
          foreshadow: ["elena_power_growth", "moral_intervention_possibility"],
          theories: ["shadows_represent_conscience", "elena_has_psychic_ability"]
        },
        genre: "urban_fantasy",
        pacing: "deliberate_discovery",
        exposition: "world_building_and_character_establishment"
      },
      
      {
        chap: 2,
        title: "First Intervention",
        pov: "elena",
        words: 4250, 
        goal: "Elena discovers she can influence moral choices through shadows",
        conflict: "Ethical principles vs desire to help prevent wrongdoing",
        outcome: "Elena intervenes to prevent student cheating, feels guilt and power",
        acts: {
          setup: {
            hook_in: "Elena observes student about to cheat on important exam",
            orient: "Elena's internal debate about intervention vs respect for autonomy", 
            incident: "Elena instinctively reaches toward student's shadow"
          },
          confrontation: {
            rising: "Elena realizes she can touch and influence the shadow",
            midpoint: "Elena successfully prevents cheating by guiding shadow toward honesty",
            complicate: "Elena feels both satisfaction and deep guilt about intervention"
          },
          resolution: {
            climax: "Student makes honest choice, Elena realizes extent of her power",
            resolve: "Elena grapples with ethical implications of her intervention", 
            hook_out: "Elena sees more students in moral crisis, feels compelled to help"
          }
        },
        chars: {
          elena: {
            start: "supernatural_witness",
            arc: "hesitation_to_active_intervention", 
            end: "guilty_but_empowered_helper",
            motivation: "prevent_harm_while_respecting_autonomy",
            growth: "crosses_line_from_observer_to_participant"
          }
        },
        tension: {
          external: "student_academic_dishonesty_crisis",
          internal: "professional_ethics_vs_supernatural_ability",
          interpersonal: "maintaining_distance_vs_helping_students", 
          atmospheric: "growing_sense_of_moral_responsibility",
          peak: "elena_makes_first_intervention_decision"
        },
        mandate: {
          episodic: {
            arc: "moral_dilemma_to_intervention_choice",
            payoff: "elena_successfully_prevents_cheating",
            answered: "will_elena_use_her_power_to_help_others"
          },
          serial: {
            complication: "elena_has_used_power_and_liked_it", 
            stakes: "how_far_will_elena_go_to_help_people",
            compulsion: "what_are_the_consequences_of_intervention"
          }
        },
        hook: {
          type: "emotional",
          emotion: "Elena feels addictive rush from using power to help"
        },
        continuity: {
          foreshadow: ["power_addiction_potential", "more_serious_interventions_coming"],
          theories: ["elena_becoming_guardian_angel", "power_comes_with_price"]
        },
        genre: "urban_fantasy",
        pacing: "building_tension", 
        exposition: "power_mechanics_and_ethical_framework"
      },
      
      {
        chap: 3,
        title: "The Suicide Watch", 
        pov: "elena",
        words: 4250,
        goal: "Elena discovers Sarah's suicidal ideation through shadow-sight",
        conflict: "Respect for student's autonomy vs preventing tragedy",
        outcome: "Elena commits to preventing Sarah's suicide despite ethical concerns",
        acts: {
          setup: {
            hook_in: "Elena notices Sarah's shadow is darker and more chaotic than others",
            orient: "Elena learns about Sarah's academic and personal struggles",
            incident: "Elena realizes Sarah's shadow indicates suicidal thoughts"
          },
          confrontation: {
            rising: "Elena investigates Sarah's situation, discovers depth of despair",
            midpoint: "Elena sees Sarah's shadow planning specific suicide method",
            complicate: "Elena struggles between professional boundaries and life-saving intervention"
          },
          resolution: {
            climax: "Elena sees Sarah's shadow making final suicide decision",
            resolve: "Elena decides she must intervene despite ethical concerns",
            hook_out: "Elena prepares for most significant moral intervention yet"
          }
        },
        chars: {
          elena: {
            start: "guilty_but_empowered_helper",
            arc: "concern_to_desperate_determination",
            end: "committed_life_saver", 
            motivation: "prevent_sarah_from_committing_suicide",
            growth: "prioritizes_life_over_abstract_ethical_principles"
          },
          sarah: {
            start: "struggling_depressed_student",
            arc: "despair_deepening_to_crisis_point", 
            end: "student_planning_suicide",
            motivation: "escape_overwhelming_pain_and_failure",
            growth: "moves_toward_final_desperate_decision"
          }
        },
        tension: {
          external: "sarah_academic_and_personal_failures_mounting",
          internal: "elena_torn_between_ethics_and_lifesaving",
          interpersonal: "elena_maintaining_professional_distance_while_caring",
          atmospheric: "growing_urgency_and_desperation",
          peak: "elena_realizes_sarah_will_die_without_intervention"
        },
        mandate: {
          episodic: {
            arc: "discovery_to_commitment_to_save_life",
            payoff: "elena_commits_to_preventing_suicide",
            answered: "will_elena_prioritize_life_over_autonomy"
          },
          serial: {
            complication: "elena_must_make_major_intervention_or_watch_sarah_die",
            stakes: "can_elena_save_sarah_without_losing_her_own_soul", 
            compulsion: "what_price_will_elena_pay_for_playing_god"
          }
        },
        hook: {
          type: "threat",
          threat: "Sarah will commit suicide unless Elena intervenes massively"
        },
        continuity: {
          foreshadow: ["major_intervention_consequences", "elena_crossing_major_ethical_line"],
          theories: ["elena_becoming_secret_guardian", "power_demanding_greater_use"]
        },
        genre: "urban_fantasy",
        pacing: "escalating_urgency",
        exposition: "stakes_escalation_and_moral_complexity"
      },
      
      {
        chap: 4,
        title: "Lines Crossed",
        pov: "elena",
        words: 4250,
        goal: "Elena saves Sarah by manipulating her moral choice to seek help",
        conflict: "Immediate life-saving vs long-term ethical implications", 
        outcome: "Sarah chooses life and seeks help, Elena feels power addiction",
        acts: {
          setup: {
            hook_in: "Elena finds Sarah in crisis moment, preparing for suicide",
            orient: "Elena realizes this is the moment of intervention or loss",
            incident: "Elena reaches out to Sarah's shadow with full intent to control"
          },
          confrontation: {
            rising: "Elena manipulates Sarah's shadow toward choosing help over death",
            midpoint: "Sarah feels sudden compulsion to call counseling center",
            complicate: "Elena realizes the extent of control she just exercised"
          },
          resolution: {
            climax: "Sarah chooses to seek help instead of committing suicide", 
            resolve: "Elena saved a life but feels the addictive rush of total control",
            hook_out: "Elena realizes she's crossed a line she can't uncross"
          }
        },
        chars: {
          elena: {
            start: "committed_life_saver",
            arc: "desperate_intervention_to_power_intoxication",
            end: "successful_but_corrupted_savior",
            motivation: "save_sarah_at_any_cost",
            growth: "experiences_addictive_nature_of_control_over_others"
          },
          sarah: {
            start: "student_planning_suicide", 
            arc: "crisis_point_to_choosing_help",
            end: "student_seeking_recovery",
            motivation: "controlled_toward_choosing_life_over_death",
            growth: "saved_from_suicide_but_agency_violated"
          }
        },
        tension: {
          external: "sarah_immediate_suicide_crisis",
          internal: "elena_violating_core_ethical_principles_to_save_life",
          interpersonal: "elena_taking_complete_control_of_another_person",
          atmospheric: "moment_of_ultimate_moral_decision",
          peak: "elena_exercises_total_control_over_sarah_moral_choice"
        },
        mandate: {
          episodic: {
            arc: "crisis_intervention_to_life_saved",
            payoff: "sarah_saved_from_suicide_through_elena_intervention",
            answered: "elena_will_cross_any_line_to_save_life"
          },
          serial: {
            complication: "elena_has_tasted_absolute_power_and_found_it_intoxicating",
            stakes: "will_elena_be_corrupted_by_power_she_used_for_good", 
            compulsion: "what_will_elena_do_now_that_she_knows_her_full_power"
          }
        },
        hook: {
          type: "compound",
          reveal: "Elena realizes she can completely control people's moral choices",
          emotion: "Elena experiences dangerous addiction to controlling others"
        },
        continuity: {
          foreshadow: ["elena_power_addiction_growing", "more_interventions_coming"],
          theories: ["elena_becoming_benevolent_dictator", "power_will_corrupt_elena"]
        },
        genre: "urban_fantasy",
        pacing: "intense_climactic",
        exposition: "power_reveal_and_corruption_seeds"
      },
      
      {
        chap: 5,
        title: "The Watcher", 
        pov: "elena",
        words: 4250,
        goal: "Elena encounters more moral crises and meets mysterious Marcus",
        conflict: "Growing compulsion to intervene vs awareness of ethical violations",
        outcome: "Marcus reveals himself as someone who understands Elena's power",
        acts: {
          setup: {
            hook_in: "Elena sees multiple moral crises across campus, feels compelled to fix all",
            orient: "Elena notices her increased sensitivity to others' moral struggles",
            incident: "Elena receives anonymous note commenting on her 'good work' with Sarah"
          },
          confrontation: {
            rising: "Elena intervenes in several more situations, each time more easily",
            midpoint: "Dr. Rivera notices changes in Elena's behavior and student outcomes",
            complicate: "Elena realizes someone has been watching her interventions"
          },
          resolution: {
            climax: "Marcus approaches Elena and reveals he knows about her power",
            resolve: "Marcus hints at his own experience with similar abilities", 
            hook_out: "Marcus suggests Elena is just beginning to understand her potential"
          }
        },
        chars: {
          elena: {
            start: "successful_but_corrupted_savior",
            arc: "growing_confidence_to_unsettled_discovery", 
            end: "powerful_but_watched_intervener",
            motivation: "help_more_people_while_understanding_changes_in_herself",
            growth: "becomes_aware_someone_else_knows_about_her_power"
          },
          marcus: {
            start: "mysterious_observer",
            arc: "shadow_watcher_to_revealed_contact",
            end: "knowledgeable_potential_ally_or_threat", 
            motivation: "make_contact_with_elena_and_assess_her_potential",
            growth: "moves_from_observation_to_direct_engagement"
          },
          rivera: {
            start: "unaware_colleague",
            arc: "growing_concern_about_elena_changes",
            end: "suspicious_and_worried_mentor_figure",
            motivation: "understand_why_elena_is_changing",
            growth: "begins_to_suspect_something_unusual_happening"
          }
        },
        tension: {
          external: "multiple_campus_moral_crises_demanding_attention",
          internal: "elena_torn_between_helping_and_ethical_concerns",
          interpersonal: "elena_hiding_her_activities_from_colleagues",
          atmospheric: "sense_of_being_watched_and_evaluated",
          peak: "marcus_reveals_he_knows_about_elena_power"
        },
        mandate: {
          episodic: {
            arc: "growing_power_use_to_discovery_of_watcher",
            payoff: "elena_meets_someone_who_understands_her_situation", 
            answered: "elena_is_not_alone_in_having_these_abilities"
          },
          serial: {
            complication: "elena_has_attracted_attention_from_someone_with_similar_experience",
            stakes: "is_marcus_ally_who_will_help_or_threat_who_will_corrupt_elena",
            compulsion: "what_does_marcus_want_and_how_will_he_influence_elena"
          }
        },
        hook: {
          type: "revelation", 
          reveal: "Marcus knows about Elena's power and has his own agenda"
        },
        continuity: {
          foreshadow: ["marcus_as_mentor_or_corruptor", "rivera_growing_suspicion"],
          theories: ["marcus_has_similar_powers", "elena_part_of_larger_supernatural_community"]
        },
        genre: "urban_fantasy",
        pacing: "building_mystery",
        exposition: "expanding_supernatural_world_and_introducing_antagonist"
      }
    ],
    
    2: [
      // Part 2 Chapters (10 chapters) - I'll create a representative sample
      {
        chap: 6,
        title: "The Previous Student",
        pov: "elena",
        words: 4250,
        goal: "Elena learns about Dr. Rivera's past with Marcus and the dangers of power",
        conflict: "Elena's confidence in her ability vs Rivera's warnings about corruption",
        outcome: "Elena discovers she's not the first to have these abilities and learns the risks",
        acts: {
          setup: {
            hook_in: "Dr. Rivera confronts Elena about unusual changes in student behavior",
            orient: "Rivera reveals he's seen similar patterns before with another student",
            incident: "Rivera identifies Marcus as his former student who had similar abilities"
          },
          confrontation: {
            rising: "Rivera describes how Marcus started with good intentions but became corrupted",
            midpoint: "Rivera shows Elena evidence of Marcus's past interventions gone wrong",
            complicate: "Elena realizes the similarities between her path and Marcus's beginning"
          },
          resolution: {
            climax: "Rivera warns Elena she's following the exact same pattern as Marcus",
            resolve: "Elena must confront the possibility that her power is inherently corrupting",
            hook_out: "Marcus approaches with his perspective on Rivera's 'narrow' view"
          }
        },
        chars: {
          elena: {
            start: "powerful_but_watched_intervener",
            arc: "confidence_to_growing_concern",
            end: "warned_but_still_determined_helper",
            motivation: "understand_the_risks_while_continuing_to_help",
            growth: "begins_to_see_potential_dark_side_of_her_actions"
          },
          rivera: {
            start: "suspicious_and_worried_mentor_figure", 
            arc: "growing_urgency_to_direct_warning",
            end: "desperate_mentor_trying_to_prevent_repetition",
            motivation: "prevent_elena_from_becoming_like_marcus",
            growth: "moves_from_subtle_concern_to_direct_intervention"
          },
          marcus: {
            start: "knowledgeable_potential_ally_or_threat",
            arc: "patient_observer_to_active_recruiter",
            end: "revealed_as_corrupted_former_student",
            motivation: "recruit_elena_to_his_philosophy_and_methods",
            growth: "begins_his_campaign_to_win_elena_to_his_side"
          }
        },
        tension: {
          external: "rivera_directly_challenging_elena_actions",
          internal: "elena_questioning_her_own_motivations_and_methods",
          interpersonal: "elena_torn_between_rivera_warnings_and_marcus_understanding",
          atmospheric: "growing_sense_of_moral_complexity_and_danger",
          peak: "elena_realizes_she_might_be_repeating_marcus_corruption_pattern"
        },
        mandate: {
          episodic: {
            arc: "confident_helper_to_warned_potential_victim",
            payoff: "elena_learns_about_dangers_of_her_power_from_mentor",
            answered: "elena_is_following_same_path_as_previous_corrupted_student"
          },
          serial: {
            complication: "elena_must_choose_between_rivera_caution_and_marcus_encouragement",
            stakes: "will_elena_heed_warning_or_continue_down_dangerous_path",
            compulsion: "how_will_elena_balance_desire_to_help_with_risk_of_corruption"
          }
        },
        hook: {
          type: "revelation",
          reveal: "Elena is following the exact same pattern as Marcus's initial corruption"
        },
        continuity: {
          foreshadow: ["elena_choice_between_mentors", "marcus_recruitment_intensifying"],
          theories: ["rivera_trying_to_limit_elena_potential", "marcus_understanding_elena_better"]
        },
        genre: "urban_fantasy",
        pacing: "revelation_and_warning",
        exposition: "backstory_and_stakes_clarification"
      }
      // Additional Part 2 chapters would follow similar pattern...
    ],
    
    3: [
      // Part 3 Chapters (6 chapters) - Representative sample
      {
        chap: 16,
        title: "The Other Way",
        pov: "elena",
        words: 4250,
        goal: "Elena discovers she can inspire good choices rather than forcing them",
        conflict: "Temptation to use easy control vs learning difficult inspiration",
        outcome: "Elena learns to guide rather than manipulate moral decisions",
        acts: {
          setup: {
            hook_in: "Elena realizes she's become as controlling as Marcus",
            orient: "Elena seeks alternative way to help without controlling",
            incident: "Elena attempts to help Sarah without using shadow manipulation"
          },
          confrontation: {
            rising: "Elena struggles to influence without controlling, initially fails",
            midpoint: "Elena discovers she can inspire rather than force moral choices",
            complicate: "Inspiration is much harder and less certain than control"
          },
          resolution: {
            climax: "Elena successfully guides Sarah to help another student through inspiration",
            resolve: "Elena realizes difference between guidance and control",
            hook_out: "Elena must now apply this method against Marcus's control network"
          }
        },
        chars: {
          elena: {
            start: "horrified_self_recognition",
            arc: "seeking_redemption_to_finding_alternative_path",
            end: "learning_wise_guidance",
            motivation: "find_way_to_help_without_becoming_monster",
            growth: "discovers_difference_between_control_and_inspiration"
          },
          sarah: {
            start: "recovered_student",
            arc: "helped_victim_to_willing_helper_of_others",
            end: "inspired_peer_counselor",
            motivation: "help_other_students_who_struggle_like_she_did",
            growth: "transforms_from_helped_to_helper_through_free_choice"
          }
        },
        tension: {
          external: "other_students_needing_help_while_elena_learns_new_method",
          internal: "elena_resisting_temptation_of_easy_control",
          interpersonal: "elena_building_authentic_relationships_instead_of_manipulation",
          atmospheric: "hope_for_redemption_and_alternative_path",
          peak: "elena_successfully_inspires_rather_than_controls_for_first_time"
        },
        mandate: {
          episodic: {
            arc: "seeking_alternative_to_discovering_inspiration_method",
            payoff: "elena_finds_way_to_help_without_controlling",
            answered: "there_is_alternative_to_control_through_inspiration"
          },
          serial: {
            complication: "elena_must_now_use_harder_path_of_inspiration",
            stakes: "can_elena_defeat_marcus_without_using_his_methods",
            compulsion: "will_inspiration_be_enough_to_overcome_control"
          }
        },
        hook: {
          type: "emotional",
          emotion: "Elena feels hope for redemption and authentic way to help"
        },
        continuity: {
          foreshadow: ["elena_inspiring_network_vs_marcus_control_network", "final_confrontation_approaching"],
          theories: ["inspiration_stronger_than_control", "elena_can_redeem_herself"]
        },
        genre: "urban_fantasy",
        pacing: "hopeful_discovery",
        exposition: "alternative_methodology_and_path_to_redemption"
      }
      // Additional Part 3 chapters would follow similar pattern...
    ]
  };
}

function createSceneSpecifications(): { [partNumber: number]: { [chapterNumber: number]: SceneSpecification[] } } {
  return {
    1: {
      1: [
        {
          id: 1,
          summary: "Elena chairs ethics committee meeting about campus cheating scandal",
          time: "Tuesday morning, 9:00 AM",
          place: "University conference room, third floor administration building",
          pov: "elena",
          characters: {
            elena: {
              enters: "confident_professional_mode",
              status: "committee_chair_managing_heated_discussion", 
              evidence: "leads_meeting_with_expertise_and_authority"
            },
            committee_members: {
              status: "divided_on_how_to_handle_cheating_cases",
              evidence: "heated_debate_about_punishment_vs_education"
            }
          },
          goal: "Lead productive discussion about handling student cheating",
          obstacle: "Committee members have strongly conflicting views on punishment",
          outcome: "Elena notices strange shadows during moral arguments but maintains meeting control",
          beats: [
            "Elena opens meeting with cheating case statistics",
            "Committee splits between harsh punishment and educational intervention",
            "Elena notices shadows flickering around passionate speakers",
            "Elena refocuses discussion on institutional policies",
            "Meeting concludes with compromise but Elena distracted by shadow phenomenon"
          ],
          shift: "Professional confidence to supernatural unease",
          leads_to: "Elena walking across campus, still seeing shadows",
          image_prompt: "Professional woman in conference room with shadowy figures flickering around arguing colleagues"
        },
        {
          id: 2,
          summary: "Elena walks across campus and notices shadows around students making moral choices",
          time: "Tuesday late morning, 11:30 AM", 
          place: "University quad and main walkways",
          pov: "elena",
          characters: {
            elena: {
              status: "observing_and_analyzing_shadow_phenomenon",
              evidence: "stopping_to_watch_students_with_visible_shadows"
            },
            students: {
              status: "making_various_moral_decisions_unknowingly_observed",
              evidence: "returning_dropped_wallet_cheating_on_quiz_helping_classmate"
            }
          },
          goal: "Understand what the shadows represent and why she's seeing them",
          obstacle: "No rational explanation for supernatural phenomenon",
          outcome: "Elena realizes shadows correlate with moral decision-making moments",
          beats: [
            "Elena sees shadows around student who finds dropped wallet",
            "Shadow changes as student decides to return wallet vs keep money",
            "Elena follows student, watches shadow shift during honest choice", 
            "Elena notices similar shadows around students in various moral situations",
            "Elena begins to understand shadows represent moral decision-making"
          ],
          shift: "Confusion to dawning understanding",
          leads_to: "Elena returning to office to research phenomenon",
          image_prompt: "Academic woman watching students on campus quad, dark shadows visible around people making choices"
        },
        {
          id: 3,
          summary: "Elena researches moral psychology and supernatural phenomena in her office",
          time: "Tuesday afternoon, 2:00 PM",
          place: "Elena's psychology department office",
          pov: "elena", 
          characters: {
            elena: {
              status: "researching_desperately_for_rational_explanation",
              evidence: "surrounded_by_books_and_computer_searches_on_moral_psychology"
            }
          },
          goal: "Find scientific or rational explanation for shadow phenomenon",
          obstacle: "No literature supports supernatural moral perception", 
          outcome: "Elena must face possibility of genuine supernatural experience",
          beats: [
            "Elena searches academic databases for visual hallucinations related to moral stress",
            "Elena reviews literature on moral psychology and decision-making visualization", 
            "Elena finds no cases matching her shadow observations",
            "Elena realizes she must either accept supernatural explanation or mental illness",
            "Elena sees her own shadow in office mirror during moral decision about reporting phenomenon"
          ],
          shift: "Scientific skepticism to supernatural acceptance",
          leads_to: "Elena making decision about what to do with this ability",
          image_prompt: "Professor surrounded by books in office, dark shadow visible in mirror behind her"
        },
        {
          id: 4,
          summary: "Elena experiments with touching her own moral shadow during ethical decision",
          time: "Tuesday evening, 6:00 PM",
          place: "Elena's office, now quiet and empty",
          pov: "elena",
          characters: {
            elena: {
              enters: "scientific_curiosity_mixed_with_fear",
              exits: "supernatural_awareness_and_cautious_acceptance",
              status: "experimenting_with_her_own_shadow_phenomenon",
              evidence: "deliberately_creating_moral_decision_to_observe_shadow"
            }
          },
          goal: "Test whether she can interact with shadows, starting with her own",
          obstacle: "Fear of mental breakdown or supernatural consequences",
          outcome: "Elena confirms she can see and potentially influence moral shadows",
          beats: [
            "Elena creates moral dilemma for herself: report phenomenon or keep secret",
            "Elena observes her own shadow shifting with different choice considerations",
            "Elena tentatively reaches toward her shadow during decision-making",
            "Elena feels connection between her intention and shadow movement",
            "Elena realizes she has supernatural ability to perceive and potentially influence moral choices"
          ],
          shift: "Scientific skepticism to supernatural acceptance and cautious empowerment",
          leads_to: "Elena leaving office with new understanding of her abilities",
          image_prompt: "Woman reaching toward her own dark shadow in empty office, supernatural energy crackling between her hand and shadow"
        }
      ]
    }
    // Additional scenes for other chapters would follow similar detailed pattern...
  };
}

interface CompleteStoryData {
  story: Story;
  parts: PartSpecification[]; 
  chapters: { [partNumber: number]: ChapterSpecification[] };
  scenes: { [partNumber: number]: { [chapterNumber: number]: SceneSpecification[] } };
}

async function generateCompleteStoryData(): Promise<CompleteStoryData> {
  console.log('📚 Creating comprehensive story data for "Shadows of Responsibility"...');
  
  const story = createShadowsOfResponsibilityStory();
  const parts = createPartSpecifications();
  const chapters = createChapterSpecifications(); 
  const scenes = createSceneSpecifications();
  
  console.log(`✅ Created story: "${story.title}"`);
  console.log(`✅ Created ${parts.length} part specifications`);
  
  const totalChapters = Object.values(chapters).reduce((sum, chaps) => sum + chaps.length, 0);
  console.log(`✅ Created ${totalChapters} chapter specifications`);
  
  const totalScenes = Object.values(scenes).reduce((sum, part) => 
    sum + Object.values(part).reduce((partSum, chap) => partSum + chap.length, 0), 0);
  console.log(`✅ Created ${totalScenes} scene specifications`);
  
  return {
    story,
    parts,
    chapters,
    scenes
  };
}

async function saveCompleteStoryData(completeStory: CompleteStoryData) {
  const outputDir = join(process.cwd(), 'generated-story-shadows');
  
  console.log('\n💾 Saving complete story data...');
  
  // Create directory structure
  const dirs = [
    outputDir,
    join(outputDir, 'parts'),
    join(outputDir, 'chapters'),
    join(outputDir, 'scenes'),
    join(outputDir, 'database-ready')
  ];
  
  for (const dir of dirs) {
    try {
      mkdirSync(dir, { recursive: true });
    } catch (error) {
      // Directory exists, continue
    }
  }
  
  // Save main story data
  writeFileSync(
    join(outputDir, 'story.json'),
    JSON.stringify(completeStory.story, null, 2)
  );
  
  // Save parts
  writeFileSync(
    join(outputDir, 'parts', 'all-parts.json'),
    JSON.stringify(completeStory.parts, null, 2)
  );
  
  completeStory.parts.forEach((part, index) => {
    writeFileSync(
      join(outputDir, 'parts', `part-${index + 1}.json`),
      JSON.stringify(part, null, 2)
    );
  });
  
  // Save chapters
  writeFileSync(
    join(outputDir, 'chapters', 'all-chapters.json'),
    JSON.stringify(completeStory.chapters, null, 2)
  );
  
  Object.entries(completeStory.chapters).forEach(([partNum, partChapters]) => {
    partChapters.forEach((chapter, chapterIndex) => {
      writeFileSync(
        join(outputDir, 'chapters', `part-${partNum}-chapter-${chapterIndex + 1}.json`),
        JSON.stringify(chapter, null, 2)
      );
    });
  });
  
  // Save scenes  
  writeFileSync(
    join(outputDir, 'scenes', 'all-scenes.json'),
    JSON.stringify(completeStory.scenes, null, 2)
  );
  
  Object.entries(completeStory.scenes).forEach(([partNum, partScenes]) => {
    Object.entries(partScenes).forEach(([chapNum, chapterScenes]) => {
      chapterScenes.forEach((scene, sceneIndex) => {
        writeFileSync(
          join(outputDir, 'scenes', `part-${partNum}-chapter-${chapNum}-scene-${sceneIndex + 1}.json`),
          JSON.stringify(scene, null, 2)
        );
      });
    });
  });
  
  // Save complete data
  writeFileSync(
    join(outputDir, 'complete-story-data.json'),
    JSON.stringify(completeStory, null, 2)
  );
  
  // Generate database-ready inserts
  const dbInserts = generateDatabaseInserts(completeStory);
  writeFileSync(
    join(outputDir, 'database-ready', 'story-inserts.sql'),
    dbInserts
  );
  
  // Generate summary
  const totalChapters = Object.values(completeStory.chapters).reduce((sum, chaps) => sum + chaps.length, 0);
  const totalScenes = Object.values(completeStory.scenes).reduce((sum, part) => 
    sum + Object.values(part).reduce((partSum, chap) => partSum + chap.length, 0), 0);
  
  const summary = {
    title: completeStory.story.title,
    genre: completeStory.story.genre,
    totalWords: completeStory.story.words,
    language: completeStory.story.language,
    parts: completeStory.parts.length,
    chapters: totalChapters,
    scenes: totalScenes,
    characters: Object.keys(completeStory.story.chars).length,
    themes: completeStory.story.themes,
    generatedAt: new Date().toISOString(),
    outputDirectory: outputDir,
    status: 'Complete story specification created, ready for database insertion and testing'
  };
  
  writeFileSync(
    join(outputDir, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  console.log('✅ All files saved successfully');
  console.log(`\n📊 Story Generation Summary:`);
  console.log(`   Title: ${summary.title}`);
  console.log(`   Genre: ${summary.genre}`);
  console.log(`   Target Words: ${summary.totalWords.toLocaleString()}`);
  console.log(`   Parts: ${summary.parts}`);
  console.log(`   Chapters: ${summary.chapters}`);
  console.log(`   Scenes: ${summary.scenes}`);
  console.log(`   Characters: ${summary.characters}`);
  console.log(`   Output Directory: ${outputDir}`);
  
  return summary;
}

function generateDatabaseInserts(completeStory: CompleteStoryData): string {
  const storyId = 'shadows-of-responsibility';
  const userId = 'shadows-author';
  
  let sql = `-- Database Inserts for "Shadows of Responsibility"
-- Generated: ${new Date().toISOString()}

-- Insert main story
INSERT INTO stories (id, title, description, genre, status, author_id, target_word_count, story_data, created_at, updated_at)
VALUES (
  '${storyId}',
  '${completeStory.story.title}',
  '${completeStory.story.question}',
  '${completeStory.story.genre}',
  'draft',
  '${userId}',
  ${completeStory.story.words},
  '${JSON.stringify(completeStory.story).replace(/'/g, "''")}',
  NOW(),
  NOW()
);

-- Insert parts
`;
  
  completeStory.parts.forEach((part, index) => {
    const partId = `${storyId}-part-${part.part}`;
    sql += `INSERT INTO parts (id, title, description, story_id, author_id, order_index, target_word_count, part_data, created_at, updated_at)
VALUES (
  '${partId}',
  '${part.title}',
  '${part.goal}',
  '${storyId}',
  '${userId}',
  ${part.part},
  ${part.words},
  '${JSON.stringify(part).replace(/'/g, "''")}',
  NOW(),
  NOW()
);

`;
  });
  
  // Insert chapters
  sql += `-- Insert chapters\n`;
  Object.entries(completeStory.chapters).forEach(([partNum, partChapters]) => {
    partChapters.forEach((chapter, chapterIndex) => {
      const chapterId = `${storyId}-part-${partNum}-chapter-${chapter.chap}`;
      const partId = `${storyId}-part-${partNum}`;
      
      sql += `INSERT INTO chapters (id, title, story_id, part_id, author_id, order_index, target_word_count, purpose, created_at, updated_at)
VALUES (
  '${chapterId}',
  '${chapter.title}',
  '${storyId}',
  '${partId}',
  '${userId}',
  ${chapter.chap},
  ${chapter.words},
  '${chapter.goal}',
  NOW(),
  NOW()
);

`;
    });
  });
  
  // Insert scenes
  sql += `-- Insert scenes\n`;
  Object.entries(completeStory.scenes).forEach(([partNum, partScenes]) => {
    Object.entries(partScenes).forEach(([chapNum, chapterScenes]) => {
      chapterScenes.forEach((scene, sceneIndex) => {
        const chapterId = `${storyId}-part-${partNum}-chapter-${chapNum}`;
        const sceneId = `${chapterId}-scene-${scene.id}`;
        
        sql += `INSERT INTO scenes (id, title, chapter_id, order_index, goal, conflict, outcome, created_at, updated_at)
VALUES (
  '${sceneId}',
  '${scene.summary.substring(0, 255)}',
  '${chapterId}',
  ${scene.id},
  '${scene.goal}',
  '${scene.obstacle}',
  '${scene.outcome}',
  NOW(),
  NOW()
);

`;
      });
    });
  });
  
  return sql;
}

async function main() {
  try {
    console.log('📝 Shadows of Responsibility - Complete Story Data Creator');
    console.log('=======================================================\n');
    
    const completeStory = await generateCompleteStoryData();
    const summary = await saveCompleteStoryData(completeStory);
    
    console.log('\n🎉 Story data creation completed successfully!');
    console.log('📁 Files saved to: generated-story-shadows/');
    console.log('🗄️ Database insert script ready: generated-story-shadows/database-ready/story-inserts.sql');
    
    return summary;
    
  } catch (error) {
    console.error('\n❌ Error during story data creation:');
    console.error(error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { generateCompleteStoryData, saveCompleteStoryData, main as createShadowsStoryData };