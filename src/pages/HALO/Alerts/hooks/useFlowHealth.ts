import { useMemo } from 'react';
import { AlertFilter, Action, AlertFilterGroup } from '../../../../types/sensor';

export type { AlertFilter, Action, AlertFilterGroup };

export const useFlowHealth = (
    alertFilters: AlertFilter[],
    filterGroups: AlertFilterGroup[]
) => {
    return useMemo(() => {
        const now = new Date();
        // 0=Mon, 1=Tue ... 6=Sun
        const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1;
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const deadFilters = alertFilters.filter(f =>
            !f.actions || f.actions.length === 0
        );

        const overlappingFilters = alertFilters.filter((f, i) =>
            alertFilters.some((g, j) => i !== j &&
                f.alert_types?.some(t => g.alert_types?.includes(t)) &&
                f.area_ids?.some(a => g.area_ids?.includes(a))
            )
        );

        const silentFilters = alertFilters.filter(f =>
            (f.weekdays?.length ?? 0) > 0 && (
                !f.weekdays?.includes(currentDay) ||
                (f.start_time && currentTime < f.start_time) ||
                (f.end_time && currentTime > f.end_time)
            )
        );

        const allRecipients = alertFilters
            .flatMap(f => f.actions || [])
            .flatMap(a => {
                if (!a.recipients) return [];
                return a.recipients.map(r => (typeof r === 'object' ? r.id : r));
            });

        const duplicateRecipients = Array.from(new Set(
            allRecipients.filter((r, i) => allRecipients.indexOf(r) !== i)
        ));

        const orphanFilters = alertFilters.filter(f => {
            const groupMemberIds = filterGroups
                .flatMap(g => g.alert_filter_ids || g.alert_filters?.map(af => af.id) || []);
            return !groupMemberIds.includes(f.id);
        });

        const isHealthy =
            deadFilters.length === 0 &&
            overlappingFilters.length === 0 &&
            duplicateRecipients.length === 0;

        return {
            deadFilters,
            overlappingFilters,
            silentFilters,
            duplicateRecipients,
            orphanFilters,
            isHealthy,
            currentDay,
            currentTime,
        };
    }, [alertFilters, filterGroups]);
};
