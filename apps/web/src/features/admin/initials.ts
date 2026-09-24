export function initials(firstName: string, lastName: string) {
    return `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase() || '?';
}
