import { useState } from 'react';
export default function ConfirmDeleteDialog({ student, onConfirm, onCancel }) {
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Confirm deletion">
        <h2>Delete student?</h2>
        <p>This will permanently remove the student record. This action cannot be undone.</p>

        {student && (
          <div className="confirm-student">
            <strong>{student.name}</strong>
            <br />
            {student.rollNo} · {student.email}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={deleting}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={handleConfirm} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete student'}
          </button>
        </div>
      </div>
    </div>
  );
}
