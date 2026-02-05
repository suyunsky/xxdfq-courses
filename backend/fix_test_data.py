#!/usr/bin/env python3
"""
修复测试数据脚本
确保测试课程、课时、视频和用户正确关联
"""

import sys
import os
import hashlib

# 添加当前目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import SessionLocal, VodVideo, Course, Lesson, User

def fix_test_data():
    """修复测试数据"""
    print("=" * 60)
    print("修复测试数据脚本")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # 1. 查找测试课程
        test_course = db.query(Course).filter(Course.title == "腾讯云点播测试课程").first()
        if not test_course:
            print("❌ 测试课程不存在，正在创建...")
            test_course = Course(
                title="腾讯云点播测试课程",
                description="用于测试腾讯云点播集成的课程",
                age_range="8-10",
                stage="expression",
                status="published",
                access_level="free"
            )
            db.add(test_course)
            db.commit()
            db.refresh(test_course)
            print(f"✅ 测试课程创建成功，ID: {test_course.id}")
        else:
            print(f"✅ 测试课程已存在，ID: {test_course.id}")
        
        # 2. 查找或创建测试课时
        test_lesson = db.query(Lesson).filter(
            Lesson.course_id == test_course.id,
            Lesson.title == "腾讯云点播测试课时"
        ).first()
        
        if not test_lesson:
            print("❌ 测试课时不存在，正在创建...")
            test_lesson = Lesson(
                course_id=test_course.id,
                title="腾讯云点播测试课时",
                description="测试腾讯云点播视频播放功能",
                duration=300,
                sort_order=999,
                is_free_preview=True
            )
            db.add(test_lesson)
            db.commit()
            db.refresh(test_lesson)
            print(f"✅ 测试课时创建成功，ID: {test_lesson.id}")
        else:
            print(f"✅ 测试课时已存在，ID: {test_lesson.id}")
        
        # 3. 检查测试视频
        test_video = db.query(VodVideo).filter(
            VodVideo.title == "腾讯云点播测试视频"
        ).first()
        
        if test_video:
            print(f"✅ 测试视频已存在，ID: {test_video.id}")
            
            # 检查视频是否关联到正确的课程和课时
            needs_update = False
            
            if test_video.course_id != test_course.id:
                print(f"⚠️  视频课程ID不匹配: {test_video.course_id} -> {test_course.id}")
                test_video.course_id = test_course.id
                needs_update = True
            
            if test_video.lesson_id != test_lesson.id:
                print(f"⚠️  视频课时ID不匹配: {test_video.lesson_id} -> {test_lesson.id}")
                test_video.lesson_id = test_lesson.id
                needs_update = True
            
            if needs_update:
                db.commit()
                print("✅ 视频关联关系已更新")
        else:
            print("❌ 测试视频不存在")
            print("   请先运行 create_test_data.py 并输入您的腾讯云FileID")
        
        # 4. 检查测试用户
        test_user = db.query(User).filter(User.email == "test@xxdfq.com").first()
        if not test_user:
            print("❌ 测试用户不存在，正在创建...")
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
        else:
            print(f"✅ 测试用户已存在，ID: {test_user.id}")
        
        # 5. 打印汇总信息
        print("\n" + "=" * 60)
        print("🎉 测试数据修复完成！")
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
  - 视频ID: {test_video.id if test_video else '未找到'}
  - 视频标题: {test_video.title if test_video else '未找到'}
  - 腾讯云FileID: {test_video.file_id if test_video else '未找到'}
  - 视频状态: {test_video.status if test_video else '未找到'}

用户信息:
  - 用户ID: {test_user.id}
  - 用户名: {test_user.username}
  - 邮箱: {test_user.email}
  - 密码: test123 (测试用)

🔧 下一步操作:

1. 启动后端服务:
   cd backend && python main.py

2. 获取测试令牌:
   python get_test_token.py

3. 测试API端点:
   GET http://localhost:8000/api/vod/video/{test_video.id if test_video else '1'}
   需要认证头: Authorization: Bearer [从get_test_token.py获取的token]

4. 前端测试:
   访问课程详情页，点击测试课时，验证视频播放
        """)
        
        return True
        
    except Exception as e:
        print(f"❌ 修复测试数据失败: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    fix_test_data()