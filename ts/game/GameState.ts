module nurdz.game
{
    /**
     * The number of points that a bonus brick is worth.
     */
    export const BONUS_BRICK_SCORE = 10;

    /**
     * The number of points that it's worth to get a ball all the way to the
     * bottom of the screen, where the goal line is.
     */
    export const GOAL_BALL_SCORE = 60;

    /**
     * The number of points scored per row of advancement of a ball. This is
     * applied at the end of the round when the final balls are removed.
     */
    export const BALL_POSITION_MULTIPLIER = 2;

    /**
     * True if we should generate a level with only half of the normal number
     * of balls. This will only generate a ball into the even numbered columns
     * in the maze. This makes for a shorter game.
     */
    export let halfBalls : boolean = false;

    /**
     * The current round number in the game. This advances every time the last
     * ball is dropped at the end of a round.
     */
    export let currentRound : number = 1;

    /**
     * The maximum number of rounds in the game. Once the current round exceeds
     * this value, the game is officially over.
     */
    export let maxRounds : number = 1;

    /**
     * Every time newGame is invoked, this is used to store the total rounds
     * that were given to the method so that we can replay it easily.
     */
    let lastGameType : number = 1;

    /**
     * The number of points the human player has.
     */
    let humanScore : number = 0;

    /**
     * The number of poitns the computer player has.
     */
    let computerScore : number = 0;

    /**
     * The location where the human score is displayed
     */
    const humanScorePos = new Point (16, 32);

    /**
     * THe location where the computer score is displayed
     */
    const computerScorePos = new Point (STAGE_WIDTH - (5 * 32), 32);

    /**
     * Set up a new game to be played over the given number of total rounds. A
     * value of 0 or smaller means that we will be playing only a single round,
     * but with half balls.
     *
     * This will set the current round to 1 and reset the scores.
     *
     * @param {number} totalRounds the total number of rounds; can be 0 to
     * indicate a 1 round game played with half balls.
     */
    export function newGame (totalRounds : number) : void
    {
        // Save the information that is used to set this for the next time a
        // replay happens.
        lastGameType = totalRounds;

        // Start at round one and store the total rounds given. When the total
        // rounds is 0 or smaller, assume 1.
        currentRound = 1;
        maxRounds = (totalRounds > 0) ? totalRounds : 1;

        // We want to use half balls only when total rounds is 0 or smaller.
        halfBalls = (totalRounds <= 0) ? true : false;

        // Start the game with empty scores.
        resetScores ();

        // Log what's happening.
        console.log(
            String.format (
                "DEBUG: Starting a new game with round count of {0} and {1} half balls",
                maxRounds,
                (halfBalls ? "with" : "without")
            ));
    }

    /**
     * This sets everything up to the same game type specified the last time a
     * new game was started. This can be used to replay the same type of game
     * again without having to track how the game was set up.
     */
    export function replayLastGame () : void
    {
        newGame (lastGameType);
    }

    /**
     * Skip the round counter to indicate that we're in the next round now.
     */
    export function nextRound () : void
    {
        currentRound++;
    }

    /**
     * Check to see if we think the game should be over right now. This is based
     * purely on the current round number, so this should only be checked after
     * modifying that value.
     *
     * @returns {boolean} true if the game is now over, false otherwise
     */
    export function isGameOver () : boolean
    {
        return currentRound > maxRounds;
    }

    /**
     * Return an indication as to whether this is the last round of the game or
     * not. This always returns false if the maximum number of rounds is not
     * greater than 1, because the use of this function is for determing last
     * round setup, which only happens for a game longer than one round.
     *
     * @returns {boolean} true if this is the last round
     */
    export function isLastRound () : boolean
    {
        // Never the last round for a single round game
        if (maxRounds == 1)
            return false;

        // This is the last round when we meet or exceed the last round.
        return currentRound >= maxRounds;
    }

    /**
     * Reset the score values for both players.
     */
    export function resetScores () : void
    {
        humanScore = 0;
        computerScore = 0;
    }

    /**
     * Update the score for the designated player by adding or subtracting the
     * provided point value from the score.
     *
     * @param {PlayerType} player the player to adjust the score for
     * @param {number}     value  the adjustment value; can be positive or
     * negative
     */
    function adjustScore (player : PlayerType, value : number) : void
    {
        // Update the correct score.
        if (player == PlayerType.PLAYER_HUMAN)
            humanScore += value;
        else
            computerScore += value;
    }

    /**
     * Score points due to touching a bonus brick for the owner of the ball
     * provided.
     *
     * @param {Ball} ball the ball that touched the bonus brick
     */
    export function bonusBrickScore (ball : Ball) : void
    {
        adjustScore (ball.player, BONUS_BRICK_SCORE);
    }

    /**
     * Given a ball that is being scored for any reason, trigger a lerp on it
     * that starts at the current location on the screen and terminates at the
     * location where the score for this ball is displayed.
     *
     * @param   {Ball}  ball the ball which will update the score
     */
    export function lerpBallToScore (ball : Ball) : void
    {
        ball.lerpTo ((ball.player == PlayerType.PLAYER_HUMAN)
            ? humanScorePos
            : computerScorePos);
    }

    /**
     * Score points due to a ball reaching the goal line (the bottom of the
     * maze).
     *
     * @param {Ball} ball the ball that reached the score line
     */
    export function goalBallScore (ball : Ball) : void
    {
        adjustScore (ball.player, GOAL_BALL_SCORE);
    }

    /**
     * Score partial points for a ball based on its final resting position in
     * the maze.
     *
     * @param {Ball} ball the ball to score partial points for
     */
    export function partialBallScore (ball : Ball) : void
    {
        adjustScore (ball.player, ball.mapPosition.y * BALL_POSITION_MULTIPLIER);
    }

    /**
     * Render the scores of the two players to the screen. This renders the
     * scores to a known position on screen.
     *
     * @param {Renderer} renderer the renderer to use to blit the text.
     */
    export function renderScores (renderer : Renderer) : void
    {
        renderer.drawTxt (humanScore+"", humanScorePos.x, humanScorePos.y, "white");
        renderer.drawTxt (computerScore+"", computerScorePos.x, computerScorePos.y, "yellow");
    }
}