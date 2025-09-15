#!/usr/bin/env node

// 🧹 SCRIPT PARA SANITIZAR TODOS OS LOGS DO PROJETO
// Remove dados sensíveis de console.log e substitui por logger seguro

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Padrões de logs inseguros para substituir
const INSECURE_PATTERNS = [
  // console.log com dados sensíveis
  {
    pattern: /console\.log\(['"`].*?(cpf|telefone|senha|password|rg|placa|token).*?['"`],?\s*[^)]*\)/gi,
    replacement: '// [REMOVED] Sensitive data log removed for security'
  },
  
  // console.log com objetos que podem conter dados sensíveis
  {
    pattern: /console\.log\(['"`].*?['"`],\s*(formData|userData|loginData|registrationData)[^)]*\)/gi,
    replacement: (match) => {
      const varName = match.match(/(formData|userData|loginData|registrationData)/)[1];
      return `logger.info(${match.split(',')[0]}, { ${varName}: '[SANITIZED]' })`;
    }
  },
  
  // Logs simples que podem ser convertidos
  {
    pattern: /console\.log\((['"`].*?['"`])\)/g,
    replacement: 'logger.info($1)'
  },
  
  // console.error 
  {
    pattern: /console\.error\((['"`].*?['"`])\)/g,
    replacement: 'logger.error($1)'
  },
  
  // console.warn
  {
    pattern: /console\.warn\((['"`].*?['"`])\)/g,
    replacement: 'logger.warn($1)'
  }
];

// Arquivos a serem processados
const TARGET_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const EXCLUDE_DIRS = ['node_modules', 'dist', 'build', '.git', 'scripts'];

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  return TARGET_EXTENSIONS.includes(ext) && 
         !EXCLUDE_DIRS.some(dir => filePath.includes(dir));
}

function addSecureLoggerImport(content, filePath) {
  // Verificar se já tem o import
  if (content.includes("from '@/utils/secureLogger'")) {
    return content;
  }
  
  // Encontrar a posição para adicionar o import
  const importRegex = /import.*?from.*?['""];?\n/g;
  const imports = content.match(importRegex) || [];
  
  if (imports.length > 0) {
    const lastImport = imports[imports.length - 1];
    const lastImportIndex = content.lastIndexOf(lastImport);
    const insertPosition = lastImportIndex + lastImport.length;
    
    const newImport = "import { logger } from '@/utils/secureLogger';\n";
    return content.slice(0, insertPosition) + newImport + content.slice(insertPosition);
  }
  
  // Se não há imports, adicionar no início
  return "import { logger } from '@/utils/secureLogger';\n\n" + content;
}

function sanitizeFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Verificar se há logs inseguros
    const hasInsecureLogs = /console\.(log|error|warn|info)/.test(content);
    
    if (!hasInsecureLogs) {
      return { processed: false, changes: 0 };
    }
    
    // Adicionar import do logger seguro
    content = addSecureLoggerImport(content, filePath);
    hasChanges = true;
    
    let changeCount = 0;
    
    // Aplicar padrões de sanitização
    INSECURE_PATTERNS.forEach(({ pattern, replacement }) => {
      const matches = content.match(pattern);
      if (matches) {
        changeCount += matches.length;
        content = content.replace(pattern, replacement);
        hasChanges = true;
      }
    });
    
    // Salvar arquivo modificado
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      return { processed: true, changes: changeCount };
    }
    
    return { processed: false, changes: 0 };
    
  } catch (error) {
    console.error(`Erro processando ${filePath}:`, error.message);
    return { processed: false, changes: 0, error: error.message };
  }
}

function scanDirectory(dirPath) {
  const results = {
    totalFiles: 0,
    processedFiles: 0,
    totalChanges: 0,
    errors: []
  };
  
  function scan(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    items.forEach(item => {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !EXCLUDE_DIRS.includes(item)) {
        scan(fullPath);
      } else if (stat.isFile() && shouldProcessFile(fullPath)) {
        results.totalFiles++;
        
        const result = sanitizeFile(fullPath);
        
        if (result.error) {
          results.errors.push({ file: fullPath, error: result.error });
        } else if (result.processed) {
          results.processedFiles++;
          results.totalChanges += result.changes;
          console.log(`✅ ${fullPath}: ${result.changes} logs sanitizados`);
        }
      }
    });
  }
  
  scan(dirPath);
  return results;
}

// Executar sanitização
console.log('🧹 Iniciando sanitização de logs...\n');

const srcPath = path.join(__dirname, '../src');
const results = scanDirectory(srcPath);

console.log('\n📊 RESULTADO DA SANITIZAÇÃO:');
console.log(`📁 Total de arquivos verificados: ${results.totalFiles}`);
console.log(`✅ Arquivos processados: ${results.processedFiles}`);
console.log(`🔧 Total de logs sanitizados: ${results.totalChanges}`);

if (results.errors.length > 0) {
  console.log(`\n❌ Erros encontrados: ${results.errors.length}`);
  results.errors.forEach(({ file, error }) => {
    console.log(`   ${file}: ${error}`);
  });
}

console.log('\n🔐 Sanitização concluída! Logs agora são seguros.');
