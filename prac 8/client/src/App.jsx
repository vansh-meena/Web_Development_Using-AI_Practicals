import { useCallback, useEffect, useState } from 'react';
import { listStudents, getStats, createStudent, updateStudent, deleteStudent } from './lib/api';
import StatCards from './components/StatCards';
import StudentForm from './components/StudentForm';
import ConfirmDeleteDialog from './components/ConfirmDeleteDialog';

const COURSES = ['CSE', 'ECE', 'ME', 'CE'];

export default function App() {
  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [course, setCourse] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listResult, statsResult] = await Promise.all([
        listStudents({ search, course, page, limit: 10 }),
        getStats()
      ]);
      setStudents(listResult.data);
      setMeta(listResult.meta);
      setStats(statsResult);
      if (listResult.meta.total > 0 && listResult.data.length === 0) {
        setPage(1);
      }
    } catch (err) {
      setError(err.message || 'Could not load students. Is the API server running?');
    } finally {
      setLoading(false);
    }
  }, [search, course, page]);

  useEffect(() => {
    const timer = setTimeout(refresh, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [refresh, search]);

  function handleSearch(value) {
    setSearch(value);
    setPage(1);
  }

  function handleCourse(value) {
    setCourse(value);
    setPage(1);
  }

  async function handleCreate(data) {
    await createStudent(data);
    setFormOpen(false);
    setPage(1);
    await refresh();
  }

  async function handleUpdate(data) {
    await updateStudent(editing._id, data);
    setEditing(null);
    await refresh();
  }

  async function handleDelete() {
    await deleteStudent(deleting._id);
    setDeleting(null);
    await refresh();
  }

  const isFiltered = search.trim() !== '' || course !== '';

  return (
    <div className="app">
      <header className="app-header">
        <h1>Student Management</h1>
        <p>Browse, add, edit, and remove student records.</p>
      </header>

      <StatCards stats={stats} />

      {error && <div className="error-banner">{error}</div>}

      <div className="toolbar">
        <input
          className="search-input"
          type="search"
          placeholder="Search by name, roll number, or email…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          aria-label="Search students"
        />
        <select
          className="filter-select"
          value={course}
          onChange={(e) => handleCourse(e.target.value)}
          aria-label="Filter by course"
        >
          <option value="">All courses</option>
          {COURSES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button type="button" className="btn btn-primary" onClick={() => setFormOpen(true)}>
          Add student
        </button>
      </div>

      <div className="table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Roll No</th>
                <th>Email</th>
                <th>Course</th>
                <th>Year</th>
                <th>GPA</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="empty-state">Loading students…</td>
                </tr>
              )}

              {!loading && students.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <h3>{isFiltered ? 'No students match' : 'No students yet'}</h3>
                      <p>
                        {isFiltered
                          ? 'Try a different search term or course filter.'
                          : 'Click "Add student" to create the first record.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                students.map((student) => (
                  <tr key={student._id}>
                    <td>{student.name}</td>
                    <td>{student.rollNo}</td>
                    <td>{student.email}</td>
                    <td><span className="course-badge">{student.course}</span></td>
                    <td>{student.year}</td>
                    <td>{student.gpa.toFixed(2)}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setEditing(student)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeleting(student)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>
            Page {meta.page} of {Math.max(meta.pages, 1)} · {meta.total} student{meta.total === 1 ? '' : 's'}
          </span>
          <div className="page-controls">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={loading || meta.page <= 1}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={loading || meta.page >= meta.pages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {formOpen && (
        <StudentForm
          initial={null}
          onSubmit={handleCreate}
          onCancel={() => setFormOpen(false)}
        />
      )}

      {editing && (
        <StudentForm
          initial={editing}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      )}

      {deleting && (
        <ConfirmDeleteDialog
          student={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
