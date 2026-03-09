"""
AI 生图服务层 — 基于 Google Gemini Imagen API
提供：数字形象生成 + 合照融合生成

NOTE: 保持 SeedreamService 类名和方法签名不变，方便其他模块无感切换
"""
import os
import uuid
import base64
import logging
import io
from typing import Dict, Any, List, Optional
from pathlib import Path
from PIL import Image

logger = logging.getLogger(__name__)

# 上传文件保存目录
UPLOADS_DIR = Path(__file__).parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# 数字形象生成提示词
AVATAR_GENERATION_PROMPT = (
    "根据图片中人物的五官，生成一个灰色背景的人物图片。"
    "精致、美化、高颜值、自然，近景、大师级构图，大师级灯光，柔光。"
    "上半身，模特姿势。"
)


def _get_gemini_client():
    """
    获取 Google Gemini 客户端
    使用 google-genai SDK
    """
    from google import genai

    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise ValueError("GEMINI_API_KEY 未配置，无法调用 AI 生图服务")

    client = genai.Client(api_key=api_key)
    return client


def _load_image_bytes(path_or_url: str) -> Optional[bytes]:
    """
    从本地路径、URL 或 data URI 加载图片字节数据
    自动识别 data URI、/uploads/ 路径和网络 URL
    """
    import httpx

    if not path_or_url:
        return None

    try:
        # data URI 格式：直接解码 base64
        if path_or_url.startswith("data:"):
            b64_part = path_or_url.split(",", 1)[-1]
            return base64.b64decode(b64_part)
        elif path_or_url.startswith("/api/uploads/") or path_or_url.startswith("/uploads/"):
            filename = path_or_url.split("/")[-1]
            local_path = UPLOADS_DIR / filename
            if local_path.exists():
                return local_path.read_bytes()
        elif path_or_url.startswith("http://") or path_or_url.startswith("https://"):
            resp = httpx.get(path_or_url, timeout=15.0)
            if resp.status_code == 200:
                return resp.content
        elif os.path.exists(path_or_url):
            with open(path_or_url, "rb") as f:
                return f.read()
    except Exception as e:
        logger.warning(f"加载图片失败 [{path_or_url[:50]}]: {e}")

    return None


def _compress_image(img_bytes: bytes, max_size: int = 768) -> bytes:
    """压缩图片到合理尺寸"""
    try:
        img = Image.open(io.BytesIO(img_bytes))
        img = img.convert("RGB")
        img.thumbnail((max_size, max_size))
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=85)
        return buffer.getvalue()
    except Exception:
        return img_bytes


def _save_image_bytes(img_bytes: bytes, filename: str) -> str:
    """将图片字节保存到 uploads 目录，返回本地 URL"""
    save_path = UPLOADS_DIR / filename
    with open(save_path, "wb") as f:
        f.write(img_bytes)
    logger.info(f"图片已保存: {filename}")
    return f"/uploads/{filename}"


def _call_gemini_generate(
    prompt: str,
    reference_images: List[bytes],
) -> bytes:
    """
    调用 Gemini API 生成图片

    使用 gemini-2.0-flash-exp 模型进行多模态图片生成
    传入参考图片 + 文字 prompt，返回生成的图片字节

    @param prompt 生成提示词
    @param reference_images 参考图片字节列表
    @returns 生成的图片字节数据
    """
    from google import genai
    from google.genai import types

    client = _get_gemini_client()

    # 构建多模态内容：先放参考图片，再放文字 prompt
    parts = []
    for idx, img_bytes in enumerate(reference_images):
        compressed = _compress_image(img_bytes)
        parts.append(
            types.Part.from_bytes(
                data=compressed,
                mime_type="image/jpeg",
            )
        )
    parts.append(types.Part.from_text(text=prompt))

    logger.info(
        f"调用 Gemini API，图片数={len(reference_images)}，"
        f"prompt长度={len(prompt)}，prompt={prompt[:80]}..."
    )

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp-image-generation",
            contents=parts,
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            ),
        )
    except Exception as e:
        logger.error(f"Gemini API 调用失败: {e}")
        raise ValueError(f"AI 生图失败: {e}")

    # 从响应中提取图片
    if response.candidates:
        for candidate in response.candidates:
            if candidate.content and candidate.content.parts:
                for part in candidate.content.parts:
                    if part.inline_data and part.inline_data.mime_type and part.inline_data.mime_type.startswith("image/"):
                        return part.inline_data.data

    raise ValueError("Gemini API 未返回图片数据，请检查 prompt 或重试")


class SeedreamService:
    """
    AI 生图服务（已切换为 Google Gemini Imagen）
    保持原有接口签名，方便其他模块无感切换
    提供：数字形象生成 + 合照融合生成
    """

    @staticmethod
    def generate_user_avatar(
        photo_paths: List[str], style: str = "realistic"
    ) -> Dict[str, Any]:
        """
        生成用户数字形象
        基于用户上传的照片，调用 Gemini API 生成 AI 形象

        @param photo_paths 用户上传的照片文件路径列表
        @param style 生成风格（预留扩展）
        @returns 包含 id, image_url, status 的字典
        """
        # 加载参考照片
        ref_images: List[bytes] = []
        for path in photo_paths:
            try:
                img_bytes = _load_image_bytes(path)
                if img_bytes:
                    ref_images.append(img_bytes)
            except Exception as e:
                logger.warning(f"无法读取照片 {path}: {e}")
                continue

        if not ref_images:
            raise ValueError("没有可用的参考照片")

        # 调用 Gemini 生成
        result_bytes = _call_gemini_generate(
            prompt=AVATAR_GENERATION_PROMPT,
            reference_images=ref_images,
        )

        avatar_id = str(uuid.uuid4())
        filename = f"avatar_{avatar_id}.png"
        local_url = _save_image_bytes(result_bytes, filename)

        # NOTE: 同时返回 data URI，线上部署不依赖磁盘文件
        b64_str = base64.b64encode(result_bytes).decode("utf-8")
        data_uri = f"data:image/png;base64,{b64_str}"

        return {
            "id": avatar_id,
            "image_url": local_url,
            "image_b64": data_uri,
            "status": "success",
        }

    @staticmethod
    def generate_fusion_image(
        user_avatar_url: str,
        artist_ref_images: List[str],
        template_prompt: str,
        rarity: str,
        mode: str = "photo",
        user_photo_b64: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        生成合照 — 仅支持照片合拍模式

        图片顺序（严格）：
          图片1 = 用户上传的照片（先传，被 prompt 识别为"图片1"）
          图片2 = 明星参考图（后传，被 prompt 识别为"图片2"）

        @param user_avatar_url 保留参数兼容性（不再使用）
        @param artist_ref_images 艺人参考图 URL 列表
        @param template_prompt 已按等级解析的 prompt（直接使用）
        @param rarity 卡牌等级 N/R/SR/SSR
        @param mode 保留参数兼容性（始终为 photo）
        @param user_photo_b64 用户上传的照片 base64
        @returns 包含 id, image_url, image_b64, status 的字典
        """
        fusion_id = str(uuid.uuid4())
        ref_images: List[bytes] = []

        # ===== 图片1：用户上传的照片（必须第一个传入） =====
        if not user_photo_b64:
            raise ValueError("请上传一张你的照片进行合拍")

        if user_photo_b64.startswith("data:"):
            user_photo_b64 = user_photo_b64.split(",", 1)[-1]
        user_photo_bytes = base64.b64decode(user_photo_b64)
        ref_images.append(user_photo_bytes)

        # ===== 图片2：明星参考图（第二个传入） =====
        artist_loaded = False
        for url in (artist_ref_images or [])[:2]:
            img_bytes = _load_image_bytes(url)
            if img_bytes:
                ref_images.append(img_bytes)
                artist_loaded = True
                break  # 只需要一张明星参考图

        if not artist_loaded:
            raise ValueError("合照生成失败：明星参考图无法加载")

        # prompt 直接使用模板中按等级解析的内容（不额外拼接）
        final_prompt = template_prompt

        logger.info(
            f"Gemini 合照生成 rarity={rarity}, "
            f"图片数={len(ref_images)}, prompt长度={len(final_prompt)}"
        )

        # 调用 Gemini API
        try:
            result_bytes = _call_gemini_generate(
                prompt=final_prompt,
                reference_images=ref_images,
            )
        except Exception as e:
            if "timeout" in str(e).lower():
                raise ValueError("AI 生图超时，请稍后重试")
            raise

        # 保存到本地（本地开发用）
        filename = f"fusion_{fusion_id}.png"
        local_url = _save_image_bytes(result_bytes, filename)
        if local_url.startswith("/uploads/"):
            local_url = f"/api{local_url}"

        # NOTE: 同时返回 data URI，线上部署不依赖磁盘文件
        b64_str = base64.b64encode(result_bytes).decode("utf-8")
        data_uri = f"data:image/png;base64,{b64_str}"

        return {
            "id": fusion_id,
            "image_url": local_url,
            "image_b64": data_uri,
            "status": "success",
        }

