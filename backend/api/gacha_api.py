"""
抽卡 API 路由
提供抽卡（单抽/十连）、抽卡记录查询等接口
"""
import logging
from fastapi import APIRouter, HTTPException
from schema.gacha_schema import (
    DrawRequest, DrawResponse, CardResponse,
    GenerateImageRequest, GenerateImageResponse,
)
from service.gacha_service import GachaService
from repository.user_repo import UserRepository
from repository.card_repo import CardRepository

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/gacha/draw", response_model=DrawResponse)
async def draw(request: DrawRequest):
    """
    执行抽卡
    单抽消耗 99 星豆，十连消耗 890 星豆
    十连保底 SR，90 抽大保底 SSR
    """
    try:
        cards, user = GachaService.draw(
            user_id=request.user_id,
            template_id=request.template_id,
            draw_type=request.draw_type,
        )

        card_responses = [
            CardResponse(
                id=c.get("id", ""),
                name=c.get("name", ""),
                rarity=c.get("rarity", "N"),
                image_url=c.get("image_url", ""),
                artist_id=c.get("artist_id", ""),
                series=c.get("series", ""),
                obtained_at=c.get("obtained_at", ""),
                is_duplicate=c.get("is_duplicate", False),
                fragments_gained=c.get("fragments_gained", 0),
            )
            for c in cards
        ]

        return DrawResponse(
            cards=card_responses,
            remaining_star_beans=user.get("star_beans", 0),
            remaining_fragments=user.get("fragments", 0),
            total_pulls=user.get("total_pulls", 0),
            pulls_since_last_ssr=user.get("pulls_since_last_ssr", 0),
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"抽卡异常: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail="抽卡失败，请稍后重试"
        )


@router.get("/gacha/cards/{user_id}")
async def get_user_cards(user_id: str, rarity: str = ""):
    """获取用户卡牌集合"""
    if rarity:
        cards = CardRepository.get_user_cards_by_rarity(user_id, rarity)
    else:
        cards = CardRepository.get_user_cards(user_id)
    return {"cards": cards, "total": len(cards)}


@router.get("/gacha/records/{user_id}")
async def get_gacha_records(user_id: str):
    """获取用户抽卡进度信息"""
    user = UserRepository.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return {
        "total_pulls": user.get("total_pulls", 0),
        "pulls_since_last_ssr": user.get("pulls_since_last_ssr", 0),
        "next_ssr_guaranteed_in": max(
            0, 90 - user.get("pulls_since_last_ssr", 0)
        ),
    }


@router.post("/gacha/generate-image", response_model=GenerateImageResponse)
async def generate_card_image(request: GenerateImageRequest):
    """
    按需为指定卡牌生成 AI 合照
    用户抽卡后可选择「立即生成」或「存入卡包后再生成」
    """
    try:
        card = GachaService.generate_card_image(
            card_id=request.card_id,
            user_id=request.user_id,
            mode=request.mode,
            user_photo=request.user_photo,
        )
        return GenerateImageResponse(
            card_id=card.get("id", ""),
            image_url=card.get("image_url", ""),
            rarity=card.get("rarity", "N"),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"生成合照异常: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail="合照生成失败，请稍后重试"
        )
