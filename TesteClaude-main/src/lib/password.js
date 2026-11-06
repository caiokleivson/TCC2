/**
 * src/lib/password.js
 *
 * Abstrai hashing e verificação de senha com bcrypt.
 * Senhas nunca armazenadas em texto puro (OWASP API2).
 *
 * Correção BUG-02: dummyHash agora é um hash bcrypt válido pré-computado,
 * garantindo que a comparação timing-safe não lança exceção.
 */

const bcrypt = require("bcrypt");
const config = require("../config");

const { saltRounds, dummyHash } = config.bcrypt;

/**
 * Gera o hash bcrypt de uma senha em texto puro.
 * @param {string} plain
 * @returns {Promise<string>}
 */
const hash = (plain) => bcrypt.hash(plain, saltRounds);

/**
 * Compara uma senha em texto puro com seu hash.
 * @param {string} plain
 * @param {string} hashed
 * @returns {Promise<boolean>}
 */
const verify = (plain, hashed) => bcrypt.compare(plain, hashed);

/**
 * Executa uma comparação bcrypt descartável para nivelar tempo de resposta
 * quando o usuário não existe — previne user enumeration por timing.
 * O dummyHash é um hash válido, portanto bcrypt não lança exceção.
 * @param {string} plain  A senha enviada pelo cliente
 * @returns {Promise<false>}  Sempre retorna false
 */
const timingSafeCompare = async (plain) => {
  await bcrypt.compare(plain, dummyHash);
  return false;
};

module.exports = { hash, verify, timingSafeCompare };
