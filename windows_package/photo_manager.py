#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
📸 PHOTO MANAGER - GERENCIADOR DE FOTOS
======================================
Sistema para processar e gerenciar fotos de visitantes
para automação no HikCentral
"""

import os
import base64
import json
import uuid
import time
from pathlib import Path
from PIL import Image, ImageOps
import logging

# Configurações
PHOTOS_DIR = Path("photos")
TEMP_DIR = Path("temp")
MAX_PHOTO_SIZE = (800, 600)  # Tamanho máximo para otimização
JPEG_QUALITY = 85
SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.bmp']

# Criar diretórios necessários
PHOTOS_DIR.mkdir(exist_ok=True)
TEMP_DIR.mkdir(exist_ok=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PhotoManager:
    """Gerenciador de fotos para visitantes"""
    
    def __init__(self):
        self.photos_dir = PHOTOS_DIR
        self.temp_dir = TEMP_DIR
    
    def save_photo_from_base64(self, visitor_id: str, base64_data: str, metadata: dict = None) -> dict:
        """
        Salva foto a partir de dados base64
        
        Args:
            visitor_id: ID único do visitante
            base64_data: Dados da imagem em base64
            metadata: Metadados opcionais (nome, cpf, etc.)
        
        Returns:
            dict: Informações da foto salva
        """
        try:
            logger.info(f"📸 Salvando foto para visitante: {visitor_id}")
            
            # Limpar header do base64 se presente
            if ',' in base64_data:
                base64_data = base64_data.split(',')[1]
            
            # Decodificar base64
            photo_bytes = base64.b64decode(base64_data)
            
            # Gerar nome único para arquivo
            timestamp = int(time.time())
            photo_filename = f"{visitor_id}_{timestamp}.jpg"
            photo_path = self.photos_dir / photo_filename
            
            # Abrir imagem para processamento
            with Image.open(io.BytesIO(photo_bytes)) as img:
                # Converter para RGB se necessário
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Rotacionar se necessário (baseado em EXIF)
                img = ImageOps.exif_transpose(img)
                
                # Redimensionar se muito grande
                if img.size[0] > MAX_PHOTO_SIZE[0] or img.size[1] > MAX_PHOTO_SIZE[1]:
                    img.thumbnail(MAX_PHOTO_SIZE, Image.Resampling.LANCZOS)
                    logger.info(f"🔄 Imagem redimensionada para: {img.size}")
                
                # Salvar imagem otimizada
                img.save(photo_path, 'JPEG', quality=JPEG_QUALITY, optimize=True)
            
            # Calcular tamanho do arquivo
            file_size = photo_path.stat().st_size
            
            # Criar metadados
            photo_info = {
                'visitor_id': visitor_id,
                'filename': photo_filename,
                'filepath': str(photo_path),
                'file_size': file_size,
                'timestamp': timestamp,
                'width': img.size[0],
                'height': img.size[1],
                'metadata': metadata or {}
            }
            
            # Salvar metadados em JSON
            metadata_path = self.photos_dir / f"{visitor_id}_{timestamp}.json"
            with open(metadata_path, 'w') as f:
                json.dump(photo_info, f, indent=2)
            
            logger.info(f"✅ Foto salva: {photo_filename} ({file_size} bytes)")
            return {
                'success': True,
                'photo_info': photo_info,
                'message': 'Foto salva com sucesso'
            }
            
        except Exception as e:
            logger.error(f"❌ Erro ao salvar foto: {e}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Erro ao processar foto'
            }
    
    def get_photo_base64(self, visitor_id: str) -> dict:
        """
        Obtém foto em base64 para um visitante
        
        Args:
            visitor_id: ID do visitante
        
        Returns:
            dict: Foto em base64 e informações
        """
        try:
            # Procurar fotos do visitante
            photo_files = list(self.photos_dir.glob(f"{visitor_id}_*.jpg"))
            
            if not photo_files:
                return {
                    'success': False,
                    'message': 'Nenhuma foto encontrada para este visitante'
                }
            
            # Pegar a foto mais recente
            latest_photo = max(photo_files, key=lambda x: x.stat().st_mtime)
            
            # Ler foto e converter para base64
            with open(latest_photo, 'rb') as f:
                photo_bytes = f.read()
                photo_base64 = base64.b64encode(photo_bytes).decode('utf-8')
            
            # Carregar metadados se existirem
            metadata_file = latest_photo.with_suffix('.json')
            metadata = {}
            if metadata_file.exists():
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
            
            logger.info(f"📸 Foto recuperada para {visitor_id}: {latest_photo.name}")
            
            return {
                'success': True,
                'photo_base64': photo_base64,
                'filename': latest_photo.name,
                'file_size': len(photo_bytes),
                'metadata': metadata
            }
            
        except Exception as e:
            logger.error(f"❌ Erro ao recuperar foto: {e}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Erro ao carregar foto'
            }
    
    def save_photo_for_automation(self, visitor_id: str, base64_data: str) -> str:
        """
        Salva foto especificamente para uso na automação
        
        Args:
            visitor_id: ID do visitante
            base64_data: Dados da foto em base64
        
        Returns:
            str: Caminho para arquivo temporário da foto
        """
        try:
            # Limpar header do base64
            if ',' in base64_data:
                base64_data = base64_data.split(',')[1]
            
            # Gerar arquivo temporário
            temp_filename = f"automation_{visitor_id}_{int(time.time())}.jpg"
            temp_path = self.temp_dir / temp_filename
            
            # Decodificar e salvar
            photo_bytes = base64.b64decode(base64_data)
            
            with open(temp_path, 'wb') as f:
                f.write(photo_bytes)
            
            logger.info(f"📸 Foto temporária salva para automação: {temp_filename}")
            return str(temp_path)
            
        except Exception as e:
            logger.error(f"❌ Erro ao salvar foto temporária: {e}")
            return None
    
    def cleanup_temp_files(self, older_than_hours: int = 24):
        """
        Limpa arquivos temporários antigos
        
        Args:
            older_than_hours: Remover arquivos mais antigos que X horas
        """
        try:
            current_time = time.time()
            cutoff_time = current_time - (older_than_hours * 3600)
            
            removed_count = 0
            for temp_file in self.temp_dir.glob("*"):
                if temp_file.stat().st_mtime < cutoff_time:
                    temp_file.unlink()
                    removed_count += 1
            
            if removed_count > 0:
                logger.info(f"🧹 {removed_count} arquivos temporários removidos")
                
        except Exception as e:
            logger.error(f"❌ Erro na limpeza de arquivos temporários: {e}")
    
    def get_visitor_photos(self, visitor_id: str) -> list:
        """
        Lista todas as fotos de um visitante
        
        Args:
            visitor_id: ID do visitante
        
        Returns:
            list: Lista de informações das fotos
        """
        photos = []
        try:
            photo_files = list(self.photos_dir.glob(f"{visitor_id}_*.jpg"))
            
            for photo_file in sorted(photo_files, key=lambda x: x.stat().st_mtime, reverse=True):
                metadata_file = photo_file.with_suffix('.json')
                metadata = {}
                
                if metadata_file.exists():
                    with open(metadata_file, 'r') as f:
                        metadata = json.load(f)
                
                photos.append({
                    'filename': photo_file.name,
                    'filepath': str(photo_file),
                    'file_size': photo_file.stat().st_size,
                    'timestamp': photo_file.stat().st_mtime,
                    'metadata': metadata
                })
            
        except Exception as e:
            logger.error(f"❌ Erro ao listar fotos: {e}")
        
        return photos
    
    def delete_visitor_photos(self, visitor_id: str) -> dict:
        """
        Remove todas as fotos de um visitante
        
        Args:
            visitor_id: ID do visitante
        
        Returns:
            dict: Resultado da operação
        """
        try:
            photo_files = list(self.photos_dir.glob(f"{visitor_id}_*"))
            removed_count = 0
            
            for file_path in photo_files:
                file_path.unlink()
                removed_count += 1
            
            logger.info(f"🗑️ {removed_count} arquivos removidos para visitante {visitor_id}")
            
            return {
                'success': True,
                'removed_count': removed_count,
                'message': f'{removed_count} arquivos removidos'
            }
            
        except Exception as e:
            logger.error(f"❌ Erro ao remover fotos: {e}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Erro ao remover fotos'
            }

# Importar dependências adicionais
try:
    import io
    from PIL import Image, ImageOps
except ImportError:
    logger.error("❌ Pillow não está instalado. Execute: pip install Pillow")
    raise

# Instância global
photo_manager = PhotoManager()

def save_visitor_photo(visitor_id: str, base64_data: str, metadata: dict = None) -> dict:
    """
    Função utilitária para salvar foto de visitante
    """
    return photo_manager.save_photo_from_base64(visitor_id, base64_data, metadata)

def get_visitor_photo_path(visitor_id: str) -> str:
    """
    Função utilitária para obter caminho da foto mais recente
    """
    result = photo_manager.get_photo_base64(visitor_id)
    if result['success']:
        # Retornar caminho do arquivo
        photos = photo_manager.get_visitor_photos(visitor_id)
        if photos:
            return photos[0]['filepath']
    return None

if __name__ == "__main__":
    # Teste do sistema
    print("📸 Testando Photo Manager...")
    
    # Exemplo de uso
    test_base64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    
    result = save_visitor_photo("test_123", test_base64, {"nome": "João Teste"})
    print(f"Resultado: {result}")
    
    # Limpeza
    photo_manager.cleanup_temp_files(0)  # Remove todos os arquivos temp 