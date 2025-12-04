import logger from '../utils/logger.js';

const SPDX_LICENSES = new Set([
  'MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-2-Clause', 'BSD-3-Clause',
  'ISC', 'LGPL-2.1', 'LGPL-3.0', 'MPL-2.0', 'AGPL-3.0'
]);

export const detectLicense = (declared, packageJson = {}) => {
  if (!declared) {
    return detectFromPackageJson(packageJson);
  }

  const normalized = normalizeLicense(declared);
  if (SPDX_LICENSES.has(normalized)) {
    return normalized;
  }

  return declared;
};

export const normalizeLicense = (license) => {
  if (!license) return '';

  const upper = license.toUpperCase().trim();

  if (upper.includes('MIT')) return 'MIT';
  if (upper.includes('APACHE')) return 'Apache-2.0';
  if (upper.includes('GPL')) return upper.includes('3') ? 'GPL-3.0' : 'GPL-2.0';
  if (upper.includes('BSD')) return upper.includes('3') ? 'BSD-3-Clause' : 'BSD-2-Clause';
  if (upper.includes('ISC')) return 'ISC';
  if (upper.includes('LGPL')) return upper.includes('3') ? 'LGPL-3.0' : 'LGPL-2.1';
  if (upper.includes('MPL')) return 'MPL-2.0';
  if (upper.includes('AGPL')) return 'AGPL-3.0';

  return license;
};

export const detectFromPackageJson = (packageJson) => {
  if (packageJson.license) {
    return normalizeLicense(packageJson.license);
  }

  if (Array.isArray(packageJson.licenses)) {
    const first = packageJson.licenses[0];
    const licenseType = first.type || first;
    return normalizeLicense(licenseType);
  }

  return 'Unknown';
};

export const isComplianceLicense = (license, allowlist = []) => {
  if (allowlist.length === 0) {
    return !['GPL-3.0', 'AGPL-3.0'].includes(license);
  }
  return allowlist.includes(license);
};
