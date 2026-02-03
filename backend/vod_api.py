"""
腾讯云点播API路由
提供视频播放、上传、管理等接口
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Body, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
import json

from models import get_db, User, VodVideo, Course, Lesson
from auth import get_current_user, verify_video_token
from vod_service import VodManager, validate_file_id, format_duration

router = APIRouter(prefix="/api/vod", tags=["腾讯云点播"])
security = HTTPBearer()


@router.get("/signature")
async def get_playback_signature(
    file_id: str = Query(..., description="腾讯云视频FileID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取视频播放签名
    
    返回播放视频所需的psign签名
    """
    try:
        # 验证FileID格式
        if not validate_file_id(file_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="无效的FileID格式"
            )
        
        # 获取播放签名
        vod_manager = VodManager(db)
        sign_info = vod_manager.get_or_create_signature(file_id, current_user.id)
        
        return {
            "success": True,
            "data": sign_info,
            "message": "播放签名获取成功"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取播放签名失败: {str(e)}"
        )


@router.get("/video/{video_id}")
async def get_video_info(
    video_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取视频信息及播放签名
    
    返回视频详细信息和播放所需的全部参数
    """
    try:
        vod_manager = VodManager(db)
        
        # 检查播放权限
        if not vod_manager.check_playback_permission(current_user.id, video_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="您没有权限观看此视频"
            )
        
        # 获取视频信息和播放签名
        video_info = vod_manager.get_video_with_signature(video_id, current_user.id)
        
        return {
            "success": True,
            "data": video_info,
            "message": "视频信息获取成功"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取视频信息失败: {str(e)}"
        )


@router.post("/playback/record")
async def record_playback(
    data: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    user_agent: Optional[str] = Header(None),
    x_forwarded_for: Optional[str] = Header(None, alias="X-Forwarded-For")
):
    """
    记录视频播放行为
    
    记录用户的播放进度、时长等信息
    """
    try:
        video_id = data.get("video_id")
        play_duration = data.get("play_duration", 0)
        progress = data.get("progress", 0)
        device_type = data.get("device_type", "web")
        
        if not video_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="缺少必要参数: video_id"
            )
        
        # 获取IP地址
        ip_address = x_forwarded_for.split(",")[0].strip() if x_forwarded_for else ""
        
        # 记录播放行为
        vod_manager = VodManager(db)
        record = vod_manager.record_playback(
            user_id=current_user.id,
            video_id=video_id,
            play_duration=play_duration,
            progress=progress,
            device_type=device_type,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return {
            "success": True,
            "data": {
                "record_id": record.id,
                "play_duration": record.play_duration,
                "progress": record.progress,
                "completed": record.completed,
                "updated_at": record.updated_at.isoformat() if record.updated_at else None
            },
            "message": "播放记录保存成功"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"记录播放行为失败: {str(e)}"
        )


@router.get("/playback/history")
async def get_playback_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(20, ge=1, le=100, description="返回记录数量")
):
    """
    获取用户播放历史
    
    返回用户最近观看的视频记录
    """
    try:
        vod_manager = VodManager(db)
        history = vod_manager.get_user_playback_history(current_user.id, limit)
        
        return {
            "success": True,
            "data": history,
            "message": "播放历史获取成功"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取播放历史失败: {str(e)}"
        )


@router.get("/course/{course_id}/videos")
async def get_course_videos(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取课程关联的视频列表
    
    返回课程下的所有视频信息
    """
    try:
        # 检查课程是否存在
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="课程不存在"
            )
        
        # 获取课程视频
        videos = db.query(VodVideo).filter(
            VodVideo.course_id == course_id,
            VodVideo.status == "ready"
        ).order_by(VodVideo.created_at).all()
        
        result = []
        for video in videos:
            # 检查用户是否有权限观看
            vod_manager = VodManager(db)
            has_access = vod_manager.check_playback_permission(current_user.id, video.id)
            
            video_info = {
                "id": video.id,
                "title": video.title,
                "description": video.description,
                "duration": video.duration,
                "duration_formatted": format_duration(video.duration) if video.duration else "00:00",
                "size": video.size,
                "resolution": video.resolution,
                "cover_url": video.cover_url,
                "status": video.status,
                "has_access": has_access,
                "created_at": video.created_at.isoformat() if video.created_at else None
            }
            
            if video.lesson:
                video_info["lesson"] = {
                    "id": video.lesson.id,
                    "title": video.lesson.title
                }
            
            result.append(video_info)
        
        return {
            "success": True,
            "data": {
                "course": {
                    "id": course.id,
                    "title": course.title,
                    "description": course.description
                },
                "videos": result
            },
            "message": "课程视频列表获取成功"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取课程视频失败: {str(e)}"
        )


@router.post("/upload/init")
async def init_video_upload(
    data: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    初始化视频上传
    
    创建视频上传任务，返回上传URL等信息
    """
    try:
        # 检查用户权限（仅管理员和教师可以上传）
        if current_user.role not in ["admin", "teacher"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="您没有权限上传视频"
            )
        
        title = data.get("title")
        description = data.get("description", "")
        course_id = data.get("course_id")
        lesson_id = data.get("lesson_id")
        
        if not title:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="缺少必要参数: title"
            )
        
        # 验证课程和课时
        if course_id:
            course = db.query(Course).filter(Course.id == course_id).first()
            if not course:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="课程不存在"
                )
        
        if lesson_id:
            lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
            if not lesson:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="课时不存在"
                )
            
            # 确保课时属于指定课程
            if course_id and lesson.course_id != course_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="课时不属于指定课程"
                )
        
        # 初始化腾讯云点播服务
        from vod_service import TencentVodService
        vod_service = TencentVodService()
        
        # 创建上传任务
        upload_info = vod_service.create_upload_video(title, description, course_id, lesson_id)
        
        return {
            "success": True,
            "data": upload_info,
            "message": "视频上传初始化成功"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"初始化视频上传失败: {str(e)}"
        )


@router.post("/upload/confirm")
async def confirm_video_upload(
    data: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    确认视频上传完成
    
    上传完成后确认，创建视频记录
    """
    try:
        # 检查用户权限
        if current_user.role not in ["admin", "teacher"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="您没有权限确认上传"
            )
        
        vod_session_key = data.get("vod_session_key")
        title = data.get("title")
        course_id = data.get("course_id")
        lesson_id = data.get("lesson_id")
        
        if not vod_session_key or not title:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="缺少必要参数: vod_session_key 或 title"
            )
        
        # 确认上传
        from vod_service import TencentVodService
        vod_service = TencentVodService()
        confirm_info = vod_service.confirm_upload(vod_session_key)
        
        # 创建视频记录
        vod_manager = VodManager(db)
        video = vod_manager.create_video_record(
            file_id=confirm_info["file_id"],
            title=title,
            course_id=course_id,
            lesson_id=lesson_id
        )
        
        return {
            "success": True,
            "data": {
                "video": {
                    "id": video.id,
                    "title": video.title,
                    "file_id": video.file_id,
                    "status": video.status,
                    "created_at": video.created_at.isoformat() if video.created_at else None
                },
                "upload": confirm_info
            },
            "message": "视频上传确认成功"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"确认视频上传失败: {str(e)}"
        )


@router.get("/statistics/{video_id}")
async def get_video_statistics(
    video_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取视频统计信息
    
    返回视频的播放统计信息（仅管理员和教师可访问）
    """
    try:
        # 检查用户权限
        if current_user.role not in ["admin", "teacher"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="您没有权限查看统计信息"
            )
        
        vod_manager = VodManager(db)
        statistics = vod_manager.get_video_statistics(video_id)
        
        return {
            "success": True,
            "data": statistics,
            "message": "视频统计信息获取成功"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取视频统计失败: {str(e)}"
        )


@router.post("/cleanup/signatures")
async def cleanup_expired_signatures(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    清理过期的播放签名
    
    清理数据库中过期的播放签名记录（仅管理员可访问）
    """
    try:
        # 检查用户权限
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="您没有权限执行清理操作"
            )
        
        vod_manager = VodManager(db)
        cleaned_count = vod_manager.cleanup_expired_signatures()
        
        return {
            "success": True,
            "data": {
                "cleaned_count": cleaned_count
            },
            "message": f"已清理 {cleaned_count} 个过期签名"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"清理过期签名失败: {str(e)}"
        )


@router.get("/health")
async def vod_health_check():
    """
    腾讯云点播服务健康检查
    
    检查服务是否正常
    """
    try:
        from vod_service import TencentVodService
        
        # 尝试初始化服务
        vod_service = TencentVodService()
        
        return {
            "success": True,
            "data": {
                "service": "tencent_vod",
                "status": "healthy",
                "app_id": vod_service.app_id,
                "region": vod_service.region
            },
            "message": "腾讯云点播服务运行正常"
        }
        
    except ValueError as e:
        # 配置不完整
        return {
            "success": False,
            "data": {
                "service": "tencent_vod",
                "status": "unconfigured",
                "error": str(e)
            },
            "message": "腾讯云点播服务配置不完整"
        }
    except Exception as e:
        return {
            "success": False,
            "data": {
                "service": "tencent_vod",
                "status": "unhealthy",
                "error": str(e)
            },
            "message": "腾讯云点播服务异常"
        }