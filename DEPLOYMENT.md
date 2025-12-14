# 部署指南

本指南說明如何將輕量睡眠追蹤系統部署到生產環境。

## 🌍 部署選項

### 選項 1：共享主機（推薦新手）

**特點**：簡單、便宜、無需管理伺服器

**提供商**：Namecheap, Bluehost, HostGator, GoDaddy

**步驟**：

1. **購買主機和域名**
   - 選擇支援 PHP 7.4+ 和 MySQL 的方案

2. **上傳文件**
   ```bash
   # 使用 FTP 或 File Manager 上傳
   /public_html/
   ├── frontend/
   ├── backend/
   └── index.php (重定向到 frontend/index.html)
   ```

3. **配置資料庫**
   - 在控制面板建立 MySQL 資料庫
   - 執行 `backend/database/schema.sql`

4. **更新配置**
   ```php
   // backend/config/config.php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'yourusername_sleeptracker');
   define('DB_USER', 'yourusername_user');
   define('DB_PASS', 'your_password');
   define('API_BASE_URL', 'https://yourdomain.com');
   ```

5. **設置 HTTPS**
   - 使用 AutoSSL/Let's Encrypt（通常免費提供）

---

### 選項 2：虛擬私有伺服器（VPS）

**特點**：更多控制、較好的性能、需要更多技術知識

**提供商**：DigitalOcean, Linode, Vultr, AWS EC2

**步驟**：

1. **建立 VPS 實例**
   ```bash
   # 選擇 Ubuntu 20.04 或 22.04 LTS
   ```

2. **安裝必要軟件**
   ```bash
   sudo apt update && sudo apt upgrade
   sudo apt install php php-mysql apache2 mysql-server
   sudo systemctl start apache2
   sudo systemctl start mysql
   ```

3. **設置 MySQL**
   ```bash
   sudo mysql_secure_installation
   mysql -u root -p < backend/database/schema.sql
   ```

4. **上傳應用**
   ```bash
   # 使用 SCP 或 Git
   scp -r ./* user@your_vps_ip:/var/www/sleep-tracker/
   
   # 或使用 Git
   cd /var/www
   git clone https://github.com/yourusername/sleep-tracker.git
   ```

5. **配置 Apache**
   ```bash
   sudo nano /etc/apache2/sites-available/sleep-tracker.conf
   ```

   內容：
   ```apache
   <VirtualHost *:80>
       ServerName yourdomain.com
       ServerAlias www.yourdomain.com
       DocumentRoot /var/www/sleep-tracker/frontend

       <Directory /var/www/sleep-tracker/frontend>
           AllowOverride All
           Require all granted
       </Directory>

       <Directory /var/www/sleep-tracker/backend/api>
           AllowOverride All
           Require all granted
       </Directory>

       ErrorLog ${APACHE_LOG_DIR}/error.log
       CustomLog ${APACHE_LOG_DIR}/access.log combined
   </VirtualHost>
   ```

   ```bash
   sudo a2ensite sleep-tracker.conf
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

6. **設置 SSL（HTTPS）**
   ```bash
   sudo apt install certbot python3-certbot-apache
   sudo certbot --apache -d yourdomain.com -d www.yourdomain.com
   ```

---

### 選項 3：容器化部署（Docker）

**特點**：可重現性強、易於擴展

**步驟**：

1. **建立 Dockerfile**
   ```dockerfile
   # frontend/Dockerfile
   FROM nginx:alpine
   COPY . /usr/share/nginx/html
   EXPOSE 80
   ```

   ```dockerfile
   # backend/Dockerfile
   FROM php:7.4-apache
   RUN docker-php-ext-install pdo pdo_mysql
   COPY . /var/www/html
   EXPOSE 80
   ```

2. **建立 docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     frontend:
       build: ./frontend
       ports:
         - "80:80"
     
     backend:
       build: ./backend
       ports:
         - "8000:80"
       environment:
         - DB_HOST=mysql
         - DB_USER=root
         - DB_PASS=password
         - DB_NAME=sleep_tracker
       depends_on:
         - mysql
     
     mysql:
       image: mysql:8.0
       environment:
         - MYSQL_ROOT_PASSWORD=password
         - MYSQL_DATABASE=sleep_tracker
       volumes:
         - ./backend/database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
   ```

3. **運行容器**
   ```bash
   docker-compose up -d
   ```

---

### 選項 4：無服務器部署（Serverless）

**特點**：成本低、自動擴展

**提供商**：Firebase, AWS Lambda, Google Cloud Functions

#### 使用 Firebase

```bash
# 1. 安裝 Firebase CLI
npm install -g firebase-tools

# 2. 初始化項目
firebase init

# 3. 部署
firebase deploy
```

**firebase.json**：
```json
{
  "hosting": {
    "public": "frontend",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      }
    ]
  },
  "functions": {
    "source": "backend",
    "runtime": "nodejs14"
  }
}
```

---

## 🔒 生產環境安全清單

### 前端
- [ ] 移除 `console.log()` 調試語句
- [ ] 最小化 CSS 和 JavaScript
- [ ] 啟用 GZIP 壓縮
- [ ] 設置 CSP （Content Security Policy）
- [ ] 啟用 CORS（如適用）

### 後端
- [ ] 更改 `APP_DEBUG` 為 `false`
- [ ] 設置強密碼
- [ ] 使用環境變數存儲敏感數據
- [ ] 啟用 HTTPS 重定向
- [ ] 設置 HTTP headers
  ```php
  header('X-Content-Type-Options: nosniff');
  header('X-Frame-Options: DENY');
  header('X-XSS-Protection: 1; mode=block');
  ```
- [ ] 定期備份資料庫
- [ ] 設置監控和日誌

### 資料庫
- [ ] 啟用資料庫加密
- [ ] 設置自動備份
- [ ] 限制資料庫用戶權限
- [ ] 使用強密碼
- [ ] 定期更新 MySQL

---

## 📊 性能優化

### 前端優化

```bash
# 1. 壓縮資源
gzip -9 frontend/css/styles.css
gzip -9 frontend/js/app.js

# 2. 使用 CDN 分發靜態資源
# 配置 CloudFlare 或 AWS CloudFront
```

### 後端優化

```php
// 1. 啟用查詢快取
// 在 Database.php 中添加快取層

// 2. 使用資料庫索引
// 確保 schema.sql 有適當的索引

// 3. 壓縮 API 響應
header('Content-Encoding: gzip');
```

---

## 📈 監控和日誌

### 設置監控

```bash
# 使用 New Relic、DataDog 等服務
# 或使用開源方案如 Prometheus + Grafana
```

### 日誌配置

```php
// backend/config/config.php
define('LOG_FILE', '/var/log/sleep-tracker/app.log');

// 日誌記錄函數
function logEvent($message, $level = 'INFO') {
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] [$level] $message\n";
    file_put_contents(LOG_FILE, $logMessage, FILE_APPEND);
}
```

---

## 🔄 CI/CD 流程

### 使用 GitHub Actions

**.github/workflows/deploy.yml**：
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Run tests
        run: |
          php -l backend/api/index.php
      
      - name: Deploy to VPS
        uses: easingthemes/ssh-deploy@main
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SERVER_SSH_KEY }}
          REMOTE_HOST: ${{ secrets.SERVER_HOST }}
          REMOTE_USER: ${{ secrets.SERVER_USER }}
          TARGET: /var/www/sleep-tracker
```

---

## 🆘 故障排除

### 問題：API 連接超時

**解決**：
```php
// 增加超時時間
ini_set('default_socket_timeout', 300);
```

### 問題：大量請求時性能下降

**解決**：
1. 啟用資料庫查詢快取
2. 使用 Redis 快取層
3. 實施請求速率限制

```php
// 速率限制
function checkRateLimit($ip) {
    $key = "rate_limit_$ip";
    $count = apcu_fetch($key) ?: 0;
    if ($count >= 100) {
        http_response_code(429);
        exit('Too many requests');
    }
    apcu_store($key, $count + 1, 60);
}
```

### 問題：資料庫備份和恢復

```bash
# 備份
mysqldump -u root -p sleep_tracker > backup.sql

# 恢復
mysql -u root -p sleep_tracker < backup.sql
```

---

## 📞 部署後檢查清單

- [ ] 訪問應用並測試所有功能
- [ ] 檢查瀏覽器控制台是否有錯誤
- [ ] 測試 API 端點
- [ ] 驗證 HTTPS 工作正常
- [ ] 檢查日誌文件
- [ ] 設置備份計劃
- [ ] 配置監控告警
- [ ] 文檔化部署過程

---

## 🚀 進階部署

### 藍綠部署

```bash
# 運行兩個應用實例
# 使用負載均衡器在它們之間切換
```

### 金絲雀發布

```bash
# 部署新版本到 5% 的流量
# 逐漸增加到 100%
```

---

## 📚 參考資源

- [Apache 部署指南](https://httpd.apache.org/docs/)
- [Nginx 部署指南](https://nginx.org/en/docs/)
- [MySQL 最佳實踐](https://dev.mysql.com/doc/)
- [Docker 部署指南](https://docs.docker.com/)
- [Firebase 部署](https://firebase.google.com/docs)

---

最後更新：2024年12月14日
