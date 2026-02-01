// 首页组件 - 艺术氛围设计
window.HomePage = {
    template: `
        <div class="home-page">
            <!-- Hero区域 -->
            <section class="art-hero art-fade-in">
                <div class="art-hero-content">
                    <h1 class="art-hero-title">看见自己 · 从艺术开始</h1>
                    <p class="art-hero-subtitle">
                        以创造性艺术教育，培养孩子的观察力、创造力与自我意识
                    </p>
                    <div class="art-hero-actions">
                        <button class="art-btn art-btn-primary" @click="goToCourses">
                            <i class="fas fa-book-open"></i>
                            <span>了解课程体系</span>
                        </button>
                        <button class="art-btn art-btn-outline" @click="watchDemo">
                            <i class="fas fa-play-circle"></i>
                            <span>观看课程示例</span>
                        </button>
                    </div>
                </div>
                
                <!-- 艺术装饰元素 -->
                <div class="art-element" style="top: 20%; left: 10%;">
                    <div class="art-element-circle art-float"></div>
                </div>
                <div class="art-element" style="top: 60%; right: 15%;">
                    <div class="art-element-line" style="width: 100px;"></div>
                </div>
            </section>
            
            <!-- 艺术分隔线 -->
            <div class="art-divider"></div>
            
            <!-- 我们在做什么 -->
            <section class="art-values">
                <div class="art-values-container">
                    <h2 class="art-values-title">我们在做什么</h2>
                    <div class="art-values-grid">
                        <div class="art-value-card art-card art-shadow">
                            <div class="art-value-icon">
                                <i class="fas fa-paint-brush"></i>
                            </div>
                            <h3 class="art-value-title">创造性艺术教育</h3>
                            <p class="art-value-description">
                                通过艺术激发创造力，培养独立思考和表达能力
                            </p>
                        </div>
                        
                        <div class="art-value-card art-card art-shadow">
                            <div class="art-value-icon">
                                <i class="fas fa-eye"></i>
                            </div>
                            <h3 class="art-value-title">观察力与表达力培养</h3>
                            <p class="art-value-description">
                                学习观察世界，用艺术语言表达内心感受
                            </p>
                        </div>
                        
                        <div class="art-value-card art-card art-shadow">
                            <div class="art-value-icon">
                                <i class="fas fa-brain"></i>
                            </div>
                            <h3 class="art-value-title">艺术中的元认知觉察</h3>
                            <p class="art-value-description">
                                在创作过程中认识自我，培养反思和成长意识
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            
            <!-- 艺术成长四阶段 -->
            <section class="art-stages">
                <div class="art-stages-container">
                    <h2 class="art-stages-title">艺术成长四阶段</h2>
                    <div class="art-stages-timeline">
                        <!-- 阶段1 -->
                        <div class="art-stage-item">
                            <div class="art-stage-marker"></div>
                            <div class="art-stage-content art-card art-shadow">
                                <div class="art-stage-number">第一阶段</div>
                                <h3 class="art-stage-name">唤醒感知</h3>
                                <p class="art-stage-description">
                                    通过色彩、形状、质感的探索，唤醒对艺术的敏感度和兴趣
                                </p>
                                <button class="art-btn" style="margin-top: var(--space-md);" @click="viewStage(1)">
                                    了解更多
                                </button>
                            </div>
                        </div>
                        
                        <!-- 阶段2 -->
                        <div class="art-stage-item">
                            <div class="art-stage-marker"></div>
                            <div class="art-stage-content art-card art-shadow">
                                <div class="art-stage-number">第二阶段</div>
                                <h3 class="art-stage-name">自由表达</h3>
                                <p class="art-stage-description">
                                    鼓励自由创作，建立自信，发展个人表达风格
                                </p>
                                <button class="art-btn" style="margin-top: var(--space-md);" @click="viewStage(2)">
                                    了解更多
                                </button>
                            </div>
                        </div>
                        
                        <!-- 阶段3 -->
                        <div class="art-stage-item">
                            <div class="art-stage-marker"></div>
                            <div class="art-stage-content art-card art-shadow">
                                <div class="art-stage-number">第三阶段</div>
                                <h3 class="art-stage-name">结构理解</h3>
                                <p class="art-stage-description">
                                    学习艺术原理和技巧，理解构图、色彩、光影的关系
                                </p>
                                <button class="art-btn" style="margin-top: var(--space-md);" @click="viewStage(3)">
                                    了解更多
                                </button>
                            </div>
                        </div>
                        
                        <!-- 阶段4 -->
                        <div class="art-stage-item">
                            <div class="art-stage-marker"></div>
                            <div class="art-stage-content art-card art-shadow">
                                <div class="art-stage-number">第四阶段</div>
                                <h3 class="art-stage-name">自我风格</h3>
                                <p class="art-stage-description">
                                    形成个人艺术语言，能够独立创作有深度的作品
                                </p>
                                <button class="art-btn" style="margin-top: var(--space-md);" @click="viewStage(4)">
                                    了解更多
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            <!-- 适合人群 -->
            <section class="art-audience">
                <div class="art-audience-container">
                    <h2 class="art-audience-title">谁适合小小达芬奇</h2>
                    <div class="art-audience-tags">
                        <div class="art-audience-tag">情绪细腻的孩子</div>
                        <div class="art-audience-tag">有想法但容易卡住</div>
                        <div class="art-audience-tag">希望长期培养创造力</div>
                        <div class="art-audience-tag">对艺术有天然兴趣</div>
                        <div class="art-audience-tag">需要表达出口</div>
                        <div class="art-audience-tag">寻求个性化成长</div>
                    </div>
                </div>
            </section>
            
            <!-- 召唤行动 -->
            <section style="padding: var(--space-3xl) var(--space-lg); text-align: center;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <h2 style="margin-bottom: var(--space-lg);">开启艺术成长之旅</h2>
                    <p style="color: var(--color-text-secondary); margin-bottom: var(--space-2xl);">
                        加入小小达芬奇，让孩子在艺术中发现自我，在创作中成长
                    </p>
                    <div style="display: flex; gap: var(--space-md); justify-content: center; flex-wrap: wrap;">
                        <button class="art-btn art-btn-primary" @click="goToRegister">
                            <i class="fas fa-user-plus"></i>
                            <span>立即注册</span>
                        </button>
                        <button class="art-btn art-btn-outline" @click="contactUs">
                            <i class="fas fa-comments"></i>
                            <span>咨询课程顾问</span>
                        </button>
                    </div>
                </div>
            </section>
        </div>
    `,
    methods: {
        goToCourses() {
            this.$emit('navigate', '/courses');
        },
        watchDemo() {
            alert('课程示例视频将在新窗口打开');
            // 实际项目中这里会打开视频播放器
        },
        viewStage(stageNumber) {
            this.$emit('navigate', `/growth-path#stage-${stageNumber}`);
        },
        goToRegister() {
            this.$emit('navigate', '/register');
        },
        contactUs() {
            alert('请联系课程顾问：contact@xxdfq.com');
        }
    },
    mounted() {
        // 添加滚动动画效果
        this.setupScrollAnimations();
    },
    methods: {
        setupScrollAnimations() {
            // 简单的滚动动画效果
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('art-fade-in');
                    }
                });
            }, { threshold: 0.1 });
            
            // 观察所有卡片
            document.querySelectorAll('.art-card').forEach(card => {
                observer.observe(card);
            });
        }
    }
};

console.log('首页组件已加载');
