/**
 * Sinh URL VietQR động chuẩn Napas 247
 */
function generateVietQRUrl({ bankBin, bankAccount, accountName, amount, description }) {
    if (!bankBin || !bankAccount) {
        return null; // Thành viên chưa cập nhật thông tin ngân hàng
    }

    const cleanAmount = Math.round(Number(amount));
    const cleanInfo = encodeURIComponent(
        (description || 'Thanh toan tien phong VNU Living')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .slice(0, 50)
    );
    const cleanName = encodeURIComponent(accountName || '');

    return `https://img.vietqr.io/image/${bankBin}-${bankAccount}-compact2.png?amount=${cleanAmount}&addInfo=${cleanInfo}&accountName=${cleanName}`;
}

/**
 * Thuật toán Min-Cash-Flow rút gọn công nợ chéo xuống tối đa (N - 1) giao dịch
 * @param {Array<{userId, fullName, netBalance, bankBin, bankAccount}>} memberBalances
 */
function simplifyDebtsWithVietQR(memberBalances, roomName = 'Phong tro') {
    const debtors = [];   // Người đang nợ (netBalance < 0)
    const creditors = []; // Người được nhận tiền (netBalance > 0)

    for (const m of memberBalances) {
        const net = Math.round(Number(m.netBalance));
        if (net < -1) {
            debtors.push({ ...m, amount: Math.abs(net) });
        } else if (net > 1) {
            creditors.push({ ...m, amount: net });
        }
    }

    const transactions = [];

    while (debtors.length > 0 && creditors.length > 0) {
        // Sắp xếp giảm dần để khớp các khoản lớn nhất trước (Greedy Min-Cash-Flow)
        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        const debtor = debtors[0];
        const creditor = creditors[0];

        const settleAmount = Math.min(debtor.amount, creditor.amount);
        const transferNote = `${debtor.fullName} tra tien ${roomName}`;

        transactions.push({
            fromUser: {
                userId: debtor.userId,
                fullName: debtor.fullName
            },
            toUser: {
                userId: creditor.userId,
                fullName: creditor.fullName,
                bankBin: creditor.bankBin || null,
                bankAccount: creditor.bankAccount || null
            },
            amount: settleAmount,
            description: transferNote,
            vietQrUrl: generateVietQRUrl({
                bankBin: creditor.bankBin,
                bankAccount: creditor.bankAccount,
                accountName: creditor.fullName,
                amount: settleAmount,
                description: transferNote
            })
        });

        debtor.amount -= settleAmount;
        creditor.amount -= settleAmount;

        if (debtor.amount <= 1) debtors.shift();
        if (creditor.amount <= 1) creditors.shift();
    }

    return transactions;
}

module.exports = {
    generateVietQRUrl,
    simplifyDebtsWithVietQR
};