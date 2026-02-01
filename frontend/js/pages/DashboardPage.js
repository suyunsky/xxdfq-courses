// 用户中心页面组件 - 简化版本
window.DashboardPage = {
    template: `
        <div class="dashboard-page">
            <!-- 页面标题 -->
            <section class="art-hero" style="min-height: 40vh;">
                <div class="art-hero-content">
                    <h1 class="art-hero-title">用户中心</h1>
                    <p class="art-hero-subtitle">
                        管理您的课程和学习进度
                    </p>
                </div>
            </section>
            
            <!-- 用户信息概览 -->
            <section style="padding: var(--space-2xl) var(--space-lg);">
                <div style="max-width: 1200px; margin: 0 auto;">
                    <div class="art-card art-shadow" style="padding: var(--space-2xl);">
                        <div style="display: flex; align-items: center; gap: var(--space-xl); flex-wrap: wrap;">
                            <div style="width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, var(--color-accent-art), var(--color-accent-warm)); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; color: white;">
                                <i class="fas fa-user"></i>
                            </div>
                            <div style="flex: 1;">
                                <h2 style="margin-bottom: var(--space-sm);">艺术学习者</h2>
                                <p style="color: var(--color-text-secondary); margin-bottom: var(--space-md);">
                                    会员状态: <span style="color: var(--color-accent-art); font-weight: 500;">标准会员</span>
                                </p>
                                <div style="display: flex; gap: var(--space-md); flex-wrap: wrap;">
                                    <div style="text-align: center; padding: var(--space-md); background: var(--color-primary-50); border-radius: var(--border-radius-lg); min-width: 100px;">
                                        <div style="font-size: 1.5rem; font-weight: 600; color: var(--color-secondary-800);">6</div>
                                        <div style="font-size: 0.875rem; color: var(--color-text-secondary); margin-top: var(--space-xs);">已学习课程</div>
                                    </div>
                                    <div style="text-align: center; padding: var(--space-md); background: var(--color-primary-50); border-radius: var(--border-radius-lg); min-width: 100px;">
                                        <div style="font-size: 1.5rem; font-weight: 600; color: var(--color-secondary-800);">24</div>
                                        <div style="font-size: 0.875rem; color: var(--color-text-secondary); margin-top: var(--space-xs);">学习时长(小时)</div>
                                    </div>
                                    <div style="text-align: center; padding: var(--space-md); background: var(--color-primary-50); border-radius: var(--border-radius-lg); min-width: 100px;">
                                        <div style="font-size: 1.5rem; font-weight: 600; color: var(--color-secondary-800);">3</div>
                                        <div style="font-size: 0.875rem; color: var(--color-text-secondary); margin-top: var(--space-xs);">进行中课程</div>
                                    </div>
                                </div>
                            </div>
                            <button class="art-btn art-btn-outline" @click="editProfile">
                                <i class="fas fa-edit"></i>
                                <span>编辑资料</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>
            
            <!-- 我的课程 -->
            <section style="padding: var(--space-3xl) var(--space-lg); background: var(--color-primary-100);">
                <div style="max-width: 1200px; margin: 0 auto;">
                    <h2 style="margin-bottom: var(--space-2xl);">我的课程</h2>
                    
                    <div style="margin-bottom: var(--space-xl); display: flex; gap: var(--space-sm); border-bottom: 1px solid var(--color-primary-200); padding-bottom: var(--space-sm);">
                        <button style="padding: var(--space-sm) var(--space-xl); background: none; border: none; border-bottom: 2px solid transparent; font-size: 1rem; color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition-fast);" 
                                :class="{ active: activeTab === 'ongoing' }" @click="activeTab = 'ongoing'">
                            进行中
                        </button>
                        <button style="padding: var(--space-sm) var(--space-xl); background: none; border: none; border-bottom: 2px solid transparent; font-size: 1rem; color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition-fast);" 
                                :class="{ active: activeTab === 'completed' }" @click="activeTab = 'completed'">
                            已完成
                        </button>
                        <button style="padding: var(--space-sm) var(--space-xl); background: none; border: none; border-bottom: 2px solid transparent; font-size: 1rem; color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition-fast);" 
                                :class="{ active: activeTab === 'available' }" @click="activeTab = 'available'">
                            可学习
                        </button>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: var(--space-lg);">
                        <!-- 进行中课程 -->
                        <div v-if="activeTab === 'ongoing'" class="art-card art-shadow" v-for="course in ongoingCourses" :key="course.id" style="padding: var(--space-xl);">
                            <div style="display: flex; gap: var(--space-lg); align-items: center;">
                                <div :style="{ width: '60px', height: '60px', borderRadius: 'var(--border-radius-lg)', background: course.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'white' }">
                                    <i :class="course.icon"></i>
                                </div>
                                <div style="flex: 1;">
                                    <h3 style="margin-bottom: var(--space-xs);">{{ course.title }}</h3>
                                    <p style="color: var(--color-text-secondary); font-size: 0.875rem; margin-bottom: var(--space-sm);">
                                        {{ course.description }}
                                    </p>
                                    <div style="display: flex; align-items: center; gap: var(--space-md);">
                                        <div style="flex: 1;">
                                            <div style="height: 6px; background: var(--color-primary-200); border-radius: 3px; overflow: hidden;">
                                                <div :style="{ width: course.progress + '%', height: '100%', background: 'var(--color-accent-art)' }"></div>
                                            </div>
                                            <div style="display: flex; justify-content: space-between; margin-top: var(--space-xs);">
                                                <span style="font-size: 0.75rem; color: var(--color-text-muted);">进度 {{ course.progress }}%</span>
                                                <span style="font-size: 0.75rem; color: var(--color-text-muted);">{{ course.completed }}/{{ course.total }} 节课</span>
                                            </div>
                                        </div>
                                        <button class="art-btn" @click="continueCourse(course.id)">
                                            继续学习
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 已完成课程 -->
                        <div v-if="activeTab === 'completed'" class="art-card art-shadow" v-for="course in completedCourses" :key="course.id" style="padding: var(--space-xl);">
                            <div style="display: flex; gap: var(--space-lg); align-items: center;">
                                <div :style="{ width: '60px', height: '60px', borderRadius: 'var(--border-radius-lg)', background: course.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'white' }">
                                    <i :class="course.icon"></i>
                                </div>
                                <div style="flex: 1;">
                                    <h3 style="margin-bottom: var(--space-xs);">{{ course.title }}</h3>
                                    <p style="color: var(--color-text-secondary); font-size: 0.875rem; margin-bottom: var(--space-sm);">
                                        {{ course.description }}
                                    </p>
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="color: var(--color-accent-art); font-weight: 500;">
                                            <i class="fas fa-check-circle" style="margin-right: var(--space-xs);"></i>
                                            已完成
                                        </span>
                                        <span style="font-size: 0.875rem; color: var(--color-text-muted);">
                                            完成时间: {{ course.completedDate }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 可学习课程 -->
                        <div v-if="activeTab === 'available'" class="art-card art-shadow" v-for="course in availableCourses" :key="course.id" style="padding: var(--space-xl);">
                            <div style="display: flex; gap: var(--space-lg); align-items: center;">
                                <div :style="{ width: '60px', height: '60px', borderRadius: 'var(--border-radius-lg)', background: course.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'white' }">
                                    <i :class="course.icon"></i>
                                </div>
                                <div style="flex: 1;">
                                    <h3 style="margin-bottom: var(--space-xs);">{{ course.title }}</h3>
                                    <p style="color: var(--color-text-secondary); font-size: 0.875rem; margin-bottom: var(--space-sm);">
                                        {{ course.description }}
                                    </p>
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span :style="{ padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.75rem', fontWeight: '500', background: course.status === '可学习' ? '#e8f5e9' : '#fff3e0', color: course.status === '可学习' ? '#2e7d32' : '#f57c00' }">
                                            {{ course.status }}
                                        </span>
                                        <button class="art-btn art-btn-primary" @click="startCourse(course.id)">
                                            开始学习
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 空状态 -->
                    <div v-if="getCurrentCourses.length === 0" style="text-align: center; padding: var(--space-2xl);">
                        <i class="fas fa-book-open" style="font-size: 3rem; color: var(--color-text-muted); margin-bottom: var(--space-md);"></i>
                        <h3>暂无课程</h3>
                        <p style="color: var(--color-text-secondary); margin-top: var(--space-sm);">
                            {{ getEmptyStateMessage }}
                        </p>
                        <button class="art-btn art-btn-primary" style="margin-top: var(--space-lg);" @click="goToCourses">
                            浏览课程
                        </button>
                    </div>
                </div>
            </section>
            
            <!-- 学习统计 -->
            <section style="padding: var(--space-3xl) var(--space-lg);">
                <div style="max-width: 1200px; margin: 0 auto;">
                    <h2 style="margin-bottom: var(--space-2xl);">学习统计</h2>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-xl);">
                        <div class="art-card art-shadow" style="padding: var(--space-xl);">
                            <h3 style="margin-bottom: var(--space-md); color: var(--color-accent-art);">
                                <i class="fas fa-calendar-alt" style="margin-right: var(--space-sm);"></i>
                                学习日历
                            </h3>
                            <div style="display: flex; align-items: center; gap: var(--space-md);">
                                <div style="font-size: 2.5rem; font-weight: 300; color: var(--color-accent-art);">
                                    18
                                </div>
                                <div>
                                    <div style="font-weight: 500;">连续学习天数</div>
                                    <div style="font-size: 0.875rem; color: var(--color-text-secondary);">
                                        最近学习: 今天
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="art-card art-shadow" style="padding: var(--space-xl);">
                            <h3 style="margin-bottom: var(--space-md); color: var(--color-accent-warm);">
                                <i class="fas fa-chart-line" style="margin-right: var(--space-sm);"></i>
                                学习趋势
                            </h3>
                            <div style="display: flex; align-items: center; gap: var(--space-md);">
                                <div style="font-size: 2.5rem; font-weight: 300; color: var(--color-accent-warm);">
                                    +25%
                                </div>
                                <div>
                                    <div style="font-weight: 500;">学习时长增长</div>
                                    <div style="font-size: 0.875rem; color: var(--color-text-secondary);">
                                        相比上周
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="art-card art-shadow" style="padding: var(--space-xl);">
                            <h3 style="margin-bottom: var(--space-md); color: var(--color-accent-cool);">
                                <i class="fas fa-trophy" style="margin-right: var(--space-sm);"></i>
                                学习成就
                            </h3>
                            <div style="display: flex; align-items: center; gap: var(--space-md);">
                                <div style="font-size: 2.5rem; font-weight: 300; color: var(--color-accent-cool);">
                                    8
                                </div>
                                <div>
                                    <div style="font-weight: 500;">已获得徽章</div>
                                    <div style="font-size: 0.875rem; color: var(--color-text-secondary);">
                                        最新: 色彩探索者
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    `,
    data() {
        return {
            activeTab: 'ongoing',
            ongoingCourses: [
                {
                    id: 1,
                    title: '色彩感知启蒙',
                    description: '通过色彩游戏，唤醒孩子对颜色的敏感度和兴趣',
                    icon: 'fas fa-palette',
                    color: 'linear-gradient(135deg, #ff9a9e, #fad0c4)',
                    progress: 75,
                    completed: 6,
                    total: 8
                },
                {
                    id: 2,
                    title: '自由涂鸦表达',
                    description: '鼓励自由创作，建立绘画自信和表达欲望',
                    icon: 'fas fa-paint-brush',
                    color: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)',
                    progress: 40,
                    completed: 4,
                    total: 10
                }
            ],
            completedCourses: [
                {
                    id: 3,
                    title: '基础线条练习',
                    description: '掌握基本线条技巧，为绘画打下基础',
                    icon: 'fas fa-pen',
                    color: 'linear-gradient(135deg, #84fab0, #8fd3f4)',
                    completedDate: '2024-01-15'
                }
            ],
            availableCourses: [
                {
                    id: 4,
                    title: '形状与构图',
                    description: '学习基本形状和构图原理，理解画面结构',
                    icon: 'fas fa-shapes',
                    color: 'linear-gradient(135deg, #ffecd2, #fcb69f)',
                    status: '可学习'
                },
                {
                    id: 5,
                    title: '光影与色彩',
                    description: '探索光影关系，学习色彩搭配和情感表达',
                    icon: 'fas fa-sun',
                    color: 'linear-gradient(135deg, #84fab0, #8fd3f4)',
                    status: '需解锁'
                }
            ]
        };
    },
    computed: {
        getCurrentCourses() {
            switch (this.activeTab) {
                case 'ongoing': return this.ongoingCourses;
                case 'completed': return this.completedCourses;
                case 'available': return this.availableCourses;
                default: return [];
            }
        },
        getEmptyStateMessage() {
            switch (this.activeTab) {
                case 'ongoing': return '暂无进行中的课程，快去开始学习吧！';
                case 'completed': return '暂无已完成的课程';
                case 'available': return '暂无可学习的课程';
                default: return '暂无课程';
            }
        }
    },
    methods: {
        editProfile() {
            this.$emit('navigate', '/profile');
        },
        continueCourse(courseId) {
            this.$emit('navigate', `/course/${courseId}/learn`);
        },
        startCourse(courseId) {
            this.$emit('navigate', `/course/${courseId}/learn`);
        },
        goToCourses() {
            this.$emit('navigate', '/courses');
        }
    }
};

console.log('用户中心页面组件已加载');