const pool = require('../config/db');
const { parseQuery } = require('../utils/parser');

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

    const allowedSortFields = ['age', 'created_at', 'gender_probability'];
    const allowedOrders = ['asc', 'desc'];

    if (sort_by && !allowedSortFields.includes(sort_by)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid sort_by field. Allowed: age, created_at, gender_probability'
      });
    }

    if (order && !allowedOrders.includes(order.toLowerCase())) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid order. Allowed: asc, desc'
      });
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;

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

    if (min_age !== undefined && min_age !== '') {
      conditions.push(`age >= $${paramCount++}`);
      params.push(parseInt(min_age));
    }

    if (max_age !== undefined && max_age !== '') {
      conditions.push(`age <= $${paramCount++}`);
      params.push(parseInt(max_age));
    }

    if (min_gender_probability !== undefined && min_gender_probability !== '') {
      conditions.push(`gender_probability >= $${paramCount++}`);
      params.push(parseFloat(min_gender_probability));
    }

    if (min_country_probability !== undefined && min_country_probability !== '') {
      conditions.push(`country_probability >= $${paramCount++}`);
      params.push(parseFloat(min_country_probability));
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortOrder = order && allowedOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'ASC';
    const orderClause = `ORDER BY ${sortField} ${sortOrder}`;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM profiles ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limitNum);

    const dataResult = await pool.query(
      `SELECT * FROM profiles ${whereClause} ${orderClause} LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      [...params, limitNum, offset]
    );

    return res.status(200).json({
      status: 'success',
      data: dataResult.rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        total_pages: totalPages
      }
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

const searchProfiles = async (req, res) => {
  try {
    const { q, page, limit } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Missing or empty query'
      });
    }

    const filters = parseQuery(q);

    if (!filters) {
      return res.status(400).json({
        status: 'error',
        message: 'Unable to interpret query'
      });
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;

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

    if (filters.min_age !== undefined) {
      conditions.push(`age >= $${paramCount++}`);
      params.push(filters.min_age);
    }

    if (filters.max_age !== undefined) {
      conditions.push(`age <= $${paramCount++}`);
      params.push(filters.max_age);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM profiles ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limitNum);

    const dataResult = await pool.query(
      `SELECT * FROM profiles ${whereClause} ORDER BY created_at ASC LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      [...params, limitNum, offset]
    );

    return res.status(200).json({
      status: 'success',
      data: dataResult.rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        total_pages: totalPages
      }
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

module.exports = { getAllProfiles, searchProfiles };