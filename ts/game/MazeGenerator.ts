module nurdz.game
{
        /**
     * The total number of teleport entities that get generated randomly into
     * the maze.
     */
    const TOTAL_TELEPORTERS = 5;

    /**
     * The minimum distance allowed between teleport entities and all other
     * entities. This makes sure they don't get generated too close together.
     *
     * Be careful not to set this too high or the generation may deadlock due to
     * there being no suitable locations.
     */
    const TELEPORT_MIN_DISTANCE = 2;

    /**
     * The minimum and maximum number of arrows that are generated per row in
     * the maze.
     */
    const ARROWS_PER_ROW = [3, 8];

    /**
     * The chance (percentage) that a row will contain any gray bricks at all.
     */
    const GRAY_BRICK_CHANCE = 50;

    /**
     * The minimum and maximum number of gray bricks that are generated per row.
     * This is only used after GRAY_BRICK_CHANCE has been used to determine if
     * there will be any bricks at all.
     */
    const GRAY_BRICKS_PER_ROW = [1, 3];

    /**
     * The chance (percentage) that a row will contain any bonus bricks.
     */
    const BONUS_BRICK_CHANCE = 40;

    /**
     * The minimum and maximum number of gray bricks that are generated per row.
     * This is only used after BONUS_BRICK_CHANCE has been used to determine if
     * there will be any bricks at all.
     */
    const BONUS_BRICKS_PER_ROW = [1, 2];

    /**
     * This class contains the code used to generate the content of a new maze.
     * It requires access to the Maze entity so that it can get at the content
     * and perform its task.
     */
    export class MazeGenerator
    {
        /**
         * The maze entity that we generate into.
         */
        private _maze : Maze;

        /**
         * The contents of the maze entity we were given; we use this as a
         * shortcut to populate the maze.
         */
        private _contents : MazeContents;

        /**
         * The entity that we use to wall off the maze. This is just stamped
         * directly into the maze at generation time.
         */
        private _wall : MazeCell;

        /**
         * The entity that acts as the teleporter in our maze. This is stamped
         * directly into the maze at generation time. It's type is specific because
         * we need to manipulate it's contents directly.
         */
        private _teleport : Teleport;

        /**
         * Set the wall that this generator object will use to create the walls
         * in the maze. The same object will be used for all wall positions.
         *
         * If this is not set, there will be no walls to block ball movement.
         *
         * @param {MazeCell} newWall the entity to use for the wall.
         */
        set wall (newWall : MazeCell)
        { this._wall = newWall; }

        /**
         * Set the entity that will be used to generate all of the teleport objects
         * in the maze. The same object will be used for all wall positions.
         *
         * If this is not set, there will be no teleports generated in the maze.
         *
         * @param {Teleport} newTeleporter the entity to use for the teleporter
         */
        set teleporter (newTeleporter : Teleport)
        { this._teleport = newTeleporter; }

        /**
         * Get the maximum number of arrows that could conceivably be generated
         * into a maze.
         *
         * @returns {number} the maximum number of arrows in a maze
         */
        get maxArrows () : number
        { return (MAZE_HEIGHT - 4) * ARROWS_PER_ROW[1]; }

        /**
         * Get the maximum number of gray bricks that could conceivably be
         * generated into a maze.
         *
         * @returns {number} the maximum number of gray bricks in a maze
         */
        get maxGrayBricks () : number
        { return (MAZE_HEIGHT - 4) * GRAY_BRICKS_PER_ROW[1]; }

        /**
         * Get the maximum number of bonus bricks that could conceivably be
         * generated into a maze.
         *
         * @returns {number} the maximum number of bonus bricks in a maze
         */
        get maxBonusBricks () : number
        { return (MAZE_HEIGHT - 4) * BONUS_BRICKS_PER_ROW[1]; }

        /**
         * Construct a new generator object that can generate mazes into the
         * provided maze object.
         *
         * @param {Maze} maze the maze object to generate into
         */
        constructor (maze : Maze)
        {
            // Store the maze and get it's contents.
            this._maze = maze;
            this._contents = maze.contents;

            // By default there is no wall or teleporter.
            this._wall = null;
            this._teleport = null;
        }

        /**
         * Prepare for maze generation by resetting the contents of the maze to
         * be empty.
         *
         * The entire contents of the maze is set to be the empty background
         * brick, followed by wrapping the edges in the bounding bricks that
         * stop the ball from falling out of the maze.
         */
        emptyMaze () : void
        {
            // Clear all cells.
            this._contents.clearCells ();

            // Now the left and right sides need to be solid bricks.
            for (let y = 0 ; y < MAZE_HEIGHT ; y++)
            {
                this._contents.setCellAt (0, y, this._wall);
                this._contents.setCellAt (MAZE_WIDTH - 1, y, this._wall);
            }

            // Lastly, the bottom row needs to be made solid, except for the
            // first and last columns, which have already been filled out.
            for (let x = 1 ; x < MAZE_WIDTH - 1 ; x++)
                this._contents.setCellAt (x, MAZE_HEIGHT - 1, this._wall);
        }

        /**
         * Scan the maze over the range of values given and check to see if any
         * entities exist in this area or not. This is not specific to any
         * particular entity.
         *
         * @param   {number}  x1 the x location of the first cell to check
         * @param   {number}  y1 the y location of the first cell to check
         * @param   {number}  x2 the x location of the second cell to check
         * @param   {number}  y2 the y location of the second cell to check
         *
         * @returns {boolean}    true if any of the cells in the rectangular
         * range between the two given points contains an entity.
         */
        private entityInRange (x1 : number, y1 : number, x2 : number, y2 : number) : boolean
        {
            // Scan the entire range; this is really inefficient but it gets
            // the job done.
            //
            // Note that getCellAt () returns null for an invalid location, so
            // this handles locations that end up off of the edge OK.
            for (let x = x1 ; x <= x2 ; x++)
            {
                for (let y = y1 ; y <= y2 ; y++)
                {
                    if (this._contents.getCellAt (x, y) != null)
                        return true;
                }
            }

            return false;
        }

        /**
         * Randomly select a column in the maze for the purposes of generating
         * maze contents.
         *
         * This ensures that the value selected is valid for a position inside
         * of the maze; this means that it makes sure that the value is never
         * one of the edge columns which bound the sides of the maze.
         *
         * @returns {number} the randomly selected column in the maze
         */
        private genRandomMazeColumn () : number
        {
            // Generate, ensuring that we never pick an edge.
            return Utils.randomIntInRange (1, MAZE_WIDTH -1);
        }

        /**
         * Randomly select a row in the maze for the purposes of generating maze
         * contents.
         *
         * This ensures that the value selected is valid for a position inside
         * of the maze. In particular we need a row at the top for the balls to
         * start in and the balls to end up in, plus a row at the top to allow
         * for at least a potential drop of one ball and a row at the bottom for
         * the outer boundary.
         *
         * @returns {number} [the randomly selected row in the maze
         */
        private genRandomMazeRow () : number
        {
            // Generate, ensuring that we skip two rows for the initial ball
            // placements and at least a single row of movement, and two rows on
            // the bottom to make room for the lower boundary and the goal line.
            return Utils.randomIntInRange (2, MAZE_HEIGHT - 2);
        }

        /**
         * Generate black holes into the maze. We generate a specific number of
         * them at random locations in the grid.
         *
         * This should be done first because unlike other elements in the maze,
         * these can be anywhere instead of only a set number of them being
         * allowed per row.
         *
         * MOTE:
         *    The current generation scheme for this is that locations are
         *    randomly selected, but if any entity is within two tiles of the
         *    chosen tile (including the chosen tile itself), that location is
         *    rejected.
         *
         */
        private genBlackHoles () : void
        {
            // We can't generate any black holes if we don't have a teleport
            // instance.
            if (this._teleport == null)
                return;

            for (let i = 0 ; i < TOTAL_TELEPORTERS ; i++)
            {
                // Get a location.
                let x = this.genRandomMazeColumn ();
                let y = this.genRandomMazeRow ();

                // If there are no entities within the proper distance of this
                // selected square (which includes the square itself), then this
                // is a good place to put the teleport; otherwise, try again.
                if (this.entityInRange (x - TELEPORT_MIN_DISTANCE,
                                        y - TELEPORT_MIN_DISTANCE,
                                        x + TELEPORT_MIN_DISTANCE,
                                        y + TELEPORT_MIN_DISTANCE) == false)
                {
                    // Store it, then add this location to the list of possible
                    // destinations in this black hole.
                    this._contents.setCellAt (x, y, this._teleport);
                    this._teleport.addDestination (new Point (x, y));
                }
                else
                    i--;
            }
        }

        /**
         * Generate arrow entities into the maze. We generate a random number of
         * arrows per row in the maze, where the number of items is constrained
         * to a range of possible arrows per row.
         *
         * NOTE:
         *    The current generation scheme for this is that we scan row by
         *    row inserting a given number of arrows per row, where the number
         *    is randomly generated. Currently the arrows are 75% normal and
         *    25% automatic, and their facing is randomly selected.
         */
        private genArrows () : void
        {
            // Iterate over all of the rows that can possibly contain arrows. We
            // start two rows down to make room for the initial ball locations
            // and the empty balls, and we stop 2 rows short to account for the
            // border of the maze and the goal row.
            for (let row = 2 ; row < MAZE_HEIGHT - 2 ; row++)
            {
                // First, we need to determine how many arrows we will generate
                // for this row.
                let arrowCount = Utils.randomIntInRange (ARROWS_PER_ROW[0], ARROWS_PER_ROW[1]);

                // Now keep generating arrows into this row until we have
                // generated enough.
                while (arrowCount > 0)
                {
                    // Generate a column randomly. If this location is already
                    // filled, or the tile above it is a black hole,  try again.
                    let column = this.genRandomMazeColumn ();
                    let cell = this._contents.getCellAt (column, row);
                    if (this._contents.getCellAt (column, row) != null ||
                        (this._contents.cellNameAt (column, row - 1) == "blackHole"))
                        continue;

                    // This cell contains an arrow; resurrect one from the object
                    // pool.
                    let arrow = this._maze.getArrow ();
                    if (arrow == null)
                    {
                        console.log ("Ran out of arrows generating maze");
                        return;
                    }

                    // Now randomly set the direction to be left or right as
                    // appropriate.
                    if (Utils.randomIntInRange (0, 100) > 50)
                        arrow.arrowDirection = ArrowDirection.ARROW_LEFT;
                    else
                        arrow.arrowDirection = ArrowDirection.ARROW_RIGHT;

                    // Randomly select the arrow type.
                    if (Utils.randomIntInRange (0, 100) > 25)
                        arrow.arrowType = ArrowType.ARROW_NORMAL;
                    else
                        arrow.arrowType = ArrowType.ARROW_AUTOMATIC;

                    // Add it to the maze and count it as placed.
                    this._contents.setCellAt (column, row, arrow);
                    arrowCount--;
                }
            }
        }

        /**
         * Generate gray brick entities into the maze. We generate a random
         * number of bricks per row in the maze, where the number of items is
         * constrained to a range of possible bricks per row. This works the way
         * the arrow generation does, except that there is a chance that a row
         * will contain no bricks at all.
         *
         * NOTE: The current generation scheme for this is that we scan row by
         * row inserting a given number of bricks per row, where the number is
         * randomly generated and might be 0.
         */
        private genGrayBricks () : void
        {
            // Iterate over all of the rows that can possibly contain bricks. We
            // start two rows down to make room for the initial ball locations
            // and the empty balls, and we stop 2 rows short to account for the
            // border of the maze and the goal row.
            for (let row = 2 ; row < MAZE_HEIGHT - 2 ; row++)
            {
                // See if we should bother generating any bricks in this row
                // at all.
                if (Utils.randomIntInRange (0, 100) > GRAY_BRICK_CHANCE)
                    continue;

                // First, we need to determine how many bricks we will generate
                // for this row.
                let brickCount = Utils.randomIntInRange (GRAY_BRICKS_PER_ROW[0], GRAY_BRICKS_PER_ROW[1]);

                // Now keep generating bricks into this row until we have
                // generated enough.
                while (brickCount > 0)
                {
                    // Generate a column randomly. If this location is already
                    // filled or the square above is an arrow, try again.
                    let column = this.genRandomMazeColumn ();
                    if (this._contents.getCellAt (column, row) != null ||
                        (this._contents.cellNameAt (column, row - 1) == "arrow"))
                        continue;

                    // This cell contains brick; resurrect one from the object
                    // pool.
                    let brick = this._maze.getGrayBrick ();
                    if (brick == null)
                    {
                        console.log ("Ran out of gray bricks generating maze");
                        return;
                    }

                    // Add it to the maze, mark it to appear, and count it as
                    // placed.
                    this._contents.setCellAt (column, row, brick);
                    brick.appear ();
                    brickCount--;
                }
            }
        }

        /**
         * Generate bonus brick entities into the maze. We generate a random
         * number of bricks per row in the maze, where the number of items is
         * constrained to a range of possible bricks per row. This works the way
         * the gray brick generation does.
         *
         * NOTE: The current generation scheme for this is that we scan row by
         * row inserting a given number of bricks per row, where the number is
         * randomly generated and might be 0.
         */
        private genBonusBricks () : void
        {
            // Iterate over all of the rows that can possibly contain bricks. We
            // start two rows down to make room for the initial ball locations
            // and the empty balls, and we stop 2 rows short to account for the
            // border of the maze and the goal row.
            for (let row = 2 ; row < MAZE_HEIGHT - 2 ; row++)
            {
                // See if we should bother generating any bricks in this row
                // at all.
                if (Utils.randomIntInRange (0, 100) > BONUS_BRICK_CHANCE)
                    continue;

                // First, we need to determine how many bricks we will generate
                // for this row.
                let brickCount = Utils.randomIntInRange (BONUS_BRICKS_PER_ROW[0], BONUS_BRICKS_PER_ROW[1]);

                // Now keep generating bricks into this row until we have
                // generated enough.
                while (brickCount > 0)
                {
                    // Generate a column randomly. If this location is already
                    // filled or the square above is an arrow, try again.
                    let column = this.genRandomMazeColumn ();
                    if (this._contents.getCellAt (column, row) != null ||
                        (this._contents.cellNameAt (column, row - 1) == "arrow"))
                        continue;

                    // This cell contains brick; resurrect one from the object
                    // pool.
                    let brick = this._maze.getBonusBrick ();
                    if (brick == null)
                    {
                        console.log ("Ran out of bonus bricks generating maze");
                        return;
                    }

                    // Add it to the maze, mark it to appear, and count it as
                    // placed.
                    this._contents.setCellAt (column, row, brick);
                    brick.appear ();
                    brickCount--;
                }
            }
        }

        /**
         * Place the balls into the maze.
         *
         * Currently this fill up the top row with balls for the player only,
         * but it should also store balls for the computer into another data
         * structure.
         */
        private placeBalls () : void
        {
            // Get the arrays that store the player and comptuer balls from
            // the contents object.
            let playerBalls = this._contents.playerBalls;
            let computerBalls = this._contents.computerBalls;

            // For each element in the ball arrays, pull out a ball and set it
            // to the appropriate type.
            //
            // This always works because the ball pool always has exactly enough
            // balls for our purposes.
            for (let ballIndex = 0 ; ballIndex < MAZE_WIDTH - 2 ; ballIndex++)
            {
                // Get the balls from the pool
                playerBalls[ballIndex] = this._maze.getBall ();
                computerBalls[ballIndex] = this._maze.getBall ();

                // Make sure that their score values are 0 to begin with.
                playerBalls[ballIndex].score = 0;
                computerBalls[ballIndex].score = 0;

                // Now set the appropriate type so that they visually display
                // as we want them to.
                playerBalls[ballIndex].ballType = BallType.BALL_PLAYER;
                computerBalls[ballIndex].ballType = BallType.BALL_COMPUTER

                // Both balls should be hidden to begin with. This has to come
                // after the type setting below because when the type of a ball
                // changes it idles by default.
                playerBalls[ballIndex].hide ();
                computerBalls[ballIndex].hide ();
            }

            // Now restore the balls that the maze thinks are currently active.
            // This is the only place we pass false to this parameter.
            this._contents.swapVisibleBalls (false);
        }

        /**
         * Generate a new maze into the maze we were given at construction time.
         *
         * This will throw away all content and generate new content. This takes
         * entities from the actor pools exposed by the Maze object that owns us,
         * but does not take care to reap any objects in the pools first; that
         * is up to the caller.
         */
        generate () : void
        {
            // Empty the maze of all of its contents.
            this.emptyMaze ();

            // Now generate the contents of the maze.
            this.genBlackHoles ();
            this.genArrows ();
            this.genGrayBricks ();
            this.genBonusBricks ();

            // Now we can place the balls in.
            this.placeBalls ();
        }
    }
}