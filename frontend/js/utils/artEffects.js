// 艺术效果工具函数

// 创建艺术背景点
export function createArtBackground(containerId = 'artBackground', count = 50) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // 清空现有内容
    container.innerHTML = '';
    
    // 创建艺术点
    for (let i = 0; i < count; i++) {
        const dot = document.createElement('div');
        dot.className = 'art-dot';
        
        // 随机大小 (1-5px)
        const size = Math.random() * 4 + 1;
        dot.style.width = dot.style.height = `${size}px`;
        
        // 随机位置
        dot.style.left = `${Math.random() * 100}%`;
        dot.style.top = `${Math.random() * 100}%`;
        
        // 随机颜色 (暖色调)
        const hue = Math.random() * 30 + 30; // 30-60度，暖色调
        const saturation = 30 + Math.random() * 20; // 30-50%
        const lightness = 40 + Math.random() * 20; // 40-60%
        dot.style.background = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        
        // 随机透明度
        dot.style.opacity = Math.random() * 0.3 + 0.1;
        
        // 随机动画延迟
        dot.style.animationDelay = `${Math.random() * 5}s`;
        
        container.appendChild(dot);
    }
}

// 创建浮动艺术元素
export function createFloatingElements(container, count = 10) {
    const shapes = ['circle', 'square', 'triangle', 'line'];
    const colors = [
        'var(--color-accent-art)',
        'var(--color-accent-warm)',
        'var(--color-accent-cool)',
        'var(--color-accent-earth)'
    ];
    
    for (let i = 0; i < count; i++) {
        const element = document.createElement('div');
        element.className = 'art-element art-float';
        
        // 随机位置
        element.style.left = `${Math.random() * 100}%`;
        element.style.top = `${Math.random() * 100}%`;
        
        // 随机大小
        const size = 20 + Math.random() * 80;
        
        // 随机形状
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        switch (shape) {
            case 'circle':
                element.style.width = element.style.height = `${size}px`;
                element.style.borderRadius = '50%';
                element.style.border = `1px solid ${color}`;
                element.style.opacity = '0.1';
                break;
            case 'square':
                element.style.width = element.style.height = `${size}px`;
                element.style.border = `1px solid ${color}`;
                element.style.opacity = '0.08';
                break;
            case 'triangle':
                element.style.width = '0';
                element.style.height = '0';
                element.style.borderLeft = `${size/2}px solid transparent`;
                element.style.borderRight = `${size/2}px solid transparent`;
                element.style.borderBottom = `${size}px solid ${color}`;
                element.style.opacity = '0.05';
                break;
            case 'line':
                element.style.width = `${size}px`;
                element.style.height = '1px';
                element.style.background = `linear-gradient(90deg, transparent, ${color}, transparent)`;
                element.style.opacity = '0.15';
                break;
        }
        
        // 随机动画
        const duration = 10 + Math.random() * 20;
        element.style.animationDuration = `${duration}s`;
        
        container.appendChild(element);
    }
}

// 添加滚动视差效果
export function setupParallaxEffect() {
    const parallaxElements = document.querySelectorAll('.art-parallax');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        parallaxElements.forEach(element => {
            const speed = element.dataset.speed || 0.5;
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    });
}

// 添加鼠标跟随效果
export function setupMouseFollowEffect() {
    const cursor = document.createElement('div');
    cursor.id = 'art-cursor';
    cursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        border: 1px solid var(--color-accent-art);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        opacity: 0.3;
        transform: translate(-50%, -50%);
        transition: width 0.3s, height 0.3s, opacity 0.3s;
    `;
    document.body.appendChild(cursor);
    
    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    // 平滑跟随动画
    function animateCursor() {
        cursorX += (mouseX - cursorX) * 0.1;
        cursorY += (mouseY - cursorY) * 0.1;
        
        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;
        
        requestAnimationFrame(animateCursor);
    }
    
    animateCursor();
    
    // 鼠标悬停效果
    document.addEventListener('mouseover', (e) => {
        if (e.target.matches('button, a, .art-card')) {
            cursor.style.width = '40px';
            cursor.style.height = '40px';
            cursor.style.opacity = '0.5';
        }
    });
    
    document.addEventListener('mouseout', (e) => {
        if (e.target.matches('button, a, .art-card')) {
            cursor.style.width = '20px';
            cursor.style.height = '20px';
            cursor.style.opacity = '0.3';
        }
    });
}

// 添加页面过渡效果
export function setupPageTransitions() {
    // 添加CSS过渡类
    const style = document.createElement('style');
    style.textContent = `
        .page-transition-enter {
            opacity: 0;
            transform: translateY(20px);
        }
        .page-transition-enter-active {
            transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .page-transition-enter-to {
            opacity: 1;
            transform: translateY(0);
        }
        .page-transition-leave {
            opacity: 1;
        }
        .page-transition-leave-active {
            transition: opacity 0.3s ease;
        }
        .page-transition-leave-to {
            opacity: 0;
        }
    `;
    document.head.appendChild(style);
}

// 初始化所有艺术效果
export function initArtEffects() {
    // 创建艺术背景
    createArtBackground();
    
    // 添加鼠标跟随效果（可选）
    // setupMouseFollowEffect();
    
    // 设置页面过渡
    setupPageTransitions();
    
    console.log('艺术效果已初始化');
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initArtEffects);
} else {
    initArtEffects();
}