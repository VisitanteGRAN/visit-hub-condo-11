/**
 * Utilitários para normalização de texto
 * Usado para compatibilidade entre sistema web e HikCentral
 */

/**
 * Remove acentos e caracteres especiais de um texto
 * Converte para maiúsculo para padronização
 * 
 * @param text - Texto a ser normalizado
 * @returns Texto sem acentos e em maiúsculo
 * 
 * @example
 * normalizeText("José da Silva") // "JOSE DA SILVA"
 * normalizeText("María Fernández") // "MARIA FERNANDEZ"
 * normalizeText("João Paulo") // "JOAO PAULO"
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  
  return text
    .normalize('NFD') // Decompor caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remover marcas diacríticas (acentos)
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remover caracteres especiais, manter apenas letras, números e espaços
    .replace(/\s+/g, ' ') // Normalizar espaços múltiplos
    .trim() // Remover espaços das extremidades
    .toUpperCase(); // Converter para maiúsculo
}

/**
 * Normaliza nome para uso no HikCentral
 * Específico para nomes de moradores que serão buscados no sistema
 * 
 * @param name - Nome completo do morador
 * @returns Nome normalizado para busca no HikCentral
 * 
 * @example
 * normalizeName("José da Silva") // "JOSE DA SILVA"
 * normalizeName("Ana Lúcia Santos") // "ANA LUCIA SANTOS"
 */
export function normalizeName(name: string): string {
  return normalizeText(name);
}

/**
 * Normaliza texto mantendo a capitalização original
 * Usado quando queremos remover acentos mas manter a formatação
 * 
 * @param text - Texto a ser normalizado
 * @returns Texto sem acentos mantendo capitalização
 * 
 * @example
 * normalizeKeepCase("José da Silva") // "Jose da Silva"
 * normalizeKeepCase("María Fernández") // "Maria Fernandez"
 */
export function normalizeKeepCase(text: string): string {
  if (!text) return '';
  
  return text
    .normalize('NFD') // Decompor caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remover marcas diacríticas (acentos)
    .replace(/[^a-zA-Z0-9\s\-']/g, '') // Remover caracteres especiais, manter letras, números, espaços, hífen e apóstrofe
    .replace(/\s+/g, ' ') // Normalizar espaços múltiplos
    .trim(); // Remover espaços das extremidades
}

/**
 * Testa se dois nomes são equivalentes após normalização
 * Útil para comparar nomes com e sem acentos
 * 
 * @param name1 - Primeiro nome
 * @param name2 - Segundo nome
 * @returns true se os nomes são equivalentes
 * 
 * @example
 * areNamesEqual("José", "JOSE") // true
 * areNamesEqual("María", "Maria") // true
 * areNamesEqual("João", "Joao") // true
 */
export function areNamesEqual(name1: string, name2: string): boolean {
  return normalizeName(name1) === normalizeName(name2);
}
