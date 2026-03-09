"""
社区业务逻辑层
处理帖子、评论、点赞等社区功能
"""
import uuid
import logging
from typing import List, Dict, Any, Optional
from repository.community_repo import PostRepository, CommentRepository

logger = logging.getLogger(__name__)


class CommunityService:
    """社区业务服务"""

    @staticmethod
    def get_posts(limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
        """获取帖子列表"""
        posts = PostRepository.get_all(limit=limit, offset=offset)
        result = []
        for post in posts:
            comment_count = CommentRepository.count_by_post_id(post["id"])
            # 提取关联的用户信息
            user_info = post.get("users", {}) or {}
            result.append({
                "id": post["id"],
                "user_id": post.get("user_id", ""),
                "user_name": user_info.get("name", "匿名用户"),
                "user_avatar": user_info.get(
                    "avatar_url", ""
                ),
                "title": post.get("title", ""),
                "content": post.get("content", ""),
                "image_url": post.get("image_url", ""),
                "tags": post.get("tags", []),
                "likes_count": post.get("likes_count", 0),
                "created_at": post.get("created_at", ""),
                "comments_count": comment_count,
            })
        return result

    @staticmethod
    def get_post_detail(post_id: str) -> Optional[Dict[str, Any]]:
        """获取帖子详情（含评论）"""
        post = PostRepository.get_by_id(post_id)
        if not post:
            return None

        comments_raw = CommentRepository.get_by_post_id(post_id)
        comments = []
        for c in comments_raw:
            c_user = c.get("users", {}) or {}
            comments.append({
                "id": c["id"],
                "user_id": c.get("user_id", ""),
                "user_name": c_user.get("name", "匿名"),
                "user_avatar": c_user.get("avatar_url", ""),
                "content": c.get("content", ""),
                "likes_count": c.get("likes_count", 0),
                "created_at": c.get("created_at", ""),
                "location": c.get("location", ""),
            })

        user_info = post.get("users", {}) or {}
        return {
            "id": post["id"],
            "user_id": post.get("user_id", ""),
            "user_name": user_info.get("name", "匿名用户"),
            "user_avatar": user_info.get("avatar_url", ""),
            "title": post.get("title", ""),
            "content": post.get("content", ""),
            "image_url": post.get("image_url", ""),
            "tags": post.get("tags", []),
            "likes_count": post.get("likes_count", 0),
            "created_at": post.get("created_at", ""),
            "comments": comments,
            "comments_count": len(comments),
        }

    @staticmethod
    def create_post(
        user_id: str, content: str, image_url: str = "",
        title: str = "", tags: list = None
    ) -> Dict[str, Any]:
        """发布帖子"""
        post_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "title": title,
            "content": content,
            "image_url": image_url,
            "tags": tags or [],
            "likes_count": 0,
        }
        return PostRepository.create(post_data)

    @staticmethod
    def like_post(post_id: str) -> Dict[str, Any]:
        """点赞帖子"""
        return PostRepository.increment_likes(post_id)

    @staticmethod
    def create_comment(
        post_id: str, user_id: str, content: str
    ) -> Dict[str, Any]:
        """发表评论"""
        comment_data = {
            "id": str(uuid.uuid4()),
            "post_id": post_id,
            "user_id": user_id,
            "content": content,
            "likes_count": 0,
        }
        return CommentRepository.create(comment_data)
