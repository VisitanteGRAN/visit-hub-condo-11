#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
TESTE DIRETO DO FORMULÁRIO - Baseado no script que funcionava 100%
"""

import os
import sys
import time
import json
import argparse
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
        
        # CONFIGURAÇÕES ESPECÍFICAS PARA ANTIVÍRUS/CORPORATE
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--disable-background-timer-throttling")
        options.add_argument("--disable-backgrounding-occluded-windows")
        options.add_argument("--disable-renderer-backgrounding")
        options.add_argument("--disable-features=TranslateUI")
        options.add_argument("--aggressive-cache-discard")
        options.add_argument("--disable-default-apps")
        options.add_argument("--disable-sync")
        options.add_argument("--disable-logging")
        options.add_argument("--silent")
        options.add_argument("--disable-component-update")
        
        # Evitar detecção por antivírus
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        # CONFIGURAR USER-DATA-DIR ÚNICO para evitar conflitos
        import tempfile
        import uuid
        temp_profile = os.path.join(tempfile.gettempdir(), f"chrome_profile_{uuid.uuid4().hex[:8]}")
        options.add_argument(f"--user-data-dir={temp_profile}")
        print(f"[INFO] Configuração Chrome com diretório único: {temp_profile}")
        
        # Salvar caminho para limpeza posterior
        self.temp_profile = temp_profile

        if self.headless:
            options.add_argument("--headless")
            print("[INFO] Modo headless ativado - execução invisível para produção")
        else:
            print("[INFO] Modo visual ativado - Chrome será visível para demonstração")
        
        print(f"[DEBUG] Configuração headless: {self.headless}")

        try:
            # TENTAR CONFIGURAÇÃO BÁSICA PRIMEIRO
            print("[TRY] Tentando configuração básica do Chrome...")
            
            # Aguardar um pouco antes de iniciar (evitar conflitos)
            time.sleep(2)
            
            self.driver = webdriver.Chrome(options=options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
            # Configurar timeouts adequados
            self.driver.implicitly_wait(10)
            self.driver.set_page_load_timeout(30)
            
            print("[OK] Chrome configurado com sucesso (básico)")
            return True
        except Exception as e:
            print(f"[WARN] Configuração básica falhou: {e}")
            
            # FALLBACK: TENTAR COM WEBDRIVER MANAGER
            try:
                print("[FALLBACK] Tentando com WebDriver Manager...")
                from selenium.webdriver.chrome.service import Service
                from webdriver_manager.chrome import ChromeDriverManager
                
                service = Service(ChromeDriverManager().install())
                self.driver = webdriver.Chrome(service=service, options=options)
                self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
                print("[OK] Chrome configurado com sucesso (WebDriver Manager)")
                return True
            except Exception as e2:
                print(f"[ERRO] Ambas as configurações falharam: {e2}")
                
                # ÚLTIMO RECURSO: CHROME SEM ARGUMENTOS EXTRAS
                try:
                    print("[LAST] Tentando Chrome minimalista...")
                    minimal_options = Options()
                    minimal_options.add_argument("--no-sandbox")
                    minimal_options.add_argument("--disable-dev-shm-usage")
                    
                    self.driver = webdriver.Chrome(options=minimal_options)
                    print("[OK] Chrome configurado (minimalista)")
                    return True
                except Exception as e3:
                    print(f"[ERRO] Chrome minimalista também falhou: {e3}")
                    return False

    def login(self):
        """Fazer login no HikCentral"""
        url = os.getenv('HIKCENTRAL_URL')
        username = os.getenv('HIKCENTRAL_USERNAME')
        password = os.getenv('HIKCENTRAL_PASSWORD')
        
        print(f"[LOGIN] Fazendo login em {url}...")
        
        try:
            self.driver.get(url)
            print("[WAIT] Aguardando página carregar completamente...")
            time.sleep(10)  # Aumentado para ambientes lentos
            
            # Login usando IDs com wait explícito
            print("[LOGIN] Procurando campo username...")
            username_field = WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.ID, "username"))
            )
            password_field = self.driver.find_element(By.ID, "password")
            print("[OK] Campos de login encontrados!")
            
            # Preencher usuário
            username_field.clear()
            for char in username:
                username_field.send_keys(char)
                time.sleep(0.1)
            time.sleep(1)
            
            # Preencher senha
            password_field.clear()
            for char in password:
                password_field.send_keys(char)
                time.sleep(0.1)
            time.sleep(1)
            
            # Clicar login
            login_btn = self.driver.find_element(By.CSS_SELECTOR, ".login-btn")
            login_btn.click()
            print("[OK] Login realizado!")
            
            # Aguardar carregamento
            print("[WAIT] Aguardando carregamento da página principal...")
            time.sleep(8)  # Aumentado para ambiente corporativo
            
            return True
            
        except Exception as e:
            print(f"[ERRO] Erro no login: {e}")
            return False
    
    def navigate_to_form(self):
        """Navegar para formulário - EXATAMENTE COMO FUNCIONAVA"""
        print("[NAV] Navegando para formulário...")
        
        try:
            # Procurar elemento Visitante com wait explícito
            print("[NAV] Procurando menu 'Visitante'...")
            
            # Aguardar a página carregar completamente
            print("[WAIT] Aguardando interface carregar...")
            time.sleep(5)
            
            # Tentar múltiplas estratégias para encontrar Visitante
            visitante_found = False
            strategies = [
                "//*[contains(text(), 'Visitante')]",
                "//span[contains(text(), 'Visitante')]",
                "//div[contains(text(), 'Visitante')]",
                "//*[@title='Visitante']",
                "//li[contains(text(), 'Visitante')]"
            ]
            
            for strategy in strategies:
                try:
                    print(f"[DEBUG] Tentando estratégia: {strategy}")
                    visitante_elements = WebDriverWait(self.driver, 10).until(
                        lambda driver: driver.find_elements(By.XPATH, strategy)
                    )
                    
                    if len(visitante_elements) >= 1:
                        print(f"[OK] Encontrados {len(visitante_elements)} elementos com 'Visitante' usando {strategy}")
                        # Tentar clicar no último elemento encontrado (geralmente o correto)
                        target_element = visitante_elements[-1] if len(visitante_elements) > 1 else visitante_elements[0]
                        
                        # Scroll para o elemento
                        self.driver.execute_script("arguments[0].scrollIntoView(true);", target_element)
                        time.sleep(1)
                        
                        target_element.click()
                        print("[OK] Clicado em 'Visitante'")
                        time.sleep(5)
                        visitante_found = True
                        break
                except Exception as e:
                    print(f"[DEBUG] Estratégia {strategy} falhou: {e}")
                    continue
            
            if not visitante_found:
                print("[ERRO] Elemento 'Visitante' não encontrado com nenhuma estratégia")
                return False
            
            # Aguardar submenu carregar
            print("[WAIT] Aguardando submenu carregar...")
            time.sleep(5)
            
            # Clicar em "Entrada de visitante" na lista central - CÓDIGO ORIGINAL
            print("[NAV] Clicando em 'Entrada de visitante' na lista central...")
            entrada_central = self.driver.find_element(By.CSS_SELECTOR, "div[title='Entrada de visitante'].guide-step-name")
            if entrada_central:
                entrada_central.click()
                print("[OK] Clicado em 'Entrada de visitante' na lista central!")
                time.sleep(1)  # Otimizado para 1s
            else:
                print("[ERRO] 'Entrada de visitante' não encontrado na lista central")
                return False
            
            # Clicar novamente no menu para remover tooltip - CÓDIGO ORIGINAL
            print("[FIX] Clicando novamente no menu para remover tooltip...")
            try:
                entrada_sidebar = self.driver.find_element(By.XPATH, "//span[text()='Entrada de visitante']")
                entrada_sidebar.click()
                print("[OK] Tooltip removido!")
                time.sleep(1)  # Otimizado
            except Exception as e:
                print(f"[WARN] Erro ao remover tooltip: {e}")
            
            # PASSO CRÍTICO: Clicar em "Entrada de visitante não reservada" - CÓDIGO ORIGINAL
            print("[NAV] Procurando 'Entrada de visitante não reservada'...")
            try:
                # Procurar pelo span específico
                span_nao_reservada = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, "//span[text()='Entrada de visitante não reservada']"))
                )
                
                print("[OK] 'Entrada de visitante não reservada' encontrado!")
                
                # Scroll para o elemento
                self.driver.execute_script("arguments[0].scrollIntoView(true);", span_nao_reservada)
                time.sleep(2)
                
                # ESTRATÉGIA 1: Tentar clicar normalmente
                try:
                    span_nao_reservada.click()
                    print("[OK] Clicado em 'Entrada de visitante não reservada' (normal)!")
                    time.sleep(2)  # Otimizado de 5s para 2s
                except Exception as e:
                    print(f"[WARN] Clique normal falhou: {e}")
                    
                    # ESTRATÉGIA 2: Clique com JavaScript
                    try:
                        self.driver.execute_script("arguments[0].click();", span_nao_reservada)
                        print("[OK] Clicado em 'Entrada de visitante não reservada' (JavaScript)!")
                        time.sleep(2)  # Otimizado de 5s para 2s
                    except Exception as e2:
                        print(f"[WARN] Clique JavaScript falhou: {e2}")
            
            except Exception as e:
                print(f"[ERRO] 'Entrada de visitante não reservada' não encontrado: {e}")
                return False
            
            # Aguardar formulário carregar
            print("[WAIT] Aguardando formulário de cadastro carregar...")
            time.sleep(2)  # Otimizado de 5s para 2s
            
            # FECHAR MESSAGE BOX SE EXISTIR
            print("[FIX] Verificando se há message box para fechar...")
            try:
                # Procurar pela message box wrapper
                message_box = self.driver.find_element(By.CSS_SELECTOR, ".el-message-box__wrapper")
                if message_box.is_displayed():
                    print("[FOUND] Message box encontrada, tentando fechar...")
                    
                    # Estratégias para fechar a message box
                    close_selectors = [
                        "//span[contains(text(), 'OK')]",
                        "//span[contains(text(), 'Confirmar')]", 
                        "//span[contains(text(), 'Fechar')]",
                        "//span[contains(text(), 'Instalar')]",
                        "//button[contains(@class, 'el-button--primary')]",
                        ".el-message-box__btns .el-button--primary",
                        ".el-message-box__close"
                    ]
                    
                    box_closed = False
                    for selector in close_selectors:
                        try:
                            if selector.startswith("//"):
                                close_btn = self.driver.find_element(By.XPATH, selector)
                            else:
                                close_btn = self.driver.find_element(By.CSS_SELECTOR, selector)
                            
                            if close_btn.is_displayed() and close_btn.is_enabled():
                                close_btn.click()
                                print(f"[OK] Message box fechada com: {selector}")
                                time.sleep(2)
                                box_closed = True
                                break
                        except:
                            continue
                    
                    if not box_closed:
                        # Último recurso: ESC ou clique fora
                        try:
                            from selenium.webdriver.common.keys import Keys
                            self.driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
                            print("[OK] Message box fechada com ESC")
                            time.sleep(2)
                        except:
                            print("[WARN] Não foi possível fechar message box")
                else:
                    print("[INFO] Nenhuma message box encontrada")
            except:
                print("[INFO] Nenhuma message box para fechar")
            
            print("[SUCCESS] Navegação concluída - formulário de cadastro aberto!")
            return True
            
        except Exception as e:
            print(f"[ERRO] Erro na navegação: {e}")
            return False
    
    def debug_form_fields(self):
        """Debug dos campos do formulário"""
        print("\n" + "="*80)
        print("[DEBUG] ANALISANDO CAMPOS DO FORMULÁRIO")
        print("="*80)
        
        try:
            # Aguardar formulário carregar
            time.sleep(5)
            
            # Procurar todos os inputs
            all_inputs = self.driver.find_elements(By.TAG_NAME, "input")
            print(f"\n[INFO] Total de inputs encontrados: {len(all_inputs)}")
            
            relevant_fields = []
            
            for i, input_elem in enumerate(all_inputs):
                try:
                    input_type = input_elem.get_attribute("type") or "text"
                    input_id = input_elem.get_attribute("id") or "N/A"
                    input_name = input_elem.get_attribute("name") or "N/A"
                    input_class = input_elem.get_attribute("class") or "N/A"
                    input_placeholder = input_elem.get_attribute("placeholder") or "N/A"
                    input_tips = input_elem.get_attribute("tips") or "N/A"
                    input_maxlength = input_elem.get_attribute("maxlength") or "N/A"
                    is_displayed = input_elem.is_displayed()
                    is_enabled = input_elem.is_enabled()
                    
                    # Verificar se é campo relevante (mais abrangente)
                    relevant_keywords = ['nome', 'apelido', 'telefone', 'rg', 'placa', 'phone', 'name', 'el-input__inner']
                    is_relevant = any(keyword.lower() in str(attr).lower() 
                                    for attr in [input_id, input_name, input_class, input_placeholder, input_tips]
                                    for keyword in relevant_keywords)
                    
                    # Verificar se tem maxlength específico (campos de formulário) OU classe el-input__inner
                    is_form_field = (input_maxlength in ['255', '32', '128'] and is_displayed and is_enabled) or \
                                   ('el-input__inner' in input_class and is_displayed and is_enabled)
                    
                    if is_relevant or is_form_field or input_type == "radio":
                        print(f"\n[FIELD {i+1:02d}] [RELEVANTE]")
                        print(f"  Type: {input_type}")
                        print(f"  ID: {input_id}")
                        print(f"  Name: {input_name}")
                        print(f"  Class: {input_class}")
                        print(f"  Placeholder: {input_placeholder}")
                        print(f"  Tips: {input_tips}")
                        print(f"  MaxLength: {input_maxlength}")
                        print(f"  Displayed: {is_displayed}")
                        print(f"  Enabled: {is_enabled}")
                        
                        if input_type == "radio":
                            radio_value = input_elem.get_attribute("value") or "N/A"
                            print(f"  Radio Value: {radio_value}")
                            try:
                                parent = input_elem.find_element(By.XPATH, "./..")
                                label_text = parent.text.strip()
                                print(f"  Label: {label_text}")
                            except:
                                pass
                        
                        relevant_fields.append({
                            'index': i,
                            'type': input_type,
                            'selector': f"input:nth-of-type({i+1})",
                            'maxlength': input_maxlength,
                            'tips': input_tips,
                            'placeholder': input_placeholder
                        })
                
                except Exception as e:
                    print(f"[WARN] Erro ao analisar input {i+1}: {e}")
            
            # Resumo dos campos importantes
            print(f"\n" + "="*80)
            print("[RESUMO] CAMPOS IMPORTANTES")
            print("="*80)
            
            maxlength_255 = [f for f in relevant_fields if f['maxlength'] == '255']
            maxlength_32 = [f for f in relevant_fields if f['maxlength'] == '32']
            maxlength_128 = [f for f in relevant_fields if f['maxlength'] == '128']
            radio_fields = [f for f in relevant_fields if f['type'] == 'radio']
            
            print(f"\n[CAMPOS] MaxLength=255 (Nome/Apelido): {len(maxlength_255)}")
            for field in maxlength_255:
                print(f"  - Campo {field['index']}: {field['tips']}")
            
            print(f"\n[CAMPOS] MaxLength=32 (Telefone): {len(maxlength_32)}")
            for field in maxlength_32:
                print(f"  - Campo {field['index']}: {field['tips']}")
            
            print(f"\n[CAMPOS] MaxLength=128 (RG/Placa): {len(maxlength_128)}")
            for field in maxlength_128:
                print(f"  - Campo {field['index']}: {field['tips']}")
            
            print(f"\n[CAMPOS] Radio Buttons (Genero): {len(radio_fields)}")
            for field in radio_fields:
                print(f"  - Campo {field['index']}: Radio")
            
        except Exception as e:
            print(f"[ERRO] Erro no debug: {e}")
    
    def close_any_message_box(self):
        """Fechar qualquer message box que possa estar aberta"""
        try:
            message_box = self.driver.find_element(By.CSS_SELECTOR, ".el-message-box__wrapper")
            if message_box.is_displayed():
                print("[FIX] Fechando message box interceptadora...")
                
                close_selectors = [
                    "//span[contains(text(), 'OK')]",
                    "//span[contains(text(), 'Confirmar')]", 
                    "//span[contains(text(), 'Fechar')]",
                    "//span[contains(text(), 'Instalar')]",
                    "//button[contains(@class, 'el-button--primary')]",
                    ".el-message-box__btns .el-button--primary",
                    ".el-message-box__close"
                ]
                
                for selector in close_selectors:
                    try:
                        if selector.startswith("//"):
                            close_btn = self.driver.find_element(By.XPATH, selector)
                        else:
                            close_btn = self.driver.find_element(By.CSS_SELECTOR, selector)
                        
                        if close_btn.is_displayed() and close_btn.is_enabled():
                            close_btn.click()
                            print(f"[OK] Message box fechada!")
                            time.sleep(2)
                            return True
                    except:
                        continue
                
                # Último recurso: ESC
                try:
                    from selenium.webdriver.common.keys import Keys
                    self.driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
                    print("[OK] Message box fechada com ESC")
                    time.sleep(2)
                    return True
                except:
                    pass
        except:
            pass
        return False

    def test_field_filling(self):
        """Testar preenchimento dos campos"""
        print("\n" + "="*80)
        print("[TESTE] PREENCHIMENTO DOS CAMPOS")
        print("="*80)
        
        try:
            # Aguardar formulário carregar
            time.sleep(1)  # Otimizado
            
            # Fechar qualquer message box
            self.close_any_message_box()
            
            # UPLOAD DE FOTO - Primeiro, fazer upload na aba "Informação básica"
            print("\n[TEST] Tentando upload de foto PRIMEIRO...")
            photo_path = self.visitor_data.get('photo_path', '')
            if photo_path and os.path.exists(photo_path):
                try:
                    # Verificar se o canvas de foto está visível (já estamos na aba básica)
                    try:
                        canvas = self.driver.find_element(By.CSS_SELECTOR, "canvas#imgCanvas.bg-photo_canvas")
                        if canvas.is_displayed():
                            print("[OK] Canvas de foto está visível!")
                        else:
                            print("[WARN] Canvas de foto não está visível")
                    except:
                        print("[WARN] Canvas de foto não encontrado")
                        
                    # Procurar primeiro a área/elemento que ativa o upload (lado direito do canvas)
                    print("[DEBUG] Primeiro, tentando ativar área de upload...")
                    
                    # Elementos que podem ativar o upload (área clicável)
                    trigger_selectors = [
                        "//canvas[@id='imgCanvas']",  # O próprio canvas
                        "//canvas[@id='imgCanvas']/..",  # Container do canvas
                        "//canvas[contains(@class, 'bg-photo_canvas')]/..",  # Container do canvas
                        "//div[contains(@class, 'photo') or contains(@class, 'upload') or contains(@class, 'image')]",
                        "//div[contains(@style, 'cursor')]",  # Divs com cursor especial
                        "[data-v-408cd0f7]"  # Elementos com o data-v específico
                    ]
                    
                    upload_activated = False
                    for trigger_selector in trigger_selectors:
                        try:
                            print(f"[DEBUG] Tentando ativar com: {trigger_selector}")
                            if trigger_selector.startswith("//"):
                                trigger_elements = self.driver.find_elements(By.XPATH, trigger_selector)
                            else:
                                trigger_elements = self.driver.find_elements(By.CSS_SELECTOR, trigger_selector)
                            
                            for trigger in trigger_elements:
                                if trigger.is_displayed():
                                    # Mover mouse para o elemento (hover)
                                    from selenium.webdriver.common.action_chains import ActionChains
                                    ActionChains(self.driver).move_to_element(trigger).perform()
                                    time.sleep(1)
                                    
                                    # Tentar clicar
                                    try:
                                        trigger.click()
                                        print(f"[OK] Área de upload ativada com: {trigger_selector}")
                                        upload_activated = True
                                        time.sleep(2)
                                        break
                                    except:
                                        continue
                            
                            if upload_activated:
                                break
                        except Exception as e:
                            print(f"[DEBUG] Erro ao ativar com {trigger_selector}: {e}")
                            continue
                    
                    # Agora procurar o input file que deve estar visível
                    upload_selectors = [
                        "input.btn-file[type='file'][accept*='image']",
                        "input[data-v-408cd0f7][type='file']",
                        "input[type='file']"
                    ]
                    
                    upload_element = None
                    print("[DEBUG] Procurando elemento de upload na aba básica...")
                    for selector in upload_selectors:
                        try:
                            print(f"[DEBUG] Tentando seletor: {selector}")
                            if selector.startswith("//"):
                                elements = self.driver.find_elements(By.XPATH, selector)
                            else:
                                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                            
                            print(f"[DEBUG] Encontrados {len(elements)} elementos")
                            for i, element in enumerate(elements):
                                print(f"[DEBUG] Elemento {i+1}: displayed={element.is_displayed()}, enabled={element.is_enabled()}")
                                if element.is_displayed():
                                    upload_element = element
                                    print(f"[OK] Elemento de upload encontrado com: {selector}")
                                    break
                            
                            if upload_element:
                                break
                        except Exception as e:
                            print(f"[DEBUG] Erro com seletor {selector}: {e}")
                            continue
                    
                    if upload_element:
                        # Enviar foto
                        upload_element.send_keys(photo_path)
                        print(f"[OK] Foto enviada: {photo_path}")
                        time.sleep(3)
                    else:
                        # ESTRATÉGIA ALTERNATIVA: Usar o primeiro input file encontrado, mesmo que invisível
                        print("[DEBUG] Tentando usar input file invisível...")
                        try:
                            all_file_inputs = self.driver.find_elements(By.CSS_SELECTOR, "input[type='file']")
                            if all_file_inputs:
                                # Usar o primeiro input file, mesmo que invisível
                                first_file_input = all_file_inputs[0]
                                print(f"[DEBUG] Usando input file invisível: enabled={first_file_input.is_enabled()}")
                                
                                # Forçar envio mesmo invisível
                                first_file_input.send_keys(photo_path)
                                print(f"[OK] Foto enviada via input invisível: {photo_path}")
                                time.sleep(3)
                                upload_element = first_file_input  # Para continuar com o resto do processo
                            else:
                                print("[WARN] Nenhum input file encontrado")
                        except Exception as e:
                            print(f"[WARN] Erro ao usar input invisível: {e}")
                    
                    # Tentar encontrar e clicar botão "Guardar" após upload (se alguma foto foi enviada)
                    if upload_element:
                        print("[DEBUG] Procurando botão 'Guardar' no modal...")
                        
                        # Aguardar um pouco para o modal carregar completamente
                        time.sleep(3)
                        
                        # Primeiro tentar rolar para baixo no modal para ver o botão
                        try:
                            self.driver.execute_script("window.scrollBy(0, 200);")  # Rolar página para baixo
                            time.sleep(1)
                            print("[OK] Página rolada para baixo")
                        except:
                            pass
                        
                        guardar_selectors = [
                            "button[data-v-408cd0f7][title='Guardar'].el-button.el-button--primary",  # Seletor exato fornecido
                            "//button[@data-v-408cd0f7 and @title='Guardar']//span[text()='Guardar']",  # XPath específico
                            "//button[contains(@class, 'el-button--primary')]//span[text()='Guardar']",  # Botão primário com texto
                            "//span[text()='Guardar']",  # Fallback para o span
                            "//button[contains(@title, 'Guardar')]"  # Botão com title
                        ]
                        
                        guardar_found = False
                        for selector in guardar_selectors:
                            try:
                                print(f"[DEBUG] Tentando seletor Guardar: {selector}")
                                if selector.startswith("//"):
                                    guardar_btn = self.driver.find_element(By.XPATH, selector)
                                else:
                                    guardar_btn = self.driver.find_element(By.CSS_SELECTOR, selector)
                                
                                print(f"[DEBUG] Botão encontrado: displayed={guardar_btn.is_displayed()}, enabled={guardar_btn.is_enabled()}")
                                
                                if guardar_btn.is_displayed() and guardar_btn.is_enabled():
                                    # Scroll para o botão se necessário
                                    self.driver.execute_script("arguments[0].scrollIntoView(true);", guardar_btn)
                                    time.sleep(1)
                                    
                                    guardar_btn.click()
                                    print("[OK] Botão 'Guardar' clicado após upload!")
                                    guardar_found = True
                                    time.sleep(2)
                                    break
                            except Exception as e:
                                print(f"[DEBUG] Erro com seletor {selector}: {e}")
                                continue
                        
                        if not guardar_found:
                            print("[WARN] Botão 'Guardar' não encontrado ou não clicável")
                    else:
                        print("[WARN] Elemento de upload não encontrado")
                        
                except Exception as e:
                    print(f"[WARN] Erro no upload de foto: {e}")
            else:
                print("[INFO] Nenhuma foto para upload ou arquivo não existe")
            
            # NOME - Primeiro campo visível do formulário
            print("\n[TEST] Testando preenchimento do NOME...")
            # Tentar 'nome' primeiro, depois 'name' como fallback
            nome_completo = self.visitor_data.get('nome', '') or self.visitor_data.get('name', '')
            nome_value = nome_completo.split(' ')[0] if nome_completo else ''
            print(f"[DEBUG] Nome completo recebido: '{nome_completo}'")
            print(f"[DEBUG] Primeiro nome extraído: '{nome_value}'")
            if nome_value:
                try:
                    # Estratégias múltiplas para encontrar campo nome
                    nome_selectors = [
                        "input[maxlength='255']:first-of-type",
                        ".el-input__inner:first-of-type",
                        "input[placeholder*='nome']",
                        "input[placeholder*='Nome']",
                        "input.el-input__inner[type='text']:first-of-type"
                    ]
                    
                    nome_field = None
                    for selector in nome_selectors:
                        try:
                            fields = self.driver.find_elements(By.CSS_SELECTOR, selector)
                            for field in fields:
                                if field.is_displayed() and field.is_enabled():
                                    nome_field = field
                                    print(f"[OK] Campo nome encontrado com: {selector}")
                                    break
                            if nome_field:
                                break
                        except:
                            continue
                    
                    if nome_field:
                        
                        # Scroll e foco
                        self.driver.execute_script("arguments[0].scrollIntoView(true);", nome_field)
                        time.sleep(1)
                        
                        # Tentar clicar, se interceptar, fechar message box
                        try:
                            nome_field.click()
                        except Exception as e:
                            if "click intercepted" in str(e):
                                print("[FIX] Clique interceptado, fechando message box...")
                                self.close_any_message_box()
                                time.sleep(1)
                                nome_field.click()
                            else:
                                raise e
                        
                        nome_field.clear()
                        time.sleep(0.5)
                        
                        # Digitar caractere por caractere
                        for char in nome_value:
                            nome_field.send_keys(char)
                            time.sleep(0.1)
                        
                        print(f"[OK] Nome testado: {nome_value}")
                        time.sleep(0.5)  # Otimizado
                    else:
                        print("[WARN] Campo nome não encontrado")
                except Exception as e:
                    print(f"[WARN] Erro ao testar nome: {e}")
            
            # APELIDO - Campo com ID="myDiv"
            print("\n[TEST] Testando preenchimento do APELIDO...")
            # Tentar 'nome' primeiro, depois 'name' como fallback
            nome_completo = self.visitor_data.get('nome', '') or self.visitor_data.get('name', '')
            print(f"[DEBUG] Nome completo para apelido: '{nome_completo}'")
            if ' ' in nome_completo:
                apelido_value = nome_completo.split(' ', 1)[1]
                print(f"[DEBUG] Apelido extraído: '{apelido_value}'")
                try:
                    # Procurar campo apelido pelo ID específico
                    apelido_field = self.driver.find_element(By.CSS_SELECTOR, "input[id='myDiv'].el-input__inner")
                    
                    if apelido_field.is_displayed() and apelido_field.is_enabled():
                        # Scroll e foco
                        self.driver.execute_script("arguments[0].scrollIntoView(true);", apelido_field)
                        time.sleep(1)
                        
                        # Tentar clicar, se interceptar, fechar message box
                        try:
                            apelido_field.click()
                        except Exception as e:
                            if "click intercepted" in str(e):
                                print("[FIX] Clique interceptado no apelido, fechando message box...")
                                self.close_any_message_box()
                                time.sleep(1)
                                apelido_field.click()
                            else:
                                raise e
                        
                        apelido_field.clear()
                        time.sleep(0.5)
                        
                        # Digitar caractere por caractere
                        for char in apelido_value:
                            apelido_field.send_keys(char)
                            time.sleep(0.1)
                        
                        print(f"[OK] Apelido testado: {apelido_value}")
                        time.sleep(0.5)  # Otimizado
                    else:
                        print("[WARN] Campo apelido não visível/habilitado")
                except Exception as e:
                    print(f"[WARN] Erro ao testar apelido: {e}")
            
            # VISITADO - Nome do morador ⭐ NOVO!
            self.preencher_campo_visitado()
            
            # OBJETIVO DA VISITA - Dropdown
            print("\n[TEST] Selecionando objetivo da visita...")
            try:
                # Fechar qualquer elemento que possa interceptar
                self.close_any_message_box()
                time.sleep(1)
                
                # Procurar dropdown Objetivo da Visita
                objetivo_dropdown = WebDriverWait(self.driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, "//span[text()='Objetivo da Visita']/../following-sibling::*//*[@class='el-input__inner']"))
                )
                
                # Scroll para elemento
                self.driver.execute_script("arguments[0].scrollIntoView(true);", objetivo_dropdown)
                time.sleep(1)
                
                # Tentar clique normal primeiro
                try:
                    objetivo_dropdown.click()
                except Exception as e:
                    if "click intercepted" in str(e):
                        print("[FIX] Clique interceptado no objetivo, usando JavaScript...")
                        self.driver.execute_script("arguments[0].click();", objetivo_dropdown)
                    else:
                        raise e
                        
                time.sleep(2)
                
                # Selecionar "Fazer passeio e visita" usando seletor exato
                try:
                    objetivo_option = WebDriverWait(self.driver, 5).until(
                        EC.element_to_be_clickable((By.XPATH, "//li[contains(@class, 'el-select-dropdown__item')]//span[contains(text(), 'Fazer passeio e visita')]"))
                    )
                    objetivo_option.click()
                    print("[OK] Objetivo da visita selecionado: Fazer passeio e visita")
                    time.sleep(0.5)  # Otimizado
                except:
                    # Fallback: Business
                    try:
                        business_option = WebDriverWait(self.driver, 3).until(
                            EC.element_to_be_clickable((By.XPATH, "//li[contains(@class, 'el-select-dropdown__item')]//span[contains(text(), 'Business')]"))
                        )
                        business_option.click()
                        print("[OK] Objetivo da visita selecionado: Business")
                        time.sleep(0.5)  # Otimizado
                    except:
                        print("[WARN] Não foi possível selecionar objetivo da visita")
            except Exception as e:
                print(f"[WARN] Erro ao selecionar objetivo da visita: {e}")
            
            # HORA DE SAÍDA - Configurar duração do visitante ⭐ NOVO!
            self.configurar_duracao_visitante()
            
            # GRUPO DE VISITANTES - Dropdown
            print("\n[TEST] Selecionando grupo de visitantes...")
            try:
                # Fechar qualquer elemento que possa interceptar
                self.close_any_message_box()
                time.sleep(1)
                
                # Procurar dropdown Grupo de visitantes
                grupo_dropdown = WebDriverWait(self.driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, "//span[text()='Grupo de visitantes']/../following-sibling::*//*[@class='el-input__inner']"))
                )
                
                # Scroll para elemento
                self.driver.execute_script("arguments[0].scrollIntoView(true);", grupo_dropdown)
                time.sleep(1)
                
                # Tentar clique normal primeiro
                try:
                    grupo_dropdown.click()
                except Exception as e:
                    if "click intercepted" in str(e):
                        print("[FIX] Clique interceptado no grupo, usando JavaScript...")
                        self.driver.execute_script("arguments[0].click();", grupo_dropdown)
                    else:
                        raise e
                        
                time.sleep(2)
                
                # Selecionar "VisitanteS" usando seletor exato
                try:
                    grupo_option = WebDriverWait(self.driver, 5).until(
                        EC.element_to_be_clickable((By.XPATH, "//li[contains(@class, 'el-select-dropdown__item')]//span[contains(text(), 'VisitanteS')]"))
                    )
                    grupo_option.click()
                    print("[OK] Grupo de visitantes selecionado: VisitanteS")
                    time.sleep(0.5)  # Otimizado
                except:
                    # Fallback: Corretores
                    try:
                        corretores_option = WebDriverWait(self.driver, 3).until(
                            EC.element_to_be_clickable((By.XPATH, "//li[contains(@class, 'el-select-dropdown__item')]//span[contains(text(), 'Corretores')]"))
                        )
                        corretores_option.click()
                        print("[OK] Grupo de visitantes selecionado: Corretores")
                        time.sleep(0.5)  # Otimizado
                    except:
                        print("[WARN] Não foi possível selecionar grupo de visitantes")
            except Exception as e:
                print(f"[WARN] Erro ao selecionar grupo de visitantes: {e}")
            
            # NAVEGAR PARA "OUTRAS INFORMAÇÕES"
            print("\n[TEST] Navegando para 'Outras informações'...")
            try:
                outras_tab = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, "//span[text()='Outras informações']"))
                )
                outras_tab.click()
                print("[OK] 'Outras informações' clicado!")
                time.sleep(3)
            except Exception as e:
                print(f"[WARN] Erro ao navegar para outras informações: {e}")
            
            # GÊNERO - Radio button com valores corretos
            print("\n[TEST] Testando seleção de GÊNERO...")
            try:
                genero_visitante = self.visitor_data.get('genero', 'Masculino')
                print(f"[INFO] Selecionando gênero: {genero_visitante}")
                
                # Mapear gênero pelos valores do HTML
                gender_map = {
                    'Feminino': '0',
                    'Masculino': '1', 
                    'Desconhecido': '2'
                }
                
                radio_value = gender_map.get(genero_visitante, '1')
                
                # Procurar radio button específico na aba "Outras informações"
                gender_radio = WebDriverWait(self.driver, 5).until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, f"input[type='radio'][value='{radio_value}'].el-radio__original"))
                )
                
                # Clicar usando JavaScript para garantir funcionamento
                self.driver.execute_script("arguments[0].click();", gender_radio)
                print(f"[OK] Gênero {genero_visitante} selecionado!")
                time.sleep(2)
            except Exception as e:
                print(f"[WARN] Erro ao selecionar gênero: {e}")
                # Tentar estratégia alternativa
                try:
                    print("[FALLBACK] Tentando seleção alternativa de gênero...")
                    # Procurar por label do gênero
                    gender_label = WebDriverWait(self.driver, 5).until(
                        EC.element_to_be_clickable((By.XPATH, f"//span[@class='el-radio__label'][text()='{genero_visitante}']"))
                    )
                    gender_label.click()
                    print(f"[OK] Gênero {genero_visitante} selecionado via label!")
                    time.sleep(2)
                except Exception as e2:
                    print(f"[WARN] Estratégia alternativa de gênero falhou: {e2}")
            
            # TELEFONE - Campo específico com tips sobre dígitos e sinais
            print("\n[TEST] Testando preenchimento do TELEFONE...")
            phone_value = self.visitor_data.get('telefone', '') or self.visitor_data.get('phone', '')
            print(f"[DEBUG] Telefone a ser preenchido: '{phone_value}'")
            if phone_value:
                try:
                    # Procurar campo telefone pelo tips específico
                    phone_field = self.driver.find_element(By.CSS_SELECTOR, 
                        "input[tips*='1 a 32 caracteres permitidos, incluindo dígitos e sinais'][maxlength='32'].el-input__inner")
                    
                    if phone_field.is_displayed() and phone_field.is_enabled():
                        # Scroll e foco
                        self.driver.execute_script("arguments[0].scrollIntoView(true);", phone_field)
                        time.sleep(1)
                        
                        # Tentar clicar, se interceptar, fechar message box
                        try:
                            phone_field.click()
                        except Exception as e:
                            if "click intercepted" in str(e):
                                print("[FIX] Clique interceptado no telefone, fechando message box...")
                                self.close_any_message_box()
                                time.sleep(1)
                                phone_field.click()
                            else:
                                raise e
                        
                        phone_field.clear()
                        time.sleep(0.5)
                        
                        # Digitar caractere por caractere
                        for char in phone_value:
                            phone_field.send_keys(char)
                            time.sleep(0.1)
                        
                        print(f"[OK] Telefone testado: {phone_value}")
                        time.sleep(2)
                    else:
                        print("[WARN] Campo telefone não visível/habilitado")
                except Exception as e:
                    print(f"[WARN] Erro ao testar telefone: {e}")
            
            # NAVEGAR PARA "INFORMAÇÃO DE ID" PARA CPF
            print("\n[TEST] Navegando para 'Informação de ID' para CPF...")
            try:
                id_tab = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, "//span[text()='Informação de ID']"))
                )
                id_tab.click()
                print("[OK] 'Informação de ID' clicado!")
                time.sleep(3)
                
                # Preencher CPF no campo "Número de ID" 
                cpf_value = self.visitor_data.get('cpf', '')
                print(f"[DEBUG] CPF a ser preenchido: '{cpf_value}'")
                if cpf_value:
                    try:
                        # Procurar campo pelo ID específico "myDivs"
                        cpf_field = self.driver.find_element(By.CSS_SELECTOR, "input[id='myDivs'].el-input__inner")
                        
                        if cpf_field.is_displayed() and cpf_field.is_enabled():
                            # Scroll e foco
                            self.driver.execute_script("arguments[0].scrollIntoView(true);", cpf_field)
                            time.sleep(1)
                            
                            # Tentar clicar
                            try:
                                cpf_field.click()
                            except Exception as e:
                                if "click intercepted" in str(e):
                                    print("[FIX] Clique interceptado no CPF, fechando message box...")
                                    self.close_any_message_box()
                                    time.sleep(1)
                                    cpf_field.click()
                                else:
                                    raise e
                            
                            cpf_field.clear()
                            time.sleep(0.5)
                            
                            # Digitar caractere por caractere
                            for char in cpf_value:
                                cpf_field.send_keys(char)
                                time.sleep(0.1)
                            
                            print(f"[OK] CPF preenchido no 'Numero de ID': {cpf_value}")
                            time.sleep(2)
                        else:
                            print("[WARN] Campo Numero de ID não visível/habilitado")
                    except Exception as e:
                        print(f"[WARN] Erro ao preencher CPF: {e}")
                
            except Exception as e:
                print(f"[WARN] Erro ao navegar para informação de ID: {e}")

            # NAVEGAR PARA "INFORMAÇÃO DE ACESSO" PARA RG E PLACA
            print("\n[TEST] Navegando para 'Informação de acesso'...")
            try:
                acesso_tab = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, "//span[text()='Informação de acesso']"))
                )
                acesso_tab.click()
                print("[OK] 'Informação de acesso' clicado!")
                time.sleep(3)
            except Exception as e:
                print(f"[WARN] Erro ao navegar para informação de acesso: {e}")
            
            # CLICAR EM EXPANDIR
            print("\n[TEST] Clicando em 'Expandir'...")
            try:
                # Procurar pelo ícone de expandir
                expandir_icon = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, "i.h-icon-angles_down_sm"))
                )
                
                # Scroll para o elemento
                self.driver.execute_script("arguments[0].scrollIntoView(true);", expandir_icon)
                time.sleep(1)
                
                expandir_icon.click()
                print("[OK] 'Expandir' clicado!")
                time.sleep(3)
            except Exception as e:
                print(f"[WARN] Erro ao clicar em expandir: {e}")
            
            # RG - Campo expandido
            print("\n[TEST] Testando preenchimento do RG...")
            rg_value = self.visitor_data.get('rg', '')
            if rg_value:
                try:
                    # Procurar campo RG pelo tips específico
                    rg_field = self.driver.find_element(By.CSS_SELECTOR, 
                        "input[tips*='Intervalo: [0 a 128] não é possível introduzir carateres'][maxlength='128'].el-input__inner")
                    
                    if rg_field.is_displayed() and rg_field.is_enabled():
                        # Scroll e foco
                        self.driver.execute_script("arguments[0].scrollIntoView(true);", rg_field)
                        time.sleep(1)
                        
                        # Tentar clicar, se interceptar, fechar message box
                        try:
                            rg_field.click()
                        except Exception as e:
                            if "click intercepted" in str(e):
                                print("[FIX] Clique interceptado no RG, fechando message box...")
                                self.close_any_message_box()
                                time.sleep(1)
                                rg_field.click()
                            else:
                                raise e
                        
                        rg_field.clear()
                        time.sleep(0.5)
                        
                        # Digitar caractere por caractere
                        for char in rg_value:
                            rg_field.send_keys(char)
                            time.sleep(0.1)
                        
                        print(f"[OK] RG testado: {rg_value}")
                        time.sleep(2)
                    else:
                        print("[WARN] Campo RG não visível/habilitado")
                except Exception as e:
                    print(f"[WARN] Erro ao testar RG: {e}")
            
            # PLACA DO VEÍCULO - Segundo campo expandido
            print("\n[TEST] Testando preenchimento da PLACA DO VEÍCULO...")
            placa_value = self.visitor_data.get('placa', '')
            if placa_value:
                try:
                    # Procurar campo placa - deve ser o segundo campo maxlength=128 ou pelo label específico
                    placa_selectors = [
                        "//span[text()='PLACA VEICULO']/../..//input[@maxlength='128']",
                        "input[maxlength='128'].el-input__inner:nth-of-type(2)"
                    ]
                    
                    placa_field = None
                    for selector in placa_selectors:
                        try:
                            if selector.startswith("//"):
                                placa_field = self.driver.find_element(By.XPATH, selector)
                            else:
                                placa_field = self.driver.find_element(By.CSS_SELECTOR, selector)
                            
                            if placa_field.is_displayed() and placa_field.is_enabled():
                                print(f"[OK] Campo placa encontrado com: {selector}")
                                break
                        except:
                            continue
                    
                    if placa_field:
                        # Scroll e foco
                        self.driver.execute_script("arguments[0].scrollIntoView(true);", placa_field)
                        time.sleep(1)
                        
                        # Tentar clicar, se interceptar, fechar message box
                        try:
                            placa_field.click()
                        except Exception as e:
                            if "click intercepted" in str(e):
                                print("[FIX] Clique interceptado na placa, fechando message box...")
                                self.close_any_message_box()
                                time.sleep(1)
                                placa_field.click()
                            else:
                                raise e
                        
                        placa_field.clear()
                        time.sleep(0.5)
                        
                        # Digitar caractere por caractere
                        for char in placa_value:
                            placa_field.send_keys(char)
                            time.sleep(0.1)
                        
                        print(f"[OK] Placa testada: {placa_value}")
                        time.sleep(2)
                    else:
                        print("[WARN] Campo placa não encontrado")
                except Exception as e:
                    print(f"[WARN] Erro ao testar placa: {e}")
            


            print("\n[OK] TESTE DE PREENCHIMENTO CONCLUIDO!")
            print("Processo otimizado - finalizando rapidamente...")
            time.sleep(1)  # Otimizado de 30s para 1s
            
        except Exception as e:
            print(f"[ERRO] Erro no teste de preenchimento: {e}")
    
    def run_test(self):
        """Executar teste completo"""
        print("\n[INICIO] INICIANDO TESTE DIRETO DO FORMULARIO")
        print("="*60)
        
        try:
            # Setup
            if not self.setup_driver():
                return False
            
            # Login
            if not self.login():
                return False
            
            # Navegar para formulário
            if not self.navigate_to_form():
                return False
            
            # Debug dos campos
            self.debug_form_fields()
            
            # Testar preenchimento
            self.test_field_filling()
            
            # ============ FINALIZAR CADASTRO - BOTÃO ENTRADA OTIMIZADO ============
            print("[FINAL] Clicando no botão Entrada para finalizar cadastro...")
            try:
                # Rolar para baixo para ver o botão
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(0.3)  # Reduzido de 1s para 0.3s
                
                # Encontrar e clicar no botão Entrada - TIMEOUT AGRESSIVO
                entrada_selectors = [
                    "//button[@title='Entrada']//span[text()='Entrada']",
                    "//button[contains(@class, 'btn-primary')]//span[text()='Entrada']",
                    "button[title='Entrada']",
                    "//button[contains(@class, 'el-button--primary') and contains(., 'Entrada')]"
                ]
                
                entrada_clicked = False
                for selector in entrada_selectors:
                    try:
                        if selector.startswith("//"):
                            entrada_btn = WebDriverWait(self.driver, 1).until(  # Reduzido de 3s para 1s
                                EC.element_to_be_clickable((By.XPATH, selector))
                            )
                        else:
                            entrada_btn = WebDriverWait(self.driver, 1).until(  # Reduzido de 3s para 1s
                                EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                            )
                        
                        # Rolar até o botão
                        self.driver.execute_script("arguments[0].scrollIntoView(true);", entrada_btn)
                        time.sleep(0.1)  # Reduzido de 0.5s para 0.1s
                        
                        # Tentar clicar
                        try:
                            entrada_btn.click()
                        except:
                            self.driver.execute_script("arguments[0].click();", entrada_btn)
                        
                        print(f"[OK] Botão Entrada clicado com sucesso usando: {selector}")
                        entrada_clicked = True
                        break
                        
                    except Exception as e:
                        print(f"[WARN] Selector {selector} não funcionou: {e}")
                        continue
                
                if entrada_clicked:
                    time.sleep(5)  # Aumentado para 5s para estabilizar a página
                    print("[SUCCESS] CADASTRO FINALIZADO COM ENTRADA!")
                    
                # ============ VISUALIZAR E APLICAR AGORA - OTIMIZADO ============
                print("[FINAL] Clicando em Visualizar e Aplicar agora...")
                try:
                    # 1. Clicar em VISUALIZAR no topo - COM TIMEOUT REDUZIDO
                    visualizar_selectors = [
                        "//button[contains(@class, 'el-button--link')]//span[text()='Visualizar']",
                        "//button[@title='']//span[text()='Visualizar']",
                        "//span[text()='Visualizar']/parent::button"
                    ]
                    
                    visualizar_clicked = False
                    for selector in visualizar_selectors:
                        try:
                            visualizar_btn = WebDriverWait(self.driver, 3).until(  # Aumentado para 3s para dar tempo
                                EC.element_to_be_clickable((By.XPATH, selector))
                            )
                            
                            # Rolar para o topo da página
                            self.driver.execute_script("window.scrollTo(0, 0);")
                            time.sleep(0.1)  # Reduzido de 0.3s para 0.1s
                            
                            # Clicar em Visualizar
                            try:
                                visualizar_btn.click()
                            except:
                                self.driver.execute_script("arguments[0].click();", visualizar_btn)
                            
                            print(f"[OK] Botão Visualizar clicado usando: {selector}")
                            visualizar_clicked = True
                            break
                            
                        except Exception as e:
                            print(f"[WARN] Selector Visualizar {selector} falhou: {e}")
                            continue
                    
                    if not visualizar_clicked:
                        print("[WARN] Não foi possível clicar em Visualizar")
                        # Não retorna aqui, continua para tentar Aplicar agora
                    
                    time.sleep(2)  # Aumentado para 2s para dar tempo dos botões carregarem
                    
                    # 2. Clicar em APLICAR AGORA - COM TIMEOUT REDUZIDO
                    aplicar_selectors = [
                        "//button[contains(@class, 'el-button--primary')]//span[text()='Aplicar agora']",
                        "//button[@data-v-3f3e8cbf]//span[text()='Aplicar agora']",
                        "//span[text()='Aplicar agora']/parent::button"
                    ]
                    
                    aplicar_clicked = False
                    for selector in aplicar_selectors:
                        try:
                            aplicar_btn = WebDriverWait(self.driver, 3).until(  # Aumentado para 3s para dar tempo
                                EC.element_to_be_clickable((By.XPATH, selector))
                            )
                            
                            # Clicar em Aplicar agora
                            try:
                                aplicar_btn.click()
                            except:
                                self.driver.execute_script("arguments[0].click();", aplicar_btn)
                            
                            print(f"[OK] Botão Aplicar agora clicado usando: {selector}")
                            aplicar_clicked = True
                            break
                            
                        except Exception as e:
                            print(f"[WARN] Selector Aplicar {selector} falhou: {e}")
                            continue
                    
                    if aplicar_clicked:
                        print("[WAIT] Aguardando aparecer botão Fechar...")
                        time.sleep(3)  # Aguardar botão Fechar aparecer
                        
                        # 3. Clicar em FECHAR
                        fechar_selectors = [
                            "//button[contains(@class, 'el-button--default')]//span[text()='Fechar']",
                            "//button[@title='']//span[text()='Fechar']",
                            "//span[text()='Fechar']/parent::button"
                        ]
                        
                        fechar_clicked = False
                        for selector in fechar_selectors:
                            try:
                                fechar_btn = WebDriverWait(self.driver, 3).until(
                                    EC.element_to_be_clickable((By.XPATH, selector))
                                )
                                
                                # Clicar em Fechar
                                try:
                                    fechar_btn.click()
                                except:
                                    self.driver.execute_script("arguments[0].click();", fechar_btn)
                                
                                print(f"[OK] Botão Fechar clicado usando: {selector}")
                                fechar_clicked = True
                                break
                                
                            except Exception as e:
                                print(f"[WARN] Selector Fechar {selector} falhou: {e}")
                                continue
                        
                        if fechar_clicked:
                            print("[WAIT] Aguardando finalização completa (20s)...")
                            time.sleep(20)  # Aguardar 20 segundos para finalizar
                            print("[SUCCESS] CADASTRO TOTALMENTE FINALIZADO E SINCRONIZADO!")
                        else:
                            print("[WARN] Não foi possível clicar em Fechar, mas cadastro foi aplicado")
                            time.sleep(10)  # Aguardar menos tempo se não conseguir fechar
                    else:
                        print("[WARN] Não foi possível clicar em Aplicar agora")
                        
                except Exception as e:
                    print(f"[ERRO] Erro na finalização com Visualizar/Aplicar: {e}")
                        
                else:
                    print("[WARN] Não foi possível clicar no botão Entrada")
                    
            except Exception as e:
                print(f"[ERRO] Erro ao finalizar com botão Entrada: {e}")
            
            return True
            
        except Exception as e:
            print(f"[ERRO] Erro durante teste: {e}")
            return False
        finally:
            if self.driver:
                self.driver.quit()
            
            # Limpar diretório temporário do Chrome
            if hasattr(self, 'temp_profile'):
                try:
                    import shutil
                    if os.path.exists(self.temp_profile):
                        shutil.rmtree(self.temp_profile, ignore_errors=True)
                        print(f"[CLEANUP] Diretório temporário removido: {self.temp_profile}")
                except Exception as e:
                    print(f"[WARN] Erro ao limpar diretório temporário: {e}")

    def preencher_campo_visitado(self):
        """Preencher campo 'Visitado' com nome do morador"""
        print("\n[TEST] Preenchendo campo VISITADO...")
        
        # Obter nome do morador dos dados do visitante
        morador_nome = self.visitor_data.get('morador_nome', '')
        
        if not morador_nome:
            print("[SKIP] Nenhum nome de morador fornecido")
            return
        
        print(f"[INFO] Preenchendo visitado com: {morador_nome}")
        
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
            
            # 3. LIMPAR CAMPO E DIGITAR NOME DO MORADOR
            visitado_field.clear()
            time.sleep(0.5)
            
            # Digitar apenas os 3 primeiros nomes do morador
            nomes = morador_nome.split(' ')
            nome_busca = ' '.join(nomes[:3])  # Primeiros 3 nomes
            
            print(f"[INFO] Digitando nome para busca: {nome_busca}")
            
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
                # Procurar pelo card do morador na lista de resultados
                morador_selectors = [
                    f"//ul[@class='person-search-panel']//div[@class='ptl-title name-title' and contains(text(), '{nome_busca.upper()}')]",
                    f"//ul[@class='person-search-panel']//div[@class='ptl-title name-title' and contains(text(), '{nome_busca}')]",
                    f"//ul[contains(@class, 'person-search')]//div[contains(@class, 'name-title') and contains(text(), '{nomes[0]}')]"
                ]
                
                morador_card = None
                for selector in morador_selectors:
                    try:
                        card = self.driver.find_element(By.XPATH, selector)
                        if card.is_displayed():
                            # Encontrar o elemento clicável (li pai)
                            morador_card = card.find_element(By.XPATH, "./ancestor::li[contains(@class, 'person-info-search-item-template')]")
                            print(f"[OK] Morador encontrado com: {selector}")
                            break
                    except:
                        continue
                
                if not morador_card:
                    # Fallback: clicar no primeiro resultado
                    try:
                        morador_card = WebDriverWait(self.driver, 3).until(
                            EC.element_to_be_clickable((By.XPATH, "//ul[@class='person-search-panel']//li[contains(@class, 'person-info-search-item-template')][1]"))
                        )
                        print("[OK] Selecionando primeiro resultado da busca")
                    except:
                        print("[ERROR] Nenhum resultado encontrado para o morador")
                        return
                
                # Clicar no card do morador
                self.driver.execute_script("arguments[0].click();", morador_card)
                print(f"[OK] Morador '{nome_busca}' selecionado!")
                time.sleep(2)
                
            except Exception as e:
                print(f"[ERROR] Erro ao selecionar morador: {e}")
                return
                
        except Exception as e:
            print(f"[ERROR] Erro geral ao preencher visitado: {e}")

    def configurar_duracao_visitante(self):
        """Configurar duração do visitante baseada nos dias especificados"""
        print("\n[TEST] Configurando duração do visitante...")
        
        try:
            # Obter duração dos dados do visitante (padrão 1 dia)
            validade_dias = self.visitor_data.get('validade_dias', 1)
            print(f"[DEBUG] visitor_data completo: {self.visitor_data}")
            print(f"[DEBUG] validade_dias lido: '{validade_dias}' (tipo: {type(validade_dias)})")
            print(f"[INFO] Duração solicitada: {validade_dias} dia(s)")
            
            # ⭐ NOVA LÓGICA: Só mexer se for MAIOR que 1 dia
            if int(validade_dias) <= 1:
                print(f"[SKIP] Duração é {validade_dias} dia - mantendo padrão do sistema (1 dia)")
                return
            
            print(f"[INFO] Configurando duração personalizada para {validade_dias} dia(s)")
            
            # Encontrar campo de hora de saída
            data_selectors = [
                "div.el-date-editor.el-input--suffix.el-date-editor--datetime input.el-input__inner",
                "input.el-input__inner[title*='23:59:59']",
                "div.el-date-editor input.el-input__inner",
                ".el-date-editor__icon.h-icon-calendar"
            ]
            
            data_field = None
            for selector in data_selectors:
                try:
                    if "h-icon-calendar" in selector:
                        # Clicar no ícone do calendário
                        calendar_icon = self.driver.find_element(By.CSS_SELECTOR, selector)
                        if calendar_icon.is_displayed():
                            calendar_icon.click()
                            time.sleep(1)
                            # Depois encontrar o input
                            data_field = self.driver.find_element(By.CSS_SELECTOR, "input.el-input__inner[title*='23:59:59']")
                            break
                    else:
                        field = self.driver.find_element(By.CSS_SELECTOR, selector)
                        if field.is_displayed() and field.is_enabled():
                            data_field = field
                            print(f"[OK] Campo de data encontrado com: {selector}")
                            break
                except:
                    continue
            
            if not data_field:
                print("[WARN] Campo de hora de saída não encontrado")
                return
            
            # Scroll para o elemento
            self.driver.execute_script("arguments[0].scrollIntoView(true);", data_field)
            time.sleep(1)
            
            # Clicar no campo para ativar
            try:
                data_field.click()
            except Exception as e:
                if "click intercepted" in str(e):
                    self.close_any_message_box()
                    time.sleep(1)
                    data_field.click()
            
            time.sleep(1)
            
            # Ler data atual do campo para calcular corretamente
            try:
                data_atual_campo = data_field.get_attribute('value') or data_field.get_attribute('title') or ""
                print(f"[DEBUG] Data atual no campo: '{data_atual_campo}'")
                
                # Extrair data base (pode estar no formato 2025/09/12 23:59:59)
                from datetime import datetime, timedelta
                import re
                
                # Procurar padrão de data YYYY/MM/DD
                match = re.search(r'(\d{4})/(\d{2})/(\d{2})', data_atual_campo)
                if match:
                    ano, mes, dia = match.groups()
                    data_base = datetime(int(ano), int(mes), int(dia))
                    print(f"[DEBUG] Data base extraída: {data_base.strftime('%Y/%m/%d')}")
                else:
                    # Fallback: usar data atual
                    data_base = datetime.now()
                    print("[DEBUG] Usando data atual como base")
                
                # Calcular nova data somando os dias
                print(f"[DEBUG] ANTES - Data base: {data_base}")
                print(f"[DEBUG] ANTES - Dias a somar: {validade_dias} (int: {int(validade_dias)})")
                
                data_fim = data_base + timedelta(days=int(validade_dias))
                nova_data = data_fim.strftime("%Y/%m/%d 23:59:59")
                
                print(f"[DEBUG] DEPOIS - Data final: {data_fim}")
                print(f"[INFO] Data base: {data_base.strftime('%Y/%m/%d')}")
                print(f"[INFO] Adicionando {validade_dias} dia(s)")
                print(f"[INFO] Nova data final: {nova_data}")
                
                # Calcular diferença em dias para confirmar
                diferenca = (data_fim - data_base).days
                print(f"[DEBUG] VERIFICAÇÃO - Diferença calculada: {diferenca} dias")
                
            except Exception as e:
                print(f"[WARN] Erro ao calcular data: {e}")
                # Fallback: usar data atual + dias
                from datetime import datetime, timedelta
                data_atual = datetime.now()
                data_fim = data_atual + timedelta(days=int(validade_dias))
                nova_data = data_fim.strftime("%Y/%m/%d 23:59:59")
                print(f"[FALLBACK] Nova data calculada: {nova_data}")
            
            # Múltiplas estratégias para limpar campo
            print("[DEBUG] Tentando limpar campo...")
            
            # Estratégia 1: Selecionar tudo e apagar
            try:
                data_field.send_keys(Keys.CONTROL + "a")
                time.sleep(0.3)
                data_field.send_keys(Keys.BACKSPACE)
                time.sleep(0.3)
                print("[OK] Estratégia 1: Ctrl+A + Backspace")
            except:
                print("[WARN] Estratégia 1 falhou")
            
            # Estratégia 2: Limpar com clear() e JavaScript
            try:
                data_field.clear()
                time.sleep(0.2)
                self.driver.execute_script("arguments[0].value = '';", data_field)
                time.sleep(0.2)
                print("[OK] Estratégia 2: clear() + JavaScript")
            except:
                print("[WARN] Estratégia 2 falhou")
            
            # Estratégia 3: Backspace múltiplo
            try:
                for _ in range(20):  # Apagar até 20 caracteres
                    data_field.send_keys(Keys.BACKSPACE)
                    time.sleep(0.02)
                print("[OK] Estratégia 3: Backspace múltiplo")
            except:
                print("[WARN] Estratégia 3 falhou")
            
            # Verificar se campo está limpo
            valor_atual = data_field.get_attribute('value') or ""
            print(f"[DEBUG] Campo após limpeza: '{valor_atual}'")
            
            # Digitar nova data caractere por caractere
            print(f"[DEBUG] Digitando: {nova_data}")
            for i, char in enumerate(nova_data):
                try:
                    data_field.send_keys(char)
                    time.sleep(0.05)
                except:
                    print(f"[WARN] Erro ao digitar caractere {i}: '{char}'")
            
            time.sleep(0.5)
            valor_final = data_field.get_attribute('value') or ""
            print(f"[DEBUG] Campo após digitação: '{valor_final}'")
            
            # Clicar em área vazia para fechar calendário (lado direito da tela)
            try:
                self.driver.execute_script("document.elementFromPoint(window.innerWidth - 50, 200).click();")
                time.sleep(1)
                print("[OK] Calendário fechado")
            except:
                # Fallback: pressionar Escape
                try:
                    data_field.send_keys(Keys.ESCAPE)
                    time.sleep(1)
                    print("[FALLBACK] Calendário fechado com Escape")
                except:
                    print("[WARN] Não foi possível fechar calendário")
            
            print(f"[OK] Duração configurada para {validade_dias} dia(s) - {nova_data}")
            
        except Exception as e:
            print(f"[WARN] Erro ao configurar duração: {e}")

def main():
    parser = argparse.ArgumentParser(description='Teste direto do formulário HikCentral')
    parser.add_argument('--visitor-data', help='Caminho para JSON com dados do visitante')
    parser.add_argument('--visitor-id', help='ID do visitante')
    parser.add_argument('--headless', action='store_true', help='Executar em modo headless')
    args = parser.parse_args()
    
    # Dados de teste padrão
    visitor_data = {
        'name': 'Maria Santos Oliveira',
        'phone': '11987654321',
        'cpf': '12345678901',
        'rg': '87654321',
        'placa': 'XYZ9876',
        'genero': 'Masculino',
        'morador_nome': 'LUCCA LACERDA',  # ⭐ Nome do morador para associação
        'action': 'create'  # ⭐ Tipo de ação: 'create' ou 'reactivate'
    }
    
    # Se fornecido arquivo, carregar dados
    if args.visitor_data:
        try:
            print(f"[DEBUG] Carregando dados de: {args.visitor_data}")
            with open(args.visitor_data, 'r', encoding='utf-8') as f:
                visitor_data = json.load(f)
            print(f"[DEBUG] Dados carregados: {visitor_data}")
            
            # Verificar campos importantes
            print(f"[DEBUG] Nome: '{visitor_data.get('nome', 'NAO_ENCONTRADO')}'")
            print(f"[DEBUG] Telefone: '{visitor_data.get('telefone', 'NAO_ENCONTRADO')}'")
            print(f"[DEBUG] CPF: '{visitor_data.get('cpf', 'NAO_ENCONTRADO')}'")
            print(f"[DEBUG] RG: '{visitor_data.get('rg', 'NAO_ENCONTRADO')}'")
            print(f"[DEBUG] Placa: '{visitor_data.get('placa', 'NAO_ENCONTRADO')}'")
            print(f"[DEBUG] Genero: '{visitor_data.get('genero', 'NAO_ENCONTRADO')}'")
            
        except Exception as e:
            print(f"[WARN] Erro ao carregar dados: {e}, usando dados padrão")
    
    visitor_id = args.visitor_id or "test-123"
    
    # Carregar credenciais do .env
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except Exception as e:
        print(f"[ERRO] Erro ao carregar .env: {e}")
        return False
    
    # FORÇAR MODO HEADLESS PARA PRODUÇÃO
    print("[FORCE] FORÇANDO MODO HEADLESS PARA PRODUÇÃO")
    tester = HikCentralFormTest(visitor_data, visitor_id, True)
    
    try:
        return tester.run_test()
    except Exception as e:
        print(f"[ERRO] Erro no teste: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
