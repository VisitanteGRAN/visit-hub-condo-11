/**
 * Script de configuração inicial do projeto
 * Execute com: node scripts/setup.js
 */

const fs = require('fs');
const path = require('path');

function createEnvFile() {
  const envExamplePath = path.join(__dirname, '..', 'env.example');
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ Arquivo .env criado a partir do env.example');
      console.log('⚠️  Configure as variáveis de ambiente no arquivo .env');
    } else {
      console.log('❌ Arquivo env.example não encontrado');
    }
  } else {
    console.log('ℹ️  Arquivo .env já existe');
  }
}

function createDirectories() {
  const directories = [
    'logs',
    'uploads',
    'uploads/selfies',
    'uploads/documentos'
  ];
  
  directories.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Diretório criado: ${dir}`);
    } else {
      console.log(`ℹ️  Diretório já existe: ${dir}`);
    }
  });
}

function createGitIgnore() {
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  const gitignoreContent = `# Dependencies
node_modules/

# Environment variables
.env
.env.local
.env.production

# Build output
dist/
build/

# Logs
logs/
*.log
npm-debug.log*

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Uploads (local development)
uploads/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# TypeScript cache
*.tsbuildinfo
`;

  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log('✅ Arquivo .gitignore criado');
  } else {
    console.log('ℹ️  Arquivo .gitignore já existe');
  }
}

function displayNextSteps() {
  console.log('\n🎉 Configuração inicial concluída!\n');
  console.log('📋 Próximos passos:');
  console.log('1. Configure as variáveis de ambiente no arquivo .env');
  console.log('2. Execute os scripts SQL no Supabase:');
  console.log('   - database/01_initial_schema.sql');
  console.log('   - database/02_rls_policies.sql');
  console.log('   - database/03_initial_data.sql');
  console.log('3. Configure o bucket "visitantes-uploads" no Supabase Storage');
  console.log('4. Execute: npm run dev');
  console.log('\n📖 Consulte o README.md para mais informações');
}

function main() {
  console.log('🚀 Configurando projeto Visit Hub Backend...\n');
  
  try {
    createEnvFile();
    createDirectories();
    createGitIgnore();
    displayNextSteps();
  } catch (error) {
    console.error('❌ Erro durante a configuração:', error.message);
    process.exit(1);
  }
}

main();
