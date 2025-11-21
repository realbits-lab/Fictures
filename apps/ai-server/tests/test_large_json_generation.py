#!/usr/bin/env python3
"""
Test script for large JSON generation output.

This script tests the AI server's ability to generate large JSON structures,
similar to what's required for story generation.

Run from ai-server directory:
    cd apps/ai-server
    source venv/bin/activate
    python tests/test_large_json_generation.py
"""

import asyncio
import json
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from pydantic import BaseModel, Field
from src.services.text_service import text_service


# Define a complex schema similar to story generation
class Character(BaseModel):
    """Character model for testing."""

    name: str = Field(description="Character name")
    age: int = Field(description="Character age")
    role: str = Field(description="Character role in the story")
    personality: str = Field(description="Character personality traits")
    backstory: str = Field(description="Character backstory (can be very long)")
    goals: str = Field(description="Character goals and motivations")
    internal_flaw: str = Field(description="Character's internal flaw or weakness")


class Setting(BaseModel):
    """Setting model for testing."""

    name: str = Field(description="Setting name")
    description: str = Field(description="Detailed setting description")
    atmosphere: str = Field(description="Atmosphere and mood of the setting")
    significance: str = Field(description="Why this setting is important")


class StoryStructure(BaseModel):
    """Complex story structure for testing large JSON generation."""

    title: str = Field(description="Story title")
    genre: str = Field(description="Story genre")
    summary: str = Field(
        description="Detailed story summary (should be 500-1000 words)"
    )
    tone: str = Field(description="Story tone")
    moral_framework: str = Field(
        description="Moral framework and themes (detailed explanation)"
    )
    characters: list[Character] = Field(
        description="List of main characters (3-5 characters)"
    )
    settings: list[Setting] = Field(
        description="List of key settings (2-3 settings)"
    )
    plot_outline: str = Field(
        description="Detailed plot outline with major story beats (500-1000 words)"
    )
    themes: list[str] = Field(description="Major themes in the story")
    target_audience: str = Field(description="Target audience description")


async def test_large_json_generation():
    """Test generating a large JSON structure."""
    print("=" * 80)
    print("Testing Large JSON Generation")
    print("=" * 80)

    # 1. Create a complex prompt
    prompt = """Create a detailed epic fantasy story structure with the following:

Title: An epic fantasy adventure
Genre: High Fantasy
Summary: Write a detailed 800-word summary of an epic quest story
Characters: Create 4 detailed main characters with full backstories
Settings: Create 3 detailed fantasy settings
Plot: Create a detailed 800-word plot outline

Make the descriptions rich, detailed, and comprehensive. Include complex character
backstories, detailed world-building, and intricate plot points."""

    print(f"\nPrompt: {prompt[:100]}...")
    print(f"\nExpected response size: ~5000-10000 characters")
    print(f"Schema: StoryStructure with nested Character and Setting models")

    try:
        # 2. Generate structured output
        print("\n" + "-" * 80)
        print("Generating structured output...")
        print("-" * 80)

        # Convert Pydantic model to JSON schema
        json_schema = StoryStructure.model_json_schema()

        result = await text_service.generate_structured(
            prompt=prompt,
            guided_type="json",
            json_schema=json_schema,
            max_tokens=8192,
            temperature=0.7,
        )

        # 3. Analyze the result
        print("\n✅ Generation successful!")
        print(f"\nResult type: {type(result)}")

        # 4. Extract generated text and parse as JSON
        generated_text = result.get("generated_text", "")
        result_size = len(generated_text)

        print(f"\n📊 Result Analysis:")
        print(f"   JSON size: {result_size:,} characters")
        print(f"   JSON size: {result_size / 1024:.2f} KB")

        # 5. Validate JSON can be parsed
        try:
            parsed = json.loads(generated_text)
            print(f"   ✅ JSON is valid and parseable")
            print(f"   Characters count: {len(parsed.get('characters', []))}")
            print(f"   Settings count: {len(parsed.get('settings', []))}")
            print(f"   Themes count: {len(parsed.get('themes', []))}")
        except json.JSONDecodeError as e:
            print(f"   ❌ JSON parsing error: {e}")
            print(f"   Error position: {e.pos}")
            # Show context around error
            if e.pos:
                start = max(0, e.pos - 100)
                end = min(len(generated_text), e.pos + 100)
                context = generated_text[start:end]
                print(f"   Context: ...{context}...")
            return False

        # 6. Save to file for inspection
        output_file = Path(__file__).parent / "test_output_large_json.json"
        output_file.write_text(generated_text)
        print(f"\n💾 Output saved to: {output_file}")

        # 7. Show sample of generated content
        print(f"\n📄 Sample Content:")
        print(f"   Title: {parsed.get('title', 'N/A')}")
        print(f"   Genre: {parsed.get('genre', 'N/A')}")
        print(f"   Summary length: {len(parsed.get('summary', ''))} chars")
        print(f"   Plot outline length: {len(parsed.get('plot_outline', ''))} chars")

        if parsed.get('characters'):
            print(f"\n   First character:")
            char = parsed['characters'][0]
            print(f"      Name: {char.get('name', 'N/A')}")
            print(f"      Role: {char.get('role', 'N/A')}")
            print(f"      Backstory length: {len(char.get('backstory', ''))} chars")

        # 8. Check for potential issues
        print(f"\n🔍 Checking for potential issues:")

        # Check for special characters that might break JSON
        special_chars = ["\n", "\r", "\t", '"', "\\"]
        found_issues = []

        for char in special_chars:
            count = generated_text.count(char)
            if count > 0:
                # Check if they're properly escaped
                if char == '"':
                    # Count unescaped quotes (not preceded by \)
                    unescaped = generated_text.count(f'{char}') - generated_text.count(
                        f'\\{char}'
                    )
                    if unescaped > 100:  # Rough estimate of reasonable quote count
                        found_issues.append(
                            f"Possibly unescaped quotes: {unescaped}"
                        )

        if found_issues:
            print(f"   ⚠️  Potential issues found:")
            for issue in found_issues:
                print(f"      - {issue}")
        else:
            print(f"   ✅ No obvious issues found")

        return True

    except Exception as e:
        print(f"\n❌ Generation failed: {e}")
        print(f"   Error type: {type(e).__name__}")
        import traceback

        traceback.print_exc()
        return False


async def test_incremental_sizes():
    """Test generating JSON with increasing sizes."""
    print("\n" + "=" * 80)
    print("Testing Incremental JSON Sizes")
    print("=" * 80)

    sizes = [
        (500, "Small - 500 chars"),
        (2000, "Medium - 2000 chars"),
        (5000, "Large - 5000 chars"),
        (10000, "Very Large - 10000 chars"),
    ]

    results = []

    for target_size, label in sizes:
        print(f"\n{label}:")
        print("-" * 40)

        prompt = f"""Create a fantasy story summary that is approximately {target_size} characters long.
Make it detailed and engaging, with rich descriptions."""

        try:
            # Convert Pydantic model to JSON schema
            json_schema = StoryStructure.model_json_schema()

            result = await text_service.generate_structured(
                prompt=prompt,
                guided_type="json",
                json_schema=json_schema,
                max_tokens=8192,
                temperature=0.7,
            )

            generated_text = result.get("generated_text", "")
            actual_size = len(generated_text)

            # Validate JSON
            try:
                json.loads(generated_text)
                status = "✅ Valid"
            except json.JSONDecodeError as e:
                status = f"❌ Invalid (error at pos {e.pos})"

            print(f"   Target: {target_size:,} chars")
            print(f"   Actual: {actual_size:,} chars")
            print(f"   Status: {status}")

            results.append(
                {
                    "target": target_size,
                    "actual": actual_size,
                    "valid": status.startswith("✅"),
                }
            )

        except Exception as e:
            print(f"   ❌ Failed: {e}")
            results.append({"target": target_size, "actual": 0, "valid": False})

    # Summary
    print("\n" + "=" * 80)
    print("Summary:")
    print("=" * 80)
    for r in results:
        status_icon = "✅" if r["valid"] else "❌"
        print(
            f"{status_icon} {r['target']:>6,} chars → {r['actual']:>6,} chars - {'VALID' if r['valid'] else 'INVALID'}"
        )


async def main():
    """Main test execution."""
    print("\n" + "=" * 80)
    print("AI Server Large JSON Generation Test Suite")
    print("=" * 80)

    # Test 1: Large complex JSON generation
    success = await test_large_json_generation()

    # Test 2: Incremental size testing
    await test_incremental_sizes()

    # Final result
    print("\n" + "=" * 80)
    if success:
        print("✅ All tests completed successfully")
    else:
        print("❌ Some tests failed - see details above")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(main())
