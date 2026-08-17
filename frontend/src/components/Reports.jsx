import React from 'react';
import { Database, FileText } from 'lucide-react';

const Reports = ({ logs }) => {
  return (
    <div className="view-panel">
      <div className="view-header">
        <div>
          <h2>Reports & Audit Logs</h2>
          <p>Historical audit logging of control room dispatcher actions and override justifications.</p>
        </div>
      </div>

      <div className="dashboard-card" style={{ padding: '24px' }}>
        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="var(--accent-blue)" /> Dispatcher Action History Log
        </h3>

        {logs && logs.length > 0 ? (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Junction Name</th>
                  <th>Action</th>
                  <th>Manual Value</th>
                  <th>Justification / Operator Comments</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  let actionClass = "";
                  if (log.action === 'Accept') actionClass = "var(--color-green)";
                  else if (log.action === 'Modify') actionClass = "var(--accent-blue)";
                  else actionClass = "var(--color-red)";

                  return (
                    <tr key={log.log_id}>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{log.timestamp}</td>
                      <td><strong>{log.location_name}</strong> (ID: {log.location_id})</td>
                      <td>
                        <span style={{ color: actionClass, fontWeight: 700 }}>
                          {log.action.toUpperCase()}
                        </span>
                      </td>
                      <td>{log.value}</td>
                      <td>{log.comment || <span style={{ color: 'var(--text-muted)' }}>No notes provided</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '40px 0', textSub: 'center', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '13px' }}>
            No operator action logs available. Approve or modify recommended deployments in the Live Map or Deployments view to populate audit trails.
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
