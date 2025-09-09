#!/usr/bin/env python3
"""
Script para debugar busca de visitante no HikCentral
"""

import os
import sys
import time
import logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, ElementNotInteractableException
from dotenv import load_dotenv

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Carregar variáveis do .env
load_dotenv()

def setup_chrome():
    """Configura o Chrome para debug visual"""
    options = Options()
    # MODO VISÍVEL para debug
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-plugins")
    options.add_argument("--disable-images")
    
    try:
        driver = webdriver.Chrome(options=options)
        print("[OK] Chrome iniciado - MODO VISÍVEL")
        return driver
    except Exception as e:
        print(f"[ERRO] Falha ao iniciar Chrome: {e}")
        return None

def login_hikcentral(driver, url, username, password):
    """Faz login no HikCentral"""
    try:
        print(f"[LOGIN] Acessando {url}...")
        driver.get(url)
        
        # Aguardar e preencher login
        wait = WebDriverWait(driver, 10)
        
        username_field = wait.until(EC.presence_of_element_located((By.ID, "username")))
        password_field = driver.find_element(By.ID, "password")
        login_button = driver.find_element(By.ID, "loginBtn")
        
        username_field.clear()
        username_field.send_keys(username)
        password_field.clear()
        password_field.send_keys(password)
        
        time.sleep(1)
        login_button.click()
        
        # Aguardar login
        print("[LOGIN] Aguardando login...")
        time.sleep(5)
        
        # Verificar se chegou na página principal
        try:
            wait.until(EC.presence_of_element_located((By.CLASS_NAME, "main-content")))
            print("[OK] Login realizado com sucesso!")
            return True
        except TimeoutException:
            print("[ERRO] Login pode ter falhado")
            return False
            
    except Exception as e:
        print(f"[ERRO] Erro no login: {e}")
        return False

def navigate_to_visitors(driver):
    """Navega até a área de visitantes"""
    try:
        wait = WebDriverWait(driver, 10)
        
        # 1. Clicar em "Visitante"
        print("[NAV] Clicando em 'Visitante'...")
        visitante_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[contains(text(), 'Visitante')]")))
        visitante_button.click()
        time.sleep(2)
        
        # 2. Aguardar sidebar abrir automaticamente e clicar em "Entrada de visitante"
        print("[NAV] Clicando em 'Entrada de visitante'...")
        entrada_visitante = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[contains(text(), 'Entrada de visitante')]")))
        entrada_visitante.click()
        time.sleep(2)
        
        # 3. Clicar em "Informação de visitante"
        print("[NAV] Clicando em 'Informação de visitante'...")
        info_visitante = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[contains(text(), 'Informação de visitante')]")))
        info_visitante.click()
        time.sleep(2)
        
        # 4. Clicar em "VisitanteS"
        print("[NAV] Clicando em 'VisitanteS'...")
        visitantes = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[contains(@class, 'node_name') and contains(text(), 'VisitanteS')]")))
        visitantes.click()
        time.sleep(3)
        
        print("[OK] Navegação concluída!")
        return True
        
    except Exception as e:
        print(f"[ERRO] Erro na navegação: {e}")
        return False

def search_visitor_debug(driver, cpf):
    """Busca visitante e mostra detalhes de debug"""
    try:
        wait = WebDriverWait(driver, 10)
        
        # 1. Abrir filtro
        print(f"[SEARCH] Abrindo filtro para buscar CPF: {cpf}")
        filter_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@title='']//i[@class='icomoon-common_btn_filter']")))
        filter_button.click()
        time.sleep(2)
        
        # 2. Inserir CPF
        print(f"[SEARCH] Inserindo CPF: {cpf}")
        cpf_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='']")))
        cpf_input.clear()
        cpf_input.send_keys(cpf)
        time.sleep(1)
        
        # 3. Clicar em Filtro
        print("[SEARCH] Executando busca...")
        search_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button//span[text()='Filtro']")))
        search_button.click()
        time.sleep(3)
        
        # 4. VERIFICAR RESULTADOS COM MÚLTIPLOS MÉTODOS
        print("[DEBUG] Verificando resultados da busca...")
        
        # Método 1: Verificar se tem dados na tabela
        try:
            table_rows = driver.find_elements(By.XPATH, "//tbody/tr")
            print(f"[DEBUG] Linhas na tabela: {len(table_rows)}")
            
            if len(table_rows) > 0:
                for i, row in enumerate(table_rows[:3]):  # Mostrar até 3 primeiras linhas
                    try:
                        cells = row.find_elements(By.TAG_NAME, "td")
                        row_text = " | ".join([cell.text.strip() for cell in cells[:5]])  # Primeiras 5 colunas
                        print(f"[DEBUG] Linha {i+1}: {row_text}")
                    except:
                        print(f"[DEBUG] Linha {i+1}: Erro ao ler dados")
            else:
                print("[DEBUG] Tabela vazia")
                
        except Exception as e:
            print(f"[DEBUG] Erro ao verificar tabela: {e}")
        
        # Método 2: Verificar mensagens na tela
        try:
            messages = driver.find_elements(By.XPATH, "//*[contains(text(), 'Nenhum') or contains(text(), 'vazio') or contains(text(), 'encontrado')]")
            if messages:
                for msg in messages:
                    if msg.is_displayed():
                        print(f"[DEBUG] Mensagem encontrada: '{msg.text}'")
        except:
            pass
        
        # Método 3: Verificar botões de ação
        try:
            action_buttons = driver.find_elements(By.XPATH, "//button[@title='Reservar novamente']")
            print(f"[DEBUG] Botões 'Reservar novamente' encontrados: {len(action_buttons)}")
            
            if len(action_buttons) > 0:
                print(f"[SUCCESS] ✅ Visitante encontrado! {len(action_buttons)} resultado(s)")
                for i, btn in enumerate(action_buttons):
                    try:
                        visible = btn.is_displayed()
                        enabled = btn.is_enabled()
                        print(f"[DEBUG] Botão {i+1}: visible={visible}, enabled={enabled}")
                    except:
                        print(f"[DEBUG] Botão {i+1}: Erro ao verificar estado")
                return True
            else:
                print("[NOT_FOUND] ❌ Nenhum botão de reativação encontrado")
                
        except Exception as e:
            print(f"[DEBUG] Erro ao verificar botões: {e}")
        
        # Método 4: Screenshot para análise visual
        try:
            screenshot_path = f"debug_search_{cpf}.png"
            driver.save_screenshot(screenshot_path)
            print(f"[DEBUG] Screenshot salvo: {screenshot_path}")
        except:
            pass
            
        return False
        
    except Exception as e:
        print(f"[ERRO] Erro na busca: {e}")
        return False

def main():
    """Função principal"""
    # Verificar variáveis de ambiente
    url = os.getenv('HIKCENTRAL_URL')
    username = os.getenv('HIKCENTRAL_USERNAME')
    password = os.getenv('HIKCENTRAL_PASSWORD')
    
    if not all([url, username, password]):
        print("[ERRO] Variáveis de ambiente não encontradas")
        print("Certifique-se que .env tem: HIKCENTRAL_URL, HIKCENTRAL_USERNAME, HIKCENTRAL_PASSWORD")
        return False
    
    print(f"[CONFIG] URL: {url}")
    print(f"[CONFIG] Usuário: {username}")
    
    # CPF para testar
    cpf_teste = "16806418678"
    
    driver = None
    try:
        # Configurar Chrome
        driver = setup_chrome()
        if not driver:
            return False
        
        # Login
        if not login_hikcentral(driver, url, username, password):
            return False
        
        # Navegar para visitantes
        if not navigate_to_visitors(driver):
            return False
        
        # Buscar visitante
        visitor_found = search_visitor_debug(driver, cpf_teste)
        
        if visitor_found:
            print(f"\n🎉 [SUCCESS] Visitante com CPF {cpf_teste} FOI ENCONTRADO!")
            print("Agora você pode testar o botão de reativação...")
        else:
            print(f"\n❌ [NOT_FOUND] Visitante com CPF {cpf_teste} NÃO FOI ENCONTRADO")
            print("\n💡 POSSÍVEIS SOLUÇÕES:")
            print("1. Verificar se o CPF está correto")
            print("2. Verificar se o visitante foi cadastrado anteriormente")
            print("3. Tentar com outro CPF conhecido")
            print("4. Criar um visitante primeiro para depois reativar")
        
        # Manter navegador aberto para análise
        print("\n[DEBUG] Chrome mantido aberto para análise.")
        print("Pressione Ctrl+C para fechar...")
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n[INFO] Encerrando...")
        
        return visitor_found
        
    except Exception as e:
        print(f"[ERRO] Erro geral: {e}")
        return False
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    main()
