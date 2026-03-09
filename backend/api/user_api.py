"""
用户 API 路由
提供用户创建、信息获取、数字形象管理等接口
"""
import os
import uuid
import logging
import shutil
from typing import List
from fastapi import APIRouter, HTTPException, UploadFile, File
from schema.user_schema import (
    UserCreateRequest,
    UserResponse,
    UserAvatarUpdate,
    CurrencyUpdateRequest,
)
from service.user_service import UserService
from service.seedream_service import SeedreamService

logger = logging.getLogger(__name__)
router = APIRouter()

# 临时文件上传目录
TEMP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "temp_uploads")
os.makedirs(TEMP_DIR, exist_ok=True)

# 单张图片最大 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}


@router.post("/users", response_model=UserResponse)
async def create_user(request: UserCreateRequest):
    """创建新用户"""
    try:
        user = UserService.create_user(request.name)
        return UserResponse(**user)
    except Exception as e:
        logger.error(f"创建用户失败: {e}")
        raise HTTPException(status_code=500, detail="创建用户失败")


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """获取用户信息"""
    user = UserService.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return UserResponse(**user)


@router.put("/users/{user_id}/avatar", response_model=UserResponse)
async def update_avatar(user_id: str, request: UserAvatarUpdate):
    """更新用户数字形象"""
    user = UserService.update_avatar(user_id, request.avatar_url)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return UserResponse(**user)


@router.delete("/users/{user_id}/avatar", response_model=UserResponse)
async def delete_avatar(user_id: str):
    """
    删除用户数字形象
    合规要求：支持随时删除，后台同步彻底清除
    """
    user = UserService.delete_avatar(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return UserResponse(**user)


@router.post("/users/{user_id}/generate-avatar")
async def generate_avatar(
    user_id: str,
    photos: List[UploadFile] = File(..., description="用户照片（1-5张）"),
):
    """
    上传照片并调用 NanoBanana (Gemini) 生成用户数字形象
    接收 multipart/form-data 格式的图片文件
    """
    user = UserService.get_user(user_id)
    if not user:
        # NOTE: 演示环境下自动创建用户，避免前端默认用户不存在
        user = UserService.create_user_with_id(user_id, "StarBean User")

    # 校验文件数量
    if len(photos) < 1 or len(photos) > 5:
        raise HTTPException(
            status_code=400, detail="请上传 1-5 张照片"
        )

    # 保存上传文件到临时目录
    saved_paths: List[str] = []
    try:
        for photo in photos:
            # 校验文件类型
            if photo.content_type and photo.content_type not in ALLOWED_TYPES:
                raise HTTPException(
                    status_code=400,
                    detail=f"不支持的文件类型: {photo.content_type}",
                )

            # 校验文件大小
            content = await photo.read()
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"文件 {photo.filename} 超过 10MB 限制",
                )

            # 保存到临时目录
            ext = os.path.splitext(photo.filename or "photo.jpg")[1] or ".jpg"
            temp_filename = f"{uuid.uuid4()}{ext}"
            temp_path = os.path.join(TEMP_DIR, temp_filename)
            with open(temp_path, "wb") as f:
                f.write(content)
            saved_paths.append(temp_path)

        # 调用豆包 SeedReam 服务生成数字形象
        result = SeedreamService.generate_user_avatar(
            photo_paths=saved_paths,
            style="realistic",
        )

        if result["status"] == "success":
            updated = UserService.update_avatar(user_id, result["image_url"])
            return {
                "avatar_id": result["id"],
                "image_url": result["image_url"],
                "user": updated,
            }

        raise HTTPException(status_code=500, detail="数字形象生成失败")

    finally:
        # 清理临时文件（合规：照片用后即删）
        for path in saved_paths:
            try:
                os.remove(path)
            except OSError:
                pass


@router.post("/users/{user_id}/recharge")
async def recharge(user_id: str, request: CurrencyUpdateRequest):
    """充值星豆"""
    user = UserService.add_star_beans(user_id, request.amount)
    if not user:
        raise HTTPException(status_code=400, detail="充值失败")
    return {"star_beans": user.get("star_beans", 0)}


@router.get("/users/{user_id}/follows")
async def get_follows(user_id: str):
    """获取用户关注的艺人列表"""
    user = UserService.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return {"followed_artists": user.get("followed_artists", [])}


@router.post("/users/{user_id}/follow")
async def follow_artist(user_id: str, body: dict):
    """关注艺人"""
    artist_name = body.get("artist_name", "")
    if not artist_name:
        raise HTTPException(status_code=400, detail="缺少 artist_name")
    user = UserService.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    follows = user.get("followed_artists", [])
    if artist_name not in follows:
        follows.append(artist_name)
        from repository.user_repo import UserRepository
        UserRepository.update(user_id, {"followed_artists": follows})
    return {"followed_artists": follows}


@router.post("/users/{user_id}/unfollow")
async def unfollow_artist(user_id: str, body: dict):
    """取关艺人"""
    artist_name = body.get("artist_name", "")
    if not artist_name:
        raise HTTPException(status_code=400, detail="缺少 artist_name")
    user = UserService.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    follows = user.get("followed_artists", [])
    if artist_name in follows:
        follows.remove(artist_name)
        from repository.user_repo import UserRepository
        UserRepository.update(user_id, {"followed_artists": follows})
    return {"followed_artists": follows}
