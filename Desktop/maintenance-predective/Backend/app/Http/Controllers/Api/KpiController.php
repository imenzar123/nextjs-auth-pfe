<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class KpiController extends Controller
{
    private const MOIS_ABREGES = [
        1 => 'Jan', 2 => 'Fév', 3 => 'Mar', 4 => 'Avr', 5 => 'Mai', 6 => 'Juin',
        7 => 'Juil', 8 => 'Août', 9 => 'Sep', 10 => 'Oct', 11 => 'Nov', 12 => 'Déc',
    ];

    private const MOIS_COMPLETS = [
        1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril', 5 => 'Mai', 6 => 'Juin',
        7 => 'Juillet', 8 => 'Août', 9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre',
    ];

    /** Mois/années ayant au moins une prédiction enregistrée, triés chronologiquement croissant. */
    public function moisDisponibles(): JsonResponse
    {
        try {
            $rows = DB::select(<<<'SQL'
                SELECT YEAR(recorded_at) as annee, MONTH(recorded_at) as mois
                FROM motor_status_histories
                GROUP BY YEAR(recorded_at), MONTH(recorded_at)
                ORDER BY annee, mois
            SQL);

            return response()->json(array_map(fn ($r) => [
                'mois'  => (int) $r->mois,
                'annee' => (int) $r->annee,
                'label' => (self::MOIS_COMPLETS[(int) $r->mois] ?? (string) $r->mois) . ' ' . $r->annee,
            ], $rows));
        } catch (\Throwable $e) {
            Log::error('KpiController::moisDisponibles failed', ['error' => $e->getMessage()]);

            return response()->json([]);
        }
    }

    public function stats(Request $request): JsonResponse
    {
        $mois = (int) $request->query('mois', now()->month);
        $annee = (int) $request->query('annee', now()->year);
        if ($mois < 1 || $mois > 12) {
            $mois = now()->month;
        }
        if ($annee < 2000 || $annee > 2100) {
            $annee = now()->year;
        }

        [$prevMois, $prevAnnee] = $this->moisPrecedent($mois, $annee);

        try {
            $section1 = $this->section1($mois, $annee, $prevMois, $prevAnnee);
        } catch (\Throwable $e) {
            Log::error('KpiController::stats section1 failed', ['error' => $e->getMessage()]);
            $section1 = $this->section1Zero();
        }

        try {
            $section2 = $this->section2($mois, $annee);
        } catch (\Throwable $e) {
            Log::error('KpiController::stats section2 failed', ['error' => $e->getMessage()]);
            $section2 = $this->section2Zero();
        }

        try {
            $section3 = $this->section3($annee);
        } catch (\Throwable $e) {
            Log::error('KpiController::stats section3 failed', ['error' => $e->getMessage()]);
            $section3 = $this->section3Zero();
        }

        try {
            $section4 = $this->section4($mois, $annee);
        } catch (\Throwable $e) {
            Log::error('KpiController::stats section4 failed', ['error' => $e->getMessage()]);
            $section4 = $this->section4Zero();
        }

        try {
            $section5 = $this->section5($mois, $annee);
        } catch (\Throwable $e) {
            Log::error('KpiController::stats section5 failed', ['error' => $e->getMessage()]);
            $section5 = $this->section5Zero();
        }

        return response()->json([
            'periode' => [
                'mois'  => $mois,
                'annee' => $annee,
                'label' => (self::MOIS_COMPLETS[$mois] ?? (string) $mois) . ' ' . $annee,
            ],
            'section1' => $section1,
            'section2' => $section2,
            'section3' => $section3,
            'section4' => $section4,
            'section5' => $section5,
        ]);
    }

    private function moisPrecedent(int $mois, int $annee): array
    {
        return $mois === 1 ? [12, $annee - 1] : [$mois - 1, $annee];
    }

    /*
    |--------------------------------------------------------------------------
    | Section 1 — Vue globale du mois
    |--------------------------------------------------------------------------
    */

    private function section1(int $mois, int $annee, int $prevMois, int $prevAnnee): array
    {
        $current = $this->statusRatio($mois, $annee);
        $previous = $this->statusRatio($prevMois, $prevAnnee);
        $tendanceSante = $previous['total'] > 0 ? round($current['valeur'] - $previous['valeur'], 1) : null;

        $currentAnomalies = $this->anomaliesCount($mois, $annee);
        $previousAnomalies = $this->anomaliesCount($prevMois, $prevAnnee);
        $tendanceAnomalies = $previous['total'] > 0 ? ($currentAnomalies - $previousAnomalies) : null;

        $alertesResolues = (int) DB::table('alertes')
            ->where('statut', 'resolue')
            ->whereMonth('updated_at', $mois)
            ->whereYear('updated_at', $annee)
            ->count();
        $alertesResoluesPrev = (int) DB::table('alertes')
            ->where('statut', 'resolue')
            ->whereMonth('updated_at', $prevMois)
            ->whereYear('updated_at', $prevAnnee)
            ->count();
        $prevAlertesOntDesDonnees = DB::table('alertes')
            ->whereMonth('updated_at', $prevMois)
            ->whereYear('updated_at', $prevAnnee)
            ->exists();
        $tendanceAlertesResolues = $prevAlertesOntDesDonnees ? ($alertesResolues - $alertesResoluesPrev) : null;

        $consoRow = DB::selectOne(<<<'SQL'
            SELECT SUM(m.tension * sh.measured_value * m.cos_phi / 1000 * (1/60)) as total
            FROM sensor_histories sh
            JOIN sensors s ON s.id = sh.sensor_id
            JOIN motors m ON m.id = sh.motor_id
            WHERE s.type = 'courant' AND MONTH(sh.measured_at) = ? AND YEAR(sh.measured_at) = ?
        SQL, [$mois, $annee]);
        $consommation = $consoRow->total !== null ? round((float) $consoRow->total, 2) : 0.0;

        return [
            'sante_globale' => [
                'valeur'         => $current['valeur'],
                'unite'          => '%',
                'tendance'       => $tendanceSante,
                'label_tendance' => 'vs mois précédent',
            ],
            'anomalies_detectees' => [
                'valeur'         => $currentAnomalies,
                'tendance'       => $tendanceAnomalies,
                'label_tendance' => 'vs mois précédent',
            ],
            'alertes_resolues' => [
                'valeur'         => $alertesResolues,
                'tendance'       => $tendanceAlertesResolues,
                'label_tendance' => 'vs mois précédent',
            ],
            'consommation_kwh' => [
                'valeur'         => $consommation,
                'unite'          => 'kWh',
                'label_tendance' => 'Données en cours de collecte',
            ],
        ];
    }

    private function section1Zero(): array
    {
        return [
            'sante_globale'       => ['valeur' => 0, 'unite' => '%', 'tendance' => null, 'label_tendance' => 'vs mois précédent'],
            'anomalies_detectees' => ['valeur' => 0, 'tendance' => null, 'label_tendance' => 'vs mois précédent'],
            'alertes_resolues'    => ['valeur' => 0, 'tendance' => null, 'label_tendance' => 'vs mois précédent'],
            'consommation_kwh'    => ['valeur' => 0, 'unite' => 'kWh', 'label_tendance' => 'Données en cours de collecte'],
        ];
    }

    private function statusRatio(int $mois, int $annee): array
    {
        $row = DB::selectOne(
            "SELECT COUNT(*) as total, SUM(status = 'BON') as bon FROM motor_status_histories WHERE MONTH(recorded_at) = ? AND YEAR(recorded_at) = ?",
            [$mois, $annee]
        );
        $total = (int) $row->total;
        $bon = (int) $row->bon;

        return [
            'valeur' => $total > 0 ? round($bon * 100 / $total, 1) : 0.0,
            'total'  => $total,
        ];
    }

    /**
     * Transitions vers ATTENTION/CRITIQUE : LAG() est calculé sur tout l'historique du
     * moteur (pas seulement le mois demandé) pour détecter correctement une transition
     * survenue au tout début du mois par rapport au dernier statut de fin de mois précédent,
     * puis on filtre le résultat sur le mois cible dans la clause WHERE externe.
     */
    private function anomaliesCount(int $mois, int $annee): int
    {
        $row = DB::selectOne(<<<'SQL'
            SELECT COUNT(*) as nb FROM (
                SELECT motor_id, status, recorded_at,
                    LAG(status) OVER (PARTITION BY motor_id ORDER BY recorded_at) as prev_status
                FROM motor_status_histories
            ) t
            WHERE MONTH(recorded_at) = ? AND YEAR(recorded_at) = ?
              AND status IN ('ATTENTION', 'CRITIQUE')
              AND (prev_status IS NULL OR prev_status NOT IN ('ATTENTION', 'CRITIQUE'))
        SQL, [$mois, $annee]);

        return (int) $row->nb;
    }

    /*
    |--------------------------------------------------------------------------
    | Section 2 — Indicateurs opérationnels + parc
    |--------------------------------------------------------------------------
    */

    private function section2(int $mois, int $annee): array
    {
        $predictionsCount = (int) DB::table('motor_status_histories')
            ->whereMonth('recorded_at', $mois)->whereYear('recorded_at', $annee)->count();
        $alertesCount = (int) DB::table('alertes')
            ->whereMonth('created_at', $mois)->whereYear('created_at', $annee)->count();
        $tauxAlertes = $predictionsCount > 0 ? round($alertesCount / $predictionsCount * 100, 1) : 0.0;

        $diRow = DB::selectOne(
            "SELECT AVG(degradation_index) as avg_di FROM motor_status_histories WHERE MONTH(recorded_at) = ? AND YEAR(recorded_at) = ?",
            [$mois, $annee]
        );
        $diMoyen = $diRow->avg_di !== null ? round((float) $diRow->avg_di * 100, 1) : 0.0;

        $rulRow = DB::selectOne(
            "SELECT AVG(rul) as avg_rul FROM motor_status_histories WHERE MONTH(recorded_at) = ? AND YEAR(recorded_at) = ?",
            [$mois, $annee]
        );
        $rulMoyen = $rulRow->avg_rul !== null ? round((float) $rulRow->avg_rul / 60, 1) : 0.0;

        $interventionsMois = (int) DB::table('interventions')
            ->whereMonth('created_at', $mois)->whereYear('created_at', $annee)->count();

        $tachesEnAttente = (int) DB::table('taches')
            ->where('statut', 'a_faire')
            ->whereMonth('created_at', $mois)->whereYear('created_at', $annee)
            ->count();
        $tachesSoumises = (int) DB::table('taches')
            ->where('statut', 'soumise')
            ->whereMonth('created_at', $mois)->whereYear('created_at', $annee)
            ->count();

        $listeParc = DB::table('motors')
            ->select('id', 'nom', 'statut_actuel', 'di_actuel')
            ->whereNotNull('statut_actuel')
            ->orderByDesc('di_actuel')
            ->get()
            ->map(fn ($m) => [
                'motor_id' => (int) $m->id,
                'nom'      => $m->nom,
                'statut'   => $m->statut_actuel,
                'di'       => $m->di_actuel !== null ? round((float) $m->di_actuel, 4) : 0.0,
            ])
            ->all();

        return [
            'taux_alertes'        => ['valeur' => $tauxAlertes, 'unite' => '%'],
            'di_moyen'            => ['valeur' => $diMoyen, 'unite' => '%'],
            'rul_moyen'           => ['valeur' => $rulMoyen, 'unite' => 'heures'],
            'interventions_mois'  => ['valeur' => $interventionsMois],
            'taches_en_attente'   => ['valeur' => $tachesEnAttente],
            'taches_soumises'     => ['valeur' => $tachesSoumises],
            'liste_parc'          => $listeParc,
        ];
    }

    private function section2Zero(): array
    {
        return [
            'taux_alertes'       => ['valeur' => 0, 'unite' => '%'],
            'di_moyen'           => ['valeur' => 0, 'unite' => '%'],
            'rul_moyen'          => ['valeur' => 0, 'unite' => 'heures'],
            'interventions_mois' => ['valeur' => 0],
            'taches_en_attente'  => ['valeur' => 0],
            'taches_soumises'    => ['valeur' => 0],
            'liste_parc'         => [],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Section 3 — Historiques mensuels sur l'année sélectionnée
    |--------------------------------------------------------------------------
    */

    private function section3(int $annee): array
    {
        $santeMensuelle = DB::select(
            "SELECT MONTH(recorded_at) as mois, AVG(CASE WHEN status = 'BON' THEN 100 ELSE 0 END) as sante_pct
             FROM motor_status_histories WHERE YEAR(recorded_at) = ? GROUP BY MONTH(recorded_at) ORDER BY mois",
            [$annee]
        );
        $santeMensuelleArr = array_map(fn ($r) => [
            'mois'      => (int) $r->mois,
            'label'     => self::MOIS_ABREGES[(int) $r->mois] ?? (string) $r->mois,
            'sante_pct' => round((float) $r->sante_pct, 1),
        ], $santeMensuelle);

        $alertesParMois = collect(DB::select(
            "SELECT MONTH(created_at) as mois, COUNT(*) as nb FROM alertes WHERE YEAR(created_at) = ? GROUP BY MONTH(created_at)",
            [$annee]
        ))->keyBy('mois');

        $tachesSoumisesParMois = collect(DB::select(
            "SELECT MONTH(updated_at) as mois, COUNT(*) as nb FROM taches WHERE statut = 'soumise' AND YEAR(updated_at) = ? GROUP BY MONTH(updated_at)",
            [$annee]
        ))->keyBy('mois');

        $tachesEnAttenteParMois = collect(DB::select(
            "SELECT MONTH(created_at) as mois, COUNT(*) as nb FROM taches WHERE statut = 'a_faire' AND YEAR(created_at) = ? GROUP BY MONTH(created_at)",
            [$annee]
        ))->keyBy('mois');

        $moisPresents = collect()
            ->merge($alertesParMois->keys())
            ->merge($tachesSoumisesParMois->keys())
            ->merge($tachesEnAttenteParMois->keys())
            ->map(fn ($m) => (int) $m)
            ->unique()
            ->sort()
            ->values();

        $alertesTachesMois = $moisPresents->map(fn ($m) => [
            'mois'              => $m,
            'label'             => self::MOIS_ABREGES[$m] ?? (string) $m,
            'alertes_emises'    => (int) ($alertesParMois[$m]->nb ?? 0),
            'taches_soumises'   => (int) ($tachesSoumisesParMois[$m]->nb ?? 0),
            'taches_en_attente' => (int) ($tachesEnAttenteParMois[$m]->nb ?? 0),
        ])->all();

        return [
            'sante_mensuelle'     => $santeMensuelleArr,
            'alertes_taches_mois' => $alertesTachesMois,
        ];
    }

    private function section3Zero(): array
    {
        return [
            'sante_mensuelle'     => [],
            'alertes_taches_mois' => [],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Section 4 — État des paramètres capteurs
    |--------------------------------------------------------------------------
    */

    private function section4(int $mois, int $annee): array
    {
        $vibMoyRow = DB::selectOne(
            "SELECT AVG(sh.measured_value) as avg_val FROM sensor_histories sh
             JOIN sensors s ON s.id = sh.sensor_id
             WHERE s.type = 'vibration' AND MONTH(sh.measured_at) = ? AND YEAR(sh.measured_at) = ?",
            [$mois, $annee]
        );
        $vibSeuilRow = DB::selectOne("SELECT AVG(seuil_max) as avg_seuil FROM sensors WHERE type = 'vibration'");

        $tempMoyRow = DB::selectOne(
            "SELECT AVG(sh.measured_value) as avg_val FROM sensor_histories sh
             JOIN sensors s ON s.id = sh.sensor_id
             WHERE s.type = 'temperature' AND MONTH(sh.measured_at) = ? AND YEAR(sh.measured_at) = ?",
            [$mois, $annee]
        );
        $tempSeuilRow = DB::selectOne("SELECT AVG(seuil_max) as avg_seuil FROM sensors WHERE type = 'temperature'");

        $depRow = DB::selectOne(
            "SELECT COUNT(DISTINCT sensor_id) as nb FROM sensor_histories WHERE status = 'critique' AND MONTH(measured_at) = ? AND YEAR(measured_at) = ?",
            [$mois, $annee]
        );

        $premiereMoitie = DB::selectOne(
            "SELECT AVG(sh.measured_value) as avg_val FROM sensor_histories sh
             JOIN sensors s ON s.id = sh.sensor_id
             WHERE s.type = 'vibration' AND MONTH(sh.measured_at) = ? AND YEAR(sh.measured_at) = ? AND DAY(sh.measured_at) <= 15",
            [$mois, $annee]
        );
        $deuxiemeMoitie = DB::selectOne(
            "SELECT AVG(sh.measured_value) as avg_val FROM sensor_histories sh
             JOIN sensors s ON s.id = sh.sensor_id
             WHERE s.type = 'vibration' AND MONTH(sh.measured_at) = ? AND YEAR(sh.measured_at) = ? AND DAY(sh.measured_at) > 15",
            [$mois, $annee]
        );
        $avg1 = $premiereMoitie->avg_val !== null ? (float) $premiereMoitie->avg_val : 0.0;
        $avg2 = $deuxiemeMoitie->avg_val !== null ? (float) $deuxiemeMoitie->avg_val : 0.0;
        $deltaPct = $avg1 > 0 ? round(($avg2 - $avg1) / $avg1 * 100, 1) : 0.0;
        $tendanceLabel = match (true) {
            $deltaPct > 10  => 'En hausse',
            $deltaPct < -10 => 'En baisse',
            default         => 'Stable',
        };

        return [
            'vibration_moy' => [
                'valeur' => $vibMoyRow->avg_val !== null ? round((float) $vibMoyRow->avg_val, 3) : 0.0,
                'unite'  => 'mm/s',
                'seuil'  => $vibSeuilRow->avg_seuil !== null ? round((float) $vibSeuilRow->avg_seuil, 3) : 0.0,
            ],
            'temperature_moy' => [
                'valeur' => $tempMoyRow->avg_val !== null ? round((float) $tempMoyRow->avg_val, 1) : 0.0,
                'unite'  => '°C',
                'seuil'  => $tempSeuilRow->avg_seuil !== null ? round((float) $tempSeuilRow->avg_seuil, 1) : 0.0,
            ],
            'depassements_seuils' => ['valeur' => (int) $depRow->nb],
            'tendance_evolution'  => [
                'valeur'    => $tendanceLabel,
                'delta_pct' => $deltaPct,
            ],
        ];
    }

    private function section4Zero(): array
    {
        return [
            'vibration_moy'       => ['valeur' => 0, 'unite' => 'mm/s', 'seuil' => 0],
            'temperature_moy'     => ['valeur' => 0, 'unite' => '°C', 'seuil' => 0],
            'depassements_seuils' => ['valeur' => 0],
            'tendance_evolution'  => ['valeur' => 'Stable', 'delta_pct' => 0],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Section 5 — Maintenance
    |--------------------------------------------------------------------------
    */

    private function section5(int $mois, int $annee): array
    {
        $mttrRow = DB::selectOne(
            "SELECT AVG(duree_heures * 60 + duree_minutes) as avg_min FROM interventions WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?",
            [$mois, $annee]
        );
        $mttr = $mttrRow->avg_min !== null ? round((float) $mttrRow->avg_min / 60, 1) : 0.0;

        $moteursInspectesRow = DB::selectOne(<<<'SQL'
            SELECT COUNT(DISTINCT a.motor_id) as nb
            FROM interventions i
            JOIN taches t ON t.id = i.tache_id
            JOIN alertes a ON a.id = t.alerte_id
            WHERE MONTH(i.created_at) = ? AND YEAR(i.created_at) = ?
        SQL, [$mois, $annee]);

        $interventionsReussies = (int) DB::table('interventions')
            ->where('resultat', 'resolu')
            ->whereMonth('created_at', $mois)->whereYear('created_at', $annee)
            ->count();

        $coutRow = DB::selectOne(
            "SELECT SUM(cout_pieces) as total FROM interventions WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?",
            [$mois, $annee]
        );
        $cout = $coutRow->total !== null ? round((float) $coutRow->total, 2) : 0.0;

        return [
            'mttr_heures'             => ['valeur' => $mttr, 'unite' => 'h'],
            'moteurs_inspectes'       => ['valeur' => (int) $moteursInspectesRow->nb],
            'interventions_reussies'  => ['valeur' => $interventionsReussies],
            'cout_maintenance'        => ['valeur' => $cout, 'unite' => 'DT'],
        ];
    }

    private function section5Zero(): array
    {
        return [
            'mttr_heures'            => ['valeur' => 0, 'unite' => 'h'],
            'moteurs_inspectes'      => ['valeur' => 0],
            'interventions_reussies' => ['valeur' => 0],
            'cout_maintenance'       => ['valeur' => 0, 'unite' => 'DT'],
        ];
    }
}
