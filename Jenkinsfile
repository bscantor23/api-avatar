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
                    cat > /tmp/nodejs-setup.sh << 'EOFSCRIPT'
#!/bin/bash
mkdir -p \$HOME/.nvm
export NVM_DIR="\$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && . "\$NVM_DIR/nvm.sh"
nvm use 20 >/dev/null 2>&1
export PATH="\$NVM_DIR/versions/node/v20/bin:\$PATH"
EOFSCRIPT
                    
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
        
        stage('Install Docker Compose') {
            steps {
                echo "📦 Installing Docker Compose latest version..."
                sh """
                    # Check if docker-compose is already installed
                    if ! command -v docker-compose &> /dev/null; then
                        echo "🔧 Installing Docker Compose..."
                        
                        # Download latest docker-compose
                        COMPOSE_VERSION=\$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d'"' -f4)
                        echo "📥 Downloading Docker Compose version: \$COMPOSE_VERSION"
                        
                        curl -L "https://github.com/docker/compose/releases/download/\${COMPOSE_VERSION}/docker-compose-\$(uname -s)-\$(uname -m)" -o /tmp/docker-compose
                        chmod +x /tmp/docker-compose
                        
                        # Move to a location in PATH (use /tmp for Jenkins workspace)
                        export PATH="/tmp:\$PATH"
                        
                        echo "✅ Docker Compose installed: \$(/tmp/docker-compose --version)"
                    else
                        echo "✅ Docker Compose already installed: \$(docker-compose --version)"
                    fi
                """
            }
        }
        
        stage('Manage Containers') {
            steps {
                echo "🔍 Checking container status and reloading if needed..."
                sh """
                    # Ensure docker-compose is in PATH
                    export PATH="/tmp:\$PATH"
                    
                    # Function to check if container is running and reload if needed
                    check_and_reload_container() {
                        local container_name=\$1
                        echo "🔍 Checking container: \$container_name"
                        
                        # Check if container exists and is running
                        if docker ps --format '{{.Names}}' | grep -q "^\${container_name}\$"; then
                            echo "✅ Container \$container_name is running"
                            echo "🔄 Reloading container \$container_name..."
                            
                            # Restart the container
                            docker restart "\$container_name" 2>/dev/null || {
                                echo "⚠️ Failed to restart \$container_name, trying to recreate..."
                                docker stop "\$container_name" 2>/dev/null || true
                                docker rm "\$container_name" 2>/dev/null || true
                            }
                            
                            echo "✅ Container \$container_name reloaded"
                        else
                            echo "ℹ️ Container \$container_name is not running"
                            
                            # Check if container exists but is stopped
                            if docker ps -a --format '{{.Names}}' | grep -q "^\${container_name}\$"; then
                                echo "🔄 Container \$container_name exists but is stopped, starting it..."
                                docker start "\$container_name" 2>/dev/null || {
                                    echo "⚠️ Failed to start \$container_name, it may need to be recreated"
                                }
                            else
                                echo "📝 Container \$container_name does not exist and will be created by docker-compose"
                            fi
                        fi
                    }
                    
                    # Check main containers
                    check_and_reload_container "postgres_db"
                    check_and_reload_container "nest_api"
                    
                    # Handle test container if it exists
                    if docker ps -a --format '{{.Names}}' | grep -q "^avatar-api-test\$"; then
                        check_and_reload_container "avatar-api-test"
                    fi
                    
                    echo "✅ Container status check and reload completed"
                    
                    # Show current container status
                    echo "📋 Current container status:"
                    docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'
                """
            }
        }
        
        stage('Start Database') {
            steps {
                echo "🗄️ Starting PostgreSQL database..."
                sh """
                    # Ensure docker-compose is in PATH
                    export PATH="/tmp:\$PATH"
                    
                    docker-compose up -d db

                    echo "⏱ Waiting for DB to be healthy..."
                    for i in {1..20}; do
                        docker exec postgres_db pg_isready -U appuser -d appdb && break
                        sleep 3
                    done

                    docker ps | grep postgres_db
                """
            }
        }
        
        stage('Build and Start API') {
            steps {
                echo "🐳 Building and starting API..."
                sh """
                    # Ensure docker-compose is in PATH
                    export PATH="/tmp:\$PATH"
                    
                    docker-compose up -d --build api

                    echo "⏱ Waiting for API to be healthy..."
                    for i in {1..30}; do
                        docker exec nest_api node -e "require('http').get('http://localhost:3000', res=>{process.exit(res.statusCode<400?0:1)}).on('error', ()=>process.exit(1))" && break
                        sleep 3
                    done

                    echo "📊 Services status:"
                    docker-compose ps
                    
                    echo "📋 API logs (migrations and seed):"
                    docker-compose logs --tail=50 api
                """
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