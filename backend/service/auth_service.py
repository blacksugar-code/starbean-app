"""
认证服务层
处理用户注册、登录、JWT Token 管理
"""
import os
import uuid
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

import bcrypt
import jwt

from repository.user_repo import UserRepository

logger = logging.getLogger(__name__)

# JWT 密钥，生产环境务必通过环境变量设置
JWT_SECRET = os.getenv("JWT_SECRET", "starbean-jwt-secret-key-2026")
JWT_ALGORITHM = "HS256"
# Token 有效期 7 天
JWT_EXPIRATION_DAYS = 7


class AuthService:
    """认证业务服务"""

    @staticmethod
    def _hash_password(password: str) -> str:
        """密码 bcrypt 哈希"""
        return bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

    @staticmethod
    def _verify_password(password: str, password_hash: str) -> bool:
        """校验密码"""
        return bcrypt.checkpw(
            password.encode("utf-8"), password_hash.encode("utf-8")
        )

    @staticmethod
    def _generate_token(user_id: str) -> str:
        """生成 JWT Token"""
        payload = {
            "sub": user_id,
            "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS),
            "iat": datetime.now(timezone.utc),
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    @staticmethod
    def verify_token(token: str) -> Optional[str]:
        """
        验证 JWT Token，返回 user_id
        验证失败返回 None
        """
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return payload.get("sub")
        except jwt.ExpiredSignatureError:
            logger.warning("Token 已过期")
            return None
        except jwt.InvalidTokenError:
            logger.warning("无效 Token")
            return None

    @staticmethod
    def register(username: str, password: str) -> Dict[str, Any]:
        """
        用户注册
        - 检查用户名是否已存在
        - 密码 bcrypt 加密
        - 创建用户并返回 token
        """
        # 检查用户名是否已被注册
        existing = UserRepository.get_by_username(username)
        if existing:
            raise ValueError("该用户名已被注册")

        # 密码长度校验
        if len(password) < 6:
            raise ValueError("密码至少 6 个字符")
        if len(password) > 50:
            raise ValueError("密码不能超过 50 个字符")

        # 创建用户
        password_hash = AuthService._hash_password(password)
        user_data = {
            "id": str(uuid.uuid4()),
            "username": username,
            "name": username,
            "password_hash": password_hash,
            "avatar_url": "",
            "star_beans": 1250,
            "fragments": 25,
            "digital_avatar_generated": False,
        }
        user = UserRepository.create(user_data)
        token = AuthService._generate_token(user["id"])

        # 返回数据中不包含密码哈希
        safe_user = {k: v for k, v in user.items() if k != "password_hash"}
        return {"token": token, "user": safe_user}

    @staticmethod
    def login(username: str, password: str) -> Dict[str, Any]:
        """
        用户登录
        - 查找用户
        - 校验密码
        - 返回 token
        """
        user = UserRepository.get_by_username(username)
        if not user:
            raise ValueError("用户名或密码错误")

        if not AuthService._verify_password(password, user.get("password_hash", "")):
            raise ValueError("用户名或密码错误")

        token = AuthService._generate_token(user["id"])
        safe_user = {k: v for k, v in user.items() if k != "password_hash"}
        return {"token": token, "user": safe_user}

    @staticmethod
    def get_current_user(token: str) -> Optional[Dict[str, Any]]:
        """根据 Token 获取当前用户"""
        user_id = AuthService.verify_token(token)
        if not user_id:
            return None

        user = UserRepository.get_by_id(user_id)
        if not user:
            return None

        # 返回数据中不包含密码哈希
        return {k: v for k, v in user.items() if k != "password_hash"}
