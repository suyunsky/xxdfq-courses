"""
小小达芬奇艺术教育平台 - 后端API服务
基于FastAPI构建，提供完整的课程管理、用户认证、权限控制等功能
"""

from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
import uvicorn
from sqlalchemy.orm import Session
from sqlalchemy import or_

# 导入自定义模块
from models import get_db, create_tables, User, Course, UserCourse, Lesson, Enrollment, LearningRecord
from auth import (
    get_current_user, get_current_user_optional, authenticate_user, create_access_token,
    get_password_hash, check_video_access, generate_video_token,
    security
)
from vod_api import router as vod_router

# 创建FastAPI应用
app = FastAPI(
    title="小小达芬奇艺术教育平台API",
    description="艺术教育课程平台后端服务 - 完整版",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic模型
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    role: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class CourseCreate(BaseModel):
    title: str
    description: str
    short_description: Optional[str] = None
    age_range: str
    stage: str
    duration: str
    icon: str
    color: str
    cover_image: Optional[str] = None
    video_url: Optional[str] = None
    access_level: str = "free"
    price: float = 0.0

class CourseResponse(BaseModel):
    id: int
    title: str
    description: str
    short_description: Optional[str]
    age_range: str
    stage: str
    duration: str
    icon: str
    color: str
    cover_image: Optional[str]
    video_url: Optional[str]
    access_level: str
    price: float
    status: str
    created_at: datetime
    updated_at: datetime

class LessonCreate(BaseModel):
    title: str
    description: str
    video_url: str
    duration: int
    is_free_preview: bool = False

class LessonResponse(BaseModel):
    id: int
    course_id: int
    title: str
    description: str
    video_url: str
    duration: int
    is_free_preview: bool
    sort_order: int
    created_at: datetime

class EnrollmentCreate(BaseModel):
    course_id: int
    payment_method: Optional[str] = None

class ProgressUpdate(BaseModel):
    progress: int
    lesson_id: Optional[int] = None
    duration: Optional[int] = None

class VideoAccessResponse(BaseModel):
    has_access: bool
    video_token: Optional[str] = None
    video_url: Optional[str] = None
    message: Optional[str] = None
    action: Optional[str] = None
    price: Optional[float] = None

# 初始化数据库
@app.on_event("startup")
def startup_event():
    """应用启动时创建数据库表"""
    create_tables()
    print("数据库表已创建")

# 注册腾讯云点播API路由
app.include_router(vod_router)

# API路由
@app.get("/")
async def root():
    """API根路径"""
    return {
        "message": "小小达芬奇艺术教育平台API",
        "version": "2.0.0",
        "docs": "/api/docs",
        "status": "running"
    }

@app.get("/api/health")
async def health_check(db: Session = Depends(get_db)):
    """健康检查"""
    try:
        # 测试数据库连接
        db.execute("SELECT 1")
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow(),
            "database": "connected"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"数据库连接失败: {str(e)}"
        )

# 用户认证API
@app.post("/api/auth/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """用户注册"""
    # 检查用户名是否已存在
    existing_user = db.query(User).filter(
        or_(User.username == user_data.username, User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名或邮箱已存在"
        )
    
    # 创建新用户
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role="student",
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 创建访问令牌
    access_token = create_access_token(data={"sub": new_user.username})
    
    # 构建用户响应
    user_response = UserResponse(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        full_name=new_user.full_name,
        role=new_user.role,
        avatar_url=new_user.avatar_url,
        bio=new_user.bio,
        created_at=new_user.created_at
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@app.post("/api/auth/login", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """用户登录"""
    user = authenticate_user(db, login_data.username, login_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 创建访问令牌
    access_token = create_access_token(data={"sub": user.username})
    
    # 构建用户响应
    user_response = UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        avatar_url=user.avatar_url,
        bio=user.bio,
        created_at=user.created_at
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@app.get("/api/users/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """获取当前用户信息"""
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        avatar_url=current_user.avatar_url,
        bio=current_user.bio,
        created_at=current_user.created_at
    )

# 课程管理API
@app.get("/api/courses", response_model=List[CourseResponse])
async def get_courses(
    age_range: Optional[str] = Query(None, description="年龄段筛选"),
    stage: Optional[str] = Query(None, description="成长阶段筛选"),
    access_level: Optional[str] = Query(None, description="访问级别筛选"),
    status: str = Query("published", description="课程状态"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """获取课程列表，支持筛选 - 所有人都可访问"""
    query = db.query(Course).filter(Course.status == status)
    
    # 应用筛选条件
    if age_range:
        query = query.filter(Course.age_range == age_range)
    if stage:
        query = query.filter(Course.stage == stage)
    if access_level:
        query = query.filter(Course.access_level == access_level)
    
    # 非管理员只能看到非内部课程
    if not current_user or current_user.role != "admin":
        query = query.filter(Course.access_level != "internal")
    
    courses = query.order_by(Course.sort_order, Course.created_at.desc()).all()
    
    return [
        CourseResponse(
            id=course.id,
            title=course.title,
            description=course.description,
            short_description=course.short_description,
            age_range=course.age_range,
            stage=course.stage,
            duration=course.duration,
            icon=course.icon,
            color=course.color,
            cover_image=course.cover_image,
            video_url=course.video_url,
            access_level=course.access_level,
            price=course.price,
            status=course.status,
            created_at=course.created_at,
            updated_at=course.updated_at
        )
        for course in courses
    ]

@app.get("/api/courses/{course_id}", response_model=CourseResponse)
async def get_course(course_id: int, db: Session = Depends(get_db)):
    """获取单个课程详情"""
    course = db.query(Course).filter(Course.id == course_id).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="课程不存在"
        )
    
    return CourseResponse(
        id=course.id,
        title=course.title,
        description=course.description,
        short_description=course.short_description,
        age_range=course.age_range,
        stage=course.stage,
        duration=course.duration,
        icon=course.icon,
        color=course.color,
        cover_image=course.cover_image,
        video_url=course.video_url,
        access_level=course.access_level,
        price=course.price,
        status=course.status,
        created_at=course.created_at,
        updated_at=course.updated_at
    )

# 课程章节API
@app.get("/api/courses/{course_id}/lessons", response_model=List[LessonResponse])
async def get_course_lessons(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """获取课程章节列表 - 允许匿名访问，但会根据权限过滤内容"""
    course = db.query(Course).filter(Course.id == course_id).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="课程不存在"
        )
    
    # 检查课程访问权限
    permission_info = check_video_access(current_user, course)
    
    # 获取所有章节
    lessons_query = db.query(Lesson).filter(
        Lesson.course_id == course_id
    ).order_by(Lesson.sort_order)
    
    lessons = lessons_query.all()
    
    # 根据权限过滤章节
    filtered_lessons = []
    for lesson in lessons:
        # 检查该章节的访问权限
        lesson_permission_info = check_video_access(current_user, course, lesson)
        if lesson_permission_info["has_access"]:
            filtered_lessons.append(lesson)
    
    return [
        LessonResponse(
            id=lesson.id,
            course_id=lesson.course_id,
            title=lesson.title,
            description=lesson.description,
            video_url=lesson.video_url,
            duration=lesson.duration,
            is_free_preview=lesson.is_free_preview,
            sort_order=lesson.sort_order,
            created_at=lesson.created_at
        )
        for lesson in filtered_lessons
    ]

# 视频访问API
@app.get("/api/video/access/{course_id}", response_model=VideoAccessResponse)
async def get_video_access(
    course_id: int,
    lesson_id: Optional[int] = Query(None, description="章节ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取视频访问权限和令牌"""
    course = db.query(Course).filter(Course.id == course_id).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="课程不存在"
        )
    
    lesson = None
    if lesson_id:
        lesson = db.query(Lesson).filter(
            Lesson.id == lesson_id,
            Lesson.course_id == course_id
        ).first()
        
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="章节不存在"
            )
    
    # 检查视频访问权限
    permission_info = check_video_access(current_user, course, lesson)
    
    response = VideoAccessResponse(
        has_access=permission_info["has_access"],
        message=permission_info.get("message"),
        action=permission_info.get("action"),
        price=permission_info.get("price")
    )
    
    if permission_info["has_access"]:
        # 生成视频令牌
        video_token = generate_video_token(
            user_id=current_user.id,
            course_id=course_id,
            lesson_id=lesson_id
        )
        
        # 获取视频URL
        video_url = lesson.video_url if lesson else course.video_url
        
        response.video_token = video_token
        response.video_url = video_url
    
    return response

# 用户课程管理API
@app.get("/api/user/courses")
async def get_user_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取用户的课程"""
    user_courses = db.query(UserCourse).filter(
        UserCourse.user_id == current_user.id
    ).all()
    
    result = []
    for uc in user_courses:
        course = db.query(Course).filter(Course.id == uc.course_id).first()
        if course:
            # 获取课程章节数
            lesson_count = db.query(Lesson).filter(Lesson.course_id == course.id).count()
            
            result.append({
                "course": CourseResponse(
                    id=course.id,
                    title=course.title,
                    description=course.description,
                    short_description=course.short_description,
                    age_range=course.age_range,
                    stage=course.stage,
                    duration=course.duration,
                    icon=course.icon,
                    color=course.color,
                    cover_image=course.cover_image,
                    video_url=course.video_url,
                    access_level=course.access_level,
                    price=course.price,
                    status=course.status,
                    created_at=course.created_at,
                    updated_at=course.updated_at
                ),
                "progress": uc.progress,
                "completed": uc.completed,
                "started_at": uc.started_at,
                "last_accessed_at": uc.last_accessed_at,
                "lesson_count": lesson_count
            })
    
    return result

@app.post("/api/user/courses/{course_id}/enroll")
async def enroll_course(
    course_id: int,
    enrollment_data: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """用户报名课程"""
    course = db.query(Course).filter(Course.id == course_id).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="课程不存在"
        )
    
    # 检查是否已报名
    existing_enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == course_id
    ).first()
    
    if existing_enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="已报名该课程"
        )
    
    # 创建报名记录
    new_enrollment = Enrollment(
        user_id=current_user.id,
        course_id=course_id,
        payment_method=enrollment_data.payment_method,
        payment_status="paid" if course.price == 0 else "pending",
        payment_amount=course.price
    )
    
    # 创建用户课程关系
    new_user_course = UserCourse(
        user_id=current_user.id,
        course_id=course_id,
        progress=0,
        completed=False
    )
    
    db.add(new_enrollment)
    db.add(new_user_course)
    db.commit()
    
    return {
        "message": "报名成功",
        "enrollment_id": new_enrollment.id,
        "course_id": course_id
    }

@app.put("/api/user/courses/{course_id}/progress")
async def update_course_progress(
    course_id: int,
    progress_data: ProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新课程进度"""
    user_course = db.query(UserCourse).filter(
        UserCourse.user_id == current_user.id,
        UserCourse.course_id == course_id
    ).first()
    
    if not user_course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到该课程"
        )
    
    # 更新进度
    user_course.progress = max(0, min(100, progress_data.progress))
    user_course.completed = user_course.progress >= 100
    user_course.last_accessed_at = datetime.utcnow()
    
    if user_course.completed and not user_course.completed_at:
        user_course.completed_at = datetime.utcnow()
    
    # 创建学习记录
    if progress_data.lesson_id:
        learning_record = LearningRecord(
            user_id=current_user.id,
            course_id=course_id,
            lesson_id=progress_data.lesson_id,
            action="progress",
            progress=progress_data.progress,
            duration=progress_data.duration or 0
        )
        db.add(learning_record)
    
    db.commit()
    
    return {
        "message": "进度更新成功",
        "progress": user_course.progress,
        "completed": user_course.completed,
        "last_accessed_at": user_course.last_accessed_at
    }

# 学习统计API
@app.get("/api/user/stats")
async def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取用户学习统计"""
    # 获取用户课程
    user_courses = db.query(UserCourse).filter(
        UserCourse.user_id == current_user.id
    ).all()
    
    # 获取学习记录
    learning_records = db.query(LearningRecord).filter(
        LearningRecord.user_id == current_user.id
    ).all()
    
    # 计算统计
    total_courses = len(user_courses)
    completed_courses = len([uc for uc in user_courses if uc.completed])
    ongoing_courses = total_courses - completed_courses
    
    # 计算平均进度
    total_progress = sum(uc.progress for uc in user_courses)
    average_progress = round(total_progress / max(total_courses, 1), 1)
    
    # 计算总学习时长
    total_duration = sum(record.duration for record in learning_records if record.duration)
    total_hours = round(total_duration / 3600, 1)
    
    # 计算最近学习时间
    recent_activity = None
    if learning_records:
        recent_activity = max(record.created_at for record in learning_records)
    
    # 计算连续学习天数（简化版）
    learning_days = 18  # 实际项目中应该从数据库计算
    
    return {
        "total_courses": total_courses,
        "completed_courses": completed_courses,
        "ongoing_courses": ongoing_courses,
        "average_progress": average_progress,
        "total_learning_hours": total_hours,
        "learning_days": learning_days,
        "recent_activity": recent_activity,
        "enrollment_count": db.query(Enrollment).filter(
            Enrollment.user_id == current_user.id,
            Enrollment.payment_status == "paid"
        ).count()
    }

# 管理员API
@app.post("/api/admin/courses", response_model=CourseResponse)
async def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建新课程（管理员权限）"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )
    
    # 创建课程
    new_course = Course(
        title=course_data.title,
        description=course_data.description,
        short_description=course_data.short_description,
        age_range=course_data.age_range,
        stage=course_data.stage,
        duration=course_data.duration,
        icon=course_data.icon,
        color=course_data.color,
        cover_image=course_data.cover_image,
        video_url=course_data.video_url,
        access_level=course_data.access_level,
        price=course_data.price,
        status="published"
    )
    
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    
    return CourseResponse(
        id=new_course.id,
        title=new_course.title,
        description=new_course.description,
        short_description=new_course.short_description,
        age_range=new_course.age_range,
        stage=new_course.stage,
        duration=new_course.duration,
        icon=new_course.icon,
        color=new_course.color,
        cover_image=new_course.cover_image,
        video_url=new_course.video_url,
        access_level=new_course.access_level,
        price=new_course.price,
        status=new_course.status,
        created_at=new_course.created_at,
        updated_at=new_course.updated_at
    )

@app.post("/api/admin/courses/{course_id}/lessons", response_model=LessonResponse)
async def create_lesson(
    course_id: int,
    lesson_data: LessonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建课程章节（管理员权限）"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )
    
    # 检查课程是否存在
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="课程不存在"
        )
    
    # 获取最大排序值
    max_sort = db.query(Lesson).filter(
        Lesson.course_id == course_id
    ).order_by(Lesson.sort_order.desc()).first()
    
    sort_order = (max_sort.sort_order + 1) if max_sort else 0
    
    # 创建章节
    new_lesson = Lesson(
        course_id=course_id,
        title=lesson_data.title,
        description=lesson_data.description,
        video_url=lesson_data.video_url,
        duration=lesson_data.duration,
        is_free_preview=lesson_data.is_free_preview,
        sort_order=sort_order
    )
    
    db.add(new_lesson)
    db.commit()
    db.refresh(new_lesson)
    
    return LessonResponse(
        id=new_lesson.id,
        course_id=new_lesson.course_id,
        title=new_lesson.title,
        description=new_lesson.description,
        video_url=new_lesson.video_url,
        duration=new_lesson.duration,
        is_free_preview=new_lesson.is_free_preview,
        sort_order=new_lesson.sort_order,
        created_at=new_lesson.created_at
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
