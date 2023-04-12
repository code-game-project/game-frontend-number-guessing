/*
 * A number guessing game.
 */

export interface GameConfig {
    /**
     * The minimum number (inclusive) default=0
     */
  min?: number,
    /**
     * The maximum number (inclusive) default=100
     */
  max?: number,
}

/**
 * Send the `guess` command to make a guess.
 */
export interface GuessCmd {
  name: "guess",
  data: {
    /**
     * The number you guess.
     */
    number: number,
  },
}

/**
 * You guessed too high.
 */
export interface TooHighEvent {
  name: "too_high",
  data: {
    /**
     * The guessed number.
     */
    number: number,
  },
}

/**
 * You guessed too low.
 */
export interface TooLowEvent {
  name: "too_low",
  data: {
    /**
     * The guessed number.
     */
    number: number,
  },
}

/**
 * You guessed the correct number.
 */
export interface CorrectEvent {
  name: "correct",
  data: {
    /**
     * The correct number.
     */
    number: number,
    /**
     * The number of tries.
     */
    tries: number,
  },
}

export type Commands = GuessCmd;
export type Events = TooHighEvent | TooLowEvent | CorrectEvent;
