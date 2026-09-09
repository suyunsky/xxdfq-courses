window.HomePage = {
    template: `
        <div class="home-page">
            <section class="home-hero">
                <div class="home-hero__copy">
                    <h1 class="home-hero__title">让孩子在艺术里，<br>找到自己的表达</h1>
                    <p class="home-hero__lead">不教标准答案。用自主创作，看见孩子如何选择、思考与成长。</p>
                    <div class="home-hero__actions">
                        <button class="brand-button brand-button--primary" @click="openBooking('home-hero')">预约艺术体验
                            <svg class="button-arrow" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
                        </button>
                        <a href="/gallery" class="brand-button brand-button--quiet">看看真实课堂</a>
                    </div>
                    <div class="home-hero__location">回龙观龙泽东附近 · 适合 6–12 岁</div>
                </div>
                <div class="home-hero__media">
                    <picture><source srcset="/assets/images/web/refined/growth-elephants-refined-640.webp 640w, /assets/images/web/refined/growth-elephants-refined-960.webp 960w, /assets/images/web/refined/growth-elephants-refined-1440.webp 1440w" type="image/webp"><img src="/assets/images/refined/growth-elephants-refined.png" alt="孩子们在明亮的艺术教室开心展示各自创作的小象作品"></picture>
                </div>
            </section>

            <section class="section section--quiet" id="beliefs">
                <div class="site-shell">
                    <div class="beliefs__head reveal">
                        <div><span class="section-number">01</span><h2 class="section-title">我们关注的，<br>不只是画得像不像</h2></div>
                        <p class="section-intro">艺术不是技巧的复制，而是一种看见世界的方式。每个孩子都有独特的感受、想法和表达，我们陪他们从等待答案，走向主动探索。</p>
                    </div>
                    <div class="beliefs__grid reveal">
                        <article class="belief"><h3>表达</h3><p>用自己的方式，说出所见、所想和内心感受。</p></article>
                        <article class="belief"><h3>思考</h3><p>在选择与尝试中不断提问，找到属于自己的答案。</p></article>
                        <article class="belief"><h3>学习</h3><p>从经验中总结，在挑战中调整，持续成长。</p></article>
                    </div>
                </div>
            </section>

            <section class="section">
                <div class="site-shell">
                    <div class="journey__head reveal">
                        <div><span class="section-number">02</span><h2 class="section-title">一堂课，<br>孩子经历什么</h2></div>
                        <p>我们设计的每一堂课，都是一次完整的创作旅程。孩子在真实的材料与情境中，经历从感知到回望的过程。</p>
                    </div>
                    <div class="journey__track reveal">
                        <article class="journey-step"><span class="journey-step__num">01</span><h3>感知</h3><p>观察生活，触摸材料，唤醒自己的兴趣与想法。</p></article>
                        <article class="journey-step"><span class="journey-step__num">02</span><h3>选择</h3><p>自己决定主题、材料与表达方式，开始创作。</p></article>
                        <article class="journey-step"><span class="journey-step__num">03</span><h3>尝试</h3><p>遇到困难不急着找答案，而是换一种方法继续探索。</p></article>
                        <article class="journey-step"><span class="journey-step__num">04</span><h3>回望</h3><p>看见自己走过的过程，表达感受，也积累经验。</p></article>
                    </div>
                </div>
            </section>

            <section class="section section--quiet">
                <div class="site-shell">
                    <div class="growth-gallery__header reveal">
                        <div><span class="section-number">03</span><h2 class="section-title">真实发生的成长</h2></div>
                        <p>每一幅作品、每一个专注的瞬间，都是孩子真实表达与成长的痕迹。</p>
                    </div>
                    <div class="growth-gallery__grid reveal">
                        <a href="/gallery" class="growth-gallery__item"><img src="/assets/images/web/refined/growth-focus-refined-960.webp" srcset="/assets/images/web/refined/growth-focus-refined-640.webp 640w, /assets/images/web/refined/growth-focus-refined-960.webp 960w" alt="孩子在整洁明亮的艺术教室专注为陶艺作品上色" loading="lazy"></a>
                        <a href="/gallery" class="growth-gallery__item"><img src="/assets/images/web/refined/growth-roosters-refined-960.webp" srcset="/assets/images/web/refined/growth-roosters-refined-640.webp 640w, /assets/images/web/refined/growth-roosters-refined-960.webp 960w" alt="孩子们开心展示各自创作的公鸡作品" loading="lazy"></a>
                        <a href="/gallery" class="growth-gallery__item"><img src="/assets/images/web/refined/pottery-clean-v2-960.webp" srcset="/assets/images/web/refined/pottery-clean-v2-640.webp 640w, /assets/images/web/refined/pottery-clean-v2-960.webp 960w" alt="孩子们在整洁的艺术教室体验陶艺拉坯" loading="lazy"></a>
                        <a href="/gallery" class="growth-gallery__item"><img src="/assets/images/web/refined/growth-archive-refined-960.webp" srcset="/assets/images/web/refined/growth-archive-refined-640.webp 640w, /assets/images/web/refined/growth-archive-refined-960.webp 960w" alt="儿童作品与创作成长影像" loading="lazy"></a>
                    </div>
                </div>
            </section>

            <section class="section">
                <div class="site-shell teacher-preview reveal">
                    <div class="teacher-preview__image"><img src="/assets/images/web/refined/teacher-class-refined-960.webp" srcset="/assets/images/web/refined/teacher-class-refined-640.webp 640w, /assets/images/web/refined/teacher-class-refined-960.webp 960w, /assets/images/web/refined/teacher-class-refined-1440.webp 1440w" alt="毛毛老师在明亮的艺术教室与家长分享儿童艺术教育" loading="lazy"></div>
                    <div class="teacher-preview__copy">
                        <span class="section-number">04 · MAOMAO</span>
                        <h2>毛毛老师</h2>
                        <h3>15 年专注儿童艺术教育</h3>
                        <p>我想看见孩子从犹豫到坚定、从模仿到创造的过程。心理学训练让我更关注孩子在创作中的选择、困难与表达，但一幅画不会被用来定义孩子。</p>
                        <a href="/teacher" class="text-link">认识毛毛老师
                            <svg class="button-arrow" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
                        </a>
                    </div>
                </div>
            </section>

            <section class="section section--quiet">
                <div class="site-shell experience-cta reveal">
                    <div>
                        <span class="section-number">05 · 适合 6–12 岁｜回龙观龙泽东附近</span>
                        <h2>预约一次没有标准答案的艺术体验</h2>
                        <p>走进真实的艺术课堂，让孩子在感知、思考与表达中，遇见更大的自己。</p>
                        <button class="brand-button brand-button--primary" @click="openBooking('home-final')">预约艺术体验
                            <svg class="button-arrow" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
                        </button>
                    </div>
                    <aside class="experience-cta__aside"><h3>微信咨询</h3><p>正式企业微信二维码配置后，可扫码了解课程与体验安排。</p><div class="qr-placeholder">企业微信二维码<br>上线前配置</div></aside>
                </div>
            </section>
        </div>
    `,
    mounted() { this.setupReveals(); },
    methods: {
        openBooking(source) { window.dispatchEvent(new CustomEvent('open-booking', { detail: { source } })); },
        setupReveals() {
            const els = this.$el.querySelectorAll('.reveal');
            if (!('IntersectionObserver' in window)) return els.forEach(el => el.classList.add('is-visible'));
            const observer = new IntersectionObserver(entries => entries.forEach(entry => {
                if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
            }), { threshold: .12 });
            els.forEach(el => observer.observe(el));
        }
    }
};
