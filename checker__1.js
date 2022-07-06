/**
 * Utility file
 */

const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const Logger = require('./logger');

const saltRounds = 10;

dotenv.config();

/**
 * Construct Success response
 *
 * @async
 * @function SuccessResponse
 * @param {object} - array of object
 * @returns {object} - array of object
 * @author dev-team
 */

const SuccessResponse = async data => {
  try {
    const success = Object.assign({
      status: 'success',
      statusCode: '200',
      data
    });
    return success;
  } catch (exc) {
    Logger.log('error', `Error in SuccessResponse in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Construct Error response
 *
 * @async
 * @function ErrorResponse
 * @param {object}
 * @returns {object}
 * @author dev-team
 */

const ErrorResponse = async data => {
  try {
    const error = Object.assign({
      status: 'error',
      statusCode: data.statusCode,
      data: data.response.body.message
    });
    return error;
  } catch (exc) {
    Logger.log('error', `Error in ErrorResponse in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Construct Error message response
 *
 * @async
 * @function ErrorResponseMessage
 * @param {object}
 * @returns {object}
 * @author dev-team
 */

const ErrorResponseMessage = async ({ reason }) => {
  try {
    const error = Object.assign({
      status: 'error',
      statusCode: reason.statusCode || 404,
      data: reason.message
    });
    return error;
  } catch (exc) {
    Logger.log('error', `Error in ErrorResponseMessage in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Construct Invalid response
 *
 * @async
 * @function InvalidResponse
 * @returns {object}
 * @author dev-team
 */

const InvalidResponse = async () => {
  try {
    const invalid = Object.assign({
      status: 'invalid',
      statusCode: '403',
      message: 'Token expired'
    });
    return invalid;
  } catch (exc) {
    Logger.log('error', `Error in InvalidResponse in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Construct Invalid token message
 *
 * @async
 * @function InvalidToken
 * @returns {object}
 * @author dev-team
 */

const InvalidToken = async () => {
  try {
    const invalid = Object.assign({
      status: 'invalid',
      statusCode: '403',
      message: 'Invalid token'
    });
    return invalid;
  } catch (exc) {
    Logger.log('error', `Error in InvalidToken in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Construct Invalid User message
 *
 * @async
 * @function InvalidUser
 * @returns {object}
 * @author dev-team
 */

const InvalidUser = async () => {
  try {
    const invalid = Object.assign({
      status: 'error',
      statusCode: '404',
      message: 'Not found'
    });
    return invalid;
  } catch (exc) {
    Logger.log('error', `Error in InvalidUser in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Construct Encrypted Password
 *
 * @async
 * @function EncryptPassword
 * @param {string}
 * @returns {string}
 * @author dev-team
 */

const EncryptPassword = async password => {
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
  } catch (exc) {
    Logger.log('error', `Error in EncryptPassword in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Get Decrypted Password
 *
 * @async
 * @function DecryptPassword
 * @param {string} - hash
 * @param {string} - password
 * @returns {object}
 * @author dev-team
 */

const DecryptPassword = async (hash, password) => {
  try {
    const match = await bcrypt.compare(password, hash);
    return match;
  } catch (exc) {
    Logger.log('error', `Error in DecryptPassword in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Check Signed token
 *
 * @async
 * @function SignToken
 * @param {string}
 * @returns {string}
 * @author dev-team
 */

const SignToken = async data => {
  try {
    const token = await jwt.sign(data, process.env.KEY, { expiresIn: '1h' });
    return token;
  } catch (exc) {
    Logger.log('error', `Error in SignToken in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Encrypt the Payload
 *
 * @async
 * @function EncryptPayload
 * @param {string}
 * @returns {string}
 * @author dev-team
 */

const EncryptPayload = async payload => {
  try {
    const encrypted = await jwt.sign(payload, process.env.KEY);
    return encrypted;
  } catch (exc) {
    Logger.log('error', `Error in EncryptPayload in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Decrypt the Payload
 *
 * @async
 * @function DecryptPayload
 * @param {string}
 * @returns {object}
 * @author dev-team
 */

const DecryptPayload = async token => {
  try {
    const decrypted = await jwt.verify(token, process.env.KEY);
    return decrypted;
  } catch (exc) {
    Logger.log('error', `Error in DecryptPayload in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

module.exports = {
  EncryptPassword,
  DecryptPassword,
  SignToken,
  SuccessResponse,
  ErrorResponse,
  InvalidResponse,
  InvalidToken,
  InvalidUser,
  ErrorResponseMessage,
  EncryptPayload,
  DecryptPayload
};
