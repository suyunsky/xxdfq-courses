"""
腾讯云点播服务模块
提供视频上传、播放签名生成、视频管理等功能
"""

import os
import time
import hashlib
import base64
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import json

from tencentcloud.common import credential
from tencentcloud.common.exception.tencent_cloud_sdk_exception import TencentCloudSDKException
from tencentcloud.vod.v20180717 import vod_client, models
from sqlalchemy.orm import Session

from models import VodVideo, PlaySignature, VideoPlayRecord, User, Course, Lesson


class TencentVodService:
    """腾讯云点播服务"""
    
    def __init__(self):
        # 从环境变量获取配置
        self.secret_id = os.getenv('TENCENT_SECRET_ID')
        self.secret_key = os.getenv('TENCENT_SECRET_KEY')
        self.app_id = os.getenv('TENCENT_VOD_APP_ID')
        self.region = os.getenv('TENCENT_VOD_REGION', 'ap-shanghai')
        self.play_domain = os.getenv('TENCENT_VOD_PLAY_DOMAIN', '')
        
        # 验证配置
        if not all([self.secret_id, self.secret_key, self.app_id]):
            raise ValueError("腾讯云点播配置不完整，请检查环境变量")
        
        # 初始化腾讯云客户端
        self.cred = credential.Credential(self.secret_id, self.secret_key)
        self.client = vod_client.VodClient(self.cred, self.region)
        
        # 签名有效期（秒）
        self.signature_expire_seconds = 7200  # 2小时
        
    def generate_psign(self, file_id: str, user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        生成播放签名(psign) - 根据腾讯云官方文档（JWT格式）
        
        文档: https://cloud.tencent.com/document/product/266/45554
        重要：Psign必须是JWT格式，使用HMAC-SHA256算法
        
        JWT格式: Header.Payload.Signature
        Header: {"alg": "HS256", "typ": "JWT"}
        Payload: {
            "appId": 1300161743,
            "fileId": "5145403715595978658",
            "contentInfo": {"audioVideoType": "RawAdaptive"},
            "currentTimeStamp": 当前时间戳,
            "expireTimeStamp": 过期时间戳
        }
        
        Args:
            file_id: 腾讯云视频FileID
            user_id: 用户ID（可选，仅用于记录，不包含在JWT中）
            
        Returns:
            包含psign和相关信息的字典
        """
        try:
            import jwt
            
            # 检查播放密钥是否配置
            play_key = os.getenv('TENCENT_VOD_PLAY_KEY')
            if not play_key:
                raise ValueError("播放密钥未配置，请设置TENCENT_VOD_PLAY_KEY环境变量")
            
            # 计算时间戳
            current_time = int(time.time())
            expire_time = current_time + self.signature_expire_seconds
            
            # 构建JWT Header
            header = {
                "alg": "HS256",
                "typ": "JWT"
            }
            
            # 构建JWT Payload - 根据腾讯云文档
            payload = {
                "appId": int(self.app_id),  # 必须是数字
                "fileId": file_id,
                "contentInfo": {
                    "audioVideoType": "Original"  # 根据文档要求
                },
                "currentTimeStamp": current_time,
                "expireTimeStamp": expire_time
            }
            
            # 生成JWT
            psign = jwt.encode(
                payload,
                play_key,
                algorithm="HS256",
                headers=header
            )
            
            # 如果是bytes类型，转换为字符串
            if isinstance(psign, bytes):
                psign = psign.decode('utf-8')
            
            return {
                "psign": psign,
                "file_id": file_id,
                "app_id": self.app_id,
                "expire_time": expire_time,
                "expire_at": datetime.fromtimestamp(expire_time).isoformat(),
                "user_id": user_id,
                "payload": json.dumps(payload),  # 调试用
                "jwt_format": True  # 标记为JWT格式
            }
            
        except ImportError:
            raise Exception("请安装pyjwt库: pip install pyjwt")
        except Exception as e:
            raise Exception(f"生成播放签名失败: {str(e)}")
    
    def get_video_info(self, file_id: str) -> Dict[str, Any]:
        """
        获取视频信息
        
        Args:
            file_id: 腾讯云视频FileID
            
        Returns:
            视频信息字典
        """
        try:
            req = models.DescribeMediaInfosRequest()
            req.FileIds = [file_id]
            
            resp = self.client.DescribeMediaInfos(req)
            
            if not resp.MediaInfoSet or len(resp.MediaInfoSet) == 0:
                raise Exception(f"视频不存在: {file_id}")
            
            media_info = resp.MediaInfoSet[0]
            
            # 提取基本信息 - 修复属性访问错误
            video_info = {
                "file_id": file_id,
                "name": media_info.BasicInfo.Name if hasattr(media_info, 'BasicInfo') else "",
                "description": media_info.BasicInfo.Description if hasattr(media_info, 'BasicInfo') else "",
                "size": media_info.MediaInfo.Size if hasattr(media_info, 'MediaInfo') else 0,
                "duration": media_info.MediaInfo.Duration if hasattr(media_info, 'MediaInfo') else 0,
                "type": media_info.MediaInfo.Type if hasattr(media_info, 'MediaInfo') else "",
                "status": media_info.MediaInfo.Status if hasattr(media_info, 'MediaInfo') else "",
                "cover_url": media_info.MediaInfo.CoverUrl if hasattr(media_info, 'MediaInfo') else "",
                "create_time": media_info.MediaInfo.CreateTime if hasattr(media_info, 'MediaInfo') else "",
                "update_time": media_info.MediaInfo.UpdateTime if hasattr(media_info, 'MediaInfo') else "",
            }
            
            # 提取转码信息
            if hasattr(media_info, 'MediaInfo') and hasattr(media_info.MediaInfo, 'TranscodeInfo'):
                transcode_info = media_info.MediaInfo.TranscodeInfo
                video_info["transcode_status"] = transcode_info.Status if hasattr(transcode_info, 'Status') else ""
                
                # 获取播放URL
                if hasattr(transcode_info, 'TranscodeSet') and transcode_info.TranscodeSet:
                    for transcode in transcode_info.TranscodeSet:
                        if hasattr(transcode, 'Url') and transcode.Url:
                            video_info["play_url"] = transcode.Url
                            if hasattr(transcode, 'Height'):
                                video_info["resolution"] = f"{transcode.Height}p"
                            break
            
            return video_info
            
        except TencentCloudSDKException as e:
            raise Exception(f"获取视频信息失败: {e.message}")
        except Exception as e:
            raise Exception(f"获取视频信息失败: {str(e)}")
    
    def create_upload_video(self, title: str, description: str = "", 
                           course_id: Optional[int] = None, lesson_id: Optional[int] = None) -> Dict[str, Any]:
        """
        创建视频上传任务
        
        Args:
            title: 视频标题
            description: 视频描述
            course_id: 关联课程ID
            lesson_id: 关联课时ID
            
        Returns:
            上传信息字典
        """
        try:
            req = models.ApplyUploadRequest()
            req.MediaName = title
            req.MediaType = "mp4"  # 默认MP4格式
            
            resp = self.client.ApplyUpload(req)
            
            return {
                "upload_url": resp.UploadUrl,
                "media_id": resp.MediaId,
                "cover_upload_url": resp.CoverUploadUrl,
                "request_id": resp.RequestId
            }
            
        except TencentCloudSDKException as e:
            raise Exception(f"创建上传任务失败: {e.message}")
        except Exception as e:
            raise Exception(f"创建上传任务失败: {str(e)}")
    
    def confirm_upload(self, vod_session_key: str) -> Dict[str, Any]:
        """
        确认上传完成
        
        Args:
            vod_session_key: 上传会话密钥
            
        Returns:
            确认结果
        """
        try:
            req = models.CommitUploadRequest()
            req.VodSessionKey = vod_session_key
            
            resp = self.client.CommitUpload(req)
            
            return {
                "file_id": resp.FileId,
                "media_url": resp.MediaUrl,
                "cover_url": resp.CoverUrl,
                "request_id": resp.RequestId
            }
            
        except TencentCloudSDKException as e:
            raise Exception(f"确认上传失败: {e.message}")
        except Exception as e:
            raise Exception(f"确认上传失败: {str(e)}")
    
    def process_video(self, file_id: str, 
                     transcode_template_id: Optional[str] = None,
                     watermark_template_id: Optional[str] = None) -> Dict[str, Any]:
        """
        处理视频（转码、添加水印等）
        
        Args:
            file_id: 视频FileID
            transcode_template_id: 转码模板ID
            watermark_template_id: 水印模板ID
            
        Returns:
            处理任务信息
        """
        try:
            req = models.ProcessMediaRequest()
            req.FileId = file_id
            
            # 设置转码参数
            if transcode_template_id:
                transcode_task = models.TranscodeTaskInput()
                transcode_task.Definition = transcode_template_id
                req.MediaProcessTask = models.MediaProcessTaskInput(
                    TranscodeTaskSet=[transcode_task]
                )
            
            # 设置水印参数
            if watermark_template_id:
                watermark_task = models.WatermarkInput()
                watermark_task.Definition = watermark_template_id
                if req.MediaProcessTask:
                    req.MediaProcessTask.WatermarkSet = [watermark_task]
                else:
                    req.MediaProcessTask = models.MediaProcessTaskInput(
                        WatermarkSet=[watermark_task]
                    )
            
            resp = self.client.ProcessMedia(req)
            
            return {
                "task_id": resp.TaskId,
                "request_id": resp.RequestId
            }
            
        except TencentCloudSDKException as e:
            raise Exception(f"处理视频失败: {e.message}")
        except Exception as e:
            raise Exception(f"处理视频失败: {str(e)}")
    
    def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """
        获取任务状态
        
        Args:
            task_id: 任务ID
            
        Returns:
            任务状态信息
        """
        try:
            req = models.DescribeTaskDetailRequest()
            req.TaskId = task_id
            
            resp = self.client.DescribeTaskDetail(req)
            
            return {
                "status": resp.Status,
                "progress": resp.Progress,
                "err_code": resp.ErrCode,
                "message": resp.Message,
                "input": resp.Input,
                "output": resp.Output,
                "request_id": resp.RequestId
            }
            
        except TencentCloudSDKException as e:
            raise Exception(f"获取任务状态失败: {e.message}")
        except Exception as e:
            raise Exception(f"获取任务状态失败: {str(e)}")


class VodManager:
    """点播视频管理器"""
    
    def __init__(self, db: Session):
        self.db = db
        self.vod_service = TencentVodService()
    
    def get_or_create_signature(self, file_id: str, user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        获取或创建播放签名
        
        Args:
            file_id: 视频FileID
            user_id: 用户ID
            
        Returns:
            播放签名信息
        """
        try:
            # 检查是否有未过期的缓存签名
            now = datetime.utcnow()
            signature = self.db.query(PlaySignature).filter(
                PlaySignature.file_id == file_id,
                PlaySignature.user_id == user_id,
                PlaySignature.expires_at > now
            ).first()
            
            if signature:
                return {
                    "psign": signature.psign,
                    "app_id": self.vod_service.app_id,
                    "file_id": file_id,
                    "expire_at": signature.expires_at.isoformat(),
                    "from_cache": True
                }
            
            # 生成新签名
            sign_info = self.vod_service.generate_psign(file_id, user_id)
            
            # 保存到数据库
            expires_at = datetime.fromtimestamp(sign_info["expire_time"])
            new_signature = PlaySignature(
                file_id=file_id,
                user_id=user_id,
                psign=sign_info["psign"],
                expires_at=expires_at
            )
            
            self.db.add(new_signature)
            self.db.commit()
            
            return {
                "psign": sign_info["psign"],
                "app_id": sign_info["app_id"],
                "file_id": file_id,
                "expire_at": sign_info["expire_at"],
                "from_cache": False
            }
            
        except Exception as e:
            self.db.rollback()
            raise Exception(f"获取播放签名失败: {str(e)}")
    
    def create_video_record(self, file_id: str, title: str, 
                           course_id: Optional[int] = None, 
                           lesson_id: Optional[int] = None) -> VodVideo:
        """
        创建视频记录
        
        Args:
            file_id: 腾讯云FileID
            title: 视频标题
            course_id: 关联课程ID
            lesson_id: 关联课时ID
            
        Returns:
            视频记录对象
        """
        try:
            # 获取视频信息
            video_info = self.vod_service.get_video_info(file_id)
            
            # 创建视频记录
            video = VodVideo(
                file_id=file_id,
                title=title,
                description=video_info.get("description", ""),
                course_id=course_id,
                lesson_id=lesson_id,
                duration=video_info.get("duration", 0),
                size=video_info.get("size", 0),
                resolution=video_info.get("resolution", ""),
                format=video_info.get("type", ""),
                cover_url=video_info.get("cover_url", ""),
                play_url=video_info.get("play_url", ""),
                status="ready" if video_info.get("play_url") else "processing"
            )
            
            self.db.add(video)
            self.db.commit()
            self.db.refresh(video)
            
            return video
            
        except Exception as e:
            self.db.rollback()
            raise Exception(f"创建视频记录失败: {str(e)}")
    
    def get_video_with_signature(self, video_id: int, user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        获取视频信息及播放签名
        
        Args:
            video_id: 视频记录ID
            user_id: 用户ID
            
        Returns:
            视频信息和播放签名
        """
        try:
            # 获取视频记录
            video = self.db.query(VodVideo).filter(VodVideo.id == video_id).first()
            if not video:
                raise Exception("视频不存在")
            
            # 检查视频状态
            if video.status != "ready":
                raise Exception(f"视频状态不可用: {video.status}")
            
            # 获取播放签名
            sign_info = self.get_or_create_signature(video.file_id, user_id)
            
            # 构建返回数据
            result = {
                "video": {
                    "id": video.id,
                    "title": video.title,
                    "description": video.description,
                    "duration": video.duration,
                    "size": video.size,
                    "resolution": video.resolution,
                    "format": video.format,
                    "cover_url": video.cover_url,
                    "play_url": video.play_url,
                    "status": video.status,
                    "created_at": video.created_at.isoformat() if video.created_at else None,
                    "updated_at": video.updated_at.isoformat() if video.updated_at else None
                },
                "playback": {
                    "file_id": video.file_id,
                    "app_id": sign_info["app_id"],
                    "psign": sign_info["psign"],
                    "expire_at": sign_info["expire_at"]
                }
            }
            
            # 添加关联信息
            if video.course:
                result["video"]["course"] = {
                    "id": video.course.id,
                    "title": video.course.title
                }
            
            if video.lesson:
                result["video"]["lesson"] = {
                    "id": video.lesson.id,
                    "title": video.lesson.title
                }
            
            return result
            
        except Exception as e:
            raise Exception(f"获取视频信息失败: {str(e)}")
    
    def check_playback_permission(self, user_id: Optional[int], video_id: int) -> bool:
        """
        检查用户播放权限（支持匿名用户）
        
        Args:
            user_id: 用户ID（可为None表示匿名用户）
            video_id: 视频ID
            
        Returns:
            是否有播放权限
        """
        try:
            # 获取视频记录
            video = self.db.query(VodVideo).filter(VodVideo.id == video_id).first()
            if not video:
                return False
            
            # 检查视频状态
            if video.status != "ready":
                return False
            
            # 检查课程关联
            if video.course_id:
                course = self.db.query(Course).filter(Course.id == video.course_id).first()
                if not course:
                    return False
                
                # 检查课程状态
                if course.status != "published":
                    return False
                
                # 免费课程允许匿名访问
                if course.access_level == "free":
                    return True
                
                # 付费课程需要登录
                if not user_id:
                    return False
                
                # 获取用户信息
                user = self.db.query(User).filter(User.id == user_id).first()
                if not user or not user.is_active:
                    return False
                
                # 管理员有所有权限
                if user.role == "admin":
                    return True
                
                # 付费课程权限检查
                if course.access_level == "premium":
                    # 检查用户是否购买或报名
                    from models import UserCourse, Enrollment
                    
                    user_course = self.db.query(UserCourse).filter(
                        UserCourse.user_id == user_id,
                        UserCourse.course_id == video.course_id
                    ).first()
                    
                    if user_course:
                        return True
                    
                    enrollment = self.db.query(Enrollment).filter(
                        Enrollment.user_id == user_id,
                        Enrollment.course_id == video.course_id,
                        Enrollment.payment_status == "paid"
                    ).first()
                    
                    return enrollment is not None
                
                # 内部课程需要特定权限
                if course.access_level == "internal":
                    return user.role in ["teacher", "admin"]
            
            # 没有课程关联的视频，默认允许访问
            return True
            
        except Exception as e:
            print(f"检查播放权限失败: {str(e)}")
            return False
    
    def record_playback(self, user_id: int, video_id: int, 
                       play_duration: int, progress: int,
                       device_type: str = "web", 
                       ip_address: str = "", 
                       user_agent: str = "") -> VideoPlayRecord:
        """
        记录播放行为
        
        Args:
            user_id: 用户ID
            video_id: 视频ID
            play_duration: 播放时长（秒）
            progress: 播放进度（0-100）
            device_type: 设备类型
            ip_address: IP地址
            user_agent: 用户代理
            
        Returns:
            播放记录对象
        """
        try:
            # 获取视频信息
            video = self.db.query(VodVideo).filter(VodVideo.id == video_id).first()
            if not video:
                raise Exception("视频不存在")
            
            # 创建或更新播放记录
            record = self.db.query(VideoPlayRecord).filter(
                VideoPlayRecord.user_id == user_id,
                VideoPlayRecord.video_id == video_id
            ).first()
            
            now = datetime.utcnow()
            
            if record:
                # 更新现有记录
                record.play_duration += play_duration
                record.progress = max(record.progress, progress)
                record.completed = record.progress >= 95  # 95%以上视为完成
                record.ended_at = now
                record.updated_at = now
                
                if device_type:
                    record.device_type = device_type
                if ip_address:
                    record.ip_address = ip_address
                if user_agent:
                    record.user_agent = user_agent
            else:
                # 创建新记录
                record = VideoPlayRecord(
                    user_id=user_id,
                    video_id=video_id,
                    course_id=video.course_id,
                    lesson_id=video.lesson_id,
                    play_duration=play_duration,
                    total_duration=video.duration,
                    progress=progress,
                    completed=progress >= 95,
                    device_type=device_type,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    started_at=now,
                    ended_at=now
                )
                self.db.add(record)
            
            self.db.commit()
            self.db.refresh(record)
            return record
            
        except Exception as e:
            self.db.rollback()
            raise Exception(f"记录播放行为失败: {str(e)}")
    
    def get_user_playback_history(self, user_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        """
        获取用户播放历史
        
        Args:
            user_id: 用户ID
            limit: 返回记录数量
            
        Returns:
            播放历史列表
        """
        try:
            records = self.db.query(VideoPlayRecord).filter(
                VideoPlayRecord.user_id == user_id
            ).order_by(
                VideoPlayRecord.ended_at.desc()
            ).limit(limit).all()
            
            result = []
            for record in records:
                video_info = {
                    "id": record.video.id,
                    "title": record.video.title,
                    "cover_url": record.video.cover_url,
                    "duration": record.video.duration
                }
                
                if record.course:
                    video_info["course"] = {
                        "id": record.course.id,
                        "title": record.course.title
                    }
                
                if record.lesson:
                    video_info["lesson"] = {
                        "id": record.lesson.id,
                        "title": record.lesson.title
                    }
                
                result.append({
                    "id": record.id,
                    "video": video_info,
                    "play_duration": record.play_duration,
                    "progress": record.progress,
                    "completed": record.completed,
                    "device_type": record.device_type,
                    "started_at": record.started_at.isoformat() if record.started_at else None,
                    "ended_at": record.ended_at.isoformat() if record.ended_at else None
                })
            
            return result
            
        except Exception as e:
            raise Exception(f"获取播放历史失败: {str(e)}")
    
    def cleanup_expired_signatures(self) -> int:
        """
        清理过期的播放签名
        
        Returns:
            清理的签名数量
        """
        try:
            now = datetime.utcnow()
            expired_count = self.db.query(PlaySignature).filter(
                PlaySignature.expires_at <= now
            ).delete()
            
            self.db.commit()
            return expired_count
            
        except Exception as e:
            self.db.rollback()
            raise Exception(f"清理过期签名失败: {str(e)}")
    
    def get_video_statistics(self, video_id: int) -> Dict[str, Any]:
        """
        获取视频统计信息
        
        Args:
            video_id: 视频ID
            
        Returns:
            视频统计信息
        """
        try:
            video = self.db.query(VodVideo).filter(VodVideo.id == video_id).first()
            if not video:
                raise Exception("视频不存在")
            
            # 获取播放记录统计
            play_records = self.db.query(VideoPlayRecord).filter(
                VideoPlayRecord.video_id == video_id
            ).all()
            
            total_plays = len(play_records)
            total_duration = sum(r.play_duration for r in play_records)
            completed_plays = sum(1 for r in play_records if r.completed)
            
            # 计算平均进度
            if total_plays > 0:
                avg_progress = sum(r.progress for r in play_records) / total_plays
                completion_rate = (completed_plays / total_plays) * 100
            else:
                avg_progress = 0
                completion_rate = 0
            
            # 获取最近播放记录
            recent_plays = self.db.query(VideoPlayRecord).filter(
                VideoPlayRecord.video_id == video_id
            ).order_by(
                VideoPlayRecord.ended_at.desc()
            ).limit(10).all()
            
            recent_play_info = []
            for record in recent_plays:
                recent_play_info.append({
                    "user_id": record.user_id,
                    "progress": record.progress,
                    "completed": record.completed,
                    "ended_at": record.ended_at.isoformat() if record.ended_at else None
                })
            
            return {
                "video_id": video_id,
                "title": video.title,
                "total_plays": total_plays,
                "total_duration": total_duration,
                "completed_plays": completed_plays,
                "average_progress": round(avg_progress, 2),
                "completion_rate": round(completion_rate, 2),
                "recent_plays": recent_play_info,
                "created_at": video.created_at.isoformat() if video.created_at else None,
                "updated_at": video.updated_at.isoformat() if video.updated_at else None
            }
            
        except Exception as e:
            raise Exception(f"获取视频统计失败: {str(e)}")


# 工具函数
def validate_file_id(file_id: str) -> bool:
    """
    验证FileID格式
    
    Args:
        file_id: 腾讯云FileID
        
    Returns:
        是否有效
    """
    if not file_id or not isinstance(file_id, str):
        return False
    
    # 腾讯云FileID通常是数字字符串
    return file_id.isdigit() and len(file_id) >= 10


def format_duration(seconds: int) -> str:
    """
    格式化时长
    
    Args:
        seconds: 秒数
        
    Returns:
        格式化后的时长字符串
    """
    if not seconds:
        return "00:00"
    
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    else:
        return f"{minutes:02d}:{secs:02d}"


def get_video_quality_options(file_id: str) -> List[Dict[str, Any]]:
    """
    获取视频清晰度选项（模拟）
    
    Args:
        file_id: 视频FileID
        
    Returns:
        清晰度选项列表
    """
    # 在实际应用中，这里应该调用腾讯云API获取转码信息
    # 这里返回模拟数据
    return [
        {
            "name": "流畅",
            "resolution": "480p",
            "bitrate": "500kbps",
            "codec": "H.264"
        },
        {
            "name": "标清",
            "resolution": "720p",
            "bitrate": "1Mbps",
            "codec": "H.264"
        },
        {
            "name": "高清",
            "resolution": "1080p",
            "bitrate": "2Mbps",
            "codec": "H.264"
        }
    ]
