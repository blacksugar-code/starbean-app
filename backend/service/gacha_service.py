"""
抽卡核心业务逻辑层
实现概率计算、保底机制、碎片分解等核心玩法

关键规则（来自 PRD）：
- 基础掉率: N=70%, R=20%, SR=8%, SSR=2%
- 十连保底: 10 连抽必出至少 1 张 SR
- 软保底: 30 抽未出 SSR 则掉率逐步递增
- 大保底: 90 抽必出 SSR，中途抽到 SSR 重置
- 重复卡分解: N=1碎片, R=5碎片, SR=20碎片, SSR=50碎片

NOTE: draw 方法只做概率计算+扣费（毫秒级），不做图片生成。
      图片生成改为按需调用 generate_card_image。
"""
import uuid
import random
import logging
from typing import List, Dict, Any, Tuple
from repository.user_repo import UserRepository
from repository.card_repo import CardRepository
from repository.artist_repo import TemplateRepository
from service.seedream_service import SeedreamService

logger = logging.getLogger(__name__)

# 定价常量
SINGLE_DRAW_COST = 99
TEN_DRAW_COST = 890

# 基础掉率
BASE_RATES = {
    "SSR": 0.02,
    "SR": 0.08,
    "R": 0.20,
    "N": 0.70,
}

# 重复卡碎片分解规则
DUPLICATE_FRAGMENTS = {
    "N": 1,
    "R": 5,
    "SR": 20,
    "SSR": 50,
}

# 保底参数
SOFT_PITY_START = 30
HARD_PITY = 90
SR_GUARANTEE_IN_TEN = True


class GachaService:
    """抽卡核心服务"""

    @staticmethod
    def _calculate_ssr_rate(pulls_since_last_ssr: int) -> float:
        """
        计算当前 SSR 掉率
        30 抽后开始递增，90 抽时达到 100%
        """
        if pulls_since_last_ssr < SOFT_PITY_START:
            return BASE_RATES["SSR"]

        if pulls_since_last_ssr >= HARD_PITY:
            return 1.0

        extra_pulls = pulls_since_last_ssr - SOFT_PITY_START
        max_extra = HARD_PITY - SOFT_PITY_START
        rate = BASE_RATES["SSR"] + (1.0 - BASE_RATES["SSR"]) * (
            extra_pulls / max_extra
        )
        return min(rate, 1.0)

    @staticmethod
    def _roll_rarity(pulls_since_last_ssr: int) -> str:
        """根据当前保底进度随机生成稀有度"""
        ssr_rate = GachaService._calculate_ssr_rate(pulls_since_last_ssr)
        rand = random.random()

        if rand < ssr_rate:
            return "SSR"

        remaining = 1.0 - ssr_rate
        sr_rate = BASE_RATES["SR"] / (1.0 - BASE_RATES["SSR"]) * remaining
        r_rate = BASE_RATES["R"] / (1.0 - BASE_RATES["SSR"]) * remaining

        if rand < ssr_rate + sr_rate:
            return "SR"
        elif rand < ssr_rate + sr_rate + r_rate:
            return "R"
        else:
            return "N"

    @staticmethod
    def _parse_rarity_prompt(template_prompt: str, rarity: str) -> str:
        """
        从合并格式的 prompt 中提取对应等级的内容
        合并格式示例: N:xxx||R:xxx||SR:xxx||SSR:xxx
        """
        if "||" in template_prompt:
            segments = template_prompt.split("||")
            for seg in segments:
                parts = seg.split(":", 1)
                if len(parts) == 2 and parts[0].strip().upper() == rarity.upper():
                    return parts[1].strip()
        return template_prompt

    @staticmethod
    def draw(
        user_id: str, template_id: str, draw_type: str
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        执行抽卡（快速版 — 毫秒级响应）

        只做：概率计算、扣费、写入卡牌元数据（image_url 为空）
        不做：AI 图片生成（改为按需调用 generate_card_image）

        返回: (卡牌列表, 更新后的用户信息)
        """
        template = TemplateRepository.get_by_id(template_id)
        if not template:
            raise ValueError("模板不存在")

        is_ten = draw_type == "ten"
        draw_count = 10 if is_ten else 1
        single_price = template.get("single_draw_price", SINGLE_DRAW_COST)
        ten_price = template.get("ten_draw_price", TEN_DRAW_COST)
        cost = ten_price if is_ten else single_price

        user = UserRepository.get_by_id(user_id)
        if not user:
            raise ValueError("用户不存在")

        if user.get("star_beans", 0) < cost:
            raise ValueError(
                f"星豆不足，需要 {cost} 星豆，当前余额 {user.get('star_beans', 0)}"
            )

        template_title = template.get("title", "合拍")
        pulls_since_last_ssr = user.get("pulls_since_last_ssr", 0)
        total_pulls = user.get("total_pulls", 0)

        # 扣除星豆
        updated_user = UserRepository.update_currency(
            user_id, star_beans_delta=-cost
        )
        if not updated_user:
            raise ValueError("扣费失败，请重试")

        # 计算每张卡的稀有度并写入数据库（不生成图片）
        result_cards: List[Dict[str, Any]] = []
        has_sr_or_better = False
        current_pulls = pulls_since_last_ssr
        current_total = total_pulls
        total_fragments_gained = 0

        for i in range(draw_count):
            rarity = GachaService._roll_rarity(current_pulls)
            if is_ten and i == 9 and not has_sr_or_better:
                rarity = "SR"

            current_pulls += 1
            current_total += 1
            if rarity == "SSR":
                current_pulls = 0
            if rarity in ("SR", "SSR"):
                has_sr_or_better = True

            card_id = str(uuid.uuid4())
            card_name = f"{template_title}-{rarity}-{i + 1}"

            is_dupe = CardRepository.check_duplicate(
                user_id, card_name, rarity
            )
            frag_gained = DUPLICATE_FRAGMENTS.get(rarity, 1) if is_dupe else 0
            total_fragments_gained += frag_gained

            # NOTE: image_url 为空，后续用户选择「立即生成」时再填充
            card_data = {
                "id": card_id,
                "user_id": user_id,
                "name": card_name,
                "rarity": rarity,
                "image_url": "",
                "artist_id": template_id,
                "series": f"Series-{template_title}",
                "obtained_at": "now()",
            }

            saved_card = CardRepository.create(card_data)
            result_cards.append({
                **saved_card,
                "is_duplicate": is_dupe,
                "fragments_gained": frag_gained,
            })

        # 更新保底进度和碎片
        update_data: Dict[str, Any] = {
            "pulls_since_last_ssr": current_pulls,
            "total_pulls": current_total,
        }
        if total_fragments_gained > 0:
            current_fragments = updated_user.get("fragments", 0)
            update_data["fragments"] = current_fragments + total_fragments_gained

        final_user = UserRepository.update(user_id, update_data)

        return result_cards, final_user or updated_user

    @staticmethod
    def generate_card_image(
        card_id: str,
        user_id: str,
        mode: str = "avatar",
        user_photo: str | None = None,
    ) -> Dict[str, Any]:
        """
        为指定卡牌生成 AI 合照（按需调用，耗时较长）

        @param mode avatar=虚拟形象合照, photo=照片合拍
        @param user_photo base64 data URI（photo 模式用）
        """
        # 获取卡牌
        card = CardRepository.get_by_id(card_id)
        if not card:
            raise ValueError("卡牌不存在")
        if card.get("user_id") != user_id:
            raise ValueError("无权操作此卡牌")

        # avatar 模式：已有真实图片则跳过（picsum 占位图除外）
        # photo 模式：每次都重新生成（用户可能换照片）
        if mode == "avatar":
            existing_url = card.get("image_url", "")
            if existing_url and "picsum.photos" not in existing_url:
                return card

        # 获取模板信息
        template_id = card.get("artist_id", "")
        template = TemplateRepository.get_by_id(template_id)
        if not template:
            raise ValueError("模板不存在")

        # 获取用户信息
        user = UserRepository.get_by_id(user_id)
        if not user:
            raise ValueError("用户不存在")

        rarity = card.get("rarity", "N")
        template_prompt = template.get("template_prompt", "")
        rarity_prompt = GachaService._parse_rarity_prompt(
            template_prompt, rarity
        )
        artist_ref_images = template.get("artist_ref_images", [])

        # 调用 AI 生图（双模式）
        fusion = SeedreamService.generate_fusion_image(
            user.get("avatar_url", ""),
            artist_ref_images,
            rarity_prompt,
            rarity,
            mode=mode,
            user_photo_b64=user_photo,
        )

        image_url = fusion.get("image_url", "")
        # NOTE: 优先使用 data URI，确保线上部署不依赖临时磁盘
        image_b64 = fusion.get("image_b64", "")
        save_url = image_b64 if image_b64 else image_url

        # 更新卡牌图片 URL
        updated_card = CardRepository.update(card_id, {"image_url": save_url})

        return updated_card or {**card, "image_url": save_url}
