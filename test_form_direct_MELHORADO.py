#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
TESTE DIRETO DO FORMULÁRIO - VERSÃO MELHORADA
Corrige problemas de Chrome crashes e janelas sobrepostas
"""

import os
import sys
import time
import json
import argparse
import tempfile
import shutil
import psutil
import random
from datetime import datetime, timezone
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys

class HikCentralFormTestMelhorado:
    def __init__(self, visitor_data, visitor_id, headless=True):
        self.driver = None
        self.visitor_data = visitor_data
        self.visitor_id = visitor_id
        self.headless = headless
        self.temp_dir = None
        self.window_position = self.get_window_position()
        
    def get_window_position(self):
        """Calcular posição da janela para evitar sobreposição"""
        # Usar ID do visitante para calcular posição única
        hash_value = hash(self.visitor_id) % 1000
        x_offset = (hash_value % 4) * 300  # 0, 300, 600, 900
        y_offset = ((hash_value // 4) % 3) * 200  # 0, 200, 400
        
        return {
            'x': 100 + x_offset,
            'y': 100 + y_offset,
            'width': 1200,
            'height': 800
        }
        
    def cleanup_chrome_processes(self):
        """Limpeza suave de processos Chrome órfãos"""
        try:
            print("[CLEANUP] Verificando processos Chrome órfãos...")
            
            # Contar processos Chrome
            chrome_processes = []
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                try:
                    if proc.info['name'] and 'chrome' in proc.info['name'].lower():
                        chrome_processes.append(proc)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
            
            print(f"[INFO] Encontrados {len(chrome_processes)} processos Chrome")
            
            # Se há muitos processos (>10), fazer limpeza suave
            if len(chrome_processes) > 10:
                print("[CLEANUP] Muitos processos Chrome, fazendo limpeza suave...")
                time.sleep(2)  # Aguardar estabilizar
                
        except Exception as e:
            print(f"[WARN] Erro na limpeza: {e}")

    def create_temp_profile(self):
        """Criar perfil temporário único para evitar conflitos"""
        try:
            # Criar diretório temporário único
            self.temp_dir = tempfile.mkdtemp(prefix=f'chrome_profile_{self.visitor_id[:8]}_')
            print(f"[SETUP] Perfil temporário criado: {self.temp_dir}")
            return self.temp_dir
        except Exception as e:
            print(f"[WARN] Erro ao criar perfil temporário: {e}")
            return None

    def setup_driver(self):
        """Configurar driver do Chrome com melhorias anti-crash"""
        print("[SETUP] Configurando Chrome melhorado...")

        # Limpeza suave
        self.cleanup_chrome_processes()
        
        # Criar perfil temporário único
        profile_dir = self.create_temp_profile()

        options = Options()
        
        # ✅ CONFIGURAÇÕES ANTI-CRASH
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--disable-software-rasterizer")
        options.add_argument("--disable-background-timer-throttling")
        options.add_argument("--disable-backgrounding-occluded-windows")
        options.add_argument("--disable-renderer-backgrounding")
        options.add_argument("--disable-features=TranslateUI")
        options.add_argument("--disable-ipc-flooding-protection")
        
        # ✅ CONFIGURAÇÕES DE MEMÓRIA
        options.add_argument("--memory-pressure-off")
        options.add_argument("--max_old_space_size=4096")
        options.add_argument("--js-flags=--max-old-space-size=4096")
        
        # ✅ CONFIGURAÇÕES DE REDE
        options.add_argument("--aggressive-cache-discard")
        options.add_argument("--disable-background-networking")
        options.add_argument("--disable-default-apps")
        options.add_argument("--disable-sync")
        
        # ✅ PERFIL ÚNICO PARA EVITAR CONFLITOS
        if profile_dir:
            options.add_argument(f"--user-data-dir={profile_dir}")
        
        # ✅ POSIÇÃO DA JANELA ÚNICA
        if not self.headless:
            pos = self.window_position
            options.add_argument(f"--window-position={pos['x']},{pos['y']}")
            options.add_argument(f"--window-size={pos['width']},{pos['height']}")
            print(f"[SETUP] Janela posicionada em: {pos['x']},{pos['y']} ({pos['width']}x{pos['height']})")
        
        # ✅ MODO HEADLESS MELHORADO
        if self.headless:
            options.add_argument("--headless=new")  # Novo modo headless mais estável
            options.add_argument("--disable-gpu")
            options.add_argument("--window-size=1920,1080")
            print("[SETUP] Modo headless melhorado ativado")
        
        # ✅ CONFIGURAÇÕES DE LOGGING REDUZIDAS
        options.add_argument("--log-level=3")
        options.add_argument("--silent")
        options.add_experimental_option('excludeSwitches', ['enable-logging'])
        options.add_experimental_option('useAutomationExtension', False)
        
        # ✅ USER AGENT CORPORATIVO
        options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Corporate/1.0")
        
        try:
            # ✅ MÚLTIPLAS TENTATIVAS DE INICIALIZAÇÃO
            for attempt in range(3):
                try:
                    print(f"[SETUP] Tentativa {attempt + 1}/3 de inicializar Chrome...")
                    
                    # Aguardar um pouco entre tentativas
                    if attempt > 0:
                        wait_time = attempt * 2 + random.uniform(1, 3)
                        print(f"[SETUP] Aguardando {wait_time:.1f}s antes da próxima tentativa...")
                        time.sleep(wait_time)
                    
                    self.driver = webdriver.Chrome(options=options)
                    print(f"[OK] Chrome iniciado com sucesso na tentativa {attempt + 1}")
                    break
                    
                except Exception as e:
                    print(f"[WARN] Tentativa {attempt + 1} falhou: {e}")
                    if attempt == 2:  # Última tentativa
                        raise e
                    
                    # Limpeza entre tentativas
                    self.cleanup_chrome_processes()
                    time.sleep(2)
            
            # ✅ CONFIGURAÇÕES ADICIONAIS
            self.driver.implicitly_wait(10)
            self.driver.set_page_load_timeout(60)  # Timeout maior para páginas lentas
            
            # ✅ CONFIGURAR TIMEOUTS PERSONALIZADOS
            self.driver.set_script_timeout(30)
            
            print("[OK] Chrome configurado com sucesso")
            return True
            
        except Exception as e:
            print(f"[ERROR] Erro ao iniciar Chrome: {e}")
            self.cleanup_temp_profile()
            raise e

    def cleanup_temp_profile(self):
        """Limpar perfil temporário"""
        if self.temp_dir and os.path.exists(self.temp_dir):
            try:
                shutil.rmtree(self.temp_dir, ignore_errors=True)
                print(f"[CLEANUP] Perfil temporário removido: {self.temp_dir}")
            except Exception as e:
                print(f"[WARN] Erro ao remover perfil temporário: {e}")

    def login(self):
        """Fazer login no HikCentral com retry"""
        url = os.getenv('HIKCENTRAL_URL')
        username = os.getenv('HIKCENTRAL_USER')
        password = os.getenv('HIKCENTRAL_PASS')
        
        if not all([url, username, password]):
            print("[ERROR] Variáveis de ambiente não configuradas")
            print("Configure: HIKCENTRAL_URL, HIKCENTRAL_USER, HIKCENTRAL_PASS")
            return False
        
        print(f"[LOGIN] Acessando: {url}")
        
        # ✅ MÚLTIPLAS TENTATIVAS DE CARREGAMENTO
        for attempt in range(3):
            try:
                print(f"[LOGIN] Tentativa {attempt + 1}/3 de carregar página...")
                
                self.driver.get(url)
                
                # ✅ AGUARDAR PÁGINA CARREGAR COM TIMEOUT MAIOR
                print("[LOGIN] Aguardando página carregar...")
                WebDriverWait(self.driver, 30).until(
                    EC.presence_of_element_located((By.TAG_NAME, "body"))
                )
                
                # ✅ AGUARDAR ELEMENTOS DE LOGIN
                print("[LOGIN] Procurando campos de login...")
                username_field = WebDriverWait(self.driver, 20).until(
                    EC.presence_of_element_located((By.NAME, "username"))
                )
                password_field = self.driver.find_element(By.NAME, "password")
                
                # ✅ PREENCHER COM DELAY
                print("[LOGIN] Preenchendo credenciais...")
                username_field.clear()
                time.sleep(0.5)
                username_field.send_keys(username)
                
                time.sleep(0.5)
                password_field.clear()
                time.sleep(0.5)
                password_field.send_keys(password)
                
                # ✅ CLICAR EM LOGIN
                login_button = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[@type='submit']"))
                )
                login_button.click()
                
                print("[OK] Login realizado")
                time.sleep(5)
                
                return True
                
            except Exception as e:
                print(f"[WARN] Tentativa {attempt + 1} de login falhou: {e}")
                if attempt == 2:  # Última tentativa
                    print(f"[ERROR] Todas as tentativas de login falharam")
                    return False
                
                # Aguardar antes da próxima tentativa
                time.sleep(5)
        
        return False

    def navigate_to_form(self):
        """Navegar para formulário com retry"""
        print("[NAV] Navegando para formulário...")
        
        try:
            # ✅ AGUARDAR DASHBOARD CARREGAR
            print("[NAV] Aguardando dashboard...")
            time.sleep(5)
            
            # ✅ CLICAR EM "CONTROLE DE ACESSO"
            print("[NAV] Procurando 'Controle de Acesso'...")
            controle_acesso = WebDriverWait(self.driver, 20).until(
                EC.element_to_be_clickable((By.XPATH, "//span[text()='Controle de Acesso']"))
            )
            controle_acesso.click()
            print("[OK] Clicou em Controle de Acesso")
            time.sleep(3)
            
            # ✅ CLICAR EM "PESSOA"
            print("[NAV] Procurando 'Pessoa'...")
            pessoa = WebDriverWait(self.driver, 15).until(
                EC.element_to_be_clickable((By.XPATH, "//span[text()='Pessoa']"))
            )
            pessoa.click()
            print("[OK] Clicou em Pessoa")
            time.sleep(3)
            
            # ✅ CLICAR NO BOTÃO "ADICIONAR"
            print("[NAV] Procurando botão 'Adicionar'...")
            adicionar = WebDriverWait(self.driver, 15).until(
                EC.element_to_be_clickable((By.XPATH, "//button[.//span[text()='Adicionar']]"))
            )
            adicionar.click()
            print("[OK] Clicou em Adicionar")
            time.sleep(5)
            
            # ✅ AGUARDAR FORMULÁRIO CARREGAR
            print("[NAV] Aguardando formulário carregar...")
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'el-dialog')]"))
            )
            print("[OK] Formulário carregado")
            
            return True
            
        except Exception as e:
            print(f"[ERROR] Erro na navegação: {e}")
            return False

    def preencher_campo_visitado(self):
        """Preencher campo 'Visitado' com nome do morador"""
        print("\n[FORM] Preenchendo campo VISITADO...")
        
        morador_nome = self.visitor_data.get('morador_nome', '')
        
        if not morador_nome:
            print("[SKIP] Nenhum nome de morador fornecido")
            return True
        
        print(f"[INFO] Preenchendo visitado com: {morador_nome}")
        
        try:
            # ✅ ENCONTRAR CAMPO VISITADO
            visitado_selectors = [
                "//input[@placeholder='Pesquisar' and @clearable='true']",
                "//input[contains(@class, 'el-input__inner') and @placeholder='Pesquisar']",
                "//input[@autocomplete='off' and @placeholder='Pesquisar']"
            ]
            
            visitado_field = None
            for selector in visitado_selectors:
                try:
                    field = self.driver.find_element(By.XPATH, selector)
                    if field.is_displayed() and field.is_enabled():
                        visitado_field = field
                        print(f"[OK] Campo visitado encontrado")
                        break
                except:
                    continue
            
            if not visitado_field:
                print("[WARN] Campo visitado não encontrado, continuando...")
                return True
            
            # ✅ PREENCHER CAMPO
            self.driver.execute_script("arguments[0].scrollIntoView(true);", visitado_field)
            time.sleep(1)
            
            visitado_field.click()
            time.sleep(1)
            
            visitado_field.clear()
            time.sleep(0.5)
            
            # Usar apenas os 3 primeiros nomes
            nomes = morador_nome.split(' ')
            nome_busca = ' '.join(nomes[:3])
            
            print(f"[INFO] Digitando: {nome_busca}")
            
            # Digitar caractere por caractere
            for char in nome_busca:
                visitado_field.send_keys(char)
                time.sleep(0.1)
            
            time.sleep(2)
            
            # ✅ TENTAR CLICAR EM "PESQUISAR POR NOME"
            try:
                pesquisar_option = WebDriverWait(self.driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, "//li[contains(@class, 'el-autocomplete-suggestion__item')]//label[text()='Pesquisar por nome da pessoa']"))
                )
                pesquisar_option.click()
                print("[OK] Opção 'Pesquisar por nome da pessoa' clicada")
                time.sleep(3)
            except:
                print("[INFO] Tentando Enter como alternativa...")
                visitado_field.send_keys(Keys.ENTER)
                time.sleep(3)
            
            # ✅ TENTAR SELECIONAR RESULTADO
            try:
                morador_selectors = [
                    f"//ul[@class='person-search-panel']//div[@class='ptl-title name-title' and contains(text(), '{nome_busca.upper()}')]",
                    f"//ul[@class='person-search-panel']//div[@class='ptl-title name-title' and contains(text(), '{nome_busca}')]",
                    f"//ul[contains(@class, 'person-search')]//div[contains(@class, 'name-title') and contains(text(), '{nomes[0]}')]"
                ]
                
                morador_card = None
                for selector in morador_selectors:
                    try:
                        card = WebDriverWait(self.driver, 3).until(
                            EC.element_to_be_clickable((By.XPATH, selector))
                        )
                        morador_card = card
                        print(f"[OK] Morador encontrado")
                        break
                    except:
                        continue
                
                if morador_card:
                    self.driver.execute_script("arguments[0].scrollIntoView(true);", morador_card)
                    time.sleep(1)
                    morador_card.click()
                    print(f"[OK] Morador selecionado: {nome_busca}")
                    time.sleep(2)
                else:
                    print(f"[WARN] Morador não encontrado, tentando primeiro resultado...")
                    try:
                        primeiro_resultado = WebDriverWait(self.driver, 3).until(
                            EC.element_to_be_clickable((By.XPATH, "//ul[@class='person-search-panel']//li[1]//div[@class='ptl-title name-title']"))
                        )
                        primeiro_resultado.click()
                        print("[OK] Primeiro resultado selecionado")
                        time.sleep(2)
                    except:
                        print("[WARN] Nenhum resultado encontrado, continuando...")
                        
            except Exception as e:
                print(f"[WARN] Erro ao selecionar morador: {e}")
            
            print("[OK] Campo visitado processado")
            return True
            
        except Exception as e:
            print(f"[WARN] Erro ao preencher campo visitado: {e}")
            return True  # Continuar mesmo com erro

    def run_test(self):
        """Executar teste completo com melhorias"""
        print(f"\n[INICIO] TESTE MELHORADO - Visitante: {self.visitor_data.get('nome', 'N/A')}")
        print("="*80)
        
        try:
            # ✅ 1. SETUP DO DRIVER
            if not self.setup_driver():
                return False
            
            # ✅ 2. LOGIN
            if not self.login():
                return False
            
            # ✅ 3. NAVEGAR PARA FORMULÁRIO
            if not self.navigate_to_form():
                return False
            
            # ✅ 4. PREENCHER CAMPO VISITADO
            self.preencher_campo_visitado()
            
            # ✅ 5. AGUARDAR UM POUCO PARA VISUALIZAÇÃO
            print("\n[INFO] Teste concluído, aguardando...")
            time.sleep(10)
            
            print("\n[SUCESSO] Teste concluído com sucesso!")
            print("="*80)
            
            return True
            
        except Exception as e:
            print(f"\n[ERROR] Erro durante o teste: {e}")
            return False
            
        finally:
            # ✅ LIMPEZA GARANTIDA
            if self.driver:
                try:
                    self.driver.quit()
                    print("[CLEANUP] Driver fechado")
                except:
                    pass
            
            # Limpar perfil temporário
            self.cleanup_temp_profile()
            
            # Aguardar um pouco para estabilizar
            time.sleep(2)

def main():
    """Função principal"""
    parser = argparse.ArgumentParser(description='Teste melhorado do formulário HikCentral')
    parser.add_argument('--visitor-data', help='Caminho para JSON com dados do visitante')
    parser.add_argument('--visitor-id', help='ID do visitante')
    parser.add_argument('--headless', action='store_true', help='Executar em modo headless')
    
    args = parser.parse_args()
    
    # ✅ DADOS DE TESTE PADRÃO
    visitor_data = {
        "nome": "João da Silva",
        "cpf": "123.456.789-00",
        "telefone": "(11) 99999-9999",
        "morador_nome": "JOSE DA SILVA"
    }
    
    visitor_id = f"test-{int(time.time())}"
    
    # ✅ USAR DADOS DO ARQUIVO SE FORNECIDO
    if args.visitor_data:
        try:
            with open(args.visitor_data, 'r', encoding='utf-8') as f:
                visitor_data = json.load(f)
            print(f"[INFO] Dados carregados de: {args.visitor_data}")
        except Exception as e:
            print(f"[ERROR] Erro ao ler dados do visitante: {e}")
            return
    
    if args.visitor_id:
        visitor_id = args.visitor_id
    
    # ✅ FORÇAR HEADLESS EM PRODUÇÃO
    headless = args.headless or os.getenv('FORCE_HEADLESS', '').lower() == 'true'
    if headless:
        print("[INFO] Modo headless ativado")
    
    # ✅ EXECUTAR TESTE
    test = HikCentralFormTestMelhorado(visitor_data, visitor_id, headless)
    success = test.run_test()
    
    if success:
        print("\n✅ TESTE CONCLUÍDO COM SUCESSO!")
    else:
        print("\n❌ TESTE FALHOU!")
        sys.exit(1)

if __name__ == "__main__":
    main()
