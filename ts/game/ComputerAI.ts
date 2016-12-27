module nurdz.game
{
    /**
     * Scan to see what balls in the maze are available to be pushed. These are
     * balls that are in the top row of the maze and not immediately blocked.
     *
     * @param   {Maze}        maze the maze to scan
     *
     * @returns {Array<Ball>}      the array of balls that can be moved; may be
     * empty
     */
    function getEligibleBalls (maze : Maze) : Array<Ball>
    {
        let retVal : Array<Ball> = [];

        // Scan all columns that are potential ball columns in the maze to see
        // what is what.
        for (let col = 1 ; col < MAZE_WIDTH - 1 ; col++)
        {
            // Get the entity at this column.
            let entity = maze.contents.getCellAt (col, 0);

            // If it exists, is a ball, and is not blocked, add it to the list
            // of eligible balls.
            //
            // For the purposes of this, assume that this is not a simulation
            // because we can't push the ball if the ball was actually blocked
            // at this point.
            if (entity != null && entity.name == "ball" &&
                maze.contents.getBlockingCellAt (col, 1, false) == null)
                retVal.push (<Ball> entity);
        }

        return retVal;
    }

    /**
     * Run a simulation of dropping the given ball through the given maze to see
     * what happens. This presumes that this ball is capable of moving.
     *
     * This will move the ball as far as it can (simulating the whole time) and
     * then return the simulation score for this ball, which is a function of
     * how many bonus bricks it collected and how far through the maze it got.
     *
     * @param   {Ball}   ball the ball to try pushing
     * @param   {Maze}   maze the maze to push the ball in
     *
     * @returns {number}      the score of the pushed ball
     */
    function simulateBallInMaze (ball : Ball, maze : Maze) : number
    {
        // Get a duplicate of the position that the ball is stored at currently,
        // then remove it from the maze so that it doesn't block itself.
        let storedPos = ball.mapPosition.copy ();
        maze.contents.clearCellAt (storedPos.x, storedPos.y);

        // Now ensure the ball knows before we start that it is not moving.
        ball.moveType = BallMoveType.BALL_MOVE_NONE;

        // Keep moving the ball through the maze until it stops; the method
        // returns false when this happens.
        //
        // We pass in the simulation parameter here so that nothing happens
        // visually.
        while (maze.nextBallPosition (ball, storedPos, true))
            ;

        // Put the ball back where it came from.
        maze.contents.setCellAt (ball.mapPosition.x, ball.mapPosition.y, ball);

        // If the position where this ball stopped is the bottom of the maze,
        // it gets a bonus score.
        if (storedPos.y == MAZE_HEIGHT - 2)
            ball.score += GOAL_BALL_SCORE;

        // Return the final score, which is the number of bonus bricks that this
        // ball passed through, plus getting to the bottom (if it did), plus points
        // for each row it made it through the maze.
        return ball.score + (storedPos.y * BALL_POSITION_MULTIPLIER);
    }

    /**
     * Select the best move for an AI player based on the state of the maze
     * provided.
     *
     * This is naive and essentially tries to move every possible ball and see
     * which one would provide the best score. In the case that there is more
     * than one move that would provide the best score, this just randomly picks
     * a move.
     *
     * @param   {Maze} maze the maze to check for a move in
     *
     * @returns {Ball}      the ball entity from the maze that should be moved;
     * this will be null if there is no potential move.
     */
    export function AI_selectBestMove (maze : Maze) : Ball
    {
        // This contains the list of balls that we think we should push, in case
        // there is more than one that is valid.
        let possiblePushes : Array<Ball> = [];

        // This is the highest score of a ball that we have seen thus far, which
        // factors in the score of the ball after being pushed (through bonus
        // bricks, for example) and its position in the maze.
        let highScore = 0;

        // Tell the maze we are entering the simulation.
        maze.beginSimulation ();

        // Get the list of balls that could be potentially dropped, and then
        // iterate over them.
        let ballList = getEligibleBalls (maze);
        for (let i = 0 ; i < ballList.length ; i++)
        {
            // Get the ball and then simulate with it.
            let ball = ballList[i];
            let ballScore = simulateBallInMaze (ball, maze);

            // If we're debugging, say what score was assigned for this ball.
            if (maze.debugger.debugTracking)
                console.log (String.format ("Ball simulation of {0} scores {1}",
                    ball.mapPosition.toString (),
                    ballScore));

            // If the score of this ball is at least as good or better than the
            // highest score, this ball is interesting.
            if (ballScore >= highScore)
            {
                // If the score of this ball is larger than the highest score,
                // throw away all other possible pushes and set this as the new
                // high score.
                if (ballScore > highScore)
                {
                    possiblePushes.length = 0;
                    highScore = ballScore;
                }

                // Save this ball as possible now.
                possiblePushes.push (ball);
            }

            // This iteration is done, so restore now.
            maze.endSimulation ();
        }

        // If we're debugging, indicate the potential AI choices.
        if (maze.debugger.debugTracking)
        {
            let results : Array<string> = [];
            for (let i = 0 ; i < possiblePushes.length ; i++)
                results.push (possiblePushes[i].mapPosition.toString ());

            console.log (String.format ("AI: {0} choices for score {1} => {2}",
                possiblePushes.length, highScore, results));
        }

        // If there are no moves, return null; if there is one move, return it.
        // Otherwise, randomly select one.
        switch (possiblePushes.length)
        {
            // No valid pushes; all moves are blocked.
            case 0:
                return null;

            // Exactly one possible option; return it. This could be done with
            // the handler below, but then we would be generating a random
            // number between 1 and 1 and I don't know what bothers me more.
            case 1:
                return possiblePushes[0];

            // More than one identical move, so randomly select one.
            default:
                return possiblePushes[Utils.randomIntInRange (0, possiblePushes.length - 1)];
        }
    }
}