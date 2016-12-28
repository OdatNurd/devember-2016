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
    const TELEPORT_MIN_DISTANCE = 3;

    /**
     * The relative probabilty of the number of arrows that appear in a column.
     * One of these elements is randomly selected in order to determine the
     * number of arrows in a column.
     */
    const ARROW_PROBABILITY = [1, 1, 2, 2, 2, 2, 3, 3, 4, 5];

    /**
     * The relative probabilty of the number of gray bricks that appear in a
     * column. One of these elements is randomly selected in order to determine
     * the number of gray bricks in a column.
     */
    const GRAY_BRICK_PROBABILITY = [0, 0, 0, 0, 0, 1, 1, 1, 2, 2];

    /**
     * The relative probabilty of the number of gray bricks that appear in a
     * column. One of these elements is randomly selected in order to determine
     * the number of gray bricks in a column.
     */
    const BONUS_BRICK_PROBABILITY = [0, 0, 0, 0, 0, 0, 0, 1, 1, 2];

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
        { return (MAZE_WIDTH - 2) * Math.max.apply (null, ARROW_PROBABILITY); }

        /**
         * Get the maximum number of gray bricks that could conceivably be
         * generated into a maze.
         *
         * @returns {number} the maximum number of gray bricks in a maze
         */
        get maxGrayBricks () : number
        { return (MAZE_HEIGHT - 4) * Math.max.apply (null, GRAY_BRICK_PROBABILITY); }

        /**
         * Get the maximum number of bonus bricks that could conceivably be
         * generated into a maze.
         *
         * @returns {number} the maximum number of bonus bricks in a maze
         */
        get maxBonusBricks () : number
        { return (MAZE_HEIGHT - 4) * Math.max.apply (null, BONUS_BRICK_PROBABILITY); }

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
         * Scan the maze over the range of values given and check to see if the
         * entity provided exists in that span. This is allows to go outside of
         * the bounds of the maze.
         *
         * @param   {number}  x1     the x location of the first cell to check
         * @param   {number}  y1     the y location of the first cell to check
         * @param   {number}  x2     the x location of the second cell to check
         * @param   {number}  y2     the y location of the second cell to check
         * @param   {Entity}  entity the entity to search for
         *
         * @returns {boolean}    true if any of the cells in the rectangular
         * range between the two given points contains the entity.
         */
        private entityInRange (x1 : number, y1 : number,
                               x2 : number, y2 : number,
                               entity : Entity) : boolean
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
                    if (this._contents.getCellAt (x, y) == entity)
                        return true;
                }
            }

            return false;
        }

        /**
         * Scan the entire column of the maze given to see if the entity
         * provided exists in that column or not.
         *
         * @param   {number}  x      the column to search
         * @param   {Entity}  entity the entity to look for
         *
         * @returns {boolean}        true if the entity is found, false
         * otherwise
         */
        private entityInColumn (x : number, entity : Entity) : boolean
        {
            // Scan the maze content portion to see if the entity is there.
            for (let y = 2 ; y < MAZE_HEIGHT - 2 ; y++)
            {
                if (this._contents.getCellAt (x, y) == entity)
                    return true;
            }

            return false;
        }

        /**
         * This takes a probabilty array, which is an array of numbers, and will
         * randomly return one of the values in the array. The idea is that the
         * array would contain the same number some number of times to try and
         * set the probability that a particular outcome will happen.
         *
         * @param   {Array<number>} probabiltyArray the probabilty array
         *
         * @returns {number}                        the number selected
         */
        private randomProbabilty (probabiltyArray : Array<number>) : number
        {
            return probabiltyArray[Utils.randomIntInRange (0, probabiltyArray.length - 1)];
        }

        /**
         * Generate our black hole entities into the maze. There is an exact
         * number of this entity in the maze at any given time, which are
         * randomly spready around with the restriction that there only ever be
         * one in any given column in the maze.
         *
         * There is expected to be a single global teleport entity that is
         * stamped into the maze at all locations, and we update the destination
         * list of the single entity to tell it where all of its other versions
         * are.
         *
         * For this reason, this method does nothing if there is no assigned
         * teleport entity instance, and every invocation resets the destination
         * list of the teleport entity.
         */
        private genBlackHoles () : void
        {
            // We can't generate any black holes if we don't have a teleport
            // instance.
            if (this._teleport == null)
                return;

            // Reset the destination list of the entity to make sure there are
            // no phantoms.
            this._teleport.clearDestinations ();

            // Keep going until we hit a specific number of generated entities.
            let generated = 0;
            while (generated < TOTAL_TELEPORTERS)
            {
                // Get a location. These values don't cover the entire maze area;
                // we want the teleports to be away from the edges a bit.
                let x = Utils.randomIntInRange (2, MAZE_WIDTH - 3)
                let y = Utils.randomIntInRange (5, MAZE_HEIGHT - 6)

                // Don't generate here if this location is not empty, there is
                // already a teleport in this column, or there is a teleport
                // close to us.
                if (this._contents.getCellAt (x, y) != null ||
                    this.entityInColumn (x, this._teleport)  ||
                    this.entityInRange (x - TELEPORT_MIN_DISTANCE,
                                        y - TELEPORT_MIN_DISTANCE,
                                        x + TELEPORT_MIN_DISTANCE,
                                        y + TELEPORT_MIN_DISTANCE, this._teleport))
                    continue;

                // Set this location in the maze as a teleport and add this location
                // as a destination.
                this._contents.setCellAt (x, y, this._teleport);
                this._teleport.addDestination (new Point (x, y));

                // We added one.
                generated++;
            }
        }

        /**
         * Generate arrow entities into the maze. Each column has a random
         * number of arrows, up to a specified maximum number (but always at
         * least one). The facing of the arrows is completely random.
         *
         * All arrows generated are normal arrows (changing direction only when
         * they direct a ball in another direction), but if the parameter is
         * true, there is a set number of arrows that are generated as automatic
         * arrows instead.
         *
         * @param includeAutomatic true if some generated arrows should be
         * automatic arrows (self switching) or false otherwise
         */
        private genArrows (includeAutomatic : boolean) : void
        {
            // Iterate over all of the columns that can possibly contain arrows.
            for (let x = 1 ; x < MAZE_WIDTH - 1 ; x++)
            {
                // Determine how many arrows will generate in this column; there
                // is always at least one.
                let arrowCount = this.randomProbabilty (ARROW_PROBABILITY);

                // Generate them now.
                while (arrowCount > 0)
                {
                    // Generate a row. We start 3 rows down (0 offset) to leave
                    // room for the initial ball placement and a single row of
                    // potential unobstructed movement.
                    let y = Utils.randomIntInRange (2, MAZE_HEIGHT - 3);

                    // Get the contents at this location; if this location is
                    // already filled, or the tile above it is a black hole,
                    // then try again (a black hole stops this arrow from being
                    // useful).
                    if (this._contents.getCellAt (x, y) != null ||
                        this._contents.cellNameAt (x, y - 1) == "blackHole")
                        continue;

                    // Get an arrow from the pool; leave if we can't.
                    let arrow = this._maze.getArrow ();
                    if (arrow == null)
                    {
                        console.log ("Ran out of arrows generating maze");
                        return;
                    }

                    // Randomly set the initial facing direction.
                    if (Utils.randomIntInRange (0, 100) % 2 == 0)
                        arrow.arrowDirection = ArrowDirection.ARROW_LEFT;
                    else
                        arrow.arrowDirection = ArrowDirection.ARROW_RIGHT;

                    // If we are supposed to generate automatic arrows and this
                    // is randomly selected to be one, then this is an automatic
                    // arrow; otherwise it is normal.
                    if (includeAutomatic && Utils.randomIntInRange (0, 100) < 25)
                        arrow.arrowType = ArrowType.ARROW_AUTOMATIC;
                    else
                        arrow.arrowType = ArrowType.ARROW_NORMAL;

                    // Add it to the maze and count it as placed.
                    this._contents.setCellAt (x, y, arrow);
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
            // Iterate over all of the columns that can possibly contain gray
            // bricks.
            for (let x = 1 ; x < MAZE_WIDTH - 1 ; x++)
            {
                // Determine how many bricks we will generate in this column;
                // there may be zero.
                let brickCount = this.randomProbabilty (GRAY_BRICK_PROBABILITY);

                // Now keep generating bricks into this row until we have
                // generated enough.
                while (brickCount > 0)
                {
                    // Generate a row. We start 3 rows down (0 offset) to leave
                    // room for the initial ball placement and a single row of
                    // potential unobstructed movement.
                    let y = Utils.randomIntInRange (2, MAZE_HEIGHT - 3);

                    // Get the contents at this location; if this location is
                    // already filled, or the tile above it is an arrow, then
                    // try again (a arrow stops this brick from being useful).
                    if (this._contents.getCellAt (x, y) != null ||
                        this._contents.cellNameAt (x, y - 1) == "arrow")
                        continue;

                    // Get a brick from the pool; leave if we can't.
                    let brick = this._maze.getGrayBrick ();
                    if (brick == null)
                    {
                        console.log ("Ran out of gray bricks generating maze");
                        return;
                    }

                    // Add it to the maze, mark it to appear, and count it as
                    // placed.
                    this._contents.setCellAt (x, y, brick);
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
            // Iterate over all of the columns that can possibly contain gray
            // bricks.
            for (let x = 1 ; x < MAZE_WIDTH - 1 ; x++)
            {
                // Determine how many bricks we will generate in this column;
                // there may be zero.
                let brickCount = this.randomProbabilty (BONUS_BRICK_PROBABILITY);

                // Now keep generating bricks into this row until we have
                // generated enough.
                while (brickCount > 0)
                {
                    // Generate a row. We start 3 rows down (0 offset) to leave
                    // room for the initial ball placement and a single row of
                    // potential unobstructed movement.
                    let y = Utils.randomIntInRange (2, MAZE_HEIGHT - 3);

                    // Get the contents at this location; if this location is
                    // already filled, or the tile above it is an arrow, then
                    // try again (a arrow stops this brick from being useful).
                    if (this._contents.getCellAt (x, y) != null ||
                        this._contents.cellNameAt (x, y - 1) == "arrow")
                        continue;

                    // Get a brick from the pool; leave if we can't.
                    let brick = this._maze.getBonusBrick ();
                    if (brick == null)
                    {
                        console.log ("Ran out of bonus bricks generating maze");
                        return;
                    }

                    // Add it to the maze, mark it to appear, and count it as
                    // placed.
                    this._contents.setCellAt (x, y, brick);
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
        }

        /**
         * Generate a new maze into the maze we were given at construction time.
         *
         * This will throw away all content and generate new content. This takes
         * entities from the actor pools exposed by the Maze object that owns
         * us, but does not take care to reap any objects in the pools first;
         * that is up to the caller.
         *
         * @param includeAutomatic true if arrows can be generated as
         * automatically flipping, or false otherwise.
         */
        generate (includeAutomatic : boolean) : void
        {
            // Empty the maze of all of its contents.
            this.emptyMaze ();

            // Now generate the contents of the maze.
            this.genBlackHoles ();
            this.genArrows (includeAutomatic);
            this.genGrayBricks ();
            this.genBonusBricks ();

            // Now we can place the balls in.
            this.placeBalls ();
        }
    }
}