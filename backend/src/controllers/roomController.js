const { query } = require('../config/db');

async function createRoom(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, campus = 'HOA_LAC', addressOrBlock } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên phòng trọ / KTX',
        error: 'MISSING_NAME'
      });
    }

    // Check if user already in a room
    const checkMember = await query('SELECT room_id FROM room_members WHERE user_id = $1', [userId]);
    if (checkMember.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã thuộc một phòng trọ khác. Vui lòng rời phòng cũ trước khi tạo mới.',
        error: 'USER_ALREADY_IN_ROOM'
      });
    }

    // Create room
    const roomRes = await query(
      `INSERT INTO rooms (name, campus, address_or_block, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, campus, address_or_block AS "addressOrBlock", created_at AS "createdAt"`,
      [name.trim(), campus, addressOrBlock ? addressOrBlock.trim() : null, userId]
    );

    const room = roomRes.rows[0];

    // Add creator as ADMIN
    await query(
      `INSERT INTO room_members (room_id, user_id, role)
       VALUES ($1, $2, 'ADMIN')`,
      [room.id, userId]
    );

    return res.status(201).json({
      success: true,
      message: 'Tạo phòng thành công',
      data: {
        ...room,
        members: [
          {
            userId: req.user.id,
            fullName: req.user.fullName,
            studentId: req.user.studentId,
            role: 'ADMIN'
          }
        ]
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getMyRoom(req, res, next) {
  try {
    const userId = req.user.id;

    const memberRes = await query(
      `SELECT r.id, r.name, r.campus, r.address_or_block AS "addressOrBlock"
       FROM rooms r
       JOIN room_members rm ON rm.room_id = r.id
       WHERE rm.user_id = $1`,
      [userId]
    );

    if (memberRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bạn chưa tham gia phòng trọ nào',
        error: 'ROOM_NOT_FOUND'
      });
    }

    const room = memberRes.rows[0];

    // Fetch members
    const membersRes = await query(
      `SELECT u.id AS "userId", u.full_name AS "fullName", u.student_id AS "studentId", rm.role
       FROM room_members rm
       JOIN users u ON u.id = rm.user_id
       WHERE rm.room_id = $1
       ORDER BY rm.role ASC, rm.joined_at ASC`,
      [room.id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...room,
        members: membersRes.rows
      }
    });
  } catch (err) {
    next(err);
  }
}

async function addMember(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const roomId = parseInt(req.params.roomId, 10);
    const { studentEmail } = req.body;

    if (!studentEmail) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email sinh viên cần thêm vào phòng',
        error: 'MISSING_EMAIL'
      });
    }

    // Check if requester is in this room and is ADMIN
    const requesterRole = await query(
      `SELECT role FROM room_members WHERE room_id = $1 AND user_id = $2`,
      [roomId, currentUserId]
    );

    if (requesterRole.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không thuộc phòng trọ này',
        error: 'FORBIDDEN'
      });
    }

    if (requesterRole.rows[0].role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ trưởng phòng (ADMIN) mới có quyền thêm thành viên',
        error: 'FORBIDDEN_NOT_ADMIN'
      });
    }

    // Check target user
    const targetUser = await query(
      `SELECT id, email, full_name AS "fullName", student_id AS "studentId"
       FROM users WHERE email = $1`,
      [studentEmail.trim().toLowerCase()]
    );

    if (targetUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng với email này trong hệ thống',
        error: 'USER_NOT_FOUND'
      });
    }

    const userToAdd = targetUser.rows[0];

    // Check if user already in any room
    const userInRoom = await query(
      `SELECT room_id FROM room_members WHERE user_id = $1`,
      [userToAdd.id]
    );

    if (userInRoom.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Sinh viên này đã thuộc một phòng trọ khác',
        error: 'USER_ALREADY_IN_ROOM'
      });
    }

    await query(
      `INSERT INTO room_members (room_id, user_id, role)
       VALUES ($1, $2, 'MEMBER')`,
      [roomId, userToAdd.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Đã thêm thành viên vào phòng',
      data: {
        userId: userToAdd.id,
        fullName: userToAdd.fullName,
        studentId: userToAdd.studentId,
        role: 'MEMBER'
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createRoom,
  getMyRoom,
  addMember
};
