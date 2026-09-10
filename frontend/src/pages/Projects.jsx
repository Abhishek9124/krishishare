import { useEffect, useState } from 'react';
import api from '../api';
import ProjectCard from '../components/ProjectCard';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/projects', { params: statusFilter ? { status: statusFilter } : {} })
      .then((res) => setProjects(res.data))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div className="container">
      <div className="disclaimer">
        Demo marketplace — crop project listings and investments here are simulated for
        demonstration purposes and do not involve real money, escrow accounts, or legal advances.
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Live crop projects</h2>
        <select style={{ width: 200, marginBottom: 0 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="open">Open for funding</option>
          <option value="funded">Funded</option>
          <option value="in_progress">In progress</option>
          <option value="harvested">Harvested</option>
          <option value="settled">Settled</option>
        </select>
      </div>

      {loading ? (
        <p className="muted">Loading projects…</p>
      ) : projects.length === 0 ? (
        <p className="muted">No projects found. Check back soon, or register as an FPO to list one.</p>
      ) : (
        <div className="grid">
          {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </div>
  );
}
