export function expenseStatus(expense) {
  if (expense.shares.some(share => share.approved === false)) return 'Declined';
  return expense.shares.every(share => share.approved === true) ? 'Approved' : 'Pending';
}

export function summarizeExpenses(members, expenses) {
  const balances = new Map(members.map(member => [member.id, { ...member, paid: 0, share: 0 }]));
  const groups = new Map();
  let total = 0;

  for (const expense of expenses) {
    if (expenseStatus(expense) !== 'Approved') continue;
    total += expense.amount_paise;
    balances.get(expense.payer_id).paid += expense.amount_paise;
    const ids = expense.shares.map(share => share.user_id).sort();
    const key = ids.join(',');
    if (!groups.has(key)) groups.set(key, { ids, total: 0 });
    groups.get(key).total += expense.amount_paise;
  }

  for (const group of groups.values()) {
    const base = Math.floor(group.total / group.ids.length);
    const remainder = group.total % group.ids.length;
    group.ids.forEach((id, index) => {
      balances.get(id).share += base + (index < remainder ? 1 : 0);
    });
  }

  const rows = Array.from(balances.values(), member => ({
    ...member,
    difference: member.share - member.paid
  }));
  const debtors = rows.filter(row => row.difference > 0).map(row => ({ ...row, remaining: row.difference }));
  const creditors = rows.filter(row => row.difference < 0).map(row => ({ ...row, remaining: -row.difference }));
  const payments = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.remaining, creditor.remaining);
    payments.push({ from: debtor, to: creditor, amount });
    debtor.remaining -= amount;
    creditor.remaining -= amount;
    if (debtor.remaining === 0) debtorIndex++;
    if (creditor.remaining === 0) creditorIndex++;
  }

  return { total, rows, payments };
}

export function getRoommateInvite() {
  return new URLSearchParams(window.location.hash.slice(1)).get('roommate-invite');
}
