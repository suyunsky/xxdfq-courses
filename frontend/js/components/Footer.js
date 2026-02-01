// 页脚组件
window.Footer = {
    template: `
        <footer class="art-footer">
            <div class="art-footer-container">
                <div class="art-footer-content">
                    <!-- 品牌信息 -->
                    <div class="art-footer-section">
                        <h3 class="art-footer-section-title">小小达芬奇</h3>
                        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-md);">
                            看见自己 · 从艺术开始
                        </p>
                        <p style="font-size: 0.875rem; color: var(--color-text-muted);">
                            以创造性艺术教育，培养孩子的观察力、创造力与自我意识
                        </p>
                    </div>
                    
                    <!-- 快速链接 -->
                    <div class="art-footer-section">
                        <h3 class="art-footer-section-title">快速链接</h3>
                        <ul class="art-footer-links">
                            <li><a href="/" class="art-footer-link">首页</a></li>
                            <li><a href="/courses" class="art-footer-link">在线课程</a></li>
                            <li><a href="/growth-path" class="art-footer-link">成长路径</a></li>
                            <li><a href="/teachers" class="art-footer-link">教师团队</a></li>
                        </ul>
                    </div>
                    
                    <!-- 联系方式 -->
                    <div class="art-footer-section">
                        <h3 class="art-footer-section-title">联系我们</h3>
                        <ul class="art-footer-links">
                            <li><a href="mailto:contact@xxdfq.com" class="art-footer-link">
                                <i class="fas fa-envelope" style="margin-right: 8px;"></i>
                                contact@xxdfq.com
                            </a></li>
                            <li><a href="tel:+8610000000000" class="art-footer-link">
                                <i class="fas fa-phone" style="margin-right: 8px;"></i>
                                +86 100 0000 0000
                            </a></li>
                            <li class="art-footer-link">
                                <i class="fas fa-map-marker-alt" style="margin-right: 8px;"></i>
                                北京市朝阳区艺术教育中心
                            </li>
                        </ul>
                    </div>
                    
                    <!-- 社交媒体 -->
                    <div class="art-footer-section">
                        <h3 class="art-footer-section-title">关注我们</h3>
                        <div style="display: flex; gap: var(--space-md); margin-top: var(--space-md);">
                            <a href="#" class="art-btn" style="padding: var(--space-sm);">
                                <i class="fab fa-weixin"></i>
                            </a>
                            <a href="#" class="art-btn" style="padding: var(--space-sm);">
                                <i class="fab fa-weibo"></i>
                            </a>
                            <a href="#" class="art-btn" style="padding: var(--space-sm);">
                                <i class="fab fa-douban"></i>
                            </a>
                        </div>
                    </div>
                </div>
                
                <!-- 底部版权 -->
                <div class="art-footer-bottom">
                    <p>© 2024 小小达芬奇艺术教育平台. 保留所有权利.</p>
                    <p style="margin-top: var(--space-sm);">
                        <a href="/privacy" class="art-footer-link" style="font-size: 0.875rem;">隐私政策</a>
                        · 
                        <a href="/terms" class="art-footer-link" style="font-size: 0.875rem;">服务条款</a>
                    </p>
                </div>
            </div>
        </footer>
    `
};

console.log('页脚组件已加载');
