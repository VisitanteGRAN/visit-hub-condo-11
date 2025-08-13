import { HikvisionConfig } from '@/types';

// Configuração da integração Hikvision
export const hikvisionConfig: HikvisionConfig = {
  baseUrl: process.env.HIKVISION_BASE_URL || 'http://192.168.1.100',
  username: process.env.HIKVISION_USERNAME || 'admin',
  password: process.env.HIKVISION_PASSWORD || '',
  deviceIndex: process.env.HIKVISION_DEVICE_INDEX || '1'
};

// Validação das configurações obrigatórias
export function validateHikvisionConfig(): void {
  if (!hikvisionConfig.password) {
    throw new Error('HIKVISION_PASSWORD é obrigatória');
  }
  
  if (!hikvisionConfig.baseUrl) {
    throw new Error('HIKVISION_BASE_URL é obrigatória');
  }
}

// URLs dos endpoints da API Hikvision
export const hikvisionEndpoints = {
  // Gestão de usuários
  createUser: `/ISAPI/AccessControl/UserInfo/Record?format=json&devIndex=${hikvisionConfig.deviceIndex}`,
  updateUser: `/ISAPI/AccessControl/UserInfo/Modify?format=json&devIndex=${hikvisionConfig.deviceIndex}`,
  deleteUser: `/ISAPI/AccessControl/UserInfoDetail/Delete?format=json&devIndex=${hikvisionConfig.deviceIndex}`,
  getUserList: `/ISAPI/AccessControl/UserInfo/Search?format=json&devIndex=${hikvisionConfig.deviceIndex}`,
  
  // Gestão de dados faciais
  addFaceData: `/ISAPI/Intelligent/FDLib/FaceDataRecord?format=json&devIndex=${hikvisionConfig.deviceIndex}`,
  updateFaceData: `/ISAPI/Intelligent/FDLib/FaceDataRecord/Modify?format=json&devIndex=${hikvisionConfig.deviceIndex}`,
  deleteFaceData: `/ISAPI/Intelligent/FDLib/FaceDataRecord/Delete?format=json&devIndex=${hikvisionConfig.deviceIndex}`,
  
  // Controle de acesso
  accessControl: `/ISAPI/AccessControl/RemoteControl/door/${hikvisionConfig.deviceIndex}`,
  
  // Logs de acesso
  accessLogs: `/ISAPI/AccessControl/AcsEvent?format=json&devIndex=${hikvisionConfig.deviceIndex}`,
  
  // Configurações de tempo
  timeConfig: `/ISAPI/AccessControl/WeekPlanCfg?format=json&devIndex=${hikvisionConfig.deviceIndex}`
};

// Configurações padrão para visitantes
export const hikvisionDefaults = {
  userType: 'normal', // Tipo de usuário padrão
  doorRight: '1', // Direito de acesso às portas
  userLevel: '3', // Nível de usuário (visitante)
  faceLibType: 'blackFD', // Tipo de biblioteca facial
  maxValidDays: 7, // Máximo de dias de validade
  defaultValidHours: 24 // Horas padrão de validade
};
