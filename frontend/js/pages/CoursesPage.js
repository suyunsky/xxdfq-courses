// 课程页面组件
window.CoursesPage = {
    template: `
        <div class="courses-page">
            <!-- 页面标题 -->
            <section class="art-hero" style="min-height: 60vh;">
                <div class="art-hero-content">
                    <h1 class="art-hero-title">在线课程</h1>
                    <p class="art-hero-subtitle">
                        探索艺术成长路径，选择适合孩子的课程
                    </p>
                </div>
            </section>
            
            <!-- 课程筛选 -->
            <section style="padding: var(--space-2xl) var(--space-lg); background: var(--color-primary-100);">
                <div style="max-width: 1200px; margin: 0 auto;">
                    <div style="display: flex; flex-wrap: wrap; gap: var(--space-md); justify-content: center; margin-bottom: var(--space-2xl);">
                        <button class="art-btn art-btn-outline" @click="filterByAge('all')" :class="{ 'art-btn-primary': activeAgeFilter === 'all' }">
                            全部年龄段
                        </button>
                        <button class="art-btn art-btn-outline" @click="filterByAge('5-7')" :class="{ 'art-btn-primary': activeAgeFilter === '5-7' }">
                            5-7岁
                        </button>
                        <button class="art-btn art-btn-outline" @click="filterByAge('8-10')" :class="{ 'art-btn-primary': activeAgeFilter === '8-10' }">
                            8-10岁
                        </button>
                        <button class="art-btn art-btn-outline" @click="filterByAge('11-13')" :class="{ 'art-btn-primary': activeAgeFilter === '11-13' }">
                            11-13岁
                        </button>
                    </div>
                    
                    <div style="display: flex; flex-wrap: wrap; gap: var(--space-md); justify-content: center;">
                        <button class="art-btn art-btn-outline" @click="filterByStage('all')" :class="{ 'art-btn-primary': activeStageFilter === 'all' }">
                            全部阶段
                        </button>
                        <button class="art-btn art-btn-outline" @click="filterByStage('awakening')" :class="{ 'art-btn-primary': activeStageFilter === 'awakening' }">
                            唤醒感知
                        </button>
                        <button class="art-btn art-btn-outline" @click="filterByStage('expression')" :class="{ 'art-btn-primary': activeStageFilter === 'expression' }">
                            自由表达
                        </button>
                        <button class="art-btn art-btn-outline" @click="filterByStage('structure')" :class="{ 'art-btn-primary': activeStageFilter === 'structure' }">
                            结构理解
                        </button>
                        <button class="art-btn art-btn-outline" @click="filterByStage('style')" :class="{ 'art-btn-primary': activeStageFilter === 'style' }">
                            自我风格
                        </button>
                    </div>
                </div>
            </section>
            
            <!-- 课程列表 -->
            <section style="padding: var(--space-3xl) var(--space-lg);">
                <div style="max-width: 1200px; margin: 0 auto;">
                    <h2 style="text-align: center; margin-bottom: var(--space-2xl);">课程列表</h2>
                    
                    <!-- 加载状态 -->
                    <div v-if="isLoading" style="text-align: center; padding: var(--space-2xl);">
                        <div class="art-loader" style="margin: 0 auto var(--space-lg);"></div>
                        <p style="color: var(--color-text-secondary);">正在加载课程数据...</p>
                    </div>
                    
                    <!-- 错误状态 -->
                    <div v-else-if="error" style="text-align: center; padding: var(--space-2xl);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--color-error); margin-bottom: var(--space-md);"></i>
                        <h3>加载失败</h3>
                        <p style="color: var(--color-text-secondary); margin-top: var(--space-sm); margin-bottom: var(--space-lg);">
                            {{ error }}
                        </p>
                        <button class="art-btn art-btn-primary" @click="loadCourses">
                            <i class="fas fa-redo" style="margin-right: var(--space-sm);"></i>
                            重新加载
                        </button>
                    </div>
                    
                    <!-- 课程列表 -->
                    <div v-else>
                        <div class="courses-grid">
                            <!-- 课程卡片 -->
                            <div v-for="course in filteredCourses" :key="course.id" class="course-card art-card art-shadow" @click="viewCourseDetail(course.id)" style="position: relative; z-index: 1;">
                                <div class="course-image" :style="{ background: course.color }">
                                    <i :class="course.icon" style="font-size: 2rem; color: white;"></i>
                                </div>
                                <div class="course-content">
                                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--space-sm);">
                                        <h3 class="course-title">{{ course.title }}</h3>
                                        <span class="course-badge" :class="course.badgeClass">{{ course.stage }}</span>
                                    </div>
                                    <p class="course-description">{{ course.description }}</p>
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-md);">
                                        <span class="course-age">{{ course.age }}</span>
                                        <span class="course-duration">{{ course.duration }}</span>
                                    </div>
                                    <div style="margin-top: var(--space-md);">
                                        <span class="course-status" :class="course.statusClass">
                                            {{ course.status }}
                                        </span>
                                        <span v-if="course.price > 0" style="margin-left: var(--space-sm); color: var(--color-accent-warm); font-weight: 500;">
                                            ¥{{ course.price }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 空状态 -->
                        <div v-if="filteredCourses.length === 0" style="text-align: center; padding: var(--space-2xl);">
                            <i class="fas fa-search" style="font-size: 3rem; color: var(--color-text-muted); margin-bottom: var(--space-md);"></i>
                            <h3>未找到符合条件的课程</h3>
                            <p style="color: var(--color-text-secondary); margin-top: var(--space-sm);">
                                请尝试其他筛选条件
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            
            <!-- 课程分类说明 -->
            <section style="padding: var(--space-3xl) var(--space-lg); background: var(--color-primary-100);">
                <div style="max-width: 1200px; margin: 0 auto;">
                    <h2 style="text-align: center; margin-bottom: var(--space-2xl);">课程分类说明</h2>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--space-xl);">
                        <div class="art-card" style="padding: var(--space-xl);">
                            <h3 style="margin-bottom: var(--space-md); color: var(--color-accent-art);">
                                <i class="fas fa-unlock" style="margin-right: var(--space-sm);"></i>
                                公开课
                            </h3>
                            <p style="color: var(--color-text-secondary);">
                                免费体验课程，了解教学理念和方法
                            </p>
                        </div>
                        
                        <div class="art-card" style="padding: var(--space-xl);">
                            <h3 style="margin-bottom: var(--space-md); color: var(--color-accent-warm);">
                                <i class="fas fa-video" style="margin-right: var(--space-sm);"></i>
                                录播课
                            </h3>
                            <p style="color: var(--color-text-secondary);">
                                系统化课程内容，随时学习，反复观看
                            </p>
                        </div>
                        
                        <div class="art-card" style="padding: var(--space-xl);">
                            <h3 style="margin-bottom: var(--space-md); color: var(--color-accent-cool);">
                                <i class="fas fa-users" style="margin-right: var(--space-sm);"></i>
                                内部课
                            </h3>
                            <p style="color: var(--color-text-secondary);">
                                进阶课程，需要完成前置课程解锁
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    `,
    data() {
        return {
            activeAgeFilter: 'all',
            activeStageFilter: 'all',
            courses: [],
            isLoading: true,
            error: null
        };
    },
    computed: {
        filteredCourses() {
            return this.courses.filter(course => {
                const ageMatch = this.activeAgeFilter === 'all' || course.ageFilter === this.activeAgeFilter;
                const stageMatch = this.activeStageFilter === 'all' || course.stageFilter === this.activeStageFilter;
                return ageMatch && stageMatch;
            });
        }
    },
    mounted() {
        // 添加课程页面样式
        this.addCourseStyles();
        
        // 从后端API加载课程数据
        this.loadCourses();
    },
    methods: {
        filterByAge(age) {
            this.activeAgeFilter = age;
        },
        filterByStage(stage) {
            this.activeStageFilter = stage;
        },
        viewCourseDetail(courseId) {
            console.log('课程卡片被点击，课程ID:', courseId);
            console.log('触发导航到:', `/course/${courseId}`);
            this.$emit('navigate', `/course/${courseId}`);
        },
        addCourseStyles() {
            const style = document.createElement('style');
            style.textContent = `
                .courses-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: var(--space-xl);
                }
                
                .course-card {
                    cursor: pointer;
                    transition: transform var(--transition-normal), box-shadow var(--transition-normal);
                }
                
                .course-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
                }
                
                .course-image {
                    height: 150px;
                    border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .course-content {
                    padding: var(--space-lg);
                }
                
                .course-title {
                    font-size: 1.25rem;
                    margin: 0;
                    color: var(--color-secondary-800);
                }
                
                .course-badge {
                    padding: var(--space-xs) var(--space-sm);
                    border-radius: var(--border-radius-full);
                    font-size: 0.75rem;
                    font-weight: 500;
                }
                
                .badge-awakening {
                    background: var(--color-accent-art-light);
                    color: var(--color-accent-art);
                }
                
                .badge-expression {
                    background: var(--color-accent-warm-light);
                    color: var(--color-accent-warm);
                }
                
                .badge-structure {
                    background: var(--color-accent-cool-light);
                    color: var(--color-accent-cool);
                }
                
                .badge-style {
                    background: var(--color-accent-earth-light);
                    color: var(--color-accent-earth);
                }
                
                .course-description {
                    color: var(--color-text-secondary);
                    margin: var(--space-sm) 0;
                    line-height: 1.5;
                }
                
                .course-age, .course-duration {
                    font-size: 0.875rem;
                    color: var(--color-text-muted);
                }
                
                .course-status {
                    padding: var(--space-xs) var(--space-sm);
                    border-radius: var(--border-radius-sm);
                    font-size: 0.75rem;
                    font-weight: 500;
                }
                
                .status-available {
                    background: #e8f5e9;
                    color: #2e7d32;
                }
                
                .status-locked {
                    background: #fff3e0;
                    color: #f57c00;
                }
                
                .status-internal {
                    background: #e3f2fd;
                    color: #1565c0;
                }
                
                @media (max-width: 768px) {
                    .courses-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `;
            document.head.appendChild(style);
        },
        
        // 从后端API加载课程数据
        async loadCourses() {
            this.isLoading = true;
            this.error = null;
            
            try {
                const response = await fetch('http://localhost:8000/api/courses');
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const apiCourses = await response.json();
                console.log('从API加载的课程数据:', apiCourses);
                
                // 转换API数据为前端需要的格式
                this.courses = apiCourses.map(course => {
                    // 根据访问级别确定状态
                    let status, statusClass;
                    if (course.access_level === 'free') {
                        status = '可观看';
                        statusClass = 'status-available';
                    } else if (course.access_level === 'premium') {
                        status = '需解锁';
                        statusClass = 'status-locked';
                    } else {
                        status = '内部课程';
                        statusClass = 'status-internal';
                    }
                    
                    // 根据阶段确定徽章类
                    let badgeClass;
                    switch(course.stage) {
                        case 'awakening':
                            badgeClass = 'badge-awakening';
                            break;
                        case 'expression':
                            badgeClass = 'badge-expression';
                            break;
                        case 'structure':
                            badgeClass = 'badge-structure';
                            break;
                        case 'style':
                            badgeClass = 'badge-style';
                            break;
                        default:
                            badgeClass = 'badge-awakening';
                    }
                    
                    // 提取年龄段数字用于筛选
                    const ageMatch = course.age_range.match(/(\d+)-(\d+)/);
                    const ageFilter = ageMatch ? `${ageMatch[1]}-${ageMatch[2]}` : 'all';
                    
                    const icon = this.getIconForCourse(course);
                    console.log(`课程 "${course.title}" 的图标:`, icon, '原始icon字段:', course.icon);
                    
                    return {
                        id: course.id,
                        title: course.title,
                        description: course.short_description || course.description.substring(0, 100) + '...',
                        age: `${course.age_range}岁`,
                        stage: this.getStageName(course.stage),
                        duration: course.duration,
                        icon: icon,
                        color: course.color || this.getColorForCourse(course),
                        badgeClass: badgeClass,
                        status: status,
                        statusClass: statusClass,
                        ageFilter: ageFilter,
                        stageFilter: course.stage,
                        access_level: course.access_level,
                        price: course.price
                    };
                });
                
                console.log(`成功加载 ${this.courses.length} 门课程`, this.courses);
            } catch (error) {
                console.error('加载课程数据失败:', error);
                this.error = `加载课程数据失败: ${error.message}`;
                
                // 如果API失败，使用示例数据作为后备
                this.loadSampleCourses();
            } finally {
                this.isLoading = false;
            }
        },
        
        // 加载示例课程数据（后备方案）
        loadSampleCourses() {
            this.courses = [
                {
                    id: 1,
                    title: '创造性艺术与元认知成长课',
                    description: '通过艺术培养观察力、创造力与自我觉察',
                    age: '8-12岁',
                    stage: '结构理解',
                    duration: '10节课，每节45分钟',
                    icon: 'fas fa-brain',
                    color: '#4A6FA5',
                    badgeClass: 'badge-structure',
                    status: '需解锁',
                    statusClass: 'status-locked',
                    ageFilter: '8-12',
                    stageFilter: 'structure',
                    access_level: 'premium',
                    price: 299
                },
                {
                    id: 2,
                    title: '亲子美术课',
                    description: '在共同创作中建立情感连接',
                    age: '5-8岁',
                    stage: '唤醒感知',
                    duration: '10节课，每节30分钟',
                    icon: 'fas fa-users',
                    color: '#E8B4BC',
                    badgeClass: 'badge-awakening',
                    status: '可观看',
                    statusClass: 'status-available',
                    ageFilter: '5-8',
                    stageFilter: 'awakening',
                    access_level: 'free',
                    price: 0
                }
            ];
        },
        
        // 获取阶段的中文名称
        getStageName(stage) {
            const stageMap = {
                'awakening': '唤醒感知',
                'expression': '自由表达',
                'structure': '结构理解',
                'style': '自我风格'
            };
            return stageMap[stage] || stage;
        },
        
        // 根据课程信息获取图标
        getIconForCourse(course) {
            // 如果icon字段是emoji或无效，忽略它，根据课程信息生成Font Awesome类名
            const icon = course.icon;
            
            // 检查是否是有效的Font Awesome类名（包含"fa-"）
            if (icon && typeof icon === 'string' && icon.includes('fa-')) {
                return icon;
            }
            
            // 否则根据标题或阶段选择图标
            if (course.title.includes('亲子') || course.title.includes('家庭')) {
                return 'fas fa-users';
            } else if (course.title.includes('色彩') || course.title.includes('颜色')) {
                return 'fas fa-palette';
            } else if (course.title.includes('线条') || course.title.includes('绘画')) {
                return 'fas fa-paint-brush';
            } else if (course.title.includes('形状') || course.title.includes('几何')) {
                return 'fas fa-shapes';
            } else if (course.title.includes('观察') || course.title.includes('感知')) {
                return 'fas fa-eye';
            } else if (course.title.includes('创造') || course.title.includes('创新')) {
                return 'fas fa-lightbulb';
            } else if (course.title.includes('元认知') || course.title.includes('思考')) {
                return 'fas fa-brain';
            } else {
                return 'fas fa-graduation-cap';
            }
        },
        
        // 根据课程信息获取颜色
        getColorForCourse(course) {
            if (course.color) return course.color;
            
            // 根据阶段选择颜色
            const colorMap = {
                'awakening': 'linear-gradient(135deg, #ff9a9e, #fad0c4)', // 暖色
                'expression': 'linear-gradient(135deg, #a1c4fd, #c2e9fb)', // 蓝色
                'structure': 'linear-gradient(135deg, #ffecd2, #fcb69f)', // 橙色
                'style': 'linear-gradient(135deg, #d4fc79, #96e6a1)'      // 绿色
            };
            return colorMap[course.stage] || 'linear-gradient(135deg, #667eea, #764ba2)';
        }
    }
};

console.log('课程页面组件已加载');