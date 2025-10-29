pipeline {
  agent any
  parameters {
    booleanParam(name: 'BUILD_BACKEND', defaultValue: false, description: '백엔드를 수동으로 배포합니다.')
    booleanParam(name: 'BUILD_FRONTEND', defaultValue: false, description: '프론트엔드를 수동으로 배포합니다.')
    booleanParam(name: 'BUILD_IMAGE_WORKER', defaultValue: false, description: 'GPU 워커 이미지만 수동으로 빌드 & 푸시합니다.')
    choice(name: 'MANUAL_TARGET_BRANCH', choices: ['develop', 'master'], description: '수동 배포 시 대상 환경을 선택하세요.')
  }
  environment {
    PROD_NET   = 'prod_net'
    DEV_NET    = 'dev_net'
    NGINX_CONT = 'nginx'
    CONF_DIR   = '/opt/impresser/infra/nginx/conf.d'
    LINK_NAME  = "${CONF_DIR}/upstream.backend.prod.conf"
    DOMAIN     = 'k13s404.p.ssafy.io'
    IMAGE_PREFIX = 'khs5860'
  }

  stages {
    stage('Determine Build Actions') {
      steps {
        script {
          env.DO_PROD = false
          env.DO_DEV = false
          env.BACKEND_CHANGED = false
          env.FRONTEND_CHANGED = false
          env.IMAGE_WORKER_CHANGED = false

          // 자동 배포
          if (env.gitlabMergeRequestState == 'merged') {
            echo "Running in automatic mode (MR merged)."
            def targetBranch = env.gitlabTargetBranch
            
            if (targetBranch == 'master') { env.DO_PROD = true }
            else if (targetBranch == 'develop') { env.DO_DEV = true }

            def changedFiles = sh(returnStdout: true, script: "git diff --name-only origin/${targetBranch}...${env.gitlabMergeRequestLastCommitSha}").trim()
            echo "Changed files in this MR:\n${changedFiles}"
            
            if (changedFiles.contains('backend/')) { env.BACKEND_CHANGED = true }
            if (changedFiles.contains('frontend/')) { env.FRONTEND_CHANGED = true }
            if (changedFiles.contains('image/')) { env.IMAGE_WORKER_CHANGED = true }

          // 수동 배포
          } else {
            echo "Running in manual mode."
            def targetBranch = params.MANUAL_TARGET_BRANCH

            if (targetBranch == 'master') { env.DO_PROD = true }
            else if (targetBranch == 'develop') { env.DO_DEV = true }

            if (params.BUILD_BACKEND) { env.BACKEND_CHANGED = true }
            if (params.BUILD_FRONTEND) { env.FRONTEND_CHANGED = true }
            if (params.BUILD_IMAGE_WORKER) { env.IMAGE_WORKER_CHANGED = true }
          }
          
          echo "Build decisions: DO_PROD=${env.DO_PROD}, DO_DEV=${env.DO_DEV}, BACKEND=${env.BACKEND_CHANGED}, FRONTEND=${env.FRONTEND_CHANGED}, IMAGE_WORKER=${env.IMAGE_WORKER_CHANGED}"
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
                withCredentials([file(credentialsId: 'prod-env-file-backend', variable: 'PROD_ENV_FILE_PATH')]) {
                  sh """
                    set -euo pipefail
                    for i in \$(seq 1 60); do
                      if [ "\$(docker inspect -f '{{.State.Health.Status}}' mysql-prod 2>/dev/null)" = "healthy" ] && \
                         [ "\$(docker inspect -f '{{.State.Health.Status}}' redis-prod 2>/dev/null)" = "healthy" ]; then break; fi
                      sleep 2
                    done

                    CUR=\$(readlink -f "${LINK_NAME}" || true)
                    if echo "\${CUR:-}" | grep -q "blue"; then
                      TARGET_CONT="backend-prod-green"
                      OLD_CONT="backend-prod-blue"
                    else
                      TARGET_CONT="backend-prod-blue"
                      OLD_CONT="backend-prod-green"
                    fi
                    echo "OLD_CONT=\$OLD_CONT" > /tmp/prod.slot

                    docker rm -f "\${TARGET_CONT}" || true
                    docker run -d --name "\${TARGET_CONT}" --network ${PROD_NET} --env-file ${PROD_ENV_FILE_PATH} ${PROD_TAG}

                    CONTEXT_PATH=\$(grep 'SERVER_CONTEXT_PATH=' ${PROD_ENV_FILE_PATH} | cut -d'=' -f2-)
                    for i in \$(seq 1 60); do
                      if docker exec "\${TARGET_CONT}" wget -qO- http://127.0.0.1:8080\${CONTEXT_PATH}/actuator/health 2>/dev/null | grep -q '"status":"UP"'; then exit 0; fi
                      sleep 1
                    done; exit 1
                  """
                }
              }
            }
            stage('Switch & Cleanup') {
              steps {
                script {
                  try {
                    sh "NGINX_CONT=${NGINX_CONT} CONF_DIR=${CONF_DIR} bash infra/scripts/switch_backend.sh"
                    sh "curl -fsS https://${DOMAIN}/actuator/health | grep UP"
                    sh '. /tmp/prod.slot && docker rm -f "${OLD_CONT}" || true'
                  } catch (e) {
                    sh "NGINX_CONT=${NGINX_CONT} CONF_DIR=${CONF_DIR} bash infra/scripts/switch_backend.sh"
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
            withCredentials([file(credentialsId: 'dev-env-file-backend', variable: 'DEV_ENV_FILE_PATH')]) {
              sh 'docker build -t ${DEV_TAG} -f backend/Dockerfile backend'
              sh """
                set -euo pipefail
                for i in \$(seq 1 60); do
                  if [ "\$(docker inspect -f '{{.State.Health.Status}}' mysql-dev 2>/dev/null)" = "healthy" ] && \
                     [ "\$(docker inspect -f '{{.State.Health.Status}}' redis-dev 2>/dev/null)" = "healthy" ]; then break; fi
                  sleep 2
                done

                docker rm -f backend-dev || true
                docker run -d --name backend-dev --network ${DEV_NET} --env-file ${DEV_ENV_FILE_PATH} ${DEV_TAG}

                CONTEXT_PATH=\$(grep 'SERVER_CONTEXT_PATH=' ${DEV_ENV_FILE_PATH} | cut -d'=' -f2-)
                for i in \$(seq 1 30); do
                  if docker exec backend-dev wget -qO- http://127.0.0.1:8080\${CONTEXT_PATH}/actuator/health 2>/dev/null | grep -q '"status":"UP"'; then exit 0; fi
                  sleep 1
                done; exit 1
              """
            }
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
                withCredentials([file(credentialsId: 'prod-env-file-frontend', variable: 'PROD_ENV_FILE_PATH')]) {
                  sh 'docker build -t ${PROD_TAG} -f frontend/Dockerfile frontend'
                  sh 'docker rm -f frontend-prod || true'
                  sh "docker run -d --name frontend-prod --network ${PROD_NET} --env-file ${PROD_ENV_FILE_PATH} ${PROD_TAG}"
                }
              }
            }
            stage('DEV') {
              when { expression { env.DO_DEV } }
              environment { DEV_TAG = "${IMAGE_PREFIX}/impresser-frontend-dev:${env.BUILD_NUMBER}" }
              steps {
                withCredentials([file(credentialsId: 'dev-env-file-frontend', variable: 'DEV_ENV_FILE_PATH')]) {
                  sh 'docker build -t ${DEV_TAG} -f frontend/Dockerfile frontend'
                  sh 'docker rm -f frontend-dev || true'
                  sh "docker run -d --name frontend-dev --network ${DEV_NET} --env-file ${DEV_ENV_FILE_PATH} ${DEV_TAG}"
                }
              }
            }
          }
        }

        /*************** C++ GPU WORKER (For RunPod) ***************/
        stage('Build & Push GPU Worker') {
          when { expression { env.IMAGE_WORKER_CHANGED } }
          steps {
            withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
              script {
                def imageName = "${IMAGE_PREFIX}/impresser-image-worker:${env.BUILD_NUMBER}"
                sh "docker build -t ${imageName} -f image/Dockerfile image"
                sh "echo ${DOCKER_PASSWORD} | docker login -u ${DOCKER_USERNAME} --password-stdin"
                sh "docker push ${imageName}"
                sh "docker logout"
              }
            }
          }
        }
      }
    }
  }
}