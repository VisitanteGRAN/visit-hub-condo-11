#!/usr/bin/env python3
# WINDOWS POLLING SERVICE - VERSÃO CORRIGIDA
# ✅ Timeout aumentado para 30s
# ✅ Sem emojis para Windows  
# ✅ Chrome visível para debug
# ✅ Logs melhorados

import os
import sys
import json
import time
import logging
import requests
import subprocess
from datetime import datetime
from dotenv import load_dotenv

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('polling_service_seguro.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class SecurePollingService:
    def __init__(self):
        # Configurações padrão
        self.api_base_url = "http://localhost:5001"
        self.api_token = None
        self.polling_interval = 30
        
        # Carregar configurações
        self.load_config()
        self.load_api_token()

    def load_config(self):
        """Carregar configurações do .env"""
        try:
            load_dotenv()
            
            # URL da API
            self.api_base_url = os.getenv('AUTOMATION_SERVER_URL', 'http://localhost:5001')
            
            # Intervalo de polling
            interval = os.getenv('POLLING_INTERVAL', '30')
            self.polling_interval = int(interval)
            
            logger.info("[OK] Configurações carregadas do .env")
            logger.info(f"API URL: {self.api_base_url}")
            
        except Exception as e:
            logger.error(f"[ERRO] Erro ao carregar configurações: {e}")
            
    def load_api_token(self):
        """Carregar token da API"""
        try:
            with open('api_tokens_CONFIDENTIAL.json', 'r') as f:
                tokens_data = json.load(f)
            
            # Usar token do sistema interno
            system_token = tokens_data.get('internal_system', {})
            self.api_token = system_token.get('token')
            
            if self.api_token:
                logger.info("[OK] Token de sistema interno carregado")
            else:
                logger.error("[ERRO] Token não encontrado no arquivo JSON")
                raise Exception("Token de API não configurado")
                
        except FileNotFoundError:
            logger.error("[ERRO] Arquivo api_tokens_CONFIDENTIAL.json não encontrado")
            raise
        except Exception as e:
            logger.error(f"[ERRO] Erro ao carregar tokens: {e}")
            raise

    def make_secure_request(self, endpoint, method='GET', data=None):
        """Fazer requisição segura com token"""
        try:
            url = f"{self.api_base_url}{endpoint}"
            
            # Headers com autenticação
            headers = {
                'Authorization': f'Bearer {self.api_token}',
                'Content-Type': 'application/json',
                'User-Agent': 'GranRoyalle-PollingService/2.0'
            }
            
            # Log seguro (sem token completo)
            token_preview = f"{self.api_token[:8]}..." if self.api_token else "NONE"
            logger.info(f"[REQUEST] {method} {url} (Token: {token_preview})")
            
            # Fazer requisição com timeout aumentado
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, headers=headers, json=data, timeout=30)
            else:
                raise ValueError(f"Método {method} não suportado")
            
            # Log da resposta
            logger.info(f"[RESPONSE] Status: {response.status_code}")
            
            if response.status_code == 401:
                logger.error("[ERRO] AUTENTICAÇÃO: Token inválido ou expirado!")
                raise Exception("Token de autenticação inválido")
            elif response.status_code == 429:
                logger.warning("[AVISO] Rate limit excedido, aguardando...")
                time.sleep(60)  # Aguardar 1 minuto
                return None
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.ConnectionError:
            logger.error(f"[ERRO] Conexão com {url}")
            return None
        except requests.exceptions.Timeout:
            logger.error(f"[ERRO] Timeout na requisição para {url}")
            return None
        except Exception as e:
            logger.error(f"[ERRO] Requisição: {e}")
            return None

    def check_pending_visitors(self):
        """Verificar visitantes pendentes"""
        try:
            logger.info("[INFO] Verificando visitantes pendentes...")
            
            # Buscar fila de visitantes
            data = self.make_secure_request('/api/queue')
            
            if data is None:
                logger.warning("[AVISO] Nenhum dado retornado da API")
                return []
            
            # Extrair lista de visitantes
            if isinstance(data, dict) and 'queue' in data:
                pending = data['queue']
            elif isinstance(data, list):
                pending = data
            else:
                logger.warning(f"[AVISO] Formato de dados inesperado: {type(data)}")
                logger.info(f"[DEBUG] Dados recebidos: {data}")
                return []
            
            if pending:
                logger.info(f"[FOUND] {len(pending)} visitantes pendentes encontrados")
                # Log seguro (sem dados pessoais) - DEBUG melhorado
                for visitor in pending[:3]:  # Apenas primeiros 3
                    # Tentar diferentes campos para extrair nome
                    name = (visitor.get('nome') or 
                           visitor.get('visitor_data', {}).get('nome') or 
                           visitor.get('data', {}).get('nome') or 
                           'N/A')
                    id_visitor = visitor.get('id', 'N/A')
                    logger.info(f"   [VISITOR] {name} (ID: {id_visitor})")
                    
                # DEBUG: Log estrutura do primeiro visitante
                if pending:
                    logger.info(f"[DEBUG] Estrutura do visitante: {list(pending[0].keys())}")
            else:
                logger.info("[EMPTY] Nenhum visitante pendente")
            
            return pending
            
        except Exception as e:
            logger.error(f"[ERRO] Verificação de visitantes: {e}")
            return []

    def save_visitor_data(self, visitor_data, visitor_id):
        """Salvar dados do visitante em arquivo JSON temporário"""
        try:
            json_filename = f"visitor_data_{visitor_id}.json"
            json_path = os.path.join(os.getcwd(), json_filename)
            
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(visitor_data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"[JSON] Dados salvos em: {json_path}")
            return json_path
            
        except Exception as e:
            logger.error(f"[ERRO] Falha ao salvar JSON: {e}")
            return None

    def cleanup_temp_files(self, visitor_id):
        """Limpar arquivos temporários"""
        try:
            json_filename = f"visitor_data_{visitor_id}.json"
            json_path = os.path.join(os.getcwd(), json_filename)
            
            if os.path.exists(json_path):
                os.remove(json_path)
                logger.info(f"[CLEANUP] Arquivo temporário removido: {json_filename}")
                
        except Exception as e:
            logger.warning(f"[AVISO] Falha ao limpar arquivo temporário: {e}")

    def process_visitor(self, visitor_data):
        """Processar cadastro do visitante"""
        try:
            # Extrair dados do visitante de diferentes locais possíveis
            if 'visitor_data' in visitor_data:
                # Dados dentro de visitor_data
                actual_data = visitor_data['visitor_data']
                visitor_name = actual_data.get('nome', 'Visitante')
            else:
                # Dados diretos
                actual_data = visitor_data
                visitor_name = visitor_data.get('nome', 'Visitante')
            
            visitor_id = visitor_data.get('id', 'N/A')
            
            logger.info(f"[PROCESSANDO] Visitante: {visitor_name} (ID: {visitor_id})")
            logger.info(f"[DEBUG] Estrutura recebida: {list(visitor_data.keys())}")
            
            # Salvar dados em arquivo JSON - usar dados completos
            json_path = self.save_visitor_data(actual_data, visitor_id)
            if not json_path:
                logger.error(f"[ERRO] Falha ao salvar dados do visitante")
                return False
            
            # Executar script de cadastro
            script_path = 'test_form_direct_SEGURO.py'
            
            if not os.path.exists(script_path):
                # Fallback para script original
                script_path = 'test_form_direct.py'
                if not os.path.exists(script_path):
                    logger.error(f"[ERRO] Script não encontrado: {script_path}")
                    return False
            
            # USAR VISITOR-ID (comando pequeno, dados no arquivo)
            cmd = [
                'python',
                script_path,
                '--visitor-id', visitor_id,
                '--visible'  # Chrome visível para debug
            ]
            
            logger.info(f"[EXECUTANDO] {' '.join(cmd[:3])} [visitor-id: {visitor_id}]")
            
            # Executar com timeout e encoding correto para Windows
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,  # 5 minutos
                encoding='utf-8',
                errors='ignore'  # Ignorar erros de encoding
            )
            
            if result.returncode == 0:
                logger.info(f"[SUCESSO] Visitante {visitor_name} processado com sucesso")
                
                # Marcar como processado na API
                self.mark_visitor_processed(visitor_id)
                
                # Limpar arquivo temporário
                self.cleanup_temp_files(visitor_id)
                return True
            else:
                logger.error(f"[ERRO] Erro ao processar visitante {visitor_name}")
                logger.error(f"   Stdout: {result.stdout}")
                logger.error(f"   Stderr: {result.stderr}")
                
                # Limpar arquivo temporário mesmo em caso de erro
                self.cleanup_temp_files(visitor_id)
                return False
                
        except subprocess.TimeoutExpired:
            logger.error(f"[TIMEOUT] Timeout ao processar visitante {visitor_name}")
            self.cleanup_temp_files(visitor_id)
            return False
        except Exception as e:
            logger.error(f"[ERRO] Processamento do visitante: {e}")
            self.cleanup_temp_files(visitor_id)
            return False

    def mark_visitor_processed(self, visitor_id):
        """Marcar visitante como processado"""
        try:
            # Implementar marcação via API
            data = {'status': 'processed', 'processed_at': datetime.now().isoformat()}
            response = self.make_secure_request(f'/api/visitante/{visitor_id}', 'POST', data)
            
            if response:
                logger.info(f"[UPDATE] Visitante {visitor_id} marcado como processado")
            else:
                logger.warning(f"[AVISO] Falha ao marcar visitante {visitor_id} como processado")
                
        except Exception as e:
            logger.error(f"[ERRO] Marcar visitante como processado: {e}")

    def health_check(self):
        """Verificar se a API está funcionando"""
        try:
            logger.info("[HEALTH] Verificando API...")
            
            response = self.make_secure_request('/health')
            
            if response and response.get('status') == 'OK':
                logger.info("[OK] API está saudável")
                return True
            else:
                logger.error("[ERRO] API não respondeu corretamente")
                return False
                
        except Exception as e:
            logger.error(f"[ERRO] Health check: {e}")
            return False

    def run(self):
        """Loop principal do serviço"""
        logger.info("[START] Iniciando loop principal do serviço")
        
        # Health check inicial
        if not self.health_check():
            logger.error("[FATAL] API não está respondendo! Verifique se está rodando.")
            return
        
        consecutive_errors = 0
        max_consecutive_errors = 5
        
        while True:
            try:
                logger.info(f"[CYCLE] Ciclo de polling - {datetime.now().strftime('%H:%M:%S')}")
                
                # Verificar visitantes pendentes
                pending_visitors = self.check_pending_visitors()
                
                if pending_visitors:
                    logger.info(f"[PROCESSING] Processando {len(pending_visitors)} visitantes...")
                    
                    for visitor in pending_visitors:
                        try:
                            success = self.process_visitor(visitor)
                            if success:
                                consecutive_errors = 0  # Reset contador de erros
                            
                            # Pausa entre processamentos
                            time.sleep(5)
                            
                        except Exception as e:
                            logger.error(f"[ERRO] Erro ao processar visitante individual: {e}")
                            consecutive_errors += 1
                
                else:
                    logger.info("[WAITING] Nenhum visitante pendente, aguardando...")
                    consecutive_errors = 0  # Reset contador se não há erros
                
                # Verificar erros consecutivos
                if consecutive_errors >= max_consecutive_errors:
                    logger.error(f"[FATAL] MUITOS ERROS CONSECUTIVOS ({consecutive_errors})")
                    logger.error("[RESTART] Reiniciando serviço em 60 segundos...")
                    time.sleep(60)
                    consecutive_errors = 0
                
                # Aguardar próximo ciclo
                logger.info(f"[SLEEP] Aguardando {self.polling_interval} segundos...")
                time.sleep(self.polling_interval)
                
            except KeyboardInterrupt:
                logger.info("[STOP] Serviço interrompido pelo usuário")
                break
            except Exception as e:
                logger.error(f"[ERRO] Erro no loop principal: {e}")
                consecutive_errors += 1
                time.sleep(10)  # Aguardar antes de tentar novamente

if __name__ == "__main__":
    logger.info("[INIT] INICIANDO SERVIÇO DE POLLING SEGURO")
    logger.info("=" * 50)
    logger.info("[INFO] Iniciando Servico de Polling Seguro")
    logger.info("[INFO] Carregando configurações de .env")
    
    try:
        service = SecurePollingService()
        service.run()
    except Exception as e:
        logger.error(f"[FATAL] Erro fatal: {e}")
        sys.exit(1)
