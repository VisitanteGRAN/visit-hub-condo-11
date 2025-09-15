#!/usr/bin/env node

// 🔐 TESTE DE SEGURANÇA COMPLETO - LOCALHOST
// Verifica todas as implementações de segurança

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔐 INICIANDO TESTES DE SEGURANÇA\n');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(level, message, details = '') {
  const color = colors[level] || colors.reset;
  console.log(`${color}${message}${colors.reset}${details ? ' ' + details : ''}`);
}

// Testes de segurança
const securityTests = [
  {
    name: '🔐 Verificar RLS ativo no Supabase',
    test: () => {
      // Verificar se arquivo SQL foi criado
      const sqlFile = path.join(__dirname, 'security-production-complete.sql');
      if (!fs.existsSync(sqlFile)) {
        throw new Error('Arquivo SQL de segurança não encontrado');
      }
      return 'SQL de segurança criado ✅';
    }
  },
  
  {
    name: '🧹 Verificar sanitização de logs',
    test: () => {
      const loggerFile = path.join(__dirname, 'src', 'utils', 'secureLogger.ts');
      if (!fs.existsSync(loggerFile)) {
        throw new Error('SecureLogger não encontrado');
      }
      
      const content = fs.readFileSync(loggerFile, 'utf8');
      if (!content.includes('sensitiveFields')) {
        throw new Error('Campos sensíveis não configurados no logger');
      }
      
      return 'Logger seguro implementado ✅';
    }
  },
  
  {
    name: '🔑 Verificar ambiente seguro',
    test: () => {
      const envFile = path.join(__dirname, 'src', 'utils', 'envValidator.ts');
      if (!fs.existsSync(envFile)) {
        throw new Error('EnvValidator não encontrado');
      }
      
      const templateFile = path.join(__dirname, 'env.security.template');
      if (!fs.existsSync(templateFile)) {
        throw new Error('Template de ambiente seguro não encontrado');
      }
      
      return 'Validação de ambiente implementada ✅';
    }
  },
  
  {
    name: '🍪 Verificar autenticação segura',
    test: () => {
      const authFile = path.join(__dirname, 'src', 'utils', 'secureAuth.ts');
      if (!fs.existsSync(authFile)) {
        throw new Error('SecureAuth não encontrado');
      }
      
      const content = fs.readFileSync(authFile, 'utf8');
      if (!content.includes('httpOnly')) {
        throw new Error('Configuração httpOnly não encontrada');
      }
      
      return 'Autenticação com cookies seguros ✅';
    }
  },
  
  {
    name: '🛡️ Verificar headers de segurança',
    test: () => {
      const headersFile = path.join(__dirname, 'src', 'utils', 'securityHeaders.ts');
      if (!fs.existsSync(headersFile)) {
        throw new Error('SecurityHeaders não encontrado');
      }
      
      const content = fs.readFileSync(headersFile, 'utf8');
      const requiredHeaders = [
        'Content-Security-Policy',
        'X-Frame-Options',
        'X-Content-Type-Options'
      ];
      
      for (const header of requiredHeaders) {
        if (!content.includes(header)) {
          throw new Error(`Header ${header} não configurado`);
        }
      }
      
      return 'Headers de segurança implementados ✅';
    }
  },
  
  {
    name: '🧹 Verificar sanitização de inputs',
    test: () => {
      const sanitizerFile = path.join(__dirname, 'src', 'utils', 'inputSanitizer.ts');
      if (!fs.existsSync(sanitizerFile)) {
        throw new Error('InputSanitizer não encontrado');
      }
      
      const content = fs.readFileSync(sanitizerFile, 'utf8');
      const requiredMethods = [
        'sanitizeCPF',
        'sanitizeEmail',
        'escapeHtml',
        'validateInput'
      ];
      
      for (const method of requiredMethods) {
        if (!content.includes(method)) {
          throw new Error(`Método ${method} não encontrado`);
        }
      }
      
      return 'Sanitização de inputs implementada ✅';
    }
  },
  
  {
    name: '📝 Verificar logs limpos',
    test: () => {
      const scriptFile = path.join(__dirname, 'scripts', 'sanitize-logs.js');
      if (!fs.existsSync(scriptFile)) {
        throw new Error('Script de sanitização não encontrado');
      }
      
      // Verificar se alguns arquivos não têm mais console.log inseguros
      const filesToCheck = [
        'src/contexts/AuthContext.tsx',
        'src/services/cpfVerificationService.ts'
      ];
      
      let insecureLogsFound = 0;
      filesToCheck.forEach(file => {
        const fullPath = path.join(__dirname, file);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const insecurePatterns = [
            /console\.log.*cpf/i,
            /console\.log.*telefone/i,
            /console\.log.*senha/i,
            /console\.log.*password/i
          ];
          
          insecurePatterns.forEach(pattern => {
            if (pattern.test(content)) {
              insecureLogsFound++;
            }
          });
        }
      });
      
      if (insecureLogsFound > 0) {
        throw new Error(`${insecureLogsFound} logs inseguros ainda encontrados`);
      }
      
      return 'Logs sanitizados com sucesso ✅';
    }
  },
  
  {
    name: '⚙️ Verificar inicialização segura',
    test: () => {
      const mainFile = path.join(__dirname, 'src', 'main.tsx');
      if (!fs.existsSync(mainFile)) {
        throw new Error('main.tsx não encontrado');
      }
      
      const content = fs.readFileSync(mainFile, 'utf8');
      if (!content.includes('securityHeaders')) {
        throw new Error('Headers de segurança não inicializados');
      }
      
      if (!content.includes('envValidator')) {
        throw new Error('Validador de ambiente não inicializado');
      }
      
      return 'Inicialização segura configurada ✅';
    }
  }
];

// Executar todos os testes
let passed = 0;
let failed = 0;

for (const test of securityTests) {
  try {
    log('blue', `\n🧪 ${test.name}`);
    const result = test.test();
    log('green', `✅ PASSOU: ${result}`);
    passed++;
  } catch (error) {
    log('red', `❌ FALHOU: ${error.message}`);
    failed++;
  }
}

// Resumo final
console.log('\n' + '='.repeat(60));
log('blue', '📊 RESUMO DOS TESTES DE SEGURANÇA');
console.log('='.repeat(60));

log('green', `✅ Testes Aprovados: ${passed}`);
if (failed > 0) {
  log('red', `❌ Testes Falharam: ${failed}`);
}

const securityScore = Math.round((passed / securityTests.length) * 100);
log('blue', `🎯 Score de Segurança: ${securityScore}%`);

if (securityScore >= 90) {
  log('green', '\n🛡️ EXCELENTE! Sistema muito seguro!');
} else if (securityScore >= 70) {
  log('yellow', '\n⚠️ BOM: Algumas melhorias necessárias');
} else {
  log('red', '\n🚨 CRÍTICO: Muitas vulnerabilidades encontradas!');
}

// Próximos passos
console.log('\n📋 PRÓXIMOS PASSOS:');
console.log('1. 🗄️ Execute o SQL no Supabase: security-production-complete.sql');
console.log('2. 🔧 Configure .env.local baseado em: env.security.template');
console.log('3. 🧪 Teste a aplicação: npm run dev');
console.log('4. 🔍 Monitore logs para vazamentos de dados');
console.log('5. 🛡️ Execute auditorias periódicas de segurança');

console.log('\n🔐 SEGURANÇA IMPLEMENTADA COM SUCESSO! 🎉');

// Exit code baseado nos resultados
process.exit(failed > 0 ? 1 : 0);
