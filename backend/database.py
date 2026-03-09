"""
本地 JSON 文件存储引擎
替代 Supabase，所有数据存储在 backend/data/ 目录的 JSON 文件中
适合开发和演示环境，无需外部数据库

NOTE: 生产环境应切换回 Supabase 或其他数据库
"""
import json
import os
import uuid
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")


def _ensure_dirs():
    """确保数据和上传目录存在"""
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(UPLOADS_DIR, exist_ok=True)


def _get_file_path(table_name: str) -> str:
    """获取表对应的 JSON 文件路径"""
    _ensure_dirs()
    return os.path.join(DATA_DIR, f"{table_name}.json")


def _read_table(table_name: str) -> List[Dict[str, Any]]:
    """读取整张表的数据"""
    path = _get_file_path(table_name)
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []


def _write_table(table_name: str, data: List[Dict[str, Any]]):
    """写入整张表的数据"""
    path = _get_file_path(table_name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


class LocalTable:
    """
    本地 JSON 表操作，模拟 SupabaseTable 的接口
    """

    def __init__(self, table_name: str):
        self._table = table_name
        self._filters: Dict[str, Any] = {}
        self._order_col: Optional[str] = None
        self._order_desc: bool = False
        self._operation = "select"
        self._payload: Any = None

    def select(self, columns: str = "*", count: str = "") -> "LocalTable":
        self._operation = "select"
        return self

    def eq(self, column: str, value: Any) -> "LocalTable":
        self._filters[column] = value
        return self

    def order(self, column: str, desc: bool = False) -> "LocalTable":
        self._order_col = column
        self._order_desc = desc
        return self

    def range(self, start: int, end: int) -> "LocalTable":
        self._range_start = start
        self._range_end = end
        return self

    def insert(self, data: Any) -> "LocalTable":
        self._payload = data
        self._operation = "insert"
        return self

    def upsert(self, data: Any) -> "LocalTable":
        self._payload = data
        self._operation = "upsert"
        return self

    def update(self, data: Dict[str, Any]) -> "LocalTable":
        self._payload = data
        self._operation = "update"
        return self

    def delete(self) -> "LocalTable":
        self._operation = "delete"
        return self

    def execute(self) -> "LocalResponse":
        if self._operation == "select":
            return self._exec_select()
        elif self._operation == "insert":
            return self._exec_insert()
        elif self._operation == "upsert":
            return self._exec_upsert()
        elif self._operation == "update":
            return self._exec_update()
        elif self._operation == "delete":
            return self._exec_delete()
        return LocalResponse(data=[])

    def _match_filters(self, row: Dict[str, Any]) -> bool:
        """检查行是否匹配所有过滤条件"""
        for col, val in self._filters.items():
            if str(row.get(col)) != str(val):
                return False
        return True

    def _exec_select(self) -> "LocalResponse":
        rows = _read_table(self._table)
        if self._filters:
            rows = [r for r in rows if self._match_filters(r)]
        if self._order_col:
            rows.sort(
                key=lambda r: r.get(self._order_col, ""),
                reverse=self._order_desc,
            )
        if hasattr(self, "_range_start") and hasattr(self, "_range_end"):
            rows = rows[self._range_start: self._range_end + 1]
        return LocalResponse(data=rows)

    def _exec_insert(self) -> "LocalResponse":
        rows = _read_table(self._table)
        items = self._payload if isinstance(self._payload, list) else [self._payload]
        for item in items:
            if "id" not in item:
                item["id"] = str(uuid.uuid4())
            if "created_at" not in item:
                item["created_at"] = datetime.now().isoformat()
            rows.append(item)
        _write_table(self._table, rows)
        return LocalResponse(data=items)

    def _exec_upsert(self) -> "LocalResponse":
        rows = _read_table(self._table)
        items = self._payload if isinstance(self._payload, list) else [self._payload]
        for item in items:
            if "id" not in item:
                item["id"] = str(uuid.uuid4())
            # 查找是否已存在
            found = False
            for i, r in enumerate(rows):
                if r.get("id") == item["id"]:
                    rows[i] = {**r, **item}
                    found = True
                    break
            if not found:
                if "created_at" not in item:
                    item["created_at"] = datetime.now().isoformat()
                rows.append(item)
        _write_table(self._table, rows)
        return LocalResponse(data=items)

    def _exec_update(self) -> "LocalResponse":
        rows = _read_table(self._table)
        updated = []
        for i, r in enumerate(rows):
            if self._match_filters(r):
                rows[i] = {**r, **self._payload}
                updated.append(rows[i])
        _write_table(self._table, rows)
        return LocalResponse(data=updated)

    def _exec_delete(self) -> "LocalResponse":
        rows = _read_table(self._table)
        deleted = [r for r in rows if self._match_filters(r)]
        remaining = [r for r in rows if not self._match_filters(r)]
        _write_table(self._table, remaining)
        return LocalResponse(data=deleted)


class LocalResponse:
    """本地响应对象"""
    def __init__(self, data: List[Dict[str, Any]], count: int = 0):
        self.data = data
        self.count = count or len(data)


class LocalClient:
    """本地存储客户端，接口与 SupabaseClient 一致"""
    def table(self, table_name: str) -> LocalTable:
        return LocalTable(table_name)


# 全局客户端实例
supabase = LocalClient()
