"""Tests for text generation API endpoints."""

import asyncio
import httpx
import json
import os
from pathlib import Path
from typing import AsyncGenerator
from pathlib import Path

# Base URL for API (change if needed)
BASE_URL = "http://localhost:8000"

# Load API key from .auth/user.json
<<<<<<< Updated upstream
def load_api_key() -> str:
    """Load API key from auth file."""
    auth_file = Path(__file__).parent.parent / ".auth" / "user.json"
    if auth_file.exists():
        with open(auth_file) as f:
            auth_data = json.load(f)
            # Use develop manager API key
            return auth_data["develop"]["profiles"]["manager"]["apiKey"]
    raise FileNotFoundError("API key file not found. Please create .auth/user.json")

API_KEY = load_api_key()
AUTH_HEADERS = {"Authorization": f"Bearer {API_KEY}"}
=======
AUTH_FILE = Path(__file__).parent.parent / ".auth" / "user.json"
with open(AUTH_FILE) as f:
    auth_data = json.load(f)
    API_KEY = auth_data["develop"]["profiles"]["manager"]["apiKey"]

# Headers with authentication (using x-api-key header)
HEADERS = {"x-api-key": API_KEY}
>>>>>>> Stashed changes


async def test_health_endpoint():
    """Test the health check endpoint."""
    print("\n=== Testing Health Check Endpoint ===")
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
    print("✓ Health check passed")


async def test_list_text_models():
    """Test listing available text models."""
    print("\n=== Testing List Text Models ===")
    async with httpx.AsyncClient() as client:
<<<<<<< Updated upstream
        response = await client.get(f"{BASE_URL}/api/v1/text/models", headers=AUTH_HEADERS)
=======
        response = await client.get(f"{BASE_URL}/api/v1/text/models", headers=HEADERS)
>>>>>>> Stashed changes
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        assert response.status_code == 200
        assert "models" in response.json()
    print("✓ List models passed")


async def test_text_generation_basic():
    """Test basic text generation."""
    print("\n=== Testing Basic Text Generation ===")

    request_data = {
        "prompt": "Write a short paragraph about artificial intelligence:",
        "max_tokens": 100,
        "temperature": 0.7,
        "top_p": 0.9,
    }

    print(f"Request: {json.dumps(request_data, indent=2)}")

    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(
            f"{BASE_URL}/api/v1/text/generate",
            json=request_data,
<<<<<<< Updated upstream
            headers=AUTH_HEADERS,
=======
            headers=HEADERS,
>>>>>>> Stashed changes
        )

        print(f"\nStatus Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"\nGenerated Text:\n{result['text']}")
            print(f"\nModel: {result['model']}")
            print(f"Tokens Used: {result['tokens_used']}")
            print(f"Finish Reason: {result['finish_reason']}")

            assert "text" in result
            assert len(result["text"]) > 0
            assert "model" in result
            assert "tokens_used" in result
            print("\n✓ Text generation passed")
        else:
            print(f"Error: {response.text}")
            raise AssertionError(f"Generation failed with status {response.status_code}")


async def test_text_generation_with_stop_sequences():
    """Test text generation with stop sequences."""
    print("\n=== Testing Text Generation with Stop Sequences ===")

    request_data = {
        "prompt": "List three programming languages:\n1.",
        "max_tokens": 200,
        "temperature": 0.7,
        "stop_sequences": ["\n\n", "4."],
    }

    print(f"Request: {json.dumps(request_data, indent=2)}")

    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(
            f"{BASE_URL}/api/v1/text/generate",
            json=request_data,
<<<<<<< Updated upstream
            headers=AUTH_HEADERS,
=======
            headers=HEADERS,
>>>>>>> Stashed changes
        )

        print(f"\nStatus Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"\nGenerated Text:\n{result['text']}")
            print(f"\nFinish Reason: {result['finish_reason']}")
            assert "text" in result
            print("\n✓ Text generation with stop sequences passed")
        else:
            print(f"Error: {response.text}")


async def test_text_streaming():
    """Test streaming text generation."""
    print("\n=== Testing Streaming Text Generation ===")

    request_data = {
        "prompt": "Write a very short story about a robot:",
        "max_tokens": 150,
        "temperature": 0.8,
    }

    print(f"Request: {json.dumps(request_data, indent=2)}")

    async with httpx.AsyncClient(timeout=300.0) as client:
        async with client.stream(
            "POST",
            f"{BASE_URL}/api/v1/text/stream",
            json=request_data,
<<<<<<< Updated upstream
            headers=AUTH_HEADERS,
=======
            headers=HEADERS,
>>>>>>> Stashed changes
        ) as response:
            print(f"\nStatus Code: {response.status_code}")
            print("\nStreaming output:")
            print("-" * 80)

            if response.status_code == 200:
                full_text = ""
                chunk_count = 0

                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]  # Remove "data: " prefix
                        try:
                            chunk = json.loads(data_str)
                            chunk_count += 1

                            # Print only new text (delta)
                            if chunk["text"] != full_text:
                                new_text = chunk["text"][len(full_text):]
                                print(new_text, end="", flush=True)
                                full_text = chunk["text"]

                            if chunk.get("done"):
                                print(f"\n\n[Generation complete]")
                                print(f"Total chunks: {chunk_count}")
                                print(f"Tokens: {chunk['tokens_used']}")
                                print(f"Finish reason: {chunk['finish_reason']}")
                                break

                        except json.JSONDecodeError as e:
                            print(f"\nJSON decode error: {e}")
                            print(f"Raw line: {line}")

                print("-" * 80)
                assert len(full_text) > 0
                print("\n✓ Streaming text generation passed")
            else:
                error_text = await response.aread()
                print(f"Error: {error_text.decode()}")


async def test_text_generation_error_handling():
    """Test error handling for invalid requests."""
    print("\n=== Testing Error Handling ===")

    # Test with empty prompt
    request_data = {
        "prompt": "",
        "max_tokens": 100,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{BASE_URL}/api/v1/text/generate",
            json=request_data,
<<<<<<< Updated upstream
            headers=AUTH_HEADERS,
=======
            headers=HEADERS,
>>>>>>> Stashed changes
        )

        print(f"Empty prompt - Status Code: {response.status_code}")
        assert response.status_code in [400, 422]  # Bad request or validation error
        print("✓ Empty prompt validation passed")

        # Test with excessive prompt length
        request_data = {
            "prompt": "test " * 3000,  # Very long prompt
            "max_tokens": 100,
        }

        response = await client.post(
            f"{BASE_URL}/api/v1/text/generate",
            json=request_data,
<<<<<<< Updated upstream
            headers=AUTH_HEADERS,
=======
            headers=HEADERS,
>>>>>>> Stashed changes
        )

        print(f"Long prompt - Status Code: {response.status_code}")
        assert response.status_code == 400
        print("✓ Long prompt validation passed")


async def main():
    """Run all text generation tests."""
    print("=" * 80)
    print("FICTURES AI SERVER - TEXT GENERATION API TESTS")
    print("=" * 80)
    print(f"\nTesting server at: {BASE_URL}")
    print("\nNOTE: Make sure the AI server is running before executing these tests!")
    print("Start server with: cd apps/ai-server && python -m uvicorn src.main:app --reload")

    try:
        # Run tests in sequence
        await test_health_endpoint()
        await test_list_text_models()
        await test_text_generation_basic()
        await test_text_generation_with_stop_sequences()
        await test_text_streaming()
        await test_text_generation_error_handling()

        print("\n" + "=" * 80)
        print("ALL TEXT GENERATION TESTS PASSED! ✓")
        print("=" * 80)

    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    asyncio.run(main())
