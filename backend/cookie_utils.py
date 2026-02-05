"""
Cookie管理工具
"""

from fastapi import Response
from datetime import datetime, timedelta
from typing import Optional


class CookieManager:
    def __init__(self, cookie_name: str = "session_id", 
                 secure: bool = True,
                 http_only: bool = True,
                 same_site: str = "lax",
                 domain: str = None):
        """
        初始化Cookie管理器
        
        Args:
            cookie_name: Cookie名称
            secure: 是否仅HTTPS
            http_only: 是否HttpOnly
            same_site: SameSite策略
            domain: Cookie域名
        """
        self.cookie_name = cookie_name
        self.secure = secure
        self.http_only = http_only
        self.same_site = same_site
        self.domain = domain
    
    def set_session_cookie(self, response: Response, session_id: str, 
                          max_age: int = 3600, path: str = "/"):
        """
        设置会话Cookie
        
        Args:
            response: FastAPI响应对象
            session_id: 会话ID
            max_age: 最大年龄(秒)
            path: Cookie路径
        """
        response.set_cookie(
            key=self.cookie_name,
            value=session_id,
            max_age=max_age,
            expires=int((datetime.utcnow() + timedelta(seconds=max_age)).timestamp()),
            path=path,
            domain=self.domain,
            secure=self.secure,
            httponly=self.http_only,
            samesite=self.same_site
        )
    
    def delete_session_cookie(self, response: Response, path: str = "/"):
        """
        删除会话Cookie
        
        Args:
            response: FastAPI响应对象
            path: Cookie路径
        """
        response.delete_cookie(
            key=self.cookie_name,
            path=path,
            domain=self.domain
        )
    
    def get_session_id(self, request) -> Optional[str]:
        """
        从请求中获取会话ID
        
        Args:
            request: FastAPI请求对象
            
        Returns:
            会话ID或None
        """
        return request.cookies.get(self.cookie_name)