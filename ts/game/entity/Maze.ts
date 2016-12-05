module nurdz.game
{
    /**
     * The width of the maze, in bricks.
     *
     * This is inclusive of the side walls, so it's actually 2 bricks wider than
     * the play area.
     *
     * @type {Number}
     */
    const MAZE_WIDTH = 31;

    /**
     * The height of the maze, in bricks.
     *
     * This is inclusive of the bottom wall, so it's actually a brick taller
     * than the play area.
     *
     * Note that in use, the top row is where the balls are stored at the start
     * of the game, and the row below that is always left empty at game start to
     * allow all balls a potential to move. Also, the last row in the play area
     * (that is not the bottom wall) is left clear as the goal line.
     *
     * @type {Number}
     */
    const MAZE_HEIGHT = 19;

    /**
     * When generating the random contents of the maze, we insert this many
     * teleport entities into the maze at random locations.
     *
     * @type {Number}
     */
    const TOTAL_TELEPORTERS = 5;

    /**
     * When generating the teleport entities, this specifies the minimum distance
     * that can occur between two adjacent teleporters.
     *
     * If this is set too high, maze generation will deadlock; be sensible.
     *
     * @type {Number}
     */
    const TELEPORT_MIN_DISTANCE = 2;

    /**
     * When generating the random contents of the maze, we generate a certain
     * number of arrows per row in the maze. This specifies the minimum and
     * maximum number of arrows that can be generated for each row in the maze.
     *
     * @type {Array}
     */
    const ARROWS_PER_ROW = [3, 8];

    /**
     * When generating the random contents of the maze, this is the percentage
     * chance that a row in the maze will have any gray bricks.
     *
     * @type {Number}
     */
    const GRAY_BRICK_CHANCE = 50;

    /**
     * When generating the random contents of the maze, we generate a certain
     * number of gray bricks per row (assuming we generate any at all, see
     * GRAY_BRICK_CHANCE).
     *
     * This specifies the minimum and maximum number of gray bricks that can
     * be generated into the row.
     * @type {Array}
     */
    const GRAY_BRICKS_PER_ROW = [1, 3];

    /**
     * When generating the random contents of the maze, this is the percentage
     * chance that a row in the maze will contain any bonus tiles.
     *
     * @type {Number}
     */
    const BONUS_BRICK_CHANCE = 40;

    /**
     * When generating the random contents of the maze, we generate a certain
     * number of bonus bricks per row (assuming we generate any at all, see
     * BONUS_BRICK_CHANCE).
     *
     * This specifies the minimum and maximum number of gray bricks that can
     * be generated into the row.
     *
     * @type {Array}
     */
    const BONUS_BRICKS_PER_ROW = [1, 2];

    /**
     * The entity that represents the maze in the game. This is the entire play
     * area of the game.
     */
    export class Maze extends Entity
    {
        /**
         * The contents of the maze, which is a collection of entities that are
         * expected to always have the same dimensions.
         */
        private _contents: Array<MazeCell>;

        /**
         * Our singular Brick entity that represents the empty (background)
         * brick.
         */
        private _empty : Brick;

        /**
         * Our singular brick entity that represents the solid (wall) brick.
         */
        private _solid : Brick;

        /**
         * Our singular black hole entity that represents all black holes in the
         * maze.
         */
        private _blackHole : Teleport;

        /**
         * An actor pool which contains all of the arrow entities we've created
         * so far. The arrows that are in the live list are currently in the
         * level.
         */
        private _arrows : ActorPool<Arrow>;

        /**
         * An actor pool which contains all of the gray brick entities we've
         * created so far. The bricks that are in the live list are currently in
         * the level.
         */
        private _grayBricks : ActorPool<Brick>;

        /**
         * An actor pool which contains all of the bonus brick entities we've
         * created so far. The bricks that are in the live list are currently
         * in the level.
         *
         * @type {ActorPool<Brick>}
         */
        private _bonusBricks : ActorPool<Brick>;

        /**
         * Construct a new empty maze entity.
         *
         * @param {Stage} stage the stage that we use to render ourselves
         */
        constructor (stage : Stage)
        {
            // Invoke the super; note that this does not set a position because
            // that is set by whoever created us. Our dimensions are based on
            // the size of the brick sprites, which we don't know yet.
            super ("maze", stage, 0, 0, 0, 0, 1, {}, {}, 'blue');

            // Set up a preload for the same sprite sheet that the brick entities
            // are using. This will allow us to capture the callback that
            // indicates that the sprite size is known, so that we can set up
            // our dimensions.
            new SpriteSheet (stage, "sprites_5_12.png", 5, 12, true, this.setDimensions);

            // Create our entity pools.
            this._arrows = new ActorPool<Arrow> ();
            this._grayBricks = new ActorPool<Brick> ();
            this._bonusBricks = new ActorPool<Brick> ();

            // Create our maze entities.
            this._empty = new Brick (stage, BrickType.BRICK_BACKGROUND);
            this._solid = new Brick (stage, BrickType.BRICK_SOLID);
            this._blackHole = new Teleport (stage);

            // For arrows, we will pre-populate the maximum possible number of
            // arrows into the arrow pool. The type and direction of these
            // arrows does not matter; all arrows are added dead anyway.
            //
            // We don't do this for the other pools because they don't contain
            // as many objects as the arrow pool does.
            for (let i = 0 ; i < (MAZE_HEIGHT - 4) * ARROWS_PER_ROW[1] ; i++)
                this._arrows.addEntity (new Arrow (stage), false);

            // Create the array that holds our contents. null entries are
            // treated as empty background bricks, so we don't need to do
            // anything further here.
            this._contents = new Array (MAZE_WIDTH * MAZE_HEIGHT);

            // Reset the maze
            this.reset ();
        }

        /**
         * This callback is invoked when our sprite sheet finishes loading the
         * underlying image for the sprites.
         */
        private setDimensions = (sheet : SpriteSheet) : void =>
        {
            // Alter our collision properties so that our bounds represent the
            // entire maze area.
            this.makeRectangle (sheet.width * MAZE_WIDTH, sheet.height * MAZE_HEIGHT);

            // Determine how much width is left on the stage that is not taken
            // up by us.
            let remainder = this._stage.width - this.width;

            // Set our position to center us on the screen horizontally and be
            // just slightly up from the bottom of the screen. We use half of
            // the remainder of the width, so that the bottom edge is as far
            // from the bottom of the screen as the side edges are.
            this.setStagePositionXY ((this._stage.width / 2) - (this.width  / 2),
                                     this._stage.height - this.height - (remainder / 2));
        }

        /**
         * This is called every frame update (tick tells us how many times this
         * has happened) to allow us to update ourselves.
         *
         * This invokes the superclass method, and then makes sure to also
         * invoke the update method for our animated MazeCell entities, so that
         * their animations will play as expected.
         *
         * @param {Stage}  stage the stage that we are on
         * @param {number} tick  the current engine tick; this advances once for
         * each frame update
         */
        update (stage : Stage, tick : number) : void
        {
            // Let the super do it's thing for us.
            super.update (stage, tick);

            // Make sure the black holes animate.
            this._blackHole.update (stage, tick);

            // Now update all of the entities in our various entity pools.
            this._arrows.update (stage, tick);
            this._grayBricks.update (stage, tick);
            this._bonusBricks.update (stage, tick);
        }

        /**
         * Fetch the internal contents of the maze at the provided X and Y
         * values.
         *
         * @param   {number}   x the maze X value to fetch
         * @param   {number}   y the maze Y value to fetch
         *
         * @returns {MazeCell}   the contents of the cell, or null. null will be
         * returned if the cell is empty or if the position provided is out of
         * bounds.
         */
        getCellAt (x : number, y : number) : MazeCell
        {
            // The bounds are invalid, so return null
            if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT)
                return null;

            // Return the contents of the cell, if any
            return this._contents[y * MAZE_WIDTH + x];
        }

        /**
         * Change the cell at the provided X and Y values in the maze to the cell
         * provided; if cell is null, this essentially sets an empty brick into
         * this position in the maze.
         *
         * If the bounds provided are not valid for the maze, nothing happens.
         *
         * @param {number}   x    the maze X value to set
         * @param {number}   y    the maze Y value to set
         * @param {MazeCell} cell the new cell to set, or null to set the
         * empty brick
         */
        setCellAt (x : number, y : number, cell : MazeCell) : void
        {
            // The bounds are invalid, so do nothing.
            if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT)
                return;

            // Set the brick at the location to the one provided.
            this._contents[y * MAZE_WIDTH + x] = cell;
        }

        /**
         * Check the internal contents of the maze at the provided X and Y
         * values and fetch the brick that is stored at that location.
         *
         * @param   {number} x the maze X value to check
         * @param   {number} y the maze Y value to check
         *
         * @returns {Brick} the brick at the given location; this will be the
         * background brick if this location does not contain a brick
         */
        getBrickAt (x : number, y : number) : Brick
        {
            // Get the cell at this location, and return it back, returning the
            // empty brick if needed.
            return (<Brick>this.getCellAt (x, y)) || this._empty;
        }

        /**
         * Change the brick at at the provided Z and Y values in the maze to the
         * brick provided; if brick is null, this essentially sets an empty
         * brick into this position in the grid.
         *
         * If the bounds provided are not valid for the maze, nothing happens.
         *
         * @param {number} x     the maze X value to set
         * @param {number} y     the maze Y value to set
         * @param {Brick}  brick the new brick to set, or null to set the empty
         * brick
         */
        setBrickAt (x : number, y : number, brick : Brick) : void
        {
            this.setCellAt (x, y, brick);
        }

        /**
         * Render us onto the stage provided at the given position.
         *
         * This renders us by displaying all entities stored in the maze.
         *
         * @param {number}   x        the X coordinate to start drawing at
         * @param {number}   y        the y coordinate to start drawing at
         * @param {Renderer} renderer the renderer to use to render
         */
        render (x : number, y : number, renderer : Renderer) : void
        {
            // Iterate over all columns and rows of bricks, and get them to
            // render themselves at the appropriate offset from the position
            // we've been given.
            for (let blitY = 0 ; blitY < MAZE_HEIGHT ; blitY++)
            {
                for (let blitX = 0 ; blitX < MAZE_WIDTH ; blitX++)
                {
                    // Get the cell at this position, using the empty brick
                    // cell if there isn't anything.
                    let cell = this.getCellAt (blitX, blitY) || this._empty;

                    // If the cell is not a brick entity of some kind, then it
                    // probably has a transparent background. So we should first
                    // render the empty cell to provide a background for it.
                    if (cell instanceof Brick == false)
                        this._empty.render (x + (blitX * 25), y + (blitY * 25), renderer);

                    cell.render (x + (blitX * 25), y + (blitY * 25), renderer);
                }
            }
        }

        /**
         * Prepare for maze generation by resetting the contents of the maze to
         * be empty.
         *
         * The entire contents of the maze is set to be the empty background
         * brick, followed by wrapping the edges in the bounding bricks that
         * stop the ball from falling out of the maze.
         */
        private emptyMaze () : void
        {
            // First, every brick needs to be a background brick. To do this we
            // just need to clear the entry in the array.
            for (let i = 0 ; i < this._contents.length ; i++)
                this._contents[i] = null;

            // Now the left and right sides need to be solid bricks.
            for (let y = 0 ; y < MAZE_HEIGHT ; y++)
            {
                this.setBrickAt (0, y, this._solid);
                this.setBrickAt (MAZE_WIDTH - 1, y, this._solid);
            }

            // Lastly, the bottom row needs to be made solid, except for the
            // first and last columns, which have already been filled out.
            for (let x = 1 ; x < MAZE_WIDTH - 1 ; x++)
                this.setBrickAt (x, MAZE_HEIGHT - 1, this._solid);
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
                    if (this.getCellAt (x, y) != null)
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
                    this.setCellAt (x, y, this._blackHole);
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
                    if (this.getCellAt (column, row) != null ||
                        (this.getCellAt (column, row - 1) instanceof Teleport))
                        continue;

                    // This cell contains an arrow; resurrect one from the object
                    // pool. If there isn't one to resurrect, create one and add
                    // add it to the pool.
                    let arrow : Arrow = this._arrows.resurrectEntity ();
                    if (arrow == null)
                    {
                        arrow = new Arrow (this._stage);
                        this._arrows.addEntity (arrow, true);
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
                    this.setCellAt (column, row, arrow);
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
                    if (this.getCellAt (column, row) != null ||
                        (this.getCellAt (column, row - 1) instanceof Arrow))
                        continue;

                    // This cell contains brick; resurrect one from the object
                    // pool. If there isn't one to resurrect, create one and add
                    // add it to the pool.
                    let brick : Brick = this._grayBricks.resurrectEntity ();
                    if (brick == null)
                    {
                        brick = new Brick (this._stage, BrickType.BRICK_GRAY);
                        this._grayBricks.addEntity (brick, true);
                    }

                    // Make sure the brick starts out growing into place.
                    brick.playAnimation ("gray_appear");

                    // Add it to the maze and count it as placed.
                    this.setCellAt (column, row, brick);
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
                    if (this.getCellAt (column, row) != null ||
                        (this.getCellAt (column, row - 1) instanceof Arrow))
                        continue;

                    // This cell contains brick; resurrect one from the object
                    // pool. If there isn't one to resurrect, create one and add
                    // add it to the pool.
                    let brick : Brick = this._grayBricks.resurrectEntity ();
                    if (brick == null)
                    {
                        brick = new Brick (this._stage, BrickType.BRICK_BONUS);
                        this._grayBricks.addEntity (brick, true);
                    }

                    // Make sure the brick starts out growing into place.
                    brick.playAnimation ("bonus_appear");

                    // Add it to the maze and count it as placed.
                    this.setCellAt (column, row, brick);
                    brickCount--;
                }
            }
        }

        /**
         * Reset the maze.
         *
         * This will modify the bricks in the maze to represent a new randomly
         * created, empty maze.
         */
        reset () : void
        {
            // Prepare the maze; this empties out the current contents (if any)
            // and gives us a plain empty maze that is surrounded with the
            // bounding bricks that we need.
            this.emptyMaze ();

            // Now generate the contents of the maze.
            this.genBlackHoles ();
            this.genArrows ();
            this.genGrayBricks ();
            this.genBonusBricks ();
        }
    }

}