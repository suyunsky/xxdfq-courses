// 登录页面组件
window.LoginPage = {
    template: `
        <div class="login-page">
            <!-- 页面标题 -->
            <section class="art-hero" style="min-height: 40vh;">
                <div class="art-hero-content">
                    <h1 class="art-hero-title">登录</h1>
                    <p class="art-hero-subtitle">
                        欢迎回到小小达芬奇艺术教育平台
                    </p>
                </div>
            </section>
            
            <!-- 登录表单 -->
            <section style="padding: var(--space-3xl) var(--space-lg);">
                <div style="max-width: 500px; margin: 0 auto;">
                    <div class="art-card art-shadow" style="padding: var(--space-2xl);">
                        <form @submit.prevent="handleLogin">
                            <div style="margin-bottom: var(--space-xl);">
                                <label style="display: block; margin-bottom: var(--space-sm); font-weight: 500; color: var(--color-secondary-800);">
                                    用户名或邮箱
                                </label>
                                <input 
                                    type="text" 
                                    v-model="loginForm.username"
                                    required
                                    style="width: 100%; padding: var(--space-md); border: 1px solid var(--color-primary-300); border-radius: var(--border-radius-md); font-size: 1rem; transition: border-color var(--transition-fast);"
                                    :style="{ borderColor: loginError ? 'var(--color-error)' : 'var(--color-primary-300)' }"
                                    placeholder="请输入用户名或邮箱"
                                >
                            </div>
                            
                            <div style="margin-bottom: var(--space-xl);">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm);">
                                    <label style="font-weight: 500; color: var(--color-secondary-800);">
                                        密码
                                    </label>
                                    <a href="#" style="font-size: 0.875rem; color: var(--color-accent-art); text-decoration: none;" @click.prevent="showForgotPassword = true">
                                        忘记密码？
                                    </a>
                                </div>
                                <input 
                                    type="password" 
                                    v-model="loginForm.password"
                                    required
                                    style="width: 100%; padding: var(--space-md); border: 1px solid var(--color-primary-300); border-radius: var(--border-radius-md); font-size: 1rem; transition: border-color var(--transition-fast);"
                                    :style="{ borderColor: loginError ? 'var(--color-error)' : 'var(--color-primary-300)' }"
                                    placeholder="请输入密码"
                                >
                            </div>
                            
                            <div v-if="loginError" style="margin-bottom: var(--space-xl); padding: var(--space-md); background: var(--color-error-light); border-radius: var(--border-radius-md); color: var(--color-error);">
                                {{ loginError }}
                            </div>
                            
                            <button 
                                type="submit" 
                                class="art-btn art-btn-primary" 
                                style="width: 100%; padding: var(--space-md); font-size: 1rem;"
                                :disabled="isLoggingIn"
                            >
                                <span v-if="isLoggingIn">
                                    <i class="fas fa-spinner fa-spin" style="margin-right: var(--space-sm);"></i>
                                    登录中...
                                </span>
                                <span v-else>
                                    登录
                                </span>
                            </button>
                            
                            <div style="text-align: center; margin-top: var(--space-xl); color: var(--color-text-secondary);">
                                还没有账号？
                                <a href="/register" style="color: var(--color-accent-art); text-decoration: none; font-weight: 500;" @click.prevent="goToRegister">
                                    立即注册
                                </a>
                            </div>
                        </form>
                    </div>
                    
                    <!-- 忘记密码模态框 -->
                    <div v-if="showForgotPassword" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                        <div class="art-card art-shadow" style="width: 90%; max-width: 400px; padding: var(--space-2xl);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-xl);">
                                <h2 style="margin: 0;">重置密码</h2>
                                <button @click="showForgotPassword = false" style="background: none; border: none; font-size: 1.5rem; color: var(--color-text-secondary); cursor: pointer;">
                                    &times;
                                </button>
                            </div>
                            
                            <form @submit.prevent="handleForgotPassword">
                                <div style="margin-bottom: var(--space-xl);">
                                    <label style="display: block; margin-bottom: var(--space-sm); font-weight: 500; color: var(--color-secondary-800);">
                                        邮箱地址
                                    </label>
                                    <input 
                                        type="email" 
                                        v-model="forgotPasswordEmail"
                                        required
                                        style="width: 100%; padding: var(--space-md); border: 1px solid var(--color-primary-300); border-radius: var(--border-radius-md); font-size: 1rem;"
                                        placeholder="请输入注册时使用的邮箱"
                                    >
                                </div>
                                
                                <div v-if="forgotPasswordMessage" style="margin-bottom: var(--space-xl); padding: var(--space-md); background: var(--color-success-light); border-radius: var(--border-radius-md); color: var(--color-success);">
                                    {{ forgotPasswordMessage }}
                                </div>
                                
                                <button 
                                    type="submit" 
                                    class="art-btn art-btn-primary" 
                                    style="width: 100%; padding: var(--space-md); font-size: 1rem;"
                                >
                                    发送重置链接
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
            
            <!-- 艺术教育理念 -->
            <section style="padding: var(--space-3xl) var(--space-lg); background: var(--color-primary-100);">
                <div style="max-width: 800px; margin: 0 auto; text-align: center;">
                    <h2 style="margin-bottom: var(--space-lg);">为什么选择小小达芬奇？</h2>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--space-xl); margin-top: var(--space-2xl);">
                        <div>
                            <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--color-accent-art); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-md);">
                                <i class="fas fa-paint-brush" style="font-size: 1.5rem; color: white;"></i>
                            </div>
                            <h3 style="margin-bottom: var(--space-sm);">专业艺术教育</h3>
                            <p style="color: var(--color-text-secondary);">
                                由专业艺术教育团队设计，注重创造力和观察力培养
                            </p>
                        </div>
                        
                        <div>
                            <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--color-accent-warm); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-md);">
                                <i class="fas fa-user-graduate" style="font-size: 1.5rem; color: white;"></i>
                            </div>
                            <h3 style="margin-bottom: var(--space-sm);">个性化学习路径</h3>
                            <p style="color: var(--color-text-secondary);">
                                根据孩子年龄和兴趣定制学习计划，循序渐进
                            </p>
                        </div>
                        
                        <div>
                            <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--color-accent-cool); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-md);">
                                <i class="fas fa-video" style="font-size: 1.5rem; color: white;"></i>
                            </div>
                            <h3 style="margin-bottom: var(--space-sm);">高质量录播课程</h3>
                            <p style="color: var(--color-text-secondary);">
                                精心制作的课程内容，随时随地学习，反复观看
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    `,
    data() {
        return {
            loginForm: {
                username: '',
                password: ''
            },
            isLoggingIn: false,
            loginError: '',
            showForgotPassword: false,
            forgotPasswordEmail: '',
            forgotPasswordMessage: ''
        };
    },
    methods: {
        async handleLogin() {
            this.isLoggingIn = true;
            this.loginError = '';
            
            try {
                // 模拟API调用
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // 简单的验证
                if (!this.loginForm.username || !this.loginForm.password) {
                    throw new Error('请输入用户名和密码');
                }
                
                // 模拟登录成功
                console.log('登录成功:', this.loginForm.username);
                
                // 跳转到用户中心
                this.$emit('navigate', '/dashboard');
                
            } catch (error) {
                this.loginError = error.message || '登录失败，请检查用户名和密码';
            } finally {
                this.isLoggingIn = false;
            }
        },
        
        handleForgotPassword() {
            if (!this.forgotPasswordEmail) {
                return;
            }
            
            // 模拟发送重置链接
            this.forgotPasswordMessage = `重置链接已发送到 ${this.forgotPasswordEmail}，请查收邮件`;
            
            // 3秒后关闭模态框
            setTimeout(() => {
                this.showForgotPassword = false;
                this.forgotPasswordEmail = '';
                this.forgotPasswordMessage = '';
            }, 3000);
        },
        
        goToRegister() {
            this.$emit('navigate', '/register');
        }
    }
};

console.log('登录页面组件已加载');