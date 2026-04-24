const express = require('express');
const router = express.Router();
const { getAllProfiles, searchProfiles } = require('../controllers/profileController');

// important: /search must come before /:id
// otherwise Express will treat "search" as an id
router.get('/search', searchProfiles);
router.get('/', getAllProfiles);

module.exports = router;