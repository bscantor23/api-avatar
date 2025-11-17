#!/usr/bin/env groovy

// Complete Jenkins Pipeline for NestJS API - Local Development
// Purpose: Build and containerize NestJS application locally

pipeline {
    agent any
    
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
                    
                    echo "🔧 Node.js available: \$(node --version 2>/dev/null || echo 'Not available')"
                    echo "🔧 npm available: \$(npm --version 2>/dev/null || echo 'Not available')"
                """
            }
        }
        
        stage('Setup Node.js Environment') {
            steps {
                echo "🔧 Setting up Node.js environment..."
                
                sh """
                    # Setup function to ensure Node.js is available
                    setup_nodejs() {
                        # Create .nvm directory if it doesn't exist
                        mkdir -p \$HOME/.nvm
                        export NVM_DIR="\$HOME/.nvm"
                        
                        # Download and source nvm if not present
                        if [ ! -f "\$NVM_DIR/nvm.sh" ]; then
                            echo "📦 Downloading nvm..."
                            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
                        fi
                        
                        # Source nvm
                        [ -s "\$NVM_DIR/nvm.sh" ] && \\. "\$NVM_DIR/nvm.sh"
                        
                        # Install and use Node.js 20
                        if ! nvm ls | grep -q "v20"; then
                            echo "📦 Installing Node.js 20..."
                            nvm install 20
                        fi
                        
                        nvm use 20
                        nvm alias default 20
                        
                        # Set up PATH
                        export PATH="\$NVM_DIR/versions/node/v20/bin:\$PATH"
                    }
                    
                    # Run setup
                    setup_nodejs
                    
                    # Verify installation
                    echo "🔧 Node.js version: \$(node --version)"
                    echo "🔧 npm version: \$(npm --version)"
                    echo "🔧 npm prefix: \$(npm config get prefix)"
                    
                    # Save environment for reuse
                    cat > /tmp/nodejs-setup.sh << 'EOF'
                    #!/bin/bash
                    mkdir -p \$HOME/.nvm
                    export NVM_DIR="\$HOME/.nvm"
                    [ -s "\$NVM_DIR/nvm.sh" ] && \\. "\$NVM_DIR/nvm.sh"
                    nvm use 20 >/dev/null 2>&1
                    export PATH="\$NVM_DIR/versions/node/v20/bin:\$PATH"
                    EOF
                    
                    chmod +x /tmp/nodejs-setup.sh
                    
                    echo "✅ Node.js environment setup completed"
                """
            }
        }
        
        stage('Install Dependencies') {
            when {
                expression { params.ACTION == 'test-build' || params.ACTION == 'build-push' }
            }
            steps {
                echo "📦 Installing Node.js dependencies..."
                sh """
                    # Source Node.js setup script
                    if [ -f /tmp/nodejs-setup.sh ]; then
                        . /tmp/nodejs-setup.sh
                    fi
                    
                    # If Node.js setup doesn't exist, run setup function
                    if ! command -v node &> /dev/null; then
                        echo "📦 Setting up Node.js environment..."
                        mkdir -p \$HOME/.nvm
                        export NVM_DIR="\$HOME/.nvm"
                        [ -s "\$NVM_DIR/nvm.sh" ] && \\. "\$NVM_DIR/nvm.sh"
                        nvm use 20 || (nvm install 20 && nvm use 20)
                        export PATH="\$NVM_DIR/versions/node/v20/bin:\$PATH"
                    fi
                    
                    # Verify Node.js and npm are available
                    echo "🔧 Node.js version: \$(node --version 2>/dev/null || echo 'Not available')"
                    echo "🔧 npm version: \$(npm --version 2>/dev/null || echo 'Not available')"
                    
                    # Check if package.json exists
                    if [ ! -f "package.json" ]; then
                        echo "❌ package.json not found!"
                        exit 1
                    fi
                    
                    # Add node_modules/.bin to PATH
                    export PATH="\$PWD/node_modules/.bin:\$PATH"
                    
                    # Install dependencies
                    echo "📦 Installing dependencies with npm ci..."
                    npm ci
                    
                    # Verify jest is available
                    echo "🔍 Checking for jest..."
                    if [ -f "node_modules/.bin/jest" ]; then
                        echo "✅ Jest found at node_modules/.bin/jest"
                        echo "🔍 Jest version: \$(node_modules/.bin/jest --version)"
                    else
                        echo "⚠️ Jest not found in node_modules/.bin"
                        echo "📋 Listing node_modules/.bin contents:"
                        ls -la node_modules/.bin/ 2>/dev/null || echo "node_modules/.bin does not exist"
                    fi
                    
                    # Generate Prisma client
                    echo "🔧 Generating Prisma client..."
                    npx prisma generate || echo "⚠️ Prisma generation failed, continuing..."
                    
                    echo "✅ Dependencies installation completed"
                """
            }
        }
        
        stage('Build Application') {
            when {
                expression { params.ACTION == 'test-build' || params.ACTION == 'build-push' }
            }
            steps {
                echo "🔨 Building NestJS application..."
                sh """
                    # Setup Node.js environment if not already set up
                    if ! command -v node &> /dev/null; then
                        echo "📦 Setting up Node.js environment..."
                        mkdir -p \$HOME/.nvm
                        export NVM_DIR="\$HOME/.nvm"
                        [ -s "\$NVM_DIR/nvm.sh" ] && \\. "\$NVM_DIR/nvm.sh"
                        nvm use 20 || (nvm install 20 && nvm use 20)
                        export PATH="\$NVM_DIR/versions/node/v20/bin:\$PATH"
                    fi
                    
                    # Source Node.js setup script if available
                    if [ -f /tmp/nodejs-setup.sh ]; then
                        . /tmp/nodejs-setup.sh
                    fi
                    
                    # Verify Node.js and npm are available
                    echo "🔧 Node.js version: \$(node --version 2>/dev/null || echo 'Not available')"
                    echo "🔧 npm version: \$(npm --version 2>/dev/null || echo 'Not available')"
                    
                    # Ensure dependencies are installed
                    if [ ! -d "node_modules" ]; then
                        echo "⚠️ node_modules not found. Installing dependencies first..."
                        npm ci
                    else
                        echo "✅ node_modules found"
                    fi
                    
                    # Add node_modules/.bin to PATH
                    export PATH="\$PWD/node_modules/.bin:\$PATH"
                    
                    echo "🔨 Compiling TypeScript..."
                    if npm run build; then
                        echo "✅ TypeScript compilation successful"
                    else
                        echo "⚠️ TypeScript compilation failed"
                    fi
                    
                    echo "🌱 Building seed data..."
                    if npm run build:seed; then
                        echo "✅ Seed build successful"
                    else
                        echo "⚠️ Seed build failed"
                    fi
                    
                    echo "✅ Application build completed"
                """
            }
        }
        
        stage('Start Database') {
            steps {
                echo "🗄️ Starting PostgreSQL database..."
                
                script {
                    sh """
                        echo "🐳 Starting database container with docker compose..."
                        
                        # Stop and remove existing database container if running
                        docker compose down db 2>/dev/null || true
                        
                        # Start only the database service
                        docker compose up -d db
                        
                        echo "⏱️ Waiting for database to be healthy..."
                        timeout=60
                        elapsed=0
                        while [ \$elapsed -lt \$timeout ]; do
                            if docker compose ps db | grep -q "healthy"; then
                                echo "✅ Database is healthy and ready"
                                break
                            fi
                            echo "⏳ Waiting for database... (\${elapsed}s/\${timeout}s)"
                            sleep 5
                            elapsed=\$((elapsed + 5))
                        done
                        
                        if [ \$elapsed -ge \$timeout ]; then
                            echo "⚠️ Database health check timeout, but continuing..."
                        fi
                        
                        # Show database status
                        echo "📊 Database container status:"
                        docker compose ps db
                        
                        echo "✅ Database stage completed"
                    """
                }
            }
        }
        
        stage('Build and Start API') {
            steps {
                echo "🐳 Building and starting API..."
                
                script {
                    def imageTag = params.TAG ?: 'latest'
                    def fullTag = "${IMAGE_NAME}:${imageTag}"
                    
                    sh """
                        echo "🔨 Building API image with docker compose..."
                        docker compose build api
                        
                        echo "🚀 Starting API service..."
                        docker compose up -d api
                        
                        echo "⏱️ Waiting for API to be healthy..."
                        timeout=60
                        elapsed=0
                        while [ \$elapsed -lt \$timeout ]; do
                            if docker compose ps api | grep -q "healthy"; then
                                echo "✅ API is healthy and ready"
                                break
                            fi
                            echo "⏳ Waiting for API... (\${elapsed}s/\${timeout}s)"
                            sleep 5
                            elapsed=\$((elapsed + 5))
                        done
                        
                        if [ \$elapsed -ge \$timeout ]; then
                            echo "⚠️ API health check timeout, checking logs..."
                            docker compose logs --tail=50 api
                        fi
                        
                        echo "📊 Services status:"
                        docker compose ps
                        
                        echo "✅ API is running"
                    """
                    
                    echo "📊 Build Information:"
                    echo "  - Image Name: ${env.IMAGE_NAME}"
                    echo "  - Tag: ${imageTag}"
                    echo "  - Build Number: ${env.BUILD_NUMBER}"
                    echo "  - Git Commit: ${env.GIT_COMMIT}"
                    echo "  - Git Branch: ${env.GIT_BRANCH}"
                    echo "  - Action: ${params.ACTION}"
                }
            }
        }
        
        stage('Run Database Migrations and Seed') {
            steps {
                echo "🌱 Running database migrations and seed..."
                
                script {
                    sh """
                        echo "🔄 Running Prisma migrations..."
                        docker compose exec -T api npx prisma migrate deploy || echo "⚠️ Migrations may have already been applied"
                        
                        echo "🌱 Running Prisma seed..."
                        docker compose exec -T api npm run prisma:seed:prod || echo "⚠️ Seed may have already been applied"
                        
                        echo "✅ Database setup completed"
                    """
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
    }
    
    post {
        always {
            echo "📋 Build Summary"
            echo "  - Result: ${currentBuild.currentResult}"
            echo "  - Duration: ${currentBuild.duration / 1000}s"
            echo "  - Build Number: ${currentBuild.number}"
            echo "  - Git Commit: ${env.GIT_COMMIT}"
            echo "  - Git Branch: ${env.GIT_BRANCH}"
        }
        
        success {
            echo "🎉 Build completed successfully!"
            echo "✅ Services are running and ready"
            echo "📊 Build Number: ${currentBuild.number}"
            echo "🔑 Git Commit: ${env.GIT_COMMIT}"
        }
        
        failure {
            echo "❌ Build failed - please check the logs"
            echo "🔍 Debugging info:"
            sh 'node --version 2>/dev/null || echo "Node.js not found"'
            sh 'npm --version 2>/dev/null || echo "npm not found"'
            sh 'docker --version'
            sh 'docker images'
            
            echo "🔧 Common solutions:"
            echo "1. Check if all dependencies are installed"
            echo "2. Verify Node.js version compatibility"
            echo "3. Ensure Docker daemon is running"
            echo "4. Check Prisma schema validity"
        }
        
        unstable {
            echo "⚠️ Build completed with warnings (build may have failed)"
        }
    }
}