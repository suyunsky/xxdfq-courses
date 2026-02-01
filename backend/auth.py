"""
认证和安全模块
包含JWT认证、密码哈希、权限检查等功能
"""

from datetime import datetime, timedelta
from typing import Optional
import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

from models import User, get_db

# 加载环境变量
load_dotenv()

# 安全配置
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-development-only")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7天

# 密码哈希上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer认证
security = HTTPBearer(auto_error=False)

# 密码验证
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """生成密码哈希"""
    return pwd_context.hash(password)

# 用户认证
def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """验证用户凭据"""
    user = db.query(User).filter(
        (User.username == username) | (User.email == username)
    ).first()
    
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    if not user.is_active:
        return None
    
    return user

# JWT令牌创建
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """创建访问令牌"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# 获取当前用户
async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """从JWT令牌获取当前用户"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效的认证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if credentials is None:
        raise credentials_exception
    
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.InvalidTokenError:
        raise credentials_exception
    
    user = db.query(User).filter(
        (User.username == username) | (User.email == username)
    ).first()
    
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户已被禁用"
        )
    
    return user

# 获取当前用户（可选，允许匿名访问）
async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """从JWT令牌获取当前用户，允许匿名访问"""
    if credentials is None:
        return None
    
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
    except jwt.InvalidTokenError:
        return None
    
    user = db.query(User).filter(
        (User.username == username) | (User.email == username)
    ).first()
    
    if user is None or not user.is_active:
        return None
    
    return user

# 权限检查
def check_user_permission(user: User, required_role: str = None, required_permission: str = None) -> bool:
    """检查用户权限"""
    # 管理员拥有所有权限
    if user.role == "admin":
        return True
    
    # 检查角色
    if required_role and user.role != required_role:
        return False
    
    # 这里可以添加更复杂的权限检查逻辑
    # 例如：检查特定权限、课程访问权限等
    
    return True

# 课程访问权限检查
def check_course_access(user: Optional[User], course_access_level: str, user_has_enrollment: bool = False) -> bool:
    """检查用户是否有课程访问权限"""
    
    # 处理匿名用户
    if user is None:
        # 匿名用户只能访问免费课程
        return course_access_level == "free"
    
    # 管理员可以访问所有课程
    if user.role == "admin":
        return True
    
    # 教师可以访问自己创建的课程（需要扩展课程模型添加teacher_id字段）
    if user.role == "teacher":
        # 这里可以添加教师权限检查
        pass
    
    # 免费课程所有人都可以访问
    if course_access_level == "free":
        return True
    
    # 内部课程需要特定权限
    if course_access_level == "internal":
        # 这里可以添加内部课程权限检查
        return user.role in ["teacher", "admin"]
    
    # 付费课程需要已报名
    if course_access_level == "premium":
        return user_has_enrollment
    
    return False

# 视频播放权限检查
def check_video_access(user: Optional[User], course, lesson=None) -> dict:
    """检查视频播放权限"""
    
    # 处理匿名用户
    if user is None:
        # 匿名用户只能访问免费课程或免费预览课程
        has_access = course.access_level == "free" or (lesson and lesson.is_free_preview)
        
        permission_info = {
            "has_access": has_access,
            "access_level": course.access_level,
            "user_role": "anonymous",
            "has_enrollment": False,
            "is_free_preview": lesson.is_free_preview if lesson else False
        }
        
        if not has_access:
            if course.access_level == "premium":
                permission_info["message"] = "该课程为付费课程，请登录并报名后观看"
                permission_info["action"] = "login_and_enroll"
                permission_info["price"] = course.price
            elif course.access_level == "internal":
                permission_info["message"] = "该课程为内部课程，请联系管理员获取访问权限"
                permission_info["action"] = "contact_admin"
            else:
                permission_info["message"] = "请登录后访问"
                permission_info["action"] = "login"
        
        return permission_info
    
    # 检查用户是否已报名该课程
    user_has_enrollment = any(
        enrollment.course_id == course.id and enrollment.payment_status == "paid"
        for enrollment in user.enrollments
    )
    
    # 检查课程访问权限
    has_access = check_course_access(user, course.access_level, user_has_enrollment)
    
    # 如果是免费预览课程
    if lesson and lesson.is_free_preview:
        has_access = True
    
    # 构建权限响应
    permission_info = {
        "has_access": has_access,
        "access_level": course.access_level,
        "user_role": user.role,
        "has_enrollment": user_has_enrollment,
        "is_free_preview": lesson.is_free_preview if lesson else False
    }
    
    if not has_access:
        # 根据不同的访问级别提供不同的提示信息
        if course.access_level == "premium":
            permission_info["message"] = "该课程为付费课程，请报名后观看"
            permission_info["action"] = "enroll"
            permission_info["price"] = course.price
        elif course.access_level == "internal":
            permission_info["message"] = "该课程为内部课程，请联系管理员获取访问权限"
            permission_info["action"] = "contact_admin"
        else:
            permission_info["message"] = "暂无访问权限"
            permission_info["action"] = "none"
    
    return permission_info

# 生成视频播放令牌（用于保护视频URL）
def generate_video_token(user_id: int, course_id: int, lesson_id: Optional[int] = None, expires_in: int = 3600) -> str:
    """生成视频播放令牌"""
    data = {
        "user_id": user_id,
        "course_id": course_id,
        "lesson_id": lesson_id,
        "exp": datetime.utcnow() + timedelta(seconds=expires_in)
    }
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

# 验证视频播放令牌
def verify_video_token(token: str) -> dict:
    """验证视频播放令牌"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.InvalidTokenError:
        return None
