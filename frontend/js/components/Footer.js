window.Footer = {
    template: `
        <footer class="site-footer">
            <div class="site-shell site-footer__main">
                <div class="site-footer__brand">
                    <a href="/" class="wordmark">小小达芬奇</a>
                    <p class="site-footer__statement">让孩子在真实的创作中，慢慢找到自己的表达。</p>
                </div>
                <nav class="site-footer__links" aria-label="页脚导航">
                    <a href="/philosophy">教育理念</a><a href="/courses">课程体系</a>
                    <a href="/gallery">成长影像</a><a href="/teacher">毛毛老师</a>
                    <a href="/login">学习中心</a><button class="text-link" style="border-width:0 0 1px;background:transparent;padding:0;width:max-content;cursor:pointer" @click="openBooking">预约体验</button>
                </nav>
                <div class="site-footer__contact">
                    <p>北京昌平区</p>
                    <p>回龙观龙泽东附近</p>
                    <p>详细地址请预约后咨询</p>
                </div>
            </div>
            <div class="site-shell site-footer__bottom">
                <span>© {{ year }} 小小达芬奇儿童艺术教育</span>
                <span>艺术打开表达，也陪孩子慢慢长大</span>
            </div>
        </footer>
    `,
    computed: { year() { return new Date().getFullYear(); } },
    methods: { openBooking() { window.dispatchEvent(new CustomEvent('open-booking', { detail: { source: 'footer' } })); } }
};
