window.PhilosophyPage = {
    template: `
        <div>
            <header class="page-hero"><div class="site-shell page-hero__grid">
                <div class="page-hero__copy"><span class="section-number">EDUCATION</span><h1 class="display-title">好的艺术教育，<br>是让孩子成为他自己</h1></div>
                <div class="page-hero__meta"><p>我们不急着给出标准答案，而是为孩子保留观察、选择、尝试和表达的空间。</p></div>
            </div></header>
            <section class="section section--quiet"><div class="site-shell">
                <span class="section-number">01</span><h2 class="section-title">为什么不提供统一范画</h2>
                <div class="principles">
                    <article class="principle"><span class="section-number">A</span><h3>先看见</h3><p>当答案没有被提前展示，孩子才有机会认真观察对象、材料和自己的感受。</p></article>
                    <article class="principle"><span class="section-number">B</span><h3>再选择</h3><p>主题可以相同，但颜色、构图和材料由孩子自己决定。选择本身就是思考。</p></article>
                    <article class="principle"><span class="section-number">C</span><h3>允许不同</h3><p>作品不必整齐一致。每一种真实表达，都值得被认真听见和理解。</p></article>
                </div>
            </div></section>
            <section class="quote-band"><blockquote>“我不会替孩子完成作品，也不会用一幅画定义孩子。”</blockquote></section>
            <section class="section"><div class="site-shell boundary">
                <div><span class="section-number">02</span><h2 class="section-title">老师如何陪伴创作</h2><p class="section-intro">观察不是判断，而是为了在恰当的时候提一个问题、提供一种材料，或留出安静的时间。</p></div>
                <div class="boundary__list">
                    <div class="boundary__row"><strong>开始</strong><p>孩子怎样理解任务，又从哪里开始。</p></div>
                    <div class="boundary__row"><strong>选择</strong><p>孩子如何决定颜色、材料和表达路径。</p></div>
                    <div class="boundary__row"><strong>困难</strong><p>卡住时，是等待答案、放弃，还是愿意换一种方法。</p></div>
                    <div class="boundary__row"><strong>回望</strong><p>完成后能否说出自己的想法、过程和下一次尝试。</p></div>
                </div>
            </div></section>
            <section class="section section--quiet"><div class="site-shell boundary">
                <div><span class="section-number">03</span><h2 class="section-title">专业，也意味着边界</h2></div>
                <div><p class="section-intro">心理学与元认知方法帮助老师更细致地听见和提问，但课程不进行心理诊断、治疗，也不根据颜色、画面或一次行为给孩子贴标签。</p><p class="section-intro">我们只描述课堂中真实可观察的过程，不承诺提高成绩、开发大脑或产生确定性变化。</p><button class="brand-button brand-button--primary" style="margin-top:34px" @click="openBooking">预约艺术体验</button></div>
            </div></section>
        </div>
    `,
    methods: { openBooking() { window.dispatchEvent(new CustomEvent('open-booking', { detail: { source: 'philosophy' } })); } }
};
