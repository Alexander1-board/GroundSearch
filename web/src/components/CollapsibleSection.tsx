import { useState } from 'react';
import clsx from 'clsx';

interface Props { title: string; id: string; children: React.ReactNode; right?: React.ReactNode }

export default function CollapsibleSection({ title, id, children, right }: Props){
  const key = `ui:collapsed:${id}`;
  const [open, setOpen] = useState(() => localStorage.getItem(key) !== '1');
  const toggle = () => { const n = !open; setOpen(n); localStorage.setItem(key, n ? '0':'1'); };
  return (
    <section className="border rounded">
      <header className="flex justify-between items-center bg-gray-100 px-2 py-1 cursor-pointer" onClick={toggle} aria-expanded={open}>
        <h2 className="font-semibold">{title}</h2>
        <div className="flex items-center space-x-2">
          {right}
          <button onClick={toggle} aria-label="toggle" className="text-xs">{open?'▾':'▸'}</button>
        </div>
      </header>
      <div className={clsx(open? 'block':'hidden','p-2')}>{children}</div>
    </section>
  );
}
