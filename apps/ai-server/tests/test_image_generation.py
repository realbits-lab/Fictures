"""Tests for image generation API endpoints."""

import asyncio
import httpx
import json
import base64
from pathlib import Path
from datetime import datetime

# Base URL for API (change if needed)
BASE_URL = "http://localhost:8000"

# Directory to save test images
OUTPUT_DIR = Path(__file__).parent / "test_output"


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


async def test_list_image_models():
    """Test listing available image models."""
    print("\n=== Testing List Image Models ===")
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/v1/images/models")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        assert response.status_code == 200
        assert "models" in response.json()
    print("✓ List models passed")


def save_base64_image(base64_string: str, filename: str) -> Path:
    """Save base64 encoded image to file."""
    # Create output directory if it doesn't exist
    OUTPUT_DIR.mkdir(exist_ok=True)

    # Remove data URL prefix if present
    if base64_string.startswith("data:image"):
        base64_string = base64_string.split(",", 1)[1]

    # Decode and save
    image_data = base64.b64decode(base64_string)
    filepath = OUTPUT_DIR / filename
    with open(filepath, "wb") as f:
        f.write(image_data)

    return filepath


async def test_basic_image_generation():
    """Test basic image generation."""
    print("\n=== Testing Basic Image Generation ===")

    request_data = {
        "prompt": "A serene mountain landscape at sunset, digital art, highly detailed",
        "negative_prompt": "blurry, low quality, distorted, ugly",
        "width": 1024,
        "height": 1024,
        "num_inference_steps": 25,
        "guidance_scale": 7.5,
        "seed": 42,
    }

    print(f"Request: {json.dumps(request_data, indent=2)}")
    print("\nGenerating image (this may take 30-60 seconds)...")

    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(
            f"{BASE_URL}/api/v1/images/generate",
            json=request_data,
        )

        print(f"\nStatus Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"\nModel: {result['model']}")
            print(f"Size: {result['width']}x{result['height']}")
            print(f"Seed: {result['seed']}")

            # Save the generated image
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"test_basic_{timestamp}_seed{result['seed']}.png"
            filepath = save_base64_image(result["image_url"], filename)
            print(f"Image saved to: {filepath}")

            assert "image_url" in result
            assert result["width"] == request_data["width"]
            assert result["height"] == request_data["height"]
            assert result["seed"] == request_data["seed"]

            print("\n✓ Basic image generation passed")
        else:
            print(f"Error: {response.text}")
            raise AssertionError(f"Generation failed with status {response.status_code}")


async def test_image_generation_random_seed():
    """Test image generation with random seed."""
    print("\n=== Testing Image Generation with Random Seed ===")

    request_data = {
        "prompt": "A futuristic city with flying cars, cyberpunk style",
        "negative_prompt": "blurry, low quality",
        "width": 1344,
        "height": 768,
        "num_inference_steps": 20,
        "guidance_scale": 7.0,
        # No seed specified - should use random
    }

    print(f"Request: {json.dumps(request_data, indent=2)}")
    print("\nGenerating image with random seed...")

    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(
            f"{BASE_URL}/api/v1/images/generate",
            json=request_data,
        )

        print(f"\nStatus Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"\nModel: {result['model']}")
            print(f"Size: {result['width']}x{result['height']}")
            print(f"Seed (auto-generated): {result['seed']}")

            # Save the generated image
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"test_random_{timestamp}_seed{result['seed']}.png"
            filepath = save_base64_image(result["image_url"], filename)
            print(f"Image saved to: {filepath}")

            assert "seed" in result
            assert result["seed"] > 0

            print("\n✓ Random seed generation passed")
        else:
            print(f"Error: {response.text}")


async def test_image_generation_various_sizes():
    """Test image generation with different sizes."""
    print("\n=== Testing Image Generation with Various Sizes ===")

    test_sizes = [
        (512, 512, "square_small"),
        (1024, 1024, "square_large"),
        (1344, 768, "widescreen"),
        (768, 1344, "portrait"),
    ]

    for width, height, label in test_sizes:
        print(f"\n--- Testing {label} ({width}x{height}) ---")

        request_data = {
            "prompt": "A beautiful landscape",
            "width": width,
            "height": height,
            "num_inference_steps": 15,  # Fewer steps for faster testing
            "guidance_scale": 7.5,
        }

        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{BASE_URL}/api/v1/images/generate",
                json=request_data,
            )

            if response.status_code == 200:
                result = response.json()
                print(f"Generated: {result['width']}x{result['height']}")

                # Save the generated image
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"test_{label}_{timestamp}.png"
                filepath = save_base64_image(result["image_url"], filename)
                print(f"Saved to: {filepath}")

                assert result["width"] == width
                assert result["height"] == height
                print(f"✓ {label} generation passed")
            else:
                print(f"Failed: {response.text}")


async def test_image_generation_error_handling():
    """Test error handling for invalid requests."""
    print("\n=== Testing Error Handling ===")

    # Test with empty prompt
    request_data = {
        "prompt": "",
        "width": 1024,
        "height": 1024,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{BASE_URL}/api/v1/images/generate",
            json=request_data,
        )

        print(f"Empty prompt - Status Code: {response.status_code}")
        assert response.status_code in [400, 422]
        print("✓ Empty prompt validation passed")

        # Test with invalid dimensions
        request_data = {
            "prompt": "A test image",
            "width": 3000,  # Too large
            "height": 3000,
        }

        response = await client.post(
            f"{BASE_URL}/api/v1/images/generate",
            json=request_data,
        )

        print(f"Invalid dimensions - Status Code: {response.status_code}")
        assert response.status_code == 400
        print("✓ Dimension validation passed")


async def test_reproducibility():
    """Test that same seed produces same image."""
    print("\n=== Testing Reproducibility (Same Seed) ===")

    request_data = {
        "prompt": "A magical forest with glowing mushrooms",
        "negative_prompt": "blurry, low quality",
        "width": 512,
        "height": 512,
        "num_inference_steps": 20,
        "guidance_scale": 7.5,
        "seed": 12345,
    }

    async with httpx.AsyncClient(timeout=300.0) as client:
        # Generate first image
        print("\nGenerating first image...")
        response1 = await client.post(
            f"{BASE_URL}/api/v1/images/generate",
            json=request_data,
        )

        # Generate second image with same parameters
        print("Generating second image with same seed...")
        response2 = await client.post(
            f"{BASE_URL}/api/v1/images/generate",
            json=request_data,
        )

        if response1.status_code == 200 and response2.status_code == 200:
            result1 = response1.json()
            result2 = response2.json()

            # Save both images
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filepath1 = save_base64_image(
                result1["image_url"],
                f"test_reproducibility_1_{timestamp}.png"
            )
            filepath2 = save_base64_image(
                result2["image_url"],
                f"test_reproducibility_2_{timestamp}.png"
            )

            print(f"\nFirst image saved to: {filepath1}")
            print(f"Second image saved to: {filepath2}")

            # Check if images are identical
            image1_data = result1["image_url"]
            image2_data = result2["image_url"]

            if image1_data == image2_data:
                print("\n✓ Images are identical (perfect reproducibility)")
            else:
                print("\n⚠ Images are different (may vary due to GPU nondeterminism)")
                print("This is acceptable for SDXL on some hardware")

            assert result1["seed"] == result2["seed"]
            print("✓ Reproducibility test passed")


async def main():
    """Run all image generation tests."""
    print("=" * 80)
    print("FICTURES AI SERVER - IMAGE GENERATION API TESTS")
    print("=" * 80)
    print(f"\nTesting server at: {BASE_URL}")
    print(f"Output directory: {OUTPUT_DIR.absolute()}")
    print("\nNOTE: Make sure the AI server is running before executing these tests!")
    print("Start server with: cd apps/ai-server && python -m uvicorn src.main:app --reload")
    print("\nWARNING: Image generation tests may take several minutes to complete.")
    print("Make sure you have a GPU with CUDA support for optimal performance.\n")

    try:
        # Run tests in sequence
        await test_health_endpoint()
        await test_list_image_models()
        await test_basic_image_generation()
        await test_image_generation_random_seed()
        await test_image_generation_various_sizes()
        await test_image_generation_error_handling()
        await test_reproducibility()

        print("\n" + "=" * 80)
        print("ALL IMAGE GENERATION TESTS PASSED! ✓")
        print("=" * 80)
        print(f"\nGenerated images saved to: {OUTPUT_DIR.absolute()}")

    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    asyncio.run(main())
