"""
用户数据访问层
封装 Supabase 用户表 CRUD 操作
"""
import logging
from typing import Optional, Dict, Any
from database import supabase

logger = logging.getLogger(__name__)


class UserRepository:
    """用户数据仓库"""

    TABLE = "users"

    @staticmethod
    def get_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        """根据 ID 获取用户"""
        response = supabase.table(UserRepository.TABLE).select("*").eq(
            "id", user_id
        ).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None

    @staticmethod
    def get_by_username(username: str) -> Optional[Dict[str, Any]]:
        """根据用户名获取用户"""
        response = supabase.table(UserRepository.TABLE).select("*").eq(
            "username", username
        ).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None

    @staticmethod
    def create(user_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建用户"""
        response = supabase.table(UserRepository.TABLE).insert(
            user_data
        ).execute()
        return response.data[0]

    @staticmethod
    def update(user_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """更新用户信息"""
        response = supabase.table(UserRepository.TABLE).update(
            update_data
        ).eq("id", user_id).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return {}

    @staticmethod
    def update_currency(
        user_id: str, star_beans_delta: int = 0, fragments_delta: int = 0
    ) -> Optional[Dict[str, Any]]:
        """
        原子更新用户货币
        NOTE: Supabase 不直接支持 increment，需要先读后写
        生产环境建议使用 Supabase RPC function 保证原子性
        """
        user = UserRepository.get_by_id(user_id)
        if not user:
            return None

        new_star_beans = user.get("star_beans", 0) + star_beans_delta
        new_fragments = user.get("fragments", 0) + fragments_delta

        # 安全校验：余额不能为负
        if new_star_beans < 0 or new_fragments < 0:
            return None

        return UserRepository.update(user_id, {
            "star_beans": new_star_beans,
            "fragments": new_fragments,
        })

    @staticmethod
    def delete_avatar(user_id: str) -> Dict[str, Any]:
        """删除用户数字形象"""
        return UserRepository.update(user_id, {
            "avatar_url": "",
            "digital_avatar_generated": False,
        })
