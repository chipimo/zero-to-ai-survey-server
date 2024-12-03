import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function executeQuery<T>(method: 'get' | 'all' | 'run', query: string, params: any[]): Promise<T> {
  const db = await open({
    filename: './database.db',
    driver: sqlite3.Database
  });

  switch (method) {
    case 'get':
      return db.get(query, params) as T;
    case 'all':
      return db.all(query, params);
    case 'run':
      await db.run(query, params);
      return {} as T;
  }
}