#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
🔐 SERVIÇO DE POLLING SEGURO - WINDOWS PORTARIA
Versão atualizada com autenticação por token e logs seguros
"""

import requests
import time
import os
import logging
import json
from datetime import datetime
import subprocess
import sys
from pathlib import Path

# 📊 CONFIGURAÇÃO DE LOGS SEGUROS
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('polling_service_seguro.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class SecurePollingService:
    def __init__(self):
        """🔐 Inicializar serviço de polling seguro"""
        logger.info("🚀 Iniciando Serviço de Polling Seguro")
        
        # 🔑 Carregar configurações
        self.load_config()
        
        # 🔐 Carregar tokens
        self.load_tokens()
        
        # 📊 Configurações de polling
        self.polling_interval = 30  # segundos
        self.max_retries = 3
        self.retry_delay = 5
        
        logger.info(f"✅ Serviço configurado - Intervalo: {self.polling_interval}s")

    def load_config(self):
        """📁 Carregar configurações do .env"""
        try:
            # 🔍 Tentar carregar .env
            env_files = ['.env', '.env.portaria', '.env.local']
            config_loaded = False
            
            for env_file in env_files:
                if os.path.exists(env_file):
                    logger.info(f"📄 Carregando configurações de {env_file}")
                    with open(env_file, 'r', encoding='utf-8') as f:
                        for line in f:
                            if '=' in line and not line.startswith('#'):
                                key, value = line.strip().split('=', 1)
                                os.environ[key] = value.strip('"\'')
                    config_loaded = True
                    break
            
            if not config_loaded:
                logger.warning("⚠️ Nenhum arquivo .env encontrado, usando configurações padrão")
            
            # 🌐 Configurações da API
            self.api_base_url = os.getenv('AUTOMATION_SERVER_URL', 'http://localhost:5001')
            self.supabase_url = os.getenv('SUPABASE_URL', '')
            self.supabase_key = os.getenv('SUPABASE_ANON_KEY', '')
            
            logger.info(f"🌐 API URL: {self.api_base_url}")
            
        except Exception as e:
            logger.error(f"❌ Erro ao carregar configurações: {e}")
            self.api_base_url = 'http://localhost:5001'

    def load_tokens(self):
        """🔑 Carregar tokens de autenticação"""
        try:
            token_files = ['api_tokens_CONFIDENTIAL.json', 'tokens.json']
            
            for token_file in token_files:
                if os.path.exists(token_file):
                    logger.info(f"🔑 Carregando tokens de {token_file}")
                    with open(token_file, 'r', encoding='utf-8') as f:
                        tokens = json.load(f)
                    
                    # 🎯 Token para sistema interno
                    if 'internal_system' in tokens:
                        self.api_token = tokens['internal_system']['token']
                        logger.info("✅ Token de sistema interno carregado")
                        return
                    elif 'system_token' in tokens:
                        self.api_token = tokens['system_token']
                        logger.info("✅ Token do sistema carregado")
                        return
            
            # 🔑 Fallback: carregar de variável de ambiente
            self.api_token = os.getenv('SYSTEM_API_TOKEN', '')
            if self.api_token:
                logger.info("✅ Token carregado de variável de ambiente")
            else:
                logger.error("❌ ERRO CRÍTICO: Nenhum token de API encontrado!")
                raise Exception("Token de API obrigatório não encontrado")
                
        except Exception as e:
            logger.error(f"❌ Erro ao carregar tokens: {e}")
            raise

    def make_secure_request(self, endpoint, method='GET', data=None):
        """🔐 Fazer requisição segura com token"""
        try:
            url = f"{self.api_base_url}{endpoint}"
            
            # 🔑 Headers com autenticação
            headers = {
                'Authorization': f'Bearer {self.api_token}',
                'Content-Type': 'application/json',
                'User-Agent': 'GranRoyalle-PollingService/2.0'
            }
            
            # 📊 Log seguro (sem token completo)
            token_preview = f"{self.api_token[:8]}..." if self.api_token else "NONE"
            logger.info(f"🌐 {method} {url} (Token: {token_preview})")
            
            # 🚀 Fazer requisição
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, headers=headers, json=data, timeout=10)
            else:
                raise ValueError(f"Método {method} não suportado")
            
            # 📊 Log da resposta
            logger.info(f"📡 Resposta: {response.status_code}")
            
            if response.status_code == 401:
                logger.error("🚨 ERRO DE AUTENTICAÇÃO: Token inválido ou expirado!")
                raise Exception("Token de autenticação inválido")
            elif response.status_code == 429:
                logger.warning("⚠️ Rate limit excedido, aguardando...")
                time.sleep(60)  # Aguardar 1 minuto
                return None
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.ConnectionError:
            logger.error(f"❌ Erro de conexão com {url}")
            return None
        except requests.exceptions.Timeout:
            logger.error(f"⏰ Timeout na requisição para {url}")
            return None
        except Exception as e:
            logger.error(f"❌ Erro na requisição: {e}")
            return None

    def check_pending_visitors(self):
        """👥 Verificar visitantes pendentes"""
        try:
            logger.info("🔍 Verificando visitantes pendentes...")
            
            # 📊 Buscar fila de visitantes
            data = self.make_secure_request('/api/queue')
            
            if data is None:
                logger.warning("⚠️ Nenhum dado retornado da API")
                return []
            
            if isinstance(data, dict) and 'queue' in data:
                pending = data['queue']
            elif isinstance(data, list):
                pending = data
            else:
                logger.warning(f"⚠️ Formato de dados inesperado: {type(data)}")
                return []
            
            if pending:
                logger.info(f"📋 {len(pending)} visitantes pendentes encontrados")
                # 📊 Log seguro (sem dados pessoais)
                for visitor in pending[:3]:  # Apenas primeiros 3
                    name = visitor.get('nome', 'N/A')
                    id_visitor = visitor.get('id', 'N/A')
                    logger.info(f"   👤 Visitante: {name} (ID: {id_visitor})")
            else:
                logger.info("✅ Nenhum visitante pendente")
            
            return pending
            
        except Exception as e:
            logger.error(f"❌ Erro ao verificar visitantes pendentes: {e}")
            return []

    def process_visitor(self, visitor_data):
        """🤖 Processar cadastro do visitante"""
        try:
            visitor_name = visitor_data.get('nome', 'Visitante')
            visitor_id = visitor_data.get('id', 'N/A')
            
            logger.info(f"🤖 Processando visitante: {visitor_name} (ID: {visitor_id})")
            
            # 🚀 Executar script de cadastro
            script_path = 'test_form_direct_SEGURO.py'
            
            if not os.path.exists(script_path):
                # 📁 Fallback para script original
                script_path = 'test_form_direct.py'
                if not os.path.exists(script_path):
                    logger.error(f"❌ Script não encontrado: {script_path}")
                    return False
            
            # 🎯 Executar com dados do visitante
            cmd = [
                sys.executable,
                script_path,
                '--visitor-data', json.dumps(visitor_data, ensure_ascii=False),
                '--headless'
            ]
            
            logger.info(f"🚀 Executando: {' '.join(cmd[:2])} [dados-do-visitante]")
            
            # ⏱️ Executar com timeout
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,  # 5 minutos
                encoding='utf-8'
            )
            
            if result.returncode == 0:
                logger.info(f"✅ Visitante {visitor_name} processado com sucesso")
                
                # 📊 Marcar como processado na API
                self.mark_visitor_processed(visitor_id)
                return True
            else:
                logger.error(f"❌ Erro ao processar visitante {visitor_name}")
                logger.error(f"   Stdout: {result.stdout}")
                logger.error(f"   Stderr: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            logger.error(f"⏰ Timeout ao processar visitante {visitor_name}")
            return False
        except Exception as e:
            logger.error(f"❌ Erro ao processar visitante: {e}")
            return False

    def mark_visitor_processed(self, visitor_id):
        """✅ Marcar visitante como processado"""
        try:
            data = {'visitor_id': visitor_id, 'status': 'processed'}
            result = self.make_secure_request('/api/queue/update', 'POST', data)
            
            if result:
                logger.info(f"✅ Visitante {visitor_id} marcado como processado")
            else:
                logger.warning(f"⚠️ Não foi possível marcar visitante {visitor_id} como processado")
                
        except Exception as e:
            logger.error(f"❌ Erro ao marcar visitante como processado: {e}")

    def health_check(self):
        """💓 Verificar saúde da API"""
        try:
            data = self.make_secure_request('/health')
            
            if data and data.get('status') == 'OK':
                logger.info("💓 API está saudável")
                return True
            else:
                logger.warning("⚠️ API pode estar com problemas")
                return False
                
        except Exception as e:
            logger.error(f"❌ Erro no health check: {e}")
            return False

    def run(self):
        """🔄 Loop principal do serviço"""
        logger.info("🔄 Iniciando loop principal do serviço")
        
        # 💓 Health check inicial
        if not self.health_check():
            logger.error("🚨 ERRO: API não está respondendo! Verifique se está rodando.")
            return
        
        consecutive_errors = 0
        max_consecutive_errors = 5
        
        while True:
            try:
                logger.info(f"🔍 Ciclo de polling - {datetime.now().strftime('%H:%M:%S')}")
                
                # 👥 Verificar visitantes pendentes
                pending_visitors = self.check_pending_visitors()
                
                if pending_visitors:
                    logger.info(f"📋 Processando {len(pending_visitors)} visitantes...")
                    
                    for visitor in pending_visitors:
                        try:
                            success = self.process_visitor(visitor)
                            if success:
                                consecutive_errors = 0  # Reset contador de erros
                            
                            # ⏱️ Pausa entre processamentos
                            time.sleep(5)
                            
                        except Exception as e:
                            logger.error(f"❌ Erro ao processar visitante individual: {e}")
                            consecutive_errors += 1
                
                else:
                    logger.info("😴 Nenhum visitante pendente, aguardando...")
                    consecutive_errors = 0  # Reset contador se não há erros
                
                # 🚨 Verificar erros consecutivos
                if consecutive_errors >= max_consecutive_errors:
                    logger.error(f"🚨 MUITOS ERROS CONSECUTIVOS ({consecutive_errors})")
                    logger.error("🔄 Reiniciando serviço em 60 segundos...")
                    time.sleep(60)
                    consecutive_errors = 0
                
                # ⏱️ Aguardar próximo ciclo
                logger.info(f"⏱️ Aguardando {self.polling_interval} segundos...")
                time.sleep(self.polling_interval)
                
            except KeyboardInterrupt:
                logger.info("🛑 Serviço interrompido pelo usuário")
                break
            except Exception as e:
                logger.error(f"❌ Erro no loop principal: {e}")
                consecutive_errors += 1
                time.sleep(10)  # Pausa curta antes de tentar novamente

if __name__ == "__main__":
    try:
        logger.info("🚀 INICIANDO SERVIÇO DE POLLING SEGURO")
        logger.info("=" * 50)
        
        service = SecurePollingService()
        service.run()
        
    except Exception as e:
        logger.error(f"💥 ERRO CRÍTICO: {e}")
        sys.exit(1)
    finally:
        logger.info("🏁 Serviço finalizado")
