import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  let driver: WebDriver | null = null;

  try {
    const { visitorData } = req.body;
    
    if (!visitorData) {
      return res.status(400).json({ error: 'Dados do visitante são obrigatórios' });
    }

    console.log('🚀 Iniciando scraping com Selenium...');
    console.log('👤 Visitante:', visitorData.name);

    // Configurações do HikCentral
    const HIKCENTRAL_URL = process.env.HIKCENTRAL_URL || 'http://192.168.1.200:3389';
    const HIKCENTRAL_USER = process.env.HIKCENTRAL_USER || 'admin';
    const HIKCENTRAL_PASS = process.env.HIKCENTRAL_PASS || 'admin123';

    // Configurar Chrome headless
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');

    // Iniciar driver
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    try {
      // 1. Navegar para o HikCentral
      console.log('🧭 Navegando para HikCentral...');
      await driver.get(HIKCENTRAL_URL);
      await driver.wait(until.titleContains('HikCentral'), 10000);

      // 2. Fazer login
      console.log('🔐 Fazendo login...');
      const usernameField = await driver.wait(until.elementLocated(By.id('username')), 10000);
      const passwordField = await driver.wait(until.elementLocated(By.id('password')), 10000);
      
      await usernameField.clear();
      await usernameField.sendKeys(HIKCENTRAL_USER);
      await passwordField.clear();
      await passwordField.sendKeys(HIKCENTRAL_PASS);
      
      const loginButton = await driver.findElement(By.css('button[type="submit"]'));
      await loginButton.click();
      
      // Aguardar login
      await driver.wait(until.urlContains('dashboard'), 10000);

      // 3. Navegar para menu principal
      console.log('🧭 Navegando para menu principal...');
      const menuButton = await driver.wait(until.elementLocated(By.css('.menu-grid, .main-menu, [data-testid="menu"]')), 10000);
      await menuButton.click();

      // 4. Selecionar "Entrada de visitante"
      console.log('🧭 Selecionando entrada de visitante...');
      const visitorLink = await driver.wait(until.elementLocated(By.xpath("//a[contains(text(), 'visitante') or contains(@href, 'visitor')]")), 10000);
      await visitorLink.click();

      // 5. Escolher "Entrada de visitante não reservada"
      console.log('🧭 Escolhendo entrada não reservada...');
      const unreservedLink = await driver.wait(until.elementLocated(By.xpath("//a[contains(text(), 'não reservada') or contains(text(), 'unreserved')]")), 10000);
      await unreservedLink.click();

      // 6. Preencher formulário
      console.log('📝 Preenchendo formulário...');
      
      // Nome próprio
      const firstNameField = await driver.wait(until.elementLocated(By.name('firstName')), 10000);
      await firstNameField.clear();
      await firstNameField.sendKeys(visitorData.name.split(' ')[0]);
      
      // Apelido (sobrenome)
      if (visitorData.name.split(' ').length > 1) {
        const lastNameField = await driver.findElement(By.name('lastName'));
        await lastNameField.clear();
        await lastNameField.sendKeys(visitorData.name.split(' ').slice(1).join(' '));
      }

      // Visitado (morador)
      const visitedPersonSelect = await driver.findElement(By.name('visitedPerson'));
      await visitedPersonSelect.click();
      const moradorOption = await driver.findElement(By.xpath(`//option[contains(text(), '${visitorData.morador}')]`));
      await moradorOption.click();

      // Objetivo da visita
      const purposeSelect = await driver.findElement(By.name('visitPurpose'));
      await purposeSelect.click();
      const businessOption = await driver.findElement(By.xpath("//option[contains(text(), 'Business')]"));
      await businessOption.click();

      // Hora de saída (próximo dia)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const exitTime = tomorrow.toISOString().slice(0, 16).replace('T', ' ');
      const exitTimeField = await driver.findElement(By.name('exitTime'));
      await exitTimeField.clear();
      await exitTimeField.sendKeys(exitTime);

      // Grupo de visitantes
      const groupSelect = await driver.findElement(By.name('visitorGroup'));
      await groupSelect.click();
      const visitorGroupOption = await driver.findElement(By.xpath("//option[contains(text(), 'VisitanteS')]"));
      await visitorGroupOption.click();

      // RG
      const idField = await driver.findElement(By.name('idNumber'));
      await idField.clear();
      await idField.sendKeys(visitorData.cpf);

      // Telefone
      const phoneField = await driver.findElement(By.name('phone'));
      await phoneField.clear();
      await phoneField.sendKeys(visitorData.phoneNumber);

      // E-mail
      const emailField = await driver.findElement(By.name('email'));
      await emailField.clear();
      await emailField.sendKeys(visitorData.email);

      // 7. Upload da foto (se disponível)
      if (visitorData.photoUrl) {
        console.log('📸 Fazendo upload da foto...');
        const fileInput = await driver.findElement(By.css('input[type="file"]'));
        await fileInput.sendKeys(visitorData.photoUrl);
      }

      // 8. Clicar em "Entrada"
      console.log('✅ Clicando em Entrada...');
      const submitButton = await driver.findElement(By.css('button[type="submit"], input[type="submit"]'));
      await submitButton.click();

      // 9. Aguardar confirmação
      await driver.wait(until.elementLocated(By.css('.success-message, .alert-success')), 10000);

      const visitorId = `SELENIUM_${Date.now()}`;
      
      console.log('✅ Visitante criado com sucesso via Selenium!');
      
      return res.status(200).json({
        success: true,
        visitorId,
        message: 'Visitante criado via Selenium scraping do HikCentral'
      });

    } catch (error) {
      console.error('❌ Erro durante scraping:', error);
      
      // Capturar screenshot para debug
      if (driver) {
        try {
          const screenshot = await driver.takeScreenshot();
          console.log('📸 Screenshot capturado para debug');
        } catch (screenshotError) {
          console.error('❌ Erro ao capturar screenshot:', screenshotError);
        }
      }
      
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
  } finally {
    // Sempre fechar o driver
    if (driver) {
      try {
        await driver.quit();
        console.log('🔒 Driver fechado');
      } catch (closeError) {
        console.error('❌ Erro ao fechar driver:', closeError);
      }
    }
  }
} 