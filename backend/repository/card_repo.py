"""
卡牌数据访问层
封装 Supabase 卡牌表 CRUD 操作
"""
import logging
from typing import List, Dict, Any, Optional
from database import supabase

logger = logging.getLogger(__name__)


class CardRepository:
    """卡牌数据仓库"""

    TABLE = "cards"

    @staticmethod
    def get_user_cards(user_id: str) -> List[Dict[str, Any]]:
        """获取用户所有卡牌"""
        response = supabase.table(CardRepository.TABLE).select("*").eq(
            "user_id", user_id
        ).order("obtained_at", desc=True).execute()
        return response.data or []

    @staticmethod
    def get_user_cards_by_rarity(
        user_id: str, rarity: str
    ) -> List[Dict[str, Any]]:
        """按稀有度获取用户卡牌"""
        response = supabase.table(CardRepository.TABLE).select("*").eq(
            "user_id", user_id
        ).eq("rarity", rarity).order("obtained_at", desc=True).execute()
        return response.data or []

    @staticmethod
    def create(card_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建卡牌记录"""
        response = supabase.table(CardRepository.TABLE).insert(
            card_data
        ).execute()
        return response.data[0]

    @staticmethod
    def batch_create(cards: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """批量创建卡牌"""
        response = supabase.table(CardRepository.TABLE).insert(
            cards
        ).execute()
        return response.data or []

    @staticmethod
    def check_duplicate(
        user_id: str, name: str, rarity: str
    ) -> bool:
        """
        检查用户是否已拥有同名同稀有度卡牌
        用于判断重复卡分解碎片
        """
        response = supabase.table(CardRepository.TABLE).select("id").eq(
            "user_id", user_id
        ).eq("name", name).eq("rarity", rarity).execute()
        return len(response.data or []) > 0

    @staticmethod
    def get_user_card_count(user_id: str) -> int:
        """获取用户卡牌总数"""
        response = supabase.table(CardRepository.TABLE).select(
            "id", count="exact"
        ).eq("user_id", user_id).execute()
        return response.count or 0

    @staticmethod
    def get_by_id(card_id: str) -> Optional[Dict[str, Any]]:
        """根据 ID 获取卡牌"""
        response = supabase.table(CardRepository.TABLE).select("*").eq(
            "id", card_id
        ).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None

    @staticmethod
    def update(card_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """更新卡牌信息"""
        response = supabase.table(CardRepository.TABLE).update(
            update_data
        ).eq("id", card_id).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
