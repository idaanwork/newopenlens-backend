import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const seed = async (knex) => {
  const hashedPassword = await bcrypt.hash('password', 10);

  await knex('users').del();
  await knex('users').insert([
    {
      email: 'admin@openlens.local',
      password_hash: hashedPassword,
      name: 'Admin User',
      role: 'admin'
    },
    {
      email: 'user@openlens.local',
      password_hash: hashedPassword,
      name: 'Regular User',
      role: 'user'
    }
  ]);

  await knex('libraries').del();
  await knex('libraries').insert([
    {
      name: 'react',
      version: '18.2.0',
      purl: 'pkg:npm/react@18.2.0',
      license_declared: 'MIT',
      license_detected: 'MIT',
      vulnerability_count: 0,
      owner: 'facebook',
      environment: 'frontend'
    },
    {
      name: 'express',
      version: '4.18.2',
      purl: 'pkg:npm/express@4.18.2',
      license_declared: 'MIT',
      license_detected: 'MIT',
      vulnerability_count: 1,
      owner: 'tjholowaychuk',
      environment: 'backend'
    },
    {
      name: 'lodash',
      version: '4.17.21',
      purl: 'pkg:npm/lodash@4.17.21',
      license_declared: 'MIT',
      license_detected: 'MIT',
      vulnerability_count: 2,
      owner: 'jdalton',
      environment: 'shared'
    }
  ]);

  await knex('vulnerabilities').del();
  await knex('vulnerabilities').insert([
    {
      library_id: 2,
      cve_id: 'CVE-2023-1234',
      severity: 'medium',
      description: 'Sample vulnerability in express',
      published_date: '2023-01-15',
      fixed_in: '4.18.3'
    },
    {
      library_id: 3,
      cve_id: 'CVE-2023-5678',
      severity: 'high',
      description: 'Prototype pollution in lodash',
      published_date: '2023-02-10',
      fixed_in: '4.17.21'
    },
    {
      library_id: 3,
      cve_id: 'CVE-2023-9999',
      severity: 'low',
      description: 'Minor issue in lodash',
      published_date: '2023-03-01',
      fixed_in: ''
    }
  ]);
};
