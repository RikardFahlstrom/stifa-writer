export default function WriteBar({ selectedCount, onWrite, writing }) {
  return (
    <div className="write-bar">
      <span className="write-bar-info">
        {selectedCount === 0 ? (
          'Select activities to update'
        ) : (
          <>
            <strong>{selectedCount}</strong>{' '}
            {selectedCount === 1 ? 'activity' : 'activities'} selected
          </>
        )}
      </span>
      <button
        className="btn-write"
        onClick={onWrite}
        disabled={selectedCount === 0 || writing}
      >
        {writing ? 'Writing…' : 'Write Stifa'}
      </button>
    </div>
  );
}
