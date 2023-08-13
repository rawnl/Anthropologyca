const express = require('express');
const likeController = require('../controllers/likeController');

const router = express.Router();

router.route('/').post(likeController.setUserPostIds, likeController.likePost);
router.route('/:id').delete(likeController.unlikePost);

module.exports = router;
