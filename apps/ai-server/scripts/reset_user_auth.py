#!/usr/bin/env python3
"""
Reset User Authentication Script

This script resets and initializes user authentication data in the database
using the API keys from .auth/user.json file.

Usage:
    python scripts/reset_user_auth.py
"""

import sys
import os
import json
import bcrypt
import psycopg2
import secrets
from pathlib import Path
from datetime import datetime, timedelta

# Add parent directory to path to import from src
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.config import settings


def load_auth_config():
    """Load authentication configuration from .auth/user.json"""
    auth_file = Path(__file__).parent.parent / ".auth" / "user.json"
    if not auth_file.exists():
        raise FileNotFoundError(f"Auth config file not found: {auth_file}")

    with open(auth_file) as f:
        return json.load(f)


def hash_api_key(api_key: str) -> str:
    """Hash API key using bcrypt"""
    return bcrypt.hashpw(api_key.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def reset_users_and_keys(environment: str = "develop"):
    """Reset users and API keys in the database"""

    print(f"\n{'='*80}")
    print(f"RESET USER AUTHENTICATION - {environment.upper()} ENVIRONMENT")
    print(f"{'='*80}\n")

    # Load auth configuration
    print("📖 Loading authentication configuration...")
    auth_config = load_auth_config()

    if environment not in auth_config:
        print(f"❌ Environment '{environment}' not found in auth config")
        return False

    profiles = auth_config[environment]["profiles"]
    print(f"✓ Found {len(profiles)} user profiles\n")

    # Connect to database
    if not settings.database_url:
        print("❌ DATABASE_URL not configured in environment")
        return False

    print(f"🔌 Connecting to database...")
    print(f"   Database: {settings.database_url.split('@')[1].split('/')[1] if '@' in settings.database_url else 'unknown'}")

    try:
        conn = psycopg2.connect(settings.database_url)
        cursor = conn.cursor()
        print("✓ Database connection established\n")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

    try:
        # Get or create users
        user_ids = {}

        print("👥 Processing users...")
        print("-" * 80)

        for role, profile in profiles.items():
            email = profile["email"]
            password = profile["password"]

            # Check if user exists
            cursor.execute(
                "SELECT id FROM users WHERE email = %s",
                (email,)
            )
            result = cursor.fetchone()

            if result:
                user_id = result[0]
                print(f"✓ User exists: {email} (role: {role})")
                user_ids[role] = user_id
            else:
                # Create new user
                cursor.execute(
                    """
                    INSERT INTO users (email, name, role, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (email, role.capitalize(), role, datetime.now(), datetime.now())
                )
                user_id = cursor.fetchone()[0]
                print(f"+ Created user: {email} (role: {role})")
                user_ids[role] = user_id

        conn.commit()
        print("\n" + "✓" * 40)
        print(f"User processing complete: {len(user_ids)} users ready\n")

        # Delete existing API keys for these users
        print("🗑️  Cleaning up old API keys...")
        print("-" * 80)

        for role, user_id in user_ids.items():
            cursor.execute(
                "DELETE FROM api_keys WHERE user_id = %s",
                (user_id,)
            )
            deleted_count = cursor.rowcount
            if deleted_count > 0:
                print(f"  Deleted {deleted_count} old key(s) for {profiles[role]['email']}")

        conn.commit()
        print("✓ Old API keys removed\n")

        # Create new API keys
        print("🔑 Creating new API keys...")
        print("-" * 80)

        for role, profile in profiles.items():
            api_key = profile["apiKey"]
            user_id = user_ids[role]
            email = profile["email"]

            # Extract key prefix (first 16 characters)
            key_prefix = api_key[:16]

            # Hash the full API key
            print(f"  Hashing API key for {email}...")
            key_hash = hash_api_key(api_key)

            # Determine scopes based on role (aligned with web app)
            if role == "manager":
                scopes = [
                    # Story management (web + ai-server)
                    "stories:read", "stories:write", "stories:delete", "stories:publish",
                    # Image management (ai-server)
                    "images:read", "images:write",
                    # Chapter management (web)
                    "chapters:read", "chapters:write", "chapters:delete",
                    # Analytics (web)
                    "analytics:read",
                    # AI features (web)
                    "ai:use",
                    # Community (web)
                    "community:read", "community:write",
                    # Settings (web)
                    "settings:read", "settings:write",
                    # Admin (web + ai-server)
                    "admin:all"
                ]
            elif role == "writer":
                scopes = [
                    # Story management (web + ai-server)
                    "stories:read", "stories:write",
                    # Image management (ai-server)
                    "images:read", "images:write",
                    # Chapter management (web)
                    "chapters:read", "chapters:write",
                    # Analytics (web)
                    "analytics:read",
                    # AI features (web)
                    "ai:use",
                    # Community (web)
                    "community:read", "community:write",
                    # Settings (web)
                    "settings:read"
                ]
            else:  # reader
                scopes = [
                    # Story management (web + ai-server)
                    "stories:read",
                    # Image management (ai-server)
                    "images:read",
                    # Chapter management (web)
                    "chapters:read",
                    # Analytics (web)
                    "analytics:read",
                    # Community (web)
                    "community:read",
                    # Settings (web)
                    "settings:read"
                ]

            # Set expiration (1 year from now)
            expires_at = datetime.now() + timedelta(days=365)

            # Generate unique API key ID
            api_key_id = f"key_{secrets.token_urlsafe(16)}"

            # Insert API key (convert scopes to JSON string)
            cursor.execute(
                """
                INSERT INTO api_keys (
                    id,
                    user_id,
                    name,
                    key_prefix,
                    key_hash,
                    scopes,
                    is_active,
                    expires_at,
                    created_at,
                    updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s::json, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    api_key_id,
                    user_id,
                    f"{role.capitalize()} API Key",
                    key_prefix,
                    key_hash,
                    json.dumps(scopes),  # Convert to JSON string
                    True,
                    expires_at,
                    datetime.now(),
                    datetime.now()
                )
            )

            api_key_id = cursor.fetchone()[0]

            print(f"✓ Created API key for {email}")
            print(f"  - Key ID: {api_key_id}")
            print(f"  - Prefix: {key_prefix}")
            print(f"  - Scopes: {', '.join(scopes)}")
            print(f"  - Expires: {expires_at.strftime('%Y-%m-%d')}")
            print()

        conn.commit()

        # Summary
        print("=" * 80)
        print("✅ AUTHENTICATION RESET COMPLETE")
        print("=" * 80)
        print(f"\nSummary:")
        print(f"  • Environment: {environment}")
        print(f"  • Users processed: {len(user_ids)}")
        print(f"  • API keys created: {len(profiles)}")
        print(f"  • Database: Connected and updated")
        print(f"\nAPI Keys:")
        for role, profile in profiles.items():
            print(f"  • {role.capitalize()}: {profile['apiKey']}")
        print("\n" + "=" * 80)
        print("🚀 Ready to test! Run: python tests/test_text_generation.py")
        print("=" * 80 + "\n")

        return True

    except Exception as e:
        print(f"\n❌ Error during reset: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
        return False

    finally:
        cursor.close()
        conn.close()
        print("🔌 Database connection closed\n")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Reset user authentication in database")
    parser.add_argument(
        "--env",
        choices=["main", "develop"],
        default="develop",
        help="Environment to reset (default: develop)"
    )

    args = parser.parse_args()

    success = reset_users_and_keys(environment=args.env)
    sys.exit(0 if success else 1)
