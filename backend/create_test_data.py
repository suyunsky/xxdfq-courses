#!/usr/bin/env python3
"""
腾讯云点播测试数据创建脚本
用于创建测试课程、课时和视频记录
"""

import sys
import os
from datetime import datetime
import hashlib

# 添加当前目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import SessionLocal, VodVideo, Course, Lesson, User

def create_test_course(db):
    """创建测试课程"""
    print("创建测试课程...")
    
    # 检查是否已存在
    test_course = db.query(Course).filter(Course.title == "腾讯云点播测试课程").first()
    if test_course:
        print(f"测试课程已存在，ID: {test_course.id}")
        return test_course
    
    # 创建新课程
    test_course = Course(
        title="腾讯云点播测试课程",
        description="用于测试腾讯云点播集成的课程",
        short_description="测试腾讯云视频播放功能",
        age_range="8-10",
        stage="expression",
        duration="1节课",
        icon="video",
        color="#4CAF50",
        cover_image="https://via.placeholder.com/800x450/4CAF50/FFFFFF?text=测试课程",
        status="published",
        access_level="free",
        price=0.0,
        sort_order=999
    )
    
    db.add(test_course)
    db.commit()
    db.refresh(test_course)
    
    print(f"✅ 测试课程创建成功，ID: {test_course.id}")
    return test_course

def create_test_lesson(db, course_id):
    """创建测试课时"""
    print("创建测试课时...")
    
    # 检查是否已存在
    test_lesson = db.query(Lesson).filter(
        Lesson.course_id == course_id,
        Lesson.title == "腾讯云点播测试课时"
    ).first()
    
    if test_lesson:
        print(f"测试课时已存在，ID: {test_lesson.id}")
        return test_lesson
    
    # 创建新课时
    test_lesson = Lesson(
        course_id=course_id,
        title="腾讯云点播测试课时",
        description="测试腾讯云点播视频播放功能",
        duration=300,  # 5分钟
        sort_order=1,
        is_free_preview=True
    )
    
    db.add(test_lesson)
    db.commit()
    db.refresh(test_lesson)
    
    print(f"✅ 测试课时创建成功，ID: {test_lesson.id}")
    return test_lesson

def create_test_video(db, course_id, lesson_id, file_id):
    """创建测试视频记录"""
    print("创建测试视频记录...")
    
    # 检查是否已存在
    test_video = db.query(VodVideo).filter(VodVideo.file_id == file_id).first()
    if test_video:
        print(f"测试视频已存在，ID: {test_video.id}")
        return test_video
    
    # 创建新视频记录
    test_video = VodVideo(
        file_id=file_id,
        title="腾讯云点播测试视频",
        description="用于测试腾讯云点播播放功能的视频",
        course_id=course_id,
        lesson_id=lesson_id,
        duration=300,  # 5分钟
        size=10240000,  # 10MB
        resolution="1920x1080",
        format="mp4",
        cover_url="https://via.placeholder.com/800x450/2196F3/FFFFFF?text=测试视频",
        status="ready"
    )
    
    db.add(test_video)
    db.commit()
    db.refresh(test_video)
    
    print(f"✅ 测试视频创建成功，ID: {test_video.id}")
    return test_video

def create_test_user(db):
    """创建测试用户"""
    print("创建测试用户...")
    
    # 检查是否已存在
    test_user = db.query(User).filter(User.email == "test@xxdfq.com").first()
    if test_user:
        print(f"测试用户已存在，ID: {test_user.id}")
        return test_user
    
    # 创建新用户（简单密码哈希，仅用于测试）
    password_hash = hashlib.sha256("test123".encode()).hexdigest()
    
    test_user = User(
        username="testuser",
        email="test@xxdfq.com",
        password_hash=password_hash,
        full_name="测试用户",
        role="student",
        is_active=True
    )
    
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    
    print(f"✅ 测试用户创建成功，ID: {test_user.id}")
    return test_user

def main():
    """主函数"""
    print("=" * 60)
    print("腾讯云点播测试数据创建脚本")
    print("=" * 60)
    
    # 获取腾讯云FileID
    print("\n📝 请输入您的腾讯云视频FileID")
    print("   （可以在腾讯云点播控制台找到）")
    
    file_id = input("FileID: ").strip()
    
    if not file_id:
        print("❌ 必须提供FileID")
        return
    
    if not file_id.isdigit():
        print("⚠️  FileID应该是数字字符串，请确认输入正确")
        confirm = input("是否继续？(y/N): ").strip().lower()
        if confirm != 'y':
            return
    
    db = SessionLocal()
    
    try:
        # 创建测试数据
        test_course = create_test_course(db)
        test_lesson = create_test_lesson(db, test_course.id)
        test_video = create_test_video(db, test_course.id, test_lesson.id, file_id)
        test_user = create_test_user(db)
        
        print("\n" + "=" * 60)
        print("🎉 测试数据创建完成！")
        print("=" * 60)
        
        print(f"""
📊 测试数据汇总:

课程信息:
  - 课程ID: {test_course.id}
  - 课程标题: {test_course.title}
  - 课程状态: {test_course.status}

课时信息:
  - 课时ID: {test_lesson.id}
  - 课时标题: {test_lesson.title}
  - 关联课程ID: {test_lesson.course_id}

视频信息:
  - 视频ID: {test_video.id}
  - 视频标题: {test_video.title}
  - 腾讯云FileID: {test_video.file_id}
  - 视频状态: {test_video.status}

用户信息:
  - 用户ID: {test_user.id}
  - 用户名: {test_user.username}
  - 邮箱: {test_user.email}
  - 密码: test123 (测试用)

🔧 下一步操作:

1. 启动后端服务:
   cd backend && python main.py

2. 测试API端点:
   GET http://localhost:8000/api/vod/video/{test_video.id}
   需要认证头: Authorization: Bearer [从登录API获取的token]

3. 前端测试:
   使用测试页面 test_vod_player.html
   设置 videoId: {test_video.id}
   设置 authToken: 从登录API获取

4. 验证播放:
   访问课程详情页，点击测试课时，验证视频播放
        """)
        
    except Exception as e:
        print(f"❌ 创建测试数据失败: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()