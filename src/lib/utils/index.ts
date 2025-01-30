// Export utility functions from a single entry point
export { formatCurrency } from './currency';
export { formatDate, getCurrentWeekDates } from './date';
export { cn } from './styles';

export const capitaliseFirstChar = (val: string):string =>{
    return val.charAt(0).toUpperCase() + val.slice(1);
}