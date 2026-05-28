import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isOverdue(task) {
  return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .dashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard…</div>;
  if (error) return <p className="error-msg">{error}</p>;
  if (!data) return null;

  const { summary, recentTasks, overdueTasks } = data;

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="value">{summary.projectCount}</div>
          <div className="label">Projects</div>
        </div>
        <div className="stat-card">
          <div className="value">{summary.totalTasks}</div>
          <div className="label">Total tasks</div>
        </div>
        <div className="stat-card">
          <div className="value">{summary.myAssignedTasks}</div>
          <div className="label">Assigned to me</div>
        </div>
        <div className="stat-card overdue">
          <div className="value">{summary.overdueCount}</div>
          <div className="label">Overdue</div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card">
          <div className="value">{summary.byStatus.TODO}</div>
          <div className="label">To Do</div>
        </div>
        <div className="stat-card">
          <div className="value">{summary.byStatus.IN_PROGRESS}</div>
          <div className="label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="value">{summary.byStatus.DONE}</div>
          <div className="label">Done</div>
        </div>
      </div>

      {overdueTasks.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            Overdue tasks
            <span className="badge badge-overdue" style={{ marginLeft: '0.5rem' }}>
              {overdueTasks.length}
            </span>
          </h2>
          <div className="card table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Assignee</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {overdueTasks.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link to={`/projects/${t.project.id}`}>{t.title}</Link>
                    </td>
                    <td>{t.project.name}</td>
                    <td>{t.assignee?.name || 'Unassigned'}</td>
                    <td>{formatDate(t.dueDate)}</td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Recent tasks</h2>
        {recentTasks.length === 0 ? (
          <div className="card empty">No tasks yet. Create a project and add tasks.</div>
        ) : (
          <div className="card table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Assignee</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link to={`/projects/${t.project.id}`}>{t.title}</Link>
                      {isOverdue(t) && (
                        <span className="badge badge-overdue" style={{ marginLeft: '0.5rem' }}>
                          Overdue
                        </span>
                      )}
                    </td>
                    <td>{t.project.name}</td>
                    <td>{t.assignee?.name || 'Unassigned'}</td>
                    <td>{formatDate(t.dueDate)}</td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
