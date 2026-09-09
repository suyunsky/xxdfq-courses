window.TeacherPage = {
    template: `
        <div>
            <header class="page-hero"><div class="site-shell page-hero__grid">
                <div class="page-hero__copy"><span class="section-number">MAOMAO</span><h1 class="display-title">毛毛老师</h1><p class="section-intro">用艺术看见孩子，陪他们从等待答案，走向主动思考与表达。</p></div>
                <figure class="teacher-hero__portrait"><img src="/assets/images/web/refined/teacher-class-refined-960.webp" srcset="/assets/images/web/refined/teacher-class-refined-640.webp 640w, /assets/images/web/refined/teacher-class-refined-960.webp 960w, /assets/images/web/refined/teacher-class-refined-1440.webp 1440w" alt="毛毛老师在明亮的艺术教室与家长分享" /></figure>
            </div></header>
            <section class="section section--quiet"><div class="site-shell teacher-method">
                <div><span class="section-number">01</span><h2 class="section-title">15 年，<br>一直在看孩子怎样创作</h2></div>
                <div><p class="section-intro">从儿童艺术课堂出发，我逐渐把注意力从“完成了什么”转向“孩子是怎样完成的”。他们如何开始、如何做选择、如何面对不确定，以及怎样说出自己的想法。</p>
                    <div class="credentials" style="margin-top:52px">
                        <div class="credential"><span>01</span><p>小小达芬奇儿童自主性绘画创始人</p></div>
                        <div class="credential"><span>02</span><p>15 年儿童艺术教育与课堂实践</p></div>
                        <div class="credential"><span>03</span><p>持续接受儿童发展、心理学与教育相关专业训练</p></div>
                    </div>
                </div>
            </div></section>
            <section class="section"><div class="site-shell teacher-method">
                <div><span class="section-number">02</span><h2 class="section-title">我在课堂里，<br>怎样看见一个孩子</h2></div>
                <div class="teacher-method__steps">
                    <article class="teacher-method__step"><span class="section-number">01</span><div><h3>不急着示范</h3><p>先让孩子说一说他看见什么、想做什么。</p></div></article>
                    <article class="teacher-method__step"><span class="section-number">02</span><div><h3>在困难旁边停一会</h3><p>用问题帮助孩子找到下一步，而不是替他把作品完成。</p></div></article>
                    <article class="teacher-method__step"><span class="section-number">03</span><div><h3>把过程说出来</h3><p>创作结束后，一起回顾选择、变化与新的发现。</p></div></article>
                </div>
            </div></section>
            <section class="section section--quiet"><div class="site-shell experience-cta">
                <div><span class="section-number">03 · 回龙观龙泽东附近</span><h2>来真实的课堂里，认识毛毛老师</h2><p>不从一幅作品判断孩子，只在一段真实的创作中，看见他的表达与选择。</p><button class="brand-button brand-button--primary" @click="openBooking">预约艺术体验</button></div>
            </div></section>
        </div>
    `,
    methods: { openBooking() { window.dispatchEvent(new CustomEvent('open-booking', { detail: { source: 'teacher' } })); } }
};
