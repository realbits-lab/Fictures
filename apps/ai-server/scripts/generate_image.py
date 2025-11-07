#!/usr/bin/env python3
"""
Generate an image using the ai-server API with writer@fictures.xyz API key.
"""

import json
import asyncio
import httpx
import base64
from pathlib import Path
from datetime import datetime


async def generate_image():
    """Generate an image using ai-server API."""

    # Read API key from .auth/user.json
    auth_file = Path(__file__).parent.parent / ".auth" / "user.json"

    if not auth_file.exists():
        print(f"❌ Authentication file not found: {auth_file}")
        return

    with open(auth_file) as f:
        user_data = json.load(f)

    # Get writer API key from develop profile
    api_key = user_data["develop"]["profiles"]["writer"]["apiKey"]
    email = user_data["develop"]["profiles"]["writer"]["email"]

    print("=" * 80)
    print("AI SERVER - IMAGE GENERATION")
    print("=" * 80)
    print(f"\n👤 Account: {email}")
    print(f"🔑 API Key: {api_key[:20]}...")

    # Image generation request
    request_data = {
        "prompt": "A serene Japanese garden with cherry blossoms and a koi pond, beautiful sunset lighting, highly detailed digital art",
        "negative_prompt": "blurry, low quality, distorted, ugly, deformed",
        "width": 1024,
        "height": 1024,
        "num_inference_steps": 4,
        "guidance_scale": 1.0,
        "seed": None  # Random seed
    }

    print(f"\n📝 Request:")
    print(f"   Prompt: {request_data['prompt']}")
    print(f"   Size: {request_data['width']}x{request_data['height']}")
    print(f"   Steps: {request_data['num_inference_steps']}")
    print(f"   Guidance Scale: {request_data['guidance_scale']}")

    print(f"\n🚀 Sending request to AI server at http://localhost:8000...")

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                "http://localhost:8000/api/v1/images/generate",
                json=request_data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                }
            )

            print(f"\n📥 Response Status: {response.status_code}")

            if response.status_code == 200:
                result = response.json()
                print(f"\n✅ Image generated successfully!")
                print(f"   Model: {result.get('model', 'N/A')}")
                print(f"   Size: {result.get('width', 'N/A')}x{result.get('height', 'N/A')}")
                print(f"   Seed: {result.get('seed', 'N/A')}")

                # Save image to test-output
                if 'image_url' in result:
                    output_dir = Path(__file__).parent.parent / "test-output"
                    output_dir.mkdir(exist_ok=True)

                    # Decode base64 image
                    image_data = result['image_url'].split(',')[1] if ',' in result['image_url'] else result['image_url']
                    image_bytes = base64.b64decode(image_data)

                    # Generate filename with timestamp
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    seed = result.get('seed', 'unknown')
                    filename = f"generated_{timestamp}_seed{seed}.png"
                    output_path = output_dir / filename

                    output_path.write_bytes(image_bytes)

                    print(f"\n💾 Image saved to: {output_path}")
                    print(f"   File size: {len(image_bytes):,} bytes")
                    print("\n" + "=" * 80)
                    print("✅ SUCCESS!")
                    print("=" * 80)
                else:
                    print("⚠️  No image data in response")

            elif response.status_code == 401:
                print(f"\n❌ Authentication failed!")
                print(f"   Response: {response.text}")
                print(f"\n💡 Make sure the API key in .auth/user.json is valid")

            elif response.status_code == 403:
                print(f"\n❌ Insufficient permissions!")
                print(f"   Response: {response.text}")

            else:
                print(f"\n❌ Request failed!")
                print(f"   Status: {response.status_code}")
                print(f"   Response: {response.text}")

    except httpx.ConnectError:
        print(f"\n❌ Connection failed!")
        print(f"   Could not connect to http://localhost:8000")
        print(f"\n💡 Make sure the AI server is running:")
        print(f"   cd apps/ai-server")
        print(f"   source venv/bin/activate")
        print(f"   python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(generate_image())
