"""
社区 API 路由
提供帖子列表、帖子详情、评论、点赞、图片上传等接口
"""
import os
import uuid
import logging
from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from typing import List
from schema.community_schema import (
    PostCreateRequest,
    CommentCreateRequest,
    PostResponse,
    PostListResponse,
)
from service.community_service import CommunityService

logger = logging.getLogger(__name__)
router = APIRouter()

# 社区图片保存路径
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)


@router.get("/posts", response_model=List[PostListResponse])
async def get_posts(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    """获取帖子列表"""
    posts = CommunityService.get_posts(limit=limit, offset=offset)
    return [PostListResponse(**p) for p in posts]


@router.get("/posts/{post_id}", response_model=PostResponse)
async def get_post(post_id: str):
    """获取帖子详情（含评论）"""
    post = CommunityService.get_post_detail(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="帖子不存在")
    return PostResponse(**post)


@router.post("/posts", response_model=PostListResponse)
async def create_post(request: PostCreateRequest):
    """发布帖子"""
    try:
        post = CommunityService.create_post(
            user_id=request.user_id,
            content=request.content,
            image_url=request.image_url,
            title=request.title,
            tags=request.tags,
        )
        return PostListResponse(
            id=post["id"],
            user_id=post.get("user_id", ""),
            title=post.get("title", ""),
            content=post.get("content", ""),
            image_url=post.get("image_url", ""),
            tags=post.get("tags", []),
            likes_count=0,
            created_at=post.get("created_at", ""),
            comments_count=0,
        )
    except Exception as e:
        logger.error(f"发布帖子失败: {e}")
        raise HTTPException(status_code=500, detail="发布失败")


@router.post("/posts/upload-image")
async def upload_post_image(file: UploadFile = File(...)):
    """
    社区帖子图片上传
    返回图片 URL 供发帖时引用
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="仅支持图片文件")

    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    filename = f"post_{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOADS_DIR, filename)

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="图片不能超过 10MB")

    with open(filepath, "wb") as f:
        f.write(content)

    return {"image_url": f"/uploads/{filename}"}


@router.post("/posts/{post_id}/like")
async def like_post(post_id: str):
    """点赞帖子"""
    result = CommunityService.like_post(post_id)
    if not result:
        raise HTTPException(status_code=404, detail="帖子不存在")
    return {"likes_count": result.get("likes_count", 0)}


@router.post("/posts/{post_id}/comments")
async def create_comment(post_id: str, request: CommentCreateRequest):
    """发表评论"""
    try:
        comment = CommunityService.create_comment(
            post_id=post_id,
            user_id=request.user_id,
            content=request.content,
        )
        return comment
    except Exception as e:
        logger.error(f"发表评论失败: {e}")
        raise HTTPException(status_code=500, detail="评论失败")


@router.delete("/posts/{post_id}")
async def delete_post(post_id: str):
    """删除帖子"""
    result = CommunityService.delete_post(post_id)
    if not result:
        raise HTTPException(status_code=404, detail="帖子不存在")
    return {"detail": "删除成功", "id": post_id}
