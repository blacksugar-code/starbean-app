"""
Supabase 配置模块，从环境变量中读取连接参数
"""
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    # NOTE: 开发模式下允许空值，但会在实际调用时报错
    import logging
    logging.warning(
        "SUPABASE_URL 或 SUPABASE_KEY 未设置，请在 .env 文件中配置"
    )
