import type { VercelRequest, VercelResponse } from '@vercel/node';
import puppeteer from 'puppeteer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { visitorData } = req.body;
    
    if (!visitorData) {
      return res.status(400).json({ error: 'Dados do visitante são obrigatórios' });
    }

    console.log('🚀 Iniciando scraping real do HikCentral...');
    console.log('👤 Visitante:', visitorData.name);

    // Configurações do HikCentral
    const HIKCENTRAL_URL = process.env.HIKCENTRAL_URL || 'http://192.168.1.200:3389';
    const HIKCENTRAL_USER = process.env.HIKCENTRAL_USER || 'admin';
    const HIKCENTRAL_PASS = process.env.HIKCENTRAL_PASS || 'admin123';

    // Iniciar browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
      // 1. Navegar para o HikCentral
      console.log('🧭 Navegando para HikCentral...');
      await page.goto(HIKCENTRAL_URL, { waitUntil: 'networkidle2' });

      // 2. Fazer login
      console.log('🔐 Fazendo login...');
      await page.type('#username', HIKCENTRAL_USER);
      await page.type('#password', HIKCENTRAL_PASS);
      await page.click('button[type="submit"]');
      await page.waitForNavigation();

      // 3. Navegar para menu principal (4 quadrados)
      console.log('🧭 Navegando para menu principal...');
      await page.waitForSelector('.menu-grid', { timeout: 10000 });
      await page.click('.menu-grid');

      // 4. Selecionar "Entrada de visitante"
      console.log('🧭 Selecionando entrada de visitante...');
      await page.waitForSelector('a[href*="visitor"]', { timeout: 10000 });
      await page.click('a[href*="visitor"]');

      // 5. Escolher "Entrada de visitante não reservada"
      console.log('🧭 Escolhendo entrada não reservada...');
      await page.waitForSelector('a[href*="unreserved"]', { timeout: 10000 });
      await page.click('a[href*="unreserved"]');

      // 6. Preencher formulário
      console.log('📝 Preenchendo formulário...');
      
      // Nome próprio
      await page.waitForSelector('input[name="firstName"]', { timeout: 10000 });
      await page.type('input[name="firstName"]', visitorData.name.split(' ')[0]);
      
      // Apelido (sobrenome)
      if (visitorData.name.split(' ').length > 1) {
        await page.type('input[name="lastName"]', visitorData.name.split(' ').slice(1).join(' '));
      }

      // Visitado (morador)
      await page.select('select[name="visitedPerson"]', visitorData.morador || 'Morador');

      // Objetivo da visita
      await page.select('select[name="visitPurpose"]', 'Business');

      // Hora de saída (próximo dia)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const exitTime = tomorrow.toISOString().slice(0, 16).replace('T', ' ');
      await page.type('input[name="exitTime"]', exitTime);

      // Grupo de visitantes
      await page.select('select[name="visitorGroup"]', 'VisitanteS');

      // RG
      await page.type('input[name="idNumber"]', visitorData.cpf);

      // Telefone
      await page.type('input[name="phone"]', visitorData.phoneNumber);

      // E-mail
      await page.type('input[name="email"]', visitorData.email);

      // 7. Upload da foto (se disponível)
      if (visitorData.photoUrl) {
        console.log('📸 Fazendo upload da foto...');
        const photoInput = await page.$('input[type="file"]');
        if (photoInput) {
          await photoInput.uploadFile(visitorData.photoUrl);
        }
      }

      // 8. Clicar em "Entrada"
      console.log('✅ Clicando em Entrada...');
      await page.click('button[type="submit"]');

      // 9. Aguardar confirmação
      await page.waitForSelector('.success-message', { timeout: 10000 });

      await browser.close();

      const visitorId = `SCRAPED_${Date.now()}`;
      
      console.log('✅ Visitante criado com sucesso via scraping real!');
      
      return res.status(200).json({
        success: true,
        visitorId,
        message: 'Visitante criado via scraping real do HikCentral'
      });

    } catch (error) {
      await browser.close();
      console.error('❌ Erro durante scraping:', error);
      
      return res.status(500).json({
        error: 'Erro durante scraping do HikCentral',
        details: error.message
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