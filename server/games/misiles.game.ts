import { Server } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

import GameManager from "../utils/manager.util";
import { User } from "../types/User";
import { MissileState } from "../types/MissileState";
const crypto = require('crypto');

function generateNumericCode(length: number) {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    code += digits[randomIndex];
  }
  return code;
}

const initMissiles = (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {

  const missilesNSP = io.of("/missiles");

  missilesNSP.on("connection", missileSocket => {
    let userRoom: string | undefined;

    // Admin crea una sala
    missileSocket.on('join-admin', () => {
      const room = `msls-${missilesNSP.adapter.rooms.size}${generateNumericCode(7)}`;

      // Asegúrate de proporcionar todas las propiedades requeridas por MissileState
      const initialMissileState: MissileState = {
        gray: 0,                  // Valor inicial numérico
        red: 0,                   // Valor inicial numérico
        green: 0,                 // Valor inicial numérico
        blue: 0,                  // Valor inicial numérico
        yellow: 0,                // Valor inicial numérico
        winner: undefined,        // Opcional, puede ser undefined
        loser: undefined,         // Opcional, puede ser undefined
        isReadyToStarted: false,  // Valor inicial booleano
        hasStopped: false,        // Valor inicial booleano
        hasStarded: false,        // Valor inicial booleano (parece que podría ser un error tipográfico y debería ser 'hasStarted')
        hasFinished: false        // Valor inicial booleano
      };

      GameManager.addRoom(room, initialMissileState);

      const user: User = {
        id: missileSocket.id,
        username: 'Admin',
        room,
        isAdmin: true,
        info: {
            teamColor: 'blue',        // Proporciona un valor para teamColor
            taps: 0,                  // Proporciona un valor para taps
            missilesDestroyed: 0,    // Proporciona un valor para missilesDestroyed
            // Puedes proporcionar valores para otras propiedades opcionales si es necesario
            titulo: undefined,        // Opcional, puedes omitirlo si no es necesario
            descripcion: undefined,   // Opcional, puedes omitirlo si no es necesario
            link: undefined,          // Opcional, puedes omitirlo si no es necesario
            playersCount: undefined,  // Opcional, puedes omitirlo si no es necesario
            caballosCount: undefined, // Opcional, puedes omitirlo si no es necesario
            teamsColor: []            // Opcional, puedes proporcionar un array vacío si no hay valores
        }
    };

      if (GameManager.addUser(user)) {
        missileSocket.join(room);
        missilesNSP.to(user.id).emit("user-info", user);
      }
    });

    // Jugador entra a la sala del admin
    missileSocket.on('join-player', (roomID: string) => {
      try {
        userRoom = roomID;
        const user: User = {
          id: missileSocket.id,
          username: GameManager.getNicknames(),
          room: roomID,
          isAdmin: false,
          info: {
            teamColor: 'blue',        // Proporciona un valor para teamColor
            taps: 0,                  // Proporciona un valor para taps
            missilesDestroyed: 0,     // Proporciona un valor para missilesDestroyed
            // Otros campos opcionales pueden quedarse fuera si no son necesarios
            titulo: undefined,        // Opcional
            descripcion: undefined,   // Opcional
            link: undefined,          // Opcional
            playersCount: undefined,  // Opcional
            caballosCount: undefined, // Opcional
            teamsColor: []            // Opcional
          }
        };

        if (GameManager.addUser(user)) {
          missileSocket.join(roomID);
          missilesNSP.to(user.id).emit("user-info", user);

          const roomAdmin = GameManager.getUsersInRoom(roomID).find((user: User) => user.isAdmin);
          missilesNSP.to(roomID).to(roomAdmin!.id).emit('connect-to-missiles', {
            msg: `User ${user.username} has connected!`,
            users: GameManager.getUsersInRoom(roomID)
          });
        }
      } catch (error) {
        console.error(error);
      }
    });

    // Admin inicia el juego
    missileSocket.on("start-game", (roomId: string) => {
      GameManager.setStartTime(roomId, Date.now() + '');
      GameManager.initMissiles(roomId);  // Inicializa los misiles que se acercarán al jugador
      missilesNSP.to(roomId).emit("start-game", GameManager.getMissiles(roomId));
    });

    // Jugador destruye un misil
    missileSocket.on("destroy-missile", (missileId: string) => {
      const user = GameManager.getUser(missileSocket.id, userRoom!);
      if (user) {
        GameManager.destroyMissile(user.room, missileId);
        user.info.missilesDestroyed += 1;
        missilesNSP.to(user.room).emit("missile-destroyed", { missileId, userId: user.id });
      }
    });


    missileSocket.on("disconnect", () => {
      if (typeof userRoom === 'string') {
        const user = GameManager.removeUser(missileSocket.id, userRoom!);
        if (user) {
          const roomAdmin = GameManager.getUsersInRoom(userRoom).find((user: User) => user.isAdmin);
          missilesNSP.to(userRoom).to(roomAdmin!.id).emit('user-disconnected', { userId: user.id });
        }
      }
    });
  });
}

export default initMissiles;
