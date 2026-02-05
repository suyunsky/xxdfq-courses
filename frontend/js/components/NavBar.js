// 导航栏组件
window.NavBar = {
    template: `
        <nav class="art-navbar">
            <div class="art-navbar-container">
                <!-- 品牌标识 -->
                <a href="/" class="art-navbar-brand">
                    <div class="art-navbar-logo">
                        <i class="fas fa-palette"></i>
                    </div>
                    <div class="art-navbar-title">小小达芬奇</div>
                </a>
                
                <!-- 导航菜单 -->
                <ul class="art-navbar-menu">
                    <li><a href="/" class="art-navbar-link">首页</a></li>
                    <li><a href="/courses" class="art-navbar-link">在线课程</a></li>
                    <li><a href="/growth-path" class="art-navbar-link">成长路径</a></li>
                    <li><a href="/about" class="art-navbar-link">关于我们</a></li>
                </ul>
                
                <!-- 用户操作 -->
                <div class="art-navbar-actions">
                    <!-- 未登录状态 -->
                    <template v-if="!currentUser">
                        <button class="art-btn art-btn-outline" @click="goToLogin">
                            <i class="fas fa-sign-in-alt"></i>
                            <span>登录</span>
                        </button>
                        <button class="art-btn art-btn-primary" @click="goToRegister">
                            <i class="fas fa-user-plus"></i>
                            <span>注册</span>
                        </button>
                    </template>
                    
                    <!-- 已登录状态 -->
                    <template v-else>
                        <div class="art-user-menu">
                            <button class="art-btn art-btn-outline" @click="goToDashboard">
                                <i class="fas fa-user-circle"></i>
                                <span>{{ currentUser.username }}</span>
                            </button>
                            <div class="art-user-dropdown">
                                <a href="/dashboard" class="art-dropdown-item" @click.prevent="goToDashboard">
                                    <i class="fas fa-tachometer-alt"></i>
                                    用户中心
                                </a>
                                <a href="/dashboard/courses" class="art-dropdown-item" @click.prevent="goToMyCourses">
                                    <i class="fas fa-book-open"></i>
                                    我的课程
                                </a>
                                <div class="art-dropdown-divider"></div>
                                <a href="#" class="art-dropdown-item" @click.prevent="handleLogout">
                                    <i class="fas fa-sign-out-alt"></i>
                                    退出登录
                                </a>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </nav>
    `,
    data() {
        return {
            currentUser: null,
            isLoading: true
        };
    },
    mounted() {
        this.checkAuthStatus();
    },
    methods: {
        async checkAuthStatus() {
            try {
                // 检查Web会话状态 - 使用全局apiBaseUrl
                const apiBaseUrl = window.apiBaseUrl || '';
                const response = await fetch(apiBaseUrl + '/api/auth/web/me', {
                    method: 'GET',
                    credentials: 'include' // 重要：包含Cookie
                });
                
                if (response.ok) {
                    const user = await response.json();
                    this.currentUser = user;
                } else {
                    // 如果Web会话失败，尝试混合认证
                    const hybridResponse = await fetch(apiBaseUrl + '/api/auth/hybrid/me', {
                        method: 'GET',
                        credentials: 'include'
                    });
                    
                    if (hybridResponse.ok) {
                        const user = await hybridResponse.json();
                        this.currentUser = user;
                    }
                }
            } catch (error) {
                console.log('用户未登录或认证失败:', error);
            } finally {
                this.isLoading = false;
            }
        },
        
        async handleLogout() {
            try {
                // 调用Web登出API - 使用全局apiBaseUrl
                const apiBaseUrl = window.apiBaseUrl || '';
                const response = await fetch(apiBaseUrl + '/api/auth/web/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
                
                if (response.ok) {
                    this.currentUser = null;
                    // 跳转到首页
                    this.$emit('navigate', '/');
                } else {
                    console.error('登出失败');
                }
            } catch (error) {
                console.error('登出错误:', error);
            }
        },
        
        goToLogin() {
            this.$emit('navigate', '/login');
        },
        
        goToRegister() {
            this.$emit('navigate', '/register');
        },
        
        goToDashboard() {
            this.$emit('navigate', '/dashboard');
        },
        
        goToMyCourses() {
            this.$emit('navigate', '/dashboard?tab=courses');
        }
    }
};

console.log('导航栏组件已加载');
