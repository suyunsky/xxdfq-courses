#!/usr/bin/env python3
"""
获取测试用户认证令牌脚本
用于测试腾讯云点播API
"""

import sys
import os
import json
import hashlib

# 添加当前目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import SessionLocal, User

def get_test_user_token():
    """获取测试用户的认证令牌"""
    print("获取测试用户认证令牌...")
    
    db = SessionLocal()
    
    try:
        # 查找测试用户
        test_user = db.query(User).filter(User.email == "test@xxdfq.com").first()
        
        if not test_user:
            print("❌ 测试用户不存在，请先运行 create_test_data.py")
            return None
        
        print(f"✅ 找到测试用户:")
        print(f"   用户ID: {test_user.id}")
        print(f"   用户名: {test_user.username}")
        print(f"   邮箱: {test_user.email}")
        
        # 在实际项目中，这里应该调用登录API获取JWT令牌
        # 由于我们还没有实现完整的登录API，这里模拟一个简单的令牌
        # 注意：这只是为了测试，生产环境应该使用真正的JWT令牌
        
        # 生成一个简单的测试令牌（实际项目应使用JWT）
        import time
        import base64
        
        token_data = {
            "user_id": test_user.id,
            "username": test_user.username,
            "email": test_user.email,
            "role": test_user.role,
            "exp": int(time.time()) + 3600,  # 1小时后过期
            "iat": int(time.time())
        }
        
        # 简单编码（实际项目应使用JWT签名）
        token_json = json.dumps(token_data)
        token_b64 = base64.b64encode(token_json.encode()).decode()
        
        # 添加前缀
        test_token = f"test_token_{token_b64}"
        
        print(f"\n✅ 测试令牌生成成功:")
        print(f"   {test_token}")
        
        print(f"\n📋 使用说明:")
        print(f"1. 在API请求头中添加:")
        print(f'   Authorization: Bearer {test_token}')
        print(f"\n2. 测试API端点:")
        print(f'   curl -X GET "http://localhost:8000/api/vod/video/1" \\')
        print(f'     -H "Authorization: Bearer {test_token}" \\')
        print(f'     -H "Content-Type: application/json"')
        
        print(f"\n⚠️  注意:")
        print(f"   这是一个简化的测试令牌，仅用于开发测试")
        print(f"   生产环境应使用真正的JWT令牌和完整的认证流程")
        
        return test_token
        
    except Exception as e:
        print(f"❌ 获取令牌失败: {e}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        db.close()

def test_vod_api(video_id, token):
    """测试腾讯云点播API"""
    import requests
    
    print(f"\n🔧 测试腾讯云点播API...")
    print(f"   视频ID: {video_id}")
    
    try:
        response = requests.get(
            f"http://localhost:8000/api/vod/video/{video_id}",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            timeout=10
        )
        
        print(f"✅ API响应状态: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ API调用成功:")
            print(f"   成功: {result.get('success')}")
            print(f"   消息: {result.get('message')}")
            
            if result.get('success'):
                video_info = result.get('data', {}).get('video', {})
                playback_info = result.get('data', {}).get('playback', {})
                
                print(f"\n📹 视频信息:")
                print(f"   标题: {video_info.get('title')}")
                print(f"   时长: {video_info.get('duration')}秒")
                print(f"   状态: {video_info.get('status')}")
                
                print(f"\n🔑 播放信息:")
                print(f"   FileID: {playback_info.get('file_id')}")
                print(f"   AppID: {playback_info.get('app_id')}")
                print(f"   签名长度: {len(playback_info.get('psign', ''))}字符")
                print(f"   过期时间: {playback_info.get('expire_at')}")
                
                return True
            else:
                print(f"❌ API返回失败: {result.get('message')}")
                return False
        else:
            print(f"❌ API请求失败: {response.status_code}")
            print(f"   响应内容: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到后端服务")
        print("   请确保后端服务已启动: python main.py")
        return False
    except Exception as e:
        print(f"❌ API测试失败: {e}")
        return False

def main():
    """主函数"""
    print("=" * 60)
    print("腾讯云点播API测试工具")
    print("=" * 60)
    
    # 获取测试令牌
    token = get_test_user_token()
    
    if not token:
        return
    
    # 询问是否测试API
    print("\n" + "=" * 60)
    test_api = input("是否立即测试API？(y/N): ").strip().lower()
    
    if test_api == 'y':
        # 获取视频ID
        video_id = input("请输入视频ID（默认为1）: ").strip()
        if not video_id:
            video_id = 1
        else:
            try:
                video_id = int(video_id)
            except ValueError:
                print("❌ 视频ID必须是数字")
                return
        
        # 测试API
        success = test_vod_api(video_id, token)
        
        if success:
            print("\n🎉 API测试成功！")
            print("   现在可以开始前端测试了")
        else:
            print("\n⚠️  API测试失败")
            print("   请检查后端服务是否正常运行")
    
    print("\n" + "=" * 60)
    print("📚 下一步:")
    print("1. 启动后端服务: python main.py")
    print("2. 前端测试: 使用上面的令牌进行测试")
    print("3. 验证播放: 访问课程详情页测试视频播放")
    print("=" * 60)

if __name__ == "__main__":
    main()