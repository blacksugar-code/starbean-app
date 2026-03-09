"""
模板数据访问层
封装模板 CRUD 操作
"""
import logging
from typing import List, Dict, Any, Optional
from database import supabase

logger = logging.getLogger(__name__)


class TemplateRepository:
    """合拍模板数据仓库"""

    TABLE = "templates"

    @staticmethod
    def get_all(published_only: bool = True) -> List[Dict[str, Any]]:
        """获取模板列表"""
        query = supabase.table(TemplateRepository.TABLE).select("*")
        if published_only:
            query = query.eq("is_published", True)
        query = query.order("created_at", desc=True)
        response = query.execute()
        return response.data or []

    @staticmethod
    def get_by_id(template_id: str) -> Optional[Dict[str, Any]]:
        """根据 ID 获取模板"""
        response = supabase.table(TemplateRepository.TABLE).select("*").eq(
            "id", template_id
        ).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None

    @staticmethod
    def create(template_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建模板"""
        response = supabase.table(TemplateRepository.TABLE).insert(
            template_data
        ).execute()
        return response.data[0]

    @staticmethod
    def update(template_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """更新模板"""
        response = supabase.table(TemplateRepository.TABLE).update(
            update_data
        ).eq("id", template_id).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None

    @staticmethod
    def delete(template_id: str) -> bool:
        """删除模板"""
        response = supabase.table(TemplateRepository.TABLE).select("*").eq(
            "id", template_id
        ).execute()
        if not response.data:
            return False
        supabase.table(TemplateRepository.TABLE).delete().eq(
            "id", template_id
        ).execute()
        return True


class PromptTemplateRepository:
    """提示词模板数据仓库"""

    TABLE = "prompt_templates"

    @staticmethod
    def get_all() -> List[Dict[str, Any]]:
        """获取所有提示词模板"""
        response = supabase.table(
            PromptTemplateRepository.TABLE
        ).select("*").execute()
        return response.data or []

    @staticmethod
    def get_active_by_rarity(rarity: str) -> List[Dict[str, Any]]:
        """获取指定稀有度的活跃提示词"""
        response = supabase.table(
            PromptTemplateRepository.TABLE
        ).select("*").eq("rarity", rarity).eq("is_active", True).execute()
        return response.data or []

    @staticmethod
    def create(template_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建提示词模板"""
        response = supabase.table(
            PromptTemplateRepository.TABLE
        ).insert(template_data).execute()
        return response.data[0]
