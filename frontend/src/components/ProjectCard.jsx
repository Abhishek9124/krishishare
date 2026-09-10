import { Link } from 'react-router-dom';

export default function ProjectCard({ project }) {
  const pct = Math.min(100, (Number(project.raised_amount) / Number(project.target_amount)) * 100);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: '0 0 4px' }}>{project.title}</h3>
          <div className="muted">{project.crop_name} · {project.fpo_name} · {project.region || project.fpo_region || 'Region N/A'}</div>
        </div>
        <span className={`status-pill status-${project.status}`}>{project.status.replace('_', ' ')}</span>
      </div>

      <p style={{ fontSize: '0.9rem', margin: '10px 0' }}>
        {project.description ? project.description.slice(0, 120) : 'No description provided.'}
        {project.description && project.description.length > 120 ? '…' : ''}
      </p>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="muted" style={{ fontSize: '0.8rem' }}>
        ₹{Number(project.raised_amount).toLocaleString('en-IN')} raised of ₹{Number(project.target_amount).toLocaleString('en-IN')}
        {' '}({pct.toFixed(0)}%)
      </div>

      <div className="stat-row" style={{ margin: '12px 0' }}>
        <div className="stat-box">
          <div className="label">Expected Return</div>
          <div className="value">{project.expected_return_pct}%</div>
        </div>
        <div className="stat-box">
          <div className="label">Duration</div>
          <div className="value">{project.duration_days}d</div>
        </div>
      </div>

      <Link to={`/projects/${project.id}`}>
        <button className="btn secondary">View details</button>
      </Link>
    </div>
  );
}
