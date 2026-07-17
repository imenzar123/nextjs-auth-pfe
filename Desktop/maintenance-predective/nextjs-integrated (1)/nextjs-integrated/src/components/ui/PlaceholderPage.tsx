import AppShell from '@/components/layout/AppShell';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: string;
}

export function PlaceholderPage({ title, description, icon }: PlaceholderPageProps) {
  return (
    <AppShell>
      <div className="dashboard">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: '1rem',
          color: 'var(--text-body)',
        }}>
          <div style={{
            width: '80px', height: '80px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, var(--accent-light), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '36px',
          }}>
            {icon}
          </div>
          <h1 style={{ color: 'var(--text-heading)', fontFamily: 'var(--sans)', fontSize: '1.5rem', margin: 0 }}>
            {title}
          </h1>
          <p style={{ maxWidth: '400px', textAlign: 'center', fontSize: '0.9rem' }}>
            {description}
          </p>
          <div style={{
            background: 'rgba(53,130,141,0.08)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '8px 20px',
            fontSize: '0.75rem',
            fontFamily: 'var(--mono)',
            color: 'var(--primary)',
          }}>
            Page en cours de développement
          </div>
        </div>
      </div>
    </AppShell>
  );
}
