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
      if (userInRoom.rows[0].room_id === roomId) {
        return res.status(400).json({
          success: false,
          message: 'Sinh viên này đã là thành viên trong phòng rồi',
          error: 'USER_ALREADY_MEMBER'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Sinh viên này hiện đã thuộc một phòng trọ khác',
        error: 'USER_ALREADY_IN_ROOM'
      });
    }

    // Check if pending invitation already exists
    const pendingCheck = await query(
      `SELECT id FROM roommate_requests WHERE receiver_id = $1 AND room_id = $2 AND status = 'PENDING'`,
      [userToAdd.id, roomId]
    );

    if (pendingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Đã gửi lời mời tham gia phòng tới sinh viên này trước đó, đang chờ bạn ấy phản hồi',
        error: 'INVITATION_ALREADY_PENDING'
      });
    }

    // Get room name
    const roomInfo = await query('SELECT name FROM rooms WHERE id = $1', [roomId]);
    const roomName = roomInfo.rows[0]?.name || 'phòng trọ';

    // Insert invitation request
    await query(
      `INSERT INTO roommate_requests (sender_id, receiver_id, room_id, message, status)
       VALUES ($1, $2, $3, $4, 'PENDING')`,
      [currentUserId, userToAdd.id, roomId, `Trưởng phòng mời bạn tham gia vào ${roomName}`]
    );

    return res.status(200).json({
      success: true,
      message: `Đã gửi lời mời tham gia phòng tới ${userToAdd.fullName} (${userToAdd.email}) thành công! Lời mời đã được chuyển tới mục "Lời mời đã nhận" của bạn ấy.`,
      data: {
        userId: userToAdd.id,
        fullName: userToAdd.fullName,
        studentId: userToAdd.studentId,
        status: 'PENDING'
      }
    });
  } catch (err) {
    next(err);
  }
}

async function deleteRoom(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const roomId = parseInt(req.params.roomId, 10);

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
        message: 'Chỉ trưởng phòng (ADMIN) mới có quyền giải tán/xóa phòng',
        error: 'FORBIDDEN_NOT_ADMIN'
      });
    }

    await query('DELETE FROM rooms WHERE id = $1', [roomId]);

    return res.status(200).json({
      success: true,
      message: 'Đã giải tán phòng trọ thành công'
    });
  } catch (err) {
    next(err);
  }
}

async function leaveRoom(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const roomId = parseInt(req.params.roomId, 10);

    const memberCheck = await query(
      `SELECT role FROM room_members WHERE room_id = $1 AND user_id = $2`,
      [roomId, currentUserId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không thuộc phòng trọ này',
        error: 'FORBIDDEN'
      });
    }

    const allMembers = await query(
      `SELECT user_id, role FROM room_members WHERE room_id = $1 ORDER BY joined_at ASC`,
      [roomId]
    );

    if (allMembers.rows.length <= 1) {
      // Thành viên duy nhất -> giải tán phòng luôn
      await query('DELETE FROM rooms WHERE id = $1', [roomId]);
      return res.status(200).json({
        success: true,
        message: 'Bạn là thành viên duy nhất, phòng đã được giải tán thành công'
      });
    }

    // Nếu là ADMIN nhưng phòng còn người khác -> chuyển quyền ADMIN cho người kế tiếp
    if (memberCheck.rows[0].role === 'ADMIN') {
      const nextAdmin = allMembers.rows.find(m => m.user_id !== currentUserId);
      if (nextAdmin) {
        await query(
          `UPDATE room_members SET role = 'ADMIN' WHERE room_id = $1 AND user_id = $2`,
          [roomId, nextAdmin.user_id]
        );
      }
    }

    // Xóa user khỏi phòng
    await query(
      `DELETE FROM room_members WHERE room_id = $1 AND user_id = $2`,
      [roomId, currentUserId]
    );

    return res.status(200).json({
      success: true,
      message: 'Đã rời khỏi phòng thành công'
    });
  } catch (err) {
    next(err);
  }
}

async function updateRoom(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const roomId = parseInt(req.params.roomId, 10);
    const { name, campus, addressOrBlock } = req.body;

    const requesterRole = await query(
      `SELECT role FROM room_members WHERE room_id = $1 AND user_id = $2`,
      [roomId, currentUserId]
    );

    if (requesterRole.rows.length === 0 || requesterRole.rows[0].role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ trưởng phòng (ADMIN) mới có quyền chỉnh sửa thông số phòng',
        error: 'FORBIDDEN_NOT_ADMIN'
      });
    }

    await query(
      `UPDATE rooms
       SET name = COALESCE($1, name),
           campus = COALESCE($2, campus),
           address_or_block = COALESCE($3, address_or_block)
       WHERE id = $4`,
      [name ? name.trim() : null, campus || null, addressOrBlock ? addressOrBlock.trim() : null, roomId]
    );

    const updated = await query(
      `SELECT id, name, campus, address_or_block AS "addressOrBlock" FROM rooms WHERE id = $1`,
      [roomId]
    );

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông số phòng trọ thành công!',
      data: updated.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

async function getRoomInvitations(req, res, next) {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    const resInvites = await query(
      `SELECT rr.id, rr.receiver_id AS "receiverId", rr.status, rr.created_at AS "createdAt",
              u.full_name AS "receiverName", u.email AS "receiverEmail", u.student_id AS "receiverStudentId"
       FROM roommate_requests rr
       JOIN users u ON u.id = rr.receiver_id
       WHERE rr.room_id = $1 AND rr.status = 'PENDING'
       ORDER BY rr.created_at DESC`,
      [roomId]
    );

    return res.status(200).json({
      success: true,
      data: resInvites.rows
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
