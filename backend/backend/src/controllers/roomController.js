const roomService = require('../services/roomService');

async function createRoom(req, res, next) {
  try {
    const { name, campus, addressOrBlock } = req.body;
    const data = await roomService.createRoom(
      req.user.id,
      { name, campus, addressOrBlock },
      req.user
    );

    return res.status(201).json({
      success: true,
      message: 'Tạo phòng thành công',
      data
    });
  } catch (err) {
    next(err);
  }
}

async function getMyRoom(req, res, next) {
  try {
    const data = await roomService.getMyRoom(req.user.id);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

async function addMember(req, res, next) {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    const { studentEmail } = req.body;
    const result = await roomService.addMember(req.user.id, roomId, studentEmail);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (err) {
    next(err);
  }
}

async function updateRoom(req, res, next) {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    const { name, campus, addressOrBlock } = req.body;
    const data = await roomService.updateRoom(req.user.id, roomId, { name, campus, addressOrBlock });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông số phòng trọ thành công!',
      data
    });
  } catch (err) {
    next(err);
  }
}

async function deleteRoom(req, res, next) {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    const result = await roomService.deleteRoom(req.user.id, roomId);

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
}

async function leaveRoom(req, res, next) {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    const result = await roomService.leaveRoom(req.user.id, roomId);

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
}

async function getRoomInvitations(req, res, next) {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    const data = await roomService.getRoomInvitations(roomId);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createRoom,
  getMyRoom,
  updateRoom,
  addMember,
  deleteRoom,
  leaveRoom,
  getRoomInvitations
};
