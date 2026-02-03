// 腾讯云点播播放器组件
window.TencentVodPlayer = {
    template: `
        <div class="tencent-vod-player">
            <!-- 权限提示 -->
            <div v-if="!hasAccess" class="vod-access-denied">
                <div class="access-denied-content">
                    <i class="fas fa-lock"></i>
                    <h4>需要解锁</h4>
                    <p>{{ accessMessage }}</p>
                    <button class="art-btn art-btn-primary" @click="$emit('request-access')">
                        获取访问权限
                    </button>
                </div>
            </div>
            
            <!-- 播放器容器 -->
            <div v-else class="vod-player-container">
                <!-- TCPlayer需要一个video元素 -->
                <video ref="playerVideo" class="tcplayer" :poster="poster"></video>
            </div>
            
            <!-- 加载状态 -->
            <div v-if="isLoading && hasAccess" class="vod-loading">
                <div class="art-loader"></div>
                <p>视频加载中...</p>
            </div>
            
            <!-- 错误状态 -->
            <div v-if="error && hasAccess" class="vod-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>视频加载失败</h4>
                <p>{{ error }}</p>
                <button class="art-btn art-btn-primary" @click="retry">
                    重试
                </button>
            </div>
            
            <!-- 视频信息 -->
            <div v-if="hasAccess && !isLoading && !error" class="vod-video-info">
                <div class="video-meta">
                    <span v-if="videoDuration">
                        <i class="fas fa-clock"></i> {{ formatDuration(videoDuration) }}
                    </span>
                    <span v-if="videoResolution">
                        <i class="fas fa-expand"></i> {{ videoResolution }}
                    </span>
                </div>
            </div>
        </div>
    `,
    props: {
        // 视频ID（后端数据库中的视频ID）
        videoId: {
            type: Number,
            required: true
        },
        // 课程ID（可选，用于权限验证）
        courseId: {
            type: Number,
            default: null
        },
        // 用户令牌（用于API认证）
        authToken: {
            type: String,
            default: ''
        },
        // 基础参数
        poster: {
            type: String,
            default: ''
        },
        hasAccess: {
            type: Boolean,
            default: true
        },
        accessMessage: {
            type: String,
            default: '您需要登录或购买课程才能观看此视频'
        },
        autoplay: {
            type: Boolean,
            default: false
        },
        // TCPlayer配置
        playerOptions: {
            type: Object,
            default: () => ({
                controls: true,
                autoplay: false,
                preload: 'auto',
                playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
                fluid: true,
                notSupportedMessage: '请升级浏览器以支持视频播放',
                controlBar: {
                    remainingTimeDisplay: true,
                    playToggle: true,
                    progressControl: true,
                    fullscreenToggle: true,
                    volumePanel: true,
                    playbackRateMenuButton: true,
                    qualitySelector: true
                }
            })
        }
    },
    data() {
        return {
            player: null,
            isLoading: true,
            error: null,
            isPlaying: false,
            videoDuration: 0,
            videoResolution: '',
            currentTime: 0,
            retryCount: 0,
            maxRetries: 3,
            // 从后端获取的播放参数
            playbackParams: null,
            videoInfo: null,
            // API配置
            apiBaseUrl: window.API_BASE_URL || 'http://localhost:8000',
            // 轮询检查播放参数
            paramCheckInterval: null
        };
    },
    computed: {
        // 检查是否所有必要参数都提供
        hasRequiredParams() {
            return this.playbackParams && 
                   this.playbackParams.file_id && 
                   this.playbackParams.app_id && 
                   this.playbackParams.psign;
        },
        
        // 生成播放器配置
        finalPlayerOptions() {
            if (!this.playbackParams) return this.playerOptions;
            
            return {
                ...this.playerOptions,
                fileID: this.playbackParams.file_id,
                appID: this.playbackParams.app_id,
                psign: this.playbackParams.psign,
                poster: this.videoInfo?.cover_url || this.poster,
                autoplay: this.autoplay && this.hasAccess
            };
        },
        
        // 获取视频封面
        videoCover() {
            return this.videoInfo?.cover_url || this.poster;
        }
    },
    methods: {
        // 从后端API获取播放参数
        async fetchPlaybackParams() {
            try {
                this.isLoading = true;
                this.error = null;
                
                console.log(`开始获取视频播放参数，videoId: ${this.videoId}`);
                
                // 构建请求头
                const headers = {
                    'Content-Type': 'application/json'
                };
                
                // 如果有认证令牌，添加到请求头
                if (this.authToken) {
                    headers['Authorization'] = `Bearer ${this.authToken}`;
                }
                
                // 调用后端API获取视频信息和播放签名
                const response = await fetch(
                    `${this.apiBaseUrl}/api/vod/video/${this.videoId}`,
                    {
                        method: 'GET',
                        headers: headers
                    }
                );
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.detail || `API请求失败: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (!result.success) {
                    throw new Error(result.message || '获取播放参数失败');
                }
                
                // 保存播放参数和视频信息
                this.playbackParams = result.data.playback;
                this.videoInfo = result.data.video;
                
                console.log('播放参数获取成功:', {
                    file_id: this.playbackParams.file_id,
                    app_id: this.playbackParams.app_id,
                    psign_length: this.playbackParams.psign?.length,
                    video_title: this.videoInfo.title
                });
                
                // 检查播放参数是否完整
                if (!this.hasRequiredParams) {
                    throw new Error('播放参数不完整，缺少必要字段');
                }
                
                // 开始初始化播放器
                this.initPlayer();
                
            } catch (error) {
                console.error('获取播放参数失败:', error);
                this.handleError(`获取视频播放参数失败: ${error.message}`);
                
                // 如果是因为权限问题，触发权限请求事件
                if (error.message.includes('权限') || error.message.includes('403')) {
                    this.$emit('request-access');
                }
            }
        },
        
        // 检查播放参数是否即将过期
        checkPlaybackParamsExpiry() {
            if (!this.playbackParams || !this.playbackParams.expire_at) return;
            
            const expiryTime = new Date(this.playbackParams.expire_at).getTime();
            const currentTime = Date.now();
            const timeUntilExpiry = expiryTime - currentTime;
            
            // 如果签名将在5分钟内过期，提前刷新
            if (timeUntilExpiry < 5 * 60 * 1000) {
                console.log('播放签名即将过期，开始刷新...');
                this.fetchPlaybackParams();
            }
        },
        
        // 记录播放行为到后端
        async recordPlayback(playData) {
            try {
                // 构建请求头
                const headers = {
                    'Content-Type': 'application/json'
                };
                
                if (this.authToken) {
                    headers['Authorization'] = `Bearer ${this.authToken}`;
                }
                
                // 发送播放记录
                const response = await fetch(
                    `${this.apiBaseUrl}/api/vod/playback/record`,
                    {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify({
                            video_id: this.videoId,
                            ...playData
                        })
                    }
                );
                
                if (!response.ok) {
                    console.warn('播放记录保存失败:', response.status);
                } else {
                    console.log('播放记录保存成功');
                }
                
            } catch (error) {
                console.warn('播放记录保存失败:', error);
            }
        },
        
        // 初始化TCPlayer播放器
        initPlayer() {
            if (!this.hasAccess) {
                this.isLoading = false;
                return;
            }
            
            // 如果没有播放参数，先获取
            if (!this.playbackParams) {
                this.fetchPlaybackParams();
                return;
            }
            
            // 检查播放参数是否完整
            if (!this.hasRequiredParams) {
                this.handleError('播放参数不完整，无法初始化播放器');
                return;
            }
            
            // 确保DOM已更新
            this.$nextTick(() => {
                this.checkAndLoadTCPlayer();
            });
        },
        
        // 检查并加载TCPlayer SDK
        checkAndLoadTCPlayer() {
            console.log('开始检查TCPlayer SDK加载状态...');
            
            // 首先检查全局对象是否存在（可能是TCPlayer或TcPlayer）
            const tcplayerGlobal = window.TCPlayer || window.TcPlayer;
            
            if (tcplayerGlobal) {
                console.log('TCPlayer SDK已加载:', tcplayerGlobal);
                window.TCPlayer = tcplayerGlobal; // 确保使用标准名称
                this.createPlayerInstance();
                return;
            }
            
            // TCPlayer未加载，尝试动态加载
            this.isLoading = true;
            this.error = null;
            
            console.log('TCPlayer SDK未加载，开始加载过程...');
            
            // 设置超时检查
            const timeoutId = setTimeout(() => {
                const stillMissing = !window.TCPlayer && !window.TcPlayer;
                if (stillMissing) {
                    console.error('TCPlayer SDK加载超时');
                    this.handleError('腾讯云点播播放器SDK加载超时。可能原因：<br>1. 网络连接问题<br>2. CDN不可访问<br>3. 浏览器安全限制');
                }
            }, 15000); // 15秒超时
            
            // 监听TCPlayer加载
            const checkInterval = setInterval(() => {
                const tcplayer = window.TCPlayer || window.TcPlayer;
                if (tcplayer) {
                    clearInterval(checkInterval);
                    clearTimeout(timeoutId);
                    console.log('TCPlayer SDK加载成功:', tcplayer);
                    window.TCPlayer = tcplayer; // 标准化为TCPlayer
                    this.createPlayerInstance();
                }
            }, 1000); // 每秒检查一次
            
            // 立即尝试加载脚本
            console.log('立即加载TCPlayer脚本...');
            this.loadTCPlayerScript();
        },
        
        // 动态加载TCPlayer脚本
        loadTCPlayerScript() {
            // 首先确保HLS.js已加载
            if (typeof Hls === 'undefined') {
                console.log('HLS.js未加载，先加载HLS.js...');
                this.loadHlsScript().then(() => {
                    this.loadTCPlayerScriptInternal();
                }).catch(error => {
                    console.error('HLS.js加载失败:', error);
                    this.handleError('HLS.js库加载失败，视频播放器无法工作');
                });
            } else {
                console.log('HLS.js已加载，继续加载TCPlayer');
                this.loadTCPlayerScriptInternal();
            }
        },
        
        // 加载HLS.js脚本
        loadHlsScript() {
            return new Promise((resolve, reject) => {
                // 检查是否已经加载过
                if (typeof Hls !== 'undefined') {
                    console.log('HLS.js已加载');
                    resolve();
                    return;
                }
                
                // 检查是否正在加载
                if (document.querySelector('script[src*="hls.js"]')) {
                    console.log('HLS.js脚本正在加载中...');
                    // 等待加载完成
                    const checkInterval = setInterval(() => {
                        if (typeof Hls !== 'undefined') {
                            clearInterval(checkInterval);
                            console.log('HLS.js加载完成');
                            resolve();
                        }
                    }, 100);
                    return;
                }
                
                console.log('创建HLS.js脚本标签...');
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/hls.js@1.4.10/dist/hls.min.js';
                script.type = 'text/javascript';
                script.async = true;
                script.crossOrigin = 'anonymous';
                
                script.onload = () => {
                    console.log('HLS.js脚本加载成功');
                    if (typeof Hls !== 'undefined') {
                        resolve();
                    } else {
                        reject(new Error('HLS.js加载但对象未定义'));
                    }
                };
                
                script.onerror = (error) => {
                    console.error('HLS.js脚本加载失败:', error);
                    reject(error);
                };
                
                document.head.appendChild(script);
            });
        },
        
        // 内部加载TCPlayer脚本
        loadTCPlayerScriptInternal() {
            // 检查是否已经加载过脚本
            const existingScript = document.querySelector('script[src*="tcplayer"]');
            if (existingScript) {
                console.log('TCPlayer脚本已存在，检查加载状态:', existingScript.src);
                
                // 检查脚本是否已加载完成
                if (existingScript.getAttribute('data-loaded') === 'true') {
                    console.log('脚本标记为已加载，但TCPlayer对象未找到');
                    return;
                }
                
                // 添加加载完成监听器
                existingScript.addEventListener('load', () => {
                    console.log('现有脚本加载完成');
                    existingScript.setAttribute('data-loaded', 'true');
                });
                
                existingScript.addEventListener('error', () => {
                    console.error('现有脚本加载失败');
                    this.loadFallbackScript();
                });
                
                return;
            }
            
            console.log('创建新的TCPlayer脚本标签...');
            
            // 创建新的script标签
            const script = document.createElement('script');
            script.src = 'https://web.sdk.qcloud.com/player/tcplayer/release/v4.5.0/tcplayer.v4.5.0.min.js';
            script.type = 'text/javascript';
            script.async = true;
            script.crossOrigin = 'anonymous';
            
            script.onload = () => {
                console.log('TCPlayer脚本动态加载成功');
                script.setAttribute('data-loaded', 'true');
                
                // 检查TCPlayer对象
                setTimeout(() => {
                    const tcplayer = window.TCPlayer || window.TcPlayer;
                    if (tcplayer) {
                        console.log('TCPlayer对象已创建:', tcplayer);
                        window.TCPlayer = tcplayer;
                    } else {
                        console.warn('脚本加载完成但TCPlayer对象未创建');
                        this.checkAlternativeNames();
                    }
                }, 100);
            };
            
            script.onerror = (error) => {
                console.error('TCPlayer脚本加载失败:', error);
                this.loadFallbackScript();
            };
            
            document.head.appendChild(script);
            console.log('TCPlayer脚本已添加到DOM');
        },
        
        // 加载备用脚本
        loadFallbackScript() {
            console.log('尝试加载备用CDN...');
            
            // 备用CDN链接
            const fallbackUrls = [
                'https://cdnjs.cloudflare.com/ajax/libs/tcplayer/4.5.0/tcplayer.v4.5.0.min.js',
                'https://unpkg.com/tcplayer@4.5.0/dist/tcplayer.v4.5.0.min.js'
            ];
            
            for (const url of fallbackUrls) {
                const script = document.createElement('script');
                script.src = url;
                script.type = 'text/javascript';
                script.async = true;
                script.crossOrigin = 'anonymous';
                
                script.onload = () => {
                    console.log(`备用CDN加载成功: ${url}`);
                    script.setAttribute('data-loaded', 'true');
                };
                
                script.onerror = () => {
                    console.error(`备用CDN加载失败: ${url}`);
                };
                
                document.head.appendChild(script);
                break; // 先尝试第一个
            }
        },
        
        // 检查可能的替代对象名称
        checkAlternativeNames() {
            console.log('检查可能的TCPlayer对象名称...');
            
            const possibleNames = [
                'TCPlayer', 'TcPlayer', 'tcPlayer', 'tcplayer',
                'TencentPlayer', 'tencentPlayer', 'VodPlayer', 'vodPlayer'
            ];
            
            for (const name of possibleNames) {
                if (window[name]) {
                    console.log(`找到可能的TCPlayer对象: ${name}`, window[name]);
                    window.TCPlayer = window[name];
                    return window[name];
                }
            }
            
            console.log('未找到任何可能的TCPlayer对象');
            return null;
        },
        
        // 创建播放器实例
        createPlayerInstance() {
            try {
                const tcplayer = window.TCPlayer || window.TcPlayer;
                
                if (!tcplayer) {
                    throw new Error('腾讯云点播播放器SDK未加载。请检查：1.网络连接 2.CDN可访问性 3.浏览器控制台错误');
                }
                
                console.log('开始创建播放器实例...', {
                    file_id: this.playbackParams.file_id,
                    app_id: this.playbackParams.app_id,
                    videoElement: this.$refs.playerVideo
                });
                
                // 获取video元素
                const videoElement = this.$refs.playerVideo;
                if (!videoElement) {
                    throw new Error('找不到video元素');
                }
                
                // 创建播放器实例
                this.player = tcplayer(videoElement, this.finalPlayerOptions);
                
                console.log('播放器实例创建成功:', this.player);
                
                // 监听播放器事件
                this.setupPlayerEvents();
                
                console.log('腾讯云点播播放器初始化成功');
                
            } catch (error) {
                console.error('播放器初始化失败:', error);
                this.handleError('播放器初始化失败: ' + error.message);
            }
        },
        
        // 设置播放器事件监听
        setupPlayerEvents() {
            if (!this.player) return;
            
            // 准备就绪
            this.player.on('ready', () => {
                console.log('播放器准备就绪');
                this.isLoading = false;
                this.retryCount = 0;
                
                // 获取视频信息
                this.videoDuration = this.player.duration();
                this.detectVideoResolution();
                
                // 自动播放（如果启用）
                if (this.autoplay && this.hasAccess) {
                    this.player.play().catch(error => {
                        console.log('自动播放被阻止:', error);
                    });
                }
            });
            
            // 播放事件
            this.player.on('play', () => {
                this.isPlaying = true;
                this.$emit('play');
            });
            
            // 暂停事件
            this.player.on('pause', () => {
                this.isPlaying = false;
                this.$emit('pause');
            });
            
            // 结束事件
            this.player.on('ended', () => {
                this.isPlaying = false;
                this.$emit('ended');
            });
            
            // 错误事件
            this.player.on('error', (event) => {
                console.error('播放器错误:', event);
                this.handleError(this.getErrorMessage(event));
            });
            
            // 加载数据
            this.player.on('loadeddata', () => {
                console.log('视频数据已加载');
                this.isLoading = false;
            });
            
            // 等待中
            this.player.on('waiting', () => {
                this.isLoading = true;
            });
            
            // 可以播放
            this.player.on('canplay', () => {
                this.isLoading = false;
            });
            
            // 时间更新
            this.player.on('timeupdate', () => {
                this.currentTime = this.player.currentTime();
                this.$emit('timeupdate', {
                    currentTime: this.currentTime,
                    duration: this.player.duration(),
                    percentage: (this.currentTime / this.player.duration()) * 100
                });
            });
            
            // 分辨率变化
            this.player.on('resolutionchange', () => {
                this.detectVideoResolution();
            });
        },
        
        // 检测视频分辨率
        detectVideoResolution() {
            if (!this.player) return;
            
            try {
                const videoElement = this.player.el().querySelector('video');
                if (videoElement) {
                    const width = videoElement.videoWidth;
                    const height = videoElement.videoHeight;
                    
                    if (width && height) {
                        if (height >= 1080) {
                            this.videoResolution = '1080p';
                        } else if (height >= 720) {
                            this.videoResolution = '720p';
                        } else if (height >= 480) {
                            this.videoResolution = '480p';
                        } else {
                            this.videoResolution = `${height}p`;
                        }
                    }
                }
            } catch (error) {
                console.warn('无法检测视频分辨率:', error);
            }
        },
        
        // 获取错误消息
        getErrorMessage(error) {
            // TCPlayer错误代码映射
            const tcplayerErrorMap = {
                1000: '播放器初始化失败',
                1001: '视频格式不支持',
                1002: '视频解码失败',
                1003: '视频加载超时',
                1004: '视频网络错误',
                1005: '视频数据损坏',
                1006: '视频源错误',
                1007: '视频信息获取失败（请检查fileID、appID和psign）',
                1008: '播放器配置错误',
                1009: '播放器内部错误',
                1010: '视频权限验证失败'
            };
            
            // 标准媒体错误
            const mediaErrorMap = {
                'MEDIA_ERR_NETWORK': '网络错误，请检查网络连接',
                'MEDIA_ERR_DECODE': '视频解码错误，文件可能已损坏',
                'MEDIA_ERR_SRC_NOT_SUPPORTED': '不支持的视频格式',
                'MEDIA_ERR_ABORTED': '视频加载被中止'
            };
            
            // 检查TCPlayer错误代码
            if (error && error.code && tcplayerErrorMap[error.code]) {
                return tcplayerErrorMap[error.code];
            }
            
            // 检查标准媒体错误
            let errorCode = error;
            if (error && error.code) {
                errorCode = error.code;
            }
            
            if (mediaErrorMap[errorCode]) {
                return mediaErrorMap[errorCode];
            }
            
            // 通用错误处理
            if (error && error.message) {
                return `视频播放失败: ${error.message}`;
            }
            
            return '视频播放失败，请检查网络连接或联系管理员';
        },
        
        // 处理错误
        handleError(errorMessage) {
            this.error = errorMessage;
            this.isLoading = false;
            
            // 自动重试机制
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`准备第 ${this.retryCount} 次重试...`);
                
                // 3秒后重试
                setTimeout(() => {
                    if (this.player) {
                        this.error = null;
                        this.isLoading = true;
                        this.player.load();
                    }
                }, 3000);
            }
        },
        
        // 播放控制方法
        play() {
            if (this.player && this.hasAccess) {
                this.player.play();
            }
        },
        
        pause() {
            if (this.player) {
                this.player.pause();
            }
        },
        
        togglePlay() {
            if (this.player && this.hasAccess) {
                if (this.player.paused()) {
                    this.player.play();
                } else {
                    this.player.pause();
                }
            }
        },
        
        // 跳转到指定时间
        seekTo(time) {
            if (this.player) {
                this.player.currentTime(time);
            }
        },
        
        // 设置音量
        setVolume(volume) {
            if (this.player) {
                this.player.volume(volume);
            }
        },
        
        // 切换静音
        toggleMute() {
            if (this.player) {
                this.player.muted(!this.player.muted());
            }
        },
        
        // 设置播放速度
        setSpeed(speed) {
            if (this.player) {
                this.player.playbackRate(speed);
            }
        },
        
        // 切换全屏
        toggleFullscreen() {
            if (this.player) {
                if (this.player.isFullscreen()) {
                    this.player.exitFullscreen();
                } else {
                    this.player.requestFullscreen();
                }
            }
        },
        
        // 重试加载
        retry() {
            this.error = null;
            this.isLoading = true;
            this.retryCount = 0;
            
            if (this.player) {
                this.player.load();
            } else {
                this.initPlayer();
            }
        },
        
        // 格式化时长
        formatDuration(seconds) {
            if (!seconds || isNaN(seconds)) return '00:00';
            
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            
            if (hours > 0) {
                return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            } else {
                return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
        },
        
        // 销毁播放器
        destroyPlayer() {
            if (this.player) {
                try {
                    this.player.dispose();
                    this.player = null;
                } catch (error) {
                    console.warn('播放器销毁时出错:', error);
                }
            }
        }
    },
    mounted() {
        // 启动播放参数检查定时器
        this.paramCheckInterval = setInterval(() => {
            this.checkPlaybackParamsExpiry();
        }, 60 * 1000); // 每分钟检查一次
        
        this.initPlayer();
    },
    beforeDestroy() {
        // 清理定时器
        if (this.paramCheckInterval) {
            clearInterval(this.paramCheckInterval);
            this.paramCheckInterval = null;
        }
        
        this.destroyPlayer();
    },
    watch: {
        // 监听视频ID变化
        videoId(newVideoId, oldVideoId) {
            if (newVideoId !== oldVideoId) {
                // 重置状态
                this.playbackParams = null;
                this.videoInfo = null;
                this.destroyPlayer();
                this.initPlayer();
            }
        },
        
        // 监听认证令牌变化
        authToken(newToken, oldToken) {
            if (newToken !== oldToken) {
                // 重新获取播放参数
                this.fetchPlaybackParams();
            }
        },
        
        // 监听权限变化
        hasAccess(newAccess) {
            if (newAccess && !this.player) {
                this.initPlayer();
            }
        }
    }
};

console.log('腾讯云点播播放器组件已加载');