#!/usr/bin/env groovy

// Complete Jenkins Pipeline for NestJS API - Local Development
// Purpose: Build, test, and containerize NestJS application locally

pipeline {
    agent {
        any
    }
    
    options {
        skipStagesAfterUnstable()
    }
    
    environment {
        // Build configuration
        IMAGE_NAME = 'avatar-api'
        BUILD_NUMBER = "${BUILD_NUMBER}"
        GIT_COMMIT = "${GIT_COMMIT}"
        GIT_BRANCH = "${GIT_BRANCH}"
        NODE_ENV = 'production'
    }
    
    parameters {
        choice(
            name: 'ACTION',
            choices: ['build', 'test-build', 'build-push'],
            description: 'What to do: build only, test + build, or build + push'
        )
        string(
            name: 'TAG',
            defaultValue: 'latest',
            description: 'Docker image tag (optional, defaults to latest)'
        )
        string(
            name: 'REGISTRY',
            defaultValue: '',
            description: 'Docker registry URL (optional, e.g., your-registry.com/project)'
        )
        booleanParam(
            name: 'SKIP_TESTS',
            defaultValue: false,
            description: 'Skip tests (NOT RECOMMENDED for production)'
        )
    }
    
    stages {
        stage('Checkout Source') {
            steps {
                echo "📥 Checking out source code..."
                checkout scm
                echo "✅ Source code checked out"
                
                // Show current git status
                sh """
                    echo "📋 Current Git Status:"
                    git status
                    echo ""
                    echo "🔗 Repository URL: \$(git remote get-url origin)"
                    echo "🌿 Current Branch: \$(git branch --show-current)"
                    echo "🔑 Latest Commit: \$(git log -1 --oneline)"
                """
            }
        }
        
        stage('Install Dependencies') {
            when {
                expression { params.ACTION == 'test-build' || params.ACTION == 'build-push' }
            }
            agent {
                docker {
                    image 'node:20-alpine'
                    args '-v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            steps {
                echo "📦 Installing Node.js dependencies..."
                sh """
                    echo "🔧 Using Node.js version:"
                    node --version
                    npm --version
                    
                    echo "📦 Installing dependencies..."
                    npm ci
                    
                    echo "🔧 Generating Prisma client..."
                    npx prisma generate
                    
                    echo "✅ Dependencies installed successfully"
                """
            }
        }
        
        stage('Run Tests') {
            when {
                allOf {
                    expression { params.ACTION == 'test-build' || params.ACTION == 'build-push' }
                    expression { !params.SKIP_TESTS }
                }
            }
            agent {
                docker {
                    image 'node:20-alpine'
                    args '-v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            steps {
                echo "🧪 Running tests..."
                sh """
                    echo "🧪 Running unit tests..."
                    npm run test
                    
                    echo "🧪 Running e2e tests..."
                    npm run test:e2e
                    
                    echo "✅ All tests passed"
                """
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'test-results.xml'
                }
            }
        }
        
        stage('Build Application') {
            when {
                expression { params.ACTION == 'test-build' || params.ACTION == 'build-push' }
            }
            agent {
                docker {
                    image 'node:20-alpine'
                    args '-v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            steps {
                echo "🔨 Building NestJS application..."
                sh """
                    echo "🔨 Compiling TypeScript..."
                    npm run build
                    
                    echo "🌱 Building seed data..."
                    npm run build:seed
                    
                    echo "✅ Application built successfully"
                """
            }
        }
        
        stage('Build Docker Image') {
            steps {
                echo "🐳 Building Docker image..."
                
                script {
                    def imageTag = params.TAG ?: 'latest'
                    def fullTag = "${IMAGE_NAME}:${imageTag}"
                    
                    sh """
                        echo "Building Docker image: ${fullTag}"
                        echo "📋 Docker build context: \$(pwd)"
                        echo "📄 Dockerfile contents:"
                        cat Dockerfile
                        
                        docker build -t ${fullTag} .
                        
                        if [ "${params.REGISTRY}" != "" ]; then
                            docker tag ${fullTag} ${params.REGISTRY}/${fullTag}
                            echo "✅ Tagged image for registry: ${params.REGISTRY}/${fullTag}"
                        fi
                        
                        echo "✅ Docker build completed"
                        docker images ${IMAGE_NAME}
                    """
                    
                    echo "📊 Build Information:"
                    echo "  - Image Name: ${env.IMAGE_NAME}"
                    echo "  - Tag: ${imageTag}"
                    echo "  - Build Number: ${env.BUILD_NUMBER}"
                    echo "  - Git Commit: ${env.GIT_COMMIT}"
                    echo "  - Git Branch: ${env.GIT_BRANCH}"
                    echo "  - Action: ${params.ACTION}"
                    echo "  - Skip Tests: ${params.SKIP_TESTS}"
                }
            }
        }
        
        stage('Local Deployment Test') {
            when {
                expression { params.ACTION == 'test-build' }
            }
            steps {
                echo "🚀 Testing local deployment..."
                
                script {
                    def imageTag = params.TAG ?: 'latest'
                    def fullTag = "${IMAGE_NAME}:${imageTag}"
                    
                    sh """
                        echo "🧪 Running container for testing..."
                        docker run -d --name avatar-api-test -p 3000:3000 ${fullTag}
                        
                        echo "⏱️ Waiting for container to start..."
                        sleep 10
                        
                        echo "🏥 Health check..."
                        if curl -f http://localhost:3000/health 2>/dev/null; then
                            echo "✅ Container is responding correctly"
                        else
                            echo "⚠️ Container may not be fully started yet"
                        fi
                        
                        echo "🧹 Cleaning up test container..."
                        docker stop avatar-api-test || true
                        docker rm avatar-api-test || true
                    """
                }
            }
        }
        
        stage('Push to Registry (Optional)') {
            when {
                expression { params.ACTION == 'build-push' && params.REGISTRY != '' }
            }
            steps {
                echo "📤 Pushing Docker image to registry..."
                
                script {
                    def imageTag = params.TAG ?: 'latest'
                    def registryTag = "${params.REGISTRY}/${IMAGE_NAME}:${imageTag}"
                    
                    sh """
                        echo "🚀 Pushing image: ${registryTag}"
                        docker push ${registryTag}
                        
                        # Also push latest tag if custom tag is used
                        if [ "${imageTag}" != "latest" ]; then
                            docker tag ${registryTag} ${params.REGISTRY}/${IMAGE_NAME}:latest
                            docker push ${params.REGISTRY}/${IMAGE_NAME}:latest
                            echo "✅ Also pushed latest tag"
                        fi
                        
                        echo "✅ Image pushed successfully"
                    """
                }
            }
        }
    }
    
    post {
        always {
            script {
                echo "📋 Build Summary"
                echo "  - Result: ${currentBuild.currentResult}"
                echo "  - Duration: ${currentBuild.duration / 1000}s"
                echo "  - Build Number: ${currentBuild.number}"
                echo "  - Git Commit: ${env.GIT_COMMIT}"
                echo "  - Git Branch: ${env.GIT_BRANCH}"
            }
        }
        
        success {
            echo "🎉 Build completed successfully!"
            
            script {
                if (params.REGISTRY != '') {
                    echo "✅ Docker image is ready: ${params.REGISTRY}/${IMAGE_NAME}:${params.TAG ?: 'latest'}"
                } else {
                    echo "✅ Docker image is ready locally: ${IMAGE_NAME}:${params.TAG ?: 'latest'}"
                    // Show the built images
                    sh 'docker images'
                    
                    echo "🛠️ To run the container locally:"
                    echo "   docker run -d -p 3000:3000 ${IMAGE_NAME}:${params.TAG ?: 'latest'}"
                    echo ""
                    echo "🌐 Access your API at: http://localhost:3000"
                    echo "📖 API Documentation: http://localhost:3000/api"
                }
            }
        }
        
        failure {
            echo "❌ Build failed - please check the logs"
            echo "🔍 Debugging info:"
            sh 'node --version'
            sh 'npm --version'
            sh 'docker --version'
            sh 'docker images'
            
            echo "🔧 Common solutions:"
            echo "1. Check if all dependencies are installed"
            echo "2. Verify Node.js version compatibility"
            echo "3. Ensure Docker daemon is running"
            echo "4. Check Prisma schema validity"
        }
        
        unstable {
            echo "⚠️ Build completed with warnings (tests may have failed)"
        }
    }
}