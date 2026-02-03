// 课程详情页面组件 - 最小可工作版本
window.CourseDetailPage = {
    template: `
        <div class="course-detail-page">
            <div v-if="isLoading" style="text-align: center; padding: 100px 20px;">
                <div class="art-loader" style="margin: 0 auto 20px;"></div>
                <p>正在加载课程详情...</p>
            </div>
            
            <div v-else-if="error" style="text-align: center; padding: 100px 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #dc3545; margin-bottom: 20px;"></i>
                <h3>加载失败</h3>
                <p>{{ error }}</p>
                <button class="art-btn art-btn-primary" @click="loadCourseData">
                    <i class="fas fa-redo"></i> 重新加载
                </button>
            </div>
            
            <div v-else>
                <!-- 课程头部 -->
                <section :style="{ background: course.color || '#4A6FA5', color: 'white', padding: '40px 20px' }">
                    <div style="max-width: 1200px; margin: 0 auto;">
                        <a href="/courses" @click.prevent="navigateTo('/courses')" style="color: white; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; margin-bottom: 20px;">
                            <i class="fas fa-arrow-left"></i> 返回课程列表
                        </a>
                        <h1 style="font-size: 2rem; margin: 0 0 10px 0;">{{ course.title }}</h1>
                        <p style="opacity: 0.9; margin: 0 0 20px 0;">{{ course.short_description }}</p>
                        
                        <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 20px;">
                            <span style="background: rgba(255, 255, 255, 0.2); padding: 6px 12px; border-radius: 16px; font-size: 0.9rem;">
                                <i class="fas fa-user-graduate"></i> {{ course.age_range }}岁
                            </span>
                            <span style="background: rgba(255, 255, 255, 0.2); padding: 6px 12px; border-radius: 16px; font-size: 0.9rem;">
                                <i class="fas fa-clock"></i> {{ course.duration }}
                            </span>
                            <span v-if="course.price > 0" style="background: rgba(255, 255, 255, 0.3); padding: 6px 12px; border-radius: 16px; font-size: 0.9rem; font-weight: 600;">
                                <i class="fas fa-tag"></i> ¥{{ course.price }}
                            </span>
                        </div>
                    </div>
                </section>
                
                <!-- 课程内容 -->
                <div style="max-width: 1200px; margin: 0 auto; padding: 30px 20px; display: grid; grid-template-columns: 1fr 350px; gap: 30px;">
                    <!-- 左侧：介绍和章节 -->
                    <div>
                        <section style="margin-bottom: 30px;">
                            <h2 style="margin-bottom: 15px;">课程介绍</h2>
                            <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                                <p style="line-height: 1.6; color: #666;">{{ course.description }}</p>
                            </div>
                        </section>
                        
                        <section>
                            <h2 style="margin-bottom: 15px;">课程章节</h2>
                            <div v-if="lessons.length === 0" style="text-align: center; padding: 30px; background: white; border-radius: 8px;">
                                <p style="color: #999;">暂无可用章节</p>
                            </div>
                            <div v-else style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                                <div v-for="(lesson, index) in lessons" :key="lesson.id" 
                                     @click="selectLesson(lesson)"
                                     :style="activeLessonId === lesson.id ? 'background: #f0f7ff;' : ''"
                                     style="padding: 15px; border-bottom: 1px solid #eee; cursor: pointer; display: flex; align-items: center; gap: 12px;">
                                    <div style="width: 30px; height: 30px; border-radius: 50%; background: #e3f2fd; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #1976d2;">
                                        {{ index + 1 }}
                                    </div>
                                    <div style="flex: 1;">
                                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                            <h3 style="margin: 0; font-size: 1rem; color: #333;">{{ lesson.title }}</h3>
                                            <span v-if="lesson.is_free_preview" style="background: #d4edda; color: #155724; padding: 2px 6px; border-radius: 8px; font-size: 0.7rem;">
                                                免费预览
                                            </span>
                                        </div>
                                        <div style="color: #666; font-size: 0.85rem;">
                                            <i class="fas fa-clock"></i> {{ lesson.duration || '15分钟' }}
                                        </div>
                                    </div>
                                    <button class="art-btn art-btn-outline" @click.stop="playLesson(lesson)" style="padding: 6px 12px; font-size: 0.85rem;">
                                        <i class="fas fa-play"></i> 播放
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                    
                    <!-- 右侧：视频播放 -->
                    <div>
                        <section v-if="selectedLesson" style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                            <div style="padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                                <h3 style="margin: 0; font-size: 1.1rem; color: #333;">{{ selectedLesson.title }}</h3>
                                <span v-if="selectedLesson.is_free_preview" style="background: #d4edda; color: #155724; padding: 3px 8px; border-radius: 10px; font-size: 0.75rem;">
                                    免费预览
                                </span>
                            </div>
                            
                            <div style="padding: 0;">
                                <!-- 腾讯云点播播放器 -->
                                <tencent-vod-player
                                    :file-id="getTencentFileId(selectedLesson)"
                                    :app-id="tencentAppId"
                                    :psign="getVideoPsign(selectedLesson)"
                                    :has-access="hasVideoAccess"
                                    :access-message="accessMessage"
                                    :autoplay="false"
                                    @request-access="handleRequestAccess"
                                    @play="onVideoPlay"
                                    @pause="onVideoPause"
                                    @ended="onVideoEnded"
                                    @timeupdate="onVideoTimeUpdate"
                                ></tencent-vod-player>
                            </div>
                            
                            <div style="padding: 15px; border-top: 1px solid #eee;">
                                <h4 style="margin: 0 0 8px 0; color: #333; font-size: 0.95rem;">课程内容</h4>
                                <p style="color: #666; font-size: 0.9rem; margin: 0; line-height: 1.5;">{{ selectedLesson.description || '暂无详细描述' }}</p>
                            </div>
                        </section>
                        
                        <section v-else style="background: white; border-radius: 8px; padding: 30px 20px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                            <i class="fas fa-video" style="font-size: 2.5rem; color: #1976d2; margin-bottom: 15px;"></i>
                            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 1.1rem;">选择章节开始学习</h3>
                            <p style="color: #666; margin: 0; font-size: 0.9rem;">从左侧章节列表中选择一个课程开始观看</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            courseId: null,
            course: {},
            lessons: [],
            selectedLesson: null,
            isLoading: true,
            error: null,
            hasVideoAccess: false,
            accessMessage: '',
            // 腾讯云点播配置
            tencentAppId: '1309648761', // 示例AppID，实际使用时从后端获取
            videoPsignCache: {} // 缓存播放签名
        };
    },
    computed: {
        activeLessonId() {
            return this.selectedLesson ? this.selectedLesson.id : null;
        }
    },
    mounted() {
        this.courseId = this.$parent.routeParams.id;
        if (!this.courseId) {
            this.error = '未找到课程ID';
            this.isLoading = false;
            return;
        }
        this.loadCourseData();
    },
    methods: {
        async loadCourseData() {
            this.isLoading = true;
            this.error = null;
            
            try {
                const courseResponse = await fetch(`http://localhost:8000/api/courses/${this.courseId}`);
                if (!courseResponse.ok) throw new Error(`加载课程失败: HTTP ${courseResponse.status}`);
                this.course = await courseResponse.json();
                
                const lessonsResponse = await fetch(`http://localhost:8000/api/courses/${this.courseId}/lessons`);
                if (!lessonsResponse.ok) throw new Error(`加载章节失败: HTTP ${lessonsResponse.status}`);
                this.lessons = await lessonsResponse.json();
                
                if (this.lessons.length > 0) {
                    this.selectedLesson = this.lessons[0];
                    this.checkVideoAccess();
                }
            } catch (error) {
                this.error = error.message;
                this.loadSampleData();
            } finally {
                this.isLoading = false;
            }
        },
        
        loadSampleData() {
            this.course = {
                id: this.courseId,
                title: this.courseId === '1' ? '创造性艺术与元认知成长课' : '亲子美术课',
                short_description: this.courseId === '1' ? '通过艺术培养观察力、创造力与自我觉察' : '在共同创作中建立情感连接',
                description: this.courseId === '1' 
                    ? '本课程通过系统的艺术创作活动，引导孩子建立对自我创作过程的觉察能力。课程不仅教授绘画技巧，更重要的是培养孩子的元认知能力——即"思考自己的思考"，帮助他们在创作中建立自信、发展独特的艺术表达方式。'
                    : '专为亲子设计的艺术体验课程，通过简单的艺术活动促进亲子情感交流。课程强调过程而非结果，在轻松愉快的创作氛围中，帮助孩子建立对艺术的基本感知，同时增进亲子间的理解与连接。',
                age_range: this.courseId === '1' ? '8-12' : '5-8',
                duration: this.courseId === '1' ? '10节课，每节45分钟' : '10节课，每节30分钟',
                access_level: this.courseId === '1' ? 'premium' : 'free',
                price: this.courseId === '1' ? 299 : 0,
                color: this.courseId === '1' ? '#4A6FA5' : '#E8B4BC'
            };
            
            this.lessons = this.courseId === '1' 
                ? [{ id: 1, title: '观察力的觉醒', description: '学习如何观察周围的世界', duration: '15分钟', is_free_preview: true, video_url: 'https://example.com/video1.mp4' }]
                : [
                    { id: 1, title: '手印的印记', description: '通过手印创作', duration: '10分钟', is_free_preview: true, video_url: 'https://example.com/video1.mp4' },
                    { id: 2, title: '色彩的情绪', description: '探索颜色情感', duration: '12分钟', is_free_preview: false, video_url: 'https://example.com/video2.mp4' }
                ];
            
            if (this.lessons.length > 0) {
                this.selectedLesson = this.lessons[0];
                this.checkVideoAccess();
            }
        },
        
        checkVideoAccess() {
            if (!this.selectedLesson) return;
            
            if (this.course.access_level === 'free') {
                this.hasVideoAccess = true;
                this.accessMessage = '免费课程，可以观看';
            } else if (this.course.access_level === 'premium') {
                this.hasVideoAccess = this.selectedLesson.is_free_preview;
                this.accessMessage = this.selectedLesson.is_free_preview 
                    ? '免费预览章节，可以观看' 
                    : '付费课程，请登录并报名后观看完整内容';
            } else {
                this.hasVideoAccess = false;
                this.accessMessage = '内部课程，请联系管理员获取访问权限';
            }
        },
        
        // 获取腾讯云FileId（示例实现）
        getTencentFileId(lesson) {
            // 这里应该从lesson数据中获取腾讯云FileId
            // 示例：根据lesson.id生成模拟FileId
            if (lesson.id === 1) {
                return '5285890784249077287'; // 示例FileId
            } else if (lesson.id === 2) {
                return '5285890784249077288'; // 示例FileId
            }
            return '5285890784249077289'; // 默认示例FileId
        },
        
        // 获取视频播放签名（示例实现）
        getVideoPsign(lesson) {
            const lessonId = lesson.id;
            
            // 检查缓存
            if (this.videoPsignCache[lessonId]) {
                return this.videoPsignCache[lessonId];
            }
            
            // 这里应该调用后端API获取真实的psign
            // 示例：生成模拟psign
            const mockPsign = this.generateMockPsign(lessonId);
            this.videoPsignCache[lessonId] = mockPsign;
            
            return mockPsign;
        },
        
        // 生成模拟psign（实际项目中应该从后端获取）
        generateMockPsign(lessonId) {
            // 模拟psign格式
            const timestamp = Math.floor(Date.now() / 1000);
            const expireTime = timestamp + 7200; // 2小时后过期
            
            // 注意：实际项目中psign应该从后端API获取
            // 这里只是示例格式
            return `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhcHBJZCI6IjEzMDk2NDg3NjEiLCJmaWxlSWQiOiI1Mjg1ODkwNzg0MjQ5MDc3Mjg3IiwidXNlcklkIjoiMTIzNDU2IiwidHlwZSI6InBsYXkiLCJleHAiOjE3MDAwMDAwMDAsInRpbWVzdGFtcCI6MTcwMDAwMDAwMH0.mock_signature_for_lesson_${lessonId}`;
        },
        
        // 处理请求访问权限
        handleRequestAccess() {
            if (this.course.access_level === 'premium') {
                this.navigateTo('/login');
            } else {
                // 其他情况跳转到相应页面
                this.navigateTo('/courses');
            }
        },
        
        // 视频播放事件
        onVideoPlay() {
            console.log('视频开始播放');
            // 可以在这里记录播放开始时间等
        },
        
        onVideoPause() {
            console.log('视频暂停');
        },
        
        onVideoEnded() {
            console.log('视频播放结束');
            // 可以在这里记录播放完成等
        },
        
        onVideoTimeUpdate(data) {
            // 可以在这里记录播放进度
            // console.log('播放进度:', data.percentage);
        },
        
        selectLesson(lesson) {
            this.selectedLesson = lesson;
            this.checkVideoAccess();
        },
        
        playLesson(lesson) {
            this.selectLesson(lesson);
            console.log('播放章节:', lesson.title);
        },
        
        navigateTo(path) {
            this.$emit('navigate', path);
        }
    }
};

console.log('课程详情页面组件已加载');