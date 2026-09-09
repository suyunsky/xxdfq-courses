window.TrialBooking = {
    template: `
        <teleport to="body">
            <div v-if="open" class="booking-backdrop" @click.self="close" @keydown.esc="close">
                <section class="booking-panel" role="dialog" aria-modal="true" aria-labelledby="booking-title">
                    <button class="booking-close" type="button" aria-label="关闭预约窗口" @click="close"></button>
                    <div class="booking-panel__form">
                        <div class="section-number">BOOK A TRIAL</div>
                        <h2 id="booking-title">预约一次<br>没有标准答案的艺术体验</h2>
                        <p class="booking-panel__intro">适合 6–12 岁。留下三项基本信息，老师会与您确认体验安排。</p>
                        <form class="booking-form" @submit.prevent="submit">
                            <div class="field">
                                <label for="child-age">孩子年龄</label>
                                <select id="child-age" v-model="form.child_age" required>
                                    <option value="" disabled>请选择年龄</option>
                                    <option v-for="age in [6,7,8,9,10,11,12]" :key="age" :value="age">{{ age }} 岁</option>
                                </select>
                                <div class="field-error">{{ errors.child_age }}</div>
                            </div>
                            <div class="field">
                                <label for="community">所在社区</label>
                                <input id="community" v-model.trim="form.community" maxlength="50" autocomplete="address-level3" placeholder="例如：龙泽苑" required>
                                <div class="field-error">{{ errors.community }}</div>
                            </div>
                            <div class="field">
                                <label for="phone">联系电话</label>
                                <input id="phone" v-model.trim="form.phone" inputmode="tel" maxlength="20" autocomplete="tel" placeholder="用于老师联系确认" required>
                                <div class="field-error">{{ errors.phone }}</div>
                            </div>
                            <input v-model="form.website" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-10000px">
                            <label class="consent">
                                <input v-model="form.consent" type="checkbox">
                                <span>我已阅读并同意预约信息仅用于本次课程联系与安排。不会采集孩子姓名、照片或心理健康信息。</span>
                            </label>
                            <div class="field-error">{{ errors.consent }}</div>
                            <div v-if="message" class="form-status" :class="{ 'form-status--error': submitError }" role="status">{{ message }}</div>
                            <button class="brand-button brand-button--primary" type="submit" :disabled="submitting">
                                {{ submitting ? '正在提交' : '提交预约信息' }}
                                <svg class="button-arrow" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
                            </button>
                        </form>
                    </div>
                    <aside class="booking-panel__wechat">
                        <h3>也可以直接微信咨询</h3>
                        <p>正式企业微信二维码配置后，可直接扫码添加课程顾问。</p>
                        <div class="booking-qr" aria-label="企业微信二维码待配置">企业微信二维码<br>上线前配置</div>
                        <p class="ui-label">回龙观龙泽东附近</p>
                    </aside>
                </section>
            </div>
        </teleport>
    `,
    data() {
        return {
            open: false, source: 'website', submitting: false, submitError: false, message: '', lastFocused: null,
            form: { child_age: '', community: '', phone: '', consent: false, website: '' },
            errors: { child_age: '', community: '', phone: '', consent: '' }
        };
    },
    mounted() { window.addEventListener('open-booking', this.handleOpen); },
    beforeUnmount() { window.removeEventListener('open-booking', this.handleOpen); },
    methods: {
        handleOpen(event) {
            this.source = event.detail?.source || 'website';
            this.lastFocused = document.activeElement;
            this.open = true; document.body.classList.add('modal-open');
            this.$nextTick(() => document.getElementById('child-age')?.focus());
        },
        close() { this.open = false; document.body.classList.remove('modal-open'); this.lastFocused?.focus?.(); },
        validate() {
            this.errors = { child_age: '', community: '', phone: '', consent: '' };
            if (!this.form.child_age) this.errors.child_age = '请选择孩子年龄';
            if (this.form.community.length < 2) this.errors.community = '请填写所在社区';
            if (!/^(?:\+?86)?1[3-9]\d{9}$/.test(this.form.phone.replace(/[\s-]/g, ''))) this.errors.phone = '请输入有效的中国大陆手机号';
            if (!this.form.consent) this.errors.consent = '请确认信息使用说明';
            return !Object.values(this.errors).some(Boolean);
        },
        async submit() {
            if (!this.validate() || this.submitting) return;
            this.submitting = true; this.submitError = false; this.message = '';
            const query = new URLSearchParams(window.location.search);
            try {
                const response = await fetch((window.apiBaseUrl || '') + '/api/trial-leads', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                    body: JSON.stringify({
                        child_age: Number(this.form.child_age), community: this.form.community,
                        phone: this.form.phone.replace(/[\s-]/g, ''), consent: this.form.consent,
                        website: this.form.website, source_code: query.get('source') || this.source,
                        utm_source: query.get('utm_source'), utm_medium: query.get('utm_medium'),
                        utm_campaign: query.get('utm_campaign'), landing_path: window.location.pathname
                    })
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(data.detail || '提交失败，请稍后重试');
                this.message = `预约信息已收到（编号 ${data.lead_id}）。老师会尽快与您联系。`;
                this.form = { child_age: '', community: '', phone: '', consent: false, website: '' };
            } catch (error) { this.submitError = true; this.message = error.message || '网络连接失败，请保留信息后重试'; }
            finally { this.submitting = false; }
        }
    }
};
