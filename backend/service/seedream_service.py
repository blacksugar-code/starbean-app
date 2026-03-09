"""
豆包 SeedReam 5.0 AI 生图服务层
通过火山方舟 OpenAI 兼容接口进行数字形象生成和合照生成

NOTE: 统一使用 httpx 直接调用火山方舟接口
"""
import os
import uuid
import base64
import logging
import httpx
from typing import Dict, Any, List, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

# 上传文件保存目录
UPLOADS_DIR = Path(__file__).parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# 火山方舟 API 配置
ARK_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3"
ARK_MODEL = "doubao-seedream-5-0-260128"

# 数字形象生成提示词
AVATAR_GENERATION_PROMPT = (
    "根据图片中人物的五官，生成一个灰色背景的人物图片。"
    "精致、美化、高颜值、自然，近景、大师级构图，大师级灯光，柔光。"
    "上半身，模特姿势。"
)


def _get_ark_api_key() -> str:
    """
    获取火山方舟 API Key
    未配置时直接抛异常，不降级
    """
    api_key = os.getenv("ARK_API_KEY", "")
    if not api_key:
        raise ValueError("ARK_API_KEY 未配置，无法调用 AI 生图服务")
    return api_key


def _image_path_to_base64(path: str) -> str:
    """将本地图片路径转为 base64 data URI，压缩到合理尺寸"""
    from PIL import Image
    import io

    try:
        img = Image.open(path)
        img = img.convert("RGB")
        img.thumbnail((768, 768))
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=85)
        img_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/jpeg;base64,{img_b64}"
    except Exception:
        # 降级：直接读取文件
        with open(path, "rb") as f:
            img_b64 = base64.b64encode(f.read()).decode("utf-8")
        return f"data:image/jpeg;base64,{img_b64}"


def _url_to_base64(url: str, max_size: int = 768) -> Optional[str]:
    """将本地路径或网络 URL 的图片转码为 data URI Base64"""
    if not url:
        return None

    try:
        from PIL import Image
        import io

        img = None
        if url.startswith("/api/uploads/") or url.startswith("/uploads/"):
            filename = url.split("/")[-1]
            local_path = UPLOADS_DIR / filename
            if local_path.exists():
                img = Image.open(local_path)
        elif url.startswith("http://") or url.startswith("https://"):
            resp = httpx.get(url, timeout=10.0)
            if resp.status_code == 200:
                img = Image.open(io.BytesIO(resp.content))

        if not img:
            return None

        img = img.convert("RGB")
        img.thumbnail((max_size, max_size))
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=85)
        img_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/jpeg;base64,{img_b64}"
    except Exception as e:
        logger.warning(f"URL 转换 Base64 失败 [{url}]: {e}")
        return None


def _call_seedream_api(
    prompt: str,
    images: List[str],
    api_key: str,
) -> Dict[str, Any]:
    """
    统一调用豆包 SeedReam 5.0 API

    @param prompt 生成提示词
    @param images base64 data URI 图片列表
    @param api_key 火山方舟 API Key
    @returns API 响应 JSON
    """
    request_body: Dict[str, Any] = {
        "model": ARK_MODEL,
        "prompt": prompt,
        "image": images,
        "response_format": "url",
        "size": "2K",
        "stream": False,
        "n": 1,
    }

    logger.info(f"调用 SeedReam API，图片数={len(images)}，prompt={prompt[:50]}...")

    response = httpx.post(
        f"{ARK_BASE_URL}/images/generations",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=request_body,
        timeout=120.0,
    )

    if response.status_code != 200:
        error_detail = response.text[:500]
        logger.error(f"SeedReam API 错误 {response.status_code}: {error_detail}")
        raise ValueError(f"SeedReam API 返回错误 (HTTP {response.status_code})")

    result = response.json()
    data_list = result.get("data", [])
    if not data_list:
        raise ValueError("SeedReam API 未返回图片数据")

    return data_list[0]


def _save_remote_image(image_url: str, filename: str) -> str:
    """下载远程图片保存到本地 uploads 目录，返回本地路径"""
    try:
        img_resp = httpx.get(image_url, timeout=30.0)
        img_resp.raise_for_status()
        save_path = UPLOADS_DIR / filename
        with open(save_path, "wb") as f:
            f.write(img_resp.content)
        logger.info(f"图片已保存到本地: {filename}")
        return f"/uploads/{filename}"
    except Exception as e:
        logger.warning(f"下载远程图片失败，直接使用 URL: {e}")
        return image_url


class SeedreamService:
    """
    豆包 SeedReam 5.0 AI 生图服务
    提供：数字形象生成 + 合照融合生成
    统一使用火山方舟 API，不做 Mock 降级
    """

    @staticmethod
    def generate_user_avatar(
        photo_paths: List[str], style: str = "realistic"
    ) -> Dict[str, Any]:
        """
        生成用户数字形象
        调用豆包 SeedReam API，基于用户上传的照片生成 AI 形象

        @param photo_paths 用户上传的照片文件路径列表
        @param style 生成风格（预留扩展）
        @returns 包含 id, image_url, status 的字典
        """
        api_key = _get_ark_api_key()

        # 将照片转为 base64
        image_list: List[str] = []
        for path in photo_paths:
            try:
                b64 = _image_path_to_base64(path)
                image_list.append(b64)
            except Exception as e:
                logger.warning(f"无法读取照片 {path}: {e}")
                continue

        if not image_list:
            raise ValueError("没有可用的参考照片")

        # 调用统一 API
        result = _call_seedream_api(
            prompt=AVATAR_GENERATION_PROMPT,
            images=image_list,
            api_key=api_key,
        )

        avatar_id = str(uuid.uuid4())

        # 解析响应
        image_url = result.get("url", "")
        if image_url:
            local_url = _save_remote_image(image_url, f"avatar_{avatar_id}.png")
            return {"id": avatar_id, "image_url": local_url, "status": "success"}

        # 备用：b64_json
        image_b64 = result.get("b64_json", "")
        if image_b64:
            image_data = base64.b64decode(image_b64)
            filename = f"avatar_{avatar_id}.png"
            save_path = UPLOADS_DIR / filename
            with open(save_path, "wb") as f:
                f.write(image_data)
            return {"id": avatar_id, "image_url": f"/uploads/{filename}", "status": "success"}

        raise ValueError("SeedReam API 响应中无图片数据")

    @staticmethod
    def generate_fusion_image(
        user_avatar_url: str,
        artist_ref_images: List[str],
        template_prompt: str,
        rarity: str,
        mode: str = "avatar",
        user_photo_b64: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        生成合照（双模式）

        模式 avatar — 用户虚拟形象 + 明星参考图 → 合照
          图片顺序: [用户虚拟形象, 明星参考图...]
          prompt: 根据用户形象和明星形象生成双人合照

        模式 photo — 明星参考图 + 用户上传照片 → 将明星融入用户照片
          图片顺序: [明星参考图, 用户上传照片]
          prompt: 将明星人物融入到用户提供的照片场景中

        @param user_avatar_url 用户虚拟形象 URL（avatar 模式用）
        @param artist_ref_images 艺人参考图 URL 列表
        @param template_prompt 模板提示词（按等级区分）
        @param rarity 卡牌等级 N/R/SR/SSR
        @param mode 生成模式 avatar | photo
        @param user_photo_b64 用户上传的照片 base64（photo 模式用）
        @returns 包含 id, image_url, status 的字典
        """
        api_key = _get_ark_api_key()
        fusion_id = str(uuid.uuid4())

        # 稀有度画质增强标签
        rarity_tags = {
            "N": "自然画质, 日常感",
            "R": "电影感, 胶片画风",
            "SR": "梦幻光斑, 唯美写实, 8K高清",
            "SSR": "大师级摄影, 极致细节, 特写构图, 史诗级画面, 16K超清",
        }

        b64_images: List[str] = []

        if mode == "photo":
            # ===== 照片合拍模式 =====
            # 图片顺序：[明星参考图, 用户上传照片]
            # NOTE: 明星参考图在前，让 AI 先学习明星特征
            for url in (artist_ref_images or [])[:2]:
                b64 = _url_to_base64(url)
                if b64:
                    b64_images.append(b64)

            if not b64_images:
                raise ValueError("合照生成失败：明星参考图无法加载")

            # 用户上传的照片
            if not user_photo_b64:
                raise ValueError("照片合拍模式需要上传照片")
            # 如果已经是 data URI 格式直接用，否则加前缀
            if not user_photo_b64.startswith("data:"):
                user_photo_b64 = f"data:image/jpeg;base64,{user_photo_b64}"
            b64_images.append(user_photo_b64)

            final_prompt = (
                f"{template_prompt}，{rarity_tags.get(rarity, '')}。"
                "请将明星参考图中的人物（图1）融入到用户提供的照片（图2）中，"
                "保持明星五官与发型特征不变，自然地与用户同框合照。"
                "保持用户照片的场景和构图，让明星自然地出现在画面中。"
            )
        else:
            # ===== 虚拟形象模式（默认） =====
            # 图片顺序：[用户虚拟形象, 明星参考图...]
            user_b64 = _url_to_base64(user_avatar_url)
            if user_b64:
                b64_images.append(user_b64)

            for url in (artist_ref_images or [])[:3]:
                b64 = _url_to_base64(url)
                if b64:
                    b64_images.append(b64)

            if len(b64_images) < 2:
                raise ValueError(
                    f"合照生成失败：有效参考图不足（{len(b64_images)}/2），"
                    "请检查用户头像和明星参考图"
                )

            final_prompt = (
                f"{template_prompt}，{rarity_tags.get(rarity, '')}。"
                "请根据提供的用户个人形象（图1）和明星参考图（后续图片），"
                "保持两人五官与发型特征，生成一张完美的双人唯美合照。"
            )

        logger.info(
            f"SeedReam 合照生成 mode={mode}, rarity={rarity}, "
            f"图片数={len(b64_images)}"
        )

        # 调用统一 API
        try:
            result = _call_seedream_api(
                prompt=final_prompt,
                images=b64_images,
                api_key=api_key,
            )
        except httpx.TimeoutException:
            raise ValueError("AI 生图超时，请稍后重试")

        # 解析响应
        image_url = result.get("url", "")
        if image_url:
            local_url = _save_remote_image(
                image_url, f"fusion_{fusion_id}.png"
            )
            if local_url.startswith("/uploads/"):
                local_url = f"/api{local_url}"
            return {"id": fusion_id, "image_url": local_url, "status": "success"}

        raise ValueError("AI 生图返回的图片 URL 为空")
