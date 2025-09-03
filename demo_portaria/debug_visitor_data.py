#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Debug dos dados do visitante - verificar se estão chegando corretamente
"""

import json
import sys
import argparse

def debug_visitor_data():
    """Debug dos dados do visitante"""
    print("\n" + "="*60)
    print("[DEBUG] VERIFICANDO DADOS DO VISITANTE")
    print("="*60)
    
    parser = argparse.ArgumentParser()
    parser.add_argument('--visitor-data', help='Caminho para arquivo JSON com dados do visitante')
    parser.add_argument('--visitor-id', help='ID do visitante')
    args = parser.parse_args()
    
    print(f"[INFO] Argumentos recebidos:")
    print(f"  --visitor-data: {args.visitor_data}")
    print(f"  --visitor-id: {args.visitor_id}")
    
    # Verificar se arquivo existe
    if args.visitor_data:
        try:
            import os
            exists = os.path.exists(args.visitor_data)
            print(f"[INFO] Arquivo existe: {exists}")
            
            if exists:
                # Ler tamanho do arquivo
                size = os.path.getsize(args.visitor_data)
                print(f"[INFO] Tamanho do arquivo: {size} bytes")
                
                # Ler conteúdo
                with open(args.visitor_data, 'r', encoding='utf-8') as f:
                    content = f.read()
                    print(f"[INFO] Conteúdo bruto:")
                    print(content)
                    
                # Tentar parse JSON
                try:
                    with open(args.visitor_data, 'r', encoding='utf-8') as f:
                        visitor_data = json.load(f)
                    
                    print(f"\n[OK] JSON parseado com sucesso!")
                    print(f"[INFO] Dados do visitante:")
                    for key, value in visitor_data.items():
                        print(f"  {key}: '{value}'")
                        
                    # Verificar campos específicos
                    campos_importantes = ['nome', 'name', 'sobrenome', 'telefone', 'phone', 'cpf', 'rg', 'placa', 'placaVeiculo', 'genero', 'foto']
                    
                    print(f"\n[INFO] Verificação de campos importantes:")
                    for campo in campos_importantes:
                        valor = visitor_data.get(campo, 'NÃO ENCONTRADO')
                        print(f"  {campo}: {valor}")
                        
                except Exception as e:
                    print(f"[ERRO] Erro ao fazer parse do JSON: {e}")
                    
        except Exception as e:
            print(f"[ERRO] Erro ao verificar arquivo: {e}")
    else:
        print("[WARN] Nenhum arquivo de dados fornecido")
    
    # Verificar foto
    if args.visitor_id:
        foto_path = f"visitor_photo_{args.visitor_id}.jpg"
        try:
            import os
            foto_exists = os.path.exists(foto_path)
            print(f"\n[INFO] Foto {foto_path} existe: {foto_exists}")
            if foto_exists:
                foto_size = os.path.getsize(foto_path)
                print(f"[INFO] Tamanho da foto: {foto_size} bytes")
        except Exception as e:
            print(f"[ERRO] Erro ao verificar foto: {e}")

if __name__ == "__main__":
    debug_visitor_data()