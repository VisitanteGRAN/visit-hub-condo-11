#!/usr/bin/env python3
"""
Script de inicialização do sistema de automação HikCentral
"""

import os
import sys
import subprocess
import time
import signal
from pathlib import Path

def check_dependencies():
    """Verifica se todas as dependências estão instaladas"""
    print("🔍 Verificando dependências...")
    
    required_packages = [
        'flask',
        'flask-cors', 
        'selenium',
        'webdriver-manager',
        'Pillow',
        'python-dotenv'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package}")
    
    if missing_packages:
        print(f"\n❌ Pacotes faltando: {', '.join(missing_packages)}")
        print("💡 Execute: pip install -r requirements.txt")
        return False
    
    print("✅ Todas as dependências estão instaladas!")
    return True

def check_chrome():
    """Verifica se o Chrome está disponível"""
    print("🔍 Verificando Chrome...")
    
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.service import Service
        from webdriver_manager.chrome import ChromeDriverManager
        
        # Tentar criar driver para testar
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service)
        driver.quit()
        
        print("✅ Chrome e ChromeDriver funcionando!")
        return True
        
    except Exception as e:
        print(f"❌ Erro com Chrome: {e}")
        print("💡 Verifique se o Chrome está instalado")
        return False

def create_env_file():
    """Cria arquivo .env se não existir"""
    env_file = Path('.env')
    env_example = Path('env.example')
    
    if not env_file.exists() and env_example.exists():
        print("📝 Criando arquivo .env...")
        
        # Ler arquivo de exemplo
        with open(env_example, 'r') as f:
            content = f.read()
        
        # Criar arquivo .env
        with open(env_file, 'w') as f:
            f.write(content)
        
        print("✅ Arquivo .env criado!")
        print("⚠️  Configure suas credenciais do HikCentral no arquivo .env")
        return False
    
    elif env_file.exists():
        print("✅ Arquivo .env encontrado!")
        return True
    
    else:
        print("❌ Arquivo .env não encontrado e env.example não existe")
        return False

def start_flask_app():
    """Inicia a aplicação Flask"""
    print("🚀 Iniciando aplicação Flask...")
    
    try:
        # Iniciar Flask em background
        process = subprocess.Popen([
            sys.executable, 'app.py'
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Aguardar um pouco para ver se iniciou
        time.sleep(3)
        
        if process.poll() is None:
            print("✅ Aplicação Flask iniciada com sucesso!")
            print("🌐 Interface web disponível em: http://localhost:5000")
            print("📱 API disponível em: http://localhost:5000/api")
            return process
        else:
            stdout, stderr = process.communicate()
            print(f"❌ Erro ao iniciar Flask: {stderr.decode()}")
            return None
            
    except Exception as e:
        print(f"❌ Erro ao iniciar Flask: {e}")
        return None

def signal_handler(signum, frame):
    """Manipulador de sinal para encerramento limpo"""
    print("\n🛑 Recebido sinal de encerramento...")
    print("👋 Encerrando sistema...")
    sys.exit(0)

def main():
    """Função principal"""
    print("🏢 Sistema de Automação HikCentral")
    print("=" * 50)
    
    # Configurar manipulador de sinal
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Verificar dependências
    if not check_dependencies():
        sys.exit(1)
    
    # Verificar Chrome
    if not check_chrome():
        sys.exit(1)
    
    # Verificar/criar arquivo .env
    if not create_env_file():
        print("\n⚠️  Configure o arquivo .env antes de continuar")
        print("💡 Copie env.example para .env e configure suas credenciais")
        sys.exit(1)
    
    print("\n🚀 Iniciando sistema...")
    
    # Iniciar Flask
    flask_process = start_flask_app()
    if not flask_process:
        sys.exit(1)
    
    try:
        print("\n✅ Sistema iniciado com sucesso!")
        print("📋 Para parar o sistema, pressione Ctrl+C")
        print("🌐 Acesse: http://localhost:5000")
        
        # Manter o script rodando
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n🛑 Parando sistema...")
        
    finally:
        if flask_process:
            print("🔄 Encerrando aplicação Flask...")
            flask_process.terminate()
            flask_process.wait()
            print("✅ Sistema encerrado!")

if __name__ == "__main__":
    main() 