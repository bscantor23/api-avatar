#!/usr/bin/env groovy

// Basic Jenkins Pipeline for NestJS - Build and Test Only
// Purpose: Simple CI pipeline with no deployment

pipeline {
    agent any
    
    environment {
        NODE_ENV = "test"
    }
    
    stages {
        stage('Checkout Source') {
            steps {
                echo "📥 Checking out source code..."
                checkout scm
                echo "✅ Source code checked out"
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo "📦 Installing dependencies..."
                sh '''
                    echo "🔄 Installing npm packages..."
                    npm ci --cache /tmp/npm-cache --prefer-offline
                    echo "✅ Dependencies installed"
                '''
            }
        }
        
        stage('Generate Prisma Client') {
            steps {
                echo "🔄 Generating Prisma client..."
                sh '''
                    echo "🗄️ Generating Prisma client..."
                    npx prisma generate
                    echo "✅ Prisma client generated"
                '''
            }
        }
        
        stage('Run Tests') {
            steps {
                echo "🧪 Running tests..."
                sh '''
                    echo "🧪 Running unit tests..."
                    npm test -- --watchAll=false --coverage
                    
                    echo "🧪 Running e2e tests..."
                    npm run test:e2e -- --watchAll=false
                    
                    echo "✅ All tests completed"
                '''
            }
        }
        
        stage('Build Application') {
            steps {
                echo "🏗️ Building application..."
                sh '''
                    echo "🔨 Building NestJS application..."
                    npm run build
                    
                    echo "🌱 Building seed files..."
                    npm run build:seed
                    
                    echo "✅ Application built successfully"
                '''
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
                echo "  - Git Commit: ${GIT_COMMIT}"
                echo "  - Git Branch: ${GIT_BRANCH}"
            }
        }
        
        success {
            echo "🎉 Build and tests completed successfully!"
            echo "✅ Application is ready for deployment (manual step)"
        }
        
        failure {
            echo "❌ Build failed - please check the logs"
            echo "🔧 Fix the issues and push again to trigger a new build"
        }
        
        unstable {
            echo "⚠️ Build completed with test failures or warnings"
        }
    }
}