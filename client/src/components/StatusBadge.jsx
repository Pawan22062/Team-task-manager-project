const LABELS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

export default function StatusBadge({ status }) {
  const cls = `badge badge-${status.toLowerCase()}`;
  return <span className={cls}>{LABELS[status] || status}</span>;
}
