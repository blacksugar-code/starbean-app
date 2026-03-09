"""
抽卡相关 Pydantic 校验模型
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime


class DrawRequest(BaseModel):
    """抽卡请求"""
    user_id: str = Field(..., description="用户 ID")
    template_id: str = Field(..., description="卡池模板 ID")
    draw_type: Literal["single", "ten"] = Field(
        ..., description="抽卡类型：single=单抽(99星豆), ten=十连(890星豆)"
    )


class CardResponse(BaseModel):
    """卡牌响应"""
    id: str
    name: str
    rarity: Literal["N", "R", "SR", "SSR"]
    image_url: str
    artist_id: str
    series: str
    obtained_at: str
    description: Optional[str] = None
    # NOTE: 如果是重复卡，返回分解获得的碎片数
    is_duplicate: bool = False
    fragments_gained: int = 0


class DrawResponse(BaseModel):
    """抽卡结果响应"""
    cards: List[CardResponse]
    remaining_star_beans: int
    remaining_fragments: int
    total_pulls: int
    pulls_since_last_ssr: int


class GachaRecordResponse(BaseModel):
    """抽卡记录响应"""
    user_id: str
    template_id: str
    total_pulls: int
    pulls_since_last_ssr: int


class GenerateImageRequest(BaseModel):
    """按需生成合照请求"""
    card_id: str = Field(..., description="卡牌 ID")
    user_id: str = Field(..., description="用户 ID")
    mode: Literal["avatar", "photo"] = Field(
        "avatar",
        description="生成模式：avatar=虚拟形象合照, photo=照片合拍",
    )
    # NOTE: 仅 mode=photo 时使用，base64 编码的用户上传照片
    user_photo: Optional[str] = Field(
        None, description="用户上传的照片 (base64 data URI)"
    )


class GenerateImageResponse(BaseModel):
    """按需生成合照响应"""
    card_id: str
    image_url: str
    rarity: str
