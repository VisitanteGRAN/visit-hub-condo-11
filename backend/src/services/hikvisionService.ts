import axios, { AxiosInstance, AxiosResponse } from 'axios';
import crypto from 'crypto';
import { hikvisionConfig, hikvisionEndpoints, hikvisionDefaults } from '@/config/hikvision';
import { HikvisionUser, HikvisionFaceData, Visitante } from '@/types';
import { logger } from '@/utils/logger';

export class HikvisionService {
  private api: AxiosInstance;
  private authString: string;

  constructor() {
    this.authString = Buffer.from(
      `${hikvisionConfig.username}:${hikvisionConfig.password}`
    ).toString('base64');

    this.api = axios.create({
      baseURL: hikvisionConfig.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${this.authString}`
      }
    });

    // Interceptor para logs de requisições
    this.api.interceptors.request.use(
      (config) => {
        logger.info('Hikvision Request', {
          method: config.method,
          url: config.url,
          data: config.data ? 'Data presente' : 'Sem data'
        });
        return config;
      },
      (error) => {
        logger.error('Erro na requisição Hikvision:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor para logs de respostas
    this.api.interceptors.response.use(
      (response) => {
        logger.info('Hikvision Response', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        logger.error('Erro na resposta Hikvision:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Cria um visitante no sistema Hikvision
   */
  async criarVisitante(visitante: Visitante): Promise<string> {
    try {
      const userData: HikvisionUser = {
        employeeNo: visitante.id,
        name: visitante.nome,
        userType: hikvisionDefaults.userType,
        Valid: {
          enable: true,
          beginTime: visitante.validade_inicio.toISOString(),
          endTime: visitante.validade_fim.toISOString(),
          timeType: 'local'
        },
        doorRight: hikvisionDefaults.doorRight,
        RightPlan: [{
          doorNo: 1,
          planTemplateNo: '1'
        }]
      };

      const response: AxiosResponse = await this.api.post(
        hikvisionEndpoints.createUser,
        { UserInfo: userData }
      );

      if (response.status === 200 && response.data.responseStatus?.statusCode === 1) {
        logger.info(`Visitante criado com sucesso no Hikvision: ${visitante.id}`);
        return visitante.id;
      } else {
        throw new Error(`Erro ao criar visitante: ${response.data.responseStatus?.statusString}`);
      }
    } catch (error) {
      logger.error('Erro ao criar visitante no Hikvision:', error);
      throw new Error(`Falha ao criar visitante no Hikvision: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Adiciona dados faciais (selfie) para um visitante
   */
  async adicionarDadosFaciais(visitanteId: string, selfieUrl: string): Promise<void> {
    try {
      // Baixar a imagem da selfie
      const imageResponse = await axios.get(selfieUrl, { responseType: 'arraybuffer' });
      const imageBase64 = Buffer.from(imageResponse.data).toString('base64');

      const faceData: HikvisionFaceData = {
        employeeNo: visitanteId,
        faceLibType: hikvisionDefaults.faceLibType,
        FDID: this.generateFDID(),
        faceURL: `data:image/jpeg;base64,${imageBase64}`
      };

      const response: AxiosResponse = await this.api.post(
        hikvisionEndpoints.addFaceData,
        { FaceDataRecord: faceData }
      );

      if (response.status === 200 && response.data.responseStatus?.statusCode === 1) {
        logger.info(`Dados faciais adicionados com sucesso para visitante: ${visitanteId}`);
      } else {
        throw new Error(`Erro ao adicionar dados faciais: ${response.data.responseStatus?.statusString}`);
      }
    } catch (error) {
      logger.error('Erro ao adicionar dados faciais no Hikvision:', error);
      throw new Error(`Falha ao adicionar dados faciais: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Atualiza a validade de um visitante
   */
  async atualizarValidadeVisitante(visitanteId: string, novaValidadeFim: Date): Promise<void> {
    try {
      const updateData = {
        UserInfo: {
          employeeNo: visitanteId,
          Valid: {
            enable: true,
            endTime: novaValidadeFim.toISOString(),
            timeType: 'local'
          }
        }
      };

      const response: AxiosResponse = await this.api.put(
        hikvisionEndpoints.updateUser,
        updateData
      );

      if (response.status === 200 && response.data.responseStatus?.statusCode === 1) {
        logger.info(`Validade atualizada com sucesso para visitante: ${visitanteId}`);
      } else {
        throw new Error(`Erro ao atualizar validade: ${response.data.responseStatus?.statusString}`);
      }
    } catch (error) {
      logger.error('Erro ao atualizar validade no Hikvision:', error);
      throw new Error(`Falha ao atualizar validade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Remove um visitante do sistema Hikvision
   */
  async removerVisitante(visitanteId: string): Promise<void> {
    try {
      const response: AxiosResponse = await this.api.delete(
        `${hikvisionEndpoints.deleteUser}`,
        {
          data: {
            UserInfoDelCond: {
              EmployeeNoList: [{ employeeNo: visitanteId }]
            }
          }
        }
      );

      if (response.status === 200 && response.data.responseStatus?.statusCode === 1) {
        logger.info(`Visitante removido com sucesso do Hikvision: ${visitanteId}`);
      } else {
        throw new Error(`Erro ao remover visitante: ${response.data.responseStatus?.statusString}`);
      }
    } catch (error) {
      logger.error('Erro ao remover visitante do Hikvision:', error);
      throw new Error(`Falha ao remover visitante: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Busca logs de acesso de um visitante
   */
  async buscarLogsAcesso(visitanteId: string, dataInicio: Date, dataFim: Date): Promise<any[]> {
    try {
      const searchCondition = {
        SearchCondition: {
          searchID: this.generateSearchId(),
          searchResultPosition: 0,
          maxResults: 100,
          EmployeeNoList: [{ employeeNo: visitanteId }],
          TimeRange: {
            beginTime: dataInicio.toISOString(),
            endTime: dataFim.toISOString()
          }
        }
      };

      const response: AxiosResponse = await this.api.post(
        hikvisionEndpoints.accessLogs,
        searchCondition
      );

      if (response.status === 200 && response.data.responseStatus?.statusCode === 1) {
        return response.data.AcsEventList || [];
      } else {
        throw new Error(`Erro ao buscar logs: ${response.data.responseStatus?.statusString}`);
      }
    } catch (error) {
      logger.error('Erro ao buscar logs de acesso no Hikvision:', error);
      throw new Error(`Falha ao buscar logs: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Testa a conectividade com o sistema Hikvision
   */
  async testarConectividade(): Promise<boolean> {
    try {
      const response = await this.api.get('/ISAPI/System/deviceInfo');
      return response.status === 200;
    } catch (error) {
      logger.error('Erro ao testar conectividade Hikvision:', error);
      return false;
    }
  }

  /**
   * Gera um ID único para dados faciais
   */
  private generateFDID(): string {
    return crypto.randomUUID();
  }

  /**
   * Gera um ID único para pesquisas
   */
  private generateSearchId(): string {
    return crypto.randomUUID();
  }

  /**
   * Sincroniza todos os visitantes ativos com o sistema Hikvision
   */
  async sincronizarVisitantes(visitantes: Visitante[]): Promise<void> {
    logger.info(`Iniciando sincronização de ${visitantes.length} visitantes`);

    const resultados = {
      sucesso: 0,
      erro: 0,
      detalhes: [] as string[]
    };

    for (const visitante of visitantes) {
      try {
        await this.criarVisitante(visitante);
        
        if (visitante.selfie_url) {
          await this.adicionarDadosFaciais(visitante.id, visitante.selfie_url);
        }
        
        resultados.sucesso++;
        resultados.detalhes.push(`✓ ${visitante.nome} (${visitante.id})`);
      } catch (error) {
        resultados.erro++;
        resultados.detalhes.push(`✗ ${visitante.nome} (${visitante.id}): ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        logger.error(`Erro ao sincronizar visitante ${visitante.id}:`, error);
      }
    }

    logger.info('Sincronização concluída', resultados);
  }

  /**
   * Remove visitantes expirados do sistema Hikvision
   */
  async limparVisitantesExpirados(visitantesExpirados: string[]): Promise<void> {
    logger.info(`Removendo ${visitantesExpirados.length} visitantes expirados`);

    for (const visitanteId of visitantesExpirados) {
      try {
        await this.removerVisitante(visitanteId);
        logger.info(`Visitante expirado removido: ${visitanteId}`);
      } catch (error) {
        logger.error(`Erro ao remover visitante expirado ${visitanteId}:`, error);
      }
    }
  }
}

