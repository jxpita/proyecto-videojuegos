import { CaballosState } from "./MissileState";
import { GenericState } from "./GenericState";
import { User } from "./User";

export interface Users {
    [roomid: string]: {
        users: Array<User>,
        state: CaballosState
    },
}
