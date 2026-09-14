window.NavBar = {
    template: `
        <header class="site-nav">
            <div class="site-nav__inner">
                <a href="/" class="wordmark" @click="closeMenu">
                    小小达芬奇
                    <small>让每个孩子都有自己的答案</small>
                </a>
                <nav class="site-nav__links" aria-label="主导航">
                    <a v-for="item in links" :key="item.path" :href="item.path" class="site-nav__link" :class="{ 'is-active': isActive(item.path) }">{{ item.label }}</a>
                </nav>
                <div class="site-nav__actions">
                    <a :href="learningCenterPath" class="site-nav__learning">{{ learningCenterLabel }}</a>
                    <button v-if="currentUser" type="button" class="site-nav__logout" :disabled="logoutPending" @click="handleLogout">
                        {{ logoutPending ? '正在退出…' : '退出登录' }}
                    </button>
                    <button class="brand-button brand-button--primary site-nav__cta" @click="openBooking">预约体验</button>
                    <button class="site-nav__toggle" type="button" :aria-expanded="menuOpen" aria-label="打开导航" @click="menuOpen = !menuOpen">
                        <span></span><span></span><span></span>
                    </button>
                </div>
            </div>
            <nav class="mobile-menu" :class="{ 'is-open': menuOpen }" aria-label="移动端导航">
                <a v-for="item in links" :key="item.path" :href="item.path" @click="closeMenu">{{ item.label }}</a>
                <a :href="learningCenterPath" @click="closeMenu">{{ learningCenterLabel }}</a>
                <button v-if="currentUser" type="button" class="mobile-menu__logout" :disabled="logoutPending" @click="handleLogout">
                    {{ logoutPending ? '正在退出…' : '退出登录' }}
                </button>
                <p v-if="logoutError" class="nav-logout-error" role="status">{{ logoutError }}</p>
                <div class="mobile-menu__meta">北京昌平区<br>回龙观龙泽东附近</div>
            </nav>
        </header>
    `,
    data() {
        return {
            menuOpen: false,
            currentUser: null,
            logoutPending: false,
            logoutError: '',
            links: [
                { label: '教育理念', path: '/philosophy' },
                { label: '课程体系', path: '/courses' },
                { label: '成长影像', path: '/gallery' },
                { label: '毛毛老师', path: '/teacher' }
            ]
        };
    },
    computed: {
        learningCenterPath() {
            if (!this.currentUser) return '/login';
            return this.currentUser.role === 'admin' ? '/admin/students' : '/dashboard';
        },
        learningCenterLabel() {
            if (!this.currentUser) return '学员登录';
            return this.currentUser.role === 'admin' ? '学员管理' : '学习中心';
        }
    },
    mounted() {
        this.authStateHandler = (event) => {
            this.currentUser = event.detail ? event.detail.user : null;
        };
        window.addEventListener('xxdfq-auth-changed', this.authStateHandler);
        this.checkAuthStatus();
    },
    beforeUnmount() {
        window.removeEventListener('xxdfq-auth-changed', this.authStateHandler);
    },
    methods: {
        isActive(path) { return window.location.pathname === path; },
        closeMenu() { this.menuOpen = false; },
        openBooking() { this.closeMenu(); window.dispatchEvent(new CustomEvent('open-booking', { detail: { source: 'nav' } })); },
        async handleLogout() {
            if (this.logoutPending) return;
            this.logoutPending = true;
            this.logoutError = '';
            try {
                await window.xxdfqAuth.logout();
                this.currentUser = null;
                this.closeMenu();
                window.location.replace('/login');
            } catch (error) {
                this.logoutError = error.message || '退出失败，请重试。';
                this.logoutPending = false;
            }
        },
        async checkAuthStatus() {
            try {
                const response = await fetch((window.apiBaseUrl || '') + '/api/auth/web/me', { credentials: 'include' });
                this.currentUser = response.ok ? await response.json() : null;
            } catch (_) { this.currentUser = null; }
        }
    }
};
