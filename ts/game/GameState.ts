module nurdz.game
{
    /**
     * The number of points that a bonus brick is worth.
     */
    export const BONUS_BRICK_SCORE = 10;

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