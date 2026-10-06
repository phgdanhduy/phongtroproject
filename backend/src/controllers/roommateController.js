const roommateService = require('../services/roommateService');

async function getRoommates(req, res, next) {
  try {
    const { campus, faculty, cohort } = req.query;
    const data = await roommateService.getRoommates({ campus, faculty, cohort });

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
    const result = await roommateService.createRequest(req.user.id, req.body);

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
