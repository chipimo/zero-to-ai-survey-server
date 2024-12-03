import { v4 as uuidv4 } from 'uuid';
import { Score, SurveyResponse, User } from './types';
import { executeQuery } from './executeQuery';

export const userQueries = {
  async create(user: Omit<User, 'id' | 'uuid' | 'scored' | 'createdDate'>): Promise<string> {
    const uuid = uuidv4();
    await executeQuery<void>(
      'run',
      `INSERT INTO users (uuid, fullName, email, company, role)
       VALUES (?, ?, ?, ?, ?)`,
      [uuid, user.fullName, user.email, user.company, user.role]
    );
    return uuid;
  },

  async getByEmail(email: string): Promise<User | undefined> {
    return executeQuery<User | undefined>(
      'get',
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
  },

  async getByUuid(uuid: string): Promise<User | undefined> {
    return executeQuery<User | undefined>(
      'get',
      'SELECT * FROM users WHERE uuid = ?',
      [uuid]
    );
  },

  async updateScored(uuid: string, scored: boolean): Promise<void> {
    await executeQuery<void>(
      'run',
      'UPDATE users SET scored = ? WHERE uuid = ?',
      [scored, uuid]
    );
  }
};

export const scoreQueries = {
  async create(userId: number, score: number): Promise<void> {
    await executeQuery<void>(
      'run',
      'INSERT INTO scores (userId, score) VALUES (?, ?)',
      [userId, score]
    );
  },

  async getByUserId(userId: number): Promise<Score | undefined> {
    return executeQuery<Score | undefined>(
      'get',
      'SELECT * FROM scores WHERE userId = ?',
      [userId]
    );
  },

  async getByUserUuid(uuid: string): Promise<Score | undefined> {
    return executeQuery<Score | undefined>(
      'get',
      `SELECT s.* FROM scores s
       JOIN users u ON u.id = s.userId
       WHERE u.uuid = ?`,
      [uuid]
    );
  }
};

export const surveyQueries = {
  async saveResponse(
    userId: number,
    questionId: number,
    answer: string
  ): Promise<void> {
    await executeQuery<void>(
      'run',
      `INSERT INTO survey_responses (userId, questionId, answer)
       VALUES (?, ?, ?)`,
      [userId, questionId, answer]
    );
  },

  async getUserResponses(userId: number): Promise<SurveyResponse[]> {
    return executeQuery<SurveyResponse[]>(
      'all',
      `SELECT * FROM survey_responses
       WHERE userId = ?
       ORDER BY questionId`,
      [userId]
    );
  },

  async getResponseByQuestion(
    userId: number,
    questionId: number
  ): Promise<SurveyResponse | undefined> {
    return executeQuery<SurveyResponse | undefined>(
      'get',
      `SELECT * FROM survey_responses
       WHERE userId = ? AND questionId = ?`,
      [userId, questionId]
    );
  }
};