"""
艺人与合拍模板相关 Pydantic 校验模型

合拍模板（Template）字段说明：
- title: 合拍名称（主标题）
- artist_name: 艺人名称
- cover_image: 封面图片 URL
- detail_image: 详情长图 URL
- artist_ref_images: 艺人 5 张参考图 URL 列表
- template_prompt: 模板合拍 Prompt (场景描述及打光/风格提示词)
- single_draw_price: 单抽价格（星豆）
- ten_draw_price: 十连价格（星豆）
- description: 描述文字
- is_published: 是否上架
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, List


class TemplateCreateRequest(BaseModel):
    """创建合拍模板请求"""
    title: str = Field(..., min_length=1, max_length=200, description="合拍名称（主标题）")
    artist_name: str = Field(..., min_length=1, max_length=100, description="艺人名称")
    cover_image: str = Field("", description="封面图片 URL")
    detail_image: str = Field("", description="详情长图 URL")
    artist_ref_images: List[str] = Field(
        default_factory=list,
        min_length=1,
        max_length=5,
        description="艺人参考图 URL 列表（必填，至少1张，最多5张）",
    )
    template_prompt: str = Field(..., min_length=1, max_length=5000, description="模板合拍 Prompt (场景描述及打光/风格提示词)")
    single_draw_price: int = Field(99, gt=0, description="单抽价格（星豆）")
    ten_draw_price: int = Field(890, gt=0, description="十连价格（星豆）")
    description: str = Field("", max_length=1000, description="描述文字")
    rarity_rates: Dict[str, str] = Field(
        default={"N": "70%", "R": "20%", "SR": "8%", "SSR": "2%"},
        description="掉率配置",
    )
    is_published: bool = Field(True, description="是否上架")


class TemplateUpdateRequest(BaseModel):
    """更新合拍模板请求（所有字段可选）"""
    title: Optional[str] = None
    artist_name: Optional[str] = None
    cover_image: Optional[str] = None
    detail_image: Optional[str] = None
    artist_ref_images: Optional[List[str]] = None
    template_prompt: Optional[str] = None
    single_draw_price: Optional[int] = None
    ten_draw_price: Optional[int] = None
    description: Optional[str] = None
    rarity_rates: Optional[Dict[str, str]] = None
    is_published: Optional[bool] = None


class TemplateResponse(BaseModel):
    """合拍模板响应"""
    id: str
    title: str
    artist_name: str = ""
    cover_image: str = ""
    detail_image: str = ""
    artist_ref_images: List[str] = []
    template_prompt: str = ""
    single_draw_price: int = 99
    ten_draw_price: int = 890
    description: str = ""
    rarity_rates: Dict[str, str] = {}
    is_published: bool = True
    created_at: str = ""


class PromptTemplateResponse(BaseModel):
    """Nanobanana 提示词模板响应"""
    id: str
    rarity: str
    name: str
    prompt_text: str
    is_active: bool = True
