// 登录学员中心：展示当前账号的线下档案、课时和在线课程。
window.DashboardPage = {
    template: `
        <div class="student-dashboard">
            <section class="student-dashboard__hero">
                <div class="site-shell">
                    <span class="section-number">LEARNING CENTER</span>
                    <div class="student-dashboard__heading">
                        <div>
                            <p class="student-dashboard__eyebrow">你好，{{ displayName }}</p>
                            <h1>我的学习中心</h1>
                        </div>
                        <div class="student-dashboard__intro">
                            <p>在这里查看课时、课堂记录和在线课程。每一次尝试，都是成长留下的真实痕迹。</p>
                            <button type="button" class="student-dashboard__logout" :disabled="logoutPending" @click="handleLogout">
                                {{ logoutPending ? '正在退出…' : '退出登录' }}
                            </button>
                            <span v-if="logoutError" class="student-dashboard__logout-error" role="status">{{ logoutError }}</span>
                        </div>
                    </div>
                </div>
            </section>

            <section v-if="isLoading" class="student-dashboard__state site-shell" aria-live="polite">
                <span class="student-dashboard__loader" aria-hidden="true"></span>
                <p>正在整理你的学习信息…</p>
            </section>

            <section v-else-if="error" class="student-dashboard__state site-shell" aria-live="assertive">
                <p class="student-dashboard__error">{{ error }}</p>
                <button class="brand-button" @click="loadUserData">重新加载</button>
            </section>

            <template v-else>
                <section class="student-dashboard__overview">
                    <div class="site-shell student-overview">
                        <article class="lesson-balance" :class="{ 'lesson-balance--empty': !lessonHours }">
                            <span class="ui-label">剩余课时</span>
                            <div class="lesson-balance__value">
                                <strong>{{ lessonHours ? lessonHours.balance : '—' }}</strong>
                                <span>课时</span>
                            </div>
                            <p>{{ lessonHours ? '课时变动由老师记录，当前页面仅供查看。' : '关联线下学员档案后，可在这里查看剩余课时。' }}</p>
                        </article>

                        <article class="student-profile-panel">
                            <div class="student-profile-panel__head">
                                <span class="ui-label">学员档案</span>
                                <span v-if="profile" class="student-status" :class="'student-status--' + profile.status">
                                    {{ profile.status === 'active' ? '在读' : '暂停' }}
                                </span>
                            </div>
                            <template v-if="profile">
                                <dl class="student-profile-facts">
                                    <div><dt>学员</dt><dd>{{ displayName }}</dd></div>
                                    <div><dt>年龄</dt><dd>{{ profile.age }} 岁</dd></div>
                                    <div><dt>监护人电话</dt><dd>{{ profile.guardian_phone_masked }}</dd></div>
                                    <div><dt>登录账号</dt><dd>{{ dashboard.user.username }}</dd></div>
                                </dl>
                            </template>
                            <div v-else class="student-profile-empty">
                                <h2>尚未关联线下学员档案</h2>
                                <p>在线课程仍可正常使用。如需查看剩余课时，请联系老师关联学员信息。</p>
                            </div>
                        </article>
                    </div>
                </section>

                <section class="section section--quiet">
                    <div class="site-shell">
                        <div class="student-section-heading">
                            <div><span class="section-number">01 · HOURS</span><h2>课时记录</h2></div>
                            <p>最近 10 条记录，仅展示课时数量和变动原因。</p>
                        </div>
                        <div v-if="transactions.length" class="lesson-ledger">
                            <article v-for="transaction in transactions" :key="transaction.id" class="lesson-ledger__row">
                                <div class="lesson-ledger__date">{{ formatDate(transaction.occurred_on) }}</div>
                                <div class="lesson-ledger__reason">
                                    <h3>{{ transaction.reason }}</h3>
                                    <p>{{ transactionLabel(transaction) }} · {{ transaction.operator }}</p>
                                </div>
                                <div class="lesson-ledger__change" :class="transaction.quantity_delta > 0 ? 'is-positive' : 'is-negative'">
                                    {{ signedQuantity(transaction.quantity_delta) }}
                                </div>
                                <div class="lesson-ledger__after">余额 {{ transaction.balance_after }}</div>
                                <span v-if="transaction.is_reversed" class="lesson-ledger__reversed">已冲正</span>
                            </article>
                        </div>
                        <div v-else class="student-empty-state">
                            <h3>暂无课时记录</h3>
                            <p>{{ profile ? '添加或消课后，记录会显示在这里。' : '关联线下学员档案后，可查看课时记录。' }}</p>
                        </div>
                    </div>
                </section>

                <section class="section student-courses">
                    <div class="site-shell">
                        <div class="student-section-heading">
                            <div><span class="section-number">02 · COURSES</span><h2>在线课程</h2></div>
                            <div class="student-course-stats" aria-label="在线课程统计">
                                <span>{{ userStats.ongoing_courses }} 门进行中</span>
                                <span>{{ userStats.completed_courses }} 门已完成</span>
                            </div>
                        </div>

                        <div class="student-course-tabs" role="tablist" aria-label="课程分类">
                            <button v-for="tab in courseTabs" :key="tab.value" role="tab"
                                    :aria-selected="activeTab === tab.value"
                                    :class="{ 'is-active': activeTab === tab.value }"
                                    @click="activeTab = tab.value">
                                {{ tab.label }} <span>{{ courseCount(tab.value) }}</span>
                            </button>
                        </div>

                        <div v-if="getCurrentCourses.length" class="student-course-list">
                            <article v-for="(item, index) in getCurrentCourses" :key="courseFor(item).id" class="student-course-row">
                                <span class="student-course-row__index">{{ String(index + 1).padStart(2, '0') }}</span>
                                <div>
                                    <h3>{{ courseFor(item).title }}</h3>
                                    <p>{{ courseDescription(courseFor(item)) }}</p>
                                </div>
                                <div v-if="activeTab !== 'available'" class="student-course-row__progress">
                                    <span>{{ item.completed ? '已完成' : '进度 ' + item.progress + '%' }}</span>
                                    <div><i :style="{ width: (item.completed ? 100 : item.progress) + '%' }"></i></div>
                                </div>
                                <span v-else class="student-course-row__meta">{{ courseFor(item).access_level === 'free' ? '免费课程' : '需开通权限' }}</span>
                                <button class="text-link student-course-row__action" @click="openCourse(courseFor(item).id)">
                                    {{ activeTab === 'ongoing' ? '继续学习' : activeTab === 'completed' ? '再次观看' : '查看课程' }} →
                                </button>
                            </article>
                        </div>
                        <div v-else class="student-empty-state">
                            <h3>{{ emptyStateTitle }}</h3>
                            <p>{{ emptyStateMessage }}</p>
                            <button v-if="activeTab !== 'available'" class="brand-button" @click="activeTab = 'available'">查看可学习课程</button>
                        </div>
                    </div>
                </section>
            </template>
        </div>
    `,
    data() {
        return {
            activeTab: 'ongoing',
            dashboard: { user: null, profile: null, lesson_hours: null },
            userStats: { total_courses: 0, completed_courses: 0, ongoing_courses: 0, total_learning_hours: 0 },
            userCourses: [],
            allCourses: [],
            isLoading: true,
            error: '',
            logoutPending: false,
            logoutError: '',
            courseTabs: [
                { value: 'ongoing', label: '进行中' },
                { value: 'completed', label: '已完成' },
                { value: 'available', label: '可学习' }
            ]
        };
    },
    computed: {
        displayName() {
            const user = this.dashboard.user;
            return user ? (user.full_name || user.username) : '同学';
        },
        profile() { return this.dashboard.profile; },
        lessonHours() { return this.dashboard.lesson_hours; },
        transactions() { return this.lessonHours ? this.lessonHours.recent_transactions : []; },
        ongoingCourses() { return this.userCourses.filter(item => !item.completed); },
        completedCourses() { return this.userCourses.filter(item => item.completed); },
        availableCourses() {
            const enrolledIds = new Set(this.userCourses.map(item => item.course.id));
            return this.allCourses.filter(course => !enrolledIds.has(course.id));
        },
        getCurrentCourses() {
            if (this.activeTab === 'completed') return this.completedCourses;
            if (this.activeTab === 'available') return this.availableCourses;
            return this.ongoingCourses;
        },
        emptyStateTitle() {
            return this.activeTab === 'completed' ? '还没有完成的课程' : this.activeTab === 'available' ? '暂无更多课程' : '还没有进行中的课程';
        },
        emptyStateMessage() {
            return this.activeTab === 'completed' ? '完成课程后，它会收录在这里。' : this.activeTab === 'available' ? '新的在线课程正在准备中。' : '可以先看看目前开放的在线课程。';
        }
    },
    mounted() { this.loadUserData(); },
    methods: {
        async handleLogout() {
            if (this.logoutPending) return;
            this.logoutPending = true;
            this.logoutError = '';
            try {
                await window.xxdfqAuth.logout();
                this.dashboard = { user: null, profile: null, lesson_hours: null };
                window.location.replace('/login');
            } catch (error) {
                this.logoutError = error.message || '退出失败，请重试。';
                this.logoutPending = false;
            }
        },
        async loadUserData() {
            this.isLoading = true;
            this.error = '';
            const apiBaseUrl = window.apiBaseUrl || '';
            try {
                const responses = await Promise.all([
                    fetch(apiBaseUrl + '/api/student/dashboard', { credentials: 'include' }),
                    fetch(apiBaseUrl + '/api/user/stats', { credentials: 'include' }),
                    fetch(apiBaseUrl + '/api/user/courses', { credentials: 'include' }),
                    fetch(apiBaseUrl + '/api/courses')
                ]);
                if (responses[0].status === 401) {
                    this.$emit('navigate', '/login');
                    return;
                }
                if (responses.some(response => !response.ok)) {
                    throw new Error('学习信息暂时无法加载，请稍后重试。');
                }
                const [dashboard, stats, userCourses, allCourses] = await Promise.all(responses.map(response => response.json()));
                if (dashboard.user.must_change_password) {
                    this.$emit('navigate', '/change-password');
                    return;
                }
                this.dashboard = dashboard;
                window.xxdfqAuth.setCurrentUser(dashboard.user);
                this.userStats = stats;
                this.userCourses = userCourses;
                this.allCourses = allCourses;
            } catch (error) {
                console.error('加载学员中心失败:', error);
                this.error = error.message || '学习信息暂时无法加载，请稍后重试。';
            } finally {
                this.isLoading = false;
            }
        },
        courseFor(item) { return item.course || item; },
        courseCount(tab) {
            if (tab === 'completed') return this.completedCourses.length;
            if (tab === 'available') return this.availableCourses.length;
            return this.ongoingCourses.length;
        },
        courseDescription(course) {
            const text = course.short_description || course.description || '在艺术中继续观察、尝试与表达。';
            return text.length > 88 ? text.slice(0, 88) + '…' : text;
        },
        transactionLabel(transaction) {
            if (transaction.transaction_type === 'consume') return '消课';
            if (transaction.transaction_type === 'reversal') return '冲正';
            return '添加课时';
        },
        signedQuantity(value) { return value > 0 ? '+' + value : String(value); },
        formatDate(value) {
            if (!value) return '—';
            const date = new Date(value + 'T00:00:00');
            return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
        },
        openCourse(courseId) { this.$emit('navigate', '/course/' + courseId); }
    }
};

console.log('学员中心页面组件已加载');
