"""
Web会话依赖注入
"""

from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from session_manager import WebSessionManager
from cookie_utils import CookieManager
from models import get_db, User
from auth import get_current_user_optional


# 初始化管理器
def get_session_manager(db: Session = Depends(get_db)):
    """获取会话管理器"""
    from auth import SECRET_KEY
    return WebSessionManager(db, SECRET_KEY, session_timeout=3600*24*7)  # 7天


def get_cookie_manager():
    """获取Cookie管理器"""
    return CookieManager()


# Web会话依赖
async def get_web_session(
    request: Request,
    session_manager: WebSessionManager = Depends(get_session_manager),
    cookie_manager: CookieManager = Depends(get_cookie_manager),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    获取Web会话（用于需要认证的端点）
    
    如果会话无效，返回401错误
    """
    # 从Cookie获取会话ID
    session_id = cookie_manager.get_session_id(request)
    
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未认证",
            headers={"WWW-Authenticate": "Cookie"},
        )
    
    # 获取会话数据
    session_data = session_manager.get_session(session_id)
    
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="会话已过期或无效",
            headers={"WWW-Authenticate": "Cookie"},
        )
    
    return session_data


async def get_web_session_optional(
    request: Request,
    session_manager: WebSessionManager = Depends(get_session_manager),
    cookie_manager: CookieManager = Depends(get_cookie_manager),
    db: Session = Depends(get_db)
) -> Optional[Dict[str, Any]]:
    """
    获取Web会话（可选，允许匿名访问）
    
    如果会话无效，返回None
    """
    # 从Cookie获取会话ID
    session_id = cookie_manager.get_session_id(request)
    
    if not session_id:
        return None
    
    # 获取会话数据
    session_data = session_manager.get_session(session_id)
    
    return session_data


async def get_current_user_from_session(
    session_data: Dict[str, Any] = Depends(get_web_session),
    db: Session = Depends(get_db)
) -> User:
    """
    从Web会话获取当前用户
    
    用于替换原有的get_current_user依赖
    """
    user_id = session_data["user_id"]
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户已被禁用"
        )
    
    return user


async def get_current_user_from_session_optional(
    session_data: Optional[Dict[str, Any]] = Depends(get_web_session_optional),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    从Web会话获取当前用户（可选）
    
    用于替换原有的get_current_user_optional依赖
    """
    if not session_data:
        return None
    
    user_id = session_data["user_id"]
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or not user.is_active:
        return None
    
    return user


# 混合认证依赖（支持Session和JWT）
async def get_current_user_hybrid(
    request: Request,
    db: Session = Depends(get_db),
    session_manager: WebSessionManager = Depends(get_session_manager),
    cookie_manager: CookieManager = Depends(get_cookie_manager)
) -> Optional[User]:
    """
    混合认证：优先使用Web Session，其次使用JWT
    
    用于需要向后兼容的端点
    """
    # 1. 尝试从Web Session获取用户
    session_id = cookie_manager.get_session_id(request)
    if session_id:
        session_data = session_manager.get_session(session_id)
        if session_data:
            user_id = session_data["user_id"]
            user = db.query(User).filter(User.id == user_id).first()
            if user and user.is_active:
                return user
    
    # 2. 尝试从JWT获取用户
    from auth import get_current_user_optional
    try:
        user = await get_current_user_optional(request=request, db=db)
        if user:
            return user
    except:
        pass
    
    return None


async def require_current_user_hybrid(
    current_user: Optional[User] = Depends(get_current_user_hybrid)
) -> User:
    """
    要求用户必须登录（混合认证）
    
    如果用户未登录，返回401错误
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="需要登录",
        )
    
    return current_user