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
                    <a :href="currentUser ? '/dashboard' : '/login'" class="site-nav__learning">{{ currentUser ? '学习中心' : '登录' }}</a>
                    <button class="brand-button brand-button--primary site-nav__cta" @click="openBooking">预约体验</button>
                    <button class="site-nav__toggle" type="button" :aria-expanded="menuOpen" aria-label="打开导航" @click="menuOpen = !menuOpen">
                        <span></span><span></span><span></span>
                    </button>
                </div>
            </div>
            <nav class="mobile-menu" :class="{ 'is-open': menuOpen }" aria-label="移动端导航">
                <a v-for="item in links" :key="item.path" :href="item.path" @click="closeMenu">{{ item.label }}</a>
                <a :href="currentUser ? '/dashboard' : '/login'" @click="closeMenu">{{ currentUser ? '学习中心' : '学员登录' }}</a>
                <div class="mobile-menu__meta">北京昌平区<br>回龙观龙泽东附近</div>
            </nav>
        </header>
    `,
    data() {
        return {
            menuOpen: false,
            currentUser: null,
            links: [
                { label: '教育理念', path: '/philosophy' },
                { label: '课程体系', path: '/courses' },
                { label: '成长影像', path: '/gallery' },
                { label: '毛毛老师', path: '/teacher' }
            ]
        };
    },
    mounted() { this.checkAuthStatus(); },
    methods: {
        isActive(path) { return window.location.pathname === path; },
        closeMenu() { this.menuOpen = false; },
        openBooking() { this.closeMenu(); window.dispatchEvent(new CustomEvent('open-booking', { detail: { source: 'nav' } })); },
        async checkAuthStatus() {
            try {
                const response = await fetch((window.apiBaseUrl || '') + '/api/auth/web/me', { credentials: 'include' });
                if (response.ok) this.currentUser = await response.json();
            } catch (_) { this.currentUser = null; }
        }
    }
};
