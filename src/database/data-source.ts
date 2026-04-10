import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.RECUROX_POSTGRES_HOST,
  port: parseInt(process.env.RECUROX_POSTGRES_PORT || '5432', 10),
  username: process.env.RECUROX_POSTGRES_USER,
  password: process.env.RECUROX_POSTGRES_PASSWORD,
  database: process.env.RECUROX_POSTGRES_DB,
  logging: process.env.RECUROX_POSTGRES_LOGGING === 'true',
  synchronize: false,
  migrationsTableName: 'migrations',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  extra: {
    // Standard SSL config for cloud providers
    ssl: process.env.RECUROX_POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
