#!/usr/bin/env python3
"""
🔧 Setup Automático - HikCentral Automation
===========================================
Script para configurar automaticamente o ambiente de desenvolvimento
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def run_command(command, description):
    """Executa um comando e trata erros"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} concluído com sucesso!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao {description.lower()}: {e}")
        print(f"   Comando: {command}")
        print(f"   Erro: {e.stderr}")
        return False

def check_python_version():
    """Verifica a versão do Python"""
    print("🐍 Verificando versão do Python...")
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print(f"❌ Python 3.8+ é necessário. Versão atual: {version.major}.{version.minor}")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} - OK!")
    return True

def create_directories():
    """Cria diretórios necessários"""
    print("📁 Criando diretórios...")
    directories = ['logs', 'screenshots', 'config', 'docs']
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"   ✅ {directory}/")
    
    return True

def setup_virtual_environment():
    """Configura ambiente virtual"""
    print("🔧 Configurando ambiente virtual...")
    
    if os.path.exists('venv'):
        print("   ⚠️ Ambiente virtual já existe")
        response = input("   Deseja recriar? (s/N): ").lower()
        if response == 's':
            shutil.rmtree('venv')
        else:
            print("   ✅ Usando ambiente virtual existente")
            return True
    
    if not run_command("python -m venv venv", "Criando ambiente virtual"):
        return False
    
    # Ativar ambiente virtual e instalar dependências
    if os.name == 'nt':  # Windows
        activate_cmd = "venv\\Scripts\\activate"
        pip_cmd = "venv\\Scripts\\pip"
    else:  # Linux/Mac
        activate_cmd = "source venv/bin/activate"
        pip_cmd = "venv/bin/pip"
    
    print("📦 Instalando dependências...")
    if not run_command(f"{pip_cmd} install --upgrade pip", "Atualizando pip"):
        return False
    
    if not run_command(f"{pip_cmd} install -r requirements.txt", "Instalando dependências"):
        return False
    
    return True

def setup_configuration():
    """Configura arquivos de configuração"""
    print("⚙️ Configurando arquivos...")
    
    # Copiar arquivo de configuração de exemplo
    if not os.path.exists('.env') and os.path.exists('config.env.example'):
        shutil.copy('config.env.example', '.env')
        print("   ✅ Arquivo .env criado a partir do exemplo")
        print("   ⚠️ IMPORTANTE: Edite o arquivo .env com suas configurações!")
    else:
        print("   ✅ Arquivo .env já existe")
    
    return True

def check_chrome():
    """Verifica se o Chrome está instalado"""
    print("🌐 Verificando Google Chrome...")
    
    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    ]
    
    chrome_found = False
    for path in chrome_paths:
        if os.path.exists(path):
            print(f"   ✅ Chrome encontrado em: {path}")
            chrome_found = True
            break
    
    if not chrome_found:
        print("   ⚠️ Chrome não encontrado nos caminhos padrão")
        print("   💡 Certifique-se de que o Google Chrome está instalado")
        print("   💡 O script tentará usar o ChromeDriver Manager como alternativa")
    
    return True

def run_tests():
    """Executa testes básicos"""
    print("🧪 Executando testes básicos...")
    
    try:
        # Teste de importação
        sys.path.insert(0, '.')
        import hikcentral_automation
        print("   ✅ Módulo hikcentral_automation importado com sucesso")
        
        # Teste de criação da classe
        automation = hikcentral_automation.HikCentralAutomation(
            headless=True,  # Modo headless para teste
            simulation_mode=True  # Modo simulação para teste
        )
        print("   ✅ Classe HikCentralAutomation criada com sucesso")
        
        return True
    except ImportError as e:
        print(f"   ❌ Erro ao importar módulo: {e}")
        return False
    except Exception as e:
        print(f"   ❌ Erro ao criar instância: {e}")
        return False

def main():
    """Função principal"""
    print("🚀 SETUP AUTOMÁTICO - HIKCENTRAL AUTOMATION")
    print("=" * 50)
    
    # Verificações iniciais
    if not check_python_version():
        sys.exit(1)
    
    if not check_chrome():
        print("   ⚠️ Continuando mesmo assim...")
    
    # Configuração do ambiente
    if not create_directories():
        sys.exit(1)
    
    if not setup_virtual_environment():
        sys.exit(1)
    
    if not setup_configuration():
        sys.exit(1)
    
    # Testes
    if not run_tests():
        print("   ⚠️ Testes falharam, mas o setup pode continuar...")
    
    # Instruções finais
    print("\n🎉 SETUP CONCLUÍDO COM SUCESSO!")
    print("=" * 50)
    print("📋 PRÓXIMOS PASSOS:")
    print("   1. Edite o arquivo .env com suas configurações")
    print("   2. Ative o ambiente virtual:")
    if os.name == 'nt':  # Windows
        print("      venv\\Scripts\\activate")
    else:  # Linux/Mac
        print("      source venv/bin/activate")
    print("   3. Execute o script principal:")
    print("      python test_real_hikcentral_visible_debug.py")
    print("\n💡 Para mais informações, consulte o README.md")
    print("🔧 Em caso de problemas, verifique os logs em logs/")

if __name__ == "__main__":
    main() 