#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Reativação de Visitantes - HikCentral
Processo otimizado para reativar visitantes existentes por CPF
"""

import sys
import os
import json
import time
import argparse
import logging
from datetime import datetime, timezone
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service

class HikCentralReactivator:
    def __init__(self, visitor_data, visitor_id, headless=True):
        self.visitor_data = visitor_data
        self.visitor_id = visitor_id
        self.headless = headless
        self.driver = None
        
        # URLs e credenciais do ambiente
        self.hikcentral_url = os.getenv('HIKCENTRAL_URL', 'http://192.168.1.100:8090')
        self.username = os.getenv('HIKCENTRAL_USERNAME', 'admin')
        self.password = os.getenv('HIKCENTRAL_PASSWORD', 'admin123')
        
        print(f"[INIT] Reativador inicializado para CPF: {visitor_data.get('cpf', 'N/A')}")

    def setup_chrome(self):
        """Configurar Chrome para reativação rápida"""
        print("[SETUP] Configurando Chrome para reativação...")
        
        try:
            # Limpeza agressiva de processos
            import subprocess
            processes = ['chrome.exe', 'chromedriver.exe', 'chromium.exe', 'msedge.exe']
            for process in processes:
                try:
                    subprocess.run(['taskkill', '/f', '/im', process, '/t'], 
                                 capture_output=True, check=False)
                except:
                    pass
            
            print("[INFO] Limpeza de processos concluída")
            time.sleep(2)  # Reduzido para reativação
        except Exception as e:
            print(f"[WARN] Erro na limpeza: {e}")

        options = Options()
        # Configurações de segurança
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-plugins")
        options.add_argument("--disable-web-security")
        options.add_argument("--disable-features=VizDisplayCompositor")
        
        # Otimizações extras para reativação
        options.add_argument("--disable-background-timer-throttling")
        options.add_argument("--disable-backgrounding-occluded-windows")
        options.add_argument("--disable-renderer-backgrounding")
        options.add_argument("--disable-features=TranslateUI")
        options.add_argument("--aggressive-cache-discard")
        options.add_argument("--disable-default-apps")
        options.add_argument("--disable-sync")
        options.add_argument("--disable-images")  # Não carregar imagens para acelerar
        
        print("[INFO] Configuração Chrome otimizada para reativação")

        if self.headless:
            options.add_argument("--headless")
            print("[INFO] Modo headless ativado")

        # Estratégias de inicialização Chrome
        strategies = [
            # Estratégia 1: ChromeDriverManager
            lambda: webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options),
            # Estratégia 2: Chrome básico
            lambda: webdriver.Chrome(options=options),
            # Estratégia 3: Minimalista
            lambda: webdriver.Chrome(options=Options())
        ]

        for i, strategy in enumerate(strategies, 1):
            try:
                print(f"[CHROME] Tentativa {i}/3...")
                self.driver = strategy()
                print(f"[OK] Chrome inicializado com estratégia {i}")
                return True
            except Exception as e:
                print(f"[ERRO] Estratégia {i} falhou: {e}")
                if i < len(strategies):
                    time.sleep(2)
                continue
        
        print("[ERRO] Todas as estratégias de Chrome falharam")
        return False

    def close_any_message_box(self):
        """Fechar qualquer caixa de mensagem que possa estar bloqueando"""
        try:
            message_selectors = [
                "//div[contains(@class, 'el-message-box__wrapper')]",
                "//span[contains(text(), 'Instalar')]/parent::button",
                "//button[contains(@class, 'el-message-box__close')]",
                ".el-message-box__close"
            ]
            
            for selector in message_selectors:
                try:
                    if selector.startswith("//"):
                        elements = self.driver.find_elements(By.XPATH, selector)
                    else:
                        elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    
                    for element in elements:
                        if element.is_displayed():
                            element.click()
                            print("[OK] Caixa de mensagem fechada")
                            time.sleep(0.5)
                            return True
                except:
                    continue
            
            # Tentar ESC como último recurso
            try:
                ActionChains(self.driver).send_keys(Keys.ESCAPE).perform()
                time.sleep(0.5)
            except:
                pass
                
        except Exception as e:
            print(f"[WARN] Erro ao fechar message box: {e}")
        
        return False

    def login(self):
        """Fazer login no HikCentral - COPIADO DO SCRIPT FUNCIONAL"""
        url = os.getenv('HIKCENTRAL_URL')
        username = os.getenv('HIKCENTRAL_USERNAME')
        password = os.getenv('HIKCENTRAL_PASSWORD')
        
        print(f"[LOGIN] Fazendo login em {url}...")
        
        try:
            self.driver.get(url)
            time.sleep(5)
            
            # Login usando IDs - EXATAMENTE COMO FUNCIONAVA
            username_field = self.driver.find_element(By.ID, "username")
            password_field = self.driver.find_element(By.ID, "password")
            
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
            time.sleep(4)  # Reduzido para reativação
            
            return True
            
        except Exception as e:
            print(f"[ERRO] Erro no login: {e}")
            return False

    def navigate_to_visitor_info(self):
        """Navegar para área de informações de visitantes - CORRIGIDO: SEM CLICAR NO SIDEBAR"""
        try:
            print("[NAV] Navegando para informações de visitantes...")
            
            # 1. Procurar elemento Visitante - CÓDIGO ORIGINAL QUE FUNCIONAVA
            print("[NAV] Procurando menu 'Visitante'...")
            visitante_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Visitante')]")
            if len(visitante_elements) >= 2:
                print(f"[OK] Encontrados {len(visitante_elements)} elementos com 'Visitante'")
                visitante_elements[1].click()  # SEGUNDA OCORRÊNCIA COMO NO ORIGINAL
                print("[OK] Clicado em 'Visitante' - Sidebar aberta automaticamente!")
                time.sleep(3)
            else:
                print("[ERRO] Elemento 'Visitante' não encontrado")
                return False
            
            # 2. Aguardar sidebar carregar (já foi aberta automaticamente)
            print("[WAIT] Aguardando sidebar carregar automaticamente...")
            time.sleep(2)
            
            # 3. Clicar DIRETAMENTE em "Entrada de visitante" (na sidebar que já está aberta)
            print("[NAV] Clicando em 'Entrada de visitante' na sidebar...")
            entrada_selectors = [
                "//span[contains(text(), 'Entrada de visitante')]",
                "//span[@id='subMenuTitle4' and contains(text(), 'Entrada de visitante')]",
                ".el-submenu__title--text span[title='Entrada de visitante']",
                "*[title='Entrada de visitante']",
                "//span[contains(@class, 'el-submenu__title--text')]//span[contains(text(), 'Entrada de visitante')]"
            ]
            
            entrada_clicked = False
            for selector in entrada_selectors:
                try:
                    if selector.startswith("//"):
                        entrada_element = self.driver.find_element(By.XPATH, selector)
                    else:
                        entrada_element = self.driver.find_element(By.CSS_SELECTOR, selector)
                    
                    if entrada_element.is_displayed():
                        # Scroll para o elemento antes de clicar
                        self.driver.execute_script("arguments[0].scrollIntoView(true);", entrada_element)
                        time.sleep(0.5)
                        entrada_element.click()
                        print(f"[OK] 'Entrada de visitante' clicado usando: {selector}")
                        entrada_clicked = True
                        time.sleep(2)
                        break
                except Exception as e:
                    print(f"[WARN] Entrada selector {selector} falhou: {e}")
                    continue
            
            if not entrada_clicked:
                print("[ERRO] Não foi possível clicar em 'Entrada de visitante'")
                # Debug: listar elementos visíveis
                try:
                    print("[DEBUG] Procurando elementos com 'Entrada'...")
                    entrada_debug = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Entrada')]")
                    for i, elem in enumerate(entrada_debug[:5]):
                        try:
                            text = elem.text
                            tag = elem.tag_name
                            visible = elem.is_displayed()
                            print(f"[DEBUG] Elemento {i}: '{text}' (tag={tag}, visible={visible})")
                        except:
                            pass
                except:
                    pass
                return False
            
            # 4. Clicar em "Informação de visitante"
            print("[NAV] Clicando em 'Informação de visitante'...")
            info_selectors = [
                "//span[contains(@class, 'el-menu-item--text') and contains(text(), 'Informação de visitante')]",
                "//span[contains(text(), 'Informação de visitante')]",
                "*[title='Informação de visitante']"
            ]
            
            info_clicked = False
            for selector in info_selectors:
                try:
                    if selector.startswith("//"):
                        info_element = self.driver.find_element(By.XPATH, selector)
                    else:
                        info_element = self.driver.find_element(By.CSS_SELECTOR, selector)
                    
                    if info_element.is_displayed():
                        self.driver.execute_script("arguments[0].scrollIntoView(true);", info_element)
                        time.sleep(0.5)
                        info_element.click()
                        print(f"[OK] 'Informação de visitante' clicado usando: {selector}")
                        info_clicked = True
                        time.sleep(2)
                        break
                except Exception as e:
                    print(f"[WARN] Info selector {selector} falhou: {e}")
                    continue
            
            if not info_clicked:
                print("[ERRO] Não foi possível clicar em 'Informação de visitante'")
                return False
            
            # 5. Clicar em "VisitanteS"
            print("[NAV] Clicando em 'VisitanteS'...")
            visitantes_selectors = [
                "//span[contains(@class, 'node_name') and contains(text(), 'VisitanteS')]",
                "//span[contains(text(), 'VisitanteS')]",
                "*[class*='node_name']:contains('VisitanteS')"
            ]
            
            visitantes_clicked = False
            for selector in visitantes_selectors:
                try:
                    if selector.startswith("//"):
                        visitantes_element = self.driver.find_element(By.XPATH, selector)
                    else:
                        visitantes_element = self.driver.find_element(By.CSS_SELECTOR, selector)
                    
                    if visitantes_element.is_displayed():
                        self.driver.execute_script("arguments[0].scrollIntoView(true);", visitantes_element)
                        time.sleep(0.5)
                        visitantes_element.click()
                        print(f"[OK] 'VisitanteS' clicado usando: {selector}")
                        visitantes_clicked = True
                        time.sleep(2)
                        break
                except Exception as e:
                    print(f"[WARN] VisitanteS selector {selector} falhou: {e}")
                    continue
            
            if not visitantes_clicked:
                print("[ERRO] Não foi possível clicar em 'VisitanteS'")
                return False
            
            print("[SUCCESS] Navegação para área de visitantes concluída!")
            return True
            
        except Exception as e:
            print(f"[ERRO] Erro na navegação: {e}")
            return False

    def search_visitor_by_cpf(self, cpf):
        """Buscar visitante pelo CPF"""
        try:
            print(f"[SEARCH] Buscando visitante por CPF: {cpf}")
            
            # 1. Clicar no filtro (funil)
            filter_btn = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button[title=''] i.icomoon-common_btn_filter"))
            )
            filter_btn.click()
            print("[OK] Filtro aberto")
            time.sleep(1)
            
            # 2. Inserir CPF no campo de filtro
            cpf_input = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input.el-input__inner[placeholder='']"))
            )
            cpf_input.clear()
            cpf_input.send_keys(cpf)
            print(f"[OK] CPF {cpf} inserido")
            time.sleep(0.5)
            
            # 3. Clicar no botão "Filtro" para buscar
            filtro_btn = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[@title='Filtro']//span[text()='Filtro']"))
            )
            filtro_btn.click()
            print("[OK] Busca executada")
            time.sleep(2)
            
            # Verificar se encontrou resultado - VERIFICAÇÃO MELHORADA
            try:
                # Aguardar um pouco para a tabela carregar
                time.sleep(2)
                
                # Múltiplas estratégias para detectar visitante
                detection_strategies = [
                    # Estratégia 1: Tabela com data-row-key
                    lambda: self.driver.find_elements(By.CSS_SELECTOR, "tr[data-row-key]"),
                    # Estratégia 2: Qualquer linha de tabela visível
                    lambda: self.driver.find_elements(By.CSS_SELECTOR, "tbody tr:not(.el-table__empty-row)"),
                    # Estratégia 3: Presença de botão "Reservar novamente"
                    lambda: self.driver.find_elements(By.CSS_SELECTOR, "button[title='Reservar novamente']"),
                    # Estratégia 4: Presença do nome Lucca
                    lambda: self.driver.find_elements(By.XPATH, "//td[contains(text(), 'Lucca')]"),
                ]
                
                for i, strategy in enumerate(detection_strategies, 1):
                    try:
                        results = strategy()
                        if results:
                            print(f"[FOUND] Visitante encontrado! Estratégia {i} detectou {len(results)} elemento(s)")
                            
                            # Log do conteúdo encontrado para debug
                            if i == 4:  # Se encontrou pelo nome
                                for result in results[:2]:  # Máximo 2 elementos
                                    print(f"[DEBUG] Texto encontrado: {result.text}")
                            
                            return True
                    except Exception as e:
                        print(f"[DEBUG] Estratégia {i} falhou: {e}")
                        continue
                
                print("[NOT_FOUND] Nenhum visitante encontrado com todas as estratégias")
                return False
                
            except Exception as e:
                print(f"[ERRO] Erro na verificação de resultados: {e}")
                return False
                
        except Exception as e:
            print(f"[ERRO] Erro na busca: {e}")
            return False

    def reactivate_visitor(self, morador_nome):
        """Reativar o visitante encontrado"""
        try:
            print("[REACTIVATE] Iniciando reativação...")
            
            # 1. Clicar no botão de "Reservar novamente" (relógio) - SELETOR CORRIGIDO
            print("[REACTIVATE] Procurando botão 'Reservar novamente'...")
            
            # Múltiplos seletores para o botão de reativação - BASEADO NO DEBUG QUE FUNCIONOU
            reservar_selectors = [
                "button[title='Reservar novamente']",  # Este funcionou no debug!
                "button[title='Reservar novamente'].el-button--iconButton",
                "button.el-button--iconButton[title='Reservar novamente']",
                "//button[@title='Reservar novamente']",
                "//i[@class='icomoon-common_appoint']/parent::button",
                "//button[contains(@class, 'el-button--iconButton')][@title='Reservar novamente']",
                "i.icomoon-common_appoint"
            ]
            
            reservar_clicked = False
            for selector in reservar_selectors:
                try:
                    print(f"[DEBUG] Tentando seletor: {selector}")
                    
                    if selector.startswith("//"):
                        reservar_element = self.driver.find_element(By.XPATH, selector)
                    else:
                        reservar_element = self.driver.find_element(By.CSS_SELECTOR, selector)
                    
                    if reservar_element.is_displayed() and reservar_element.is_enabled():
                        # Scroll para o elemento
                        self.driver.execute_script("arguments[0].scrollIntoView(true);", reservar_element)
                        time.sleep(0.5)
                        
                        # Tentar clicar
                        try:
                            reservar_element.click()
                        except:
                            # Fallback: clicar via JavaScript
                            self.driver.execute_script("arguments[0].click();", reservar_element)
                        
                        print(f"[OK] Botão 'Reservar novamente' clicado usando: {selector}")
                        reservar_clicked = True
                        time.sleep(2)
                        break
                    else:
                        print(f"[DEBUG] Elemento não clicável (visible={reservar_element.is_displayed()}, enabled={reservar_element.is_enabled()})")
                        
                except Exception as e:
                    print(f"[WARN] Seletor {selector} falhou: {e}")
                    continue
            
            if not reservar_clicked:
                print("[ERRO] Não foi possível clicar no botão 'Reservar novamente'")
                # Debug: listar botões disponíveis
                try:
                    print("[DEBUG] Procurando botões com 'Reservar'...")
                    reservar_debug = self.driver.find_elements(By.XPATH, "//*[contains(@title, 'Reservar')]")
                    for i, elem in enumerate(reservar_debug):
                        try:
                            title = elem.get_attribute("title")
                            classes = elem.get_attribute("class")
                            visible = elem.is_displayed()
                            tag = elem.tag_name
                            print(f"[DEBUG] Elemento {i}: title='{title}', class='{classes}', visible={visible}, tag={tag}")
                        except:
                            pass
                except:
                    pass
                return False
            
            # 2. Preencher campo "Visitado" com nome do morador - SELETOR ATUALIZADO
            visitado_selectors = [
                # Seletor baseado no HTML atual fornecido
                "div.el-input.b-row.search-input input.el-input__inner[placeholder='Pesquisar']",
                # Fallbacks
                "input[placeholder='Pesquisar'][clearable='true'].el-input__inner",
                "input.el-input__inner[placeholder='Pesquisar']",
                "input[placeholder='Pesquisar'].el-input__inner"
            ]
            
            visitado_input = None
            for selector in visitado_selectors:
                try:
                    visitado_input = WebDriverWait(self.driver, 5).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                    )
                    print(f"[OK] Campo visitado encontrado com: {selector}")
                    break
                except:
                    continue
            
            if not visitado_input:
                raise Exception("Campo visitado não encontrado com nenhum seletor")
            visitado_input.clear()
            
            # Digitar apenas os 3 primeiros nomes do morador
            nomes = morador_nome.split(' ')
            nome_busca = ' '.join(nomes[:3])  # Primeiros 3 nomes
            
            visitado_input.send_keys(nome_busca)
            print(f"[OK] Nome do morador inserido (3 primeiros): {nome_busca}")
            time.sleep(1)
            
            # 3. Selecionar "Pesquisar por nome da pessoa"
            try:
                pesquisar_opcao = WebDriverWait(self.driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, "//li[contains(@class, 'el-autocomplete-suggestion__item')]//label[contains(text(), 'Pesquisar por nome da pessoa')]"))
                )
                pesquisar_opcao.click()
                print("[OK] Opção 'Pesquisar por nome da pessoa' selecionada")
                time.sleep(2)
            except:
                print("[WARN] Opção de pesquisa não apareceu, continuando...")
            
            # 4. Selecionar o morador que aparecer
            try:
                morador_item = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, ".person-search-panel .person-info-search-item-template"))
                )
                morador_item.click()
                print("[OK] Morador selecionado")
                time.sleep(1)
            except:
                print("[WARN] Morador não encontrado automaticamente")
            
            # 4.5. Configurar duração da reativação ⭐ NOVO!
            self.configurar_duracao_reativacao()
            
            # 5. Rolar para baixo para encontrar botão "Reservar"
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(1)
            
            # 6. Clicar no botão "Reservar" final
            reservar_final_btn = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[@title='Reservar']//span[text()='Reservar']"))
            )
            reservar_final_btn.click()
            print("[SUCCESS] Botão 'Reservar' final clicado - REATIVAÇÃO CONCLUÍDA!")
            time.sleep(3)
            
            return True
            
        except Exception as e:
            print(f"[ERRO] Erro na reativação: {e}")
            return False

    def run_reactivation(self):
        """Executar processo completo de reativação"""
        try:
            print("[START] Iniciando processo de reativação...")
            
            # Setup Chrome
            if not self.setup_chrome():
                return False
            
            # Login
            if not self.login():
                return False
            
            # Navegar para área de visitantes
            if not self.navigate_to_visitor_info():
                return False
            
            # Buscar visitante por CPF
            cpf = self.visitor_data.get('cpf', '')
            if not self.search_visitor_by_cpf(cpf):
                print(f"[ERRO] Visitante com CPF {cpf} não encontrado para reativação")
                return False
            
            # Reativar visitante
            morador_nome = self.visitor_data.get('morador_nome', 'lucca lacerda')  # Default para teste
            if not self.reactivate_visitor(morador_nome):
                return False
            
            print("[SUCCESS] REATIVAÇÃO CONCLUÍDA COM SUCESSO!")
            return True
            
        except Exception as e:
            print(f"[ERRO] Erro durante reativação: {e}")
            return False
        finally:
            if self.driver:
                try:
                    self.driver.quit()
                    print("[CLEANUP] Chrome fechado")
                except:
                    pass

    def configurar_duracao_reativacao(self):
        """Configurar duração da reativação (sempre alterar data da direita)"""
        print("\n[REACTIVATE] Configurando duração da reativação...")
        
        try:
            # Obter duração dos dados do visitante (padrão 1 dia)
            validade_dias = self.visitor_data.get('validade_dias', 1)
            print(f"[DEBUG] validade_dias lido: '{validade_dias}' (tipo: {type(validade_dias)})")
            print(f"[INFO] Duração solicitada: {validade_dias} dia(s)")
            
            # ⭐ NOVA LÓGICA: Só mexer se for MAIOR que 1 dia  
            if int(validade_dias) <= 1:
                print(f"[SKIP] Duração é {validade_dias} dia - mantendo padrão do sistema (1 dia)")
                return
                
            print(f"[INFO] Configurando duração personalizada para {validade_dias} dia(s)")
            
            # Encontrar campos de data (procurar o da direita - input placeholder="$t('end_time')")
            data_selectors = [
                "input.el-range-input[placeholder*='end_time']",
                "input.el-range-input:nth-child(2)",  # Segundo input do range
                "input.el-range-input:last-child"    # Último input do range
            ]
            
            data_field = None
            for selector in data_selectors:
                try:
                    field = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if field.is_displayed() and field.is_enabled():
                        data_field = field
                        print(f"[OK] Campo de data da direita encontrado com: {selector}")
                        break
                except:
                    continue
            
            if not data_field:
                # Fallback: procurar qualquer input de range e pegar o último
                try:
                    range_inputs = self.driver.find_elements(By.CSS_SELECTOR, "input.el-range-input")
                    if len(range_inputs) >= 2:
                        data_field = range_inputs[-1]  # Último input (da direita)
                        print("[OK] Campo de data encontrado via fallback (último range input)")
                except:
                    pass
            
            if not data_field:
                print("[WARN] Campo de data da direita não encontrado")
                return
            
            # Scroll para o elemento
            self.driver.execute_script("arguments[0].scrollIntoView(true);", data_field)
            time.sleep(1)
            
            # Clicar no campo para ativar
            try:
                data_field.click()
            except Exception as e:
                if "click intercepted" in str(e):
                    print("[WARN] Clique interceptado, tentando JavaScript...")
                    self.driver.execute_script("arguments[0].click();", data_field)
            
            time.sleep(1)
            
            # Ler data atual do campo para calcular corretamente
            try:
                data_atual_campo = data_field.get_attribute('value') or data_field.get_attribute('placeholder') or ""
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
            print("[DEBUG] Tentando limpar campo da direita...")
            
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
            
            print(f"[OK] Duração da reativação configurada - {nova_data}")
            
        except Exception as e:
            print(f"[WARN] Erro ao configurar duração da reativação: {e}")

def main():
    parser = argparse.ArgumentParser(description='Reativar visitante no HikCentral')
    parser.add_argument('--visitor-id', required=True, help='ID do visitante')
    parser.add_argument('--headless', action='store_true', help='Executar em modo headless')
    args = parser.parse_args()
    
    # Carregar dados do visitante
    try:
        # Procurar arquivo JSON com dados do visitante
        script_dir = os.path.dirname(os.path.abspath(__file__))
        json_file = os.path.join(script_dir, f'visitor_data_{args.visitor_id}.json')
        
        if os.path.exists(json_file):
            with open(json_file, 'r', encoding='utf-8') as f:
                visitor_data = json.load(f)
            print(f"[DATA] Dados carregados: {json_file}")
        else:
            print(f"[ERRO] Arquivo de dados não encontrado: {json_file}")
            return False
    except Exception as e:
        print(f"[ERRO] Erro ao carregar dados: {e}")
        return False
    
    # Carregar variáveis de ambiente
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except Exception as e:
        print(f"[ERRO] Erro ao carregar .env: {e}")
        return False
    
    reactivator = HikCentralReactivator(visitor_data, args.visitor_id, args.headless)
    
    try:
        return reactivator.run_reactivation()
    except Exception as e:
        print(f"[ERRO] Erro na reativação: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
