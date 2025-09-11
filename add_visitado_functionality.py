#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
FUNCIONALIDADE: Preencher campo "Visitado" no HikCentral
Adicionar este código ao test_form_direct.py após o preenchimento do apelido
"""

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
                    # Verificar se está próximo de um label "Visitado"
                    parent = field.find_element(By.XPATH, "./ancestor::*[contains(text(), 'Visitado') or contains(@class, 'visited')]")
                    if parent:
                        visitado_field = field
                        print(f"[OK] Campo visitado encontrado com: {selector}")
                        break
            except:
                continue
        
        if not visitado_field:
            # Fallback: procurar qualquer campo de pesquisa na seção de visitado
            try:
                visitado_field = WebDriverWait(self.driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, "//input[@placeholder='Pesquisar']"))
                )
                print("[OK] Campo visitado encontrado (fallback)")
            except:
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

# CÓDIGO PARA ADICIONAR NO test_form_direct.py:
# Adicionar esta linha após o preenchimento do apelido (linha ~753):
# 
# # VISITADO - Nome do morador
# self.preencher_campo_visitado()
