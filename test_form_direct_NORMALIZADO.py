#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
TESTE DIRETO DO FORMULÁRIO - COM NORMALIZAÇÃO DE NOMES
Versão atualizada que usa a API para normalizar nomes de moradores
"""

import os
import sys
import time
import json
import argparse
import requests
from datetime import datetime, timezone
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys

class HikCentralFormTest:
    def __init__(self, visitor_data, visitor_id, headless=True):
        self.driver = None
        self.visitor_data = visitor_data
        self.visitor_id = visitor_id
        self.headless = headless
        self.api_base_url = "https://granroyalle-visitantes.vercel.app/api"
        
    def normalizar_nome_morador(self, nome_original):
        """
        Normalizar nome do morador usando a API
        Remove acentos e converte para maiúsculas
        """
        try:
            print(f"[API] Normalizando nome: '{nome_original}'")
            
            # Chamar API para buscar morador normalizado
            response = requests.get(
                f"{self.api_base_url}/morador-by-name",
                params={"nome": nome_original},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                nome_normalizado = data.get('morador', {}).get('nome_normalized', '')
                if nome_normalizado:
                    print(f"[API] ✅ Nome normalizado: '{nome_normalizado}'")
                    return nome_normalizado
                else:
                    print(f"[API] ⚠️ Nome normalizado não encontrado, usando original")
                    return nome_original.upper().strip()
            else:
                print(f"[API] ⚠️ Erro {response.status_code}, usando normalização local")
                return self.normalizar_local(nome_original)
                
        except Exception as e:
            print(f"[API] ❌ Erro na API: {e}")
            print(f"[API] Usando normalização local")
            return self.normalizar_local(nome_original)
    
    def normalizar_local(self, nome):
        """Normalização local como fallback"""
        import unicodedata
        
        # Remover acentos
        nome_sem_acentos = unicodedata.normalize('NFD', nome)
        nome_sem_acentos = ''.join(c for c in nome_sem_acentos if unicodedata.category(c) != 'Mn')
        
        # Converter para maiúsculas e limpar
        return nome_sem_acentos.upper().strip()
        
    def setup_driver(self):
        """Configurar driver do Chrome"""
        print("[SETUP] Configurando Chrome...")

        # LIMPEZA SUAVE - SEM MATAR PROCESSOS EXISTENTES
        try:
            print("[INFO] Configuração suave - preservando Chrome existente")
            # Apenas aguardar um momento para estabilizar
            time.sleep(1)
        except Exception as e:
            print(f"[WARN] Erro na preparação: {e}")

        options = Options()
        # Configurações CORPORATIVAS - Para ambientes com antivírus/políticas
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-plugins")
        options.add_argument("--disable-web-security")
        options.add_argument("--disable-features=VizDisplayCompositor")
        
        # Configurações de performance
        options.add_argument("--disable-background-timer-throttling")
        options.add_argument("--disable-backgrounding-occluded-windows")
        options.add_argument("--disable-renderer-backgrounding")
        
        # Configurações de segurança corporativa
        options.add_argument("--disable-default-apps")
        options.add_argument("--disable-sync")
        options.add_argument("--no-first-run")
        options.add_argument("--disable-background-networking")
        
        if self.headless:
            options.add_argument("--headless=new")
            print("[INFO] Modo headless ativado")
        else:
            print("[INFO] Modo visual ativado")
        
        # Configurações de logging reduzidas
        options.add_argument("--log-level=3")
        options.add_argument("--silent")
        options.add_experimental_option('excludeSwitches', ['enable-logging'])
        options.add_experimental_option('useAutomationExtension', False)
        
        # Configurações de user agent
        options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        
        try:
            # Tentar usar ChromeDriver do PATH
            self.driver = webdriver.Chrome(options=options)
            print("[OK] Chrome iniciado com sucesso")
            
            # Configurações adicionais
            self.driver.implicitly_wait(10)
            self.driver.set_page_load_timeout(30)
            
        except Exception as e:
            print(f"[ERROR] Erro ao iniciar Chrome: {e}")
            raise e

    def login(self):
        """Fazer login no HikCentral"""
        url = os.getenv('HIKCENTRAL_URL')
        username = os.getenv('HIKCENTRAL_USER')
        password = os.getenv('HIKCENTRAL_PASS')
        
        if not all([url, username, password]):
            print("[ERROR] Variáveis de ambiente não configuradas")
            print("Configure: HIKCENTRAL_URL, HIKCENTRAL_USER, HIKCENTRAL_PASS")
            return False
        
        print(f"[LOGIN] Acessando: {url}")
        
        try:
            self.driver.get(url)
            time.sleep(3)
            
            # Aguardar página carregar
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Campos de login
            username_field = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.NAME, "username"))
            )
            password_field = self.driver.find_element(By.NAME, "password")
            
            # Preencher credenciais
            username_field.clear()
            username_field.send_keys(username)
            
            password_field.clear()
            password_field.send_keys(password)
            
            # Clicar em login
            login_button = self.driver.find_element(By.XPATH, "//button[@type='submit']")
            login_button.click()
            
            print("[OK] Login realizado")
            time.sleep(5)
            
            return True
            
        except Exception as e:
            print(f"[ERROR] Erro no login: {e}")
            return False

    def navigate_to_form(self):
        """Navegar para formulário - EXATAMENTE COMO FUNCIONAVA"""
        print("[NAV] Navegando para formulário...")
        
        try:
            # Aguardar dashboard carregar
            time.sleep(3)
            
            # Clicar em "Controle de Acesso"
            controle_acesso = WebDriverWait(self.driver, 15).until(
                EC.element_to_be_clickable((By.XPATH, "//span[text()='Controle de Acesso']"))
            )
            controle_acesso.click()
            print("[OK] Clicou em Controle de Acesso")
            time.sleep(2)
            
            # Clicar em "Pessoa"
            pessoa = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//span[text()='Pessoa']"))
            )
            pessoa.click()
            print("[OK] Clicou em Pessoa")
            time.sleep(2)
            
            # Clicar no botão "Adicionar"
            adicionar = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[.//span[text()='Adicionar']]"))
            )
            adicionar.click()
            print("[OK] Clicou em Adicionar")
            time.sleep(3)
            
            # Aguardar formulário carregar
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'el-dialog')]"))
            )
            print("[OK] Formulário carregado")
            
            return True
            
        except Exception as e:
            print(f"[ERROR] Erro na navegação: {e}")
            return False

    def preencher_campo_visitado(self):
        """Preencher campo 'Visitado' com nome do morador NORMALIZADO"""
        print("\n[TEST] Preenchendo campo VISITADO...")
        
        # Obter nome do morador dos dados do visitante
        morador_nome_original = self.visitor_data.get('morador_nome', '')
        
        if not morador_nome_original:
            print("[SKIP] Nenhum nome de morador fornecido")
            return
        
        # ✅ NORMALIZAR NOME DO MORADOR
        morador_nome_normalizado = self.normalizar_nome_morador(morador_nome_original)
        
        print(f"[INFO] Nome original: {morador_nome_original}")
        print(f"[INFO] Nome normalizado: {morador_nome_normalizado}")
        print(f"[INFO] Preenchendo visitado com nome normalizado")
        
        try:
            # 1. ENCONTRAR E CLICAR NO CAMPO "VISITADO"
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
                        print(f"[OK] Campo visitado encontrado com: {selector}")
                        break
                except:
                    continue
            
            if not visitado_field:
                print("[ERROR] Campo visitado não encontrado")
                return
            
            # 2. SCROLL E CLICAR NO CAMPO
            self.driver.execute_script("arguments[0].scrollIntoView(true);", visitado_field)
            time.sleep(1)
            
            try:
                visitado_field.click()
            except Exception as e:
                if "click intercepted" in str(e):
                    print("[FIX] Clique interceptado no visitado, fechando message box...")
                    self.close_any_message_box()
                    time.sleep(1)
                    visitado_field.click()
                else:
                    raise e
            
            # 3. LIMPAR CAMPO E DIGITAR NOME NORMALIZADO DO MORADOR
            visitado_field.clear()
            time.sleep(0.5)
            
            # ✅ USAR NOME NORMALIZADO (SEM ACENTOS)
            # Digitar apenas os 3 primeiros nomes do morador normalizado
            nomes = morador_nome_normalizado.split(' ')
            nome_busca = ' '.join(nomes[:3])  # Primeiros 3 nomes
            
            print(f"[INFO] Digitando nome NORMALIZADO para busca: {nome_busca}")
            
            # Digitar caractere por caractere
            for char in nome_busca:
                visitado_field.send_keys(char)
                time.sleep(0.1)
            
            time.sleep(2)  # Aguardar sugestões aparecerem
            
            # 4. CLICAR NA OPÇÃO "Pesquisar por nome da pessoa"
            print("[INFO] Procurando opção 'Pesquisar por nome da pessoa'...")
            try:
                pesquisar_option = WebDriverWait(self.driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, "//li[contains(@class, 'el-autocomplete-suggestion__item')]//label[text()='Pesquisar por nome da pessoa']"))
                )
                pesquisar_option.click()
                print("[OK] Opção 'Pesquisar por nome da pessoa' clicada")
                time.sleep(3)  # Aguardar resultados da busca
            except Exception as e:
                print(f"[WARN] Erro ao clicar em 'Pesquisar por nome da pessoa': {e}")
                # Tentar alternativa: pressionar Enter
                try:
                    visitado_field.send_keys(Keys.ENTER)
                    print("[OK] Pressionado Enter como alternativa")
                    time.sleep(3)
                except:
                    print("[ERROR] Não foi possível iniciar busca")
                    return
            
            # 5. SELECIONAR O MORADOR NO RESULTADO DA BUSCA
            print("[INFO] Procurando morador nos resultados...")
            try:
                # ✅ PROCURAR PELO NOME NORMALIZADO
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
                        print(f"[OK] Morador encontrado com: {selector}")
                        break
                    except:
                        continue
                
                if morador_card:
                    # Scroll para o card e clicar
                    self.driver.execute_script("arguments[0].scrollIntoView(true);", morador_card)
                    time.sleep(1)
                    morador_card.click()
                    print(f"[OK] Morador selecionado: {nome_busca}")
                    time.sleep(2)
                else:
                    print(f"[WARN] Morador não encontrado nos resultados: {nome_busca}")
                    print("[INFO] Tentando selecionar primeiro resultado disponível...")
                    
                    # Tentar selecionar primeiro resultado
                    try:
                        primeiro_resultado = WebDriverWait(self.driver, 3).until(
                            EC.element_to_be_clickable((By.XPATH, "//ul[@class='person-search-panel']//li[1]//div[@class='ptl-title name-title']"))
                        )
                        primeiro_resultado.click()
                        print("[OK] Primeiro resultado selecionado")
                        time.sleep(2)
                    except:
                        print("[ERROR] Nenhum resultado encontrado")
                        return
                        
            except Exception as e:
                print(f"[ERROR] Erro ao selecionar morador: {e}")
                return
            
            print("[OK] Campo visitado preenchido com sucesso")
            
        except Exception as e:
            print(f"[ERROR] Erro ao preencher campo visitado: {e}")

    def close_any_message_box(self):
        """Fechar qualquer message box que possa estar aberta"""
        try:
            # Tentar fechar message box genérica
            close_buttons = [
                "//button[contains(@class, 'el-message-box__close')]",
                "//button[contains(@class, 'el-button--primary') and contains(text(), 'OK')]",
                "//button[contains(@class, 'el-button--primary') and contains(text(), 'Confirmar')]",
                "//i[contains(@class, 'el-message-box__close')]"
            ]
            
            for selector in close_buttons:
                try:
                    button = self.driver.find_element(By.XPATH, selector)
                    if button.is_displayed():
                        button.click()
                        print("[OK] Message box fechada")
                        time.sleep(1)
                        return
                except:
                    continue
                    
        except Exception as e:
            print(f"[WARN] Erro ao fechar message box: {e}")

    def run_test(self):
        """Executar teste completo"""
        print("\n[INICIO] INICIANDO TESTE DIRETO DO FORMULARIO COM NORMALIZAÇÃO")
        print("="*80)
        
        try:
            # 1. Setup do driver
            if not self.setup_driver():
                return False
            
            # 2. Login
            if not self.login():
                return False
            
            # 3. Navegar para formulário
            if not self.navigate_to_form():
                return False
            
            # 4. Preencher campo visitado (COM NORMALIZAÇÃO)
            self.preencher_campo_visitado()
            
            print("\n[SUCESSO] Teste concluído com sucesso!")
            print("="*80)
            
            # Aguardar um pouco antes de fechar
            time.sleep(5)
            
            return True
            
        except Exception as e:
            print(f"\n[ERROR] Erro durante o teste: {e}")
            return False
            
        finally:
            if self.driver:
                try:
                    self.driver.quit()
                    print("[CLEANUP] Driver fechado")
                except:
                    pass

def main():
    """Função principal"""
    parser = argparse.ArgumentParser(description='Teste direto do formulário HikCentral com normalização')
    parser.add_argument('--visitor-data', help='Caminho para JSON com dados do visitante')
    parser.add_argument('--visitor-id', help='ID do visitante')
    parser.add_argument('--headless', action='store_true', help='Executar em modo headless')
    
    args = parser.parse_args()
    
    # Dados de teste padrão
    visitor_data = {
        "nome": "João da Silva",
        "cpf": "123.456.789-00",
        "telefone": "(11) 99999-9999",
        "morador_nome": "José da Silva Acentuação"  # ✅ NOME COM ACENTOS PARA TESTAR
    }
    
    visitor_id = "test-123"
    
    # Usar dados do arquivo se fornecido
    if args.visitor_data:
        try:
            with open(args.visitor_data, 'r', encoding='utf-8') as f:
                visitor_data = json.load(f)
        except Exception as e:
            print(f"[ERROR] Erro ao ler dados do visitante: {e}")
            return
    
    if args.visitor_id:
        visitor_id = args.visitor_id
    
    # Executar teste
    test = HikCentralFormTest(visitor_data, visitor_id, args.headless)
    success = test.run_test()
    
    if success:
        print("\n✅ TESTE CONCLUÍDO COM SUCESSO!")
    else:
        print("\n❌ TESTE FALHOU!")
        sys.exit(1)

if __name__ == "__main__":
    main()
