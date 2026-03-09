"""
社区相关 Pydantic 校验模型
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class PostCreateRequest(BaseModel):
    """发布帖子请求"""
    user_id: str
    content: str = Field(..., min_length=1, max_length=1000)
    image_url: str = ""


class CommentCreateRequest(BaseModel):
    """发表评论请求"""
    user_id: str
    content: str = Field(..., min_length=1, max_length=500)


class CommentResponse(BaseModel):
    """评论响应"""
    id: str
    user_id: str
    user_name: str = ""
    user_avatar: str = ""
    content: str
    likes_count: int = 0
    created_at: str = ""
    location: str = ""


class PostResponse(BaseModel):
    """帖子响应"""
    id: str
    user_id: str
    user_name: str = ""
    user_avatar: str = ""
    content: str
    image_url: str = ""
    likes_count: int = 0
    created_at: str = ""
    comments: List[CommentResponse] = []
    comments_count: int = 0


class PostListResponse(BaseModel):
    """帖子列表响应（不含评论详情）"""
    id: str
    user_id: str
    user_name: str = ""
    user_avatar: str = ""
    content: str
    image_url: str = ""
    likes_count: int = 0
    created_at: str = ""
    comments_count: int = 0
