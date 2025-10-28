pipeline {
  agent any
  parameters {
    choice(name: 'TARGET', choices: ['auto', 'dev', 'prod'], description: '배포 대상 선택 (auto: 브랜치 기반)')
  }
  environment {
    PROD_NET   = 'prod_net'
    DEV_NET    = 'dev_net'
    NGINX_CONT = 'nginx'
    CONF_DIR   = '/opt/impresser/infra/nginx/conf.d'
    LINK_NAME  = "${CONF_DIR}/upstream.backend.prod.conf"
    DOMAIN     = 'k13s404.p.ssafy.io'
    IMAGE_PREFIX = 'khs5860'

    PROD_ENV_FILE_BACKEND = credentials('prod-env-file-backend')
    DEV_ENV_FILE_BACKEND  = credentials('dev-env-file-backend')
    PROD_ENV_FILE_FRONTEND = credentials('prod-env-file-frontend')
    DEV_ENV_FILE_FRONTEND = credentials('dev-env-file-frontend')
    DOCKER_HUB_CREDS = credentials('dockerhub-creds')
  }

  stages {
    stage('Decide target') {
      steps {
        script {
          def branch = env.BRANCH_NAME ?: sh(returnStdout:true, script:'git rev-parse --abbrev-ref HEAD').trim()
          env.DO_PROD = (params.TARGET == 'prod') || (params.TARGET == 'auto' && (branch == 'master' || branch == 'main'))
          env.DO_DEV  = (params.TARGET == 'dev')  || (params.TARGET == 'auto' && branch == 'develop')
        }
      }
    }

    stage('Detect Changes') {
      steps {
        script {
          def changedFiles = sh(returnStdout: true, script: 'git diff --name-only HEAD~1 HEAD').trim()
          env.BACKEND_CHANGED = changedFiles.contains('backend/')
          env.FRONTEND_CHANGED = changedFiles.contains('frontend/')
          env.IMAGE_WORKER_CHANGED = changedFiles.contains('image/')
        }
      }
    }

    stage('Build & Deploy Services') {
      parallel {
        /*************** PROD: Backend Blue/Green ***************/
        stage('Deploy Backend (prod)') {
          when { expression { env.BACKEND_CHANGED && env.DO_PROD } }
          environment { PROD_TAG = "${IMAGE_PREFIX}/impresser-backend:${env.BUILD_NUMBER}" }
          stages {
            stage('Build') {
              steps { sh 'docker build -t ${PROD_TAG} -f backend/Dockerfile backend' }
            }
            stage('Run Target Slot') {
              steps {
                sh '''
                  set -euo pipefail
                  for i in $(seq 1 60); do
                    if [ "$(docker inspect -f '{{.State.Health.Status}}' mysql-prod 2>/dev/null)" = "healthy" ] && \
                       [ "$(docker inspect -f '{{.State.Health.Status}}' redis-prod 2>/dev/null)" = "healthy" ]; then break; fi
                    sleep 2
                  done

                  CUR=$(readlink -f "${LINK_NAME}" || true)
                  TARGET_CONT=$([[ "${CUR:-}" =~ blue ]] && echo "backend-prod-green" || echo "backend-prod-blue")
                  OLD_CONT=$([[ "${CUR:-}" =~ blue ]] && echo "backend-prod-blue" || echo "backend-prod-green")
                  echo "OLD_CONT=$OLD_CONT" > /tmp/prod.slot

                  docker rm -f "${TARGET_CONT}" || true
                  docker run -d --name "${TARGET_CONT}" --network ${PROD_NET} --env-file ${PROD_ENV_FILE_BACKEND} ${PROD_TAG}

                  for i in $(seq 1 60); do
                    if docker exec "${TARGET_CONT}" wget -qO- http://127.0.0.1:8080/actuator/health 2>/dev/null | grep -q '"status":"UP"'; then exit 0; fi
                    sleep 1
                  done; exit 1
                '''
              }
            }
            stage('Switch & Cleanup') {
              steps {
                script {
                  try {
                    sh 'NGINX_CONT=${NGINX_CONT} CONF_DIR=${CONF_DIR} bash infra/scripts/switch_backend.sh'
                    sh 'curl -fsS https://${DOMAIN}/actuator/health | grep UP'
                    sh '. /tmp/prod.slot && docker rm -f "${OLD_CONT}" || true'
                  } catch (e) {
                    sh 'NGINX_CONT=${NGINX_CONT} CONF_DIR=${CONF_DIR} bash infra/scripts/switch_backend.sh'
                    error "Prod smoke test failed. Rolled back successfully."
                  }
                }
              }
            }
          }
        }

        /*************** DEV: Backend 단일 교체 ***************/
        stage('Deploy Backend (dev)') {
          when { expression { env.BACKEND_CHANGED && env.DO_DEV } }
          environment { DEV_TAG = "${IMAGE_PREFIX}/impresser-backend-dev:${env.BUILD_NUMBER}" }
          steps {
            sh 'docker build -t ${DEV_TAG} -f backend/Dockerfile backend'
            sh '''
              set -euo pipefail
              for i in $(seq 1 60); do
                if [ "$(docker inspect -f '{{.State.Health.Status}}' mysql-dev 2>/dev/null)" = "healthy" ] && \
                   [ "$(docker inspect -f '{{.State.Health.Status}}' redis-dev 2>/dev/null)" = "healthy" ]; then break; fi
                sleep 2
              done

              docker rm -f backend-dev || true
              docker run -d --name backend-dev --network ${DEV_NET} --env-file ${DEV_ENV_FILE_BACKEND} ${DEV_TAG}

              for i in $(seq 1 30); do
                if docker exec backend-dev wget -qO- http://127.0.0.1:8080/actuator/health 2>/dev/null | grep -q '"status":"UP"'; then exit 0; fi
                sleep 1
              done; exit 1
            '''
          }
        }

        /*************** FRONTEND ***************/
        stage('Deploy Frontend') {
          when { expression { env.FRONTEND_CHANGED } }
          stages {
            stage('PROD') {
              when { expression { env.DO_PROD } }
              environment { PROD_TAG = "${IMAGE_PREFIX}/impresser-frontend:${env.BUILD_NUMBER}" }
              steps {
                sh 'docker build -t ${PROD_TAG} -f frontend/Dockerfile frontend'
                sh 'docker rm -f frontend-prod || true'
                sh 'docker run -d --name frontend-prod --network ${PROD_NET} --env-file ${PROD_ENV_FILE_FRONTEND} ${PROD_TAG}'
              }
            }
            stage('DEV') {
              when { expression { env.DO_DEV } }
              environment { DEV_TAG = "${IMAGE_PREFIX}/impresser-frontend-dev:${env.BUILD_NUMBER}" }
              steps {
                sh 'docker build -t ${DEV_TAG} -f frontend/Dockerfile frontend'
                sh 'docker rm -f frontend-dev || true'
                sh 'docker run -d --name frontend-dev --network ${DEV_NET} --env-file ${DEV_ENV_FILE_FRONTEND} ${DEV_TAG}'
              }
            }
          }
        }

        /*************** C++ GPU WORKER (For RunPod) ***************/
        stage('Build & Push GPU Worker') {
          when { expression { env.IMAGE_WORKER_CHANGED } }
          steps {
            script {
              def imageName = "${IMAGE_PREFIX}/impresser-image-worker:${env.BUILD_NUMBER}"
              docker.withRegistry('https://registry.hub.docker.com', 'dockerhub-creds') {
                dir('image') {
                  sh "docker build -t ${imageName} ."
                  sh "docker push ${imageName}"
                }
              }
              echo "Successfully pushed GPU Worker image to Docker Hub: ${imageName}"
            }
          }
        }
      }
    }
  }
}