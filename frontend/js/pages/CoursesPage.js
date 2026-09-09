window.CoursesPage = {
    template: `
        <div>
            <header class="page-hero"><div class="site-shell page-hero__grid">
                <div class="page-hero__copy"><span class="section-number">COURSES</span><h1 class="display-title">从艺术兴趣，<br>走向主动表达</h1></div>
                <div class="page-hero__meta"><p>课程始终从艺术出发。孩子在绘画、材料与创作任务中练习感知、选择、调整和回望。</p></div>
            </div></header>
            <section class="section section--quiet"><div class="site-shell programs">
                <article class="program"><span class="program__number">01 · FOUNDATION</span><h2>艺术成长<br>基础课</h2><p class="program__lead">先通过艺术打开兴趣与表达，在轻松的创作中建立自己的判断，并开始回顾“我是怎样做到的”。</p>
                    <dl><div><dt>适合</dt><dd>初次体验、喜欢画画与材料探索的孩子</dd></div><div><dt>过程</dt><dd>感知、表达、自主选择与元认知启蒙</dd></div><div><dt>重点</dt><dd>愿意尝试，也能逐渐说出自己的想法</dd></div></dl>
                </article>
                <article class="program"><span class="program__number">02 · ADVANCED</span><h2>艺术与元认知<br>进阶课</h2><p class="program__lead">在更完整的艺术任务中，练习面对困难、调整方法与复盘过程。元认知是创作后的提问方式，不取代艺术本身。</p>
                    <dl><div><dt>适合</dt><dd>已有创作经验，希望继续深入探索的孩子</dd></div><div><dt>过程</dt><dd>艺术创作与阶段性回顾相互配合</dd></div><div><dt>重点</dt><dd>看见自己的思考路径，积累调整经验</dd></div></dl>
                </article>
            </div></section>
            <section class="section"><div class="site-shell course-catalog">
                <div class="course-catalog__header"><div><span class="section-number">ONLINE</span><h2 class="section-title">在线课程</h2></div><p>为已报名学员提供课程回看与延伸内容。</p></div>
                <div class="course-filters" aria-label="课程筛选">
                    <button v-for="filter in ageFilters" :key="filter.value" class="filter-button" :class="{ 'is-active': activeAge === filter.value }" @click="activeAge = filter.value">{{ filter.label }}</button>
                </div>
                <div v-if="isLoading" class="course-row"><span>—</span><span>正在加载课程</span></div>
                <div v-else-if="error" class="form-status form-status--error">{{ error }} <button class="text-link" @click="loadCourses">重新加载</button></div>
                <div v-else class="courses-list">
                    <article v-for="(course,index) in filteredCourses" :key="course.id" class="course-row" tabindex="0" @click="viewCourse(course.id)" @keydown.enter="viewCourse(course.id)">
                        <span class="course-row__index">{{ String(index + 1).padStart(2, '0') }}</span>
                        <h3 class="course-row__title">{{ course.title }}</h3>
                        <span class="course-row__meta">{{ course.age_range }} · {{ course.duration }} · {{ stageLabel(course.stage) }}</span>
                        <svg class="button-arrow" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
                    </article>
                    <div v-if="filteredCourses.length === 0" class="course-row"><span>—</span><span>暂时没有符合条件的课程</span></div>
                </div>
            </div></section>
            <section class="section section--quiet"><div class="site-shell experience-cta"><div><span class="section-number">适合 6–12 岁｜回龙观龙泽东附近</span><h2>先从一次真实的艺术体验开始</h2><p>在选择课程前，先让孩子走进课堂，感受材料、创作和表达。</p><button class="brand-button brand-button--primary" @click="openBooking">预约艺术体验</button></div></div></section>
        </div>
    `,
    data() { return { activeAge: 'all', courses: [], isLoading: true, error: '', ageFilters: [{label:'全部课程',value:'all'},{label:'5–7 岁',value:'5-7'},{label:'8–10 岁',value:'8-10'},{label:'11–13 岁',value:'11-13'}] }; },
    computed: { filteredCourses() { return this.activeAge === 'all' ? this.courses : this.courses.filter(c => c.age_range === this.activeAge); } },
    mounted() { this.loadCourses(); },
    methods: {
        async loadCourses() { this.isLoading=true; this.error=''; try { const r=await fetch((window.apiBaseUrl||'')+'/api/courses',{credentials:'include'}); if(!r.ok) throw new Error('课程加载失败'); this.courses=await r.json(); } catch(e) { this.error=e.message; } finally { this.isLoading=false; } },
        stageLabel(stage) { return {awakening:'感知',expression:'表达',structure:'理解',style:'个人语言'}[stage] || stage || '艺术成长'; },
        viewCourse(id) { this.$emit('navigate', `/course/${id}`); },
        openBooking() { window.dispatchEvent(new CustomEvent('open-booking',{detail:{source:'courses'}})); }
    }
};
