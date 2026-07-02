pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        DOCKERHUB_USER = 'ayouben03'
        IMAGE_NAME     = 'tasklist-frontend'
        IMAGE_TAG      = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Unit Tests') {
            steps {
                sh '''
                    npx vitest run --coverage \
                        --outputFile.junit=reports/junit.xml
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withCredentials([string(credentialsId: 'gb-sonarqube-token', variable: 'SONAR_TOKEN')]) {
                    sh '''
                        docker run --rm \
                            --volumes-from "$(hostname)" \
                            -w "$WORKSPACE" \
                            -e SONAR_HOST_URL=https://sonarqube.cicd.kits.ext.educentre.fr \
                            -e SONAR_TOKEN=$SONAR_TOKEN \
                            sonarsource/sonar-scanner-cli
                    '''
                }
            }
        }

        stage('Build Application') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Docker Build') {
            steps {
                sh '''
                    docker build \
                        -t $DOCKERHUB_USER/$IMAGE_NAME:$IMAGE_TAG \
                        -t $DOCKERHUB_USER/$IMAGE_NAME:latest \
                        .
                '''
            }
        }

        stage('Trivy Scan') {
            steps {
                sh '''
                    trivy image --exit-code 0 --severity HIGH,CRITICAL \
                        --format table \
                        $DOCKERHUB_USER/$IMAGE_NAME:$IMAGE_TAG | tee trivy-report.txt
                '''
            }
        }

        stage('SBOM SPDX') {
            steps {
                sh '''
                    docker run --rm \
                        --volumes-from "$(hostname)" \
                        -w "$WORKSPACE" \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        anchore/syft:latest \
                        docker:$DOCKERHUB_USER/$IMAGE_NAME:$IMAGE_TAG \
                        -o spdx-json=sbom-spdx.json
                '''
            }
        }

        stage('Docker Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKERHUB_LOGIN_USER',
                    passwordVariable: 'DOCKERHUB_LOGIN_PASS'
                )]) {
                    sh '''
                        echo "$DOCKERHUB_LOGIN_PASS" | docker login -u "$DOCKERHUB_LOGIN_USER" --password-stdin
                        docker push $DOCKERHUB_USER/$IMAGE_NAME:$IMAGE_TAG
                        docker push $DOCKERHUB_USER/$IMAGE_NAME:latest
                        docker logout
                    '''
                }
            }
        }
    }

    post {
        always {
            junit testResults: 'reports/junit.xml', allowEmptyResults: true
            archiveArtifacts artifacts: 'trivy-report.txt,sbom-spdx.json,coverage/**,reports/**', allowEmptyArchive: true
            sh 'docker rmi $DOCKERHUB_USER/$IMAGE_NAME:$IMAGE_TAG $DOCKERHUB_USER/$IMAGE_NAME:latest || true'
        }
    }
}
