/**
 * Shared Ticket Components
 * 
 * These components follow the Component Contract defined in COMPONENT_CONTRACT.md
 * Use these standardized components across all dashboards
 */

export { default as TicketListItem } from './TicketListItem';
export type { TicketListItemProps } from './TicketListItem';

export { default as TicketCard } from './TicketCard';

export { default as ActiveTicketCard, NoActiveTicketCard } from './ActiveTicketCard';
