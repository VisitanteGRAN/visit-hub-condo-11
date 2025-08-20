#!/usr/bin/env python3
"""
Debug específico para analisar a página após o login
"""

import time
from hikcentral_automation import HikCentralAutomation
from selenium.webdriver.common.by import By

def debug_after_login():
    """Debug da página após login"""
    print("🔍 DEBUG APÓS LOGIN - ANÁLISE DETALHADA")
    print("=" * 60)
    
    try:
        automation = HikCentralAutomation()
        automation.setup_driver()
        
        # Fazer login
        print("🔐 Fazendo login...")
        if automation.login():
            print("✅ Login realizado com sucesso!")
            
            # Aguardar carregamento
            print("⏳ Aguardando carregamento da página...")
            time.sleep(5)
            
            # Analisar estrutura da página
            print("🔍 Analisando estrutura da página...")
            automation.analyze_page_structure()
            
            # Procurar especificamente por elementos com "Visitante"
            print("\n🔍 PROCURANDO ESPECIFICAMENTE POR 'VISITANTE'")
            print("=" * 40)
            
            try:
                # Tentar diferentes métodos
                elements = automation.driver.find_elements(By.XPATH, "//*[contains(text(), 'Visitante')]")
                print(f"🔍 Encontrados {len(elements)} elementos com 'Visitante':")
                
                for i, elem in enumerate(elements[:10]):  # Mostrar apenas os primeiros 10
                    try:
                        tag = elem.tag_name
                        text = elem.text[:50] + "..." if len(elem.text) > 50 else elem.text
                        class_attr = elem.get_attribute('class') or ''
                        id_attr = elem.get_attribute('id') or ''
                        print(f"  {i+1}. <{tag}> id='{id_attr}' class='{class_attr}' text='{text}'")
                        
                        # Verificar se é clicável
                        if elem.is_enabled() and elem.is_displayed():
                            print(f"     ✅ Clicável: Sim")
                        else:
                            print(f"     ❌ Clicável: Não (enabled={elem.is_enabled()}, displayed={elem.is_displayed()})")
                            
                    except Exception as e:
                        print(f"  {i+1}. <{elem.tag_name}> (erro ao ler: {e})")
                        
            except Exception as e:
                print(f"❌ Erro ao procurar elementos: {e}")
            
            # Procurar por tabs
            print("\n🔍 PROCURANDO POR TABS")
            print("=" * 30)
            
            try:
                tabs = automation.driver.find_elements(By.XPATH, "//div[contains(@class, 'tab')]")
                print(f"🔍 Encontrados {len(tabs)} elementos com 'tab':")
                
                for i, tab in enumerate(tabs[:5]):
                    try:
                        tag = tab.tag_name
                        text = tab.text[:30] + "..." if len(tab.text) > 30 else tab.text
                        class_attr = tab.get_attribute('class') or ''
                        print(f"  {i+1}. <{tag}> class='{class_attr}' text='{text}'")
                    except:
                        print(f"  {i+1}. <{tab.tag_name}> (erro ao ler)")
                        
            except Exception as e:
                print(f"❌ Erro ao procurar tabs: {e}")
            
            # Procurar por botões
            print("\n🔍 PROCURANDO POR BOTÕES")
            print("=" * 30)
            
            try:
                buttons = automation.driver.find_elements(By.TAG_NAME, "button")
                print(f"🔍 Encontrados {len(buttons)} botões:")
                
                for i, btn in enumerate(buttons[:10]):
                    try:
                        text = btn.text[:30] + "..." if len(btn.text) > 30 else btn.text
                        class_attr = btn.get_attribute('class') or ''
                        print(f"  {i+1}. <button> class='{class_attr}' text='{text}'")
                    except:
                        print(f"  {i+1}. <button> (erro ao ler)")
                        
            except Exception as e:
                print(f"❌ Erro ao procurar botões: {e}")
            
            # Manter navegador aberto
            print("\n🔍 Navegador mantido aberto para inspeção manual")
            print("💡 Pressione Ctrl+C para fechar")
            
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\n🛑 Fechando navegador...")
                
        else:
            print("❌ Falha no login")
            
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
    debug_after_login() 