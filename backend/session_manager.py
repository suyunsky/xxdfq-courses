"""
HttpOnly Cookie + Server-Side Session 管理器
"""

import json
import uuid
import base64
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import secrets
from sqlalchemy.orm import Session as DBSession

from models import User, Session, SessionEvent


class WebSessionManager:
    def __init__(self, db: DBSession, secret_key: str, session_timeout: int = 3600):
        """
        初始化Web会话管理器
        
        Args:
            db: 数据库会话
            secret_key: 加密密钥 (32字节)
            session_timeout: 会话超时时间(秒)，默认1小时
        """
        self.db = db
        self.secret_key = secret_key.encode() if isinstance(secret_key, str) else secret_key
        self.session_timeout = session_timeout
        
        if len(self.secret_key) != 32:
            raise ValueError("Secret key must be 32 bytes for AES-256")
    
    def create_session(self, user: User, request, 
                      session_data: Optional[Dict[str, Any]] = None) -> str:
        """
        创建Web会话
        
        Args:
            user: 用户对象
            request: FastAPI请求对象
            session_data: 额外的会话数据
            
        Returns:
            会话ID
        """
        # 生成会话ID
        session_id = str(uuid.uuid4())
        
        # 获取客户端信息
        user_agent = request.headers.get("user-agent", "")
        ip_address = request.client.host if request.client else "unknown"
        device_info = self._detect_device_info(user_agent)
        
        # 计算过期时间
        now = datetime.utcnow()
        expires_at = now + timedelta(seconds=self.session_timeout)
        
        # 准备会话数据
        session_data_dict = session_data or {}
        session_data_dict.update({
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "created_at": now.isoformat(),
            "last_activity": now.isoformat()
        })
        
        # 加密会话数据
        encrypted_data = self._encrypt_session_data(session_data_dict)
        
        # 创建会话记录
        session = Session(
            id=session_id,
            user_id=user.id,
            session_data=encrypted_data,
            user_agent=user_agent,
            ip_address=ip_address,
            device_info=device_info,
            last_activity_at=now,
            expires_at=expires_at
        )
        
        # 记录登录事件
        event = SessionEvent(
            session_id=session_id,
            user_id=user.id,
            event_type="login",
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # 保存到数据库
        self.db.add(session)
        self.db.add(event)
        self.db.commit()
        
        return session_id
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        获取会话数据
        
        Args:
            session_id: 会话ID
            
        Returns:
            会话数据字典，如果会话不存在或已过期则返回None
        """
        # 清理过期会话
        self._cleanup_expired_sessions()
        
        # 查询会话
        session = self.db.query(Session).filter(
            Session.id == session_id,
            Session.expires_at > datetime.utcnow()
        ).first()
        
        if not session:
            return None
        
        # 更新最后活动时间
        session.last_activity_at = datetime.utcnow()
        
        try:
            # 解密会话数据
            session_data = self._decrypt_session_data(session.session_data)
            
            # 更新会话数据中的最后活动时间
            session_data["last_activity"] = session.last_activity_at.isoformat()
            
            # 重新加密并保存
            session.session_data = self._encrypt_session_data(session_data)
            
            self.db.commit()
            
            # 返回会话数据（包含元数据）
            return {
                "session_id": session_id,
                "user_id": session.user_id,
                "session_data": session_data,
                "device_info": session.device_info,
                "ip_address": session.ip_address,
                "last_activity_at": session.last_activity_at,
                "expires_at": session.expires_at
            }
            
        except Exception:
            # 解密失败，删除损坏的会话
            self._invalidate_session(session_id, "decryption_failed")
            return None
    
    def invalidate_session(self, session_id: str, reason: str = "logout") -> bool:
        """
        使会话失效
        
        Args:
            session_id: 会话ID
            reason: 失效原因
            
        Returns:
            是否成功
        """
        session = self.db.query(Session).filter(Session.id == session_id).first()
        
        if not session:
            return False
        
        # 记录失效事件
        event = SessionEvent(
            session_id=session_id,
            user_id=session.user_id,
            event_type="invalidate",
            event_data={"reason": reason},
            ip_address=session.ip_address,
            user_agent=session.user_agent
        )
        
        # 删除会话
        self.db.delete(session)
        self.db.add(event)
        self.db.commit()
        
        return True
    
    def invalidate_user_sessions(self, user_id: int, reason: str = "security") -> int:
        """
        使用户的所有会话失效
        
        Args:
            user_id: 用户ID
            reason: 失效原因
            
        Returns:
            失效的会话数量
        """
        sessions = self.db.query(Session).filter(Session.user_id == user_id).all()
        
        count = 0
        for session in sessions:
            event = SessionEvent(
                session_id=session.id,
                user_id=user_id,
                event_type="invalidate_all",
                event_data={"reason": reason},
                ip_address=session.ip_address,
                user_agent=session.user_agent
            )
            self.db.add(event)
            self.db.delete(session)
            count += 1
        
        if count > 0:
            self.db.commit()
        
        return count
    
    def get_user_sessions(self, user_id: int) -> list:
        """
        获取用户的所有活跃会话
        
        Args:
            user_id: 用户ID
            
        Returns:
            会话列表
        """
        sessions = self.db.query(Session).filter(
            Session.user_id == user_id,
            Session.expires_at > datetime.utcnow()
        ).order_by(Session.last_activity_at.desc()).all()
        
        result = []
        for session in sessions:
            result.append({
                "session_id": session.id,
                "device_info": session.device_info,
                "ip_address": session.ip_address,
                "last_activity_at": session.last_activity_at,
                "expires_at": session.expires_at,
                "created_at": session.created_at
            })
        
        return result
    
    def refresh_session(self, session_id: str, extend_by: int = 3600) -> bool:
        """
        刷新会话（延长有效期）
        
        Args:
            session_id: 会话ID
            extend_by: 延长时间(秒)
            
        Returns:
            是否成功
        """
        session = self.db.query(Session).filter(
            Session.id == session_id,
            Session.expires_at > datetime.utcnow()
        ).first()
        
        if not session:
            return False
        
        # 延长过期时间
        session.expires_at = datetime.utcnow() + timedelta(seconds=extend_by)
        session.last_activity_at = datetime.utcnow()
        
        self.db.commit()
        return True
    
    # 私有方法
    def _encrypt_session_data(self, data: Dict[str, Any]) -> str:
        """加密会话数据"""
        json_data = json.dumps(data, ensure_ascii=False)
        nonce = secrets.token_bytes(12)
        
        aesgcm = AESGCM(self.secret_key)
        encrypted = aesgcm.encrypt(nonce, json_data.encode(), None)
        
        # 组合nonce和密文
        combined = nonce + encrypted
        return base64.b64encode(combined).decode()
    
    def _decrypt_session_data(self, encrypted_data: str) -> Dict[str, Any]:
        """解密会话数据"""
        combined = base64.b64decode(encrypted_data)
        
        # 分离nonce和密文
        nonce = combined[:12]
        ciphertext = combined[12:]
        
        aesgcm = AESGCM(self.secret_key)
        decrypted = aesgcm.decrypt(nonce, ciphertext, None)
        
        return json.loads(decrypted.decode())
    
    def _detect_device_info(self, user_agent: str) -> str:
        """检测设备信息"""
        ua_lower = user_agent.lower()
        
        # 检测设备类型
        if "mobile" in ua_lower:
            device = "Mobile"
        elif "tablet" in ua_lower:
            device = "Tablet"
        else:
            device = "Desktop"
        
        # 检测操作系统
        if "windows" in ua_lower:
            os = "Windows"
        elif "mac" in ua_lower:
            os = "macOS"
        elif "linux" in ua_lower:
            os = "Linux"
        elif "android" in ua_lower:
            os = "Android"
        elif "iphone" in ua_lower or "ipad" in ua_lower:
            os = "iOS"
        else:
            os = "Unknown"
        
        # 检测浏览器
        if "chrome" in ua_lower and "edg" not in ua_lower:
            browser = "Chrome"
        elif "firefox" in ua_lower:
            browser = "Firefox"
        elif "safari" in ua_lower and "chrome" not in ua_lower:
            browser = "Safari"
        elif "edge" in ua_lower:
            browser = "Edge"
        else:
            browser = "Unknown"
        
        return f"{device} - {os} - {browser}"
    
    def _cleanup_expired_sessions(self):
        """清理过期会话"""
        now = datetime.utcnow()
        
        # 查找过期会话
        expired_sessions = self.db.query(Session).filter(
            Session.expires_at <= now
        ).all()
        
        for session in expired_sessions:
            # 记录过期事件
            event = SessionEvent(
                session_id=session.id,
                user_id=session.user_id,
                event_type="expired",
                ip_address=session.ip_address,
                user_agent=session.user_agent
            )
            self.db.add(event)
            
            # 删除会话
            self.db.delete(session)
        
        if expired_sessions:
            self.db.commit()
    
    def _invalidate_session(self, session_id: str, reason: str):
        """内部方法：使会话失效"""
        session = self.db.query(Session).filter(Session.id == session_id).first()
        
        if session:
            event = SessionEvent(
                session_id=session_id,
                user_id=session.user_id,
                event_type="invalidate",
                event_data={"reason": reason},
                ip_address=session.ip_address,
                user_agent=session.user_agent
            )
            self.db.add(event)
            self.db.delete(session)
            self.db.commit()