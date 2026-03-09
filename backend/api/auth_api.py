"""
认证 API 路由
提供用户注册、登录、当前用户信息等接口
"""
import logging
from fastapi import APIRouter, HTTPException, Header
from typing import Optional

from schema.user_schema import (
    AuthRegisterRequest,
    AuthLoginRequest,
    AuthResponse,
    UserResponse,
)
from service.auth_service import AuthService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/auth/register", response_model=AuthResponse)
async def register(request: AuthRegisterRequest):
    """
    用户注册
    用户名 + 密码，注册成功后自动登录返回 token
    """
    try:
        result = AuthService.register(request.username, request.password)
        return AuthResponse(
            token=result["token"],
            user=UserResponse(**result["user"]),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"注册失败: {e}")
        raise HTTPException(status_code=500, detail="注册失败，请稍后重试")


@router.post("/auth/login", response_model=AuthResponse)
async def login(request: AuthLoginRequest):
    """
    用户登录
    用户名 + 密码，登录成功返回 token
    """
    try:
        result = AuthService.login(request.username, request.password)
        return AuthResponse(
            token=result["token"],
            user=UserResponse(**result["user"]),
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        logger.error(f"登录失败: {e}")
        raise HTTPException(status_code=500, detail="登录失败，请稍后重试")


@router.get("/auth/me", response_model=UserResponse)
async def get_me(authorization: Optional[str] = Header(None)):
    """
    获取当前登录用户信息
    需要在请求头携带 Authorization: Bearer <token>
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="未登录")

    token = authorization.split(" ", 1)[1]
    user = AuthService.get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="登录已过期，请重新登录")

    return UserResponse(**user)
