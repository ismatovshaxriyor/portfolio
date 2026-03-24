from django.core.cache import cache

PROJECT_LIST_CACHE_KEY = "api:projects:list:v1"
SKILL_GROUP_LIST_CACHE_KEY = "api:skills:list:v1"


def invalidate_public_content_cache() -> None:
    try:
        cache.delete_many([PROJECT_LIST_CACHE_KEY, SKILL_GROUP_LIST_CACHE_KEY])
    except Exception:
        return
