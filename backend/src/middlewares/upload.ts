import multer from 'multer';
import sharp from 'sharp';
import { Request, Response, NextFunction } from 'express';
import { config } from '@/config';
import { validarArquivoImagem } from '@/utils/validation';
import { logger } from '@/utils/logger';
import path from 'path';
import fs from 'fs/promises';

// Configuração do multer para armazenamento em memória
const storage = multer.memoryStorage();

// Filtro de arquivos para aceitar apenas imagens
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const validation = validarArquivoImagem(file);
  
  if (validation.valid) {
    cb(null, true);
  } else {
    cb(new Error(validation.message || 'Arquivo inválido'));
  }
};

// Configuração base do multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.uploadMaxSize,
    files: 1 // Apenas um arquivo por vez
  }
});

// Middleware para upload de selfie
export const uploadSelfie = upload.single('selfie');

// Middleware para upload de documento
export const uploadDocumento = upload.single('documento');

// Middleware para processamento de imagem
export const processImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'Arquivo não fornecido'
      });
      return;
    }

    // Validar se é uma imagem válida
    const validation = validarArquivoImagem(req.file);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        message: validation.message
      });
      return;
    }

    // Determinar tipo de processamento baseado no campo
    const isDocument = req.file.fieldname === 'documento';
    const isSelfie = req.file.fieldname === 'selfie';

    let processedBuffer: Buffer;
    let metadata: sharp.Metadata;

    try {
      // Obter metadados da imagem
      metadata = await sharp(req.file.buffer).metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Não foi possível obter dimensões da imagem');
      }

      // Configurações de processamento baseadas no tipo
      if (isSelfie) {
        // Processamento para selfie
        processedBuffer = await sharp(req.file.buffer)
          .resize(800, 800, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .jpeg({ 
            quality: 85,
            progressive: true 
          })
          .toBuffer();
      } else if (isDocument) {
        // Processamento para documento
        processedBuffer = await sharp(req.file.buffer)
          .resize(1200, 1600, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .jpeg({ 
            quality: 90,
            progressive: true 
          })
          .toBuffer();
      } else {
        // Processamento padrão
        processedBuffer = await sharp(req.file.buffer)
          .resize(1024, 1024, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .jpeg({ 
            quality: 85,
            progressive: true 
          })
          .toBuffer();
      }

      // Atualizar o arquivo processado
      req.file.buffer = processedBuffer;
      req.file.mimetype = 'image/jpeg';
      req.file.size = processedBuffer.length;

      // Adicionar informações de processamento ao request
      (req as any).imageMetadata = {
        originalWidth: metadata.width,
        originalHeight: metadata.height,
        processedSize: processedBuffer.length,
        format: 'jpeg',
        quality: isSelfie ? 85 : isDocument ? 90 : 85
      };

      logger.info('Imagem processada com sucesso', {
        fieldname: req.file.fieldname,
        originalSize: req.file.size,
        processedSize: processedBuffer.length,
        dimensions: `${metadata.width}x${metadata.height}`
      });

      next();
    } catch (processingError) {
      logger.error('Erro no processamento da imagem:', processingError);
      res.status(400).json({
        success: false,
        message: 'Erro ao processar imagem. Verifique se o arquivo está corrompido.'
      });
      return;
    }
  } catch (error) {
    logger.error('Erro no middleware de processamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno no processamento da imagem'
    });
  }
};

// Middleware para validação adicional de selfie
export const validateSelfie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file || req.file.fieldname !== 'selfie') {
      next();
      return;
    }

    // Análise básica da imagem para verificar se pode ser uma face
    const metadata = await sharp(req.file.buffer).metadata();
    
    if (!metadata.width || !metadata.height) {
      res.status(400).json({
        success: false,
        message: 'Não foi possível analisar a imagem'
      });
      return;
    }

    // Verificar proporções mínimas (face normalmente é mais quadrada)
    const aspectRatio = metadata.width / metadata.height;
    if (aspectRatio > 2 || aspectRatio < 0.5) {
      res.status(400).json({
        success: false,
        message: 'A selfie deve ter proporções adequadas para reconhecimento facial'
      });
      return;
    }

    // Verificar tamanho mínimo
    if (metadata.width < 200 || metadata.height < 200) {
      res.status(400).json({
        success: false,
        message: 'A selfie deve ter pelo menos 200x200 pixels'
      });
      return;
    }

    logger.info('Selfie validada com sucesso', {
      width: metadata.width,
      height: metadata.height,
      aspectRatio: aspectRatio.toFixed(2)
    });

    next();
  } catch (error) {
    logger.error('Erro na validação da selfie:', error);
    res.status(500).json({
      success: false,
      message: 'Erro na validação da selfie'
    });
  }
};

// Middleware para lidar com erros de upload
export const handleUploadError = (error: any, req: Request, res: Response, next: NextFunction): void => {
  if (error instanceof multer.MulterError) {
    let message = 'Erro no upload do arquivo';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = `Arquivo muito grande. Tamanho máximo: ${config.uploadMaxSize / (1024 * 1024)}MB`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Muitos arquivos. Envie apenas um arquivo por vez.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Campo de arquivo não esperado.';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Muitos campos no formulário.';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Nome do campo muito longo.';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Valor do campo muito longo.';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Muitas partes no formulário.';
        break;
    }
    
    logger.warn('Erro de upload Multer', {
      code: error.code,
      message: error.message,
      field: error.field
    });
    
    res.status(400).json({
      success: false,
      message
    });
    return;
  }
  
  if (error.message) {
    logger.error('Erro customizado de upload:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
    return;
  }
  
  logger.error('Erro desconhecido de upload:', error);
  res.status(500).json({
    success: false,
    message: 'Erro interno no upload do arquivo'
  });
};

// Função utilitária para gerar nome único de arquivo
export const generateUniqueFilename = (originalname: string, prefix: string = ''): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalname).toLowerCase();
  
  return `${prefix}${timestamp}_${randomSuffix}${extension}`;
};

// Função para criar diretório se não existir
export const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    logger.info('Diretório criado', { path: dirPath });
  }
};
