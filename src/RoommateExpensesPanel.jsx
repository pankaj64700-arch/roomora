import React, { useEffect, useRef, useState } from 'react';
import { supabase } from './lib/supabase';
import { expenseStatus, getRoommateInvite, summarizeExpenses } from './lib/roommateExpenses';
import './roommate-expenses.css';

const bucket = 'finance-receipts';
const receiptExtensions = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'video/mp4': 'mp4',
  'video/webm': 'webm'
};
const receiptTypes = Object.keys(receiptExtensions);
const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
const dateLabel = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'UTC' });
const formatMoney = paise => money.format(paise / 100);
const monthLabel = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const formatMonth = date => monthLabel.format(new Date(date));

async function rpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data;
}

export default function RoommateExpensesPanel({ user }) {
  const [rooms, setRooms] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [details, setDetails] = useState(null);
  const [invite, setInvite] = useState(getRoommateInvite);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const pendingExpense = useRef(null);

  function clearInvite() {
    const url = new URL(window.location.href);
    url.hash = '';
    window.history.replaceState(window.history.state, '', url);
    setInvite(null);
  }

  async function loadRooms(preferredId, month = null) {
    const list = await rpc('finance_list_rooms');
    const selected = list.some(room => room.id === preferredId) ? preferredId : list[0]?.id ?? '';
    const room = selected ? await rpc('finance_room_details', { p_room: selected, p_month: month }) : null;
    setRooms(list);
    setRoomId(selected);
    setDetails(room);
    return room;
  }

  async function run(action) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (failure) {
      setError(failure.code === 'PGRST202' ? 'Roommate Expenses is awaiting its database setup.' : failure.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    run(() => loadRooms(''));
  }, []);

  useEffect(() => {
    pendingExpense.current = null;
    setReceipt(null);
    setShowHistory(false);
    setShowExpenseForm(false);
  }, [roomId, details?.month]);

  useEffect(() => {
    if (!receipt) return undefined;
    return () => URL.revokeObjectURL(receipt.url);
  }, [receipt]);

  useEffect(() => {
    if (!details) return undefined;
    const delay = Date.parse(details.refresh_at) - Date.parse(details.server_now);
    const nextDay = Date.parse(`${details.today}T00:00:00+05:30`) + 86400000;
    const dailyDelay = nextDay - Date.parse(details.server_now);
    const expiry = Date.now() + Math.min(delay, dailyDelay);
    const refresh = () => {
      if (Date.now() >= expiry - 100 && delay <= dailyDelay) {
        setDetails(null);
        setReceipt(null);
        run(() => loadRooms(roomId));
      } else {
        run(() => loadRooms(roomId, details.month));
      }
    };
    const timer = window.setTimeout(refresh, Math.max(0, Math.min(delay, dailyDelay, 2147483647)));
    const resume = () => {
      if (!document.hidden && Date.now() >= expiry - 100) refresh();
    };
    document.addEventListener('visibilitychange', resume);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [details, roomId]);

  function createRoom(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = new FormData(form).get('name').trim();
    if (!name) return;
    run(async () => {
      const id = await rpc('finance_create_room', { p_name: name });
      form.reset();
      await loadRooms(id);
      setNotice('Room created. Copy your invitation link to bring in roommates.');
    });
  }

  function saveExpense(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = new FormData(form);
    const amount = input.get('amount');
    const file = input.get('receipt');
    const remark = input.get('remark').trim();
    if (!/^\d+(\.\d{1,2})?$/.test(amount) || !remark) {
      setError('Enter a remark and an amount with up to two decimal places.');
      return;
    }
    if (file.size && (!receiptTypes.includes(file.type) || file.size > 10485760)) {
      setError('Choose a JPG, PNG, WebP, PDF, MP4 or WebM file up to 10 MB.');
      return;
    }

    run(async () => {
      const attempt = pendingExpense.current ?? { id: crypto.randomUUID(), uploaded: false };
      pendingExpense.current = attempt;
      const path = file.size ? `${user.id}/${roomId}/${attempt.id}` : null;
      if (path && !attempt.uploaded) {
        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file);
        if (uploadError && ![uploadError.status, uploadError.statusCode].some(code => Number(code) === 409)) throw uploadError;
        attempt.uploaded = true;
      }
      await rpc('finance_add_expense', {
        p_id: attempt.id,
        p_room: roomId,
        p_amount_paise: Math.round(Number(amount) * 100),
        p_spent_on: input.get('date'),
        p_remark: remark,
        p_receipt_path: path
      });
      pendingExpense.current = null;
      form.reset();
      setShowExpenseForm(false);
      await loadRooms(roomId);
      setNotice('Expense sent to your roommates for approval.');
    });
  }

  function viewReceipt(path) {
    run(async () => {
      const { data, error: downloadError } = await supabase.storage.from(bucket).download(path);
      if (downloadError) throw downloadError;
      setReceipt({ url: URL.createObjectURL(data), type: data.type, path });
    });
  }

  function removeRoommate(member) {
    const leaving = member.id === user.id;
    const action = leaving ? 'Leave this room?' : `Remove ${member.name} from this room?`;
    if (!window.confirm(`${action} Approved expenses stay in the ledger. Pending expenses involving this roommate will be declined, and the invite link will change.`)) return;
    run(async () => {
      await rpc('finance_remove_member', { p_room: roomId, p_member: member.id });
      await loadRooms(leaving ? '' : roomId);
      setNotice(leaving ? 'You left the room.' : 'Roommate removed. The invitation link was replaced.');
    });
  }

  function deleteRoom() {
    const room = rooms.find(item => item.id === roomId);
    if (!window.confirm(`Permanently delete “${room.name}” and its expense history for everyone? Download any available statement first.`)) return;
    run(async () => {
      await rpc('finance_delete_room', { p_room: roomId });
      await loadRooms('');
      setNotice('Room deleted.');
    });
  }

  function endMonth() {
    if (!window.confirm(`End the ${formatMonth(details.month)} ledger for everyone? New entries and approvals will stop, and pending expenses will stay outside the final balances. The next ledger opens on the 1st.`)) return;
    run(async () => {
      await rpc('finance_close_month', { p_room: roomId, p_month: details.month });
      setShowExpenseForm(false);
      await loadRooms(roomId, details.month);
      setNotice('Month ended. The PDF statement is ready.');
    });
  }

  const names = new Map(details?.members.map(member => [member.id, member.id === user.id ? `${member.name} (you)` : member.name]));
  const closed = details && (details.closed || details.month !== details.current_month);
  const activeMembers = details?.members.filter(member => member.active !== false) ?? [];
  const visibleExpenses = details?.expenses.filter(expense =>
    showHistory ? (closed || expenseStatus(expense) !== 'Pending')
      : (!closed && expenseStatus(expense) === 'Pending')
  ) ?? [];
  const summary = details && summarizeExpenses(details.members, details.expenses);
  const inviteUrl = details?.invite_token && new URL(`/?view=expenses#roommate-invite=${details.invite_token}`, window.location.origin).href;

  return <div className="finance-workspace">
    {error && <p role="alert" className="finance-error">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {invite && <section className="dash-panel finance-panel">
      <h2>Roommate invitation</h2>
      <p>You’ll join using your signed-in RoomOra account.</p>
      <div className="finance-actions">
        <button type="button" disabled={busy} onClick={() => run(async () => {
          const id = await rpc('finance_join_room', { p_token: invite });
          await loadRooms(id);
          clearInvite();
          setNotice('You joined the room.');
        })}>Join room</button>
        <button type="button" disabled={busy} onClick={clearInvite}>Dismiss invitation</button>
      </div>
    </section>}
    {details && <>
      {!closed && <section className="dash-panel finance-panel">
        <div className="finance-actions finance-heading">
          <h2>Record an expense</h2>
          {!showExpenseForm && activeMembers.length >= 2 && <button type="button" disabled={busy}
            aria-expanded={false} onClick={() => setShowExpenseForm(true)}>Record expense</button>}
        </div>
        {activeMembers.length < 2 && <p>At least one other roommate must join before you can record shared expenses.</p>}
        {showExpenseForm && activeMembers.length >= 2 &&
          <form key={`${roomId}/${details.month}`} className="finance-form" onSubmit={saveExpense} onChange={() => { pendingExpense.current = null; }}>
            <fieldset disabled={busy}>
              <label>Amount (₹)<input name="amount" autoFocus type="number" inputMode="decimal" min="0.01" max="1000000" step="0.01" required/></label>
              <label>Expense date<input name="date" type="date" min={details.current_month} max={details.today} defaultValue={details.today} required/></label>
              <label>Remark<input name="remark" placeholder="e.g. Groceries for the flat" maxLength={240} required/></label>
              <label>Receipt (optional, up to 10 MB)<input name="receipt" type="file" accept={receiptTypes.join(',')}/></label>
              <div className="finance-actions">
                <button>Submit for approval</button>
                <button type="button" className="finance-secondary" onClick={() => {
                  pendingExpense.current = null;
                  setShowExpenseForm(false);
                }}>Cancel</button>
              </div>
            </fieldset>
          </form>}
      </section>}

      <section className="dash-panel finance-panel">
        <h2>Balances <span className="finance-balance-month">{formatMonth(details.month)}</span></h2>
        <label>Expense month
          <select disabled={busy} value={details.month} onChange={event => {
            const month = event.target.value;
            run(() => loadRooms(roomId, month));
          }}>
            <option value={details.current_month}>{formatMonth(details.current_month)} ({details.month === details.current_month && closed ? 'closed' : 'current month'})</option>
            {details.previous_month && <option value={details.previous_month}>{formatMonth(details.previous_month)} (closed)</option>}
          </select>
        </label>
        {inviteUrl && !closed && <div className="finance-actions"><button type="button" className="finance-danger"
          disabled={busy} onClick={endMonth}>End month</button></div>}
        {closed && <>
          <div className="finance-actions"><button type="button" disabled={busy} onClick={() => run(async () => {
            const requested = details.month;
            const latest = await loadRooms(roomId, requested);
            if (latest?.month !== requested || (!latest.closed && latest.month === latest.current_month)) {
              throw new Error('This statement is no longer available.');
            }
            const { downloadRoommateReport } = await import('./lib/roommateReport');
            downloadRoommateReport(rooms.find(room => room.id === roomId), latest);
          })}>Download monthly PDF</button></div>
        </>}
        <p>Approved total <strong>{formatMoney(summary.total)}</strong></p>
        <div className="finance-table">
          <table>
            <thead><tr><th scope="col">Roommate</th><th scope="col">Paid</th><th scope="col">Share</th><th scope="col">Balance</th></tr></thead>
            <tbody>{summary.rows.map(row => <tr key={row.id}>
              <th scope="row">{names.get(row.id)}{row.active === false && ' (left)'}</th><td>{formatMoney(row.paid)}</td><td>{formatMoney(row.share)}</td>
              <td>{row.difference === 0 ? 'Settled' : `${row.difference > 0 ? 'Pays' : 'Receives'} ${formatMoney(Math.abs(row.difference))}`}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="dash-panel finance-panel">
        <div className="finance-actions finance-heading">
          <h2>{closed || showHistory ? 'Expense history' : 'Pending expenses'}</h2>
          <button type="button" aria-expanded={showHistory} aria-controls="finance-expense-list"
            onClick={() => { setShowHistory(value => !value); setReceipt(null); }}>
            {showHistory ? 'Hide history' : 'History'}
          </button>
        </div>
        <div id="finance-expense-list" className="finance-expense-list">
        {visibleExpenses.length === 0 && (showHistory || !closed) &&
          <p>{showHistory ? 'No expense history yet.' : 'No expenses awaiting approval.'}</p>}
        {visibleExpenses.map(expense => {
          const status = expenseStatus(expense);
          const vote = expense.shares.find(share => share.user_id === user.id);
          const canReview = !closed && status === 'Pending' && vote?.approved === null;
          const waiting = expense.shares.filter(share => share.approved === null).map(share => names.get(share.user_id));
          return <article className="finance-expense" key={expense.id}>
            <div className="finance-actions finance-heading">
              <h3>{expense.remark}</h3><strong>{formatMoney(expense.amount_paise)}</strong>
            </div>
            <p>{dateLabel.format(new Date(expense.spent_on))} · {names.get(expense.payer_id)} · <strong>{status}</strong></p>
            {!closed && status === 'Pending' && <p>Awaiting approval from {waiting.join(', ')}</p>}
            <div className="finance-actions">
              {expense.receipt_path && <button type="button" disabled={busy} onClick={() => viewReceipt(expense.receipt_path)}>View receipt</button>}
              {canReview && [true, false].map(approve =>
                <button key={String(approve)} type="button" disabled={busy} onClick={() => run(async () => {
                  await rpc('finance_vote', { p_expense: expense.id, p_approve: approve });
                  await loadRooms(roomId);
                  setNotice(approve ? 'Your approval was recorded.' : 'Expense declined.');
                })}>{approve ? 'Approve' : 'Decline'}</button>)}
            </div>
            {receipt && receipt.path === expense.receipt_path && <div className="finance-receipt">
              {receipt.type.startsWith('image/') && <img src={receipt.url} alt="Expense receipt"/>}
              {receipt.type.startsWith('video/') && <video src={receipt.url} controls aria-label="Expense receipt"/>}
              <a href={receipt.url} download={`expense-receipt.${receiptExtensions[receipt.type] || 'bin'}`}>Download receipt</a>
              <button type="button" onClick={() => setReceipt(null)}>Close receipt</button>
            </div>}
          </article>;
        })}
        </div>
      </section>
    </>}
    <section className="dash-panel finance-panel">
      <h2>Your expense rooms</h2>
      {rooms?.length > 0 && <label>Open a room
        <select disabled={busy} value={roomId} onChange={event => {
          const id = event.target.value;
          run(async () => {
            await loadRooms(id);
          });
        }}>
          {rooms.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}
        </select>
      </label>}
      {!rooms && !error && <p role="status">Loading your rooms…</p>}
      <form className="finance-form" onSubmit={createRoom}>
        <label>New room name<input name="name" placeholder="e.g. Hostel Room 204" required maxLength={80}/></label>
        <button disabled={busy}>Create room</button>
      </form>
    </section>
    {details && (
      <section className="dash-panel finance-panel">
        <div className="finance-actions finance-heading">
          <h2>{rooms.find(room => room.id === roomId)?.name}</h2>
          <button type="button" disabled={busy} onClick={() => run(() => loadRooms(roomId, details.month))}>Refresh room</button>
        </div>
        <ul className="finance-members" aria-label="Roommates">
          {activeMembers.map(member => <li key={member.id}>
            <span>{names.get(member.id)}</span>
            {inviteUrl && member.id !== user.id && <button type="button" className="finance-danger" disabled={busy}
              aria-label={`Remove ${member.name}`} onClick={() => removeRoommate(member)}>Remove</button>}
          </li>)}
        </ul>
        {inviteUrl && <>
          <label>Room invitation link<input value={inviteUrl} readOnly onFocus={event => event.target.select()}/></label>
          <div className="finance-actions">
            <button type="button" disabled={busy} onClick={() => run(async () => {
              await navigator.clipboard.writeText(inviteUrl);
              setNotice('Invite link copied.');
            })}>Copy invite link</button>
            <button type="button" disabled={busy} onClick={() => run(async () => {
              await rpc('finance_rotate_invite', { p_room: roomId });
              await loadRooms(roomId);
              setNotice('Invitation link replaced.');
            })}>Replace invite link</button>
            <button type="button" className="finance-danger" disabled={busy} onClick={deleteRoom}>Delete room</button>
          </div>
        </>}
        {!inviteUrl && <div className="finance-actions">
          <button type="button" className="finance-danger" disabled={busy} onClick={() => removeRoommate({ id: user.id })}>Leave room</button>
        </div>}
      </section>
    )}
  </div>;
}
