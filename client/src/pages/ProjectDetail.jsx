import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString();
}

function toInputDate(d) {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tab, setTab] = useState('tasks');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [taskModal, setTaskModal] = useState(null);
  const [memberModal, setMemberModal] = useState(false);
  const [filter, setFilter] = useState('all');

  const isAdmin = project?.myRole === 'ADMIN';

  const load = useCallback(() => {
    setLoading(true);
    api.projects
      .get(id)
      .then(({ project }) => setProject(project))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  const filteredTasks = (() => {
    if (!project?.tasks) return [];
    const now = new Date();
    if (filter === 'overdue') {
      return project.tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
      );
    }
    if (filter !== 'all') {
      return project.tasks.filter((t) => t.status === filter);
    }
    return project.tasks;
  })();

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await api.projects.delete(id);
      window.location.href = '/projects';
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return <div className="loading">Loading project…</div>;
  if (error && !project) return <p className="error-msg">{error}</p>;
  if (!project) return null;

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/projects" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            ← Projects
          </Link>
          <h1 style={{ marginTop: '0.35rem' }}>{project.name}</h1>
          {project.description && (
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>{project.description}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className={`badge badge-${project.myRole?.toLowerCase()}`}>{project.myRole}</span>
          {isAdmin && (
            <button type="button" className="btn btn-danger btn-sm" onClick={handleDeleteProject}>
              Delete project
            </button>
          )}
        </div>
      </div>

      <div className="tabs">
        <button
          type="button"
          className={`tab ${tab === 'tasks' ? 'active' : ''}`}
          onClick={() => setTab('tasks')}
        >
          Tasks
        </button>
        <button
          type="button"
          className={`tab ${tab === 'team' ? 'active' : ''}`}
          onClick={() => setTab('team')}
        >
          Team
        </button>
      </div>

      {error && <p className="error-msg" style={{ marginBottom: '1rem' }}>{error}</p>}

      {tab === 'tasks' && (
        <>
          <div className="page-header" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['all', 'TODO', 'IN_PROGRESS', 'DONE', 'overdue'].map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f === 'overdue' ? 'Overdue' : f.replace('_', ' ')}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setTaskModal({ mode: 'create' })}
            >
              Add task
            </button>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="card empty">No tasks match this filter.</div>
          ) : (
            <div className="card table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Assignee</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((t) => (
                    <tr key={t.id}>
                      <td>{t.title}</td>
                      <td>{t.assignee?.name || 'Unassigned'}</td>
                      <td>{formatDate(t.dueDate)}</td>
                      <td>
                        <StatusBadge status={t.status} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setTaskModal({ mode: 'edit', task: t })}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'team' && (
        <>
          {isAdmin && (
            <div className="page-header" style={{ marginBottom: '1rem' }}>
              <span />
              <button type="button" className="btn btn-primary" onClick={() => setMemberModal(true)}>
                Add member
              </button>
            </div>
          )}
          <div className="card table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {project.members.map((m) => (
                  <tr key={m.id}>
                    <td>{m.user.name}</td>
                    <td>{m.user.email}</td>
                    <td>
                      <span className={`badge badge-${m.role.toLowerCase()}`}>{m.role}</span>
                    </td>
                    {isAdmin && (
                      <td>
                        {m.userId !== user.id && (
                          <>
                            <select
                              className="select"
                              style={{ width: 'auto', display: 'inline-block', marginRight: '0.5rem' }}
                              value={m.role}
                              onChange={async (e) => {
                                try {
                                  await api.projects.updateMember(id, m.userId, {
                                    role: e.target.value,
                                  });
                                  load();
                                } catch (err) {
                                  setError(err.message);
                                }
                              }}
                            >
                              <option value="ADMIN">Admin</option>
                              <option value="MEMBER">Member</option>
                            </select>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={async () => {
                                if (!confirm(`Remove ${m.user.name}?`)) return;
                                try {
                                  await api.projects.removeMember(id, m.userId);
                                  load();
                                } catch (err) {
                                  setError(err.message);
                                }
                              }}
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {taskModal && (
        <TaskFormModal
          project={project}
          task={taskModal.task}
          mode={taskModal.mode}
          onClose={() => setTaskModal(null)}
          onSaved={() => {
            setTaskModal(null);
            load();
          }}
          onError={setError}
        />
      )}

      {memberModal && (
        <AddMemberModal
          projectId={id}
          onClose={() => setMemberModal(false)}
          onSaved={() => {
            setMemberModal(false);
            load();
          }}
          onError={setError}
        />
      )}
    </>
  );
}

function TaskFormModal({ project, task, mode, onClose, onSaved, onError }) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState(task?.status || 'TODO');
  const [dueDate, setDueDate] = useState(toInputDate(task?.dueDate));
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || '');
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState('');

  const members = project.members.map((m) => m.user);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setLocalError('');
    const body = {
      title,
      description: description || undefined,
      status,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      assigneeId: assigneeId || null,
    };
    try {
      if (mode === 'create') {
        await api.tasks.create(project.id, body);
      } else {
        await api.tasks.update(task.id, body);
      }
      onSaved();
    } catch (err) {
      setLocalError(err.message);
      onError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.tasks.delete(task.id);
      onSaved();
    } catch (err) {
      setLocalError(err.message);
    }
  };

  return (
    <Modal title={mode === 'create' ? 'New task' : 'Edit task'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="label">Description</label>
          <textarea
            className="textarea"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="label">Status</label>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>
        <div className="form-group">
          <label className="label">Due date</label>
          <input
            className="input"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="label">Assignee</label>
          <select
            className="select"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {members.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        {localError && <p className="error-msg">{localError}</p>}
        <div className="modal-actions">
          {mode === 'edit' && (
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              Delete
            </button>
          )}
          <span style={{ flex: 1 }} />
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AddMemberModal({ projectId, onClose, onSaved, onError }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setLocalError('');
    try {
      await api.projects.addMember(projectId, { email, role });
      onSaved();
    } catch (err) {
      setLocalError(err.message);
      onError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add team member" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label">User email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="They must already have an account"
          />
        </div>
        <div className="form-group">
          <label className="label">Role</label>
          <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        {localError && <p className="error-msg">{localError}</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            Add
          </button>
        </div>
      </form>
    </Modal>
  );
}
