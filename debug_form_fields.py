#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de DEBUG para analisar campos do formulário HikCentral
"""

import os
import sys
import time
import argparse
from datetime import datetime, timezone
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class HikCentralDebugger:
    def __init__(self, headless=False):
        self.driver = None
        self.headless = headless
        
    def setup_driver(self):
        """Configurar driver do Chrome"""
        print("[SETUP] Configurando Chrome...")

        # MATAR PROCESSOS CHROME ANTERIORES
        try:
            import subprocess
            subprocess.run("taskkill /f /im chrome.exe /t", shell=True, capture_output=True)
            subprocess.run("taskkill /f /im chromedriver.exe /t", shell=True, capture_output=True)
            subprocess.run("taskkill /f /im chromium.exe /t", shell=True, capture_output=True)
            print("[INFO] Processos Chrome anteriores finalizados")
            time.sleep(3)
        except Exception as e:
            print(f"[WARN] Erro ao finalizar processos: {e}")

        options = Options()
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-plugins")
        options.add_argument("--disable-web-security")
        options.add_argument("--disable-features=VizDisplayCompositor")

        if self.headless:
            options.add_argument("--headless")

        try:
            self.driver = webdriver.Chrome(options=options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            print("[OK] Chrome configurado com sucesso")
            return True
        except Exception as e:
            print(f"[ERRO] Erro ao configurar Chrome: {e}")
            return False

    def login(self, url, username, password):
        """Fazer login no HikCentral"""
        print(f"[LOGIN] Acessando: {url}")
        
        try:
            self.driver.get(url)
            time.sleep(5)
            
            # Login
            username_field = self.driver.find_element(By.ID, "username")
            password_field = self.driver.find_element(By.ID, "password")
            login_btn = self.driver.find_element(By.CSS_SELECTOR, ".login-btn")
            
            username_field.clear()
            username_field.send_keys(username)
            
            password_field.clear()
            password_field.send_keys(password)
            
            login_btn.click()
            time.sleep(5)
            
            print("[OK] Login realizado")
            return True
            
        except Exception as e:
            print(f"[ERRO] Erro no login: {e}")
            return False
    
    def navigate_to_visitor_form(self):
        """Navegar até o formulário de visitante"""
        print("[NAV] Navegando para formulário de visitante...")
        
        try:
            # Clique no menu Visitante
            visitante_menu = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//span[text()='Visitante']"))
            )
            visitante_menu.click()
            time.sleep(3)
            
            # Clique em Adicionar
            add_btn = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//span[text()='Adicionar']"))
            )
            add_btn.click()
            time.sleep(5)
            
            print("[OK] Navegação concluída")
            return True
            
        except Exception as e:
            print(f"[ERRO] Erro na navegação: {e}")
            return False
    
    def debug_all_inputs(self):
        """Analisar TODOS os campos de input na página"""
        print("\n" + "="*80)
        print("🔍 DEBUG - ANALISANDO TODOS OS CAMPOS INPUT")
        print("="*80)
        
        try:
            # Encontrar todos os inputs
            all_inputs = self.driver.find_elements(By.TAG_NAME, "input")
            print(f"\n[INFO] Total de inputs encontrados: {len(all_inputs)}")
            
            for i, input_elem in enumerate(all_inputs):
                try:
                    # Obter atributos
                    tag_name = input_elem.tag_name
                    input_type = input_elem.get_attribute("type") or "text"
                    input_id = input_elem.get_attribute("id") or "N/A"
                    input_name = input_elem.get_attribute("name") or "N/A"
                    input_class = input_elem.get_attribute("class") or "N/A"
                    input_placeholder = input_elem.get_attribute("placeholder") or "N/A"
                    input_tips = input_elem.get_attribute("tips") or "N/A"
                    input_maxlength = input_elem.get_attribute("maxlength") or "N/A"
                    is_displayed = input_elem.is_displayed()
                    is_enabled = input_elem.is_enabled()
                    
                    print(f"\n[INPUT {i+1:02d}]")
                    print(f"  Type: {input_type}")
                    print(f"  ID: {input_id}")
                    print(f"  Name: {input_name}")
                    print(f"  Class: {input_class}")
                    print(f"  Placeholder: {input_placeholder}")
                    print(f"  Tips: {input_tips}")
                    print(f"  MaxLength: {input_maxlength}")
                    print(f"  Displayed: {is_displayed}")
                    print(f"  Enabled: {is_enabled}")
                    
                    # Verificar se é um campo relevante
                    relevant_keywords = ['nome', 'apelido', 'telefone', 'rg', 'placa', 'phone', 'name']
                    is_relevant = any(keyword.lower() in str(attr).lower() 
                                    for attr in [input_id, input_name, input_class, input_placeholder, input_tips]
                                    for keyword in relevant_keywords)
                    
                    if is_relevant:
                        print(f"  ⭐ CAMPO RELEVANTE! ⭐")
                    
                except Exception as e:
                    print(f"[WARN] Erro ao analisar input {i+1}: {e}")
                    
        except Exception as e:
            print(f"[ERRO] Erro ao analisar inputs: {e}")
    
    def debug_radio_buttons(self):
        """Analisar radio buttons para gênero"""
        print("\n" + "="*80)
        print("🔘 DEBUG - ANALISANDO RADIO BUTTONS (GÊNERO)")
        print("="*80)
        
        try:
            # Encontrar todos os radio buttons
            all_radios = self.driver.find_elements(By.CSS_SELECTOR, "input[type='radio']")
            print(f"\n[INFO] Total de radio buttons encontrados: {len(all_radios)}")
            
            for i, radio_elem in enumerate(all_radios):
                try:
                    radio_value = radio_elem.get_attribute("value") or "N/A"
                    radio_class = radio_elem.get_attribute("class") or "N/A"
                    radio_name = radio_elem.get_attribute("name") or "N/A"
                    is_displayed = radio_elem.is_displayed()
                    is_enabled = radio_elem.is_enabled()
                    is_checked = radio_elem.is_selected()
                    
                    # Tentar encontrar o label associado
                    try:
                        parent = radio_elem.find_element(By.XPATH, "./..")
                        label_text = parent.text.strip()
                    except:
                        label_text = "N/A"
                    
                    print(f"\n[RADIO {i+1:02d}]")
                    print(f"  Value: {radio_value}")
                    print(f"  Class: {radio_class}")
                    print(f"  Name: {radio_name}")
                    print(f"  Label: {label_text}")
                    print(f"  Displayed: {is_displayed}")
                    print(f"  Enabled: {is_enabled}")
                    print(f"  Checked: {is_checked}")
                    
                    # Verificar se é gênero
                    gender_keywords = ['feminino', 'masculino', 'desconhecido', 'gender']
                    is_gender = any(keyword.lower() in label_text.lower() for keyword in gender_keywords)
                    
                    if is_gender:
                        print(f"  ⚧️ RADIO DE GÊNERO! ⚧️")
                    
                except Exception as e:
                    print(f"[WARN] Erro ao analisar radio {i+1}: {e}")
                    
        except Exception as e:
            print(f"[ERRO] Erro ao analisar radios: {e}")
    
    def debug_tabs(self):
        """Analisar abas disponíveis"""
        print("\n" + "="*80)
        print("📑 DEBUG - ANALISANDO ABAS")
        print("="*80)
        
        try:
            # Procurar por elementos que podem ser abas
            tab_selectors = [
                "//span[contains(text(), 'Outras')]",
                "//span[contains(text(), 'Informação')]",
                "//span[contains(text(), 'Básica')]",
                "//span[contains(text(), 'Acesso')]",
                ".el-tabs__item",
                "[role='tab']"
            ]
            
            all_tabs = []
            for selector in tab_selectors:
                try:
                    if selector.startswith("//"):
                        tabs = self.driver.find_elements(By.XPATH, selector)
                    else:
                        tabs = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    all_tabs.extend(tabs)
                except:
                    pass
            
            print(f"\n[INFO] Total de elementos de aba encontrados: {len(all_tabs)}")
            
            for i, tab in enumerate(all_tabs):
                try:
                    tab_text = tab.text.strip()
                    tab_class = tab.get_attribute("class") or "N/A"
                    is_displayed = tab.is_displayed()
                    is_enabled = tab.is_enabled()
                    
                    print(f"\n[TAB {i+1:02d}]")
                    print(f"  Text: {tab_text}")
                    print(f"  Class: {tab_class}")
                    print(f"  Displayed: {is_displayed}")
                    print(f"  Enabled: {is_enabled}")
                    
                except Exception as e:
                    print(f"[WARN] Erro ao analisar tab {i+1}: {e}")
                    
        except Exception as e:
            print(f"[ERRO] Erro ao analisar tabs: {e}")
    
    def take_screenshot(self, filename="debug_form.png"):
        """Tirar screenshot"""
        try:
            self.driver.save_screenshot(filename)
            print(f"[INFO] Screenshot salvo: {filename}")
        except Exception as e:
            print(f"[WARN] Erro ao salvar screenshot: {e}")
    
    def debug_full_form(self):
        """Debug completo do formulário"""
        print("\n🚀 INICIANDO DEBUG COMPLETO DO FORMULÁRIO HIKCENTRAL")
        
        # 1. Analisar campos input
        self.debug_all_inputs()
        
        # 2. Analisar radio buttons
        self.debug_radio_buttons()
        
        # 3. Analisar abas
        self.debug_tabs()
        
        # 4. Tirar screenshot
        self.take_screenshot("debug_form_completo.png")
        
        print("\n✅ DEBUG COMPLETO FINALIZADO!")
        print("Mantenha o browser aberto por 60 segundos para inspeção manual...")
        time.sleep(60)
    
    def cleanup(self):
        """Limpar recursos"""
        if self.driver:
            self.driver.quit()

def main():
    parser = argparse.ArgumentParser(description='Debug formulário HikCentral')
    parser.add_argument('--headless', action='store_true', help='Executar em modo headless')
    args = parser.parse_args()
    
    # Carregar credenciais do .env
    try:
        from dotenv import load_dotenv
        load_dotenv()
        
        url = os.getenv('HIKCENTRAL_URL')
        username = os.getenv('HIKCENTRAL_USERNAME') 
        password = os.getenv('HIKCENTRAL_PASSWORD')
        
        if not all([url, username, password]):
            print("[ERRO] Credenciais não encontradas no .env")
            return False
            
    except Exception as e:
        print(f"[ERRO] Erro ao carregar .env: {e}")
        return False
    
    debugger = HikCentralDebugger(headless=args.headless)
    
    try:
        # Setup
        if not debugger.setup_driver():
            return False
        
        # Login
        if not debugger.login(url, username, password):
            return False
        
        # Navegar para formulário
        if not debugger.navigate_to_visitor_form():
            return False
        
        # Debug completo
        debugger.debug_full_form()
        
        return True
        
    except Exception as e:
        print(f"[ERRO] Erro durante debug: {e}")
        return False
    finally:
        debugger.cleanup()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
