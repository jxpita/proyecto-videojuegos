import { MissileState } from "./MissileState";
import { User } from "./User";

export interface Rooms {
    [roomid: string]: {
        users: Array<User>,
        state: MissileState,
        titulo?: string,
        descripcion?: string,
        link?: string,
        missileCount?: number,
        teamsColor: Array<string>,
        teamsPlayerCount: Array<number>,
        startTime?: string,
        finishTime?: string,
        tapsTimes: {
            [userid: string]: {
                username: string,
                team: string,
                times: Array<string>,
            },
        },
    },
}
