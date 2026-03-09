"""
用户业务逻辑层
处理用户注册、登录、数字形象管理等业务逻辑
"""
import uuid
import logging
from typing import Optional, Dict, Any
from repository.user_repo import UserRepository

logger = logging.getLogger(__name__)


class UserService:
    """用户业务服务"""

    @staticmethod
    def get_user(user_id: str) -> Optional[Dict[str, Any]]:
        """获取用户信息"""
        return UserRepository.get_by_id(user_id)

    @staticmethod
    def create_user(name: str) -> Dict[str, Any]:
        """
        创建新用户
        初始赠送 1250 星豆和 25 碎片作为新手福利
        """
        user_data = {
            "id": str(uuid.uuid4()),
            "name": name,
            "avatar_url": "",
            "star_beans": 1250,
            "fragments": 25,
            "digital_avatar_generated": False,
        }
        return UserRepository.create(user_data)

    @staticmethod
    def create_user_with_id(user_id: str, name: str) -> Dict[str, Any]:
        """
        使用指定 ID 创建用户
        NOTE: 演示环境用，前端硬编码用户 ID 时自动创建
        """
        user_data = {
            "id": user_id,
            "name": name,
            "avatar_url": "",
            "star_beans": 1250,
            "fragments": 25,
            "digital_avatar_generated": False,
        }
        return UserRepository.create(user_data)

    @staticmethod
    def update_avatar(user_id: str, avatar_url: str) -> Optional[Dict[str, Any]]:
        """更新用户数字形象"""
        return UserRepository.update(user_id, {
            "avatar_url": avatar_url,
            "digital_avatar_generated": True,
        })

    @staticmethod
    def delete_avatar(user_id: str) -> Dict[str, Any]:
        """
        删除用户数字形象
        符合合规要求：支持用户随时删除，后台同步彻底清除
        """
        return UserRepository.delete_avatar(user_id)

    @staticmethod
    def add_star_beans(user_id: str, amount: int) -> Optional[Dict[str, Any]]:
        """充值星豆"""
        if amount <= 0:
            return None
        return UserRepository.update_currency(
            user_id, star_beans_delta=amount
        )

    @staticmethod
    def deduct_star_beans(user_id: str, amount: int) -> Optional[Dict[str, Any]]:
        """扣除星豆"""
        if amount <= 0:
            return None
        return UserRepository.update_currency(
            user_id, star_beans_delta=-amount
        )
