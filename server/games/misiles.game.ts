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
      GameManager.addRoom(room, { missiles: [] } as MissileState);

      const user: User = {
        id: missileSocket.id,
        username: 'Admin',
        room,
        isAdmin: true,
        info: {
          missilesDestroyed: 0,
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
            missilesDestroyed: 0,
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
      const user = GameManager.getUser(missileSocket.id);
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
