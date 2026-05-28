import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import Modal from '../components/Modal';

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.projects
      .list()
      .then(({ projects }) => setProjects(projects))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { project } = await api.projects.create({ name, description });
      setShowModal(false);
      setName('');
      setDescription('');
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Projects</h1>
        <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
          New project
        </button>
      </div>

      {error && !showModal && <p className="error-msg">{error}</p>}
      {loading ? (
        <div className="loading">Loading projects…</div>
      ) : projects.length === 0 ? (
        <div className="card empty">
          No projects yet. Create your first project to get started.
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((p) => (
            <div
              key={p.id}
              className="card project-card"
              onClick={() => navigate(`/projects/${p.id}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/projects/${p.id}`)}
              role="button"
              tabIndex={0}
            >
              <h3>{p.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                {p.description || 'No description'}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className={`badge badge-${p.myRole?.toLowerCase()}`}>{p.myRole}</span>
                <span className="badge badge-member">{p._count.tasks} tasks</span>
                <span className="badge badge-member">{p.members.length} members</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="New project" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="label" htmlFor="proj-name">
                Name
              </label>
              <input
                id="proj-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="proj-desc">
                Description
              </label>
              <textarea
                id="proj-desc"
                className="textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
