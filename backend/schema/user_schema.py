"""
用户相关 Pydantic 校验模型
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserCreateRequest(BaseModel):
    """用户创建/登录请求"""
    name: str = Field(..., min_length=1, max_length=50, description="用户昵称")


class AuthRegisterRequest(BaseModel):
    """注册请求"""
    username: str = Field(..., min_length=2, max_length=20, description="用户名")
    password: str = Field(..., min_length=6, max_length=50, description="密码")


class AuthLoginRequest(BaseModel):
    """登录请求"""
    username: str = Field(..., min_length=1, description="用户名")
    password: str = Field(..., min_length=1, description="密码")


class UserResponse(BaseModel):
    """用户信息响应"""
    id: str
    username: Optional[str] = None
    name: str
    avatar_url: str = ""
    star_beans: int = 0
    fragments: int = 0
    digital_avatar_generated: bool = False
    created_at: Optional[str] = None
    pulls_since_last_ssr: Optional[int] = 0
    total_pulls: Optional[int] = 0


class AuthResponse(BaseModel):
    """认证响应"""
    token: str
    user: UserResponse


class UserAvatarUpdate(BaseModel):
    """更新用户数字形象"""
    avatar_url: str = Field(..., description="数字形象 URL")


class CurrencyUpdateRequest(BaseModel):
    """货币更新请求"""
    amount: int = Field(..., gt=0, description="操作金额，必须为正数")
