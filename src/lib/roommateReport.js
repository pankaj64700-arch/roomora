import { jsPDF } from 'jspdf';
import { expenseStatus, summarizeExpenses } from './roommateExpenses';

const currency = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const amount = paise => currency.format(paise / 100);
const monthLabel = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export function downloadRoommateReport(room, ledger) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 36;
  const width = pageWidth - 2 * margin;
  const summary = summarizeExpenses(ledger.members, ledger.expenses);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let y = margin;

  function prepare(text, available, size, bold) {
    const unicode = /[^\x20-\xff]/.test(text);
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`;
    const lines = unicode ? wrapUnicode(text, ctx, available) : pdf.splitTextToSize(text, available);
    return { unicode, lines, size, bold, lineHeight: Math.ceil(size * 1.2) };
  }

  function draw(text, x, top, available, align = 'left') {
    const { unicode, lines, size, bold, lineHeight } = text;
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    for (const [index, line] of lines.entries()) {
      const lineTop = top + index * lineHeight;
      if (!line) continue;
      if (unicode) {
        canvas.width = Math.ceil(available * 2);
        canvas.height = lineHeight * 2;
        ctx.scale(2, 2);
        ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.fillText(line, 0, lineHeight / 2);
        pdf.addImage(canvas, 'PNG', x, lineTop, canvas.width / 2, lineHeight, undefined, 'FAST');
      } else {
        pdf.text(line, align === 'right' ? x + available : x, lineTop + size, { align });
      }
    }
  }

  function newPage() {
    pdf.addPage();
    y = margin;
  }

  function heading(label, size = 14) {
    const text = prepare(label, width, size, true);
    draw(text, margin, y, width);
    y += text.lines.length * text.lineHeight + 6;
  }

  function table(title, headers, records, footer) {
    const pad = 4;
    const compact = (row, bold) => row.map(cell => ({
      ...cell, text: prepare(cell.label, cell.width - 2 * pad, 10, bold)
    }));
    const rowHeight = row => Math.max(...row.map(cell => Math.max(1, cell.text.lines.length) * cell.text.lineHeight)) + 2 * pad;
    const headerRows = headers.map(row => compact(row, true));
    const openingHeight = 28 + headerRows.reduce((total, row) => total + rowHeight(row), 0);
    function paint(row, fill) {
      const height = rowHeight(row);
      let x = margin;
      pdf.setDrawColor(181, 199, 193);
      for (const cell of row) {
        if (fill) pdf.setFillColor(...fill);
        pdf.rect(x, y, cell.width, height, fill ? 'FD' : 'S');
        draw(cell.text, x + pad, y + pad, cell.width - 2 * pad, cell.align);
        x += cell.width;
      }
      y += height;
    }
    function start(continued) {
      heading(continued ? `${title} (continued)` : title);
      headerRows.forEach(row => paint(row, [224, 239, 233]));
    }
    const body = records.map(row => compact(row, false));
    if (footer) body.push(compact(footer, true));
    if (y + openingHeight + (body[0] ? rowHeight(body[0]) : 0) > pageHeight - margin) newPage();
    start(false);
    body.forEach((row, index) => {
      if (y + rowHeight(row) > pageHeight - margin) {
        newPage();
        start(true);
      }
      paint(row, footer && index === body.length - 1 ? [224, 239, 233] : index % 2 ? [246, 250, 248] : null);
    });
    y += 13;
  }

  const cell = (label, width, align) => ({ label, width, align });
  heading('RoomOra monthly expense statement', 23);
  heading(room.name, 15);
  heading(`${monthLabel.format(new Date(ledger.month))} | India time | Amounts in INR`, 11);
  y += 10;

  const byDate = new Map();
  for (const expense of ledger.expenses) {
    if (!byDate.has(expense.spent_on)) byDate.set(expense.spent_on, new Map());
    const day = byDate.get(expense.spent_on);
    if (!day.has(expense.payer_id)) day.set(expense.payer_id, []);
    day.get(expense.payer_id).push(expense);
  }

  for (let i = 0; i < summary.rows.length; i += 3) {
    const roommates = summary.rows.slice(i, i + 3);
    const dateWidth = 84;
    const personWidth = (width - dateWidth) / roommates.length;
    const amountWidth = 76;
    const reasonWidth = personWidth - amountWidth;
    const rows = [];
    for (const date of [...byDate.keys()].sort()) {
      const daily = roommates.map(person => byDate.get(date).get(person.id) ?? []);
      const count = Math.max(...daily.map(entries => entries.length));
      for (let index = 0; index < count; index++) {
        rows.push([cell(index === 0 ? date.split('-').reverse().join('-') : '', dateWidth),
          ...daily.flatMap(entries => {
            const expense = entries[index];
            const status = expense && expenseStatus(expense);
            const reason = expense && status !== 'Approved' ? `${expense.remark} [${status}]` : expense?.remark;
            return [cell(reason ?? '', reasonWidth), cell(expense ? amount(expense.amount_paise) : '', amountWidth, 'right')];
          })]);
      }
    }
    if (!rows.length) rows.push([cell('No expenses recorded.', width)]);
    table('Expenses by date', [
      [cell('Date', dateWidth), ...roommates.map(person => cell(person.name, personWidth))],
      [cell('', dateWidth), ...roommates.flatMap(() => [cell('Cause / reason', reasonWidth), cell('Amount', amountWidth, 'right')])]
    ], rows, [cell('Approved total', dateWidth),
      ...roommates.flatMap(person => [cell('', reasonWidth), cell(amount(person.paid), amountWidth, 'right')])]);
  }

  const balanceCells = (name, paid, share, balance) => [
    cell(name, width - 420), cell(paid, 120, 'right'), cell(share, 120, 'right'), cell(balance, 180, 'right')
  ];
  table('Balances and per-head shares', [balanceCells('Roommate', 'Approved paid', 'Share', 'Balance')],
    summary.rows.map(row => balanceCells(row.name, amount(row.paid), amount(row.share), row.difference === 0
      ? 'Settled' : `${row.difference > 0 ? 'Pays' : 'Receives'} ${amount(Math.abs(row.difference))}`)),
    balanceCells('Grand total (approved)', amount(summary.total), amount(summary.total), ''));

  const paymentCells = (from, to, total) => [
    cell(from, (width - 130) / 2), cell(to, (width - 130) / 2), cell(total, 130, 'right')
  ];
  table('Suggested payments', [paymentCells('Pays', 'Receives', 'Amount')],
    summary.payments.length ? summary.payments.map(({ from, to, amount: total }) => paymentCells(from.name, to.name, amount(total)))
      : [[cell('No transfers due.', width)]]);

  for (let page = 1; page <= pdf.getNumberOfPages(); page++) {
    pdf.setPage(page);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(`${page} / ${pdf.getNumberOfPages()}`, pageWidth - margin, pageHeight - 17, { align: 'right' });
  }
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
