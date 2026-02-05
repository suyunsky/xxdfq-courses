"""
数据库模型定义
使用SQLAlchemy ORM
"""

from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 创建基础类
Base = declarative_base()

# 用户模型
class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(String(20), default='student')  # student, teacher, admin
    avatar_url = Column(String(255))
    bio = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    user_courses = relationship("UserCourse", back_populates="user")
    enrollments = relationship("Enrollment", back_populates="user")

# 课程模型
class Course(Base):
    __tablename__ = 'courses'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    short_description = Column(String(500))
    age_range = Column(String(20))  # 5-7, 8-10, 11-13
    stage = Column(String(50))  # awakening, expression, structure, style
    duration = Column(String(50))  # 8节课, 10节课等
    icon = Column(String(100))
    color = Column(String(100))
    cover_image = Column(String(255))
    video_url = Column(String(255))
    status = Column(String(20), default='draft')  # draft, published, archived
    access_level = Column(String(20), default='free')  # free, premium, internal
    price = Column(Float, default=0.0)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    user_courses = relationship("UserCourse", back_populates="course")
    enrollments = relationship("Enrollment", back_populates="course")
    lessons = relationship("Lesson", back_populates="course")

# 用户课程关系模型
class UserCourse(Base):
    __tablename__ = 'user_courses'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=False)
    progress = Column(Integer, default=0)  # 0-100
    completed = Column(Boolean, default=False)
    last_accessed_at = Column(DateTime)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    user = relationship("User", back_populates="user_courses")
    course = relationship("Course", back_populates="user_courses")

# 课程章节模型
class Lesson(Base):
    __tablename__ = 'lessons'
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    video_url = Column(String(255))
    duration = Column(Integer)  # 秒数
    sort_order = Column(Integer, default=0)
    is_free_preview = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    course = relationship("Course", back_populates="lessons")

# 报名记录模型
class Enrollment(Base):
    __tablename__ = 'enrollments'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=False)
    payment_status = Column(String(20), default='pending')  # pending, paid, refunded
    payment_amount = Column(Float, default=0.0)
    payment_method = Column(String(50))
    transaction_id = Column(String(100))
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    
    # 关系
    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")

# 学习记录模型
class LearningRecord(Base):
    __tablename__ = 'learning_records'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=False)
    lesson_id = Column(Integer, ForeignKey('lessons.id'))
    action = Column(String(50))  # start, progress, complete, review
    progress = Column(Integer)  # 0-100
    duration = Column(Integer)  # 学习时长（秒）
    created_at = Column(DateTime, default=datetime.utcnow)

# 腾讯云点播视频模型
class VodVideo(Base):
    __tablename__ = 'vod_videos'
    
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(String(100), unique=True, nullable=False)  # 腾讯云FileID
    title = Column(String(200), nullable=False)
    description = Column(Text)
    course_id = Column(Integer, ForeignKey('courses.id'))
    lesson_id = Column(Integer, ForeignKey('lessons.id'))
    duration = Column(Integer)  # 视频时长（秒）
    size = Column(Integer)  # 文件大小（字节）
    resolution = Column(String(50))  # 分辨率，如"1920x1080"
    format = Column(String(20))  # 视频格式，如"mp4", "m3u8"
    cover_url = Column(String(500))  # 封面图URL
    play_url = Column(String(500))  # 播放URL
    status = Column(String(20), default='processing')  # processing, ready, error
    transcode_task_id = Column(String(100))  # 转码任务ID
    watermark_id = Column(String(100))  # 水印模板ID
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    course = relationship("Course")
    lesson = relationship("Lesson")

# 视频播放记录模型
class VideoPlayRecord(Base):
    __tablename__ = 'video_play_records'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    video_id = Column(Integer, ForeignKey('vod_videos.id'), nullable=False)
    course_id = Column(Integer, ForeignKey('courses.id'))
    lesson_id = Column(Integer, ForeignKey('lessons.id'))
    play_duration = Column(Integer, default=0)  # 播放时长（秒）
    total_duration = Column(Integer)  # 视频总时长（秒）
    progress = Column(Integer, default=0)  # 播放进度百分比 0-100
    completed = Column(Boolean, default=False)  # 是否观看完成
    device_type = Column(String(50))  # 设备类型：web, ios, android
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    user = relationship("User")
    video = relationship("VodVideo")
    course = relationship("Course")
    lesson = relationship("Lesson")

# 视频播放签名缓存模型
class PlaySignature(Base):
    __tablename__ = 'play_signatures'
    
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(String(100), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'))
    psign = Column(Text, nullable=False)  # 播放签名
    expires_at = Column(DateTime, nullable=False)  # 签名过期时间
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关系
    user = relationship("User")

# Web会话模型（HttpOnly Cookie + Server-Side Session）
class Session(Base):
    __tablename__ = 'sessions'
    
    id = Column(String(36), primary_key=True)  # Session ID (UUID)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    session_data = Column(Text, nullable=False)  # 加密的会话数据（JSON）
    user_agent = Column(Text)
    ip_address = Column(String(45))
    device_info = Column(String(255))
    last_activity_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关系
    user = relationship("User", backref="sessions")

# 会话事件审计模型
class SessionEvent(Base):
    __tablename__ = 'session_events'
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(36), ForeignKey('sessions.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    event_type = Column(String(50), nullable=False)  # login, logout, expired, invalidated
    ip_address = Column(String(45))
    user_agent = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关系
    session = relationship("Session")
    user = relationship("User")

# 创建数据库引擎
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./xxdfq.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建所有表
def create_tables():
    Base.metadata.create_all(bind=engine)

# 获取数据库会话
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()