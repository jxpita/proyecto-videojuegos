export interface MissileState {
    gray: number,
    red: number,
    green: number,
    blue: number,
    yellow: number,
    winner?: string,
    loser?: string,
    isReadyToStarted?: boolean,
    hasStopped?: boolean,
    hasStarted?: boolean,
    hasFinished?: boolean,
    [key: string]: number | string | boolean | undefined; // Firma de índice
}