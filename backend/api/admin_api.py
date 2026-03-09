"""
后台管理 API
提供 Banner、明星、用户管理的 CRUD 接口
"""
import os
import uuid
import json
import logging
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

logger = logging.getLogger(__name__)
router = APIRouter()

DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

BANNERS_FILE = DATA_DIR / "banners.json"
ARTISTS_FILE = DATA_DIR / "artists.json"


def _load_json(filepath: Path) -> list:
    if not filepath.exists():
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_json(filepath: Path, data: list) -> None:
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ==================== Banner ====================

class BannerCreate(BaseModel):
    image_url: str
    link_url: str = ""
    sort_order: int = 0


class BannerUpdate(BaseModel):
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    sort_order: Optional[int] = None


@router.get("/admin/banners")
async def get_banners():
    banners = _load_json(BANNERS_FILE)
    banners.sort(key=lambda x: x.get("sort_order", 0))
    return banners


@router.post("/admin/banners")
async def create_banner(req: BannerCreate):
    banners = _load_json(BANNERS_FILE)
    banner = {
        "id": str(uuid.uuid4()),
        "image_url": req.image_url,
        "link_url": req.link_url,
        "sort_order": req.sort_order,
        "is_active": True,
        "created_at": datetime.now().isoformat(),
    }
    banners.append(banner)
    _save_json(BANNERS_FILE, banners)
    return banner


@router.put("/admin/banners/{banner_id}")
async def update_banner(banner_id: str, req: BannerUpdate):
    banners = _load_json(BANNERS_FILE)
    for b in banners:
        if b["id"] == banner_id:
            if req.image_url is not None:
                b["image_url"] = req.image_url
            if req.link_url is not None:
                b["link_url"] = req.link_url
            if req.sort_order is not None:
                b["sort_order"] = req.sort_order
            _save_json(BANNERS_FILE, banners)
            return b
    raise HTTPException(status_code=404, detail="Banner 不存在")


@router.delete("/admin/banners/{banner_id}")
async def delete_banner(banner_id: str):
    banners = _load_json(BANNERS_FILE)
    banners = [b for b in banners if b["id"] != banner_id]
    _save_json(BANNERS_FILE, banners)
    return {"detail": "删除成功"}


# ==================== 明星 ====================

class ArtistCreate(BaseModel):
    name: str
    avatar_url: str = ""
    description: str = ""


class ArtistUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    description: Optional[str] = None


@router.get("/admin/artists")
async def get_artists():
    artists = _load_json(ARTISTS_FILE)
    # 计算每个明星关联的模板数
    templates = _load_json(DATA_DIR / "templates.json")
    for a in artists:
        a["template_count"] = sum(
            1 for t in templates if t.get("artist_name") == a["name"]
        )
    return artists


@router.post("/admin/artists")
async def create_artist(req: ArtistCreate):
    artists = _load_json(ARTISTS_FILE)
    artist = {
        "id": str(uuid.uuid4()),
        "name": req.name,
        "avatar_url": req.avatar_url,
        "description": req.description,
        "created_at": datetime.now().isoformat(),
    }
    artists.append(artist)
    _save_json(ARTISTS_FILE, artists)
    return artist


@router.put("/admin/artists/{artist_id}")
async def update_artist(artist_id: str, req: ArtistUpdate):
    artists = _load_json(ARTISTS_FILE)
    for a in artists:
        if a["id"] == artist_id:
            if req.name is not None:
                a["name"] = req.name
            if req.avatar_url is not None:
                a["avatar_url"] = req.avatar_url
            if req.description is not None:
                a["description"] = req.description
            _save_json(ARTISTS_FILE, artists)
            return a
    raise HTTPException(status_code=404, detail="明星不存在")


@router.delete("/admin/artists/{artist_id}")
async def delete_artist(artist_id: str):
    artists = _load_json(ARTISTS_FILE)
    artists = [a for a in artists if a["id"] != artist_id]
    _save_json(ARTISTS_FILE, artists)
    return {"detail": "删除成功"}


# ==================== 用户管理 ====================

@router.get("/admin/users")
async def get_all_users():
    return _load_json(DATA_DIR / "users.json")


class UpdateBeansRequest(BaseModel):
    star_beans: int


@router.put("/admin/users/{user_id}/beans")
async def update_user_beans(user_id: str, req: UpdateBeansRequest):
    """后台修改用户星豆余额"""
    users = _load_json(DATA_DIR / "users.json")
    for u in users:
        if u["id"] == user_id:
            u["star_beans"] = req.star_beans
            _save_json(DATA_DIR / "users.json", users)
            return u
    raise HTTPException(status_code=404, detail="用户不存在")


@router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str):
    users = _load_json(DATA_DIR / "users.json")
    users = [u for u in users if u["id"] != user_id]
    _save_json(DATA_DIR / "users.json", users)
    return {"detail": "删除成功"}
