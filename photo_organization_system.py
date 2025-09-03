#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
📂 SISTEMA DE ORGANIZAÇÃO DE FOTOS
=================================
Sistema que garante identificação única e organização segura das fotos
para evitar confusões entre visitantes
"""

import os
import hashlib
import time
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

class PhotoOrganizationSystem:
    """Sistema de organização segura de fotos por visitante"""
    
    def __init__(self, base_dir: str = "."):
        self.base_dir = Path(base_dir)
        self.photos_dir = self.base_dir / "photos"
        self.temp_dir = self.base_dir / "temp"
        self.index_file = self.photos_dir / "photo_index.json"
        
        # Criar diretórios
        self.photos_dir.mkdir(exist_ok=True)
        self.temp_dir.mkdir(exist_ok=True)
        
        # Carregar ou criar índice
        self.photo_index = self.load_photo_index()
    
    def generate_unique_visitor_id(self, name: str, cpf: str, phone: str = None) -> str:
        """
        Gera ID único e determinístico para visitante
        
        Args:
            name: Nome completo do visitante
            cpf: CPF do visitante
            phone: Telefone opcional
            
        Returns:
            str: ID único no formato "visitor_hash_timestamp"
        """
        # Normalizar dados para gerar hash consistente
        name_clean = name.strip().lower().replace(" ", "")
        cpf_clean = cpf.replace(".", "").replace("-", "").replace(" ", "")
        
        # Dados para hash
        hash_data = f"{name_clean}_{cpf_clean}"
        if phone:
            phone_clean = phone.replace("(", "").replace(")", "").replace("-", "").replace(" ", "")
            hash_data += f"_{phone_clean}"
        
        # Gerar hash único
        visitor_hash = hashlib.md5(hash_data.encode()).hexdigest()[:8]
        timestamp = int(time.time())
        
        visitor_id = f"visitor_{name_clean[:8]}_{visitor_hash}_{timestamp}"
        
        print(f"🆔 ID gerado para {name}: {visitor_id}")
        return visitor_id
    
    def get_photo_filename(self, visitor_id: str, file_extension: str = "jpg") -> str:
        """
        Gera nome único para arquivo de foto
        
        Args:
            visitor_id: ID único do visitante
            file_extension: Extensão do arquivo
            
        Returns:
            str: Nome do arquivo de foto
        """
        timestamp = int(time.time())
        return f"{visitor_id}_photo_{timestamp}.{file_extension}"
    
    def save_visitor_photo_secure(self, visitor_id: str, photo_base64: str, metadata: Dict) -> Dict:
        """
        Salva foto com segurança máxima e rastreabilidade
        
        Args:
            visitor_id: ID único do visitante
            photo_base64: Dados da foto em base64
            metadata: Metadados do visitante
            
        Returns:
            Dict: Resultado da operação
        """
        try:
            print(f"📸 Salvando foto segura para visitante: {visitor_id}")
            
            # Gerar nome único para foto
            photo_filename = self.get_photo_filename(visitor_id)
            photo_path = self.photos_dir / photo_filename
            
            # Limpar base64
            if ',' in photo_base64:
                photo_base64 = photo_base64.split(',')[1]
            
            # Salvar foto
            import base64
            photo_bytes = base64.b64decode(photo_base64)
            
            with open(photo_path, 'wb') as f:
                f.write(photo_bytes)
            
            # Calcular hash da foto para verificação
            photo_hash = hashlib.sha256(photo_bytes).hexdigest()
            
            # Criar registro completo
            photo_record = {
                'visitor_id': visitor_id,
                'filename': photo_filename,
                'filepath': str(photo_path),
                'file_size': len(photo_bytes),
                'photo_hash': photo_hash,
                'created_at': datetime.now().isoformat(),
                'metadata': {
                    'name': metadata.get('name', ''),
                    'cpf': metadata.get('cpf', ''),
                    'phone': metadata.get('phone', ''),
                    'upload_ip': metadata.get('ip', 'unknown'),
                    'user_agent': metadata.get('user_agent', 'unknown')
                }
            }
            
            # Salvar metadados em JSON
            metadata_path = photo_path.with_suffix('.json')
            with open(metadata_path, 'w') as f:
                json.dump(photo_record, f, indent=2)
            
            # Atualizar índice
            self.add_to_index(visitor_id, photo_record)
            
            print(f"✅ Foto salva com segurança: {photo_filename}")
            print(f"🔍 Hash da foto: {photo_hash[:16]}...")
            
            return {
                'success': True,
                'photo_record': photo_record,
                'message': 'Foto salva com segurança máxima'
            }
            
        except Exception as e:
            print(f"❌ Erro ao salvar foto segura: {e}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Erro ao processar foto'
            }
    
    def create_temp_photo_for_automation(self, visitor_id: str, photo_base64: str) -> Optional[str]:
        """
        Cria foto temporária EXCLUSIVA para automação
        
        Args:
            visitor_id: ID único do visitante
            photo_base64: Dados da foto
            
        Returns:
            str: Caminho para foto temporária ou None se falhar
        """
        try:
            # Nome temporário único
            timestamp = int(time.time())
            temp_filename = f"automation_{visitor_id}_{timestamp}.jpg"
            temp_path = self.temp_dir / temp_filename
            
            print(f"📄 Criando foto temporária: {temp_filename}")
            
            # Limpar base64
            if ',' in photo_base64:
                photo_base64 = photo_base64.split(',')[1]
            
            # Salvar temporariamente
            import base64
            photo_bytes = base64.b64decode(photo_base64)
            
            with open(temp_path, 'wb') as f:
                f.write(photo_bytes)
            
            print(f"✅ Foto temporária criada: {temp_path}")
            return str(temp_path)
            
        except Exception as e:
            print(f"❌ Erro ao criar foto temporária: {e}")
            return None
    
    def cleanup_temp_photo(self, temp_path: str) -> bool:
        """
        Remove foto temporária após uso
        
        Args:
            temp_path: Caminho da foto temporária
            
        Returns:
            bool: True se removida com sucesso
        """
        try:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
                print(f"🗑️ Foto temporária removida: {os.path.basename(temp_path)}")
                return True
            return False
        except Exception as e:
            print(f"❌ Erro ao remover foto temporária: {e}")
            return False
    
    def load_photo_index(self) -> Dict:
        """Carrega índice de fotos"""
        try:
            if self.index_file.exists():
                with open(self.index_file, 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"⚠️ Erro ao carregar índice: {e}")
        
        return {}
    
    def add_to_index(self, visitor_id: str, photo_record: Dict):
        """Adiciona registro ao índice"""
        try:
            if visitor_id not in self.photo_index:
                self.photo_index[visitor_id] = []
            
            self.photo_index[visitor_id].append(photo_record)
            
            # Salvar índice
            with open(self.index_file, 'w') as f:
                json.dump(self.photo_index, f, indent=2)
                
        except Exception as e:
            print(f"❌ Erro ao atualizar índice: {e}")
    
    def get_visitor_photos(self, visitor_id: str) -> List[Dict]:
        """Obtém todas as fotos de um visitante"""
        return self.photo_index.get(visitor_id, [])
    
    def find_photo_by_hash(self, photo_hash: str) -> Optional[Dict]:
        """Encontra foto pelo hash (para evitar duplicatas)"""
        for visitor_id, photos in self.photo_index.items():
            for photo in photos:
                if photo.get('photo_hash') == photo_hash:
                    return photo
        return None
    
    def verify_photo_integrity(self, visitor_id: str) -> Dict:
        """Verifica integridade das fotos de um visitante"""
        photos = self.get_visitor_photos(visitor_id)
        results = {
            'visitor_id': visitor_id,
            'total_photos': len(photos),
            'valid_photos': 0,
            'corrupted_photos': 0,
            'missing_files': 0,
            'details': []
        }
        
        for photo in photos:
            detail = {
                'filename': photo['filename'],
                'status': 'unknown'
            }
            
            try:
                photo_path = Path(photo['filepath'])
                
                if not photo_path.exists():
                    detail['status'] = 'missing'
                    results['missing_files'] += 1
                else:
                    # Verificar hash
                    with open(photo_path, 'rb') as f:
                        current_hash = hashlib.sha256(f.read()).hexdigest()
                    
                    if current_hash == photo['photo_hash']:
                        detail['status'] = 'valid'
                        results['valid_photos'] += 1
                    else:
                        detail['status'] = 'corrupted'
                        results['corrupted_photos'] += 1
                        
            except Exception as e:
                detail['status'] = f'error: {str(e)}'
                results['corrupted_photos'] += 1
            
            results['details'].append(detail)
        
        return results
    
    def cleanup_old_temp_files(self, hours_old: int = 24):
        """Remove arquivos temporários antigos"""
        try:
            current_time = time.time()
            cutoff_time = current_time - (hours_old * 3600)
            
            removed_count = 0
            for temp_file in self.temp_dir.glob("automation_*"):
                if temp_file.stat().st_mtime < cutoff_time:
                    temp_file.unlink()
                    removed_count += 1
            
            if removed_count > 0:
                print(f"🧹 {removed_count} arquivos temporários antigos removidos")
                
        except Exception as e:
            print(f"❌ Erro na limpeza: {e}")
    
    def get_statistics(self) -> Dict:
        """Retorna estatísticas do sistema"""
        total_visitors = len(self.photo_index)
        total_photos = sum(len(photos) for photos in self.photo_index.values())
        
        # Tamanho total das fotos
        total_size = 0
        for visitor_photos in self.photo_index.values():
            for photo in visitor_photos:
                total_size += photo.get('file_size', 0)
        
        # Arquivos temporários
        temp_files = list(self.temp_dir.glob("automation_*"))
        
        return {
            'total_visitors': total_visitors,
            'total_photos': total_photos,
            'total_size_bytes': total_size,
            'total_size_mb': round(total_size / 1024 / 1024, 2),
            'temp_files': len(temp_files),
            'photos_per_visitor': round(total_photos / max(total_visitors, 1), 2)
        }

# Exemplo de uso prático
def exemplo_uso_completo():
    """Exemplo de como usar o sistema completo"""
    
    # Inicializar sistema
    photo_system = PhotoOrganizationSystem()
    
    # Dados do visitante (vindos do frontend)
    visitor_data = {
        'name': 'João Silva Santos',
        'cpf': '123.456.789-01',
        'phone': '(11) 99999-9999',
        'photo_base64': 'data:image/jpeg;base64,/9j/4AAQ...'  # foto real aqui
    }
    
    print("🚀 EXEMPLO DE USO COMPLETO:")
    print("=" * 50)
    
    # 1. Gerar ID único
    visitor_id = photo_system.generate_unique_visitor_id(
        visitor_data['name'],
        visitor_data['cpf'],
        visitor_data['phone']
    )
    
    # 2. Salvar foto permanente
    permanent_result = photo_system.save_visitor_photo_secure(
        visitor_id,
        visitor_data['photo_base64'],
        visitor_data
    )
    
    if permanent_result['success']:
        print(f"✅ Foto permanente salva: {permanent_result['photo_record']['filename']}")
        
        # 3. Criar foto temporária para automação
        temp_path = photo_system.create_temp_photo_for_automation(
            visitor_id,
            visitor_data['photo_base64']
        )
        
        if temp_path:
            print(f"📄 Foto temporária: {temp_path}")
            
            # 4. Simular uso na automação
            print("🤖 Simulando automação...")
            time.sleep(2)  # Simular processamento
            
            # 5. Limpar foto temporária
            photo_system.cleanup_temp_photo(temp_path)
            
            # 6. Verificar integridade
            integrity = photo_system.verify_photo_integrity(visitor_id)
            print(f"🔍 Integridade: {integrity['valid_photos']}/{integrity['total_photos']} fotos válidas")
            
            # 7. Estatísticas
            stats = photo_system.get_statistics()
            print(f"📊 Sistema: {stats['total_visitors']} visitantes, {stats['total_photos']} fotos, {stats['total_size_mb']} MB")
    
    # 8. Limpeza geral
    photo_system.cleanup_old_temp_files(0)  # Remove todos os temporários

if __name__ == "__main__":
    exemplo_uso_completo() 