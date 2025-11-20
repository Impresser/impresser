# Deployment Guide

## 1\. 개요

- **서비스명**: Impresser
- **주요 구성**
  - **Frontend**: Next.js, pnpm
  - **Backend**: **Spring Boot 3.5.6**, Java 17, Gradle
  - **Image Worker**: C++, CUDA
  - **Databases**: MySQL, Redis
  - **Message Queue**: RabbitMQ
  - **Infrastructure**: AWS EC2, Docker, Jenkins, Nginx
  - **GPU Platform**: RunPod
  - **CI/CD**: GitLab, Jenkins, Docker Hub

---

## 2\. IDE

- **Frontend**: Visual Studio Code
- **Backend**: IntelliJ IDEA
- **Image Worker**: Visual Studio

---

## 3\. Docker 네트워크 구성

Nginx와 각 서비스 컨테이너가 통신하기 위한 네트워크를 생성합니다.

```bash
docker network create prod_net
docker network create dev_net
```

---

## 4\. Nginx 설치 및 설정

초기에는 젠킨스 배포 파이프라인 작동을 위해 \*\*"젠킨스 접속"\*\*과 \*\*"SSL(HTTPS) 적용"\*\*을 보장하는 설정을 적용합니다.

### 4.1. 디렉토리 및 파일 준비

실제 서버 경로(`/opt/impresser/...`)에 디렉토리를 생성합니다.

```bash
# 1. 호스트 디렉토리 생성
sudo mkdir -p /opt/impresser/infra/nginx/conf.d
sudo mkdir -p /opt/impresser/infra/nginx/sites-enabled
sudo mkdir -p /opt/impresser/infra/nginx/ssl

# 2. 초기 Upstream 설정 파일 생성 (빈 파일로 에러 방지)
sudo touch /opt/impresser/infra/nginx/conf.d/upstream.backend.prod.conf
sudo touch /opt/impresser/infra/nginx/conf.d/upstream.backend.dev.conf
```

### 4.2. 초기 Nginx 설정 파일 작성

**파일 경로**: `/opt/impresser/infra/nginx/nginx.conf`

```nginx
events {
  worker_connections 1024;
}

http {
  include       mime.types;
  default_type  application/octet-stream;

  map $http_upgrade $connection_upgrade {
      default upgrade;
      '' close;
  }

  # HTTP -> HTTPS Redirect
  server {
    listen 80;
    server_name k13s404.p.ssafy.io;
    return 301 https://$host$request_uri;
  }

  # HTTPS Server
  server {
    listen 443 ssl;
    http2 on;
    server_name k13s404.p.ssafy.io;

    ssl_certificate      /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key  /etc/nginx/ssl/privkey.pem;

    resolver 127.0.0.11 valid=5s;

    location /jenkins/ {
      proxy_pass http://jenkins:8080/jenkins/;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_read_timeout 300s;

      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
      return 200 'Nginx & Jenkins are running. Waiting for service deployment...';
      add_header Content-Type text/plain;
    }
  }
}
```

### 4.3. Nginx 실행 (`docker-compose.yml`)

**파일 경로**: `~/nginx/docker-compose.yml`

```yaml
version: "3.8"

services:
  nginx:
    image: nginx:1.25
    container_name: nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /opt/impresser/infra/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - /opt/impresser/infra/nginx/conf.d:/etc/nginx/conf.d:ro
      - /opt/impresser/infra/nginx/sites-enabled:/etc/nginx/sites-enabled:ro

      - /etc/letsencrypt/live/k13s404.p.ssafy.io:/etc/nginx/ssl:ro
    networks:
      - prod_net
      - dev_net

networks:
  prod_net:
    external: true
  dev_net:
    external: true
```

```bash
# 실행
docker-compose up -d
```

---

## 5\. EC2 서버 환경

- **OS**: Ubuntu 22.04 LTS
- **플랫폼**: AWS EC2 (t2.xlarge)
- **CPU**: 4 vCPUs
- **메모리**: 16 GiB RAM

### 5.1. EC2 방화벽 및 포트 설정

| 포트 (외부) | 프로토콜 | 연결 서비스     | 내부 매핑      |
| :---------- | :------- | :-------------- | :------------- |
| **22**      | TCP      | SSH             | -              |
| **80**      | TCP      | Nginx           | `80->80`       |
| **443**     | TCP      | Nginx           | `443->443`     |
| **8443**    | TCP      | Nginx           | `8443->8443`   |
| **8081**    | TCP      | Jenkins         | `8081->8080`   |
| **33061**   | TCP      | MySQL (Prod)    | `33061->3306`  |
| **33062**   | TCP      | MySQL (Dev)     | `33062->3306`  |
| **63791**   | TCP      | Redis (Prod)    | `63791->6379`  |
| **63792**   | TCP      | Redis (Dev)     | `63792->6379`  |
| **56721**   | TCP      | RabbitMQ (Prod) | `56721->5672`  |
| **25672**   | TCP      | RabbitMQ (Prod) | `25672->15672` |
| **56722**   | TCP      | RabbitMQ (Dev)  | `56722->5672`  |
| **35672**   | TCP      | RabbitMQ (Dev)  | `35672->15672` |

### 5.2. 도메인 및 SSL 설정

- **도메인**: `k13s404.p.ssafy.io`
- **SSL 인증서**: Let's Encrypt (`fullchain.pem`, `privkey.pem`)

---

## 6\. CI/CD 및 인프라 설치 (EC2)

### 6.1. Docker 설치 (호스트)

```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

### 6.2. Jenkins 설치 및 설정

**A. `docker-compose.yml` 작성** (`~/jenkins/docker-compose.yml`)

```yaml
version: "3.8"

services:
  jenkins:
    image: jenkins/jenkins:lts
    container_name: jenkins
    restart: unless-stopped
    ports:
      - "8081:8080"
    volumes:
      - /var/jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
    group_add:
      - "999" # 호스트의 docker 그룹 GID
    networks:
      - prod_net

networks:
  prod_net:
    external: true
```

**B. Jenkins 실행**

```bash
cd ~/jenkins && docker-compose up -d
```

**C. Jenkins 컨테이너 내부 Docker CLI 설치**

```bash
# 1. 컨테이너 접속 (root)
docker exec -u 0 -it jenkins bash

# 2. 필요한 패키지 설치
apt-get update
apt-get install -y apt-transport-https ca-certificates curl gnupg2 software-properties-common lsb-release

# 3. Docker 공식 GPG 키 추가
curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add -

# 4. Docker 저장소 추가
echo "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable" \
  > /etc/apt/sources.list.d/docker.list

# 5. Docker CLI 설치
apt-get update
apt-get install -y docker-ce-cli

# 6. 종료
exit
```

---

## 7\. 데이터베이스 및 메시지 큐

### 7.1. MySQL (Prod/Dev)

**`~/mysql/docker-compose.yml`**

```yaml
version: "3.8"

services:
  mysql-prod:
    image: mysql:8.0
    container_name: mysql-prod
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: [PASSWORD]
      MYSQL_DATABASE: impresser
    ports:
      - "33061:3306"
    volumes:
      - ./data_prod:/var/lib/mysql
    networks:
      - prod_net
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  mysql-dev:
    image: mysql:8.0
    container_name: mysql-dev
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: [PASSWORD]
      MYSQL_DATABASE: impresser
    ports:
      - "33062:3306"
    volumes:
      - ./data_dev:/var/lib/mysql
    networks:
      - dev_net
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  prod_net:
    external: true
  dev_net:
    external: true
```

```bash
cd ~/mysql && docker-compose up -d
```

### 7.2. Redis (Prod/Dev)

**`~/redis/docker-compose.yml`**

```yaml
version: "3.8"

services:
  redis-prod:
    image: redis:7-alpine
    container_name: redis-prod
    restart: unless-stopped
    ports:
      - "63791:6379"
    volumes:
      - ./data_prod:/data
    networks:
      - prod_net
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis-dev:
    image: redis:7-alpine
    container_name: redis-dev
    restart: unless-stopped
    ports:
      - "63792:6379"
    volumes:
      - ./data_dev:/data
    networks:
      - dev_net
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  prod_net:
    external: true
  dev_net:
    external: true
```

```bash
cd ~/redis && docker-compose up -d
```

### 7.3. RabbitMQ (Prod/Dev)

**`~/rabbitmq/docker-compose.yml`**

```yaml
version: "3.8"

services:
  rabbitmq-prod:
    image: rabbitmq:3-management-alpine
    container_name: rabbitmq-prod
    restart: unless-stopped
    ports:
      - "56721:5672"
      - "25672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: [USER]
      RABBITMQ_DEFAULT_PASS: [PASSWORD]
    networks:
      - prod_net
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_running"]
      interval: 30s
      timeout: 10s
      retries: 5

  rabbitmq-dev:
    image: rabbitmq:3-management-alpine
    container_name: rabbitmq-dev
    restart: unless-stopped
    ports:
      - "56722:5672"
      - "35672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: [USER]
      RABBITMQ_DEFAULT_PASS: [PASSWORD]
    networks:
      - dev_net
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_running"]
      interval: 30s
      timeout: 10s
      retries: 5

networks:
  prod_net:
    external: true
  dev_net:
    external: true
```

```bash
cd ~/rabbitmq && docker-compose up -d
```

---

## 8\. Image Worker 배포 (RunPod)

- **플랫폼**: RunPod
- **GPU**: NVIDIA A6000
- **소스 이미지**: Docker Hub (`khs5860/impresser-image-worker:latest`)

### 배포 프로세스

1.  **빌드 (Jenkins)**: Jenkins 파이프라인이 `image/` 디렉토리의 C++ 코드를 빌드합니다.
2.  **푸시 (Jenkins)**: 빌드된 이미지를 Docker Hub로 푸시합니다.
3.  **RunPod 템플릿 설정**:
    - **Container Image**: `khs5860/impresser-image-worker:latest`
    - **Container Disk**: 30 GB
4.  **Pod 실행**:
    - **GPU**: NVIDIA A6000 선택
    - **환경 변수**: \* `CALLBACK_BASE_URL`: [BACKEND URL]
      - `RABBITMQ_HOST`: (EC2 IP)
      - `RABBITMQ_PORT`: `56721`
      - `RABBITMQ_USER`: [USER]
      - `RABBITMQ_PASSWORD`: [PASSWORD]
