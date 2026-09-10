import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user, login } = useAuth();
  const [overview, setOverview] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('settlements');

  const [auditForm, setAuditForm] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [ovRes, setRes, uRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/settlements'),
        api.get('/admin/users'),
      ]);
      setOverview(ovRes.data);
      setSettlements(setRes.data);
      setUsers(uRes.data);

      const initialForm = {};
      setRes.data.forEach((s) => {
        initialForm[s.id] = {
          confirmed_yield_value: s.fpo_yield_value || s.total_yield_value,
          platform_fee_pct: s.platform_fee_pct || 5,
        };
      });
      setAuditForm(initialForm);
    } catch (err) {
      console.error('Admin Dashboard fetch error:', err);
      const detail = err.response?.data?.error || err.message || 'Make sure you are logged in as an Admin.';
      setError(`Failed to load admin dashboard data (${detail})`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleFormChange = (settlementId, field, value) => {
    setAuditForm((prev) => ({
      ...prev,
      [settlementId]: {
        ...prev[settlementId],
        [field]: value,
      },
    }));
  };

  const handleApprove = async (settlementId) => {
    const form = auditForm[settlementId] || {};
    try {
      setProcessingId(settlementId);
      await api.post(`/admin/settlements/${settlementId}/approve`, {
        confirmed_yield_value: form.confirmed_yield_value,
        platform_fee_pct: form.platform_fee_pct,
      });
      alert('Settlement audit approved and payouts distributed to investors!');
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to approve settlement');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (settlementId) => {
    const reason = rejectionReason[settlementId] || 'Audit rejection: sale proof insufficient or unverified.';
    if (!window.confirm('Are you sure you want to reject this settlement request?')) return;

    try {
      setProcessingId(settlementId);
      await api.post(`/admin/settlements/${settlementId}/reject`, {
        rejection_reason: reason,
      });
      alert('Settlement proposal rejected.');
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to reject settlement');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="container"><p className="muted">Loading Admin Portal...</p></div>;
  if (error || user?.role !== 'admin') {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', borderTop: '4px solid var(--danger)' }}>
          <h2 style={{ color: 'var(--danger)', marginTop: 0 }}>🛡️ Admin Credentials Required</h2>
          <p className="muted">{error || 'You must be logged in as an Admin to access this audit dashboard.'}</p>
          <button
            className="btn"
            style={{ marginTop: '16px' }}
            onClick={async () => {
              try {
                await login('admin@krishishare.com', 'admin123');
                window.location.reload();
              } catch (e) {
                console.error(e);
              }
            }}
          >
            ⚡ Click Here to Instant Login as Admin
          </button>
        </div>
      </div>
    );
  }

  const pendingSettlements = settlements.filter((s) => s.status === 'pending');
  const pastSettlements = settlements.filter((s) => s.status !== 'pending');

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0 }}>🛡️ Third-Party Auditor & Admin Dashboard</h1>
          <p className="muted" style={{ margin: '4px 0 0 0' }}>
            Independent audit verification of FPO harvest sale values and platform oversight.
          </p>
        </div>
        <button onClick={fetchData} className="btn secondary">🔄 Refresh Data</button>
      </div>

      {overview && (
        <div className="stat-row" style={{ marginBottom: '28px' }}>
          <div className="stat-box" style={{ flex: '1 1 180px' }}>
            <div className="label">Total Capital Raised</div>
            <div className="value">₹{Number(overview.projects.total_raised_amount).toLocaleString('en-IN')}</div>
            <div className="muted" style={{ fontSize: '0.75rem' }}>Across {overview.projects.total_projects} Projects</div>
          </div>

          <div className="stat-box" style={{ flex: '1 1 180px', background: '#fff8e1', border: '1px solid #f0d97a' }}>
            <div className="label">Pending Audit Requests</div>
            <div className="value" style={{ color: '#b8860b' }}>{overview.projects.pending_settlements_count}</div>
            <div className="muted" style={{ fontSize: '0.75rem' }}>Requires Third-Party Signoff</div>
          </div>

          <div className="stat-box" style={{ flex: '1 1 180px' }}>
            <div className="label">Total Payouts Distributed</div>
            <div className="value" style={{ color: 'var(--green)' }}>₹{Number(overview.settlements.total_payouts_distributed).toLocaleString('en-IN')}</div>
            <div className="muted" style={{ fontSize: '0.75rem' }}>Platform Fees: ₹{Number(overview.settlements.total_platform_fees_collected).toLocaleString('en-IN')}</div>
          </div>

          <div className="stat-box" style={{ flex: '1 1 180px' }}>
            <div className="label">Platform Users</div>
            <div className="value">{overview.users.total_users}</div>
            <div className="muted" style={{ fontSize: '0.75rem' }}>FPOs: {overview.users.total_fpos} | Investors: {overview.users.total_investors}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid var(--border)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('settlements')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'settlements' ? '3px solid var(--green)' : 'none',
            fontWeight: activeTab === 'settlements' ? 'bold' : 'normal',
            color: activeTab === 'settlements' ? 'var(--green-dark)' : 'var(--muted)',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          🔍 Settlement Audit Queue ({pendingSettlements.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'users' ? '3px solid var(--green)' : 'none',
            fontWeight: activeTab === 'users' ? 'bold' : 'normal',
            color: activeTab === 'users' ? 'var(--green-dark)' : 'var(--muted)',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          👥 User Directory ({users.length})
        </button>
      </div>

      {activeTab === 'settlements' && (
        <div>
          <h2>Pending Settlement Audits</h2>
          {pendingSettlements.length === 0 ? (
            <div className="card">
              <p className="muted" style={{ margin: 0 }}>
                No pending settlement requests awaiting audit. All harvest sales are fully verified.
              </p>
            </div>
          ) : (
            pendingSettlements.map((s) => {
              const currentForm = auditForm[s.id] || {
                confirmed_yield_value: s.fpo_yield_value || s.total_yield_value,
                platform_fee_pct: 5,
              };
              const confirmedVal = Number(currentForm.confirmed_yield_value || 0);
              const feePct = Number(currentForm.platform_fee_pct || 5);
              const platformFee = confirmedVal * (feePct / 100);
              const distributable = confirmedVal - platformFee;

              return (
                <div key={s.id} className="card" style={{ borderLeft: '6px solid #b8860b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{s.project_title} ({s.crop_name})</h3>
                      <p className="muted" style={{ margin: '4px 0 0 0' }}>
                        FPO: <strong>{s.fpo_name}</strong> ({s.fpo_user_name} - {s.fpo_email})
                      </p>
                    </div>
                    <span className="status-pill" style={{ background: '#fff8e1', color: '#8a6d00', height: 'fit-content' }}>
                      Pending Audit
                    </span>
                  </div>

                  <div className="stat-row" style={{ margin: '16px 0' }}>
                    <div className="stat-box" style={{ background: '#f7f5ef' }}>
                      <div className="label">Capital Raised</div>
                      <div className="value">₹{Number(s.raised_amount).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="stat-box" style={{ background: '#f7f5ef' }}>
                      <div className="label">FPO Claimed Sale Value</div>
                      <div className="value">₹{Number(s.fpo_yield_value || s.total_yield_value).toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  <div style={{ background: '#f9fbf9', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--border)' }}>
                    <strong>FPO Sales Notes & Evidence:</strong>
                    <p style={{ margin: '4px 0 4px 0', fontSize: '0.9rem', color: 'var(--ink)' }}>
                      {s.notes || 'Harvest yield sold in local mandi market.'}
                    </p>
                    <div className="muted" style={{ fontSize: '0.8rem' }}>
                      Proof Document Ref: {s.proof_docs || 'FPO Self-Attestation Voucher'}
                    </div>
                  </div>

                  <div style={{ background: '#e8f3ec', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: 'var(--green-dark)' }}>Auditor Verification & Adjustment</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      <div>
                        <label>Confirmed Harvest Sale Value (₹)</label>
                        <input
                          type="number"
                          value={currentForm.confirmed_yield_value}
                          onChange={(e) => handleFormChange(s.id, 'confirmed_yield_value', e.target.value)}
                          placeholder="e.g. 600000"
                        />
                      </div>
                      <div>
                        <label>Platform Fee (%)</label>
                        <input
                          type="number"
                          value={currentForm.platform_fee_pct}
                          onChange={(e) => handleFormChange(s.id, 'platform_fee_pct', e.target.value)}
                          placeholder="5"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', marginTop: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      <span>Deducted Platform Fee: ₹{platformFee.toLocaleString('en-IN')}</span>
                      <span style={{ color: 'var(--green-dark)' }}>Distributable to Investors: ₹{distributable.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleApprove(s.id)}
                      disabled={processingId === s.id}
                      className="btn"
                    >
                      {processingId === s.id ? 'Processing...' : '✅ Approve & Execute Investor Payouts'}
                    </button>

                    <div style={{ display: 'flex', gap: '8px', flex: '1 1 300px' }}>
                      <input
                        type="text"
                        placeholder="Rejection reason if unverified..."
                        value={rejectionReason[s.id] || ''}
                        onChange={(e) => setRejectionReason({ ...rejectionReason, [s.id]: e.target.value })}
                        style={{ margin: 0, flex: 1 }}
                      />
                      <button
                        onClick={() => handleReject(s.id)}
                        disabled={processingId === s.id}
                        className="btn btn-danger"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {pastSettlements.length > 0 && (
            <div style={{ marginTop: '40px' }}>
              <h2>Past Audited Settlements ({pastSettlements.length})</h2>
              <table>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>FPO</th>
                    <th>Audit Status</th>
                    <th>Confirmed Sale</th>
                    <th>Platform Fee</th>
                    <th>Distributable</th>
                    <th>Reviewed By</th>
                  </tr>
                </thead>
                <tbody>
                  {pastSettlements.map((ps) => (
                    <tr key={ps.id}>
                      <td style={{ fontWeight: 'bold' }}>{ps.project_title} ({ps.crop_name})</td>
                      <td>{ps.fpo_name}</td>
                      <td>
                        <span className={`status-pill ${ps.status === 'approved' ? 'status-settled' : 'status-cancelled'}`}>
                          {ps.status}
                        </span>
                      </td>
                      <td>₹{Number(ps.total_yield_value).toLocaleString('en-IN')}</td>
                      <td>₹{Number(ps.platform_fee_amt).toLocaleString('en-IN')} ({ps.platform_fee_pct}%)</td>
                      <td>₹{Number(ps.distributable_amt).toLocaleString('en-IN')}</td>
                      <td>{ps.reviewer_name || 'System Admin'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <h2>Registered Platform Accounts ({users.length})</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>FPO Profile</th>
                <th>Wallet Balance</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td style={{ fontWeight: 'bold' }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className="badge" style={{ background: u.role === 'admin' ? '#b3261e' : u.role === 'fpo' ? '#256d3b' : '#2b3f8c' }}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.fpo_name ? `${u.fpo_name} (${u.fpo_region || 'N/A'})` : '—'}</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--green-dark)' }}>
                    ₹{Number(u.wallet_balance || 0).toLocaleString('en-IN')}
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
