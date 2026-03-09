"""
合拍模板管理 API 路由
提供模板的增删改查接口
"""
import os
import uuid
import shutil
import logging
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from typing import List, Optional
from schema.artist_schema import (
    TemplateCreateRequest,
    TemplateUpdateRequest,
    TemplateResponse,
    PromptTemplateResponse,
)
from repository.artist_repo import (
    TemplateRepository,
    PromptTemplateRepository,
)

logger = logging.getLogger(__name__)
router = APIRouter()

UPLOADS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "backend", "uploads",
)
# 兼容直接在 backend 目录运行的情况
if not os.path.basename(os.path.dirname(os.path.abspath(__file__))) == "api":
    UPLOADS_DIR = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "uploads"
    )
else:
    UPLOADS_DIR = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads"
    )

os.makedirs(UPLOADS_DIR, exist_ok=True)


# ==================== 图片上传 ====================

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    上传图片
    返回可访问的图片 URL，用于模板的封面图、详情图、参考图
    """
    # 校验文件类型
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件类型: {file.content_type}，仅支持 jpg/png/webp/gif",
        )

    # 生成唯一文件名
    ext = file.filename.split(".")[-1] if file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOADS_DIR, filename)

    # 保存文件
    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)

    logger.info(f"图片已上传: {filename}, 大小: {len(content)} bytes")

    return {
        "filename": filename,
        "url": f"/api/uploads/{filename}",
        "size": len(content),
    }


@router.get("/uploads/{filename}")
async def serve_upload(filename: str):
    """提供已上传图片的访问"""
    filepath = os.path.join(UPLOADS_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="文件不存在")
    return FileResponse(filepath)


# ==================== 模板 CRUD ====================

@router.get("/templates", response_model=List[TemplateResponse])
async def get_templates(all: bool = False):
    """
    获取合拍模板列表
    默认只返回已上架的模板，传 ?all=true 返回全部
    """
    templates = TemplateRepository.get_all(published_only=not all)
    return [TemplateResponse(**t) for t in templates]


@router.get("/templates/{template_id}", response_model=TemplateResponse)
async def get_template(template_id: str):
    """获取模板详情"""
    t = TemplateRepository.get_by_id(template_id)
    if not t:
        raise HTTPException(status_code=404, detail="模板不存在")
    return TemplateResponse(**t)


@router.post("/templates", response_model=TemplateResponse)
async def create_template(request: TemplateCreateRequest):
    """
    创建合拍模板
    需要先通过 /api/upload 上传图片获取 URL，再传入此接口
    """
    template_data = {
        "title": request.title,
        "artist_name": request.artist_name,
        "cover_image": request.cover_image,
        "detail_image": request.detail_image,
        "artist_ref_images": request.artist_ref_images,
        "template_prompt": request.template_prompt,
        "single_draw_price": request.single_draw_price,
        "ten_draw_price": request.ten_draw_price,
        "description": request.description,
        "rarity_rates": request.rarity_rates,
        "is_published": request.is_published,
    }

    try:
        created = TemplateRepository.create(template_data)
        logger.info(f"模板已创建: {request.title}, 艺人: {request.artist_name}")
        return TemplateResponse(**created)
    except Exception as e:
        logger.error(f"创建模板失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="创建失败")


@router.put("/templates/{template_id}", response_model=TemplateResponse)
async def update_template(template_id: str, request: TemplateUpdateRequest):
    """更新合拍模板"""
    existing = TemplateRepository.get_by_id(template_id)
    if not existing:
        raise HTTPException(status_code=404, detail="模板不存在")

    # 只更新非 None 的字段
    update_data = {
        k: v for k, v in request.model_dump().items() if v is not None
    }

    if not update_data:
        raise HTTPException(status_code=400, detail="没有需要更新的字段")

    updated = TemplateRepository.update(template_id, update_data)
    if not updated:
        raise HTTPException(status_code=500, detail="更新失败")

    return TemplateResponse(**updated)


@router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    """删除合拍模板"""
    existing = TemplateRepository.get_by_id(template_id)
    if not existing:
        raise HTTPException(status_code=404, detail="模板不存在")

    success = TemplateRepository.delete(template_id)
    if not success:
        raise HTTPException(status_code=500, detail="删除失败")

    logger.info(f"模板已删除: {template_id}")
    return {"detail": "删除成功", "id": template_id}


# ==================== 提示词模板 ====================

@router.get(
    "/prompt-templates", response_model=List[PromptTemplateResponse]
)
async def get_prompt_templates():
    """获取所有提示词模板"""
    templates = PromptTemplateRepository.get_all()
    return [PromptTemplateResponse(**t) for t in templates]


@router.get(
    "/prompt-templates/{rarity}",
    response_model=List[PromptTemplateResponse],
)
async def get_prompt_templates_by_rarity(rarity: str):
    """获取指定稀有度的活跃提示词模板"""
    rarity_upper = rarity.upper()
    if rarity_upper not in ("N", "R", "SR", "SSR"):
        raise HTTPException(status_code=400, detail="无效的稀有度")
    templates = PromptTemplateRepository.get_active_by_rarity(rarity_upper)
    return [PromptTemplateResponse(**t) for t in templates]
