export interface NavItem {
  href: string;
  icon: string;
  label: string;
  group?: string;
}

export const navItems: NavItem[] = [
  // Dashboard
  { href: '/',                        icon: 'fas fa-chart-bar',         label: 'Dashboard',                    group: 'Tableau de bord' },
  { href: '/vue-ensemble',            icon: 'fas fa-eye',               label: 'Aperçu Général',               group: 'Tableau de bord' },
  { href: '/kpi-indicateurs',         icon: 'fas fa-chart-pie',         label: 'KPI Indicateurs',              group: 'Tableau de bord' },
  // Monitoring
  { href: '/temps-reel',              icon: 'fas fa-broadcast-tower',   label: 'Temps Réel V2',                group: 'Monitoring' },
  { href: '/historique-alertes',      icon: 'fas fa-clock',             label: 'Historique des alertes',       group: 'Monitoring' },
  { href: '/historique-graphe',       icon: 'fas fa-chart-line',        label: 'Historique V2',                group: 'Monitoring' },
  // Prédiction
  { href: '/prediction',              icon: 'fas fa-trending-up',       label: 'Prédiction',                   group: 'Prédiction' },
  // Configuration
  { href: '/moteurs',                 icon: 'fas fa-cog',               label: 'Configuration moteurs',        group: 'Configuration' },
  { href: '/configurer-capteurs',     icon: 'fas fa-microchip',         label: 'Configurer Capteurs',          group: 'Configuration' },
  { href: '/alertes-moteurs',         icon: 'fas fa-bell',              label: 'Alertes moteurs',              group: 'Configuration' },
  // Administration
  { href: '/gestion-utilisateurs',    icon: 'fas fa-users',             label: 'Gestion utilisateurs',         group: 'Administration' },
  { href: '/gestion-modules',         icon: 'fas fa-th-large',          label: 'Gestion des modules',          group: 'Administration' },
  { href: '/journal-connexions',      icon: 'fas fa-sign-in-alt',       label: 'Journal connexions',           group: 'Administration' },
];

export interface KpiData {
  icon: string;
  label: string;
  value: string;
  unit?: string;
  chip: string;
  chipType: 'low' | 'mod' | 'high';
}

export const kpiData: KpiData[] = [
  { icon: '🏭', label: 'Moteurs surveillés', value: '12',   chip: 'Tous actifs',         chipType: 'low'  },
  { icon: '⚠️', label: 'Risque élevé',       value: '3',    unit: 'moteurs', chip: 'Intervention requise', chipType: 'high' },
  { icon: '📊', label: 'DI moyen du parc',   value: '0.37', chip: 'Modéré',              chipType: 'mod'  },
  { icon: '⏱️', label: 'RUL minimum',        value: '12',   unit: 'jours',   chip: 'M4 critique',          chipType: 'high' },
];

export interface MotorData {
  id: string;
  di: number;
  rul: number;
  risk: 'high' | 'mod' | 'low';
  recommendation: string;
}

export const motorData: MotorData[] = [
  { id:'M1',  di:0.82, rul:12,  risk:'high', recommendation:'Arrêt planifié immédiat' },
  { id:'M2',  di:0.71, rul:18,  risk:'high', recommendation:'Maintenance urgente J+7' },
  { id:'M3',  di:0.63, rul:25,  risk:'high', recommendation:'Inspection approfondie' },
  { id:'M4',  di:0.55, rul:35,  risk:'mod',  recommendation:'Surveillance renforcée' },
  { id:'M5',  di:0.48, rul:42,  risk:'mod',  recommendation:'Maintenance préventive J+30' },
  { id:'M6',  di:0.39, rul:58,  risk:'mod',  recommendation:'Contrôle mensuel' },
  { id:'M7',  di:0.28, rul:72,  risk:'low',  recommendation:'Opérationnel — surveillance standard' },
  { id:'M8',  di:0.22, rul:85,  risk:'low',  recommendation:'RAS' },
  { id:'M9',  di:0.17, rul:95,  risk:'low',  recommendation:'RAS' },
  { id:'M10', di:0.12, rul:110, risk:'low',  recommendation:'RAS' },
  { id:'M11', di:0.08, rul:125, risk:'low',  recommendation:'Excellent état' },
  { id:'M12', di:0.05, rul:150, risk:'low',  recommendation:'Excellent état' },
];
