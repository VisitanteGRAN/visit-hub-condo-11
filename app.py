from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sqlite3
import json
import threading
import time
import os
from datetime import datetime
from hikcentral_automation import HikCentralAutomation

app = Flask(__name__)
CORS(app)

# Configuração do banco de dados
DATABASE = 'visitors.db'

def init_db():
    """Inicializa o banco de dados"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS visitors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            cpf TEXT,
            phone TEXT,
            email TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP,
            result TEXT,
            error_message TEXT
        )
    ''')
    
    conn.commit()
    conn.close()

def get_db_connection():
    """Retorna conexão com o banco"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    """Página principal com formulário de cadastro"""
    return render_template('index.html')

@app.route('/api/visitors', methods=['POST'])
def create_visitor():
    """API para criar novo visitante"""
    try:
        data = request.json
        
        # Validar dados obrigatórios
        if not data.get('name'):
            return jsonify({'error': 'Nome é obrigatório'}), 400
        
        # Conectar ao banco
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Inserir visitante
        cursor.execute('''
            INSERT INTO visitors (name, cpf, phone, email, status)
            VALUES (?, ?, ?, ?, 'pending')
        ''', (data['name'], data.get('cpf'), data.get('phone'), data.get('email')))
        
        visitor_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Iniciar processamento em background
        thread = threading.Thread(target=process_visitor, args=(visitor_id,))
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'success': True,
            'visitor_id': visitor_id,
            'message': 'Visitante cadastrado com sucesso! Processando...'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/visitors/<int:visitor_id>', methods=['GET'])
def get_visitor_status(visitor_id):
    """API para verificar status do visitante"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM visitors WHERE id = ?', (visitor_id,))
        visitor = cursor.fetchone()
        
        conn.close()
        
        if visitor:
            return jsonify({
                'id': visitor['id'],
                'name': visitor['name'],
                'status': visitor['status'],
                'result': visitor['result'],
                'error_message': visitor['error_message'],
                'created_at': visitor['created_at'],
                'processed_at': visitor['processed_at']
            })
        else:
            return jsonify({'error': 'Visitante não encontrado'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/visitors', methods=['GET'])
def list_visitors():
    """API para listar todos os visitantes"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM visitors ORDER BY created_at DESC LIMIT 50')
        visitors = cursor.fetchall()
        
        conn.close()
        
        visitor_list = []
        for visitor in visitors:
            visitor_list.append({
                'id': visitor['id'],
                'name': visitor['name'],
                'status': visitor['status'],
                'created_at': visitor['created_at'],
                'processed_at': visitor['processed_at']
            })
        
        return jsonify(visitors=visitor_list)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def process_visitor(visitor_id):
    """Processa visitante em background usando Selenium"""
    try:
        print(f"🚀 Iniciando processamento do visitante {visitor_id}")
        
        # Buscar dados do visitante
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM visitors WHERE id = ?', (visitor_id,))
        visitor = cursor.fetchone()
        
        if not visitor:
            print(f"❌ Visitante {visitor_id} não encontrado")
            return
        
        # Atualizar status para 'processing'
        cursor.execute('UPDATE visitors SET status = ? WHERE id = ?', ('processing', visitor_id))
        conn.commit()
        conn.close()
        
        # Preparar dados para o script
        visitor_data = {
            'name': visitor['name'],
            'cpf': visitor['cpf'] or '12345678901',
            'phone': visitor['phone'] or '31999999999',
            'email': visitor['email'] or 'visitor@example.com'
        }
        
        # Executar automação
        automation = HikCentralAutomation()
        result = automation.register_visitor(visitor_data)
        
        # Atualizar resultado no banco
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if result['success']:
            cursor.execute('''
                UPDATE visitors 
                SET status = ?, result = ?, processed_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', ('completed', json.dumps(result), visitor_id))
        else:
            cursor.execute('''
                UPDATE visitors 
                SET status = ?, error_message = ?, processed_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', ('error', result.get('error', 'Erro desconhecido'), visitor_id))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Visitante {visitor_id} processado com sucesso")
        
    except Exception as e:
        print(f"❌ Erro ao processar visitante {visitor_id}: {e}")
        
        # Atualizar status de erro
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                UPDATE visitors 
                SET status = ?, error_message = ?, processed_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', ('error', str(e), visitor_id))
            
            conn.commit()
            conn.close()
        except:
            pass

if __name__ == '__main__':
    # Inicializar banco
    init_db()
    
    print("🚀 Iniciando servidor de automação HikCentral...")
    print("📱 API disponível em: http://localhost:5000")
    print("🌐 Interface web em: http://localhost:5000")
    
    # Executar em modo de desenvolvimento
    app.run(host='0.0.0.0', port=5000, debug=True) 