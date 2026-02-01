#!/usr/bin/env python3
"""
小小达芬奇课程平台 - 数据初始化脚本
初始化2门核心课程，每门课程包含10节课
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from models import get_db, create_tables, User, Course, Lesson
from auth import get_password_hash
from datetime import datetime

def init_database():
    """初始化数据库表"""
    print("创建数据库表...")
    create_tables()
    print("数据库表创建完成")

def create_test_users(db: Session):
    """创建测试用户"""
    print("创建测试用户...")
    
    # 检查用户是否已存在
    existing_users = db.query(User).count()
    if existing_users > 0:
        print("用户数据已存在，跳过创建")
        return
    
    # 创建测试用户
    test_users = [
        {
            "username": "student",
            "email": "student@xxdfq.com",
            "password": "student123",
            "full_name": "测试学生",
            "role": "student"
        },
        {
            "username": "teacher",
            "email": "teacher@xxdfq.com",
            "password": "teacher123",
            "full_name": "测试老师",
            "role": "teacher"
        },
        {
            "username": "admin",
            "email": "admin@xxdfq.com",
            "password": "admin123",
            "full_name": "系统管理员",
            "role": "admin"
        }
    ]
    
    for user_data in test_users:
        user = User(
            username=user_data["username"],
            email=user_data["email"],
            password_hash=get_password_hash(user_data["password"]),
            full_name=user_data["full_name"],
            role=user_data["role"],
            is_active=True
        )
        db.add(user)
    
    db.commit()
    print(f"创建了 {len(test_users)} 个测试用户")

def create_courses(db: Session):
    """创建课程数据"""
    print("创建课程数据...")
    
    # 检查课程是否已存在
    existing_courses = db.query(Course).count()
    if existing_courses > 0:
        print("课程数据已存在，跳过创建")
        return
    
    # 课程1：创造性艺术与元认知成长课
    course1 = Course(
        title="创造性艺术与元认知成长课",
        description="""本课程通过系统的艺术创作活动，引导孩子建立对自我创作过程的觉察能力。
课程不仅教授绘画技巧，更重要的是培养孩子的元认知能力——即"思考自己的思考"，
帮助他们在创作中建立自信、发展独特的艺术表达方式。""",
        short_description="通过艺术培养观察力、创造力与自我觉察",
        age_range="8-12",
        stage="structure",  # 结构理解阶段
        duration="10节课，每节45分钟",
        icon="🧠",
        color="#4A6FA5",
        cover_image="https://images.unsplash.com/photo-1544717305-2782549b5136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        video_url="https://example.com/videos/course1-preview.mp4",
        status="published",
        access_level="premium",
        price=299.0,
        sort_order=1
    )
    db.add(course1)
    db.flush()  # 获取course1的ID
    
    # 课程1的10节课
    course1_lessons = [
        {
            "title": "观察力的觉醒",
            "description": "学习如何'真正地看'，培养细致观察的能力。通过观察日常物品的细节，发现平时忽略的美。",
            "video_url": "https://example.com/videos/course1-lesson1.mp4",
            "duration": 2700,  # 45分钟
            "is_free_preview": True,
            "sort_order": 1
        },
        {
            "title": "线条的语言",
            "description": "探索线条如何表达情绪，学习用不同的线条表现平静、激动、混乱等情感状态。",
            "video_url": "https://example.com/videos/course1-lesson2.mp4",
            "duration": 2700,
            "is_free_preview": False,
            "sort_order": 2
        },
        {
            "title": "色彩的感知",
            "description": "理解色彩与情感的联系，学习色彩心理学基础，探索个人对色彩的情感反应。",
            "video_url": "https://example.com/videos/course1-lesson3.mp4",
            "duration": 2700,
            "is_free_preview": False,
            "sort_order": 3
        },
        {
            "title": "形状的思考",
            "description": "对比几何形状与有机形状的表达特性，思考形状如何影响画面的整体感觉。",
            "video_url": "https://example.com/videos/course1-lesson4.mp4",
            "duration": 2700,
            "is_free_preview": False,
            "sort_order": 4
        },
        {
            "title": "构图的意识",
            "description": "学习画面布局的思考过程，理解平衡、对比、节奏等构图原则。",
            "video_url": "https://example.com/videos/course1-lesson5.mp4",
            "duration": 2700,
            "is_free_preview": False,
            "sort_order": 5
        },
        {
            "title": "材料的探索",
            "description": "尝试不同绘画材料的表达特性，从铅笔到水彩，发现最适合自己的创作工具。",
            "video_url": "https://example.com/videos/course1-lesson6.mp4",
            "duration": 2700,
            "is_free_preview": False,
            "sort_order": 6
        },
        {
            "title": "风格的萌芽",
            "description": "通过模仿与创新，发现个人艺术偏好，开始形成独特的创作风格。",
            "video_url": "https://example.com/videos/course1-lesson7.mp4",
            "duration": 2700,
            "is_free_preview": False,
            "sort_order": 7
        },
        {
            "title": "创作的反思",
            "description": "学习作品回顾与自我评价的方法，建立创作反思的习惯。",
            "video_url": "https://example.com/videos/course1-lesson8.mp4",
            "duration": 2700,
            "is_free_preview": False,
            "sort_order": 8
        },
        {
            "title": "表达的勇气",
            "description": "突破创作舒适区，尝试表达更深层的情感和想法。",
            "video_url": "https://example.com/videos/course1-lesson9.mp4",
            "duration": 2700,
            "is_free_preview": False,
            "sort_order": 9
        },
        {
            "title": "成长的见证",
            "description": "课程总结与作品集展示，回顾整个学习历程的成长与收获。",
            "video_url": "https://example.com/videos/course1-lesson10.mp4",
            "duration": 2700,
            "is_free_preview": False,
            "sort_order": 10
        }
    ]
    
    for lesson_data in course1_lessons:
        lesson = Lesson(
            course_id=course1.id,
            title=lesson_data["title"],
            description=lesson_data["description"],
            video_url=lesson_data["video_url"],
            duration=lesson_data["duration"],
            is_free_preview=lesson_data["is_free_preview"],
            sort_order=lesson_data["sort_order"]
        )
        db.add(lesson)
    
    # 课程2：亲子美术课
    course2 = Course(
        title="亲子美术课",
        description="""专为亲子设计的艺术体验课程，通过简单的艺术活动促进亲子情感交流。
课程强调过程而非结果，在轻松愉快的创作氛围中，
帮助孩子建立对艺术的基本感知，同时增进亲子间的理解与连接。""",
        short_description="在共同创作中建立情感连接",
        age_range="5-8",
        stage="awakening",  # 唤醒感知阶段
        duration="10节课，每节30分钟",
        icon="👨‍👩‍👧",
        color="#E8B4BC",
        cover_image="https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        video_url="https://example.com/videos/course2-preview.mp4",
        status="published",
        access_level="free",
        price=0.0,
        sort_order=2
    )
    db.add(course2)
    db.flush()  # 获取course2的ID
    
    # 课程2的10节课
    course2_lessons = [
        {
            "title": "手印的印记",
            "description": "亲子手印创作，记录成长的美好瞬间，感受亲密接触的温暖。",
            "video_url": "https://example.com/videos/course2-lesson1.mp4",
            "duration": 1800,  # 30分钟
            "is_free_preview": True,
            "sort_order": 1
        },
        {
            "title": "色彩的对话",
            "description": "共同调色与分享，学习基础色彩知识，在调色过程中增进交流。",
            "video_url": "https://example.com/videos/course2-lesson2.mp4",
            "duration": 1800,
            "is_free_preview": True,
            "sort_order": 2
        },
        {
            "title": "线条的舞蹈",
            "description": "跟随音乐的自由线条创作，体验节奏与线条的和谐之美。",
            "video_url": "https://example.com/videos/course2-lesson3.mp4",
            "duration": 1800,
            "is_free_preview": True,
            "sort_order": 3
        },
        {
            "title": "形状的游戏",
            "description": "几何形状拼贴游戏，培养空间感知能力，在游戏中学习形状组合。",
            "video_url": "https://example.com/videos/course2-lesson4.mp4",
            "duration": 1800,
            "is_free_preview": True,
            "sort_order": 4
        },
        {
            "title": "自然的纹理",
            "description": "户外材料收集与创作，感受大自然的纹理之美，培养环保意识。",
            "video_url": "https://example.com/videos/course2-lesson5.mp4",
            "duration": 1800,
            "is_free_preview": True,
            "sort_order": 5
        },
        {
            "title": "故事的画面",
            "description": "共同创作故事插图，将想象转化为画面，培养叙事能力。",
            "video_url": "https://example.com/videos/course2-lesson6.mp4",
            "duration": 1800,
            "is_free_preview": True,
            "sort_order": 6
        },
        {
            "title": "情感的色彩",
            "description": "用颜色表达心情，学习情感与色彩的关联，增进情感理解。",
            "video_url": "https://example.com/videos/course2-lesson7.mp4",
            "duration": 1800,
            "is_free_preview": True,
            "sort_order": 7
        },
        {
            "title": "合作的壁画",
            "description": "大型合作作品创作，体验团队协作的乐趣，完成共同目标。",
            "video_url": "https://example.com/videos/course2-lesson8.mp4",
            "duration": 1800,
            "is_free_preview": True,
            "sort_order": 8
        },
        {
            "title": "记忆的相册",
            "description": "家庭照片艺术化处理，将珍贵记忆转化为艺术作品。",
            "video_url": "https://example.com/videos/course2-lesson9.mp4",
            "duration": 1800,
            "is_free_preview": True,
            "sort_order": 9
        },
        {
            "title": "爱的礼物",
            "description": "为彼此创作礼物，表达爱与感谢，体验给予的快乐。",
            "video_url": "https://example.com/videos/course2-lesson10.mp4",
            "duration": 1800,
            "is_free_preview": True,
            "sort_order": 10
        }
    ]
    
    for lesson_data in course2_lessons:
        lesson = Lesson(
            course_id=course2.id,
            title=lesson_data["title"],
            description=lesson_data["description"],
            video_url=lesson_data["video_url"],
            duration=lesson_data["duration"],
            is_free_preview=lesson_data["is_free_preview"],
            sort_order=lesson_data["sort_order"]
        )
        db.add(lesson)
    
    db.commit()
    print(f"创建了 2 门课程，共 20 节课")

def main():
    """主函数"""
    print("=" * 60)
    print("小小达芬奇课程平台 - 数据初始化")
    print("=" * 60)
    
    try:
        # 初始化数据库
        init_database()
        
        # 获取数据库会话
        db = next(get_db())
        
        # 创建测试用户
        create_test_users(db)
        
        # 创建课程数据
        create_courses(db)
        
        print("\n" + "=" * 60)
        print("✅ 数据初始化完成！")
        print("\n初始化内容：")
        print("  - 测试用户：student, teacher, admin")
        print("  - 课程1：创造性艺术与元认知成长课（10节课，付费）")
        print("  - 课程2：亲子美术课（10节课，免费）")
        print("\n访问信息：")
        print("  - 前端网站：http://localhost:8080")
        print("  - API文档：http://localhost:8000/api/docs")
        print("  - 测试账号：student / student123")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ 初始化失败：{e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()