export default function BottomSheet({ title, subtitle, onClose, children, footer }) {
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="bottom-sheet" role="dialog">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div>
            <h2 className="sheet-title">{title}</h2>
            {subtitle && <p className="sheet-subtitle">{subtitle}</p>}
          </div>
          <button className="sheet-close" onClick={onClose}>✕</button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-footer">{footer}</div>}
      </div>
    </>
  );
}
