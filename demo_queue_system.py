#!/usr/bin/env python3
"""
Demonstração Visual do Sistema de Fila
Mostra como funciona o processamento simultâneo de múltiplos cadastros
"""

import requests
import time
import threading
from datetime import datetime
import os

# Configurações
API_URL = "http://localhost:5001"
API_KEY = "automation-key-2024"

def clear_screen():
    """Limpa a tela do terminal"""
    os.system('cls' if os.name == 'nt' else 'clear')

def print_header():
    """Imprime cabeçalho da demonstração"""
    print("🏢 SISTEMA DE AUTOMAÇÃO HIKCENTRAL - DEMONSTRAÇÃO")
    print("="*70)
    print(f"🕐 {datetime.now().strftime('%H:%M:%S')} | 🌐 {API_URL}")
    print("="*70)

def get_queue_status():
    """Obtém status atual da fila"""
    try:
        response = requests.get(
            f"{API_URL}/api/hikcentral/queue/stats",
            headers={"X-API-Key": API_KEY},
            timeout=5
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return None
            
    except:
        return None

def print_queue_visualization(stats):
    """Imprime visualização visual da fila"""
    if not stats:
        print("❌ Não foi possível obter status da fila")
        return
    
    queue_size = stats.get('queue_size', 0)
    active_count = stats.get('active_automations', 0)
    max_workers = stats.get('max_workers', 3)
    
    print("\n📊 VISUALIZAÇÃO DA FILA:")
    print("-" * 50)
    
    # Workers ativos
    print("👥 WORKERS:")
    for i in range(max_workers):
        if i < active_count:
            print(f"   🔴 Worker {i+1}: PROCESSANDO")
        else:
            print(f"   🟢 Worker {i+1}: LIVRE")
    
    # Fila
    print(f"\n⏳ FILA DE ESPERA: {queue_size} cadastros")
    if queue_size > 0:
        for i in range(min(queue_size, 10)):  # Mostrar até 10
            print(f"   📋 Cadastro {i+1} aguardando...")
        if queue_size > 10:
            print(f"   ... e mais {queue_size - 10} cadastros")
    
    print("-" * 50)

def submit_visitor_demo(visitor_id, name, cpf, phone, delay=0):
    """Submete um visitante com demonstração visual"""
    if delay > 0:
        time.sleep(delay)
    
    print(f"🚀 [{datetime.now().strftime('%H:%M:%S')}] Submetendo {name}...")
    
    data = {
        "visitor_id": visitor_id,
        "visitor_data": {
            "name": name,
            "cpf": cpf,
            "phone": phone,
            "email": f"{visitor_id}@teste.com",
            "placa_veiculo": "ABC1234" if visitor_id == "demo_001" else None
        }
    }
    
    try:
        response = requests.post(
            f"{API_URL}/api/hikcentral/automation",
            headers={"X-API-Key": API_KEY, "Content-Type": "application/json"},
            json=data,
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"✅ [{datetime.now().strftime('%H:%M:%S')}] {name} adicionado à fila!")
            return True
        else:
            print(f"❌ [{datetime.now().strftime('%H:%M:%S')}] Erro ao submeter {name}")
            return False
            
    except Exception as e:
        print(f"💥 [{datetime.now().strftime('%H:%M:%S')}] Erro: {e}")
        return False

def monitor_queue_changes():
    """Monitora mudanças na fila em tempo real"""
    print("\n👀 MONITORAMENTO EM TEMPO REAL:")
    print("Pressione Ctrl+C para parar...")
    
    last_stats = None
    try:
        while True:
            stats = get_queue_status()
            
            if stats != last_stats:
                clear_screen()
                print_header()
                print_queue_visualization(stats)
                last_stats = stats
            
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n\n⏹️  Monitoramento interrompido")

def demo_scenario_1():
    """Cenário 1: 3 cadastros simultâneos"""
    print("\n🎬 CENÁRIO 1: 3 CADASTROS SIMULTÂNEOS")
    print("="*50)
    
    visitors = [
        ("demo_001", "João Silva", "12345678901", "31999999999", 0),
        ("demo_002", "Maria Costa", "98765432109", "31888888888", 1),
        ("demo_003", "Pedro Lima", "11122233344", "31777777777", 2)
    ]
    
    print("📋 Visitantes para teste:")
    for i, (vid, name, cpf, phone, delay) in enumerate(visitors, 1):
        print(f"   {i}. {name} (CPF: {cpf}) - Delay: {delay}s")
    
    print("\n🚀 Iniciando submissões...")
    
    # Submeter todos
    threads = []
    for visitor_id, name, cpf, phone, delay in visitors:
        thread = threading.Thread(
            target=submit_visitor_demo,
            args=(visitor_id, name, cpf, phone, delay)
        )
        thread.start()
        threads.append(thread)
    
    # Aguardar todas as submissões
    for thread in threads:
        thread.join()
    
    print("\n✅ Todos os visitantes foram submetidos!")
    print("⏳ Aguardando processamento...")
    time.sleep(5)
    
    # Mostrar status final
    stats = get_queue_status()
    print_queue_visualization(stats)

def demo_scenario_2():
    """Cenário 2: Monitoramento em tempo real"""
    print("\n🎬 CENÁRIO 2: MONITORAMENTO EM TEMPO REAL")
    print("="*50)
    print("Este cenário mostrará como a fila muda em tempo real.")
    print("Primeiro, vamos submeter alguns visitantes...")
    
    # Submeter visitantes rapidamente
    for i in range(5):
        visitor_id = f"monitor_{i+1:03d}"
        name = f"Visitante {i+1}"
        cpf = f"111222333{i+1:02d}"
        phone = f"3199999{i+1:03d}"
        
        submit_visitor_demo(visitor_id, name, cpf, phone, i * 0.5)
    
    print("\n✅ Visitantes submetidos! Agora vamos monitorar...")
    time.sleep(2)
    
    # Iniciar monitoramento
    monitor_queue_changes()

def main():
    """Função principal"""
    while True:
        clear_screen()
        print_header()
        
        print("\n🎯 ESCOLHA UM CENÁRIO DE DEMONSTRAÇÃO:")
        print("1. Cenário 1: 3 cadastros simultâneos")
        print("2. Cenário 2: Monitoramento em tempo real")
        print("3. Verificar status atual da fila")
        print("4. Sair")
        
        try:
            choice = input("\nEscolha uma opção (1-4): ").strip()
            
            if choice == "1":
                demo_scenario_1()
                input("\nPressione Enter para continuar...")
                
            elif choice == "2":
                demo_scenario_2()
                
            elif choice == "3":
                print("\n📊 STATUS ATUAL:")
                stats = get_queue_status()
                print_queue_visualization(stats)
                input("\nPressione Enter para continuar...")
                
            elif choice == "4":
                print("\n👋 Saindo da demonstração...")
                break
                
            else:
                print("❌ Opção inválida. Escolha 1, 2, 3 ou 4.")
                time.sleep(1)
                
        except KeyboardInterrupt:
            print("\n\n👋 Demonstração interrompida pelo usuário.")
            break
        except Exception as e:
            print(f"\n💥 Erro inesperado: {e}")
            time.sleep(2)

if __name__ == "__main__":
    main() 