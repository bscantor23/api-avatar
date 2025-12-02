#!/usr/bin/env groovy

// Simple Jenkins Pipeline for NestJS API with Webhooks
// Purpose: Build and test NestJS application triggered by GitHub webhooks

pipeline {
    agent any
    
    options {
        skipStagesAfterUnstable()
        timeout(time: 10, unit: 'MINUTES')
    }
    
    environment {
        NODE_VERSION = '20'
        NODE_ENV = 'test'
    }
    
    triggers {
        // GitHub webhook trigger
        githubPush()
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo "📥 Checking out source code..."
                checkout scm
                
                sh """
                    echo "🔗 Repository: \$(git remote get-url origin)"
                    echo "🌿 Branch: \$(git branch --show-current)"
                    echo "🔑 Commit: \$(git log -1 --oneline)"
                """
            }
        }
        
        stage('Setup Node.js') {
            steps {
                echo "🔧 Setting up Node.js environment..."
                
                sh """
                    # Install NVM if not present
                    if [ ! -d "\$HOME/.nvm" ]; then
                        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
                    fi
                    
                    # Load NVM
                    export NVM_DIR="\$HOME/.nvm"
                    [ -s "\$NVM_DIR/nvm.sh" ] && . "\$NVM_DIR/nvm.sh"
                    
                    # Install and use Node.js 20
                    nvm install ${NODE_VERSION} || true
                    nvm use ${NODE_VERSION}
                    
                    # Verify installation
                    echo "✅ Node.js version: \$(node --version)"
                    echo "✅ npm version: \$(npm --version)"
                """
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo "📦 Installing dependencies..."
                
                sh """
                    export NVM_DIR="\$HOME/.nvm"
                    [ -s "\$NVM_DIR/nvm.sh" ] && . "\$NVM_DIR/nvm.sh"
                    nvm use ${NODE_VERSION}
                    
                    npm ci
                    npx prisma generate
                    
                    echo "✅ Dependencies installed"
                """
            }
        }
        
        stage('Lint') {
            steps {
                echo "🔍 Running linter..."
                
                sh """
                    export NVM_DIR="\$HOME/.nvm"
                    [ -s "\$NVM_DIR/nvm.sh" ] && . "\$NVM_DIR/nvm.sh"
                    nvm use ${NODE_VERSION}
                    
                    npm run lint
                """
            }
        }
        
        stage('Build') {
            steps {
                echo "🔨 Building application..."
                
                sh """
                    export NVM_DIR="\$HOME/.nvm"
                    [ -s "\$NVM_DIR/nvm.sh" ] && . "\$NVM_DIR/nvm.sh"
                    nvm use ${NODE_VERSION}
                    
                    npm run build
                    npm run build:seed
                    
                    echo "✅ Build completed"
                """
            }
        }
        
        stage('Unit Tests') {
            steps {
                echo "🧪 Running unit tests..."
                
                sh """
                    export NVM_DIR="\$HOME/.nvm"
                    [ -s "\$NVM_DIR/nvm.sh" ] && . "\$NVM_DIR/nvm.sh"
                    nvm use ${NODE_VERSION}
                    
                    npm test -- --coverage --watchAll=false
                """
                
                // Publicar resultados de tests
                publishTestResults([
                    testResultsPattern: 'coverage/junit.xml'
                ])
            }
        }
    }
    
    post {
        always {
            echo "📋 Pipeline Summary"
            echo "  ✨ Result: ${currentBuild.currentResult}"
            echo "  ⏱ Duration: ${currentBuild.durationString}"
            echo "  🏗 Build: #${currentBuild.number}"
            
            // Limpiar workspace si es necesario
            cleanWs(cleanWhenNotBuilt: false,
                    deleteDirs: true,
                    disableDeferredWipeout: true,
                    notFailBuild: true)
        }
        
        success {
            echo "🎉 ¡Pipeline completado exitosamente!"
            echo "✅ Todos los tests pasaron"
        }
        
        failure {
            echo "❌ Pipeline falló - revisar los logs"
            echo "🔧 Posibles soluciones:"
            echo "  • Verificar dependencias en package.json"
            echo "  • Revisar tests unitarios"
            echo "  • Comprobar sintaxis de TypeScript"
        }
        
        unstable {
            echo "⚠️ Pipeline completado con advertencias"
        }
    }
}