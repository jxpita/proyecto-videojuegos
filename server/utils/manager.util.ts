import { MissileState } from "../types/MissileState";
import { User } from "../types/User";
import { Rooms } from "../types/Rooms";
import { EASTER_EGG, NICKNAMES } from "./usernames";
import { CONFIG } from '../global';

const rooms: Rooms = {};
let tappingFactor!: number;

const initTappingFactor = (room: string) => {
  try {
    // Se restan 2 por el admin y el viewer, el 5 representa la cantidad de equipos (misiles)
    const teamSize = rooms[room].users.length > 5 ? (rooms[room].users.length - 2) / (rooms[room].missileCount ?? 5) : 1;

    // Distancia en X que debe recorrer un misil para alcanzar su objetivo
    const totalDistance = CONFIG.x - (2 * CONFIG.MissilesInitialX);

    // Tiempo en SEGUNDOS que queremos que el juego dure
    const time = CONFIG.timer - 10;

    // Cuántos taps por segundo dan nuestros usuarios (suponiendo que dan 9)
    const tps = 9;

    tappingFactor = totalDistance / (time * tps * teamSize);

  } catch (error) {
    tappingFactor = 1;
  }
};

const getViewer = (room_id: string): User | void => {
  try {
    return rooms[room_id].users.find((user) => user.username === 'viewer');
  } catch (error) {}
};

const getIDTeamLessPlayers = (teamsPlayerCount: Array<number>): number => {
  let playerCount = teamsPlayerCount[0];
  let id = 0;

  for (let i = 1; i < teamsPlayerCount.length; i++) {
    if (teamsPlayerCount[i] < playerCount) {
      playerCount = teamsPlayerCount[i];
      id = i;
    }
  }

  return id;
};

const setWinnerInState = (winner_team: string, room_id: string) => {
  try {
    if (rooms[room_id].state.winner === undefined || rooms[room_id].state.winner === null) {
      rooms[room_id].state.winner = winner_team;
    } else {
      if (rooms[room_id].state.winner!.length === 0) {
        rooms[room_id].state.winner = winner_team;
      }
    }
  } catch (error) {}
};

const isEveryoneFinished = (state: MissileState, room_id: string): boolean => {
  try {
    let howMany = 0;
    state.blue >= CONFIG.x - (2 * CONFIG.MissilesInitialX) ? howMany++ : null;
    state.gray >= CONFIG.x - (2 * CONFIG.MissilesInitialX) ? howMany++ : null;
    state.green >= CONFIG.x - (2 * CONFIG.MissilesInitialX) ? howMany++ : null;
    state.red >= CONFIG.x - (2 * CONFIG.MissilesInitialX) ? howMany++ : null;
    state.yellow >= CONFIG.x - (2 * CONFIG.MissilesInitialX) ? howMany++ : null;

    return howMany >= getMissileCount(room_id);
  } catch (error) {
    return true;
  }
};

const addRoom = (room: string, state: MissileState) => {
  try {
    rooms[room] = {
      users: [],
      state: state,
      tapsTimes: {},
      teamsColor: ['red', 'green', 'blue', 'yellow', 'gray'],
      teamsPlayerCount: [0, 0, 0, 0, 0]
    };
  } catch (error) {}
};

const getRoom = (id: string) => {
  try {
    return rooms[id];
  } catch (error) {
    return null;
  }
};

const addUser = (userInfo: User): boolean => {
  try {
    const user = userInfo;
    rooms[userInfo.room].users.push(user);
    return true;
  } catch (error) {
    return false;
  }
};

const removeUser = (id: string, room: string): User | void => {
  try {
    const index = rooms[room].users.findIndex((user) => user.id === id);

    if (index !== -1) {
      return rooms[room].users.splice(index, 1)[0];
    }
  } catch (error) {}
};

const getUser = (id: string, room: string) => {
  try {
    return rooms[room]?.users.find((user) => user.id === id);
  } catch (error) {
    console.error(error);
    return undefined; // Opcional: puedes retornar undefined si hay un error
  }
};

const getUsersInRoom = (room: string) => {
  try {
    return rooms[room] ? rooms[room].users : [];
  } catch (error) {
    return [];
  }
};

const changeStateInRoom = (user: User) => {
  try {
    switch (user.info.teamColor) {
      case 'red':
        if (((rooms[user.room].state as MissileState).red) <= (CONFIG.x - (CONFIG.MissilesInitialX)))
          (rooms[user.room].state as MissileState).red += tappingFactor;
        break;
      case 'green':
        if (((rooms[user.room].state as MissileState).green) <= (CONFIG.x - (CONFIG.MissilesInitialX)))
          (rooms[user.room].state as MissileState).green += tappingFactor;
        break;
      case 'blue':
        if (((rooms[user.room].state as MissileState).blue) <= (CONFIG.x - (CONFIG.MissilesInitialX)))
          (rooms[user.room].state as MissileState).blue += tappingFactor;
        break;
      case 'yellow':
        if (((rooms[user.room].state as MissileState).yellow) <= (CONFIG.x - (CONFIG.MissilesInitialX)))
          (rooms[user.room].state as MissileState).yellow += tappingFactor;
        break;
      case 'gray':
        if (((rooms[user.room].state as MissileState).gray) <= (CONFIG.x - (CONFIG.MissilesInitialX)))
          (rooms[user.room].state as MissileState).gray += tappingFactor;
        break;
      default:
        break;
    }
    return rooms[user.room].state;
  } catch (error) {}
};

const getStateByRoom = (room_id: string): MissileState | null => {
  try {
    return rooms[room_id] ? rooms[room_id].state : null;
  } catch (error) {
    return null;
  }
};

const getBestTeam = (room_id: string): string | null => {
  try {
    let bestTeam = '';
    let bestTeamPoint = 0;

    // Obtener los valores y las claves del estado del room
    const state = rooms[room_id].state;
    const values = Object.values(state);
    const keys = Object.keys(state);

    // Iterar a través de los valores y las claves
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      if (typeof value === 'number') { // Asegurarse de que el valor sea un número
        if (value >= bestTeamPoint) {
          bestTeamPoint = value;
          bestTeam = keys[i];
        }
      }
    }

    return bestTeam;
  } catch (error) {
    console.error("Error in getBestTeam:", error);
    return null;
  }
};

const getStatisticsByRoom = (room_id: string, winner: string): any | null => {
  try {
    const taps = rooms[room_id].tapsTimes;
    const finishTime: number = parseInt(rooms[room_id].finishTime ?? "0");
    const startTime: number = parseInt(rooms[room_id].startTime ?? "0");
    const state = rooms[room_id].state;

    const linearData: Array<any> = [['Intervalos'],];

    const inicio = (startTime / 1000);
    const gameTime = (finishTime / 1000) - inicio;
    const fin = gameTime;
    const series = 5;
    let cantidadJugadoresRojo = 0;
    let cantidadJugadoresVerde = 0;
    let cantidadJugadoresAmarillo = 0;
    let cantidadJugadoresAzul = 0;
    let cantidadJugadoresGris = 0;
    const tiemposRojo = [];
    const tiemposVerde = [];
    const tiemposAmarillo = [];
    const tiemposAzul = [];
    const tiemposGris = [];

    let MVP = { username: "", taps: 0 };

    for (const jugador of Object.keys(taps)) {
      const j: any = taps[jugador];
      const equipo: string = j.team;
      const tiempos: Array<number> = j.times;

      if (equipo === winner && tiempos.length > MVP.taps) {
        MVP.username = j.username;
        MVP.taps = tiempos.length;
      }

      switch (equipo) {
        case 'red': tiemposRojo.push(...tiempos); cantidadJugadoresRojo++; break;
        case 'yellow': tiemposAmarillo.push(...tiempos); cantidadJugadoresAmarillo++; break;
        case 'green': tiemposVerde.push(...tiempos); cantidadJugadoresVerde++; break;
        case 'blue': tiemposAzul.push(...tiempos); cantidadJugadoresAzul++; break;
        case 'gray': tiemposGris.push(...tiempos); cantidadJugadoresGris++; break;
        default: tiemposGris.push(...tiempos); cantidadJugadoresGris++; break;
      }
    }

    linearData.push(['Red', cantidadJugadoresRojo, tiemposRojo]);
    linearData.push(['Yellow', cantidadJugadoresAmarillo, tiemposAmarillo]);
    linearData.push(['Green', cantidadJugadoresVerde, tiemposVerde]);
    linearData.push(['Blue', cantidadJugadoresAzul, tiemposAzul]);
    linearData.push(['Gray', cantidadJugadoresGris, tiemposGris]);

    return {
      linearData: linearData,
      MVP: MVP,
      gameTime: fin,
      teams: [
        { team: 'red', point: state.red, players: cantidadJugadoresRojo },
        { team: 'yellow', point: state.yellow, players: cantidadJugadoresAmarillo },
        { team: 'green', point: state.green, players: cantidadJugadoresVerde },
        { team: 'blue', point: state.blue, players: cantidadJugadoresAzul },
        { team: 'gray', point: state.gray, players: cantidadJugadoresGris }
      ]
    };

  } catch (error) {
    return null;
  }
};

const setConfigs = (
  room_id: string,
  missileCount?: number,
  title?: string,
  description?: string,
  link?: string
) => {
  try {
    rooms[room_id].missileCount = missileCount ?? 5;
    rooms[room_id].titulo = title ?? '';
    rooms[room_id].descripcion = description ?? '';
    rooms[room_id].link = link ?? '';
  } catch (error) {}
};

const setTeamsColor = (room_id: string, teams: Array<string>) => {
  try {
    rooms[room_id].teamsColor = teams;
  } catch (error) {}
};

const getTeamsColor = (room_id: string): Array<string> => {
  try {
    return rooms[room_id].teamsColor;
  } catch (error) {
    return [];
  }
};

const getMissileCount = (room_id: string): number => {
  try {
    return rooms[room_id].missileCount ?? 5;
  } catch (error) {
    return 5;
  }
};

const setTapsTimes = (room_id: string, tapsTimes: any) => {
  try {
    rooms[room_id].tapsTimes = tapsTimes;
  } catch (error) {}
};

const setStartTime = (room_id: string, startTime: string) => {
  try {
    rooms[room_id].startTime = startTime;
  } catch (error) {}
};

const setFinishTime = (room_id: string, finishTime: string) => {
  try {
    rooms[room_id].finishTime = finishTime;
  } catch (error) {}
};

const getNicknames = (): string => {
  try {
    const subjects = NICKNAMES.SUJETOS;
    const adjectives = NICKNAMES.ADJETIVOS;

    // Selecciona un elemento aleatorio de cada array
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];

    // Combina el sujeto y el adjetivo para formar un apodo
    return `${randomAdjective} ${randomSubject}`;
  } catch (error) {
    console.error("Error generating nickname:", error);
    return 'Unknown';
  }
};

const initMissiles = (room_id: string) => {
  rooms[room_id].state = {
    gray: 0,
    red: 0,
    green: 0,
    blue: 0,
    yellow: 0,
    winner: "",
    loser: "",
    isReadyToStarted: false,
    hasStopped: false,
    hasStarded: false,
    hasFinished: false
  };
};

const getMissiles = (room_id: string): MissileState => {
  return rooms[room_id].state;
};

const destroyMissile = (room_id: string, color: string): void => {
  if (['gray', 'red', 'green', 'blue', 'yellow'].includes(color)) {
    rooms[room_id].state[color as keyof MissileState] = CONFIG.x;
  }
};


export default {
  addRoom,
  getRoom,
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
  changeStateInRoom,
  getStateByRoom,
  setWinnerInState,
  isEveryoneFinished,
  initTappingFactor,
  getBestTeam,
  getStatisticsByRoom,
  setConfigs,
  setTeamsColor,
  getTeamsColor,
  getMissileCount,
  setTapsTimes,
  setStartTime,
  setFinishTime,
  getViewer,
  getNicknames,
  initMissiles,
  getMissiles,
  destroyMissile
};
