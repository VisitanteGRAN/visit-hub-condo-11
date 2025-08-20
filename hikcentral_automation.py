#!/usr/bin/env python3
"""
Script Python para automação do HikCentral
Executar localmente na máquina dedicada (Windows/Mac/Linux)
"""

import time
import json
import sys
import platform
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.keys import Keys
from datetime import datetime, timedelta
from selenium.webdriver.common.action_chains import ActionChains
import requests
import os
import tempfile
import subprocess

class HikCentralAutomation:
    def __init__(self, headless=True, simulation_mode=False):
        self.headless = headless
        self.simulation_mode = simulation_mode
        self.driver = None
        self.setup_driver()
    
    def setup_driver(self):
        """Configura o driver do Chrome"""
        try:
            chrome_options = Options()
            
            if self.headless:
                chrome_options.add_argument("--headless")
            
            # CONFIGURAÇÕES MÍNIMAS para evitar conflitos
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            
            # REMOVER user-data-dir para evitar conflitos
            # chrome_options.add_argument(f"--user-data-dir={temp_dir}")
            
            # Configurações básicas de estabilidade
            chrome_options.add_argument("--disable-extensions")
            chrome_options.add_argument("--disable-plugins")
            chrome_options.add_argument("--no-first-run")
            chrome_options.add_argument("--no-default-browser-check")
            
            print("🔧 Configurando Chrome com configurações mínimas...")
            
            # Configurar o driver
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            
            # Executar script para evitar detecção
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
            if self.simulation_mode:
                print("🎭 MODO SIMULAÇÃO ATIVADO - Testando sem HikCentral real")
            else:
                print("🌐 Chrome configurado para Windows")
                
        except Exception as e:
            print(f"❌ Erro ao configurar driver: {e}")
            
            # Tentar fechar processos Chrome existentes
            try:
                print("🔧 Tentando fechar processos Chrome existentes...")
                import subprocess
                subprocess.run(["taskkill", "/f", "/im", "chrome.exe"], capture_output=True)
                subprocess.run(["taskkill", "/f", "/im", "chromedriver.exe"], capture_output=True)
                time.sleep(3)  # Aguardar mais tempo
                print("✅ Processos Chrome fechados, tentando novamente...")
                
                # Tentar com configurações ainda mais simples
                chrome_options = Options()
                if not self.headless:
                    chrome_options.add_argument("--no-sandbox")
                    chrome_options.add_argument("--disable-dev-shm-usage")
                
                print("🔧 Tentando com configurações ultra-simples...")
                service = Service(ChromeDriverManager().install())
                self.driver = webdriver.Chrome(service=service, options=chrome_options)
                self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
                
                if self.simulation_mode:
                    print("🎭 MODO SIMULAÇÃO ATIVADO - Testando sem HikCentral real")
                else:
                    print("🌐 Chrome configurado para Windows")
                    
            except Exception as e2:
                print(f"❌ Falha na segunda tentativa: {e2}")
                
                # ÚLTIMA TENTATIVA: Configurações mínimas absolutas
                try:
                    print("🔧 ÚLTIMA TENTATIVA: Configurações mínimas absolutas...")
                    chrome_options = Options()
                    chrome_options.add_argument("--no-sandbox")
                    
                    service = Service(ChromeDriverManager().install())
                    self.driver = webdriver.Chrome(service=service, options=chrome_options)
                    
                    if self.simulation_mode:
                        print("🎭 MODO SIMULAÇÃO ATIVADO - Testando sem HikCentral real")
                    else:
                        print("🌐 Chrome configurado para Windows")
                        
                except Exception as e3:
                    print(f"❌ Falha na terceira tentativa: {e3}")
                    raise
    
    def close_message_boxes(self):
        """Fecha todas as message boxes visíveis de forma mais robusta"""
        print("🔧 Fechando message boxes...")
        try:
            # Método 1: Procurar por botões OK/Confirmar/Sim
            ok_buttons = self.driver.find_elements(By.XPATH, 
                "//button[contains(text(), 'OK') or contains(text(), 'Confirmar') or contains(text(), 'Sim') or contains(text(), 'OK')]")
            
            for button in ok_buttons:
                if button.is_displayed():
                    try:
                        button.click()
                        print("✅ Message box fechada com botão OK/Confirmar")
                        time.sleep(0.5)
                        return
                    except:
                        continue
            
            # Método 2: Procurar por botão de fechar (X)
            close_buttons = self.driver.find_elements(By.XPATH, 
                "//button[contains(@class, 'close') or contains(@class, 'el-message-box__headerbtn')]")
            
            for button in close_buttons:
                if button.is_displayed():
                    try:
                        button.click()
                        print("✅ Message box fechada com botão X")
                        time.sleep(0.5)
                        return
                    except:
                        continue
            
            # Método 3: Tecla ESC
            try:
                ActionChains(self.driver).send_keys(Keys.ESCAPE).perform()
                print("✅ Message box fechada com ESC")
                time.sleep(0.5)
                return
            except:
                pass
            
            # Método 4: JavaScript para remover/hide message boxes
            try:
                # Remover message boxes via JavaScript
                self.driver.execute_script("""
                    var messageBoxes = document.querySelectorAll('.el-message-box__wrapper, .el-message-box, .el-popover');
                    messageBoxes.forEach(function(box) {
                        box.style.display = 'none';
                        box.remove();
                    });
                """)
                print("✅ Message boxes removidas via JavaScript")
                time.sleep(0.5)
                return
            except:
                pass
            
            # Método 5: JavaScript para hide
            try:
                self.driver.execute_script("""
                    var messageBoxes = document.querySelectorAll('.el-message-box__wrapper, .el-message-box, .el-popover');
                    messageBoxes.forEach(function(box) {
                        box.style.visibility = 'hidden';
                        box.style.opacity = '0';
                    });
                """)
                print("✅ Message boxes escondidas via JavaScript")
                time.sleep(0.5)
                return
            except:
                pass
            
            print("ℹ️ Nenhuma message box encontrada para fechar")
            
        except Exception as e:
            print(f"⚠️ Erro ao fechar message boxes: {e}")
    
    def debug_page_state(self, step_name):
        """Debug do estado da página em cada etapa"""
        if not self.simulation_mode:
            return
            
        print(f"🔍 DEBUG [{step_name}]:")
        try:
            # Verificar message boxes visíveis
            message_boxes = self.driver.find_elements(By.CSS_SELECTOR, ".el-message-box__wrapper, .el-message-box, .el-popover")
            print(f"   📦 Message boxes visíveis: {len(message_boxes)}")
            
            for i, box in enumerate(message_boxes):
                try:
                    text = box.text[:100] if box.text else "Sem texto"
                    visible = box.is_displayed()
                    print(f"      Box {i+1}: Visível={visible}, Texto='{text}'")
                except:
                    print(f"      Box {i+1}: Erro ao analisar")
            
            # Verificar elementos clicáveis
            clickable_elements = self.driver.find_elements(By.CSS_SELECTOR, "button, input, label, span")
            print(f"   🖱️ Elementos clicáveis: {len(clickable_elements)}")
            
        except Exception as e:
            print(f"   ❌ Erro no debug: {e}")
    
    def simulate_hikcentral_page(self):
        """Cria uma página simulada do HikCentral para debug"""
        if not self.simulation_mode:
            return
            
        print("🎭 Criando página simulada do HikCentral...")
        
        # HTML simples para simular o formulário
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>HikCentral Simulado</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .form-group { margin: 10px 0; }
                input, select, button { padding: 8px; margin: 5px; }
                .message-box { background: #f0f0f0; border: 1px solid #ccc; padding: 10px; margin: 10px 0; }
                .hidden { display: none; }
            </style>
        </head>
        <body>
            <h1>🎭 HikCentral Simulado</h1>
            
            <div class="message-box" id="messageBox1">
                <p>⚠️ Mensagem de aviso simulada</p>
                <button onclick="closeMessage('messageBox1')">OK</button>
            </div>
            
            <div class="form-group">
                <label>Nome Próprio:</label>
                <input type="text" maxlength="255" placeholder="Digite o nome">
            </div>
            
            <div class="form-group">
                <label>Apelido:</label>
                <input type="text" id="myDiv" maxlength="255" placeholder="Digite o sobrenome">
            </div>
            
            <div class="form-group">
                <label>Visitado:</label>
                <input type="text" placeholder="Pesquisar" id="searchInput">
                <div id="searchResults" class="hidden">
                    <div class="search-option" onclick="selectOption('Pesquisar por nome da pessoa')">
                        Pesquisar por nome da pessoa
                    </div>
                    <div class="search-option" onclick="selectOption('LUCCA LACERDA')">
                        LUCCA LACERDA
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label>Objetivo:</label>
                <select id="objetivo">
                    <option value="">Selecione um item.</option>
                    <option value="passeio">Fazer passeio e visita</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Grupo:</label>
                <select id="grupo">
                    <option value="">Selecione um item.</option>
                    <option value="visitantes">VisitanteS</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Gênero:</label>
                <input type="radio" name="genero" value="0"> Feminino
                <input type="radio" name="genero" value="1"> Masculino
                <input type="radio" name="genero" value="2" checked> Desconhecido
            </div>
            
            <div class="form-group">
                <label>Telefone:</label>
                <input type="text" maxlength="32" placeholder="Digite o telefone">
            </div>
            
            <div class="form-group">
                <label>RG:</label>
                <input type="text" maxlength="128" placeholder="Digite o RG">
            </div>
            
            <div class="form-group">
                <label>Placa:</label>
                <input type="text" maxlength="128" placeholder="Digite a placa">
            </div>
            
            <button type="button" class="btn-primary" onclick="saveForm()">Entrada</button>
            
            <script>
                function closeMessage(id) {
                    document.getElementById(id).style.display = 'none';
                }
                
                function selectOption(text) {
                    console.log('Opção selecionada:', text);
                    document.getElementById('searchResults').classList.add('hidden');
                }
                
                function saveForm() {
                    alert('🎉 Formulário salvo com sucesso!');
                }
                
                // Simular message box aparecendo
                setInterval(function() {
                    if (Math.random() > 0.7) {
                        var newBox = document.createElement('div');
                        newBox.className = 'message-box';
                        newBox.innerHTML = '<p>⚠️ Nova mensagem simulada</p><button onclick="this.parentElement.style.display=\'none\'">OK</button>';
                        document.body.insertBefore(newBox, document.body.firstChild);
                    }
                }, 3000);
            </script>
        </body>
        </html>
        """
        
        # Salvar HTML em arquivo temporário
        with open("hikcentral_simulado.html", "w", encoding="utf-8") as f:
            f.write(html_content)
        
        # Navegar para a página simulada
        file_path = os.path.abspath("hikcentral_simulado.html")
        self.driver.get(f"file:///{file_path}")
        print("✅ Página simulada carregada")
        time.sleep(2)
    
    def login(self, username, password):
        """Faz login no HikCentral"""
        if self.simulation_mode:
            print("🎭 MODO SIMULAÇÃO: Pulando login")
            return True
            
        try:
            print("🔐 Procurando campos de login...")
            
            # Aguardar campos de login
            username_input = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[id='username']"))
            )
            print("✅ Campo usuário encontrado: input[id='username']")
            
            password_input = self.driver.find_element(By.CSS_SELECTOR, "input[id='password']")
            print("✅ Campo senha encontrado: input[id='password']")
            
            # Preencher credenciais
            print("📝 Preenchendo credenciais...")
            username_input.clear()
            username_input.send_keys(username)
            time.sleep(1)
            
            password_input.clear()
            password_input.send_keys(password)
            time.sleep(1)
            
            # Clicar no botão de login
            login_button = self.driver.find_element(By.CSS_SELECTOR, ".login-btn")
            print("🔘 Botão login encontrado: .login-btn")
            
            login_button.click()
            time.sleep(3)
            
            print("✅ Login realizado com sucesso!")
            return True
            
        except Exception as e:
            print(f"❌ Erro no login: {e}")
            return False
    
    def navigate_to_form(self):
        """Navega até o formulário de visitante"""
        if self.simulation_mode:
            print("🎭 MODO SIMULAÇÃO: Já estamos no formulário")
            return True
            
        try:
            print("🧭 Navegando para o formulário...")
            
            # Procurar elemento 'Visitante'
            print("🔍 Procurando elemento 'Visitante'...")
            visitor_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Visitante')]")
            print(f"🔍 Encontrados {len(visitor_elements)} elementos com 'Visitante'")
            
            if len(visitor_elements) >= 2:
                # Tentar clicar no segundo elemento (índice 1)
                visitor_element = visitor_elements[1]
                print(f"✅ Tentando clicar no elemento 2: '{visitor_element.text}'")
                
                try:
                    visitor_element.click()
                    print("✅ Clique normal realizado!")
                except:
                    # Tentar JavaScript click
                    self.driver.execute_script("arguments[0].click();", visitor_element)
                    print("✅ Clique JavaScript realizado!")
                
                time.sleep(2)
            else:
                print("❌ Elemento 'Visitante' não encontrado")
                return False
            
            # Clicar em 'Entrada de visitante'
            try:
                entrada_visitante = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, "//div[contains(@title, 'Entrada de visitante')]"))
                )
                entrada_visitante.click()
                print("✅ Clicado em 'Entrada de visitante'")
                time.sleep(2)
            except Exception as e:
                print(f"⚠️ Erro ao clicar em 'Entrada de visitante': {e}")
                return False
            
            # Fechar tooltips se existirem
            print("🔧 Tentando fechar tooltips...")
            try:
                tooltip = self.driver.find_element(By.ID, "visitorTips1")
                if tooltip.is_displayed():
                    self.driver.execute_script("arguments[0].style.display = 'none';", tooltip)
                    print("✅ Tooltip fechado")
            except:
                print("ℹ️ Nenhum tooltip encontrado")
            
            # Clicar em 'Entrada de visitante não reservada'
            try:
                unreserved_button = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(@title, 'Entrada de visitante não reservada')]"))
                )
                unreserved_button.click()
                print("✅ Clicado em 'Entrada de visitante não reservada'")
                time.sleep(2)
            except Exception as e:
                print(f"❌ Erro ao clicar em 'Entrada de visitante não reservada': {e}")
                return False
            
            print("✅ Navegação concluída com sucesso!")
            return True
            
        except Exception as e:
            print(f"❌ Erro na navegação: {e}")
            return False
    
    def register_visitor(self, visitor_data):
        """Registra um visitante no HikCentral"""
        try:
            print(f"🚀 Iniciando cadastro do visitante: {visitor_data['name']}")
            
            if self.simulation_mode:
                # MODO SIMULAÇÃO: Criar página HTML simulada
                self.simulate_hikcentral_page()
            else:
                # MODO REAL: Navegar para HikCentral
                print("🌐 Navegando para HikCentral...")
                self.driver.get("http://45.4.132.189:3389/#/")
                time.sleep(8)  # Aguardar carregamento completo
                
                # Fazer login
                if not self.login("luca", "Luca123#"):
                    return {
                        'success': False,
                        'message': 'Falha no login',
                        'error': 'Credenciais inválidas ou erro de conexão'
                    }
                
                # Navegar até o formulário
                if not self.navigate_to_form():
                    return {
                        'success': False,
                        'message': 'Falha na navegação',
                        'error': 'Não foi possível acessar o formulário'
                    }
            
            # Debug do estado da página antes de preencher
            self.debug_page_state("Antes do preenchimento")
            
            # Preencher o formulário
            if not self.fill_visitor_form(visitor_data):
                return {
                    'success': False,
                    'message': 'Falha no preenchimento do formulário',
                    'error': 'Erro durante o preenchimento dos campos'
                }
            
            # Debug do estado da página após preencher
            self.debug_page_state("Após preenchimento")
            
            # Aguardar um pouco para ver o resultado
            time.sleep(3)
            
            return {
                'success': True,
                'message': 'Visitante registrado com sucesso',
                'hikcentral_id': f"sim_{int(time.time())}" if self.simulation_mode else None
            }
            
        except Exception as e:
            print(f"❌ Erro ao registrar visitante: {e}")
            return {
                'success': False,
                'message': f'Erro: {str(e)}',
                'error': str(e)
            }
        finally:
            if not self.simulation_mode:
                # Só fechar o driver se não for simulação
                try:
                    if self.driver:
                        print("🔒 Driver fechado")
                        self.driver.quit()
                except:
                    pass
    
    def click_visitor_tab(self):
        """Clica no botão Visitante"""
        try:
            # Aguardar um pouco para a página carregar completamente
            time.sleep(5)
            
            # Primeiro, tentar encontrar o elemento diretamente
            print("🔍 Procurando elemento 'Visitante'...")
            elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Visitante')]")
            
            if elements:
                print(f"🔍 Encontrados {len(elements)} elementos com 'Visitante'")
                
                for i, element in enumerate(elements):
                    try:
                        text = element.text
                        if 'Visitante' in text and element.is_displayed() and element.is_enabled():
                            print(f"✅ Tentando clicar no elemento {i+1}: '{text}'")
                            
                            # Tentar diferentes métodos de clique
                            try:
                                # Método 1: Clique normal
                                element.click()
                                print("✅ Clique normal realizado!")
                                time.sleep(2)
                                return True
                            except:
                                try:
                                    # Método 2: Clique via JavaScript
                                    self.driver.execute_script("arguments[0].click();", element)
                                    print("✅ Clique via JavaScript realizado!")
                                    time.sleep(2)
                                    return True
                                except:
                                    try:
                                        # Método 3: Clique com ActionChains
                                        from selenium.webdriver.common.action_chains import ActionChains
                                        actions = ActionChains(self.driver)
                                        actions.move_to_element(element).click().perform()
                                        print("✅ Clique via ActionChains realizado!")
                                        time.sleep(2)
                                        return True
                                    except Exception as e:
                                        print(f"⚠️ Método 3 falhou: {e}")
                                        continue
                    except Exception as e:
                        print(f"⚠️ Erro ao processar elemento {i+1}: {e}")
                        continue
            
            print("❌ Nenhum elemento 'Visitante' clicável encontrado")
            return False
            
        except Exception as e:
            print(f"❌ Erro ao clicar em Visitante: {e}")
            return False

    def click_visitor_entry(self):
        """Clica em 'Entrada de visitante'"""
        try:
            # Seletor específico para "Entrada de visitante"
            entry_selector = "//div[@title='Entrada de visitante' and contains(@class, 'guide-step-name')]"
            
            element = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, entry_selector))
            )
            element.click()
            print("✅ Clicado em 'Entrada de visitante'")
            time.sleep(2)
            return True
            
        except Exception as e:
            print(f"❌ Erro ao clicar em 'Entrada de visitante': {e}")
            return False

    def click_unreserved_entry(self):
        """Clica em 'Entrada de visitante não reservada'"""
        try:
            # Primeiro, tentar fechar tooltips que possam estar bloqueando
            print("🔧 Tentando fechar tooltips...")
            try:
                # Fechar tooltip se existir
                tooltip = self.driver.find_element(By.ID, "visitorTips1")
                if tooltip.is_displayed():
                    # Clicar fora para fechar
                    self.driver.execute_script("arguments[0].style.display = 'none';", tooltip)
                    print("✅ Tooltip fechado")
                    time.sleep(1)
            except:
                print("⚠️ Nenhum tooltip encontrado para fechar")
            
            # Aguardar um pouco
            time.sleep(2)
            
            # Seletor específico para o botão
            button_selector = "//button[@title='Entrada de visitante não reservada']"
            
            # Função para fechar message box após clique
            def fechar_message_box():
                try:
                    time.sleep(2)
                    cancel_button = self.driver.find_element(By.XPATH, "//button[contains(@class, 'el-button')]//span[text()=' Cancelar ']")
                    if cancel_button.is_displayed():
                        cancel_button.click()
                        print("✅ Message box fechado com botão Cancelar")
                        time.sleep(2)
                        return True
                except:
                    pass
                return False
            
            # Tentar diferentes métodos de clique
            try:
                # Método 1: Clique normal
                element = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, button_selector))
                )
                element.click()
                print("✅ Clicado em 'Entrada de visitante não reservada'")
                fechar_message_box()
                time.sleep(3)
                return True
            except:
                try:
                    # Método 2: Clique via JavaScript
                    element = self.driver.find_element(By.XPATH, button_selector)
                    self.driver.execute_script("arguments[0].click();", element)
                    print("✅ Clicado em 'Entrada de visitante não reservada' (JavaScript)")
                    fechar_message_box()
                    time.sleep(3)
                    return True
                except:
                    # Método 3: Clique com ActionChains
                    from selenium.webdriver.common.action_chains import ActionChains
                    element = self.driver.find_element(By.XPATH, button_selector)
                    actions = ActionChains(self.driver)
                    actions.move_to_element(element).click().perform()
                    print("✅ Clicado em 'Entrada de visitante não reservada' (ActionChains)")
                    fechar_message_box()
                    time.sleep(3)
                    return True
            
        except Exception as e:
            print(f"❌ Erro ao clicar em 'Entrada de visitante não reservada': {e}")
            return False

    def fill_visitor_form(self, visitor_data):
        """Preenche o formulário de visitante"""
        try:
            print("📝 Preenchendo formulário de visitante...")
            
            # Fechar message boxes antes de começar
            self.close_message_boxes()
            
            # 1. Nome próprio - AJUSTADO PARA HIKCENTRAL REAL
            print("📝 Preenchendo nome próprio...")
            try:
                # Procurar por diferentes tipos de campos de nome
                first_name_input = None
                
                # Método 1: Procurar por input com maxlength=255
                try:
                    first_name_inputs = self.driver.find_elements(By.CSS_SELECTOR, "input[maxlength='255']")
                    if first_name_inputs:
                        first_name_input = first_name_inputs[0]
                        print("✅ Campo nome encontrado por maxlength=255")
                except:
                    pass
                
                # Método 2: Procurar por input com class="el-input__inner"
                if not first_name_input:
                    try:
                        first_name_inputs = self.driver.find_elements(By.CSS_SELECTOR, "input.el-input__inner")
                        if first_name_inputs:
                            first_name_input = first_name_inputs[0]
                            print("✅ Campo nome encontrado por class='el-input__inner'")
                    except:
                        pass
                
                # Método 3: Procurar por qualquer input de texto
                if not first_name_input:
                    try:
                        text_inputs = self.driver.find_elements(By.CSS_SELECTOR, "input[type='text']")
                        if text_inputs:
                            first_name_input = text_inputs[0]
                            print("✅ Campo nome encontrado por input[type='text']")
                    except:
                        pass
                
                # Método 4: Procurar por input dentro de span com class="el-popover-wrap"
                if not first_name_input:
                    try:
                        popover_inputs = self.driver.find_elements(By.CSS_SELECTOR, "span.el-popover-wrap input")
                        if popover_inputs:
                            first_name_input = popover_inputs[0]
                            print("✅ Campo nome encontrado por span.el-popover-wrap input")
                    except:
                        pass
                
                if first_name_input:
                    # Fazer o campo interativo
                    self.driver.execute_script("arguments[0].scrollIntoView(true);", first_name_input)
                    time.sleep(0.5)
                    first_name_input.click()
                    time.sleep(0.5)
                    
                    first_name_input.clear()
                    first_name_input.send_keys(visitor_data['name'].split()[0])  # Primeiro nome
                    print("✅ Nome próprio preenchido")
                    time.sleep(1)
                else:
                    print("❌ Campo nome próprio não encontrado com nenhum método")
                    # Debug: mostrar todos os inputs disponíveis
                    all_inputs = self.driver.find_elements(By.CSS_SELECTOR, "input")
                    print(f"🔍 Inputs disponíveis na página: {len(all_inputs)}")
                    for i, inp in enumerate(all_inputs[:5]):  # Mostrar apenas os primeiros 5
                        try:
                            tag_name = inp.tag_name
                            input_type = inp.get_attribute("type")
                            maxlength = inp.get_attribute("maxlength")
                            placeholder = inp.get_attribute("placeholder")
                            class_name = inp.get_attribute("class")
                            print(f"   Input {i+1}: type={input_type}, maxlength={maxlength}, placeholder='{placeholder}', class='{class_name}'")
                        except:
                            print(f"   Input {i+1}: Erro ao analisar")
                    return False
                    
            except Exception as e:
                print(f"⚠️ Erro ao preencher nome próprio: {e}")
                return False
            
            # Fechar message boxes após preencher nome
            self.close_message_boxes()
            
            # 2. Apelido (sobrenome) - AJUSTADO PARA HIKCENTRAL REAL
            print("📝 Preenchendo apelido...")
            try:
                apelido_input = None
                
                # Método 1: Procurar por input com id="myDiv"
                try:
                    apelido_input = self.driver.find_element(By.CSS_SELECTOR, "input#myDiv")
                    print("✅ Campo apelido encontrado por id='myDiv'")
                except:
                    pass
                
                # Método 2: Procurar por segundo input de texto
                if not apelido_input:
                    try:
                        text_inputs = self.driver.find_elements(By.CSS_SELECTOR, "input[type='text']")
                        if len(text_inputs) >= 2:
                            apelido_input = text_inputs[1]
                            print("✅ Campo apelido encontrado por segundo input[type='text']")
                    except:
                        pass
                
                # Método 3: Procurar por input com maxlength=255 (segundo campo)
                if not apelido_input:
                    try:
                        maxlength_inputs = self.driver.find_elements(By.CSS_SELECTOR, "input[maxlength='255']")
                        if len(maxlength_inputs) >= 2:
                            apelido_input = maxlength_inputs[1]
                            print("✅ Campo apelido encontrado por segundo input[maxlength='255']")
                    except:
                        pass
                
                if apelido_input:
                    apelido_input.clear()
                    apelido_input.send_keys(" ".join(visitor_data['name'].split()[1:]))  # Resto do nome
                    print("✅ Apelido preenchido")
                    time.sleep(1)
                else:
                    print("⚠️ Campo apelido não encontrado")
            except Exception as e:
                print(f"⚠️ Erro ao preencher apelido: {e}")
            
            # Fechar message boxes após preencher apelido
            self.close_message_boxes()
            
            # 3. Visitado (morador) - AJUSTADO PARA HIKCENTRAL REAL
            print("📝 Preenchendo visitado...")
            try:
                # Procurar por input com placeholder="Pesquisar"
                visited_inputs = self.driver.find_elements(By.CSS_SELECTOR, "input[placeholder='Pesquisar']")
                if visited_inputs:
                    visited_input = visited_inputs[0]
                    visited_input.clear()
                    visited_input.send_keys("LUCCA LACERDA")
                    print("✅ Visitado preenchido")
                    time.sleep(2)
                    
                    # Aguardar e clicar em "Pesquisar por nome da pessoa"
                    print("📝 Aguardando opção 'Pesquisar por nome da pessoa'...")
                    try:
                        search_option = WebDriverWait(self.driver, 10).until(
                            EC.element_to_be_clickable((By.XPATH, "//li[contains(@class, 'el-autocomplete-suggestion__item')]//label[text()='Pesquisar por nome da pessoa']"))
                        )
                        search_option.click()
                        print("✅ Opção 'Pesquisar por nome da pessoa' clicada")
                        time.sleep(2)
                        
                        # Aguardar e selecionar o morador
                        print("📝 Aguardando morador 'LUCCA LACERDA'...")
                        morador_option = WebDriverWait(self.driver, 10).until(
                            EC.element_to_be_clickable((By.XPATH, "//li[contains(@class, 'person-info-search-item-template')]//div[contains(@class, 'ptl-title') and contains(text(), 'LUCCA LACERDA')]"))
                        )
                        morador_option.click()
                        print("✅ Morador 'LUCCA LACERDA' selecionado")
                        time.sleep(1)
                        
                    except Exception as e:
                        print(f"⚠️ Erro ao selecionar morador: {e}")
                        # Continuar mesmo com erro
                        
                else:
                    print("⚠️ Campo visitado não encontrado")
            except Exception as e:
                print(f"⚠️ Erro ao preencher visitado: {e}")
            
            # Fechar message boxes após preencher visitado
            self.close_message_boxes()
            
            # 4. Objetivo da visita - AJUSTADO PARA HIKCENTRAL REAL
            print("📝 Selecionando objetivo da visita...")
            try:
                # Procurar por input com title="Business"
                objetivo_inputs = self.driver.find_elements(By.CSS_SELECTOR, "input[title='Business']")
                if objetivo_inputs:
                    objetivo_input = objetivo_inputs[0]
                    objetivo_input.click()
                    time.sleep(1)
                    
                    # Aguardar e selecionar "Fazer passeio e visita"
                    print("📝 Aguardando opção 'Fazer passeio e visita'...")
                    try:
                        passeio_option = WebDriverWait(self.driver, 10).until(
                            EC.element_to_be_clickable((By.XPATH, "//li[contains(@class, 'el-select-dropdown__item')]//span[text()=' Fazer passeio e visita ']"))
                        )
                        passeio_option.click()
                        print("✅ 'Fazer passeio e visita' selecionado")
                        time.sleep(1)
                    except Exception as e:
                        print(f"⚠️ Erro ao selecionar 'Fazer passeio e visita': {e}")
                else:
                    print("⚠️ Campo objetivo não encontrado")
            except Exception as e:
                print(f"⚠️ Erro ao selecionar objetivo: {e}")
            
            # Fechar message boxes após selecionar objetivo
            self.close_message_boxes()
            
            # 5. Grupo de visitantes - AJUSTADO PARA HIKCENTRAL REAL
            print("📝 Selecionando grupo de visitantes...")
            try:
                # Procurar por input com title="Corretores"
                grupo_inputs = self.driver.find_elements(By.CSS_SELECTOR, "input[title='Corretores']")
                if grupo_inputs:
                    grupo_input = grupo_inputs[0]
                    grupo_input.click()
                    time.sleep(1)
                    
                    # Aguardar e selecionar "VisitanteS"
                    print("📝 Aguardando opção 'VisitanteS'...")
                    try:
                        visitantes_option = WebDriverWait(self.driver, 10).until(
                            EC.element_to_be_clickable((By.XPATH, "//li[contains(@class, 'el-select-dropdown__item')]//span[text()=' VisitanteS ']"))
                        )
                        visitantes_option.click()
                        print("✅ 'VisitanteS' selecionado")
                        time.sleep(1)
                    except Exception as e:
                        print(f"⚠️ Erro ao selecionar 'VisitanteS': {e}")
                else:
                    print("⚠️ Campo grupo não encontrado")
            except Exception as e:
                print(f"⚠️ Erro ao selecionar grupo: {e}")
            
            # Fechar message boxes após selecionar grupo
            self.close_message_boxes()
            
            # 6. Outras informações - AJUSTADO PARA HIKCENTRAL REAL
            print("📝 Expandindo outras informações...")
            try:
                outras_info_elements = self.driver.find_elements(By.XPATH, "//div[@title='Outras informações' and contains(@class, 'item')]")
                if outras_info_elements:
                    outras_info_elements[0].click()
                    print("✅ 'Outras informações' expandido")
                    time.sleep(1)
                else:
                    print("⚠️ 'Outras informações' não encontrado")
            except Exception as e:
                print(f"⚠️ Erro ao expandir outras informações: {e}")
            
            # Fechar message boxes após expandir outras informações
            self.close_message_boxes()
            
            # 7. Selecionar gênero (Masculino) - AJUSTADO PARA HIKCENTRAL REAL
            print("📝 Selecionando gênero...")
            try:
                # Procurar por radio buttons de gênero
                genero_radios = self.driver.find_elements(By.CSS_SELECTOR, "input[type='radio'][name='genero']")
                if genero_radios and len(genero_radios) >= 2:
                    # Selecionar "Masculino" (value="1")
                    masculino_radio = genero_radios[1]  # Segundo radio button
                    masculino_radio.click()
                    print("✅ Gênero 'Masculino' selecionado")
                    time.sleep(1)
                else:
                    # Fallback: procurar por radio buttons com value específico
                    try:
                        masculino_radio = self.driver.find_element(By.XPATH, "//input[@type='radio' and @value='1']")
                        masculino_radio.click()
                        print("✅ Gênero 'Masculino' selecionado (fallback)")
                        time.sleep(1)
                    except:
                        print("⚠️ Radio buttons de gênero não encontrados")
            except Exception as e:
                print(f"⚠️ Erro ao selecionar gênero: {e}")
            
            # Fechar message boxes após selecionar gênero
            self.close_message_boxes()
            
            # 8. Descer a página um pouco
            print("📝 Descer a página...")
            try:
                self.driver.execute_script("window.scrollBy(0, 300);")
                print("✅ Página rolada para baixo")
                time.sleep(1)
            except Exception as e:
                print(f"⚠️ Erro ao rolar página: {e}")
            
            # 9. Preencher telefone - AJUSTADO PARA HIKCENTRAL REAL
            print("📝 Preenchendo telefone...")
            try:
                # Procurar por input com maxlength=32
                telefone_inputs = self.driver.find_elements(By.CSS_SELECTOR, "input[maxlength='32']")
                if telefone_inputs:
                    telefone_input = telefone_inputs[0]
                    telefone_input.clear()
                    telefone_input.send_keys(visitor_data['phone'])
                    print("✅ Telefone preenchido")
                    time.sleep(1)
                else:
                    print("⚠️ Campo telefone não encontrado")
            except Exception as e:
                print(f"⚠️ Erro ao preencher telefone: {e}")
            
            # Fechar message boxes após preencher telefone
            self.close_message_boxes()
            
            # 10. Clicar em "Expandir" - AJUSTADO PARA HIKCENTRAL REAL
            print("📝 Clicando em 'Expandir'...")
            try:
                expandir_elements = self.driver.find_elements(By.XPATH, "//span[text()='Expandir']")
                if expandir_elements:
                    expandir_elements[0].click()
                    print("✅ 'Expandir' clicado")
                    time.sleep(2)
                else:
                    print("⚠️ Botão 'Expandir' não encontrado")
            except Exception as e:
                print(f"⚠️ Erro ao clicar em 'Expandir': {e}")
            
            # Fechar message boxes após expandir
            self.close_message_boxes()
            
            # 11. Preencher RG - AJUSTADO PARA HIKCENTRAL REAL
            print("📝 Preenchendo RG...")
            try:
                # Procurar por input com maxlength=128
                rg_inputs = self.driver.find_elements(By.CSS_SELECTOR, "input[maxlength='128']")
                if rg_inputs:
                    rg_input = rg_inputs[0]
                    rg_input.clear()
                    rg_input.send_keys("12345678")  # RG fictício
                    print("✅ RG preenchido")
                    time.sleep(1)
                else:
                    print("⚠️ Campo RG não encontrado")
            except Exception as e:
                print(f"⚠️ Erro ao preencher RG: {e}")
            
            # Fechar message boxes após preencher RG
            self.close_message_boxes()
            
            # 12. Preencher placa do veículo (só se receber informação) - AJUSTADO PARA HIKCENTRAL REAL
            if visitor_data.get('placa_veiculo'):
                print("📝 Preenchendo placa do veículo...")
                try:
                    # Procurar por input com maxlength=128 (segundo campo)
                    placa_inputs = self.driver.find_elements(By.CSS_SELECTOR, "input[maxlength='128']")
                    if len(placa_inputs) >= 2:
                        placa_input = placa_inputs[1]
                        placa_input.clear()
                        placa_input.send_keys(visitor_data['placa_veiculo'])
                        print("✅ Placa do veículo preenchida")
                        time.sleep(1)
                    else:
                        print("⚠️ Campo placa não encontrado")
                except Exception as e:
                    print(f"⚠️ Erro ao preencher placa: {e}")
            else:
                print("ℹ️ Nenhuma informação de placa recebida, pulando campo")
            
            # Fechar message boxes antes de clicar em entrada
            self.close_message_boxes()
            
            # 13. Clicar no botão "Entrada" para salvar - AJUSTADO PARA HIKCENTRAL REAL
            print("📝 Clicando no botão 'Entrada' para salvar...")
            try:
                # Procurar pelo botão "Entrada"
                entrada_buttons = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Entrada')]")
                if entrada_buttons:
                    entrada_buttons[0].click()
                    print("✅ Botão 'Entrada' clicado com sucesso!")
                    time.sleep(3)
                    
                    # Verificar se foi salvo com sucesso
                    try:
                        success_message = WebDriverWait(self.driver, 5).until(
                            EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'sucesso') or contains(text(), 'success') or contains(text(), 'salvo')]"))
                        )
                        print("✅ Cadastro salvo com sucesso!")
                    except:
                        print("ℹ️ Mensagem de sucesso não encontrada, mas botão foi clicado")
                    
                else:
                    print("⚠️ Botão 'Entrada' não encontrado")
                    return False
                
            except Exception as e:
                print(f"⚠️ Erro ao clicar no botão 'Entrada': {e}")
                return False
            
            print("✅ Formulário preenchido com sucesso!")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao preencher formulário: {e}")
            return False

    def submit_form(self):
        """Clica no botão Entrada para finalizar"""
        try:
            print("🚀 Finalizando cadastro...")
            
            # Clicar no botão "Entrada"
            entrada_btn = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//span[text()='Entrada']"))
            )
            entrada_btn.click()
            print("✅ Botão 'Entrada' clicado!")
            
            # Aguardar confirmação
            time.sleep(3)
            
            # Verificar se foi bem-sucedido
            try:
                success_message = self.driver.find_element(By.XPATH, "//*[contains(text(), 'sucesso') or contains(text(), 'Success') or contains(text(), 'cadastrado')]")
                print("✅ Cadastro realizado com sucesso!")
                return True
            except:
                print("⚠️ Não foi possível confirmar o sucesso, mas o formulário foi enviado")
                return True
                
        except Exception as e:
            print(f"❌ Erro ao finalizar cadastro: {e}")
            return False

    def handle_popup(self):
        """Gerencia popups de aviso"""
        try:
            print("🔍 Verificando popup de aviso...")
            
            # Aguardar o popup aparecer
            time.sleep(2)
            
            # Tentar encontrar o popup usando JavaScript para ser mais direto
            popup_script = """
            return (function() {
                // Procurar por popups visíveis
                var popups = document.querySelectorAll('.el-message-box__wrapper');
                for (var i = 0; i < popups.length; i++) {
                    var popup = popups[i];
                    if (popup.style.display !== 'none' && popup.offsetParent !== null) {
                        // Verificar se contém a mensagem específica
                        var content = popup.textContent || '';
                        if (content.includes('O serviço de componente Web não está disponível') || 
                            content.includes('serviço de componente') ||
                            content.includes('não está disponível')) {
                            return popup;
                        }
                    }
                }
                return null;
            })();
            """
            
            popup = self.driver.execute_script(popup_script)
            
            if popup:
                print("⚠️ Popup de aviso encontrado, tentando fechar...")
                
                # Tentar clicar no botão "Cancelar" usando JavaScript
                cancel_script = """
                var popup = arguments[0];
                // Procurar pelo botão Cancelar usando a classe CSS específica
                var cancelBtn = popup.querySelector('button.el-button.el-button--default');
                if (!cancelBtn) {
                    // Procurar por todos os botões e encontrar o "Cancelar"
                    var buttons = popup.querySelectorAll('button');
                    for (var i = 0; i < buttons.length; i++) {
                        if (buttons[i].textContent.trim() === 'Cancelar') {
                            cancelBtn = buttons[i];
                            break;
                        }
                    }
                }
                
                if (cancelBtn) {
                    cancelBtn.click();
                    return true;
                }
                return false;
                """
                
                success = self.driver.execute_script(cancel_script, popup)
                
                if success:
                    print("✅ Popup fechado com sucesso usando JavaScript")
                    time.sleep(3)
                else:
                    print("❌ Botão Cancelar não encontrado, tentando método alternativo...")
                    
                    # Método alternativo: procurar e clicar diretamente
                    try:
                        cancel_button = WebDriverWait(self.driver, 5).until(
                            EC.element_to_be_clickable((By.XPATH, "//button[text()='Cancelar']"))
                        )
                        cancel_button.click()
                        print("✅ Popup fechado com método alternativo")
                        time.sleep(3)
                    except:
                        print("❌ Método alternativo falhou, tentando clicar fora...")
                        try:
                            # Clicar fora do popup
                            self.driver.find_element(By.TAG_NAME, "body").click()
                            print("✅ Popup fechado clicando fora")
                            time.sleep(2)
                        except:
                            print("❌ Não foi possível fechar o popup")
            else:
                print("ℹ️ Nenhum popup de aviso encontrado")
                
        except Exception as e:
            print(f"⚠️ Erro ao verificar popup: {e}")
        
        time.sleep(3)

    def fill_basic_fields(self, visitor_data):
        """Preenche campos básicos do formulário"""
        try:
            # Campo Nome próprio
            if not self.fill_nome_proprio(visitor_data['name']):
                return False
            
            # Campo Apelido
            if not self.fill_apelido(visitor_data['name']):
                return False
            
            # Campo Visitado
            if not self.fill_visitado():
                return False
            
            # Campo Objetivo da visita
            if not self.fill_objetivo():
                return False
            
            # Campo Grupo de visitantes
            if not self.fill_grupo():
                return False
            
            return True
            
        except Exception as e:
            print(f"❌ Erro ao preencher campos básicos: {e}")
            return False

    def fill_additional_fields(self, visitor_data):
        """Preenche campos adicionais do formulário"""
        try:
            # Campo Gênero
            if not self.fill_genero():
                return False
            
            # Campo Telefone
            if not self.fill_telefone(visitor_data.get('phone', '31999999999')):
                return False
            
            # Botão Expandir
            if not self.click_expandir():
                return False
            
            # Campo RG
            if not self.fill_rg(visitor_data.get('cpf', '12345678')):
                return False
            
            # Campo Placa do veículo
            if not self.fill_placa():
                return False
            
            # Upload de foto
            if not self.upload_photo():
                return False
            
            return True
            
        except Exception as e:
            print(f"❌ Erro ao preencher campos adicionais: {e}")
            return False

    # Métodos auxiliares para preencher campos específicos
    def fill_nome_proprio(self, name):
        """Preenche o campo Nome próprio"""
        try:
            nome_proprio_selectors = [
                "//input[@maxlength='255' and contains(@tips, 'São permitidos até 255 caracteres no nome completo da pessoa')]",
                "input[maxlength='255'][tips*='São permitidos até 255 caracteres no nome completo da pessoa']",
                "input[placeholder*='Nome próprio']",
                "input[name*='GivenName']",
                "input[id*='GivenName']",
                "//input[contains(@placeholder, 'Nome próprio')]",
                "//input[contains(@name, 'GivenName')]",
                "//input[contains(@id, 'GivenName')]",
                ".given-name-item input",
                "input.el-input__inner[placeholder*='Nome']"
            ]
            
            for selector in nome_proprio_selectors:
                try:
                    if selector.startswith("//"):
                        element = WebDriverWait(self.driver, 5).until(
                            EC.presence_of_element_located((By.XPATH, selector))
                        )
                    else:
                        element = WebDriverWait(self.driver, 5).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                        )
                    
                    element.clear()
                    element.send_keys(name.split()[0])  # Primeiro nome
                    print(f"✅ Nome próprio preenchido: {name.split()[0]}")
                    return True
                except:
                    continue
            
            print("❌ Campo Nome próprio não encontrado")
            return False
            
        except Exception as e:
            print(f"❌ Erro ao preencher Nome próprio: {e}")
            return False

    def fill_apelido(self, name):
        """Preenche o campo Apelido"""
        try:
            apelido_selectors = [
                "input#myDiv",
                "//input[@id='myDiv']",
                "input[placeholder*='Apelido']",
                "input[name*='Surname']",
                "input[id*='Surname']",
                "//input[contains(@placeholder, 'Apelido')]",
                "//input[contains(@name, 'Surname')]",
                "//input[contains(@id, 'Surname')]",
                ".surname-item input",
                "input.el-input__inner[placeholder*='Apelido']",
                "//label[contains(text(), 'Apelido')]/following-sibling::*//input",
                "//label[text()='Apelido']/following-sibling::*//input"
            ]
            
            for selector in apelido_selectors:
                try:
                    if selector.startswith("//"):
                        element = WebDriverWait(self.driver, 5).until(
                            EC.presence_of_element_located((By.XPATH, selector))
                        )
                    else:
                        element = WebDriverWait(self.driver, 5).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                        )
                    
                    element.clear()
                    # Usar o resto do nome como apelido
                    apelido = ' '.join(name.split()[1:]) if len(name.split()) > 1 else 'Teste'
                    element.send_keys(apelido)
                    print(f"✅ Apelido preenchido: {apelido}")
                    return True
                except:
                    continue
            
            print("❌ Campo Apelido não encontrado")
            return False
            
        except Exception as e:
            print(f"❌ Erro ao preencher Apelido: {e}")
            return False

    def fill_visitado(self):
        """Preenche o campo Visitado"""
        try:
            print("👥 Configurando campo Visitado...")
            
            # Clicar no botão "Selec."
            selec_selectors = [
                "//button[@title='Selec.' and contains(@class, 'el-button--default')]",
                "button[title='Selec.']",
                "button.el-button--default:contains('Selec.')",
                "//button[contains(text(), 'Selec.')]"
            ]
            
            selec_button = None
            for selector in selec_selectors:
                try:
                    if selector.startswith("//"):
                        selec_button = WebDriverWait(self.driver, 5).until(
                            EC.element_to_be_clickable((By.XPATH, selector))
                        )
                    else:
                        selec_button = WebDriverWait(self.driver, 5).until(
                            EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                        )
                    break
                except:
                    continue
            
            if not selec_button:
                print("❌ Botão 'Selec.' não encontrado")
                return False
            
            selec_button.click()
            print("✅ Clicado no botão 'Selec.' do campo Visitado")
            time.sleep(2)
            
            # Preencher nome do morador
            search_selectors = [
                "input[placeholder='Pesquisar']",
                "//input[@placeholder='Pesquisar']",
                "input[placeholder*='pesquisar']",
                "//input[contains(@placeholder, 'pesquisar')]"
            ]
            
            search_field = None
            for selector in search_selectors:
                try:
                    if selector.startswith("//"):
                        search_field = WebDriverWait(self.driver, 5).until(
                            EC.presence_of_element_located((By.XPATH, selector))
                        )
                    else:
                        search_field = WebDriverWait(self.driver, 5).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                        )
                    break
                except:
                    continue
            
            if not search_field:
                print("❌ Campo de pesquisa não encontrado")
                return False
            
            search_field.clear()
            search_field.send_keys("lucca la")
            print("✅ Nome do morador digitado: lucca la")
            time.sleep(1)
            
            # Clicar no botão "Pesquisar"
            pesquisar_selectors = [
                "//button[text()='Pesquisar']",
                "button:contains('Pesquisar')",
                "//button[contains(text(), 'Pesquisar')]",
                "button[title*='Pesquisar']"
            ]
            
            pesquisar_button = None
            for selector in pesquisar_selectors:
                try:
                    if selector.startswith("//"):
                        pesquisar_button = WebDriverWait(self.driver, 5).until(
                            EC.element_to_be_clickable((By.XPATH, selector))
                        )
                    else:
                        pesquisar_button = WebDriverWait(self.driver, 5).until(
                            EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                        )
                    break
                except:
                    continue
            
            if not pesquisar_button:
                print("❌ Botão 'Pesquisar' não encontrado")
                return False
            
            pesquisar_button.click()
            print("✅ Clicado no botão 'Pesquisar'")
            time.sleep(2)
            
            # Selecionar o morador "LUCCA LACERDA"
            morador_selectors = [
                "//div[contains(text(), 'LUCCA LACERDA')]",
                "//span[contains(text(), 'LUCCA LACERDA')]",
                "//li[contains(text(), 'LUCCA LACERDA')]",
                "div:contains('LUCCA LACERDA')",
                "span:contains('LUCCA LACERDA')",
                "li:contains('LUCCA LACERDA')"
            ]
            
            morador_element = None
            for selector in morador_selectors:
                try:
                    if selector.startswith("//"):
                        morador_element = WebDriverWait(self.driver, 5).until(
                            EC.element_to_be_clickable((By.XPATH, selector))
                        )
                    else:
                        morador_element = WebDriverWait(self.driver, 5).until(
                            EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                        )
                    break
                except:
                    continue
            
            if not morador_element:
                print("❌ Morador LUCCA LACERDA não encontrado")
                return False
            
            morador_element.click()
            print("✅ Morador LUCCA LACERDA selecionado")
            time.sleep(1)
            
            # Clicar no botão "Adicionar"
            adicionar_selectors = [
                "//button[text()='Adicionar']",
                "button:contains('Adicionar')",
                "//button[contains(text(), 'Adicionar')]",
                "button[title*='Adicionar']"
            ]
            
            adicionar_button = None
            for selector in adicionar_selectors:
                try:
                    if selector.startswith("//"):
                        adicionar_button = WebDriverWait(self.driver, 5).until(
                            EC.element_to_be_clickable((By.XPATH, selector))
                        )
                    else:
                        adicionar_button = WebDriverWait(self.driver, 5).until(
                            EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                        )
                    break
                except:
                    continue
            
            if not adicionar_button:
                print("❌ Botão 'Adicionar' não encontrado")
                return False
            
            adicionar_button.click()
            print("✅ Clicado no botão 'Adicionar'")
            time.sleep(2)
            
            return True
            
        except Exception as e:
            print(f"❌ Erro ao configurar campo Visitado: {e}")
            return False

    def fill_objetivo(self):
        """Preenche o campo Objetivo da visita"""
        try:
            print("🎯 Preenchendo objetivo da visita...")
            
            objetivo_selectors = [
                "//input[@placeholder='Selecione um item.' and @title='Business']",
                "input[placeholder='Selecione um item.'][title='Business']",
                "//input[contains(@placeholder, 'Selecione um item.')]",
                "input[placeholder*='Selecione um item.']"
            ]
            
            for selector in objetivo_selectors:
                try:
                    if selector.startswith("//"):
                        element = WebDriverWait(self.driver, 5).until(
                            EC.presence_of_element_located((By.XPATH, selector))
                        )
                    else:
                        element = WebDriverWait(self.driver, 5).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                        )
                    
                    element.click()
                    time.sleep(1)
                    
                    # Selecionar "Fazer passeio e visita"
                    opcao_selectors = [
                        "//li[contains(text(), 'Fazer passeio e visita')]",
                        "//div[contains(text(), 'Fazer passeio e visita')]",
                        "li:contains('Fazer passeio e visita')",
                        "div:contains('Fazer passeio e visita')"
                    ]
                    
                    for opcao_selector in opcao_selectors:
                        try:
                            if opcao_selector.startswith("//"):
                                opcao = WebDriverWait(self.driver, 3).until(
                                    EC.element_to_be_clickable((By.XPATH, opcao_selector))
                                )
                            else:
                                opcao = WebDriverWait(self.driver, 3).until(
                                    EC.element_to_be_clickable((By.CSS_SELECTOR, opcao_selector))
                                )
                            
                            opcao.click()
                            print("✅ Objetivo da visita preenchido: fazer passeio e visita")
                            return True
                        except:
                            continue
                    
                    break
                except:
                    continue
            
            print("❌ Campo Objetivo da visita não encontrado")
            return False
            
        except Exception as e:
            print(f"❌ Erro ao preencher Objetivo da visita: {e}")
            return False

    def fill_grupo(self):
        """Preenche o campo Grupo de visitantes"""
        try:
            print("👥 Preenchendo grupo de visitantes...")
            
            grupo_selectors = [
                "//input[@placeholder='Selecione um item.' and @title='Corretores']",
                "input[placeholder='Selecione um item.'][title='Corretores']",
                "//input[contains(@placeholder, 'Selecione um item.')]",
                "input[placeholder*='Selecione um item.']"
            ]
            
            for selector in grupo_selectors:
                try:
                    if selector.startswith("//"):
                        element = WebDriverWait(self.driver, 5).until(
                            EC.presence_of_element_located((By.XPATH, selector))
                        )
                    else:
                        element = WebDriverWait(self.driver, 5).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                        )
                    
                    element.click()
                    time.sleep(1)
                    
                    # Selecionar "VisitanteS"
                    opcao_selectors = [
                        "//li[contains(text(), 'VisitanteS')]",
                        "//div[contains(text(), 'VisitanteS')]",
                        "li:contains('VisitanteS')",
                        "div:contains('VisitanteS')"
                    ]
                    
                    for opcao_selector in opcao_selectors:
                        try:
                            if opcao_selector.startswith("//"):
                                opcao = WebDriverWait(self.driver, 3).until(
                                    EC.element_to_be_clickable((By.XPATH, opcao_selector))
                                )
                            else:
                                opcao = WebDriverWait(self.driver, 3).until(
                                    EC.element_to_be_clickable((By.CSS_SELECTOR, opcao_selector))
                                )
                            
                            opcao.click()
                            print("✅ Grupo de visitantes preenchido: VisitanteS")
                            return True
                        except:
                            continue
                    
                    break
                except:
                    continue
            
            print("❌ Campo Grupo de visitantes não encontrado")
            return False
            
        except Exception as e:
            print(f"❌ Erro ao preencher Grupo de visitantes: {e}")
            return False

    def fill_genero(self):
        """Preenche o campo Gênero"""
        try:
            print("👤 Preenchendo gênero...")
            
            genero_selectors = [
                "//input[@type='radio' and @value='1']",
                "input[type='radio'][value='1']",
                "//label[contains(text(), 'Masculino')]//input[@type='radio']",
                "label:contains('Masculino') input[type='radio']"
            ]
            
            for selector in genero_selectors:
                try:
                    if selector.startswith("//"):
                        element = WebDriverWait(self.driver, 5).until(
                            EC.element_to_be_clickable((By.XPATH, selector))
                        )
                    else:
                        element = WebDriverWait(self.driver, 5).until(
                            EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                        )
                    
                    element.click()
                    print("✅ Gênero selecionado: Masculino")
                    return True
                except:
                    continue
            
            print("❌ Campo de gênero não encontrado")
            return False
            
        except Exception as e:
            print(f"❌ Erro ao preencher gênero: {e}")
            return False

    def fill_telefone(self, phone):
        """Preenche o campo Telefone"""
        try:
            print("📱 Preenchendo telefone...")
            self.driver.execute_script("window.scrollBy(0, 200);")
            time.sleep(0.5)
            
            telefone_selectors = [
                "//input[@maxlength='32' and contains(@tips, 'caracteres permitidos')]",
                "input[maxlength='32'][tips*='caracteres permitidos']",
                "//input[@maxlength='32' and contains(@class, 'el-input__inner')]",
                "input[maxlength='32'].el-input__inner",
                "//input[contains(@placeholder, 'telefone')]",
                "//input[contains(@name, 'Phone')]",
                "//input[contains(@id, 'Phone')]",
                "input[placeholder*='telefone']",
                "input[name*='Phone']",
                "input[id*='Phone']",
                "//label[text()='Telefone']/following-sibling::*//input",
                "//label[contains(text(), 'Telefone')]/following-sibling::*//input"
            ]
            
            for selector in telefone_selectors:
                try:
                    if selector.startswith("//"):
                        element = WebDriverWait(self.driver, 5).until(
                            EC.presence_of_element_located((By.XPATH, selector))
                        )
                    else:
                        element = WebDriverWait(self.driver, 5).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                        )
                    
                    element.clear()
                    element.send_keys(phone)
                    print(f"✅ Telefone preenchido: {phone}")
                    return True
                except:
                    continue
            
            print("❌ Campo de telefone não encontrado")
            return False
            
        except Exception as e:
            print(f"❌ Erro ao preencher telefone: {e}")
            return False

    def click_expandir(self):
        """Clica no botão 'Expandir'"""
        try:
            print("🔽 Clicando no botão 'Expandir'...")
            
            expandir_selectors = [
                "//button[contains(text(), 'Expandir')]",
                "button:contains('Expandir')",
                "//button[contains(@title, 'Expandir')]",
                "button[title*='Expandir']"
            ]
            
            for selector in expandir_selectors:
                try:
                    if selector.startswith("//"):
                        element = WebDriverWait(self.driver, 5).until(
                            EC.element_to_be_clickable((By.XPATH, selector))
                        )
                    else:
                        element = WebDriverWait(self.driver, 5).until(
                            EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                        )
                    
                    element.click()
                    print("✅ Clicado no botão 'Expandir'")
                    time.sleep(2)
                    return True
                except:
                    continue
            
            print("❌ Botão 'Expandir' não encontrado")
            return False
            
        except Exception as e:
            print(f"❌ Erro ao clicar em Expandir: {e}")
            return False

    def fill_rg(self, cpf):
        """Preenche o campo RG"""
        try:
            print("🆔 Preenchendo RG...")
            time.sleep(2)  # Increased from 1 to 2 for fields to appear
            
            rg_selectors = [
                "//input[@maxlength='128' and contains(@tips, 'Intervalo: [0 a 128]')]",
                "input[maxlength='128'][tips*='Intervalo: [0 a 128]']",
                "//input[contains(@placeholder, 'RG')]",
                "//input[contains(@name, 'RG')]",
                "//input[contains(@id, 'RG')]",
                "input[placeholder*='RG']",
                "input[name*='RG']",
                "input[id*='RG']",
                "//label[text()='N.º de ID']/following-sibling::*//input",
                "//label[contains(text(), 'N.º de ID')]/following-sibling::*//input",
                "input#myDivs"
            ]
            
            for selector in rg_selectors:
                try:
                    if selector.startswith("//"):
                        element = WebDriverWait(self.driver, 5).until(
                            EC.presence_of_element_located((By.XPATH, selector))
                        )
                    else:
                        element = WebDriverWait(self.driver, 5).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                        )
                    
                    element.clear()
                    element.send_keys(cpf)
                    print(f"✅ RG preenchido: {cpf}")
                    return True
                except:
                    continue
            
            print("❌ Campo RG não encontrado")
            return False
            
        except Exception as e:
            print(f"❌ Erro ao preencher RG: {e}")
            return False

    def fill_placa(self):
        """Preenche o campo Placa do veículo"""
        try:
            print("🚗 Preenchendo placa do veículo...")
            
            placa_selectors = [
                "//input[@maxlength='128' and contains(@tips, 'Intervalo: [0 a 128]') and contains(@tips, 'não é possível introduzir carateres como')]",
                "input[maxlength='128'][tips*='Intervalo: [0 a 128]'][tips*='não é possível introduzir carateres como']",
                "//div[contains(@class, 'el-input')]//input[@maxlength='128' and contains(@tips, 'Intervalo: [0 a 128]')]",
                ".el-input input[maxlength='128'][tips*='Intervalo: [0 a 128]']",
                "//input[contains(@placeholder, 'placa')]",
                "//input[contains(@name, 'plate')]",
                "//input[contains(@id, 'plate')]",
                "input[placeholder*='placa']",
                "input[name*='plate']",
                "input[id*='plate']",
                "//label[text()='N.º da matrícula']/following-sibling::*//input",
                "//label[contains(text(), 'N.º da matrícula')]/following-sibling::*//input"
            ]
            
            for selector in placa_selectors:
                try:
                    if selector.startswith("//"):
                        element = WebDriverWait(self.driver, 5).until(
                            EC.presence_of_element_located((By.XPATH, selector))
                        )
                    else:
                        element = WebDriverWait(self.driver, 5).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                        )
                    
                    element.clear()
                    element.send_keys("ABC1234")
                    print("✅ Placa do veículo preenchida: ABC1234")
                    return True
                except:
                    continue
            
            print("❌ Campo Placa do veículo não encontrado")
            return False
            
        except Exception as e:
            print(f"❌ Erro ao preencher placa do veículo: {e}")
            return False

    def upload_photo(self):
        """Faz upload da foto do visitante"""
        try:
            print("📸 Configurando upload de foto...")
            
            # Tentar criar foto padrão
            try:
                self.create_default_photo()
                print("✅ Foto padrão criada com sucesso")
            except Exception as e:
                print(f"⚠️ Erro ao criar foto padrão: {e}")
                return False
            
            # Procurar pelo campo de upload
            upload_selectors = [
                "input[type='file'][accept*='image']",
                "//input[@type='file' and contains(@accept, 'image')]",
                "input.btn-file",
                "//input[contains(@class, 'btn-file')]"
            ]
            
            for selector in upload_selectors:
                try:
                    if selector.startswith("//"):
                        element = WebDriverWait(self.driver, 5).until(
                            EC.presence_of_element_located((By.XPATH, selector))
                        )
                    else:
                        element = WebDriverWait(self.driver, 5).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                        )
                    
                    # Fazer upload da foto
                    photo_path = os.path.abspath("test_photo.jpg")
                    element.send_keys(photo_path)
                    print("✅ Foto enviada com sucesso")
                    time.sleep(2)
                    return True
                except:
                    continue
            
            print("❌ Campo de upload de foto não encontrado")
            return False
            
        except Exception as e:
            print(f"❌ Erro ao fazer upload da foto: {e}")
            return False

    def create_default_photo(self):
        """Cria uma foto padrão para o visitante"""
        try:
            # Criar uma imagem simples com o nome do visitante
            from PIL import Image, ImageDraw, ImageFont
            
            # Criar uma imagem 200x200 com fundo azul claro
            img = Image.new('RGB', (200, 200), color='lightblue')
            draw = ImageDraw.Draw(img)
            
            # Adicionar texto
            try:
                font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 16)
            except:
                font = ImageFont.load_default()
            
            # Desenhar texto centralizado
            text = f"{visitor_name}\nFoto"
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            x = (200 - text_width) // 2
            y = (200 - text_height) // 2
            
            draw.text((x, y), text, fill='black', font=font)
            
            # Salvar a imagem
            photo_path = f"default_photo_{visitor_name.replace(' ', '_')}.jpg"
            img.save(photo_path)
            print(f"✅ Foto padrão criada: {photo_path}")
            return photo_path
        except Exception as e:
            print(f"⚠️ Erro ao criar foto padrão: {e}")
            return None

    def debug_page(self, filename="debug_page.png"):
        """Capturar screenshot para debug"""
        try:
            self.driver.save_screenshot(filename)
            print(f"📸 Screenshot salvo: {filename}")
            
            # Também salvar o HTML da página
            with open(f"{filename.replace('.png', '.html')}", 'w', encoding='utf-8') as f:
                f.write(self.driver.page_source)
            print(f"📄 HTML salvo: {filename.replace('.png', '.html')}")
            
        except Exception as e:
            print(f"❌ Erro ao salvar debug: {e}")

    def find_elements_with_text(self, text):
        """Encontrar elementos que contêm texto específico"""
        try:
            # Buscar por XPath
            elements = self.driver.find_elements(By.XPATH, f"//*[contains(text(), '{text}')]")
            print(f"🔍 Encontrados {len(elements)} elementos com texto '{text}':")
            for i, element in enumerate(elements):
                try:
                    tag = element.tag_name
                    element_text = element.text[:50] + "..." if len(element.text) > 50 else element.text
                    print(f"  {i+1}. <{tag}> {element_text}")
                except:
                    print(f"  {i+1}. <{element.tag_name}> (erro ao ler texto)")
            return elements
        except Exception as e:
            print(f"❌ Erro ao buscar elementos: {e}")
            return []
    
    def close(self):
        """Fechar driver"""
        if self.driver:
            try:
                self.driver.quit()
                print("🔒 Driver fechado")
            except:
                print("⚠️ Erro ao fechar driver")

    def extract_form_html(self):
        """Extrai o HTML do formulário para análise"""
        try:
            # Procurar pelo formulário
            form_selectors = [
                "form.visitor-page-content",
                ".visitor-register-form",
                ".el-form",
                "form"
            ]
            
            for selector in form_selectors:
                try:
                    form_element = WebDriverWait(self.driver, 5).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                    )
                    form_html = form_element.get_attribute('outerHTML')
                    
                    # Salvar o HTML do formulário
                    with open('form_html.html', 'w', encoding='utf-8') as f:
                        f.write(form_html)
                    print("✅ HTML do formulário extraído: form_html.html")
                    
                    # Analisar campos específicos
                    self.analyze_form_fields(form_element)
                    return form_element
                except:
                    continue
            
            print("⚠️ Formulário não encontrado")
            return None
        except Exception as e:
            print(f"⚠️ Erro ao extrair HTML do formulário: {e}")
            return None
    
    def analyze_form_fields(self, form_element):
        """Analisa os campos do formulário encontrados"""
        try:
            # Procurar por todos os inputs
            inputs = form_element.find_elements(By.TAG_NAME, "input")
            print(f"🔍 Encontrados {len(inputs)} campos input:")
            
            for i, input_field in enumerate(inputs):
                input_type = input_field.get_attribute('type')
                input_name = input_field.get_attribute('name')
                input_id = input_field.get_attribute('id')
                input_placeholder = input_field.get_attribute('placeholder')
                input_class = input_field.get_attribute('class')
                
                print(f"  {i+1}. Type: {input_type}, Name: {input_name}, ID: {input_id}, Placeholder: {input_placeholder}")
            
            # Procurar por labels
            labels = form_element.find_elements(By.TAG_NAME, "label")
            print(f"🔍 Encontrados {len(labels)} labels:")
            
            for i, label in enumerate(labels):
                label_text = label.text.strip()
                if label_text:
                    print(f"  {i+1}. Label: {label_text}")
            
        except Exception as e:
            print(f"⚠️ Erro ao analisar campos: {e}")

    def analyze_page_structure(self):
        """Analisa a estrutura da página para debug"""
        try:
            print("🔍 Analisando estrutura da página...")
            
            # Capturar screenshot
            self.driver.save_screenshot("page_analysis.png")
            print("📸 Screenshot salvo: page_analysis.png")
            
            # Analisar elementos principais
            elements_to_find = [
                "//div[contains(@class, 'tab')]",
                "//div[contains(@class, 'menu')]",
                "//div[contains(@class, 'nav')]",
                "//button",
                "//a",
                "//span[contains(text(), 'Visitante')]",
                "//div[contains(text(), 'Visitante')]"
            ]
            
            for selector in elements_to_find:
                try:
                    elements = self.driver.find_elements(By.XPATH, selector)
                    if elements:
                        print(f"🔍 Encontrados {len(elements)} elementos com selector: {selector}")
                        for i, elem in enumerate(elements[:3]):  # Mostrar apenas os primeiros 3
                            try:
                                tag = elem.tag_name
                                text = elem.text[:30] + "..." if len(elem.text) > 30 else elem.text
                                class_attr = elem.get_attribute('class') or ''
                                print(f"  {i+1}. <{tag}> class='{class_attr}' text='{text}'")
                            except:
                                print(f"  {i+1}. <{elem.tag_name}> (erro ao ler)")
                except:
                    continue
            
            # Salvar HTML da página
            with open("page_analysis.html", "w", encoding="utf-8") as f:
                f.write(self.driver.page_source)
            print("📄 HTML salvo: page_analysis.html")
            
        except Exception as e:
            print(f"❌ Erro ao analisar página: {e}")

    def download_visitor_photo(self, visitor_id):
        """Baixa a foto do visitante do banco de dados"""
        try:
            # URL da API para buscar a foto do visitante
            api_url = f"http://localhost:3000/api/visitantes/{visitor_id}/foto"
            
            response = requests.get(api_url)
            if response.status_code == 200:
                # Salvar a foto localmente
                photo_path = f"visitor_photo_{visitor_id}.jpg"
                with open(photo_path, 'wb') as f:
                    f.write(response.content)
                print(f"✅ Foto do visitante baixada: {photo_path}")
                return photo_path
            else:
                print(f"⚠️ Erro ao baixar foto: {response.status_code}")
                return None
        except Exception as e:
            print(f"⚠️ Erro ao baixar foto: {e}")
            return None
    
    def create_default_photo(self):
        """Cria uma foto padrão para o visitante"""
        try:
            # Criar uma imagem simples com o nome do visitante
            from PIL import Image, ImageDraw, ImageFont
            
            # Criar uma imagem 200x200 com fundo azul claro
            img = Image.new('RGB', (200, 200), color='lightblue')
            draw = ImageDraw.Draw(img)
            
            # Adicionar texto
            try:
                font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 16)
            except:
                font = ImageFont.load_default()
            
            # Desenhar texto centralizado
            text = f"{visitor_name}\nFoto"
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            x = (200 - text_width) // 2
            y = (200 - text_height) // 2
            
            draw.text((x, y), text, fill='black', font=font)
            
            # Salvar a imagem
            photo_path = f"default_photo_{visitor_name.replace(' ', '_')}.jpg"
            img.save(photo_path)
            print(f"✅ Foto padrão criada: {photo_path}")
            return photo_path
        except Exception as e:
            print(f"⚠️ Erro ao criar foto padrão: {e}")
            return None

# Função principal para execução direta (mantida para compatibilidade)
def main():
    import sys
    import json
    
    if len(sys.argv) != 2:
        print("Uso: python hikcentral_automation.py '{\"name\":\"Nome\",\"cpf\":\"123\",\"phone\":\"123\",\"email\":\"email\"}'")
        sys.exit(1)
    
    try:
        visitor_data = json.loads(sys.argv[1])
        automation = HikCentralAutomation()
        result = automation.register_visitor(visitor_data)
        
        if result['success']:
            print(f"✅ Sucesso: {result['message']}")
        else:
            print(f"❌ Erro: {result['error']}")
            
    except Exception as e:
        print(f"❌ Erro na execução: {e}")

if __name__ == "__main__":
    main() 