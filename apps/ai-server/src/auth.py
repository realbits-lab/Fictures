"""
API Key Authentication for AI Server

Validates API keys against the web application's PostgreSQL database.
Simple and secure database-only authentication.
"""

import logging
from typing import Optional, List
from datetime import datetime
from fastapi import Header, HTTPException, Depends
import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt

from src.config import settings

logger = logging.getLogger(__name__)


class AuthResult:
    """Authentication result containing user info and scopes."""

    def __init__(self, user_id: str, email: str, scopes: List[str]):
        self.user_id = user_id
        self.email = email
        self.scopes = scopes

    def has_scope(self, required_scope: str) -> bool:
        """Check if user has required scope."""
        # Check for exact match
        if required_scope in self.scopes:
            return True

        # admin:all grants all permissions
        if "admin:all" in self.scopes:
            return True

        # stories:write implies stories:read
        if required_scope == "stories:read" and "stories:write" in self.scopes:
            return True

        return False


def get_db_connection():
    """Get database connection."""
    if not settings.database_url:
        raise HTTPException(
            status_code=500,
            detail="Database not configured for authentication"
        )

    try:
        conn = psycopg2.connect(settings.database_url)
        return conn
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )


async def verify_api_key(api_key: str) -> Optional[AuthResult]:
    """
    Verify API key against database.

    Args:
        api_key: The API key to verify

    Returns:
        AuthResult if valid, None otherwise
    """
    if not api_key or len(api_key) < 16:
        return None

    # Extract prefix (first 16 characters)
    key_prefix = api_key[:16]

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Find API keys by prefix
        cursor.execute(
            """
            SELECT id, user_id, key_hash, scopes, is_active, expires_at
            FROM api_keys
            WHERE key_prefix = %s AND is_active = true
            LIMIT 10
            """,
            (key_prefix,)
        )

        api_key_records = cursor.fetchall()

        if not api_key_records:
            return None

        # Verify full key hash
        matched_key = None
        for key_record in api_key_records:
            # Verify bcrypt hash
            if bcrypt.checkpw(api_key.encode('utf-8'), key_record['key_hash'].encode('utf-8')):
                matched_key = key_record
                break

        if not matched_key:
            return None

        # Check expiration
        if matched_key['expires_at']:
            expires_at = matched_key['expires_at']
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at < datetime.now(expires_at.tzinfo):
                logger.warning(f"API key expired: {matched_key['id']}")
                return None

        # Get user information
        cursor.execute(
            """
            SELECT id, email, name, role
            FROM users
            WHERE id = %s
            LIMIT 1
            """,
            (matched_key['user_id'],)
        )

        user = cursor.fetchone()

        if not user:
            logger.error(f"User not found for API key: {matched_key['user_id']}")
            return None

        # Update last used timestamp (async, don't wait)
        try:
            cursor.execute(
                """
                UPDATE api_keys
                SET last_used_at = %s
                WHERE id = %s
                """,
                (datetime.now(), matched_key['id'])
            )
            conn.commit()
        except Exception as e:
            logger.warning(f"Failed to update last_used_at: {e}")
            # Non-critical, continue

        # Return auth result
        scopes = matched_key['scopes'] if matched_key['scopes'] else []
        logger.info(f"✅ Authentication successful: {user['email']}")
        return AuthResult(
            user_id=user['id'],
            email=user['email'],
            scopes=scopes
        )

    except Exception as e:
        logger.error(f"API key verification failed: {e}")
        return None

    finally:
        if conn:
            conn.close()


async def get_api_key_from_header(
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None),
) -> Optional[str]:
    """
    Extract API key from headers.

    Supports x-api-key header format:
    - x-api-key: YOUR_API_KEY
    """
    # Use x-api-key header
    if x_api_key:
        return x_api_key

    return None


async def require_api_key(
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None),
) -> AuthResult:
    """
    FastAPI dependency that requires valid API key.

    Usage:
        @router.post("/endpoint")
        async def endpoint(auth: AuthResult = Depends(require_api_key)):
            user_id = auth.user_id
            ...
    """
    # Extract API key from headers
    api_key = await get_api_key_from_header(authorization, x_api_key)

    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="API key required. Provide via 'x-api-key: YOUR_API_KEY' header"
        )

    # Verify API key
    auth_result = await verify_api_key(api_key)

    if not auth_result:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired API key"
        )

    return auth_result


async def require_scope(required_scope: str):
    """
    Factory function to create a dependency that requires specific scope.

    Usage:
        @router.post("/endpoint")
        async def endpoint(auth: AuthResult = Depends(require_scope("stories:write"))):
            ...
    """
    async def scope_checker(auth: AuthResult = Depends(require_api_key)) -> AuthResult:
        if not auth.has_scope(required_scope):
            raise HTTPException(
                status_code=403,
                detail=f"Insufficient permissions. Required scope: {required_scope}"
            )
        return auth

    return scope_checker
