window.ChangePasswordPage = {
    template: `
        <div class="password-change-page">
            <section class="password-change-panel" aria-labelledby="password-change-title">
                <a href="/" class="wordmark">小小达芬奇</a>
                <div class="password-change-copy">
                    <h1 id="password-change-title">设置新的登录密码</h1>
                    <p>这是管理员为你创建的初始账号。第一次登录后，请先设置自己的密码。</p>
                </div>
                <form class="password-change-form" @submit.prevent="submitPassword">
                    <label>
                        <span>当前临时密码</span>
                        <input v-model="form.current_password" type="password" autocomplete="current-password" required>
                    </label>
                    <label>
                        <span>新密码</span>
                        <input v-model="form.new_password" type="password" autocomplete="new-password" minlength="8" required>
                        <small>至少 8 位字符</small>
                    </label>
                    <label>
                        <span>再次输入新密码</span>
                        <input v-model="form.confirm_password" type="password" autocomplete="new-password" minlength="8" required>
                    </label>
                    <p v-if="error" class="admin-form-error" role="alert">{{ error }}</p>
                    <button class="admin-button admin-button--primary" type="submit" :disabled="saving">
                        {{ saving ? '保存中…' : '保存新密码' }}
                    </button>
                </form>
            </section>
        </div>
    `,
    data() {
        return {
            form: { current_password: '', new_password: '', confirm_password: '' },
            saving: false,
            error: ''
        };
    },
    methods: {
        async submitPassword() {
            this.error = '';
            if (this.form.new_password !== this.form.confirm_password) {
                this.error = '两次输入的新密码不一致';
                return;
            }
            if (this.form.current_password === this.form.new_password) {
                this.error = '新密码不能与当前密码相同';
                return;
            }
            this.saving = true;
            try {
                const response = await fetch((window.apiBaseUrl || '') + '/api/auth/change-password', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        current_password: this.form.current_password,
                        new_password: this.form.new_password
                    })
                });
                const result = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(result.detail || '密码修改失败');
                this.$emit('navigate', '/dashboard');
            } catch (error) {
                this.error = error.message || '密码修改失败，请稍后重试';
            } finally {
                this.saving = false;
            }
        }
    }
};
