"""
社区相关 Pydantic 校验模型
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class PostCreateRequest(BaseModel):
    """发布帖子请求"""
    user_id: str
    title: str = Field("", max_length=100, description="帖子标题")
    content: str = Field(..., min_length=1, max_length=2000)
    image_url: str = ""
    tags: List[str] = Field(default_factory=list, description="标签列表")


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
    title: str = ""
    content: str
    image_url: str = ""
    tags: List[str] = []
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
    title: str = ""
    content: str
    image_url: str = ""
    tags: List[str] = []
    likes_count: int = 0
    created_at: str = ""
    comments_count: int = 0
