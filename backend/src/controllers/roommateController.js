const { query } = require('../config/db');

async function getRoommates(req, res, next) {
  try {
    const { campus, faculty, cohort } = req.query;

    let sql = `
      SELECT u.id AS "userId", u.full_name AS "fullName", u.student_id AS "studentId",
             p.faculty, p.cohort, p.campus, p.location_detail AS "locationDetail",
             p.budget, p.sleep_schedule AS "sleepSchedule", p.cleanliness,
             p.noise_level AS "noiseLevel", p.smoking, p.has_pet AS "hasPet", p.bio
      FROM users u
      JOIN profiles p ON p.user_id = u.id
      LEFT JOIN room_members rm ON rm.user_id = u.id
      WHERE rm.room_id IS NULL
    `;
    const params = [];

    if (campus) {
      params.push(campus);
      sql += ` AND p.campus = $${params.length}`;
    }

    if (faculty) {
      params.push(`%${faculty}%`);
      sql += ` AND p.faculty ILIKE $${params.length}`;
    }

    if (cohort) {
      params.push(cohort);
      sql += ` AND p.cohort = $${params.length}`;
    }

    sql += ` ORDER BY p.updated_at DESC LIMIT 50`;

    const result = await query(sql, params);

    const roommates = result.rows.map(row => ({
      userId: row.userId,
      fullName: row.fullName,
      studentId: row.studentId,
      faculty: row.faculty,
      cohort: row.cohort,
      campus: row.campus,
      locationDetail: row.locationDetail,
      budget: row.budget,
      habits: {
        sleepSchedule: row.sleepSchedule,
        cleanliness: row.cleanliness,
        noiseLevel: row.noiseLevel,
        smoking: row.smoking,
        hasPet: row.hasPet
      },
      bio: row.bio
    }));

    return res.status(200).json({
      success: true,
      data: roommates
    });
  } catch (err) {
    next(err);
  }
}

async function createRequest(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const { receiverId, message } = req.body;

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID người nhận lời mời (receiverId)',
        error: 'MISSING_RECEIVER_ID'
      });
    }

    const targetId = parseInt(receiverId, 10);
    if (targetId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể tự gửi lời mời ghép phòng cho chính mình',
        error: 'SELF_INVITATION'
      });
    }

    const receiverCheck = await query('SELECT id, full_name FROM users WHERE id = $1', [targetId]);
    if (receiverCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại',
        error: 'USER_NOT_FOUND'
      });
    }

    // Check if sender has a room
    const senderRoom = await query(
      'SELECT room_id, role FROM room_members WHERE user_id = $1',
      [currentUserId]
    );
    const roomId = senderRoom.rows.length > 0 ? senderRoom.rows[0].room_id : null;

    // Check if duplicate pending request exists
    const duplicateCheck = await query(
      `SELECT id FROM roommate_requests
       WHERE sender_id = $1 AND receiver_id = $2 AND status = 'PENDING'`,
      [currentUserId, targetId]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã gửi lời mời tới sinh viên này rồi, vui lòng chờ họ phản hồi!',
        error: 'REQUEST_ALREADY_PENDING'
      });
    }

    const insertRes = await query(
      `INSERT INTO roommate_requests (sender_id, receiver_id, room_id, message, status)
       VALUES ($1, $2, $3, $4, 'PENDING')
       RETURNING id, sender_id AS "senderId", receiver_id AS "receiverId", room_id AS "roomId", status, message, created_at AS "createdAt"`,
      [currentUserId, targetId, roomId, message ? message.trim() : null]
    );

    return res.status(201).json({
      success: true,
      message: `Đã gửi lời mời ghép phòng tới ${receiverCheck.rows[0].full_name} thành công!`,
      data: insertRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

async function getRequests(req, res, next) {
  try {
    const currentUserId = req.user.id;

    // Lời mời nhận được
    const receivedRes = await query(
      `SELECT rr.id, rr.status, rr.message, rr.created_at AS "createdAt",
              u.id AS "senderId", u.full_name AS "senderName", u.student_id AS "senderStudentId", u.email AS "senderEmail",
              p.faculty AS "senderFaculty", p.cohort AS "senderCohort", p.campus AS "senderCampus",
              COALESCE(r.id, cur_rm.room_id) AS "roomId",
              COALESCE(r.name, cur_r.name) AS "roomName"
       FROM roommate_requests rr
       JOIN users u ON u.id = rr.sender_id
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN rooms r ON r.id = rr.room_id
       LEFT JOIN room_members cur_rm ON (cur_rm.user_id = rr.receiver_id AND rr.status = 'ACCEPTED')
       LEFT JOIN rooms cur_r ON cur_r.id = cur_rm.room_id
       WHERE rr.receiver_id = $1
       ORDER BY rr.created_at DESC`,
      [currentUserId]
    );

    // Lời mời đã gửi đi
    const sentRes = await query(
      `SELECT rr.id, rr.status, rr.message, rr.created_at AS "createdAt",
              u.id AS "receiverId", u.full_name AS "receiverName", u.student_id AS "receiverStudentId", u.email AS "receiverEmail",
              p.faculty AS "receiverFaculty", p.cohort AS "receiverCohort", p.campus AS "receiverCampus",
              COALESCE(r.id, cur_rm.room_id) AS "roomId",
              COALESCE(r.name, cur_r.name) AS "roomName"
       FROM roommate_requests rr
       JOIN users u ON u.id = rr.receiver_id
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN rooms r ON r.id = rr.room_id
       LEFT JOIN room_members cur_rm ON (cur_rm.user_id = rr.sender_id AND rr.status = 'ACCEPTED')
       LEFT JOIN rooms cur_r ON cur_r.id = cur_rm.room_id
       WHERE rr.sender_id = $1
       ORDER BY rr.created_at DESC`,
      [currentUserId]
    );

    return res.status(200).json({
      success: true,
      data: {
        received: receivedRes.rows,
        sent: sentRes.rows
      }
    });
  } catch (err) {
    next(err);
  }
}

async function respondRequest(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const requestId = parseInt(req.params.id, 10);
    const { action } = req.body; // 'ACCEPT' or 'REJECT'

    if (!['ACCEPT', 'REJECT'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Hành động không hợp lệ. Vui lòng chọn ACCEPT hoặc REJECT',
        error: 'INVALID_ACTION'
      });
    }

    const reqCheck = await query(
      `SELECT id, sender_id, receiver_id, room_id, status FROM roommate_requests WHERE id = $1`,
      [requestId]
    );

    if (reqCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lời mời ghép phòng này',
        error: 'REQUEST_NOT_FOUND'
      });
    }

    const requestItem = reqCheck.rows[0];

    if (requestItem.receiver_id !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền phản hồi lời mời này',
        error: 'FORBIDDEN'
      });
    }

    if (requestItem.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Lời mời này đã được xử lý trước đó',
        error: 'ALREADY_HANDLED'
      });
    }

    if (action === 'REJECT') {
      await query(`UPDATE roommate_requests SET status = 'REJECTED' WHERE id = $1`, [requestId]);
      return res.status(200).json({
        success: true,
        message: 'Đã từ chối lời mời ghép phòng'
      });
    }

    // Action ACCEPT
    let finalRoomId = requestItem.room_id;

    // Kiểm tra xem receiver đã ở phòng nào chưa
    const receiverInRoom = await query('SELECT room_id FROM room_members WHERE user_id = $1', [currentUserId]);
    if (receiverInRoom.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã thuộc một phòng trọ khác. Vui lòng rời phòng cũ trước khi chấp nhận lời mời!',
        error: 'USER_ALREADY_IN_ROOM'
      });
    }

    if (finalRoomId) {
      // Trường hợp lời mời gắn với một phòng cụ thể
      await query(
        `INSERT INTO room_members (room_id, user_id, role)
         VALUES ($1, $2, 'MEMBER')
         ON CONFLICT (room_id, user_id) DO NOTHING`,
        [finalRoomId, currentUserId]
      );
    } else {
      // Trường hợp 2 bạn kết nối khi chưa có phòng
      const senderInRoom = await query('SELECT room_id FROM room_members WHERE user_id = $1', [requestItem.sender_id]);
      if (senderInRoom.rows.length > 0) {
        // Sender đã có phòng, thêm receiver vào phòng của sender
        finalRoomId = senderInRoom.rows[0].room_id;
        await query(
          `INSERT INTO room_members (room_id, user_id, role)
           VALUES ($1, $2, 'MEMBER')
           ON CONFLICT (room_id, user_id) DO NOTHING`,
          [finalRoomId, currentUserId]
        );
      } else {
        // CẢ 2 BẠN ĐỀU CHƯA CÓ PHÒNG -> TỰ ĐỘNG TẠO PHÒNG MỚI!
        const senderUser = await query('SELECT full_name FROM users WHERE id = $1', [requestItem.sender_id]);
        const receiverUser = await query('SELECT full_name FROM users WHERE id = $1', [currentUserId]);
        const senderProfile = await query('SELECT campus FROM profiles WHERE user_id = $1', [requestItem.sender_id]);

        const senderName = senderUser.rows[0]?.full_name || 'Bạn A';
        const receiverName = receiverUser.rows[0]?.full_name || 'Bạn B';
        const defaultCampus = senderProfile.rows[0]?.campus || 'HOA_LAC';
        const defaultRoomName = `Phòng ghép ${senderName} & ${receiverName}`;

        const newRoomRes = await query(
          `INSERT INTO rooms (name, campus, address_or_block, created_by)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [defaultRoomName, defaultCampus, 'Chưa cập nhật địa chỉ', requestItem.sender_id]
        );

        finalRoomId = newRoomRes.rows[0].id;

        // Sender làm ADMIN
        await query(
          `INSERT INTO room_members (room_id, user_id, role)
           VALUES ($1, $2, 'ADMIN')
           ON CONFLICT (room_id, user_id) DO NOTHING`,
          [finalRoomId, requestItem.sender_id]
        );

        // Receiver làm MEMBER
        await query(
          `INSERT INTO room_members (room_id, user_id, role)
           VALUES ($1, $2, 'MEMBER')
           ON CONFLICT (room_id, user_id) DO NOTHING`,
          [finalRoomId, currentUserId]
        );
      }
    }

    await query(`UPDATE roommate_requests SET status = 'ACCEPTED', room_id = $1 WHERE id = $2`, [finalRoomId, requestId]);

    return res.status(200).json({
      success: true,
      message: '🎉 Đã chấp nhận lời mời ghép phòng! Hệ thống đã tự động tạo phòng trọ chung. Bạn có thể vào "Phòng của tôi" để chỉnh sửa các thông số chi tiết bất kỳ lúc nào.',
      data: {
        roomId: finalRoomId
      }
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
