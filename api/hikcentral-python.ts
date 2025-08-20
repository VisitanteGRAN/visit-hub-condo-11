import type { VercelRequest, VercelResponse } from '@vercel/node';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { visitorData } = req.body;
    
    if (!visitorData) {
      return res.status(400).json({ error: 'Dados do visitante são obrigatórios' });
    }

    console.log('🚀 Iniciando automação Python...');
    console.log('👤 Visitante:', visitorData.name);

    // Preparar dados para o script Python
    const pythonData = {
      name: visitorData.name,
      cpf: visitorData.cpf,
      phone: visitorData.phoneNumber,
      email: visitorData.email
    };

    const jsonData = JSON.stringify(pythonData);
    
    // Executar script Python
    console.log('🐍 Executando script Python...');
    
    try {
      const { stdout, stderr } = await execAsync(`python3 hikcentral_automation.py '${jsonData}'`);
      
      if (stderr) {
        console.error('⚠️ Warnings do Python:', stderr);
      }
      
      console.log('📄 Output do Python:', stdout);
      
      // Verificar se foi bem-sucedido
      if (stdout.includes('✅ Visitante criado com sucesso') || stdout.includes('🎉 Processo concluído com sucesso')) {
        const visitorId = `PYTHON_${Date.now()}`;
        
        console.log('✅ Visitante criado com sucesso via Python!');
        
        return res.status(200).json({
          success: true,
          visitorId,
          message: 'Visitante criado via automação Python do HikCentral',
          logs: stdout
        });
      } else {
        console.error('❌ Script Python falhou');
        return res.status(500).json({
          error: 'Script Python falhou',
          logs: stdout,
          stderr: stderr
        });
      }
      
    } catch (execError) {
      console.error('❌ Erro ao executar script Python:', execError);
      return res.status(500).json({
        error: 'Erro ao executar script Python',
        details: execError.message
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
} 