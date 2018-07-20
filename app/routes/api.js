const path		= require('path');
const express	= require('express');

const router	= express.Router();

const map		= require('../controllers/map');

// map
router.get('/map', (req, res, next) => {
	map.index(req.query, (result) => { res.status(result.status_code).json(result); });
});

module.exports = router;
