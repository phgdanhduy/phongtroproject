const roommateService = require('../services/roommateService');

async function getRoommates(req, res, next) {
  try {
    const { campus, faculty, cohort, dormBuilding, district, radiusKm } = req.query;
    const currentUserId = req.user ? req.user.id : null;
    const data = await roommateService.getRoommates({
      campus,
      faculty,
      cohort,
      dormBuilding,
      district,
      radiusKm,
      currentUserId
    });

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

async function createRequest(req, res, next) {
  try {
    const targetUserId = req.body.targetUserId || req.body.receiverId;
    const result = await roommateService.createRequest(req.user.id, {
      receiverId: targetUserId,
      message: req.body.message
    });

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (err) {
    next(err);
  }
}

async function getRequests(req, res, next) {
  try {
    const data = await roommateService.getRequests(req.user.id);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

async function respondRequest(req, res, next) {
  try {
    const requestId = parseInt(req.params.id, 10);
    const { action } = req.body;
    const result = await roommateService.respondRequest(req.user.id, requestId, action);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRoommates,
  createRequest,
  getRequests,
  respondRequest
};
