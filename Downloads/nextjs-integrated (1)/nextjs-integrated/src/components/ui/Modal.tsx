'use client';
import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  titleIcon?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  small?: boolean;
  deleteHeader?: boolean;
}

export default function Modal({ isOpen, onClose, title, titleIcon, children, footer, small, deleteHeader }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="custom-modal active">
      <div className="modal-overlay" onClick={onClose} />
      <div className={`modal-container${small ? ' modal-small' : ''}`}>
        <div className={`modal-header${deleteHeader ? ' delete-header' : ''}`}>
          <h3>
            {titleIcon && <i className={titleIcon} />}
            {title}
          </h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
