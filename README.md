# 小小达芬奇艺术教育平台

一个简洁、留白、艺术教育气质的网站，包含完整的课程管理和用户学习系统。

## 项目特点

### 设计理念
- **克制温暖**: 非营销化设计，注重艺术教育本质
- **艺术氛围**: 抽象艺术元素，留白设计，温暖色调
- **专业导向**: 以艺术教育与成长路径为核心内容

### 技术架构
- **前端**: Vue 3 + 原生JavaScript + 艺术风格CSS
- **后端**: FastAPI + SQLAlchemy + JWT认证
- **数据库**: SQLite（可扩展为MySQL/PostgreSQL）
- **部署**: 零配置，开箱即用

## 项目结构

```
xxdfq-courses/
├── frontend/                    # 前端代码
│   ├── index.html              # 主页面
│   ├── css/                    # 样式文件
│   │   ├── variables.css       # 设计变量
│   │   ├── style.css          # 主样式
│   │   └── components.css      # 组件样式
│   ├── js/                     # JavaScript文件
│   │   ├── app.js             # Vue应用入口
│   │   ├── components/         # Vue组件
│   │   ├── pages/             # 页面组件
│   │   └── utils/             # 工具函数
│   └── assets/                 # 静态资源
├── backend/                    # 后端代码
│   ├── main.py                # FastAPI主应用
│   ├── models.py              # 数据库模型
│   ├── auth.py                # 认证模块
│   ├── requirements.txt       # Python依赖
│   └── .env.example           # 环境变量示例
└── README.md                  # 项目说明
```

## 快速开始

### 1. 启动前端服务

```bash
cd frontend
python3 -m http.server 3000
```

访问: http://localhost:3000

### 2. 启动后端服务

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 启动服务
python main.py
```

访问: http://localhost:8000
API文档: http://localhost:8000/api/docs

### 3. 使用Docker启动（可选）

```bash
# 构建镜像
docker build -t xxdfq-courses .

# 运行容器
docker run -p 8000:8000 xxdfq-courses
```

## 功能模块

### 1. 首页 (Home)
- 艺术氛围Hero区域
- 四阶段成长路径展示
- 价值主张说明
- 艺术元素动画效果

### 2. 课程页面 (Courses)
- 课程列表展示
- 多维度筛选（年龄段、成长阶段）
- 权限状态显示
- 课程详情查看

### 3. 用户中心 (Dashboard)
- 我的课程列表
- 学习进度管理
- 学习统计面板
- 个人信息管理

### 4. 登录/注册 (Auth)
- 用户注册和登录
- JWT令牌认证
- 忘记密码功能
- 权限控制

### 5. 后台管理 (Admin)
- 课程管理
- 用户管理
- 内容管理
- 数据统计

## API接口

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/users/me` - 获取当前用户信息

### 课程相关
- `GET /api/courses` - 获取课程列表（支持筛选）
- `GET /api/courses/{id}` - 获取课程详情
- `GET /api/courses/{id}/lessons` - 获取课程章节

### 用户学习相关
- `GET /api/user/courses` - 获取用户课程
- `POST /api/user/courses/{id}/enroll` - 报名课程
- `PUT /api/user/courses/{id}/progress` - 更新学习进度
- `GET /api/user/stats` - 获取学习统计

### 视频相关
- `GET /api/video/access/{id}` - 获取视频访问权限和令牌

### 管理员相关
- `POST /api/admin/courses` - 创建课程
- `POST /api/admin/courses/{id}/lessons` - 创建课程章节

## 数据库设计

### 核心表结构
1. **users** - 用户表
2. **courses** - 课程表
3. **lessons** - 课程章节表
4. **user_courses** - 用户课程关系表
5. **enrollments** - 报名记录表
6. **learning_records** - 学习记录表

### 权限系统
- **学生 (student)**: 可以学习已报名的课程
- **教师 (teacher)**: 可以管理自己的课程
- **管理员 (admin)**: 拥有所有权限

## 艺术设计系统

### 色彩系统
- **主色**: 米白 (#F8F5F0) / 暖灰 (#E8E4DD)
- **辅色**: 深蓝 (#2C3E50) / 墨绿 (#34495E)
- **点缀色**: 低饱和艺术色（水彩效果）

### 字体系统
- **中文**: 思源宋体 / 思源黑体
- **英文**: Inter / Helvetica

### 间距系统
基于8px的间距系统，确保视觉一致性

### 动画效果
- 艺术背景点动画
- 浮动元素动画
- 平滑过渡效果
- 微交互反馈

## 开发指南

### 前端开发
1. 所有组件使用Vue 3 Composition API风格
2. CSS使用设计变量，确保一致性
3. 组件按功能模块组织
4. 使用原生JavaScript，无构建工具

### 后端开发
1. 使用FastAPI框架，自动生成API文档
2. SQLAlchemy ORM管理数据库
3. JWT令牌认证
4. 模块化设计，易于扩展

### 数据库迁移
```bash
# 创建迁移
alembic revision --autogenerate -m "描述"

# 应用迁移
alembic upgrade head
```

## 部署指南

### 生产环境部署
1. 复制环境变量文件
```bash
cp .env.example .env
# 编辑.env文件，配置生产环境参数
```

2. 使用生产数据库
```bash
# 修改DATABASE_URL为生产数据库
DATABASE_URL=mysql+mysqlconnector://user:password@host/database
```

3. 配置反向代理（Nginx）
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

4. 使用进程管理（PM2）
```bash
# 安装PM2
npm install -g pm2

# 启动后端服务
pm2 start "python main.py" --name xxdfq-backend

# 启动前端服务
pm2 start "python3 -m http.server 3000" --name xxdfq-frontend
```

## 扩展功能

### 计划中的功能
1. **视频播放器**: 集成专业的视频播放器
2. **支付系统**: 集成微信支付、支付宝
3. **社交功能**: 学习社区、作品分享
4. **移动应用**: React Native移动应用
5. **数据分析**: 学习行为分析、推荐系统

### 第三方集成
- **视频服务**: Cloudflare Stream, Vimeo
- **文件存储**: AWS S3, Cloudinary
- **邮件服务**: SendGrid, Mailgun
- **监控服务**: Sentry, New Relic

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交代码变更
4. 创建Pull Request

## 许可证

MIT License

## 联系方式

- 项目主页: https://xxdfq.com
- 问题反馈: https://github.com/your-repo/issues
- 文档: https://docs.xxdfq.com

---

**小小达芬奇 - 看见自己 · 从艺术开始**