window.PhotoGalleryPage = {
    template: `
        <div>
            <header class="page-hero"><div class="site-shell page-hero__grid">
                <div class="page-hero__copy"><span class="section-number">REAL GROWTH</span><h1 class="display-title">真实发生的<br>成长</h1></div>
                <div class="page-hero__meta"><p>作品只是一个停留的瞬间。我们更珍惜孩子观察、尝试、投入和表达的整个过程。</p></div>
            </div></header>
            <section class="section section--quiet"><div class="site-shell">
                <div class="gallery-tabs" role="tablist">
                    <button v-for="tab in tabs" :key="tab.value" class="gallery-tab" :class="{ 'is-active': activeTab === tab.value }" role="tab" :aria-selected="activeTab === tab.value" @click="activeTab = tab.value">{{ tab.label }}</button>
                </div>
                <div class="masonry-gallery">
                    <figure v-for="image in filteredImages" :key="image.src" class="gallery-figure">
                        <img :src="image.src" :srcset="image.src.replace('-960.webp','-640.webp') + ' 640w, ' + image.src + ' 960w'" sizes="(max-width: 620px) 100vw, (max-width: 980px) 50vw, 33vw" :alt="image.alt" loading="lazy"><figcaption>{{ image.caption }}</figcaption>
                    </figure>
                </div>
            </div></section>
            <section class="section"><div class="site-shell boundary"><div><span class="section-number">ABOUT THE IMAGES</span><h2 class="section-title">看作品，<br>也看过程</h2></div><div><p class="section-intro">同一个主题，可以有完全不同的答案。我们不把作品排成整齐的样子，而是保留每个孩子真实的选择和痕迹。</p><button class="brand-button brand-button--primary" style="margin-top:34px" @click="openBooking">预约艺术体验</button></div></div></section>
        </div>
    `,
    data() { return {
        activeTab:'all',
        tabs:[{label:'全部',value:'all'},{label:'创作过程',value:'process'},{label:'儿童作品',value:'artwork'},{label:'户外探索',value:'outdoor'},{label:'家长课堂',value:'parents'}],
        images:[
            {src:'/assets/images/web/refined/growth-focus-refined-960.webp',category:'process',alt:'孩子为陶艺作品上色',caption:'材料与颜色之间，找到自己的选择'},
            {src:'/assets/images/web/refined/growth-roosters-refined-960.webp',category:'artwork',alt:'孩子们展示不同的创作作品',caption:'同一个主题，也有不同的答案'},
            {src:'/assets/images/web/refined/pottery-clean-v2-960.webp',category:'process',alt:'孩子体验陶艺拉坯',caption:'双手参与，感受材料的变化'},
            {src:'/assets/images/web/artworks/xxdfq-art1-960.webp',category:'artwork',alt:'儿童艺术作品',caption:'孩子眼中的世界'},
            {src:'/assets/images/web/outdoor/xxdfq-outdoor4-960.webp',category:'outdoor',alt:'孩子们在艺术课堂合影',caption:'一起创作，也彼此看见'},
            {src:'/assets/images/web/artworks/xxdfq-art2-960.webp',category:'artwork',alt:'儿童绘画作品',caption:'保留真实的表达痕迹'},
            {src:'/assets/images/web/outdoor/xxdfq-outdoor6-960.webp',category:'outdoor',alt:'户外艺术探索活动',caption:'从真实生活中发现创作主题'},
            {src:'/assets/images/web/refined/growth-elephants-refined-960.webp',category:'artwork',alt:'孩子创作的作品',caption:'作品，是一段过程的停留'},
            {src:'/assets/images/web/refined/teacher-class-refined-960.webp',category:'parents',alt:'毛毛老师与家长分享',caption:'与家长一起理解孩子的创作过程'},
            {src:'/assets/images/web/outdoor/xxdfq-outdoor7-960.webp',category:'outdoor',alt:'儿童户外艺术活动',caption:'把观察带到教室之外'},
            {src:'/assets/images/web/refined/growth-archive-refined-960.webp',category:'artwork',alt:'儿童作品与创作影像',caption:'颜色也可以是一种语言'},
            {src:'/assets/images/web/parents/xxdfq-parents1-960.webp',category:'parents',alt:'家长课堂现场',caption:'看见作品背后的选择与思考'}
        ]
    }; },
    computed: { filteredImages() { return this.activeTab === 'all' ? this.images : this.images.filter(i => i.category === this.activeTab); } },
    methods: { openBooking() { window.dispatchEvent(new CustomEvent('open-booking',{detail:{source:'gallery'}})); } }
};
