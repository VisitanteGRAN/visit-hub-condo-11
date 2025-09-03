#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DEBUG - Verificar dados do visitante
"""

import json
import os
import sys
import tempfile

def main():
    if len(sys.argv) < 2:
        print("Uso: python debug_visitor_data.py <arquivo_json>")
        return
    
    json_file = sys.argv[1]
    
    try:
        print(f"=== DEBUG VISITOR DATA ===")
        print(f"Arquivo: {json_file}")
        print(f"Existe: {os.path.exists(json_file)}")
        
        if os.path.exists(json_file):
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            print(f"Conteudo:")
            for key, value in data.items():
                print(f"  {key}: {value}")
            
            # Verificar foto
            photo_path = data.get('photo_path')
            if photo_path:
                print(f"Foto path: {photo_path}")
                print(f"Foto existe: {os.path.exists(photo_path)}")
                if os.path.exists(photo_path):
                    size = os.path.getsize(photo_path)
                    print(f"Tamanho da foto: {size} bytes")
            else:
                print("Nenhuma foto especificada")
        
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    main() 