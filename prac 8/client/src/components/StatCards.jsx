export default function StatCards({ stats }) {
  if (!stats) {
    return null;
  }

  return (
    <div className="stat-grid">
      <div className="stat-card">
        <div className="stat-label">Total students</div>
        <div className="stat-value">{stats.total}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Average GPA</div>
        <div className="stat-value">{stats.averageGpa.toFixed(2)}</div>
      </div>
      {stats.byCourse.map((course) => (
        <div className="stat-card" key={course.course}>
          <div className="stat-label">{course.course}</div>
          <div className="stat-value">{course.count}</div>
        </div>
      ))}
    </div>
  );
}
