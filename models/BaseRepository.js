const pool = require('../config/db');

class BaseRepository {
  constructor(table) {
    this.table = table;
  }

  async getAll() {
    const result = await pool.query(`SELECT * FROM ${this.table}`);
    return result.rows;
  }

  async getById(id, idField) {
    const result = await pool.query(
      `SELECT * FROM ${this.table} WHERE ${idField} = $1`,
      [id]
    );
    return result.rows[0];
  }

  async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);

    const fields = keys.join(", ");
    const params = keys.map((_, i) => `$${i + 1}`).join(", ");

    const result = await pool.query(
      `INSERT INTO ${this.table} (${fields}) VALUES (${params}) RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async update(id, data, idField = 'id') {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE ${this.table} SET ${setClause} WHERE ${idField} = $${keys.length + 1} RETURNING *`,
      values
    );
    return rows[0];
  }

  async remove(id, idField = 'id') {
    const { rows } = await pool.query(
      `DELETE FROM ${this.table} WHERE ${idField} = $1 RETURNING *`,
      [id]
    );
    return rows[0];
  }
}

module.exports = BaseRepository;
