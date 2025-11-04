#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
TESTE DA API DE NORMALIZAÇÃO DE NOMES
Verifica se a API está funcionando corretamente
"""

import requests
import json

def test_api_normalizacao():
    """Testar API de normalização de nomes"""
    
    api_url = "https://granroyalle-visitantes.vercel.app/api/morador-by-name"
    
    # Casos de teste
    test_cases = [
        "José da Silva",
        "Maria José",
        "João Paulo",
        "Ana Cláudia",
        "Lucca Téste acentó",  # Nome com acentos
        "Pedro",
        "Carlos Eduardo"
    ]
    
    print("🧪 TESTANDO API DE NORMALIZAÇÃO DE NOMES")
    print("="*60)
    
    for nome_original in test_cases:
        print(f"\n🔍 Testando: '{nome_original}'")
        
        try:
            response = requests.get(
                api_url,
                params={"nome": nome_original},
                timeout=10
            )
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                morador = data.get('morador', {})
                busca = data.get('busca', {})
                
                print(f"   ✅ Encontrado: {morador.get('nome', 'N/A')}")
                print(f"   📝 Normalizado: {morador.get('nome_normalized', 'N/A')}")
                print(f"   🔧 Método: {busca.get('metodo', 'N/A')}")
                
            elif response.status_code == 404:
                data = response.json()
                print(f"   ❌ Não encontrado: {data.get('message', 'N/A')}")
                print(f"   📝 Normalizado: {data.get('nome_normalizado', 'N/A')}")
                
            else:
                print(f"   ⚠️ Erro: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   💬 Mensagem: {error_data.get('message', 'N/A')}")
                except:
                    print(f"   💬 Resposta: {response.text[:100]}")
                    
        except requests.exceptions.Timeout:
            print(f"   ⏰ Timeout na requisição")
        except requests.exceptions.RequestException as e:
            print(f"   🚫 Erro de conexão: {e}")
        except Exception as e:
            print(f"   ❌ Erro inesperado: {e}")
    
    print("\n" + "="*60)
    print("🏁 TESTE CONCLUÍDO")

if __name__ == "__main__":
    test_api_normalizacao()
