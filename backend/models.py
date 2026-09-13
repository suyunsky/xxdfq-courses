"""
数据库模型定义
使用SQLAlchemy ORM
"""

from sqlalchemy import (
    create_engine, Column, Integer, String, Boolean, DateTime, Date,
    ForeignKey, Text, Float, CheckConstraint, UniqueConstraint, inspect, text
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from datetime import datetime
import os
import re
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
    email = Column(String(100), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(String(20), default='student')  # student, teacher, admin
    avatar_url = Column(String(255))
    bio = Column(Text)
    is_active = Column(Boolean, default=True)
    must_change_password = Column(Boolean, nullable=False, default=False)
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

# 试听预约线索，与课程报名和儿童学习数据分开保存
class TrialLead(Base):
    __tablename__ = 'trial_leads'

    id = Column(Integer, primary_key=True, index=True)
    child_age = Column(Integer, nullable=False)
    community = Column(String(50), nullable=False)
    phone = Column(String(20), nullable=False, index=True)
    source_code = Column(String(80))
    utm_source = Column(String(100))
    utm_medium = Column(String(100))
    utm_campaign = Column(String(150))
    landing_path = Column(String(255))
    status = Column(String(20), nullable=False, default='new', index=True)
    consent_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)


# 线下学员档案：登录账号仍沿用 users，业务信息独立保存。
class StudentProfile(Base):
    __tablename__ = 'student_profiles'
    __table_args__ = (
        CheckConstraint("status IN ('active', 'paused')", name='ck_student_profile_status'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    guardian_phone = Column(String(20), nullable=False, index=True)
    birth_date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False, default='active', index=True)
    notes = Column(Text)
    created_by_user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship('User', foreign_keys=[user_id])
    created_by = relationship('User', foreign_keys=[created_by_user_id])
    hour_account = relationship(
        'LessonHourAccount', back_populates='student_profile', uselist=False,
        cascade='all, delete-orphan'
    )


# 每名学员一个总课时账户；余额是流水提交后的事务内快照。
class LessonHourAccount(Base):
    __tablename__ = 'lesson_hour_accounts'
    __table_args__ = (CheckConstraint('balance >= 0', name='ck_lesson_hour_balance_nonnegative'),)

    id = Column(Integer, primary_key=True, index=True)
    student_profile_id = Column(
        Integer, ForeignKey('student_profiles.id', ondelete='CASCADE'),
        nullable=False, unique=True, index=True
    )
    balance = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    student_profile = relationship('StudentProfile', back_populates='hour_account')
    transactions = relationship('LessonHourTransaction', back_populates='account')


# 课时流水只追加不修改；纠错通过 reversal_of_id 关联冲正记录。
class LessonHourTransaction(Base):
    __tablename__ = 'lesson_hour_transactions'
    __table_args__ = (
        CheckConstraint(
            "transaction_type IN ('add', 'consume', 'reversal')",
            name='ck_lesson_hour_transaction_type',
        ),
        CheckConstraint('quantity_delta <> 0', name='ck_lesson_hour_delta_nonzero'),
        CheckConstraint('balance_after >= 0', name='ck_lesson_hour_after_nonnegative'),
        UniqueConstraint('reversal_of_id', name='uq_lesson_hour_reversal_once'),
    )

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey('lesson_hour_accounts.id', ondelete='CASCADE'), nullable=False, index=True)
    transaction_type = Column(String(20), nullable=False, index=True)
    quantity_delta = Column(Integer, nullable=False)
    balance_after = Column(Integer, nullable=False)
    occurred_on = Column(Date, nullable=False)
    reason = Column(String(200), nullable=False)
    note = Column(Text)
    operator_user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    reversal_of_id = Column(
        Integer,
        ForeignKey('lesson_hour_transactions.id', ondelete='SET NULL'),
        nullable=True,
    )
    idempotency_key = Column(String(64), nullable=False, unique=True, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    account = relationship('LessonHourAccount', back_populates='transactions')
    operator = relationship('User', foreign_keys=[operator_user_id])
    reversal_of = relationship('LessonHourTransaction', remote_side=[id], foreign_keys=[reversal_of_id])

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


def migrate_existing_schema():
    """为现有 MySQL 数据库补充 create_all 无法追加的列与约束。"""
    inspector = inspect(engine)
    if 'users' not in inspector.get_table_names():
        return

    columns = {column['name']: column for column in inspector.get_columns('users')}
    dialect = engine.dialect.name
    with engine.begin() as connection:
        if 'must_change_password' not in columns:
            if dialect == 'mysql':
                connection.execute(text(
                    'ALTER TABLE users ADD COLUMN must_change_password '
                    'BOOLEAN NOT NULL DEFAULT FALSE AFTER is_active'
                ))
            else:
                connection.execute(text(
                    'ALTER TABLE users ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT 0'
                ))

        # 后台创建的儿童账号可不填写邮箱；公开注册仍由接口要求邮箱。
        email_column = columns.get('email')
        if dialect == 'mysql' and email_column and not email_column.get('nullable', True):
            connection.execute(text('ALTER TABLE users MODIFY COLUMN email VARCHAR(100) NULL'))

        # 早期建表版本的冲正自关联没有删除策略，账户级联清理会被 MySQL 阻止。
        if dialect == 'mysql' and 'lesson_hour_transactions' in inspector.get_table_names():
            for foreign_key in inspector.get_foreign_keys('lesson_hour_transactions'):
                if foreign_key.get('constrained_columns') != ['reversal_of_id']:
                    continue
                ondelete = (foreign_key.get('options') or {}).get('ondelete', '').upper()
                if ondelete == 'SET NULL':
                    continue
                constraint_name = foreign_key.get('name')
                if constraint_name and re.fullmatch(r'[A-Za-z0-9_]+', constraint_name):
                    connection.execute(text(
                        f'ALTER TABLE lesson_hour_transactions DROP FOREIGN KEY `{constraint_name}`'
                    ))
                    connection.execute(text(
                        'ALTER TABLE lesson_hour_transactions ADD CONSTRAINT '
                        'fk_lesson_hour_transactions_reversal_of '
                        'FOREIGN KEY (reversal_of_id) REFERENCES lesson_hour_transactions(id) '
                        'ON DELETE SET NULL'
                    ))

            transaction_checks = {
                constraint['name']
                for constraint in inspector.get_check_constraints('lesson_hour_transactions')
            }
            if 'ck_lesson_hour_transaction_type' not in transaction_checks:
                connection.execute(text(
                    "ALTER TABLE lesson_hour_transactions ADD CONSTRAINT "
                    "ck_lesson_hour_transaction_type CHECK "
                    "(transaction_type IN ('add', 'consume', 'reversal'))"
                ))

        if dialect == 'mysql' and 'student_profiles' in inspector.get_table_names():
            profile_checks = {
                constraint['name']
                for constraint in inspector.get_check_constraints('student_profiles')
            }
            if 'ck_student_profile_status' not in profile_checks:
                connection.execute(text(
                    "ALTER TABLE student_profiles ADD CONSTRAINT "
                    "ck_student_profile_status CHECK (status IN ('active', 'paused'))"
                ))

# 获取数据库会话
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
