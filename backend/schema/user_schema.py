"""
用户相关 Pydantic 校验模型
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserCreateRequest(BaseModel):
    """用户创建/登录请求"""
    name: str = Field(..., min_length=1, max_length=50, description="用户昵称")


class UserResponse(BaseModel):
    """用户信息响应"""
    id: str
    name: str
    avatar_url: str = ""
    star_beans: int = 0
    fragments: int = 0
    digital_avatar_generated: bool = False
    created_at: Optional[str] = None


class UserAvatarUpdate(BaseModel):
    """更新用户数字形象"""
    avatar_url: str = Field(..., description="数字形象 URL")


class CurrencyUpdateRequest(BaseModel):
    """货币更新请求"""
    amount: int = Field(..., gt=0, description="操作金额，必须为正数")
