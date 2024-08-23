// User.ts
export interface User {
    id: string;
    username: string;
    room: string;
    isAdmin: boolean;
    info: {
        teamColor: string;
        taps: number;
        titulo?: string;
        descripcion?: string;
        link?: string;
        playersCount?: number;
        caballosCount?: number;
        teamsColor?: Array<string>;  // Cambiado String a string para mayor claridad
        missilesDestroyed: number;  // Añadido para que coincida con el uso en el código
    };
}
