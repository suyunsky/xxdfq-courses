window.AdminStudentsPage = {
    template: `
        <div class="admin-students-page" v-if="ready">
            <header class="admin-topbar">
                <div class="admin-topbar__brand"><span class="admin-wordmark">小小达芬奇</span><span>后台管理</span></div>
                <div class="admin-topbar__user"><span>{{ adminName }}</span><button type="button" @click="logout">退出登录</button></div>
            </header>

            <div class="admin-workspace">
                <aside class="admin-sidebar" aria-label="后台导航">
                    <a href="/admin/students" class="is-active" aria-current="page">学员管理</a>
                    <a href="/dashboard">试听线索</a>
                    <a href="/courses">课程管理</a>
                    <a href="/">返回官网</a>
                </aside>

                <main class="admin-student-list">
                    <div class="admin-heading">
                        <h1>学员管理</h1>
                        <p>管理学员档案与课时余额</p>
                    </div>

                    <form class="admin-toolbar" @submit.prevent="searchStudents">
                        <label class="admin-search">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m16 16 5 5"></path></svg>
                            <span class="sr-only">搜索学员</span>
                            <input v-model.trim="filters.query" type="search" placeholder="搜索姓名 / 用户名 / 监护人手机号">
                        </label>
                        <label>
                            <span class="sr-only">学员状态</span>
                            <select v-model="filters.status" @change="searchStudents">
                                <option value="">全部状态</option>
                                <option value="active">在读</option>
                                <option value="paused">停课</option>
                            </select>
                        </label>
                        <button class="admin-button admin-button--primary" type="button" @click="openCreate">新增学员</button>
                    </form>

                    <p v-if="error" class="admin-page-error" role="alert">{{ error }}</p>
                    <div class="admin-table-wrap" :aria-busy="loading">
                        <table class="admin-student-table">
                            <thead><tr><th>学员</th><th>监护人手机</th><th>年龄</th><th>剩余课时</th><th>最近变动</th><th>状态</th><th>操作</th></tr></thead>
                            <tbody>
                                <tr v-if="loading"><td colspan="7" class="admin-empty">正在加载学员…</td></tr>
                                <tr v-else-if="students.length === 0"><td colspan="7" class="admin-empty">暂无符合条件的学员</td></tr>
                                <tr v-for="student in students" :key="student.id" :class="{ 'is-selected': selected && selected.id === student.id }" @click="selectStudent(student.id)">
                                    <td><strong>{{ student.full_name }}</strong><small>{{ student.username }}</small></td>
                                    <td>{{ student.guardian_phone }}</td>
                                    <td>{{ student.age }}岁</td>
                                    <td><strong class="admin-balance" :class="{ 'is-zero': student.lesson_balance === 0 }">{{ student.lesson_balance }}</strong></td>
                                    <td>{{ formatDate(student.last_transaction_at) }}</td>
                                    <td>{{ statusLabel(student.status) }}</td>
                                    <td><button type="button" class="admin-text-button" @click.stop="selectStudent(student.id)">查看</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="admin-pagination" v-if="total > 0">
                        <span>共 {{ total }} 条记录</span>
                        <div>
                            <button type="button" :disabled="page === 1" @click="goPage(page - 1)" aria-label="上一页">
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>
                            </button>
                            <span>{{ page }}</span>
                            <button type="button" :disabled="page * pageSize >= total" @click="goPage(page + 1)" aria-label="下一页">
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"></path></svg>
                            </button>
                        </div>
                    </div>
                </main>

                <aside class="admin-student-detail" v-if="selected" aria-live="polite">
                    <div class="admin-detail-heading">
                        <div><h2>{{ selected.full_name }}</h2><p>{{ selected.username }}</p><p>{{ selected.age }}岁 · {{ statusLabel(selected.status) }}</p></div>
                        <button class="admin-text-button" type="button" @click="openEdit">编辑档案</button>
                    </div>
                    <dl class="admin-student-meta">
                        <div><dt>监护人手机</dt><dd>{{ selected.guardian_phone }}</dd></div>
                        <div v-if="selected.email"><dt>登录邮箱</dt><dd>{{ selected.email }}</dd></div>
                    </dl>
                    <div class="admin-detail-balance">
                        <span>剩余课时</span><strong>{{ selected.lesson_balance }}</strong><em>课时</em>
                    </div>
                    <div class="admin-detail-actions">
                        <button class="admin-button admin-button--primary" type="button" :disabled="selected.lesson_balance === 0" @click="openHours('consume')">消课</button>
                        <button class="admin-button admin-button--outline" type="button" @click="openHours('add')">添加课时</button>
                    </div>
                    <div class="admin-account-tools">
                        <button type="button" @click="resetPassword">重置初始密码</button>
                    </div>
                    <section class="admin-ledger">
                        <div class="admin-ledger__heading"><h3>课时流水</h3><span>{{ transactionsTotal }} 条</span></div>
                        <p v-if="transactionsLoading" class="admin-empty">正在加载流水…</p>
                        <p v-else-if="transactions.length === 0" class="admin-empty">暂无课时流水</p>
                        <ol v-else>
                            <li v-for="transaction in transactions" :key="transaction.id">
                                <div class="admin-ledger__line">
                                    <strong>{{ transactionTypeLabel(transaction) }}</strong>
                                    <span :class="transaction.quantity_delta > 0 ? 'is-positive' : 'is-negative'">{{ signedQuantity(transaction.quantity_delta) }}课时</span>
                                </div>
                                <p>{{ transaction.reason }}</p>
                                <small>{{ formatDate(transaction.occurred_on) }} · {{ transaction.operator }} · 余额 {{ transaction.balance_after }}</small>
                                <button v-if="transaction.transaction_type !== 'reversal' && !transaction.is_reversed" type="button" class="admin-text-button" @click="openReverse(transaction)">冲正</button>
                                <span v-else-if="transaction.is_reversed" class="admin-reversed">已冲正</span>
                            </li>
                        </ol>
                    </section>
                </aside>
                <aside v-else class="admin-student-detail admin-student-detail--empty"><p>选择一名学员查看档案和课时流水</p></aside>
            </div>

            <div class="admin-overlay" v-if="studentDialogOpen" @click.self="closeStudentDialog">
                <section class="admin-dialog" role="dialog" aria-modal="true" :aria-labelledby="studentDialogMode === 'create' ? 'create-student-title' : 'edit-student-title'">
                    <div class="admin-dialog__heading">
                        <div><h2 :id="studentDialogMode === 'create' ? 'create-student-title' : 'edit-student-title'">{{ studentDialogMode === 'create' ? '新增学员' : '编辑学员档案' }}</h2><p>{{ studentDialogMode === 'create' ? '创建后将生成一次性初始密码' : '登录用户名创建后不可修改' }}</p></div>
                        <button type="button" class="admin-close" @click="closeStudentDialog" aria-label="关闭">×</button>
                    </div>
                    <form class="admin-form" @submit.prevent="saveStudent">
                        <div class="admin-form-grid">
                            <label><span>学员姓名</span><input v-model.trim="studentForm.full_name" required maxlength="100"></label>
                            <label><span>登录用户名</span><input v-model.trim="studentForm.username" :disabled="studentDialogMode === 'edit'" required pattern="[A-Za-z0-9_.-]{3,50}"><small>3–50 位英文字母、数字、点、横线或下划线</small></label>
                            <label><span>出生日期</span><input v-model="studentForm.birth_date" type="date" required></label>
                            <label><span>监护人手机号</span><input v-model.trim="studentForm.guardian_phone" inputmode="tel" required pattern="(?:\\+?86)?1[3-9][0-9]{9}"></label>
                            <label v-if="studentDialogMode === 'create'"><span>邮箱（选填）</span><input v-model.trim="studentForm.email" type="email"></label>
                            <label v-else><span>学员状态</span><select v-model="studentForm.status"><option value="active">在读</option><option value="paused">停课</option></select></label>
                        </div>
                        <label><span>备注（选填）</span><textarea v-model.trim="studentForm.notes" maxlength="1000"></textarea></label>
                        <p v-if="dialogError" class="admin-form-error" role="alert">{{ dialogError }}</p>
                        <div class="admin-dialog__actions"><button type="button" class="admin-button admin-button--quiet" @click="closeStudentDialog">取消</button><button class="admin-button admin-button--primary" type="submit" :disabled="dialogSaving">{{ dialogSaving ? '保存中…' : '保存学员' }}</button></div>
                    </form>
                </section>
            </div>

            <div class="admin-overlay admin-overlay--drawer" v-if="hourDrawerOpen" @click.self="closeHours">
                <section class="admin-drawer" role="dialog" aria-modal="true" aria-labelledby="hour-operation-title">
                    <div class="admin-dialog__heading">
                        <div><h2 id="hour-operation-title">{{ hourOperationTitle }}</h2><p>本次操作将生成一条不可修改的课时流水</p></div>
                        <button type="button" class="admin-close" @click="closeHours" aria-label="关闭">×</button>
                    </div>
                    <form class="admin-form admin-hour-form" @submit.prevent="saveHours">
                        <label v-if="hourForm.mode !== 'reverse'"><span>{{ hourForm.mode === 'add' ? '添加数量' : '消课数量' }}</span><div class="admin-stepper"><button type="button" @click="hourForm.quantity = Math.max(1, hourForm.quantity - 1)">−</button><input v-model.number="hourForm.quantity" type="number" min="1" max="999" step="1" required><button type="button" @click="hourForm.quantity = Math.min(999, hourForm.quantity + 1)">＋</button></div><small>仅支持输入正整数</small></label>
                        <label v-if="hourForm.mode !== 'reverse'"><span>{{ hourForm.mode === 'consume' ? '上课日期' : '业务日期' }}</span><input v-model="hourForm.occurred_on" type="date" required></label>
                        <label><span>{{ hourForm.mode === 'reverse' ? '冲正原因' : (hourForm.mode === 'add' ? '添加原因' : '消课原因') }}</span><textarea v-model.trim="hourForm.reason" :placeholder="hourReasonPlaceholder" maxlength="200" required></textarea></label>
                        <label><span>备注（选填）</span><textarea v-model.trim="hourForm.note" maxlength="1000"></textarea></label>
                        <div class="admin-balance-preview"><span>当前余额<strong>{{ selected.lesson_balance }}</strong></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg><span>操作后<strong :class="{ 'is-invalid': projectedBalance < 0 }">{{ projectedBalance }}</strong></span></div>
                        <p class="admin-drawer-note">提交后如需纠正，请通过冲正处理</p>
                        <p v-if="dialogError" class="admin-form-error" role="alert">{{ dialogError }}</p>
                        <div class="admin-dialog__actions"><button type="button" class="admin-button admin-button--quiet" @click="closeHours">取消</button><button class="admin-button admin-button--primary" type="submit" :disabled="dialogSaving || !hourForm.reason || projectedBalance < 0">{{ dialogSaving ? '提交中…' : hourConfirmLabel }}</button></div>
                    </form>
                </section>
            </div>

            <div class="admin-overlay" v-if="temporaryPassword">
                <section class="admin-dialog admin-dialog--password" role="dialog" aria-modal="true" aria-labelledby="temporary-password-title">
                    <div class="admin-dialog__heading"><div><h2 id="temporary-password-title">账号已创建</h2><p>初始密码只显示这一次，请安全地交给学员。</p></div></div>
                    <div class="admin-temporary-password"><code>{{ temporaryPassword }}</code><button type="button" class="admin-text-button" @click="copyTemporaryPassword">复制密码</button></div>
                    <p v-if="copyMessage" class="admin-copy-message">{{ copyMessage }}</p>
                    <div class="admin-dialog__actions"><button class="admin-button admin-button--primary" type="button" @click="temporaryPassword = ''">我已保存</button></div>
                </section>
            </div>
        </div>
        <div v-else class="admin-loading">正在进入后台管理…</div>
    `,
    data() {
        return {
            ready: false,
            currentUser: null,
            students: [], selected: null, transactions: [],
            total: 0, page: 1, pageSize: 20, transactionsTotal: 0,
            loading: false, transactionsLoading: false, error: '', dialogError: '', dialogSaving: false,
            filters: { query: '', status: '' },
            studentDialogOpen: false, studentDialogMode: 'create',
            studentForm: { full_name: '', username: '', email: '', guardian_phone: '', birth_date: '', status: 'active', notes: '' },
            hourDrawerOpen: false,
            hourForm: { mode: 'consume', quantity: 1, occurred_on: '', reason: '', note: '', transactionId: null, originalDelta: 0, idempotency_key: '' },
            temporaryPassword: '', copyMessage: ''
        };
    },
    computed: {
        adminName() { return this.currentUser?.full_name || this.currentUser?.username || '管理员'; },
        hourOperationTitle() { return this.hourForm.mode === 'add' ? '添加课时' : this.hourForm.mode === 'reverse' ? '冲正课时流水' : '消课'; },
        hourReasonPlaceholder() { return this.hourForm.mode === 'add' ? '例如：春季课包' : this.hourForm.mode === 'reverse' ? '请说明本次纠正原因' : '例如：周六创作基础课到课'; },
        hourConfirmLabel() { return this.hourForm.mode === 'add' ? '确认添加' : this.hourForm.mode === 'reverse' ? '确认冲正' : '确认消课'; },
        projectedBalance() {
            if (!this.selected) return 0;
            if (this.hourForm.mode === 'reverse') return this.selected.lesson_balance - this.hourForm.originalDelta;
            return this.selected.lesson_balance + (this.hourForm.mode === 'add' ? this.hourForm.quantity : -this.hourForm.quantity);
        }
    },
    methods: {
        api(path, options = {}) {
            return fetch((window.apiBaseUrl || '') + path, { credentials: 'include', ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
        },
        async responseData(response) {
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : '请求失败，请稍后重试');
            return data;
        },
        async authenticate() {
            try {
                const response = await this.api('/api/auth/web/me');
                if (!response.ok) { this.$emit('navigate', '/login'); return; }
                this.currentUser = await response.json();
                if (this.currentUser.must_change_password) { this.$emit('navigate', '/change-password'); return; }
                if (this.currentUser.role !== 'admin') { this.$emit('navigate', '/dashboard'); return; }
                this.ready = true;
                await this.loadStudents();
            } catch (_) { this.$emit('navigate', '/login'); }
        },
        async loadStudents() {
            this.loading = true; this.error = '';
            try {
                const params = new URLSearchParams({ page: this.page, page_size: this.pageSize });
                if (this.filters.query) params.set('query', this.filters.query);
                if (this.filters.status) params.set('status', this.filters.status);
                const data = await this.responseData(await this.api('/api/admin/students?' + params));
                this.students = data.items; this.total = data.total;
                const preferred = this.selected && this.students.find(item => item.id === this.selected.id);
                if (preferred) await this.selectStudent(preferred.id);
                else if (this.students.length) await this.selectStudent(this.students[0].id);
                else { this.selected = null; this.transactions = []; this.transactionsTotal = 0; }
            } catch (error) { this.error = error.message; }
            finally { this.loading = false; }
        },
        searchStudents() { this.page = 1; this.loadStudents(); },
        goPage(nextPage) { this.page = nextPage; this.loadStudents(); },
        async selectStudent(id) {
            this.transactionsLoading = true;
            try {
                const [studentResponse, transactionResponse] = await Promise.all([
                    this.api('/api/admin/students/' + id),
                    this.api('/api/admin/students/' + id + '/lesson-hour-transactions?page_size=50')
                ]);
                this.selected = await this.responseData(studentResponse);
                const transactionData = await this.responseData(transactionResponse);
                this.transactions = transactionData.items; this.transactionsTotal = transactionData.total;
            } catch (error) { this.error = error.message; }
            finally { this.transactionsLoading = false; }
        },
        openCreate() {
            this.studentDialogMode = 'create'; this.dialogError = '';
            this.studentForm = { full_name: '', username: '', email: '', guardian_phone: '', birth_date: '', status: 'active', notes: '' };
            this.studentDialogOpen = true;
        },
        openEdit() {
            this.studentDialogMode = 'edit'; this.dialogError = '';
            this.studentForm = { full_name: this.selected.full_name, username: this.selected.username, email: this.selected.email || '', guardian_phone: this.selected.guardian_phone, birth_date: this.selected.birth_date, status: this.selected.status, notes: this.selected.notes || '' };
            this.studentDialogOpen = true;
        },
        closeStudentDialog() { if (!this.dialogSaving) this.studentDialogOpen = false; },
        async saveStudent() {
            this.dialogSaving = true; this.dialogError = '';
            try {
                const create = this.studentDialogMode === 'create';
                const payload = create ? {
                    full_name: this.studentForm.full_name, username: this.studentForm.username,
                    email: this.studentForm.email || null, guardian_phone: this.studentForm.guardian_phone,
                    birth_date: this.studentForm.birth_date, notes: this.studentForm.notes || null
                } : {
                    full_name: this.studentForm.full_name, guardian_phone: this.studentForm.guardian_phone,
                    birth_date: this.studentForm.birth_date, status: this.studentForm.status,
                    notes: this.studentForm.notes || null
                };
                const path = create ? '/api/admin/students' : '/api/admin/students/' + this.selected.id;
                const data = await this.responseData(await this.api(path, { method: create ? 'POST' : 'PUT', body: JSON.stringify(payload) }));
                this.studentDialogOpen = false;
                if (create) this.temporaryPassword = data.temporary_password;
                await this.loadStudents();
                if (!create) await this.selectStudent(this.selected.id);
            } catch (error) { this.dialogError = error.message; }
            finally { this.dialogSaving = false; }
        },
        openHours(mode) {
            this.dialogError = ''; this.hourForm = { mode, quantity: 1, occurred_on: new Date().toISOString().slice(0, 10), reason: '', note: '', transactionId: null, originalDelta: 0, idempotency_key: this.newIdempotencyKey() };
            this.hourDrawerOpen = true;
        },
        openReverse(transaction) {
            this.dialogError = ''; this.hourForm = { mode: 'reverse', quantity: 1, occurred_on: new Date().toISOString().slice(0, 10), reason: '', note: '', transactionId: transaction.id, originalDelta: transaction.quantity_delta, idempotency_key: this.newIdempotencyKey() };
            this.hourDrawerOpen = true;
        },
        closeHours() { if (!this.dialogSaving) this.hourDrawerOpen = false; },
        async saveHours() {
            this.dialogSaving = true; this.dialogError = '';
            try {
                let path, body;
                if (this.hourForm.mode === 'reverse') {
                    path = '/api/admin/lesson-hour-transactions/' + this.hourForm.transactionId + '/reverse';
                    body = { reason: this.hourForm.reason, note: this.hourForm.note || null, idempotency_key: this.hourForm.idempotency_key };
                } else {
                    path = '/api/admin/students/' + this.selected.id + '/lesson-hours';
                    body = { operation: this.hourForm.mode, quantity: Number(this.hourForm.quantity), occurred_on: this.hourForm.occurred_on, reason: this.hourForm.reason, note: this.hourForm.note || null, idempotency_key: this.hourForm.idempotency_key };
                }
                await this.responseData(await this.api(path, { method: 'POST', body: JSON.stringify(body) }));
                this.hourDrawerOpen = false;
                await this.loadStudents(); await this.selectStudent(this.selected.id);
            } catch (error) { this.dialogError = error.message; }
            finally { this.dialogSaving = false; }
        },
        async resetPassword() {
            if (!window.confirm('确认重置该学员的登录密码？当前登录会话将失效。')) return;
            try {
                const data = await this.responseData(await this.api('/api/admin/students/' + this.selected.id + '/reset-password', { method: 'POST', body: '{}' }));
                this.temporaryPassword = data.temporary_password;
            } catch (error) { this.error = error.message; }
        },
        async copyTemporaryPassword() {
            try { await navigator.clipboard.writeText(this.temporaryPassword); this.copyMessage = '已复制'; }
            catch (_) { this.copyMessage = '请手动复制密码'; }
        },
        async logout() {
            await this.api('/api/auth/web/logout', { method: 'POST', body: '{}' }).catch(() => {});
            this.$emit('navigate', '/');
        },
        statusLabel(value) { return value === 'paused' ? '停课' : '在读'; },
        formatDate(value) { if (!value) return '—'; return String(value).slice(0, 10); },
        signedQuantity(value) { return value > 0 ? '+' + value : String(value); },
        newIdempotencyKey() { return window.crypto?.randomUUID ? window.crypto.randomUUID() : 'lesson-' + Date.now() + '-' + Math.random().toString(36).slice(2); },
        transactionTypeLabel(transaction) { return transaction.transaction_type === 'add' ? '添加' : transaction.transaction_type === 'consume' ? '消课' : '冲正'; }
    },
    mounted() { this.authenticate(); }
};
