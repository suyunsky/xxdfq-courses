#!/usr/bin/env python3
"""
SPA友好的HTTP服务器
将所有路由重定向到index.html，让Vue应用处理路由
"""

import http.server
import socketserver
import os
import urllib.parse

PORT = 8080
FRONTEND_DIR = os.path.dirname(os.path.abspath(__file__))

class SPAServer(http.server.SimpleHTTPRequestHandler):
    """自定义HTTP服务器，支持SPA路由"""
    
    def do_GET(self):
        # 解析请求路径
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        # 检查是否是API请求（转发到后端）
        if path.startswith('/api/'):
            # 这里可以添加代理逻辑，但为了简单起见，我们让前端直接访问后端
            # 在实际部署中，可以使用nginx或反向代理
            self.send_error(404, "API请求应直接访问后端服务器 (localhost:8000)")
            return
        
        # 检查是否是静态文件请求
        if path.startswith('/css/') or path.startswith('/js/') or path.startswith('/assets/'):
            # 检查文件是否存在
            file_path = os.path.join(FRONTEND_DIR, path[1:])  # 去掉开头的'/'
            if os.path.exists(file_path) and os.path.isfile(file_path):
                # 根据文件扩展名设置正确的Content-Type
                if path.endswith('.js'):
                    self._serve_js_file(file_path)
                elif path.endswith('.css'):
                    self._serve_css_file(file_path)
                else:
                    # 使用父类方法提供其他静态文件
                    super().do_GET()
                return
        
        # 检查是否是字体请求（特殊处理）
        if path == '/fonts/google-fonts.css':
            # 提供本地的Google Fonts CSS文件
            self._serve_google_fonts_css()
            return
        
        # 对于所有其他路由，返回index.html
        index_path = os.path.join(FRONTEND_DIR, 'index.html')
        if os.path.exists(index_path):
            with open(index_path, 'rb') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        else:
            self.send_error(404, "index.html not found")
    
    def _serve_google_fonts_css(self):
        """提供Google Fonts的本地CSS文件"""
        # 创建本地字体CSS
        css_content = """
/* 本地字体替代Google Fonts */
@font-face {
    font-family: 'Noto Serif SC';
    font-style: normal;
    font-weight: 300;
    src: local('Noto Serif SC Light'), local('NotoSerifSC-Light'), 
         url('/assets/fonts/noto-serif-sc-v22-latin-300.woff2') format('woff2');
}

@font-face {
    font-family: 'Noto Serif SC';
    font-style: normal;
    font-weight: 400;
    src: local('Noto Serif SC Regular'), local('NotoSerifSC-Regular'), 
         url('/assets/fonts/noto-serif-sc-v22-latin-regular.woff2') format('woff2');
}

@font-face {
    font-family: 'Noto Serif SC';
    font-style: normal;
    font-weight: 500;
    src: local('Noto Serif SC Medium'), local('NotoSerifSC-Medium'), 
         url('/assets/fonts/noto-serif-sc-v22-latin-500.woff2') format('woff2');
}

@font-face {
    font-family: 'Noto Serif SC';
    font-style: normal;
    font-weight: 600;
    src: local('Noto Serif SC SemiBold'), local('NotoSerifSC-SemiBold'), 
         url('/assets/fonts/noto-serif-sc-v22-latin-600.woff2') format('woff2');
}

@font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 300;
    src: local('Inter Light'), local('Inter-Light'),
         url('/assets/fonts/inter-v12-latin-300.woff2') format('woff2');
}

@font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 400;
    src: local('Inter Regular'), local('Inter-Regular'),
         url('/assets/fonts/inter-v12-latin-regular.woff2') format('woff2');
}

@font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 500;
    src: local('Inter Medium'), local('Inter-Medium'),
         url('/assets/fonts/inter-v12-latin-500.woff2') format('woff2');
}

@font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 600;
    src: local('Inter SemiBold'), local('Inter-SemiBold'),
         url('/assets/fonts/inter-v12-latin-600.woff2') format('woff2');
}

/* 系统字体回退 */
body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

h1, h2, h3, h4, h5, h6 {
    font-family: 'Noto Serif SC', 'Times New Roman', serif;
}
"""
        
        self.send_response(200)
        self.send_header('Content-Type', 'text/css; charset=utf-8')
        self.send_header('Content-Length', str(len(css_content.encode('utf-8'))))
        self.end_headers()
        self.wfile.write(css_content.encode('utf-8'))
    
    def _serve_js_file(self, file_path):
        """提供JavaScript文件，设置正确的MIME类型"""
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            
            # 设置正确的MIME类型
            mime_type = 'application/javascript'
            if file_path.endswith('.mjs'):
                mime_type = 'application/javascript'
            
            self.send_response(200)
            self.send_header('Content-Type', f'{mime_type}; charset=utf-8')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(500, f"读取文件失败: {str(e)}")
    
    def _serve_css_file(self, file_path):
        """提供CSS文件，设置正确的MIME类型"""
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-Type', 'text/css; charset=utf-8')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(500, f"读取文件失败: {str(e)}")
    
    def end_headers(self):
        """添加CORS头"""
        self.send_header('Access-Control-Allow-Origin', 'http://localhost:8000')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        """处理OPTIONS请求（CORS预检）"""
        self.send_response(200)
        self.end_headers()

def main():
    """启动服务器"""
    os.chdir(FRONTEND_DIR)  # 切换到前端目录
    
    with socketserver.TCPServer(("", PORT), SPAServer) as httpd:
        print(f"SPA HTTP服务器启动在 http://localhost:{PORT}")
        print(f"前端目录: {FRONTEND_DIR}")
        print("按 Ctrl+C 停止服务器")
        print("\n支持的路由:")
        print("  /              - 首页")
        print("  /courses       - 课程列表")
        print("  /dashboard     - 用户中心")
        print("  /login         - 登录页面")
        print("  /course/:id    - 课程详情")
        print("  ... 以及其他所有路由")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止")

if __name__ == "__main__":
    main()