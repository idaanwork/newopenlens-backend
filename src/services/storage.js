import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger.js';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export const saveFile = async (filename, buffer) => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const filepath = path.join(UPLOAD_DIR, filename);
    await fs.writeFile(filepath, buffer);
    logger.info(`File saved: ${filepath}`);
    return { key: filename, path: filepath };
  } catch (error) {
    logger.error('Error saving file:', error);
    throw error;
  }
};

export const readFile = async (filename) => {
  try {
    const filepath = path.join(UPLOAD_DIR, filename);
    const buffer = await fs.readFile(filepath);
    return buffer;
  } catch (error) {
    logger.error('Error reading file:', error);
    throw error;
  }
};

export const deleteFile = async (filename) => {
  try {
    const filepath = path.join(UPLOAD_DIR, filename);
    await fs.unlink(filepath);
    logger.info(`File deleted: ${filepath}`);
  } catch (error) {
    logger.error('Error deleting file:', error);
  }
};

export const parseCSV = (csvContent) => {
  const lines = csvContent.toString().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const rows = lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });

  return { headers, rows };
};

export const parseJSON = (jsonContent) => {
  try {
    const data = JSON.parse(jsonContent.toString());
    if (Array.isArray(data)) {
      return { rows: data };
    }
    if (data.rows) {
      return data;
    }
    return { rows: [data] };
  } catch (error) {
    logger.error('Error parsing JSON:', error);
    throw new Error('Invalid JSON format');
  }
};
