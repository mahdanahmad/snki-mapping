const path		= require('path');
const express	= require('express');

const router	= express.Router();

const map		= require('../controllers/map');
const analytics	= require('../controllers/analytics');

// map
router.get('/map', (req, res, next) => {
	map.index(req.query, (result) => { res.status(result.status_code).json(result); });
});
router.get('/location', (req, res, next) => {
	map.location(req.query, (result) => { res.status(result.status_code).json(result); });
});
router.get('/types', (req, res, next) => {
	map.types((result) => { res.status(result.status_code).json(result); });
});
router.get('/points', (req, res, next) => {
	map.points(req.query, (result) => { res.status(result.status_code).json(result); });
});

router.get('/distribution', (req, res, next) => {
	analytics.distribution(req.query, (result) => { res.status(result.status_code).json(result); })
});
router.get('/network', (req, res, next) => {
	analytics.network(req.query, (result) => { res.status(result.status_code).json(result); })
});
router.get('/population', (req, res, next) => {
	analytics.pupulation(req.query, (result) => { res.status(result.status_code).json(result); })
});
router.get('/proximity', (req, res, next) => {
	analytics.proximity(req.query, (result) => { res.status(result.status_code).json(result); })
});

module.exports = router;
