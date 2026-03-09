"""
种子数据注入脚本
用于初始化测试艺人、模板、提示词、用户和社区帖子数据

使用方法: cd backend && python seed_data.py
"""
import uuid
import logging
from database import supabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_artists():
    """注入测试艺人数据"""
    artists = [
        {
            "id": "artist_1",
            "name": "Jay Chou",
            "avatar_url": "https://picsum.photos/seed/jay/200",
            "fans_count": "1.2M",
            "is_published": True,
        },
        {
            "id": "artist_2",
            "name": "Yang Mi",
            "avatar_url": "https://picsum.photos/seed/yang/200",
            "fans_count": "980K",
            "is_published": True,
        },
        {
            "id": "artist_3",
            "name": "Jackson Yee",
            "avatar_url": "https://picsum.photos/seed/jackson/200",
            "fans_count": "856K",
            "is_published": True,
        },
        {
            "id": "artist_4",
            "name": "Zhao Liying",
            "avatar_url": "https://picsum.photos/seed/zhao/200",
            "fans_count": "721K",
            "is_published": True,
        },
    ]

    for artist in artists:
        try:
            supabase.table("artists").upsert(artist).execute()
            logger.info(f"✅ 艺人已创建: {artist['name']}")
        except Exception as e:
            logger.warning(f"⚠️ 艺人创建失败: {artist['name']} - {e}")


def seed_templates():
    """注入测试卡池模板数据"""
    templates = [
        {
            "id": "template_1",
            "title": "水晶之恋",
            "series": "极光系列",
            "description": "在极光的见证下，许下永恒的誓言。水晶般的纯净，只为此刻的相遇。",
            "image_url": "https://picsum.photos/seed/crystal/800/1000",
            "artist_id": "artist_1",
            "rarity": "SSR",
            "issue_count": "12k",
            "rarity_rates": {"N": "70%", "R": "20%", "SR": "8%", "SSR": "2%"},
            "tags": ["唯美", "浪漫", "极光"],
            "rarity_color": "text-pink-500",
        },
        {
            "id": "template_2",
            "title": "午夜低语",
            "series": "暗夜印记",
            "description": "夜色温柔，星光低语。在午夜的街头，寻找那一份独特的悸动。",
            "image_url": "https://picsum.photos/seed/midnight/800/1000",
            "artist_id": "artist_2",
            "rarity": "SR",
            "issue_count": "45k",
            "rarity_rates": {"N": "70%", "R": "20%", "SR": "8%", "SSR": "2%"},
            "tags": ["神秘", "都市", "暗夜"],
            "rarity_color": "text-purple-500",
        },
        {
            "id": "template_3",
            "title": "春日花信",
            "series": "繁花系列",
            "description": "春风拂面，花香袭人。在花海中漫步，感受春天的气息。",
            "image_url": "https://picsum.photos/seed/spring/800/1000",
            "artist_id": "artist_3",
            "rarity": "R",
            "issue_count": "120k",
            "rarity_rates": {"N": "70%", "R": "20%", "SR": "8%", "SSR": "2%"},
            "tags": ["清新", "自然", "花海"],
            "rarity_color": "text-blue-500",
        },
        {
            "id": "template_4",
            "title": "城市脉搏",
            "series": "剪影系列",
            "description": "感受城市的律动，捕捉光影的瞬间。在喧嚣中寻找属于你的宁静。",
            "image_url": "https://picsum.photos/seed/city/800/1000",
            "artist_id": "artist_4",
            "rarity": "SR",
            "issue_count": "30k",
            "rarity_rates": {"N": "70%", "R": "20%", "SR": "8%", "SSR": "2%"},
            "tags": ["现代", "光影", "街拍"],
            "rarity_color": "text-purple-500",
        },
    ]

    for template in templates:
        try:
            supabase.table("templates").upsert(template).execute()
            logger.info(f"✅ 模板已创建: {template['title']}")
        except Exception as e:
            logger.warning(f"⚠️ 模板创建失败: {template['title']} - {e}")


def seed_prompt_templates():
    """注入 Nanobanana 提示词模板"""
    prompts = [
        # N 卡模板
        {
            "id": "prompt_n_1",
            "rarity": "N",
            "name": "N卡基础同框模板1",
            "prompt_text": (
                "photorealistic style, bright natural daylight, outdoor park scene, "
                "two people standing side by side, waving naturally, no physical contact, "
                "clear facial features, natural skin texture, 8K high resolution, "
                "sharp focus, --ar 3:4 --style raw"
            ),
            "is_active": True,
        },
        {
            "id": "prompt_n_2",
            "rarity": "N",
            "name": "N卡基础同框模板2",
            "prompt_text": (
                "casual street style, sunny afternoon, city sidewalk, "
                "two people standing with friendly distance, smiling at camera, "
                "detailed background, 8K resolution, --ar 3:4 --style raw"
            ),
            "is_active": True,
        },
        {
            "id": "prompt_n_3",
            "rarity": "N",
            "name": "N卡基础同框模板3",
            "prompt_text": (
                "campus style, library entrance, soft morning light, "
                "two people holding books, standing side by side, polite smile, "
                "clear details, 8K resolution, --ar 3:4 --style raw"
            ),
            "is_active": True,
        },
        # R 卡模板
        {
            "id": "prompt_r_1",
            "rarity": "R",
            "name": "R卡轻互动模板1",
            "prompt_text": (
                "soft warm aesthetic style, golden hour light, cozy cafe interior scene, "
                "two people standing close, looking at each other, same hand gesture, "
                "no physical contact, soft film grain texture, warm color tone, "
                "8K high resolution, bokeh background, --ar 3:4 --style raw"
            ),
            "is_active": True,
        },
        {
            "id": "prompt_r_2",
            "rarity": "R",
            "name": "R卡轻互动模板2",
            "prompt_text": (
                "art gallery atmosphere, soft spotlight, two people admiring a painting, "
                "side profile view, subtle eye contact, elegant clothing, "
                "8K resolution, --ar 3:4 --style raw"
            ),
            "is_active": True,
        },
        {
            "id": "prompt_r_3",
            "rarity": "R",
            "name": "R卡轻互动模板3",
            "prompt_text": (
                "picnic on grass, dappled sunlight, two people sitting near each other, "
                "laughing, holding drinks, soft focus background, dreamy vibe, "
                "8K resolution, --ar 3:4 --style raw"
            ),
            "is_active": True,
        },
        # SR 卡模板
        {
            "id": "prompt_sr_1",
            "rarity": "SR",
            "name": "SR卡友好互动模板1",
            "prompt_text": (
                "sweet healing style, sunset light, romantic beach scene, "
                "two people doing heart gesture together, hands touching slightly, "
                "soft bokeh light spots, dreamy atmosphere, clear facial features, "
                "natural interaction, 8K high resolution, --ar 3:4 --style raw"
            ),
            "is_active": True,
        },
        {
            "id": "prompt_sr_2",
            "rarity": "SR",
            "name": "SR卡友好互动模板2",
            "prompt_text": (
                "amusement park night, colorful neon lights, "
                "two people sharing cotton candy, leaning towards each other, "
                "joyful expressions, sparkling eyes, 8K resolution, --ar 3:4 --style raw"
            ),
            "is_active": True,
        },
        {
            "id": "prompt_sr_3",
            "rarity": "SR",
            "name": "SR卡友好互动模板3",
            "prompt_text": (
                "snowy winter day, soft falling snow, two people sharing a scarf, "
                "close proximity, warm breath visible, romantic winter vibe, "
                "8K resolution, --ar 3:4 --style raw"
            ),
            "is_active": True,
        },
        # SSR 卡模板
        {
            "id": "prompt_ssr_1",
            "rarity": "SSR",
            "name": "SSR卡典藏级模板1",
            "prompt_text": (
                "cinematic blockbuster style, movie lighting, exclusive luxury rooftop scene, "
                "two people hugging gently, heads touching, high-end fashion style, "
                "diamond-like crystal clear texture, rich details, 8K high resolution, "
                "shallow depth of field, --ar 3:4 --style raw"
            ),
            "is_active": True,
        },
        {
            "id": "prompt_ssr_2",
            "rarity": "SSR",
            "name": "SSR卡典藏级模板2",
            "prompt_text": (
                "fantasy ball gown, grand ballroom, chandelier light, "
                "two people dancing, hand on waist, intense eye contact, "
                "magical sparkles, 8K resolution, --ar 3:4 --style raw"
            ),
            "is_active": True,
        },
        {
            "id": "prompt_ssr_3",
            "rarity": "SSR",
            "name": "SSR卡典藏级模板3",
            "prompt_text": (
                "cyberpunk city night, rain reflections, neon glow, "
                "two people back to back, cool poses, futuristic fashion, "
                "high contrast, cinematic composition, 8K resolution, --ar 3:4 --style raw"
            ),
            "is_active": True,
        },
    ]

    for prompt in prompts:
        try:
            supabase.table("prompt_templates").upsert(prompt).execute()
            logger.info(f"✅ 提示词模板已创建: {prompt['name']}")
        except Exception as e:
            logger.warning(f"⚠️ 提示词创建失败: {prompt['name']} - {e}")


def seed_test_user():
    """注入测试用户"""
    user = {
        "id": "user_123",
        "name": "StarBean User",
        "avatar_url": "",
        "star_beans": 1250,
        "fragments": 25,
        "digital_avatar_generated": False,
        "pulls_since_last_ssr": 0,
        "total_pulls": 0,
    }
    try:
        supabase.table("users").upsert(user).execute()
        logger.info("✅ 测试用户已创建")
    except Exception as e:
        logger.warning(f"⚠️ 测试用户创建失败: {e}")


def seed_posts():
    """注入测试社区帖子"""
    posts = [
        {
            "id": "post_1",
            "user_id": "user_123",
            "content": "Got a new SR card! Look at this lighting ✨",
            "image_url": "https://picsum.photos/seed/post1/400/500",
            "likes_count": 124,
        },
        {
            "id": "post_2",
            "user_id": "user_123",
            "content": "Finally got an SSR! Waited weeks for this series.",
            "image_url": "https://picsum.photos/seed/post2/400/600",
            "likes_count": 892,
        },
        {
            "id": "post_3",
            "user_id": "user_123",
            "content": "Daily check-in. Have a great day everyone 🌸",
            "image_url": "https://picsum.photos/seed/post3/400/400",
            "likes_count": 45,
        },
        {
            "id": "post_4",
            "user_id": "user_123",
            "content": "First draw luck! This outfit is amazing!",
            "image_url": "https://picsum.photos/seed/post4/400/550",
            "likes_count": 2100,
        },
    ]

    for post in posts:
        try:
            supabase.table("posts").upsert(post).execute()
            logger.info(f"✅ 帖子已创建: {post['id']}")
        except Exception as e:
            logger.warning(f"⚠️ 帖子创建失败: {post['id']} - {e}")


if __name__ == "__main__":
    logger.info("🚀 开始注入种子数据...")
    seed_test_user()
    seed_artists()
    seed_templates()
    seed_prompt_templates()
    seed_posts()
    logger.info("✅ 种子数据注入完成！")
