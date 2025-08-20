#!/usr/bin/env python3
"""
Debug específico para campos problemáticos
"""

import time
from selenium.webdriver.common.by import By
from hikcentral_automation import HikCentralAutomation

def debug_campos_especificos():
    """Debug específico dos campos problemáticos"""
    print("🔍 DEBUG CAMPOS ESPECÍFICOS")
    print("=" * 60)
    
    try:
        automation = HikCentralAutomation()
        automation.setup_driver()
        
        # Login e navegação (sabemos que funciona)
        print("🔐 Fazendo login...")
        if not automation.login():
            print("❌ Falha no login")
            return
        
        print("🧭 Navegando para formulário...")
        if not automation.navigate_to_form():
            print("❌ Falha na navegação")
            return
        
        # Preencher campos básicos (sabemos que funciona)
        print("📝 Preenchendo campos básicos...")
        visitor_data = {
            "name": "João Silva Debug",
            "phone": "31999999999",
            "placa_veiculo": "ABC1234"
        }
        
        # Fazer o preenchimento inicial que sabemos que funciona
        time.sleep(2)
        
        # Preencher nome próprio
        first_name_input = automation.driver.find_element(By.CSS_SELECTOR, "input.el-input__inner")
        first_name_input.clear()
        first_name_input.send_keys("João")
        
        # Preencher apelido
        last_name_input = automation.driver.find_element(By.CSS_SELECTOR, "input#myDiv")
        last_name_input.clear()
        last_name_input.send_keys("Silva Debug")
        
        # Navegar até outras informações (sabemos que funciona)
        print("🔍 Navegando até 'Outras informações'...")
        outras_info = automation.driver.find_element(By.XPATH, "//div[@title='Outras informações' and contains(@class, 'item')]")
        outras_info.click()
        time.sleep(2)
        
        # DEBUG 1: ANALISAR GÊNERO
        print("\n" + "="*50)
        print("🔍 DEBUG 1: GÊNERO")
        print("="*50)
        
        try:
            # Procurar todos os radio buttons de gênero
            radio_buttons = automation.driver.find_elements(By.XPATH, "//div[contains(@class, 'el-radio-group')]//label[contains(@class, 'el-radio')]")
            print(f"🔍 Encontrados {len(radio_buttons)} radio buttons de gênero:")
            
            for i, radio in enumerate(radio_buttons):
                try:
                    text = radio.find_element(By.XPATH, ".//span[@class='el-radio__label']").text
                    value = radio.find_element(By.XPATH, ".//input[@type='radio']").get_attribute('value')
                    is_checked = "is-checked" in radio.get_attribute('class')
                    print(f"  {i+1}. Texto: '{text}' | Value: '{value}' | Checked: {is_checked}")
                except Exception as e:
                    print(f"  {i+1}. Erro ao ler radio button: {e}")
                    
        except Exception as e:
            print(f"❌ Erro ao procurar radio buttons: {e}")
        
        # Scroll para baixo para ver mais campos
        print("\n📜 Rolando para baixo...")
        automation.driver.execute_script("window.scrollBy(0, 300);")
        time.sleep(2)
        
        # DEBUG 2: ANALISAR TODOS OS CAMPOS DE INPUT
        print("\n" + "="*50)
        print("🔍 DEBUG 2: TODOS OS CAMPOS DE INPUT")
        print("="*50)
        
        try:
            # Procurar todos os inputs
            all_inputs = automation.driver.find_elements(By.TAG_NAME, "input")
            print(f"🔍 Encontrados {len(all_inputs)} campos de input:")
            
            for i, input_elem in enumerate(all_inputs):
                try:
                    input_type = input_elem.get_attribute('type') or 'text'
                    maxlength = input_elem.get_attribute('maxlength') or 'N/A'
                    placeholder = input_elem.get_attribute('placeholder') or 'N/A'
                    value = input_elem.get_attribute('value') or ''
                    
                    # Tentar encontrar label associado
                    try:
                        parent = input_elem.find_element(By.XPATH, "./ancestor::div[contains(@class, 'el-form-item')]")
                        label = parent.find_element(By.XPATH, ".//label").text
                    except:
                        label = 'N/A'
                    
                    print(f"  {i+1}. Type: {input_type} | MaxLength: {maxlength} | Placeholder: '{placeholder}' | Label: '{label}' | Value: '{value}'")
                    
                except Exception as e:
                    print(f"  {i+1}. Erro ao ler input: {e}")
                    
        except Exception as e:
            print(f"❌ Erro ao procurar inputs: {e}")
        
        # DEBUG 3: CLICAR EM EXPANDIR E ANALISAR MAIS CAMPOS
        print("\n" + "="*50)
        print("🔍 DEBUG 3: APÓS EXPANDIR")
        print("="*50)
        
        try:
            expandir_btn = automation.driver.find_element(By.XPATH, "//span[text()='Expandir']")
            expandir_btn.click()
            print("✅ Clicou em Expandir")
            time.sleep(2)
            
            # Analisar campos após expandir
            expanded_inputs = automation.driver.find_elements(By.CSS_SELECTOR, "input[maxlength='128'], input[maxlength='32']")
            print(f"🔍 Encontrados {len(expanded_inputs)} campos após expandir:")
            
            for i, input_elem in enumerate(expanded_inputs):
                try:
                    maxlength = input_elem.get_attribute('maxlength')
                    placeholder = input_elem.get_attribute('placeholder') or 'N/A'
                    
                    # Tentar encontrar label próximo
                    try:
                        parent = input_elem.find_element(By.XPATH, "./ancestor::div[contains(@class, 'el-form-item') or contains(@class, 'form-item')]")
                        labels = parent.find_elements(By.TAG_NAME, "label")
                        if labels:
                            label = labels[0].text
                        else:
                            # Procurar texto próximo
                            texts = parent.find_elements(By.XPATH, ".//*[text()]")
                            label = texts[0].text if texts else 'N/A'
                    except:
                        label = 'N/A'
                    
                    print(f"  {i+1}. MaxLength: {maxlength} | Placeholder: '{placeholder}' | Label próximo: '{label}'")
                    
                except Exception as e:
                    print(f"  {i+1}. Erro ao ler input expandido: {e}")
                    
        except Exception as e:
            print(f"❌ Erro ao expandir ou analisar: {e}")
        
        print("\n" + "="*50)
        print("🔍 DEBUG COMPLETO")
        print("="*50)
        print("💡 Agora posso identificar exatamente onde cada campo deve ser preenchido!")
        
        # Manter navegador aberto
        print("\n🔍 Navegador mantido aberto para inspeção manual")
        print("💡 Pressione Ctrl+C para fechar")
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 Fechando navegador...")
                
    except Exception as e:
        print(f"❌ ERRO: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        try:
            if 'automation' in locals() and automation.driver:
                automation.close()
        except:
            pass

if __name__ == "__main__":
    debug_campos_especificos() 