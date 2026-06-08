const express = require('express');
const router = express.Router();

const {
  getMyNotifications,
  markRead,
  markAllRead,
  deleteNotification,
} = require('../controllers/notification.controller');

const protect = require('../middlewares/auth.middleware');

router.use(protect);

router.get('/', getMyNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);
router.delete('/:id', deleteNotification);

module.exports = router;
