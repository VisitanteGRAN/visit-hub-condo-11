#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🚀 STARTUP AUTOMÁTICO - HIKCENTRAL AUTOMATION
=============================================
Script de inicialização que:
- Inicia o servidor de automação
- Monitora e reinicia em caso de falha
- Recupera automaticamente após reinicialização do sistema
- Configura como serviço do sistema
"""

import os
import sys
import time
import signal
import logging
import subprocess
import threading
import psutil
from datetime import datetime
from pathlib import Path

# Configurações
SCRIPT_DIR = Path(__file__).parent
AUTOMATION_SERVER = SCRIPT_DIR / "automation_server_production.py"
LOG_DIR = SCRIPT_DIR / "logs"
PID_FILE = SCRIPT_DIR / "automation_server.pid"
LOG_FILE = LOG_DIR / "startup_manager.log"
RESTART_DELAY = 10  # segundos entre reinicializações
MAX_RESTART_ATTEMPTS = 5
HEALTH_CHECK_INTERVAL = 30  # segundos

# Configurar logging
LOG_DIR.mkdir(exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)

class AutomationManager:
    """Gerenciador do servidor de automação"""
    
    def __init__(self):
        self.process = None
        self.running = True
        self.restart_count = 0
        self.last_restart = None
        
    def start_server(self):
        """Inicia o servidor de automação"""
        try:
            if self.is_server_running():
                logging.info("✅ Servidor já está em execução")
                return True
            
            logging.info("🚀 Iniciando servidor de automação...")
            
            # Comando para iniciar o servidor
            cmd = [
                sys.executable,
                str(AUTOMATION_SERVER)
            ]
            
            # Iniciar processo
            self.process = subprocess.Popen(
                cmd,
                cwd=SCRIPT_DIR,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Salvar PID
            with open(PID_FILE, 'w') as f:
                f.write(str(self.process.pid))
            
            # Aguardar alguns segundos para verificar se iniciou corretamente
            time.sleep(5)
            
            if self.process.poll() is None:
                logging.info(f"✅ Servidor iniciado com PID: {self.process.pid}")
                self.restart_count = 0
                return True
            else:
                stdout, stderr = self.process.communicate()
                logging.error(f"❌ Servidor falhou ao iniciar:")
                logging.error(f"   STDOUT: {stdout}")
                logging.error(f"   STDERR: {stderr}")
                return False
                
        except Exception as e:
            logging.error(f"❌ Erro ao iniciar servidor: {e}")
            return False
    
    def stop_server(self):
        """Para o servidor de automação"""
        try:
            if self.process and self.process.poll() is None:
                logging.info("🛑 Parando servidor de automação...")
                self.process.terminate()
                
                # Aguardar terminar graciosamente
                try:
                    self.process.wait(timeout=10)
                    logging.info("✅ Servidor parado graciosamente")
                except subprocess.TimeoutExpired:
                    logging.warning("⚠️ Forçando parada do servidor...")
                    self.process.kill()
                    self.process.wait()
                    logging.info("✅ Servidor forçadamente parado")
            
            # Limpar PID file
            if PID_FILE.exists():
                PID_FILE.unlink()
                
        except Exception as e:
            logging.error(f"❌ Erro ao parar servidor: {e}")
    
    def is_server_running(self):
        """Verifica se o servidor está rodando"""
        try:
            # Verificar pelo PID file
            if PID_FILE.exists():
                with open(PID_FILE, 'r') as f:
                    pid = int(f.read().strip())
                
                # Verificar se o processo ainda existe
                if psutil.pid_exists(pid):
                    proc = psutil.Process(pid)
                    if proc.is_running() and 'automation_server_production.py' in ' '.join(proc.cmdline()):
                        return True
                else:
                    # PID file órfão, remover
                    PID_FILE.unlink()
            
            # Verificar pelo processo atual
            if self.process and self.process.poll() is None:
                return True
                
            return False
            
        except Exception as e:
            logging.error(f"❌ Erro ao verificar status do servidor: {e}")
            return False
    
    def health_check(self):
        """Verifica saúde do servidor via API"""
        try:
            import requests
            
            response = requests.get(
                'http://localhost:5001/api/health',
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'healthy':
                    return True
            
            return False
            
        except Exception as e:
            logging.warning(f"⚠️ Health check falhou: {e}")
            return False
    
    def restart_server(self):
        """Reinicia o servidor"""
        if self.restart_count >= MAX_RESTART_ATTEMPTS:
            now = datetime.now()
            if self.last_restart and (now - self.last_restart).seconds < 300:  # 5 minutos
                logging.error(f"❌ Muitas tentativas de restart ({self.restart_count}). Parando...")
                self.running = False
                return False
            else:
                # Reset contador após 5 minutos
                self.restart_count = 0
        
        logging.info(f"🔄 Reiniciando servidor (tentativa {self.restart_count + 1}/{MAX_RESTART_ATTEMPTS})...")
        
        self.stop_server()
        time.sleep(RESTART_DELAY)
        
        if self.start_server():
            self.last_restart = datetime.now()
            return True
        else:
            self.restart_count += 1
            return False
    
    def monitor_loop(self):
        """Loop principal de monitoramento"""
        logging.info("👁️ Iniciando monitoramento do servidor...")
        
        while self.running:
            try:
                # Verificar se processo ainda está rodando
                if not self.is_server_running():
                    logging.warning("⚠️ Servidor não está rodando. Tentando reiniciar...")
                    self.restart_server()
                else:
                    # Health check via API
                    if not self.health_check():
                        logging.warning("⚠️ Health check falhou. Reiniciando servidor...")
                        self.restart_server()
                    else:
                        logging.info("✅ Servidor funcionando normalmente")
                
                # Aguardar próxima verificação
                time.sleep(HEALTH_CHECK_INTERVAL)
                
            except KeyboardInterrupt:
                logging.info("🛑 Interrupção pelo usuário")
                self.running = False
                break
            except Exception as e:
                logging.error(f"❌ Erro no monitoramento: {e}")
                time.sleep(RESTART_DELAY)
    
    def run(self):
        """Executa o gerenciador"""
        logging.info("🚀 INICIANDO AUTOMATION MANAGER")
        logging.info(f"📁 Diretório: {SCRIPT_DIR}")
        logging.info(f"📝 Logs: {LOG_FILE}")
        logging.info(f"🔧 PID File: {PID_FILE}")
        logging.info("=" * 50)
        
        try:
            # Iniciar servidor
            if self.start_server():
                # Iniciar monitoramento
                self.monitor_loop()
            else:
                logging.error("❌ Falha ao iniciar servidor inicial")
                return False
                
        except Exception as e:
            logging.error(f"❌ Erro crítico no gerenciador: {e}")
            return False
        finally:
            self.stop_server()
            logging.info("🔒 Automation Manager finalizado")
        
        return True

def create_systemd_service():
    """Cria serviço systemd para inicialização automática"""
    service_content = f"""[Unit]
Description=HikCentral Automation Server
After=network.target
Wants=network.target

[Service]
Type=simple
User=root
WorkingDirectory={SCRIPT_DIR}
ExecStart={sys.executable} {__file__}
Restart=always
RestartSec=10
KillMode=mixed
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
"""
    
    service_path = "/etc/systemd/system/hikcentral-automation.service"
    
    try:
        with open(service_path, 'w') as f:
            f.write(service_content)
        
        # Recarregar systemd e habilitar serviço
        subprocess.run(['systemctl', 'daemon-reload'], check=True)
        subprocess.run(['systemctl', 'enable', 'hikcentral-automation'], check=True)
        
        print(f"✅ Serviço systemd criado: {service_path}")
        print("🔧 Para controlar o serviço:")
        print("   sudo systemctl start hikcentral-automation")
        print("   sudo systemctl stop hikcentral-automation")
        print("   sudo systemctl status hikcentral-automation")
        print("   sudo systemctl restart hikcentral-automation")
        print("   sudo journalctl -u hikcentral-automation -f")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar serviço systemd: {e}")
        print("💡 Execute como root para criar o serviço")
        return False

def handle_signal(signum, frame):
    """Handler para sinais do sistema"""
    logging.info(f"📡 Sinal recebido: {signum}")
    if hasattr(handle_signal, 'manager'):
        handle_signal.manager.running = False

def main():
    """Função principal"""
    import argparse
    
    parser = argparse.ArgumentParser(description='HikCentral Automation Manager')
    parser.add_argument('--install-service', action='store_true', 
                       help='Instalar como serviço systemd')
    parser.add_argument('--stop', action='store_true',
                       help='Parar servidor em execução')
    parser.add_argument('--status', action='store_true',
                       help='Verificar status do servidor')
    args = parser.parse_args()
    
    # Instalar serviço systemd
    if args.install_service:
        return create_systemd_service()
    
    # Parar servidor
    if args.stop:
        manager = AutomationManager()
        manager.stop_server()
        print("✅ Servidor parado")
        return True
    
    # Verificar status
    if args.status:
        manager = AutomationManager()
        if manager.is_server_running():
            print("✅ Servidor está rodando")
            if manager.health_check():
                print("✅ Health check OK")
            else:
                print("⚠️ Health check falhou")
        else:
            print("❌ Servidor não está rodando")
        return True
    
    # Configurar handlers de sinal
    manager = AutomationManager()
    handle_signal.manager = manager
    
    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)
    
    # Executar gerenciador
    return manager.run()

if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n🛑 Interrompido pelo usuário")
        sys.exit(0)
    except Exception as e:
        logging.error(f"❌ Erro crítico: {e}")
        sys.exit(1) 