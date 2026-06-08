const Notification = require('../models/Notification');
const sendResponse = require('../utils/apiResponse');

// GET /api/notifications  ?unread=true
exports.getMyNotifications = async (req, res) => {
  try {
    const filter = { recipient: req.user.id };
    if (req.query.unread === 'true') filter.isRead = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);
    const unreadCount = await Notification.countDocuments({ recipient: req.user.id, isRead: false });

    sendResponse(res, 200, true, 'Notifications fetched', { notifications, unreadCount });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// PUT /api/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notif) return sendResponse(res, 404, false, 'Notification not found');
    sendResponse(res, 200, true, 'Marked as read', notif);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// PUT /api/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true });
    sendResponse(res, 200, true, 'All notifications marked as read');
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    const deleted = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user.id });
    if (!deleted) return sendResponse(res, 404, false, 'Notification not found');
    sendResponse(res, 200, true, 'Notification deleted');
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};
