// 照片展示页面组件 - 静态方案
window.PhotoGalleryPage = {
    template: `
        <div class="photo-gallery-page">
            <!-- 英雄区域 -->
            <section class="art-hero" style="min-height: 50vh; position: relative; overflow: hidden;">
                <div class="art-hero-content" style="position: relative; z-index: 2;">
                    <h1 class="art-hero-title">{{ pageInfo.title }}</h1>
                    <p class="art-hero-subtitle">
                        {{ pageInfo.subtitle }}
                    </p>
                    <div style="margin-top: var(--space-xl);">
                        <button class="art-btn art-btn-primary" @click="scrollToGallery">
                            <i class="fas fa-images" style="margin-right: var(--space-sm);"></i>
                            浏览照片
                        </button>
                    </div>
                </div>
                <!-- 艺术背景 -->
                <div class="art-bg-overlay"></div>
            </section>
            
            <!-- 分类导航 -->
            <section ref="gallerySection" style="padding: var(--space-2xl) var(--space-lg); background: var(--color-primary-100);">
                <div style="max-width: 1200px; margin: 0 auto;">
                    <h2 style="text-align: center; margin-bottom: var(--space-xl);">照片分类</h2>
                    
                    <div class="category-nav">
                        <button 
                            v-for="category in categories" 
                            :key="category.id"
                            class="category-btn"
                            :class="{ 'active': activeCategory === category.id }"
                            @click="filterByCategory(category.id)"
                        >
                            <i :class="category.icon" style="margin-right: var(--space-sm);"></i>
                            {{ category.name }}
                            <span class="category-count" v-if="category.id !== 'all'">
                                ({{ getPhotoCountByCategory(category.id) }})
                            </span>
                        </button>
                    </div>
                    
                    <!-- 搜索框 -->
                    <div style="max-width: 500px; margin: var(--space-xl) auto;">
                        <div class="search-container">
                            <i class="fas fa-search" style="position: absolute; left: var(--space-lg); top: 50%; transform: translateY(-50%); color: var(--color-text-muted);"></i>
                            <input 
                                type="text" 
                                v-model="searchQuery"
                                placeholder="搜索照片标题或描述..."
                                class="search-input"
                                @input="handleSearch"
                            />
                            <button 
                                v-if="searchQuery" 
                                class="clear-search-btn"
                                @click="clearSearch"
                            >
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </section>
            
            <!-- 照片网格 -->
            <section style="padding: var(--space-3xl) var(--space-lg);">
                <div style="max-width: 1400px; margin: 0 auto;">
                    <!-- 加载状态 -->
                    <div v-if="isLoading" style="text-align: center; padding: var(--space-3xl);">
                        <div class="art-loader" style="margin: 0 auto var(--space-lg);"></div>
                        <p style="color: var(--color-text-secondary);">正在加载照片...</p>
                    </div>
                    
                    <!-- 空状态 -->
                    <div v-else-if="filteredPhotos.length === 0" style="text-align: center; padding: var(--space-3xl);">
                        <i class="fas fa-camera" style="font-size: 3rem; color: var(--color-text-muted); margin-bottom: var(--space-md);"></i>
                        <h3>未找到照片</h3>
                        <p style="color: var(--color-text-secondary); margin-top: var(--space-sm); margin-bottom: var(--space-lg);">
                            {{ searchQuery ? '没有找到匹配搜索条件的照片' : '该分类下暂时没有照片' }}
                        </p>
                        <button v-if="searchQuery" class="art-btn art-btn-outline" @click="clearSearch">
                            清除搜索条件
                        </button>
                    </div>
                    
                    <!-- 照片网格 -->
                    <div v-else class="photo-grid">
                        <div 
                            v-for="photo in filteredPhotos" 
                            :key="photo.id"
                            class="photo-card"
                            :class="{ 'featured': photo.featured }"
                            @click="viewPhotoDetail(photo)"
                        >
                            <!-- 照片容器 -->
                            <div class="photo-container">
                                <!-- 真实图片 -->
                                <img 
                                    :src="getPhotoUrl(photo)" 
                                    :alt="photo.title"
                                    class="photo-real"
                                    loading="lazy"
                                    @error="handleImageError"
                                >
                                
                                <!-- 照片信息遮罩 -->
                                <div class="photo-overlay">
                                    <div class="photo-info">
                                        <h3 class="photo-title">{{ photo.title }}</h3>
                                        <p class="photo-description">{{ photo.description }}</p>
                                        <div class="photo-meta">
                                            <span class="photo-date">
                                                <i class="far fa-calendar" style="margin-right: 4px;"></i>
                                                {{ formatDate(photo.date) }}
                                            </span>
                                            <span class="photo-category">
                                                <i :class="getCategoryIcon(photo.category)" style="margin-right: 4px;"></i>
                                                {{ getCategoryName(photo.category) }}
                                            </span>
                                        </div>
                                        <div class="photo-tags">
                                            <span 
                                                v-for="tag in photo.tags.slice(0, 2)" 
                                                :key="tag"
                                                class="photo-tag"
                                            >
                                                #{{ tag }}
                                            </span>
                                            <span v-if="photo.tags.length > 2" class="photo-tag-more">
                                                +{{ photo.tags.length - 2 }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- 特色标记 -->
                                <div v-if="photo.featured" class="featured-badge">
                                    <i class="fas fa-star"></i>
                                    精选
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 照片统计 -->
                    <div style="text-align: center; margin-top: var(--space-2xl); padding-top: var(--space-xl); border-top: 1px solid var(--color-primary-200);">
                        <p style="color: var(--color-text-secondary);">
                            共 {{ filteredPhotos.length }} 张照片
                            <span v-if="activeCategory !== 'all'" style="margin-left: var(--space-md);">
                                · {{ getCategoryName(activeCategory) }}分类
                            </span>
                            <span v-if="searchQuery" style="margin-left: var(--space-md);">
                                · 搜索关键词: "{{ searchQuery }}"
                            </span>
                        </p>
                    </div>
                </div>
            </section>
            
            <!-- 页面描述 -->
            <section style="padding: var(--space-2xl) var(--space-lg);">
                <div style="max-width: 800px; margin: 0 auto; text-align: center;">
                    <h3 style="margin-bottom: var(--space-lg);">关于这些照片</h3>
                    <p style="color: var(--color-text-secondary); line-height: 1.8;">
                        {{ pageInfo.description }}
                    </p>
                    <div style="margin-top: var(--space-xl);">
                        <button class="art-btn art-btn-outline" @click="$emit('navigate', '/courses')">
                            <i class="fas fa-graduation-cap" style="margin-right: var(--space-sm);"></i>
                            查看课程
                        </button>
                        <button class="art-btn art-btn-outline" style="margin-left: var(--space-md);" @click="$emit('navigate', '/')">
                            <i class="fas fa-home" style="margin-right: var(--space-sm);"></i>
                            返回首页
                        </button>
                    </div>
                </div>
            </section>
        </div>
    `,
    data() {
        return {
            activeCategory: 'all',
            searchQuery: '',
            photos: [],
            categories: [],
            pageInfo: {},
            isLoading: true,
            filteredPhotos: []
        };
    },
    mounted() {
        // 添加页面样式
        this.addGalleryStyles();
        
        // 加载照片数据
        this.loadGalleryData();
    },
    methods: {
        // 加载照片数据
        async loadGalleryData() {
            this.isLoading = true;
            
            try {
                // 从JSON文件加载数据
                const response = await fetch('/data/gallery-data.json');
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                this.photos = data.photos || [];
                this.categories = data.categories || [];
                this.pageInfo = data.pageInfo || {};
                
                // 初始过滤
                this.filterPhotos();
                
                console.log(`成功加载 ${this.photos.length} 张照片`, this.photos);
            } catch (error) {
                console.error('加载照片数据失败:', error);
                
                // 使用示例数据作为后备
                this.loadSampleData();
            } finally {
                this.isLoading = false;
            }
        },
        
        // 加载示例数据（后备方案）
        loadSampleData() {
            this.photos = [
                {
                    id: 1,
                    title: '户外写生示例',
                    description: '孩子们在户外学习观察和描绘',
                    category: 'outdoor',
                    filename: 'sample-1.jpg',
                    date: '2024-03-15',
                    featured: true,
                    tags: ['户外教学', '自然观察']
                },
                {
                    id: 2,
                    title: '作品展示示例',
                    description: '孩子的艺术作品展示',
                    category: 'artworks',
                    filename: 'sample-2.jpg',
                    date: '2024-03-10',
                    featured: true,
                    tags: ['作品展示', '儿童艺术']
                }
            ];
            
            this.categories = [
                { id: 'all', name: '全部照片', icon: 'fas fa-images' },
                { id: 'outdoor', name: '外出写生', icon: 'fas fa-tree' },
                { id: 'artworks', name: '作品展示', icon: 'fas fa-palette' },
                { id: 'classroom', name: '课堂场景', icon: 'fas fa-chalkboard-teacher' },
                { id: 'parents', name: '家长课堂', icon: 'fas fa-users' }
            ];
            
            this.pageInfo = {
                title: '真实教学场景 · 见证成长每一步',
                subtitle: '通过照片记录孩子们的艺术探索之旅',
                description: '这里记录了小小达芬奇艺术教育机构的真实教学场景。'
            };
            
            this.filterPhotos();
        },
        
        // 过滤照片
        filterPhotos() {
            let filtered = this.photos;
            
            // 按分类过滤
            if (this.activeCategory !== 'all') {
                filtered = filtered.filter(photo => photo.category === this.activeCategory);
            }
            
            // 按搜索词过滤
            if (this.searchQuery.trim()) {
                const query = this.searchQuery.toLowerCase().trim();
                filtered = filtered.filter(photo => 
                    photo.title.toLowerCase().includes(query) ||
                    photo.description.toLowerCase().includes(query) ||
                    (photo.tags && photo.tags.some(tag => tag.toLowerCase().includes(query)))
                );
            }
            
            // 排序：特色照片优先，然后按日期倒序
            filtered.sort((a, b) => {
                if (a.featured && !b.featured) return -1;
                if (!a.featured && b.featured) return 1;
                return new Date(b.date) - new Date(a.date);
            });
            
            this.filteredPhotos = filtered;
        },
        
        // 按分类筛选
        filterByCategory(categoryId) {
            this.activeCategory = categoryId;
            this.filterPhotos();
            
            // 滚动到照片区域
            this.$nextTick(() => {
                if (this.$refs.gallerySection) {
                    this.$refs.gallerySection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        },
        
        // 处理搜索
        handleSearch() {
            this.filterPhotos();
        },
        
        // 清除搜索
        clearSearch() {
            this.searchQuery = '';
            this.filterPhotos();
        },
        
        // 查看照片详情
        viewPhotoDetail(photo) {
            // 在实际项目中，这里可以打开模态框显示大图
            // 暂时使用控制台日志
            console.log('查看照片详情:', photo);
            
            // 可以在这里添加照片预览功能
            this.showPhotoPreview(photo);
        },
        
        // 显示照片预览（简单实现）
        showPhotoPreview(photo) {
            alert(`照片详情：\n\n标题：${photo.title}\n描述：${photo.description}\n日期：${this.formatDate(photo.date)}\n分类：${this.getCategoryName(photo.category)}`);
        },
        
        // 滚动到照片区域
        scrollToGallery() {
            if (this.$refs.gallerySection) {
                this.$refs.gallerySection.scrollIntoView({ behavior: 'smooth' });
            }
        },
        
        // 获取分类照片数量
        getPhotoCountByCategory(categoryId) {
            if (categoryId === 'all') return this.photos.length;
            return this.photos.filter(photo => photo.category === categoryId).length;
        },
        
        // 获取分类名称
        getCategoryName(categoryId) {
            const category = this.categories.find(c => c.id === categoryId);
            return category ? category.name : categoryId;
        },
        
        // 获取分类图标
        getCategoryIcon(categoryId) {
            const category = this.categories.find(c => c.id === categoryId);
            return category ? category.icon : 'fas fa-image';
        },
        
        // 格式化日期
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        },
        
        // 获取照片URL
        getPhotoUrl(photo) {
            // 根据分类和文件名构建图片URL
            return `/assets/images/${photo.category}/${photo.filename}`;
        },
        
        // 处理图片加载错误
        handleImageError(event) {
            console.warn('图片加载失败:', event.target.src);
            // 如果图片加载失败，显示占位图
            const img = event.target;
            const photo = this.photos.find(p => this.getPhotoUrl(p) === img.src);
            
            if (photo) {
                // 创建占位图
                const placeholder = document.createElement('div');
                placeholder.className = 'photo-placeholder';
                placeholder.style.cssText = `
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 500;
                    background: ${this.getPlaceholderStyle(photo).background};
                `;
                
                const icon = document.createElement('i');
                icon.className = this.getCategoryIcon(photo.category);
                icon.style.cssText = 'font-size: 2rem; color: rgba(255,255,255,0.8);';
                
                const label = document.createElement('div');
                label.className = 'photo-label';
                label.textContent = this.getCategoryName(photo.category);
                label.style.cssText = 'margin-top: var(--space-sm); font-size: 1.1rem; opacity: 0.9;';
                
                placeholder.appendChild(icon);
                placeholder.appendChild(label);
                
                // 替换图片为占位图
                img.parentNode.replaceChild(placeholder, img);
            }
        },
        
        // 获取占位图样式
        getPlaceholderStyle(photo) {
            // 根据分类生成不同的背景色
            const colorMap = {
                'outdoor': 'linear-gradient(135deg, #4CAF50, #8BC34A)',
                'artworks': 'linear-gradient(135deg, #FF9800, #FFC107)',
                'classroom': 'linear-gradient(135deg, #9C27B0, #E91E63)',
                'parents': 'linear-gradient(135deg, #2196F3, #03A9F4)'
            };
            
            return {
                background: colorMap[photo.category] || 'linear-gradient(135deg, #607D8B, #78909C)'
            };
        },
        
        // 添加页面样式
        addGalleryStyles() {
            const style = document.createElement('style');
            style.textContent = `
                /* 照片展示页面专用样式 */
                .art-bg-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, rgba(138, 109, 59, 0.1), rgba(168, 124, 93, 0.05));
                    z-index: 1;
                }
                
                /* 分类导航 */
                .category-nav {
                    display: flex;
                    flex-wrap: wrap;
                    gap: var(--space-sm);
                    justify-content: center;
                    margin-bottom: var(--space-lg);
                }
                
                .category-btn {
                    padding: var(--space-sm) var(--space-lg);
                    border: 2px solid var(--color-primary-300);
                    background: white;
                    border-radius: var(--border-radius-full);
                    font-size: 0.95rem;
                    font-weight: 500;
                    color: var(--color-text-secondary);
                    cursor: pointer;
                    transition: all var(--transition-normal);
                    display: flex;
                    align-items: center;
                }
                
                .category-btn:hover {
                    border-color: var(--color-accent-art);
                    color: var(--color-accent-art);
                    transform: translateY(-2px);
                }
                
                .category-btn.active {
                    background: var(--color-accent-art);
                    border-color: var(--color-accent-art);
                    color: white;
                }
                
                .category-count {
                    margin-left: var(--space-xs);
                    font-size: 0.85rem;
                    opacity: 0.8;
                }
                
                /* 搜索框 */
                .search-container {
                    position: relative;
                }
                
                .search-input {
                    width: 100%;
                    padding: var(--space-md) var(--space-lg) var(--space-md) var(--space-3xl);
                    border: 2px solid var(--color-primary-300);
                    border-radius: var(--border-radius-full);
                    font-size: 1rem;
                    background: white;
                    transition: all var(--transition-normal);
                }
                
                .search-input:focus {
                    outline: none;
                    border-color: var(--color-accent-art);
                    box-shadow: 0 0 0 3px rgba(138, 109, 59, 0.1);
                }
                
                .clear-search-btn {
                    position: absolute;
                    right: var(--space-lg);
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: var(--color-text-muted);
                    cursor: pointer;
                    padding: var(--space-xs);
                    border-radius: 50%;
                    transition: all var(--transition-fast);
                }
                
                .clear-search-btn:hover {
                    background: var(--color-primary-200);
                    color: var(--color-text-primary);
                }
                
                /* 照片网格 */
                .photo-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: var(--space-xl);
                }
                
                .photo-card {
                    cursor: pointer;
                    transition: transform var(--transition-normal), box-shadow var(--transition-normal);
                    border-radius: var(--border-radius-lg);
                    overflow: hidden;
                    position: relative;
                }
                
                .photo-card:hover {
                    transform: translateY(-8px);
                    box-shadow: var(--shadow-art);
                }
                
                .photo-card.featured {
                    border: 3px solid var(--color-accent-art);
                }
                
                .photo-container {
                    position: relative;
                    width: 100%;
                    height: 300px;
                    overflow: hidden;
                    border-radius: var(--border-radius-lg);
                }
                
                .photo-real {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform var(--transition-normal);
                }
                
                .photo-card:hover .photo-real {
                    transform: scale(1.05);
                }
                
                .photo-placeholder {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 500;
                }
                
                .photo-label {
                    margin-top: var(--space-sm);
                    font-size: 1.1rem;
                    opacity: 0.9;
                }
                
                .photo-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent 40%);
                    opacity: 0;
                    transition: opacity var(--transition-normal);
                    display: flex;
                    align-items: flex-end;
                    padding: var(--space-lg);
                }
                
                .photo-card:hover .photo-overlay {
                    opacity: 1;
                }
                
                .photo-info {
                    color: white;
                    transform: translateY(20px);
                    transition: transform var(--transition-normal);
                }
                
                .photo-card:hover .photo-info {
                    transform: translateY(0);
                }
                
                .photo-title {
                    font-size: 1.2rem;
                    margin: 0 0 var(--space-sm) 0;
                    color: white;
                    line-height: 1.3;
                }
                
                .photo-description {
                    font-size: 0.9rem;
                    margin: 0 0 var(--space-md) 0;
                    opacity: 0.9;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .photo-meta {
                    display: flex;
                    gap: var(--space-md);
                    font-size: 0.8rem;
                    opacity: 0.8;
                    margin-bottom: var(--space-sm);
                }
                
                .photo-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: var(--space-xs);
                }
                
                .photo-tag {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 2px 8px;
                    border-radius: var(--border-radius-sm);
                    font-size: 0.75rem;
                }
                
                .photo-tag-more {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 2px 8px;
                    border-radius: var(--border-radius-sm);
                    font-size: 0.75rem;
                    opacity: 0.7;
                }
                
                .featured-badge {
                    position: absolute;
                    top: var(--space-md);
                    right: var(--space-md);
                    background: var(--color-accent-art);
                    color: white;
                    padding: var(--space-xs) var(--space-sm);
                    border-radius: var(--border-radius-sm);
                    font-size: 0.8rem;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    z-index: 2;
                }
                
                /* 响应式设计 */
                @media (max-width: 768px) {
                    .photo-grid {
                        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    }
                    
                    .category-nav {
                        gap: var(--space-xs);
                    }
                    
                    .category-btn {
                        padding: var(--space-xs) var(--space-md);
                        font-size: 0.85rem;
                    }
                }
                
                @media (max-width: 480px) {
                    .photo-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .photo-container {
                        height: 250px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
};

console.log('照片展示页面组件已加载');
