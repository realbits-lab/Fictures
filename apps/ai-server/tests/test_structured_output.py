"""Tests for structured output API endpoint using vLLM guided decoding."""

import asyncio
import httpx
import json
from typing import AsyncGenerator
from pathlib import Path

# Base URL for API
BASE_URL = "http://localhost:8000"

# Load API key from .auth/user.json
AUTH_FILE = Path(__file__).parent.parent / ".auth" / "user.json"
with open(AUTH_FILE) as f:
    auth_data = json.load(f)
    API_KEY = auth_data["develop"]["profiles"]["manager"]["apiKey"]

# Headers with authentication (using x-api-key header)
HEADERS = {"x-api-key": API_KEY}


async def test_simple_choice():
    """Test 1: Simple choice constraint (sentiment classification)."""
    print("\n=== Test 1: Simple Choice Constraint ===")

    request_data = {
        "prompt": "Classify the sentiment of this text: 'vLLM is absolutely amazing for structured output!'",
        "guided_decoding": {
            "type": "choice",
            "choices": ["positive", "negative", "neutral"]
        },
        "max_tokens": 10,
        "temperature": 0.3,
    }

    print(f"Request: {json.dumps(request_data, indent=2)}")

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{BASE_URL}/api/v1/text/structured",
            json=request_data,
            headers=HEADERS,
        )

        print(f"\nStatus Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"\nGenerated Output: {result['output']}")
            print(f"Model: {result['model']}")
            print(f"Tokens Used: {result['tokens_used']}")
            print(f"Is Valid: {result['is_valid']}")
            print(f"Finish Reason: {result['finish_reason']}")

            # Verify output is one of the choices
            assert result['output'] in request_data['guided_decoding']['choices']
            print("\n✓ Simple choice constraint test passed")
        else:
            print(f"Error: {response.text}")
            raise AssertionError(f"Request failed with status {response.status_code}")


async def test_json_schema_simple():
    """Test 2: Simple JSON schema (sentiment analysis with reasoning)."""
    print("\n=== Test 2: Simple JSON Schema (Sentiment Analysis) ===")

    # Define JSON schema
    schema = {
        "type": "object",
        "properties": {
            "text": {"type": "string"},
            "sentiment": {"type": "string", "enum": ["positive", "negative", "neutral"]},
            "confidence": {"type": "number", "minimum": 0.0, "maximum": 1.0},
            "reason": {"type": "string"}
        },
        "required": ["text", "sentiment", "confidence", "reason"]
    }

    request_data = {
        "prompt": """Analyze the sentiment of the following text and return a JSON response:

Text to analyze: "I'm thoroughly disappointed with the service. The staff was rude and the product quality was subpar. Would not recommend."

Return valid JSON with fields: text, sentiment (positive/negative/neutral), confidence (0.0-1.0), and reason.""",
        "guided_decoding": {
            "type": "json",
            "schema": schema
        },
        "max_tokens": 300,
        "temperature": 0.5,
    }

    print(f"Request schema: {json.dumps(schema, indent=2)}")
    print(f"Prompt: {request_data['prompt'][:100]}...")

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{BASE_URL}/api/v1/text/structured",
            json=request_data,
            headers=HEADERS,
        )

        print(f"\nStatus Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"\nGenerated JSON:\n{result['output']}")
            print(f"\nParsed Output:\n{json.dumps(result['parsed_output'], indent=2)}")
            print(f"\nModel: {result['model']}")
            print(f"Tokens Used: {result['tokens_used']}")
            print(f"Is Valid JSON: {result['is_valid']}")
            print(f"Finish Reason: {result['finish_reason']}")

            # Verify JSON is valid
            assert result['is_valid'] is True
            assert result['parsed_output'] is not None
            assert 'sentiment' in result['parsed_output']
            print("\n✓ Simple JSON schema test passed")
        else:
            print(f"Error: {response.text}")
            raise AssertionError(f"Request failed with status {response.status_code}")


async def test_json_schema_complex():
    """Test 3: Complex nested JSON schema (character profile)."""
    print("\n=== Test 3: Complex Nested JSON Schema (Character Profile) ===")

    # Define complex JSON schema
    schema = {
        "type": "object",
        "properties": {
            "name": {"type": "string"},
            "age": {"type": "integer", "minimum": 0, "maximum": 150},
            "occupation": {"type": "string"},
            "personality": {
                "type": "object",
                "properties": {
                    "trait1": {"type": "string"},
                    "trait2": {"type": "string"},
                    "trait3": {"type": "string"}
                },
                "required": ["trait1", "trait2", "trait3"]
            },
            "backstory": {"type": "string"},
            "motivation": {"type": "string"}
        },
        "required": ["name", "age", "occupation", "personality", "backstory", "motivation"]
    }

    request_data = {
        "prompt": """Generate a character profile for a morally complex wizard in a fantasy story. Return valid JSON with these fields:
- name: full character name
- age: integer
- occupation: character's role
- personality: object with trait1, trait2, trait3 (string descriptions)
- backstory: 2-3 sentence backstory
- motivation: primary motivation

Create a unique and interesting character:""",
        "guided_decoding": {
            "type": "json",
            "schema": schema
        },
        "max_tokens": 500,
        "temperature": 0.7,
    }

    print(f"Request schema properties: {list(schema['properties'].keys())}")

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{BASE_URL}/api/v1/text/structured",
            json=request_data,
            headers=HEADERS,
        )

        print(f"\nStatus Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"\nGenerated JSON:\n{result['output']}")

            if result['parsed_output']:
                print(f"\nParsed Output:\n{json.dumps(result['parsed_output'], indent=2)}")
                print(f"\n✓ Character Details:")
                print(f"  Name: {result['parsed_output'].get('name')}")
                print(f"  Age: {result['parsed_output'].get('age')}")
                print(f"  Occupation: {result['parsed_output'].get('occupation')}")
                print(f"  Personality traits: {len(result['parsed_output'].get('personality', {}))}")

            print(f"\nModel: {result['model']}")
            print(f"Tokens Used: {result['tokens_used']}")
            print(f"Is Valid JSON: {result['is_valid']}")
            print(f"Finish Reason: {result['finish_reason']}")

            # Verify JSON is valid and has required fields
            assert result['is_valid'] is True
            assert result['parsed_output'] is not None
            assert 'name' in result['parsed_output']
            assert 'personality' in result['parsed_output']
            print("\n✓ Complex JSON schema test passed")
        else:
            print(f"Error: {response.text}")
            raise AssertionError(f"Request failed with status {response.status_code}")


async def test_regex_pattern():
    """Test 4: Regex pattern constraint (phone number format)."""
    print("\n=== Test 4: Regex Pattern Constraint (Phone Number) ===")

    request_data = {
        "prompt": "Generate a valid US phone number in the format XXX-XXX-XXXX:",
        "guided_decoding": {
            "type": "regex",
            "pattern": r"\d{3}-\d{3}-\d{4}"
        },
        "max_tokens": 20,
        "temperature": 0.5,
    }

    print(f"Request pattern: {request_data['guided_decoding']['pattern']}")

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{BASE_URL}/api/v1/text/structured",
            json=request_data,
            headers=HEADERS,
        )

        print(f"\nStatus Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"\nGenerated Output: {result['output']}")
            print(f"Model: {result['model']}")
            print(f"Tokens Used: {result['tokens_used']}")
            print(f"Finish Reason: {result['finish_reason']}")

            # Verify output matches regex
            import re
            assert re.match(r"\d{3}-\d{3}-\d{4}", result['output'])
            print("\n✓ Regex pattern constraint test passed")
        else:
            print(f"Error: {response.text}")
            raise AssertionError(f"Request failed with status {response.status_code}")


async def main():
    """Run all structured output tests."""
    print("=" * 80)
    print("FICTURES AI SERVER - STRUCTURED OUTPUT API TESTS")
    print("=" * 80)
    print(f"\nTesting server at: {BASE_URL}")
    print("Model: Qwen/Qwen3-14B-AWQ with vLLM guided decoding")
    print("\nNOTE: Make sure the AI server is running before executing these tests!")

    try:
        # Run tests in sequence
        await test_simple_choice()
        await test_json_schema_simple()
        await test_json_schema_complex()
        await test_regex_pattern()

        print("\n" + "=" * 80)
        print("ALL STRUCTURED OUTPUT TESTS PASSED! ✓")
        print("=" * 80)

    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    asyncio.run(main())
