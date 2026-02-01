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
                    <button class="art-btn art-btn-outline" @click="goToLogin">
                        <i class="fas fa-sign-in-alt"></i>
                        <span>登录</span>
                    </button>
                    <button class="art-btn art-btn-primary" @click="goToRegister">
                        <i class="fas fa-user-plus"></i>
                        <span>注册</span>
                    </button>
                </div>
            </div>
        </nav>
    `,
    methods: {
        goToLogin() {
            this.$emit('navigate', '/login');
        },
        goToRegister() {
            this.$emit('navigate', '/register');
        }
    }
};

console.log('导航栏组件已加载');
