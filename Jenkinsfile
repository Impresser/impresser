pipeline {
  agent any
  parameters {
    booleanParam(name: 'BUILD_BACKEND', defaultValue: false, description: '백엔드를 수동으로 배포합니다.')
    booleanParam(name: 'BUILD_FRONTEND', defaultValue: false, description: '프론트엔드를 수동으로 배포합니다.')
    booleanParam(name: 'BUILD_IMAGE_WORKER', defaultValue: false, description: 'GPU 워커 이미지를 수동으로 빌드 & 푸시합니다.')
    choice(name: 'MANUAL_TARGET_BRANCH', choices: ['develop', 'master'], description: '수동 배포 시 대상 환경을 선택하세요.')
  }
  environment {
    PROD_NET   = 'prod_net'
    DEV_NET    = 'dev_net'
    NGINX_CONT = 'nginx'
    DOMAIN     = 'k13s404.p.ssafy.io'
    IMAGE_PREFIX = 'khs5860'
  }

  stages {
    stage('Determine Build Actions') {
      steps {
        script {
          env.DO_PROD = "false"
          env.DO_DEV = "false"
          env.BACKEND_CHANGED = "false"
          env.FRONTEND_CHANGED = "false"
          env.IMAGE_WORKER_CHANGED = "false"

          if (env.gitlabMergeRequestState == 'merged') {
            echo "Running in automatic mode (MR merged)."
            def targetBranch = env.gitlabTargetBranch
            
            if (targetBranch == 'master') { env.DO_PROD = "true" }
            else if (targetBranch == 'develop') { env.DO_DEV = "true" }
          } else {
            echo "Running in manual mode."
            def targetBranch = params.MANUAL_TARGET_BRANCH

            if (targetBranch == 'master') { env.DO_PROD = "true" }
            else if (targetBranch == 'develop') { env.DO_DEV = "true" }
          }

          List<String> changedFiles = []
          try {
            for (cs in currentBuild.changeSets) {
              for (item in cs.items) {
                for (file in item.affectedFiles) {
                  changedFiles << (file.path as String)
                }
              }
            }
          } catch (ignored) {}

          if (changedFiles.isEmpty()) {
            def from = env.GIT_PREVIOUS_SUCCESSFUL_COMMIT ?: ''
            def to   = env.GIT_COMMIT ?: 'HEAD'
            try {
              def cmd = from ? "git diff --name-only ${from} ${to}" : "git diff --name-only ${to}~1 ${to}"
              def out = sh(script: cmd, returnStdout: true).trim()
              if (out) {
                changedFiles.addAll(out.split("\\r?\\n") as List<String>)
              }
            } catch (ignored) {}
          }

          def touched = { String prefix ->
            changedFiles.any { it.startsWith(prefix + "/") || it == prefix }
          }

          if (env.gitlabMergeRequestState == 'merged') {
            env.BACKEND_CHANGED       = touched('backend').toString()
            env.FRONTEND_CHANGED      = touched('frontend').toString()
            env.IMAGE_WORKER_CHANGED  = touched('image').toString()
          } else {
            env.BACKEND_CHANGED       = (params.BUILD_BACKEND  ? true : touched('backend')).toString()
            env.FRONTEND_CHANGED      = (params.BUILD_FRONTEND ? true : touched('frontend')).toString()
            env.IMAGE_WORKER_CHANGED  = (params.BUILD_IMAGE_WORKER ? true : touched('image')).toString()
          }

          env.DEPLOYED_BACKEND   = "false"
          env.DEPLOYED_FRONTEND  = "false"
          env.BUILT_WORKER       = "false"
          env.DEPLOY_ENV         = ((env.DO_PROD ?: "false").toBoolean() ? "PROD" : ((env.DO_DEV ?: "false").toBoolean() ? "DEV" : ""))
              
          echo "Build decisions: DO_PROD=${env.DO_PROD}, DO_DEV=${env.DO_DEV}, BACKEND=${env.BACKEND_CHANGED}, FRONTEND=${env.FRONTEND_CHANGED}, IMAGE_WORKER=${env.IMAGE_WORKER_CHANGED}"
        }
      }
    }

    stage('Build & Deploy Services') {
      parallel {
        /*************** PROD: Backend Blue/Green ***************/
        stage('Deploy Backend (prod)') {
          when {
            allOf {
              expression { (env.DO_PROD ?: "false").toBoolean() }
              expression { (env.BACKEND_CHANGED ?: "false").toBoolean() }
            }
          }
          environment { PROD_TAG = "${IMAGE_PREFIX}/impresser-backend:${env.BUILD_NUMBER}" }
          stages {
            stage('Build') {
              steps { sh "docker build -t ${PROD_TAG} -f backend/Dockerfile backend" }
            }
            stage('Run Target Slot') {
              steps {
                withCredentials([file(credentialsId: 'prod-env-file-backend', variable: 'PROD_ENV_FILE_PATH')]) {
                script {
                  def CUR = sh(
                    script: "docker exec ${NGINX_CONT} /bin/sh -lc 'readlink -f /etc/nginx/conf.d/upstream.backend.prod.conf' 2>/dev/null || true",
                    returnStdout: true
                  ).trim()

                  def TARGET_CONT = CUR.contains('blue') ? 'backend-prod-green' : 'backend-prod-blue'
                  def OLD_CONT    = CUR.contains('blue') ? 'backend-prod-blue'  : 'backend-prod-green'
                  env.TARGET_CONT = TARGET_CONT
                  writeFile file: "${env.WORKSPACE}/prod.slot", text: "OLD_CONT=${OLD_CONT}\n"
                }

                sh """
                  set -euo pipefail
                  for i in \$(seq 1 60); do
                    if [ "\$(docker inspect -f '{{.State.Health.Status}}' mysql-prod 2>/dev/null)" = "healthy" ] && \
                        [ "\$(docker inspect -f '{{.State.Health.Status}}' redis-prod 2>/dev/null)" = "healthy" ]; then break; fi
                    sleep 2
                  done
                  
                  docker rm -f ${env.TARGET_CONT} || true
                  docker run -d --name ${env.TARGET_CONT} --network ${PROD_NET} --env-file ${PROD_ENV_FILE_PATH} ${PROD_TAG}

                  RAW=\$(grep -E '^SERVER_CONTEXT_PATH=' "${PROD_ENV_FILE_PATH}" | tail -n1 | cut -d'=' -f2- | tr -d '\\r')
                  RAW=\$(echo "\$RAW" | tr -d '[:space:]')
                  if [ -z "\$RAW" ] || [ "\$RAW" = "/" ]; then
                    HEALTH_URL="http://127.0.0.1:8080/actuator/health"
                  else
                    STRIP=\$(echo "\$RAW" | sed 's#^/*##; s#/*\$##')
                    HEALTH_URL="http://127.0.0.1:8080/\${STRIP}/actuator/health"
                  fi
                  echo "[prod] health: \$HEALTH_URL"

                  for i in \$(seq 1 60); do
                    if docker exec ${env.TARGET_CONT} sh -lc "wget -qO- \\"\$HEALTH_URL\\"" 2>/dev/null | grep -q '"status":"UP"'; then exit 0; fi
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
                    sh "NGINX_CONT=${NGINX_CONT} bash infra/scripts/switch_backend.sh"
                    withCredentials([file(credentialsId: 'prod-env-file-backend', variable: 'PROD_ENV_FILE_PATH')]) {
                      sh """
                        set -euo pipefail
                        RAW=\$(grep -E '^SERVER_CONTEXT_PATH=' "${PROD_ENV_FILE_PATH}" | tail -n1 | cut -d'=' -f2- | tr -d '\\r')
                        RAW=\$(echo "\$RAW" | tr -d '[:space:]')
                        if [ -z "\$RAW" ] || [ "\$RAW" = "/" ]; then
                          EXT="/actuator/health"
                        else
                          STRIP=\$(echo "\$RAW" | sed 's#^/*##; s#/*\$##')
                          EXT="/\${STRIP}/actuator/health"
                        fi
                        curl -fsS "https://${DOMAIN}\${EXT}" | grep UP
                      """
                    }
                    env.DEPLOYED_BACKEND = "true"
                    env.DEPLOY_ENV = "PROD"
                    sh ". ${env.WORKSPACE}/prod.slot && docker rm -f \"${OLD_CONT}\" || true"
                  } catch (e) {
                    sh "NGINX_CONT=${NGINX_CONT} bash infra/scripts/switch_backend.sh"
                    error "Prod smoke test failed. Rolled back successfully."
                  }
                }
              }
            }
          }
        }

        /*************** DEV: Backend 단일 교체 ***************/
        stage('Deploy Backend (dev)') {
          when {
            allOf {
              expression { (env.DO_DEV ?: "false").toBoolean() }
              expression { (env.BACKEND_CHANGED ?: "false").toBoolean() }
            }
          }
          environment { DEV_TAG = "${IMAGE_PREFIX}/impresser-backend-dev:${env.BUILD_NUMBER}" }
          steps {
            withCredentials([file(credentialsId: 'dev-env-file-backend', variable: 'DEV_ENV_FILE_PATH')]) {
              sh "docker build -t ${DEV_TAG} -f backend/Dockerfile backend"
              sh """
                set -euo pipefail
                for i in \$(seq 1 60); do
                  if [ "\$(docker inspect -f '{{.State.Health.Status}}' mysql-dev 2>/dev/null)" = "healthy" ] && \
                     [ "\$(docker inspect -f '{{.State.Health.Status}}' redis-dev 2>/dev/null)" = "healthy" ]; then break; fi
                  sleep 2
                done

                docker rm -f backend-dev || true
                docker run -d --name backend-dev --network ${DEV_NET} --env-file ${DEV_ENV_FILE_PATH} ${DEV_TAG}

                RAW=\$(grep -E '^SERVER_CONTEXT_PATH=' "${DEV_ENV_FILE_PATH}" | tail -n1 | cut -d'=' -f2- | tr -d '\\r')
                RAW=\$(echo "\$RAW" | tr -d '[:space:]')
                if [ -z "\$RAW" ] || [ "\$RAW" = "/" ]; then
                  HEALTH_URL="http://127.0.0.1:8080/actuator/health"
                else
                  STRIP=\$(echo "\$RAW" | sed 's#^/*##; s#/*\$##')
                  HEALTH_URL="http://127.0.0.1:8080/\${STRIP}/actuator/health"
                fi

                for i in \$(seq 1 30); do
                  if docker exec backend-dev sh -lc "wget -qO- \\"\$HEALTH_URL\\"" 2>/dev/null | grep -q '"status":"UP"'; then exit 0; fi
                  sleep 1
                done; exit 1
              """
            }
            script { env.DEPLOYED_BACKEND = "true"; env.DEPLOY_ENV = "DEV" }
          }
        }

        /*************** FRONTEND ***************/
        stage('Deploy Frontend') {
          when {
              expression { (env.FRONTEND_CHANGED ?: "false").toBoolean() }
          }
          stages {
            stage('PROD') {
              when { expression { (env.DO_PROD ?: "false").toBoolean() } }
              environment { PROD_TAG = "${IMAGE_PREFIX}/impresser-frontend:${env.BUILD_NUMBER}" }
              steps {
                withCredentials([file(credentialsId: 'prod-env-file-frontend', variable: 'PROD_ENV_FILE_PATH')]) {
                  sh '''
                    set -a
                    . ${PROD_ENV_FILE_PATH}
                    set +a

                    docker build \
                      --build-arg BASE_PATH="${BASE_PATH}" \
                      --build-arg NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL}" \
                      -t ${PROD_TAG} -f frontend/Dockerfile frontend
                  '''
                  sh "docker rm -f frontend-prod || true"
                  sh "docker run -d --name frontend-prod --network ${PROD_NET} --env-file ${PROD_ENV_FILE_PATH} ${PROD_TAG}"
                }
                script { env.DEPLOYED_FRONTEND = "true"; env.DEPLOY_ENV = "PROD" }
              }
            }
            stage('DEV') {
              when { expression { (env.DO_DEV ?: "false").toBoolean() } }
              environment { DEV_TAG = "${IMAGE_PREFIX}/impresser-frontend-dev:${env.BUILD_NUMBER}" }
              steps {
                withCredentials([file(credentialsId: 'dev-env-file-frontend', variable: 'DEV_ENV_FILE_PATH')]) {
                  sh '''
                    set -a
                    . ${DEV_ENV_FILE_PATH}
                    set +a
                    
                    docker build \
                      --build-arg BASE_PATH="${BASE_PATH}" \
                      --build-arg NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL}" \
                      -t ${DEV_TAG} -f frontend/Dockerfile frontend
                  '''
                  sh "docker rm -f frontend-dev || true"
                  sh "docker run -d --name frontend-dev --network ${DEV_NET} --env-file ${DEV_ENV_FILE_PATH} ${DEV_TAG}"
                }
                script { env.DEPLOYED_FRONTEND = "true"; env.DEPLOY_ENV = "DEV" }
              }
            }
          }
        }

        /*************** C++ GPU WORKER (For RunPod) ***************/
        stage('Build & Push GPU Worker') {
          when {
            expression { (env.IMAGE_WORKER_CHANGED ?: "false").toBoolean() }
          }
          steps {
            dir('image') {
              withCredentials([string(credentialsId: 'nvtiff-url', variable: 'NVTIFF_URL')]) {
                sh '''
                  set -euo pipefail
                  echo "[image-worker] Downloading nvTIFF .deb from presigned URL..."

                  curl -fL --retry 5 --retry-delay 2 \
                    -o nvtiff-local-repo-ubuntu2404-0.6.0_0.6.0-1_amd64.deb \
                    "$NVTIFF_URL"

                  ls -lh nvtiff-local-repo-ubuntu2404-0.6.0_0.6.0-1_amd64.deb
                '''
              }
            }

            withCredentials([
              usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')
            ]) {
              script {
                def imageName = "${IMAGE_PREFIX}/impresser-image-worker:${env.BUILD_NUMBER}"
                sh "docker build -t ${imageName} -f image/Dockerfile image"
                sh "echo ${DOCKER_PASSWORD} | docker login -u ${DOCKER_USERNAME} --password-stdin"
                sh "docker push ${imageName}"
                sh "docker logout"
              }
              script { env.BUILT_WORKER = "true" }
            }

            dir('image') {
              sh 'rm -f nvtiff-local-repo-ubuntu2404-0.6.0_0.6.0-1_amd64.deb || true'
            }
          }
        }
      }
    }
  
    /*************** Docker Image 정리 ***************/
    stage('Cleanup Docker') {
      steps {
        sh 'docker image prune -af --filter "until=24h" || true'
      }
    }
  }

  /*************** 배포 결과 MM 알림 ***************/
  post {
    success {
      script {
        def branch    = resolveBranch()
        def mention   = resolvePusherMention()
        def commitMsg = sh(script: "git log -1 --pretty=%s", returnStdout: true).trim()
        def commitUrl = (env.GIT_URL && env.GIT_COMMIT) ? "${env.GIT_URL.replaceFirst(/\\.git$/, '')}/commit/${env.GIT_COMMIT}" : (env.GIT_COMMIT_URL ?: "")
        def envName   = env.DEPLOY_ENV ?: "N/A"

        def lines = []
        lines << "- **Environment**: `${envName}`"
        lines << "- **Backend Deployed**: `${env.DEPLOYED_BACKEND ?: "false"}`"
        lines << "- **Frontend Deployed**: `${env.DEPLOYED_FRONTEND ?: "false"}`"
        lines << "- **GPU Worker Built/Push**: `${env.BUILT_WORKER ?: "false"}`"

        sendMMNotify(true, [
          branch   : branch,
          mention  : mention,
          buildUrl : env.BUILD_URL,
          commit   : [msg: commitMsg, url: commitUrl],
          details  : lines.join("\n")
        ])
      }
    }
    failure {
      script {
        def branch    = resolveBranch()
        def mention   = resolvePusherMention()
        def commitMsg = sh(script: "git log -1 --pretty=%s", returnStdout: true).trim()
        def commitUrl = (env.GIT_URL && env.GIT_COMMIT) ? "${env.GIT_URL.replaceFirst(/\\.git$/, '')}/commit/${env.GIT_COMMIT}" : (env.GIT_COMMIT_URL ?: "")

        def tail = ""
        try {
          tail = currentBuild.rawBuild.getLog(150).join("\n")
        } catch (ignore) {
          tail = ""
        }
        tail = tail
          .replaceAll(/(?i)(token|secret|password|passwd|apikey|api_key)\s*[:=]\s*\S+/, '$1=[REDACTED]')
          .replaceAll(/AKIA[0-9A-Z]{16}/, 'AKIA[REDACTED]')
        def detailsBlock = tail ? "```text\n${tail}\n```" : ""

        sendMMNotify(false, [
          branch   : branch,
          mention  : mention,
          buildUrl : env.BUILD_URL,
          commit   : [msg: commitMsg, url: commitUrl],
          details  : detailsBlock
        ])
      }
    }
  }
}

def resolveBranch() {
  if (env.BRANCH_NAME) return env.BRANCH_NAME
  if (env.GIT_REF) return env.GIT_REF.replaceFirst(/^refs\/heads\//,'')
  return sh(script: "git name-rev --name-only HEAD || git rev-parse --abbrev-ref HEAD", returnStdout: true).trim()
}

def resolvePusherMention() {
  def u = env.GIT_PUSHER_USERNAME?.trim()
  if (u) return "@${u}"
  return sh(script: "git --no-pager show -s --format='%an <%ae>' HEAD", returnStdout: true).trim()
}

def sendMMNotify(boolean success, Map info) {
  def titleLine = success ? "## :jenkins7: Jenkins Build Success"
                          : "## :angry_jenkins: Jenkins Build Failed"
  def lines = []
  if (info.mention) lines << "**Author**: ${info.mention}"
  if (info.branch)  lines << "**Target Branch**: `${info.branch}`"
  if (info.commit?.msg) {
    def commitLine = info.commit?.url ? "[${info.commit.msg}](${info.commit.url})" : info.commit.msg
    lines << "**Commit**: ${commitLine}"
  }
  if (!success && info.details) lines << "**Error Message**:\n${info.details}"
  if (success && info.details)  lines << info.details

  def text = "${titleLine}\n" + (lines ? ("\n" + lines.join("\n")) : "")
  writeFile file: 'payload.json', text: groovy.json.JsonOutput.toJson([
    text      : text,
    username  : "Jenkins",
    icon_emoji: ":jenkins7:"
  ])
  withCredentials([string(credentialsId: 'mattermost-webhook', variable: 'MM_WEBHOOK')]) {
    sh(script: '''
      curl -sS -f -X POST -H 'Content-Type: application/json' \
        --data-binary @payload.json \
        "$MM_WEBHOOK"
    ''')
  }
}
