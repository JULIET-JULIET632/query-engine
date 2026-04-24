const pool = require('../config/db');
const { parseQuery } = require('../utils/parser');

// ─────────────────────────────────────
// GET ALL PROFILES
// GET /api/profiles
// supports filtering, sorting, pagination
// ─────────────────────────────────────
const getAllProfiles = async (req, res) => {
  try {
    const {
      gender,
      age_group,
      country_id,
      min_age,
      max_age,
      min_gender_probability,
      min_country_probability,
      sort_by,
      order,
      page,
      limit
    } = req.query;

    // validate sort_by — only allow specific columns
    // this prevents someone injecting a malicious column name
    const allowedSortFields = ['age', 'created_at', 'gender_probability'];
    const allowedOrders = ['asc', 'desc'];

    if (sort_by && !allowedSortFields.includes(sort_by)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid query parameters'
      });
    }

    if (order && !allowedOrders.includes(order.toLowerCase())) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid query parameters'
      });
    }

    // pagination setup
    // parse to integer, use defaults if not provided
    const pageNum = parseInt(page) || 1;
    let limitNum = parseInt(limit) || 10;

    // max limit is 50 as per task requirements
    if (limitNum > 50) limitNum = 50;

    // offset tells the database how many records to skip
    // page 1 = skip 0, page 2 = skip 10, page 3 = skip 20
    const offset = (pageNum - 1) * limitNum;

    // build dynamic WHERE clause
    // we use an array of conditions and params
    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (gender) {
      conditions.push(`LOWER(gender) = $${paramCount++}`);
      params.push(gender.toLowerCase());
    }

    if (age_group) {
      conditions.push(`LOWER(age_group) = $${paramCount++}`);
      params.push(age_group.toLowerCase());
    }

    if (country_id) {
      conditions.push(`LOWER(country_id) = $${paramCount++}`);
      params.push(country_id.toLowerCase());
    }

    if (min_age) {
      conditions.push(`age >= $${paramCount++}`);
      params.push(parseInt(min_age));
    }

    if (max_age) {
      conditions.push(`age <= $${paramCount++}`);
      params.push(parseInt(max_age));
    }

    if (min_gender_probability) {
      conditions.push(`gender_probability >= $${paramCount++}`);
      params.push(parseFloat(min_gender_probability));
    }

    if (min_country_probability) {
      conditions.push(`country_probability >= $${paramCount++}`);
      params.push(parseFloat(min_country_probability));
    }

    // build the WHERE clause string
    // if no conditions just use empty string
    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // build sort clause
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortOrder = order && allowedOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'ASC';
    const orderClause = `ORDER BY ${sortField} ${sortOrder}`;

    // count total matching records for pagination metadata
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM profiles ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // fetch the actual data with limit and offset
    const dataResult = await pool.query(
      `SELECT * FROM profiles ${whereClause} ${orderClause} LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      [...params, limitNum, offset]
    );

    return res.status(200).json({
      status: 'success',
      page: pageNum,
      limit: limitNum,
      total,
      data: dataResult.rows
    });

  } catch (e) {
    return res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// ─────────────────────────────────────
// NATURAL LANGUAGE SEARCH
// GET /api/profiles/search
// ─────────────────────────────────────
const searchProfiles = async (req, res) => {
  try {
    const { q, page, limit } = req.query;

    // q is required
    if (!q || q.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Missing or empty query'
      });
    }

    // parse the plain english query into filters
    const filters = parseQuery(q);

    // if parser returned null it couldn't understand the query
    if (!filters) {
      return res.status(400).json({
        status: 'error',
        message: 'Unable to interpret query'
      });
    }

    // pagination
    const pageNum = parseInt(page) || 1;
    let limitNum = parseInt(limit) || 10;
    if (limitNum > 50) limitNum = 50;
    const offset = (pageNum - 1) * limitNum;

    // build WHERE clause from parsed filters
    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (filters.gender) {
      conditions.push(`LOWER(gender) = $${paramCount++}`);
      params.push(filters.gender.toLowerCase());
    }

    if (filters.age_group) {
      conditions.push(`LOWER(age_group) = $${paramCount++}`);
      params.push(filters.age_group.toLowerCase());
    }

    if (filters.country_id) {
      conditions.push(`LOWER(country_id) = $${paramCount++}`);
      params.push(filters.country_id.toLowerCase());
    }

    if (filters.min_age) {
      conditions.push(`age >= $${paramCount++}`);
      params.push(filters.min_age);
    }

    if (filters.max_age) {
      conditions.push(`age <= $${paramCount++}`);
      params.push(filters.max_age);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // count total
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM profiles ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // fetch data
    const dataResult = await pool.query(
      `SELECT * FROM profiles ${whereClause} ORDER BY created_at ASC LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      [...params, limitNum, offset]
    );

    return res.status(200).json({
      status: 'success',
      page: pageNum,
      limit: limitNum,
      total,
      data: dataResult.rows
    });

  } catch (e) {
    return res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

module.exports = { getAllProfiles, searchProfiles };