import axios from 'axios';
import logger from '../utils/logger.js';

export const scanNVD = async (packageName, version) => {
  try {
    if (!process.env.NVD_API_KEY) {
      logger.warn('NVD_API_KEY not configured, skipping NVD scan');
      return [];
    }

    const response = await axios.get(
      'https://services.nvd.nist.gov/rest/json/cves/2.0',
      {
        params: {
          keywordSearch: `${packageName} ${version}`,
          apiKey: process.env.NVD_API_KEY
        },
        timeout: 5000
      }
    );

    return response.data.vulnerabilities?.map(v => ({
      cve_id: v.cve.id,
      severity: v.cve.metrics?.cvssMetricV31?.[0]?.baseSeverity?.toLowerCase() || 'unknown',
      description: v.cve.descriptions?.[0]?.value,
      published_date: v.cve.published,
      source: 'NVD'
    })) || [];
  } catch (error) {
    logger.error('NVD scan error:', error.message);
    return [];
  }
};

export const scanGitHubAdvisory = async (packageName) => {
  try {
    if (!process.env.GITHUB_ACCESS_TOKEN) {
      logger.warn('GITHUB_ACCESS_TOKEN not configured');
      return [];
    }

    const query = `
      query {
        securityVulnerabilities(first: 10, package: "${packageName}", ecosystem: NPM) {
          nodes {
            vulnerability {
              id
              severity
              description
              publishedAt
            }
          }
        }
      }
    `;

    const response = await axios.post(
      'https://api.github.com/graphql',
      { query },
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );

    return response.data.data?.securityVulnerabilities?.nodes?.map(v => ({
      cve_id: v.vulnerability.id,
      severity: v.vulnerability.severity?.toLowerCase() || 'unknown',
      description: v.vulnerability.description,
      published_date: v.vulnerability.publishedAt,
      source: 'GitHub'
    })) || [];
  } catch (error) {
    logger.error('GitHub advisory scan error:', error.message);
    return [];
  }
};

export const mergeVulnerabilities = (vulnerabilities) => {
  const seen = new Set();
  return vulnerabilities.filter(v => {
    if (seen.has(v.cve_id)) return false;
    seen.add(v.cve_id);
    return true;
  });
};
