"""
社区数据访问层
封装 Supabase 帖子、评论表 CRUD 操作
"""
import logging
from typing import List, Dict, Any, Optional
from database import supabase

logger = logging.getLogger(__name__)


class PostRepository:
    """帖子数据仓库"""

    TABLE = "posts"

    @staticmethod
    def get_all(limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
        """获取帖子列表"""
        response = supabase.table(PostRepository.TABLE).select(
            "*, users(name, avatar_url)"
        ).order(
            "created_at", desc=True
        ).range(offset, offset + limit - 1).execute()
        return response.data or []

    @staticmethod
    def get_by_id(post_id: str) -> Optional[Dict[str, Any]]:
        """获取帖子详情"""
        response = supabase.table(PostRepository.TABLE).select(
            "*, users(name, avatar_url)"
        ).eq("id", post_id).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None

    @staticmethod
    def create(post_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建帖子"""
        response = supabase.table(PostRepository.TABLE).insert(
            post_data
        ).execute()
        return response.data[0]

    @staticmethod
    def increment_likes(post_id: str) -> Dict[str, Any]:
        """增加点赞数"""
        post = PostRepository.get_by_id(post_id)
        if not post:
            return {}
        new_count = post.get("likes_count", 0) + 1
        response = supabase.table(PostRepository.TABLE).update(
            {"likes_count": new_count}
        ).eq("id", post_id).execute()
        return response.data[0] if response.data else {}


class CommentRepository:
    """评论数据仓库"""

    TABLE = "comments"

    @staticmethod
    def get_by_post_id(post_id: str) -> List[Dict[str, Any]]:
        """获取帖子的所有评论"""
        response = supabase.table(CommentRepository.TABLE).select(
            "*, users(name, avatar_url)"
        ).eq(
            "post_id", post_id
        ).order("created_at", desc=True).execute()
        return response.data or []

    @staticmethod
    def create(comment_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建评论"""
        response = supabase.table(CommentRepository.TABLE).insert(
            comment_data
        ).execute()
        return response.data[0]

    @staticmethod
    def count_by_post_id(post_id: str) -> int:
        """统计帖子评论数"""
        response = supabase.table(CommentRepository.TABLE).select(
            "id", count="exact"
        ).eq("post_id", post_id).execute()
        return response.count or 0
