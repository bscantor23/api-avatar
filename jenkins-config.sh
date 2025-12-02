#!/bin/bash

# Configuración automática de Jenkins para webhooks
# Este script configura Jenkins mediante su API

JENKINS_URL="http://localhost:8080"
JENKINS_USER="admin"
JENKINS_PASS="jenkins123"

echo "🔧 Configurando Jenkins para webhooks..."

# Esperar a que Jenkins esté listo
echo "⏱ Esperando a que Jenkins esté disponible..."
while ! curl -s "$JENKINS_URL" > /dev/null; do
    echo "Esperando Jenkins..."
    sleep 5
done

echo "✅ Jenkins está disponible"

# Instalar plugins necesarios
echo "📦 Instalando plugins necesarios..."
PLUGINS="github git nodejs build-timeout ws-cleanup"

for plugin in $PLUGINS; do
    echo "Instalando plugin: $plugin"
    curl -X POST \
        -u "$JENKINS_USER:$JENKINS_PASS" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "plugin.${plugin}.default=on" \
        "$JENKINS_URL/pluginManager/install" || true
done

# Reiniciar Jenkins para activar plugins
echo "🔄 Reiniciando Jenkins para activar plugins..."
curl -X POST \
    -u "$JENKINS_USER:$JENKINS_PASS" \
    "$JENKINS_URL/safeRestart"

echo "⏱ Esperando reinicio de Jenkins..."
sleep 30

while ! curl -s "$JENKINS_URL" > /dev/null; do
    echo "Esperando que Jenkins reinicie..."
    sleep 10
done

echo "✅ Configuración de Jenkins completada"