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
     * The number of points the human player has.
     */
    let humanScore : number = 0;

    /**
     * The number of poitns the computer player has.
     */
    let computerScore : number = 0;

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
        renderer.drawTxt (humanScore+"", 16, 32, "white");
        renderer.drawTxt (computerScore+"", STAGE_WIDTH - (5 * 32), 32, "yellow");
    }
}