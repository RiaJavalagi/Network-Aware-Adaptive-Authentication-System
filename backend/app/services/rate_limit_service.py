import json
import logging
import time
from typing import Optional, Dict, Any
import redis.asyncio as aioredis

from backend.app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class RateLimitService:
    """Redis-backed sliding-window rate limiter, attempt tracker, and ephemeral challenge store.
    Includes in-memory fallback for offline test environments.
    """

    def __init__(self):
        self._redis_client: Optional[aioredis.Redis] = None
        self._in_memory_store: Dict[str, Dict[str, Any]] = {}
        self._redis_available: bool = False

    async def _get_client(self) -> Optional[aioredis.Redis]:
        """Lazy connection to Redis with availability probe."""
        if self._redis_client is None:
            try:
                client = aioredis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=1.0,
                    socket_timeout=1.0,
                )
                await client.ping()
                self._redis_client = client
                self._redis_available = True
            except Exception:
                self._redis_available = False
                self._redis_client = None

        return self._redis_client if self._redis_available else None

    async def check_ip_rate_limit(
        self,
        ip_address: str,
        max_requests: int = 30,
        window_seconds: int = 60,
    ) -> tuple[bool, int]:
        """Sliding-window IP rate limiting.
        Returns: (is_allowed, remaining_quota)
        """
        key = f"ratelimit:ip:{ip_address}"
        now = time.time()
        client = await self._get_client()

        if client:
            try:
                pipe = client.pipeline()
                # Remove elements older than window
                pipe.zremrangebyscore(key, 0, now - window_seconds)
                # Count elements in window
                pipe.zcard(key)
                # Add current timestamp
                pipe.zadd(key, {str(now): now})
                # Set TTL
                pipe.expire(key, window_seconds + 5)
                results = await pipe.execute()
                current_count = results[1]
                remaining = max(0, max_requests - current_count)
                return current_count < max_requests, remaining
            except Exception as e:
                logger.warning(f"Redis rate-limit query failed ({e}); falling back to in-memory store")

        # In-memory sliding window fallback
        entry = self._in_memory_store.setdefault(key, {"timestamps": []})
        valid_timestamps = [t for t in entry["timestamps"] if t > (now - window_seconds)]
        entry["timestamps"] = valid_timestamps
        current_count = len(valid_timestamps)
        if current_count >= max_requests:
            return False, 0

        entry["timestamps"].append(now)
        return True, max(0, max_requests - current_count - 1)

    async def store_challenge_state(
        self,
        challenge_token: str,
        data: Dict[str, Any],
        ttl_seconds: int = 300,
    ) -> None:
        """Store ephemeral MFA challenge authentication state with automatic expiration."""
        key = f"challenge:{challenge_token}"
        client = await self._get_client()
        serialized = json.dumps(data)

        if client:
            try:
                await client.setex(key, ttl_seconds, serialized)
                return
            except Exception:
                pass

        # In-memory fallback
        self._in_memory_store[key] = {
            "data": serialized,
            "expires_at": time.time() + ttl_seconds,
        }

    async def get_and_consume_challenge_state(
        self,
        challenge_token: str,
    ) -> Optional[Dict[str, Any]]:
        """Retrieve and immediately invalidate an MFA challenge state."""
        key = f"challenge:{challenge_token}"
        client = await self._get_client()

        if client:
            try:
                val = await client.get(key)
                if val:
                    await client.delete(key)
                    return json.loads(val)
                return None
            except Exception:
                pass

        # In-memory fallback
        entry = self._in_memory_store.pop(key, None)
        if entry:
            if entry.get("expires_at", 0) > time.time():
                return json.loads(entry["data"])

        return None

    async def record_login_failure(self, identifier: str, window_seconds: int = 600) -> int:
        """Increment consecutive failed attempts counter for an IP or username."""
        key = f"failures:{identifier}"
        client = await self._get_client()

        if client:
            try:
                count = await client.incr(key)
                await client.expire(key, window_seconds)
                return count
            except Exception:
                pass

        entry = self._in_memory_store.setdefault(key, {"count": 0, "expires_at": time.time() + window_seconds})
        if entry["expires_at"] < time.time():
            entry["count"] = 0
            entry["expires_at"] = time.time() + window_seconds
        entry["count"] += 1
        return entry["count"]

    async def clear_login_failures(self, identifier: str) -> None:
        """Clear failed attempts counter after a successful authentication."""
        key = f"failures:{identifier}"
        client = await self._get_client()
        if client:
            try:
                await client.delete(key)
                return
            except Exception:
                pass

        self._in_memory_store.pop(key, None)


rate_limit_service = RateLimitService()
