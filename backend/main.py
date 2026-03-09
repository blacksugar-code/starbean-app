"""
星豆 StarBean 后端入口
FastAPI 应用实例，配置 CORS 和路由挂载
"""
import os
import logging
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

# NOTE: 在所有模块导入前加载 .env，确保 GEMINI_API_KEY 可用
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from api.user_api import router as user_router
from api.gacha_api import router as gacha_router
from api.artist_api import router as artist_router
from api.community_api import router as community_router
from api.admin_api import router as admin_router
from api.auth_api import router as auth_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="星豆 StarBean API",
    description="星豆微信小程序后端 API 服务",
    version="1.0.0",
)

# CORS 配置，允许前端开发服务器访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    全局异常处理，防止未捕获异常泄露堆栈信息
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "服务器内部错误，请稍后重试"},
    )


# 挂载路由
app.include_router(auth_router, prefix="/api", tags=["认证"])
app.include_router(user_router, prefix="/api", tags=["用户"])
app.include_router(gacha_router, prefix="/api", tags=["抽卡"])
app.include_router(artist_router, prefix="/api", tags=["艺人与模板"])
app.include_router(community_router, prefix="/api", tags=["社区"])
app.include_router(admin_router, prefix="/api", tags=["后台管理"])

# 挂载静态文件目录：使 uploads/ 中的文件可通过 /uploads/ 路径访问
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")


@app.get("/api/health")
async def health_check():
    """健康检查接口"""
    return {"status": "ok", "service": "StarBean API"}

