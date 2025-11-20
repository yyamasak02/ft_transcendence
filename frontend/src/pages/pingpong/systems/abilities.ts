// src/systems/abilities.ts

import { gameData, characters } from "../core/data";
// import { createShotEffect, createScreenShake } from "./effects";

interface ActiveAbility {
  playerId: number;
  charIndex: number;
  startTime: number;
  duration: number;
  type: string;
  originalValue?: any;
}

let activeAbilities: ActiveAbility[] = [];
let currentGameTime = 0;

export function updateAbilities(gameTime: number) {
  currentGameTime = gameTime;
  activeAbilities = activeAbilities.filter((ability) => {
    const elapsed = gameTime - ability.startTime;
    if (elapsed >= ability.duration) {
      endAbility(ability);
      return false;
    }
    return true;
  });
}

function endAbility(ability: ActiveAbility) {
  const player = ability.playerId === 1 ? gameData.player1 : gameData.player2;

  switch (ability.type) {
    case "gust":
      player.speedMultiplier = 1;
      player.isAbilityActive = false;
      console.log(`Player ${ability.playerId} Gust ability ended`);
      break;
    case "mega":
      player.height = ability.originalValue;
      player.isAbilityActive = false;
      console.log(`Player ${ability.playerId} M ability ended`);
      break;
    case "sniper":
      player.isAbilityActive = false;
      console.log(`Player ${ability.playerId} Sniper ability ended`);
      break;
  }
}

export function activateAbility(
  playerId: number,
  charIndex: number,
  abilityType: string,
) {
  const player = playerId === 1 ? gameData.player1 : gameData.player2;
  const char = characters[charIndex];

  const canUse = char.maxUsages === -1 || player.abilityUsages < char.maxUsages;
  if (!canUse) {
    console.log(`Player ${playerId} ability: no uses remaining`);
    return false;
  }

  switch (abilityType) {
    case "gust":
      if (!player.isAbilityActive) {
        player.isAbilityActive = true;
        player.speedMultiplier = 2;
        player.abilityUsages++;

        activeAbilities.push({
          playerId,
          charIndex,
          startTime: currentGameTime,
          duration: 3000,
          type: "gust",
        });
        console.log(`Player ${playerId} Gust ability activated!`);
      }
      break;

    case "mega":
      if (!player.isAbilityActive) {
        const originalHeight = player.height;
        player.isAbilityActive = true;
        player.height = originalHeight * 2.5;
        player.abilityUsages++;

        activeAbilities.push({
          playerId,
          charIndex,
          startTime: currentGameTime,
          duration: 20000,
          type: "mega",
          originalValue: originalHeight,
        });
        console.log(`Player ${playerId} M ability activated!`);
      }
      break;

    case "sniper":
      if (!player.isAbilityActive) {
        player.isAbilityActive = true;
        player.abilityUsages++;

        activeAbilities.push({
          playerId,
          charIndex,
          startTime: currentGameTime,
          duration: 1000,
          type: "sniper",
        });
        console.log(`Player ${playerId} Sniper ability activated!`);
      }
      break;

    case "suicider":
      player.isSuiciderActive = !player.isSuiciderActive;
      console.log(
        `Player ${playerId} Suicider position switched:`,
        player.isSuiciderActive,
      );
      break;

    case "shot":
      // createShotEffect(gameData.ball.x, gameData.ball.y);
      // createScreenShake(8, 300);

      gameData.ball.speedY = -gameData.ball.speedY;
      player.abilityUsages++;
      console.log(`Player ${playerId} Shot ability used!`);
      break;
  }

  return true;
}
