// Vue应用入口文件 - 简化版本

// 全局API配置 - 统一的后端API基础URL
// 使用相对路径，让Nginx代理到后端服务
window.apiBaseUrl = window.location.port === '8080' ? 'http://localhost:8000' : '';

console.log('API基础URL配置:', window.apiBaseUrl);
console.log('当前部署模式: Nginx代理模式');

document.addEventListener('DOMContentLoaded', function() {
    // 等待Vue加载
    if (typeof Vue === 'undefined') {
        console.error('Vue未加载');
        return;
    }
    
    // 主应用组件
    const App = {
        template: `
            <div class="app">
                <nav-bar @navigate="handleNavigate"></nav-bar>
                <main class="site-main">
                    <component 
                        :is="currentPage" 
                        @navigate="handleNavigate"
                        :routeParams="routeParams"
                    ></component>
                </main>
                <footer-component></footer-component>
                <trial-booking></trial-booking>
            </div>
        `,
        data() {
            return {
                currentPage: 'HomePage',
                routeParams: {},
                routes: {
                    '/': 'HomePage',
                    '/courses': 'CoursesPage',
                    '/course/:id': 'CourseDetailPage',
                    '/login': 'LoginPage',
                    '/register': 'LoginPage',
                    '/dashboard': 'DashboardPage',
                    '/growth-path': 'PhilosophyPage',
                    '/philosophy': 'PhilosophyPage',
                    '/about': 'PhilosophyPage',
                    '/teacher': 'TeacherPage',
                    '/teachers': 'TeacherPage',
                    '/gallery': 'PhotoGalleryPage',
                    '/photos': 'PhotoGalleryPage'
                }
            }
        },
            components: {
                'nav-bar': window.NavBar || { template: '<div>导航栏加载中...</div>' },
                'footer-component': window.Footer || { template: '<div>页脚加载中...</div>' },
                'HomePage': window.HomePage || { template: '<div>首页加载中...</div>' },
                'CoursesPage': window.CoursesPage || { template: '<div style="padding: 100px; text-align: center;"><h2>课程页面开发中...</h2></div>' },
                'CourseDetailPage': window.CourseDetailPage || { template: '<div style="padding: 100px; text-align: center;"><h2>课程详情页面开发中...</h2></div>' },
                'LoginPage': window.LoginPage || { template: '<div style="padding: 100px; text-align: center;"><h2>登录页面开发中...</h2></div>' },
                'DashboardPage': window.DashboardPage || { template: '<div style="padding: 100px; text-align: center;"><h2>用户中心开发中...</h2></div>' },
                'PhilosophyPage': window.PhilosophyPage,
                'TeacherPage': window.TeacherPage,
                'PhotoGalleryPage': window.PhotoGalleryPage || { template: '<div style="padding: 100px; text-align: center;"><h2>照片展示页面开发中...</h2></div>' }
            },
        methods: {
            handleNavigate(path) {
                console.log('导航到:', path);
                
                // 解析路径，提取参数
                const routeMatch = this.matchRoute(path);
                this.currentPage = routeMatch.component;
                
                // 存储路由参数
                this.routeParams = routeMatch.params;
                
                // 更新浏览器地址栏（不刷新页面）
                window.history.pushState({}, '', path);
                this.updateDocumentTitle(path);
                
                // 滚动到顶部
                window.scrollTo(0, 0);
            },
            
            // 匹配路由，支持参数
            matchRoute(path) {
                // 精确匹配
                if (this.routes[path]) {
                    return {
                        component: this.routes[path],
                        params: {}
                    };
                }
                
                // 动态路由匹配（如 /course/:id）
                for (const routePath in this.routes) {
                    if (routePath.includes(':')) {
                        const routeRegex = this.pathToRegex(routePath);
                        const match = path.match(routeRegex);
                        if (match) {
                            const params = this.extractParams(routePath, match);
                            return {
                                component: this.routes[routePath],
                                params: params
                            };
                        }
                    }
                }
                
                // 默认返回首页
                return {
                    component: 'HomePage',
                    params: {}
                };
            },
            
            // 将路径模式转换为正则表达式
            pathToRegex(path) {
                const pattern = path
                    .replace(/:(\w+)/g, '([^/]+)')
                    .replace(/\//g, '\\/');
                return new RegExp(`^${pattern}$`);
            },
            
            // 提取参数
            extractParams(routePath, match) {
                const params = {};
                const paramNames = [];
                const regex = /:(\w+)/g;
                let paramMatch;
                
                while ((paramMatch = regex.exec(routePath)) !== null) {
                    paramNames.push(paramMatch[1]);
                }
                
                for (let i = 0; i < paramNames.length; i++) {
                    params[paramNames[i]] = match[i + 1];
                }
                
                return params;
            },
            
            // 处理浏览器前进后退
            setupRouter() {
                window.addEventListener('popstate', () => {
                    const path = window.location.pathname;
                    const routeMatch = this.matchRoute(path);
                    this.currentPage = routeMatch.component;
                    this.routeParams = routeMatch.params;
                    this.updateDocumentTitle(path);
                });
            },
            
            // 初始化路由
            initRouter() {
                const path = window.location.pathname;
                const routeMatch = this.matchRoute(path);
                this.currentPage = routeMatch.component;
                this.routeParams = routeMatch.params;
                this.updateDocumentTitle(path);
            },
            updateDocumentTitle(path) {
                const titles = {
                    '/': '小小达芬奇｜让孩子在艺术里找到自己的表达',
                    '/philosophy': '教育理念｜小小达芬奇', '/about': '教育理念｜小小达芬奇',
                    '/courses': '课程体系｜小小达芬奇', '/gallery': '成长影像｜小小达芬奇',
                    '/teacher': '毛毛老师｜小小达芬奇', '/login': '学员登录｜小小达芬奇',
                    '/dashboard': '学习中心｜小小达芬奇'
                };
                document.title = titles[path] || (path.startsWith('/course/') ? '课程详情｜小小达芬奇' : '小小达芬奇');
            }
        },
        mounted() {
            this.initRouter();
            this.setupRouter();
            
            // 添加全局导航事件监听
            document.addEventListener('click', (e) => {
                // 处理内部链接点击
                const link = e.target.closest('a[href^="/"]');
                if (link && !link.hasAttribute('download')) {
                    e.preventDefault();
                    const href = link.getAttribute('href');
                    this.handleNavigate(href);
                }
            });
            
            console.log('Vue应用已挂载');
        }
    };
    
    // 创建并挂载Vue应用
    try {
        const app = Vue.createApp(App);
        
        // 注册全局组件
        if (window.NavBar) {
            app.component('NavBar', window.NavBar);
        }
        if (window.Footer) {
            app.component('Footer', window.Footer);
        }
        if (window.HomePage) {
            app.component('HomePage', window.HomePage);
        }
        if (window.CoursesPage) {
            app.component('CoursesPage', window.CoursesPage);
        }
        if (window.DashboardPage) {
            app.component('DashboardPage', window.DashboardPage);
        }
        if (window.LoginPage) {
            app.component('LoginPage', window.LoginPage);
        }
        if (window.TencentVodPlayer) {
            app.component('TencentVodPlayer', window.TencentVodPlayer);
        }
        if (window.CourseDetailPage) {
            app.component('CourseDetailPage', window.CourseDetailPage);
        }
        if (window.PhotoGalleryPage) {
            app.component('PhotoGalleryPage', window.PhotoGalleryPage);
        }
        if (window.PhilosophyPage) app.component('PhilosophyPage', window.PhilosophyPage);
        if (window.TeacherPage) app.component('TeacherPage', window.TeacherPage);
        if (window.TrialBooking) app.component('TrialBooking', window.TrialBooking);
        
        app.mount('#app');
        console.log('小小达芬奇艺术教育平台已启动');
    } catch (error) {
        console.error('Vue应用启动失败:', error);
        document.getElementById('app').innerHTML = `
            <div style="padding: 50px; text-align: center;">
                <h2>应用加载失败</h2>
                <p>请检查浏览器控制台查看错误信息</p>
                <p>错误: ${error.message}</p>
            </div>
        `;
    }
});
