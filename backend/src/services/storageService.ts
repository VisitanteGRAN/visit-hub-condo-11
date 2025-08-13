import { supabase } from '@/config/database';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { generateUniqueFilename } from '@/middlewares/upload';

export class StorageService {
  private readonly bucketName = 'visitantes-uploads';

  /**
   * Configura os buckets necessários no Supabase Storage
   */
  async configurarBuckets(): Promise<void> {
    try {
      // Verificar se bucket existe
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        throw new Error(`Erro ao listar buckets: ${listError.message}`);
      }

      const bucketExiste = buckets?.some(bucket => bucket.name === this.bucketName);

      if (!bucketExiste) {
        // Criar bucket privado
        const { error: createError } = await supabase.storage.createBucket(this.bucketName, {
          public: false,
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png'],
          fileSizeLimit: config.uploadMaxSize
        });

        if (createError) {
          throw new Error(`Erro ao criar bucket: ${createError.message}`);
        }

        logger.info('Bucket criado com sucesso', { bucketName: this.bucketName });
      }

      // Configurar políticas RLS para o bucket (se necessário)
      await this.configurarPoliticasRLS();
    } catch (error) {
      logger.error('Erro ao configurar buckets:', error);
      throw error;
    }
  }

  /**
   * Configura políticas RLS para o storage
   */
  private async configurarPoliticasRLS(): Promise<void> {
    // As políticas RLS para storage devem ser configuradas diretamente no Supabase Dashboard
    // ou via SQL. Aqui apenas documentamos as políticas necessárias:
    
    /*
    Políticas necessárias para o bucket 'visitantes-uploads':
    
    1. INSERT: Permitir upload apenas para visitantes através de links válidos
    2. SELECT: Permitir visualização apenas para o morador responsável e admins
    3. UPDATE: Não permitir atualizações
    4. DELETE: Permitir deleção apenas para admins ou sistema de limpeza
    */
    
    logger.info('Políticas RLS devem ser configuradas no Supabase Dashboard');
  }

  /**
   * Faz upload de uma selfie
   */
  async uploadSelfie(visitanteId: string, arquivo: Express.Multer.File): Promise<string> {
    try {
      const fileName = generateUniqueFilename(arquivo.originalname, `selfie_${visitanteId}_`);
      const filePath = `selfies/${fileName}`;

      // Upload do arquivo
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, arquivo.buffer, {
          contentType: arquivo.mimetype,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Erro no upload da selfie: ${error.message}`);
      }

      logger.info('Selfie enviada com sucesso', {
        visitanteId,
        fileName,
        fileSize: arquivo.size
      });

      return this.getPublicUrl(filePath);
    } catch (error) {
      logger.error('Erro no upload da selfie:', error);
      throw error;
    }
  }

  /**
   * Faz upload de um documento
   */
  async uploadDocumento(visitanteId: string, arquivo: Express.Multer.File): Promise<string> {
    try {
      const fileName = generateUniqueFilename(arquivo.originalname, `doc_${visitanteId}_`);
      const filePath = `documentos/${fileName}`;

      // Upload do arquivo
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, arquivo.buffer, {
          contentType: arquivo.mimetype,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Erro no upload do documento: ${error.message}`);
      }

      logger.info('Documento enviado com sucesso', {
        visitanteId,
        fileName,
        fileSize: arquivo.size
      });

      return this.getPublicUrl(filePath);
    } catch (error) {
      logger.error('Erro no upload do documento:', error);
      throw error;
    }
  }

  /**
   * Gera URL assinada para acesso ao arquivo
   */
  async getSignedUrl(filePath: string, expiresInSeconds: number = 3600): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresInSeconds);

      if (error) {
        throw new Error(`Erro ao gerar URL assinada: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      logger.error('Erro ao gerar URL assinada:', error);
      throw error;
    }
  }

  /**
   * Obtém URL pública do arquivo (para buckets públicos)
   */
  private getPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * Remove um arquivo do storage
   */
  async removerArquivo(filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        throw new Error(`Erro ao remover arquivo: ${error.message}`);
      }

      logger.info('Arquivo removido com sucesso', { filePath });
    } catch (error) {
      logger.error('Erro ao remover arquivo:', error);
      throw error;
    }
  }

  /**
   * Lista arquivos de um visitante
   */
  async listarArquivosVisitante(visitanteId: string): Promise<{
    selfies: string[];
    documentos: string[];
  }> {
    try {
      // Listar selfies
      const { data: selfies, error: selfiesError } = await supabase.storage
        .from(this.bucketName)
        .list('selfies', {
          search: `selfie_${visitanteId}_`
        });

      if (selfiesError) {
        throw new Error(`Erro ao listar selfies: ${selfiesError.message}`);
      }

      // Listar documentos
      const { data: documentos, error: documentosError } = await supabase.storage
        .from(this.bucketName)
        .list('documentos', {
          search: `doc_${visitanteId}_`
        });

      if (documentosError) {
        throw new Error(`Erro ao listar documentos: ${documentosError.message}`);
      }

      return {
        selfies: selfies?.map(file => `selfies/${file.name}`) || [],
        documentos: documentos?.map(file => `documentos/${file.name}`) || []
      };
    } catch (error) {
      logger.error('Erro ao listar arquivos do visitante:', error);
      throw error;
    }
  }

  /**
   * Remove todos os arquivos de um visitante (compliance LGPD)
   */
  async removerArquivosVisitante(visitanteId: string): Promise<void> {
    try {
      const arquivos = await this.listarArquivosVisitante(visitanteId);
      
      const todosArquivos = [
        ...arquivos.selfies,
        ...arquivos.documentos
      ];

      if (todosArquivos.length === 0) {
        logger.info('Nenhum arquivo encontrado para o visitante', { visitanteId });
        return;
      }

      // Remover todos os arquivos
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove(todosArquivos);

      if (error) {
        throw new Error(`Erro ao remover arquivos do visitante: ${error.message}`);
      }

      logger.info('Todos os arquivos do visitante removidos', {
        visitanteId,
        quantidadeArquivos: todosArquivos.length
      });
    } catch (error) {
      logger.error('Erro ao remover arquivos do visitante:', error);
      throw error;
    }
  }

  /**
   * Limpa arquivos antigos (para manutenção)
   */
  async limparArquivosAntigos(diasRetencao: number = 365): Promise<number> {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasRetencao);

      let arquivosRemovidos = 0;

      // Listar todos os arquivos de selfies
      const { data: selfies, error: selfiesError } = await supabase.storage
        .from(this.bucketName)
        .list('selfies');

      if (selfiesError) {
        throw new Error(`Erro ao listar selfies: ${selfiesError.message}`);
      }

      // Listar todos os arquivos de documentos
      const { data: documentos, error: documentosError } = await supabase.storage
        .from(this.bucketName)
        .list('documentos');

      if (documentosError) {
        throw new Error(`Erro ao listar documentos: ${documentosError.message}`);
      }

      const todosArquivos = [
        ...(selfies?.map(file => ({ ...file, path: `selfies/${file.name}` })) || []),
        ...(documentos?.map(file => ({ ...file, path: `documentos/${file.name}` })) || [])
      ];

      // Filtrar arquivos antigos
      const arquivosAntigos = todosArquivos.filter(file => {
        if (!file.created_at) return false;
        return new Date(file.created_at) < dataLimite;
      });

      if (arquivosAntigos.length === 0) {
        logger.info('Nenhum arquivo antigo encontrado para limpeza');
        return 0;
      }

      // Remover arquivos antigos em lotes
      const batchSize = 100;
      for (let i = 0; i < arquivosAntigos.length; i += batchSize) {
        const batch = arquivosAntigos.slice(i, i + batchSize);
        const pathsToDelete = batch.map(file => file.path);

        const { error } = await supabase.storage
          .from(this.bucketName)
          .remove(pathsToDelete);

        if (error) {
          logger.error('Erro ao remover lote de arquivos antigos:', error);
        } else {
          arquivosRemovidos += batch.length;
        }
      }

      logger.info('Limpeza de arquivos antigos concluída', {
        arquivosRemovidos,
        diasRetencao
      });

      return arquivosRemovidos;
    } catch (error) {
      logger.error('Erro na limpeza de arquivos antigos:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de uso do storage
   */
  async obterEstatisticasStorage(): Promise<{
    totalArquivos: number;
    tamanhoTotal: number;
    selfies: number;
    documentos: number;
  }> {
    try {
      // Listar selfies
      const { data: selfies } = await supabase.storage
        .from(this.bucketName)
        .list('selfies');

      // Listar documentos
      const { data: documentos } = await supabase.storage
        .from(this.bucketName)
        .list('documentos');

      const totalSelfies = selfies?.length || 0;
      const totalDocumentos = documentos?.length || 0;
      const totalArquivos = totalSelfies + totalDocumentos;

      // Calcular tamanho total (se disponível nos metadados)
      const tamanhoTotal = [
        ...(selfies || []),
        ...(documentos || [])
      ].reduce((total, file) => total + (file.metadata?.size || 0), 0);

      return {
        totalArquivos,
        tamanhoTotal,
        selfies: totalSelfies,
        documentos: totalDocumentos
      };
    } catch (error) {
      logger.error('Erro ao obter estatísticas do storage:', error);
      throw error;
    }
  }
}
