import { KpiData } from '@/services/navigationData';

interface KpiCardProps {
  data: KpiData;
}

export default function KpiCard({ data }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon">{data.icon}</div>
      <div>
        <div className="kpi-label">{data.label}</div>
        <div className="kpi-value">
          {data.value}
          {data.unit && <span> {data.unit}</span>}
        </div>
        <div className={`kpi-chip chip-${data.chipType}`}>{data.chip}</div>
      </div>
    </div>
  );
}
