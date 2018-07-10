const path		= require('path');
const express	= require('express');

const router	= express.Router();

/* index. */
router.get('/', (req, res, next) => { res.sendFile('index.html', { root: path.join(__dirname, '../../views') }); });

module.exports = router;
