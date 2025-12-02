#!/bin/bash

# Script de configuración para webhooks con Jenkins y ngrok
# Este script automatiza la configuración inicial

set -e

echo "🚀 Configurando Jenkins con webhooks y ngrok..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Cargar variables del archivo .env si existe
if [ -f .env ]; then
    echo "📝 Cargando variables del archivo .env..."
    export $(grep -v '^#' .env | xargs)
fi

# Verificar que ngrok esté configurado
if [ -z "$NGROK_AUTHTOKEN" ]; then
    echo -e "${RED}❌ Error: NGROK_AUTHTOKEN no está configurado${NC}"
    echo "Por favor:"
    echo "1. Ve a https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "2. Copia tu token"
    echo "3. Agrega tu token al archivo .env: NGROK_AUTHTOKEN=tu_token"
    echo "4. O exporta la variable: export NGROK_AUTHTOKEN=tu_token_aqui"
    exit 1
fi

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo "📝 Creando archivo .env..."
    cat > .env << EOF
NGROK_AUTHTOKEN=${NGROK_AUTHTOKEN}
JENKINS_ADMIN_USER=admin
JENKINS_ADMIN_PASSWORD=jenkins123
EOF
    echo -e "${GREEN}✅ Archivo .env creado${NC}"
fi

# Iniciar servicios
echo "🐳 Iniciando Jenkins y ngrok..."
docker-compose -f docker-compose.jenkins.yml up -d

echo "⏱ Esperando a que Jenkins esté listo..."
timeout=120
while ! curl -s http://localhost:8080 > /dev/null; do
    if [ $timeout -eq 0 ]; then
        echo -e "${RED}❌ Timeout esperando a Jenkins${NC}"
        exit 1
    fi
    echo "Esperando Jenkins... ($timeout segundos restantes)"
    sleep 5
    timeout=$((timeout-5))
done

echo "⏱ Esperando a que ngrok esté listo..."
sleep 10

# Obtener URL de ngrok
echo "🌐 Obteniendo URL pública de ngrok..."
NGROK_URL=""
for i in {1..10}; do
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok[^"]*' | head -1)
    if [ ! -z "$NGROK_URL" ]; then
        break
    fi
    echo "Esperando ngrok... intento $i/10"
    sleep 3
done

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}❌ No se pudo obtener la URL de ngrok${NC}"
    echo "Verifica que ngrok esté corriendo:"
    echo "  docker logs ngrok"
    exit 1
fi

echo -e "${GREEN}✅ Configuración completada!${NC}"
echo
echo "📋 Información importante:"
echo -e "🌐 Jenkins local: ${YELLOW}http://localhost:8080${NC}"
echo -e "🌐 Jenkins público (ngrok): ${YELLOW}$NGROK_URL${NC}"
echo -e "🔧 ngrok dashboard: ${YELLOW}http://localhost:4040${NC}"
echo -e "👤 Usuario Jenkins: ${YELLOW}admin${NC}"
echo -e "🔑 Contraseña Jenkins: ${YELLOW}jenkins123${NC}"
echo
echo -e "${YELLOW}🔗 URL del webhook para GitHub:${NC}"
echo -e "${GREEN}$NGROK_URL/github-webhook/${NC}"
echo
echo "📝 Próximos pasos:"
echo "1. Ve a tu repositorio en GitHub"
echo "2. Ve a Settings > Webhooks"
echo "3. Clic en 'Add webhook'"
echo "4. Pega la URL del webhook de arriba"
echo "5. Selecciona 'application/json' como Content type"
echo "6. Selecciona 'Just the push event'"
echo "7. Haz clic en 'Add webhook'"
echo
echo "🎉 ¡Listo! Ahora cada push activará el pipeline automáticamente."