import { jsPDF } from 'jspdf';
import { expenseStatus, summarizeExpenses } from './roommateExpenses';

const currency = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const amount = paise => `INR ${currency.format(paise / 100)}`;

export function downloadRoommateReport(room, ledger) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const margin = 44;
  const bodyWidth = width - margin * 2;
  const summary = summarizeExpenses(ledger.members, ledger.expenses);
  const names = new Map(ledger.members.map(member => [member.id, member.name]));
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let y = margin;

  function write(text, size = 11, bold = false) {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    // Use the device's script fonts for names and remarks outside Latin-1.
    const unicode = /[^\x20-\xff]/.test(text);
    const scale = 2;
    const lineHeight = Math.ceil(size * 1.5);
    if (unicode) {
      canvas.width = Math.ceil(bodyWidth * scale);
      canvas.height = lineHeight * scale;
      ctx.scale(scale, scale);
      ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`;
      ctx.textBaseline = 'middle';
    }

    const lines = unicode ? wrapUnicode(text, ctx, bodyWidth) : pdf.splitTextToSize(text, bodyWidth);
    for (const line of lines) {
      if (y + lineHeight > height - margin) {
        pdf.addPage();
        y = margin;
      }
      if (unicode) {
        ctx.clearRect(0, 0, bodyWidth, lineHeight);
        ctx.fillText(line, 0, lineHeight / 2);
        pdf.addImage(canvas, 'PNG', margin, y, bodyWidth, lineHeight, undefined, 'FAST');
      } else {
        pdf.text(line, margin, y + size);
      }
      y += lineHeight;
    }
  }

  write('RoomOra monthly expense statement', 20, true);
  write(room.name, 15, true);
  write(`Ledger month: ${ledger.month.slice(0, 7)} (India time)`);
  write(`Approved total: ${amount(summary.total)}`, 12, true);
  write('Only approved expenses are included in the balances below.');
  y += 12;
  write('Roommate balances', 14, true);
  for (const row of summary.rows) {
    const balance = row.difference === 0 ? 'Settled' : `${row.difference > 0 ? 'Pays' : 'Receives'} ${amount(Math.abs(row.difference))}`;
    write(`${row.name}: Paid ${amount(row.paid)} | Share ${amount(row.share)} | ${balance}`);
  }

  y += 12;
  write('Suggested payments', 14, true);
  for (const payment of summary.payments) write(`${payment.from.name} pays ${payment.to.name} ${amount(payment.amount)}`);
  if (!summary.payments.length) write('No transfers due.');

  y += 12;
  write('Expense history', 14, true);
  for (const expense of ledger.expenses) {
    write(`${expense.spent_on} | ${names.get(expense.payer_id)} | ${amount(expense.amount_paise)} | ${expenseStatus(expense)}`);
    write(expense.remark);
    y += 6;
  }
  if (!ledger.expenses.length) write('No expenses recorded.');
  pdf.save(`roomora-expenses-${ledger.month.slice(0, 7)}.pdf`);
}

function wrapUnicode(text, context, width) {
  const lines = [];
  let line = '';
  const segments = Intl.Segmenter
    ? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), item => item.segment)
    : Array.from(text);
  for (const segment of segments) {
    if (line && context.measureText(line + segment).width > width) {
      lines.push(line);
      line = '';
    }
    line += segment;
  }
  lines.push(line);
  return lines;
}
