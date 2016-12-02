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
     * @type {Number}
     */
    const MAZE_HEIGHT = 19;

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
         * Our singular brick entity that represents the solid brick.
         */
        private _solid : Brick;

        /**
         * Our singular black hole entity that represents all black holes in the
         * maze.
         */
        private _blackHole : Teleport;

        /**
         * Our test arrow; this is for development testing.
         *
         * @type {Arrow}
         */
        private _arrow : Arrow;

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

            // Create our maze entities.
            this._empty = new Brick (stage, BrickType.BRICK_BACKGROUND);
            this._solid = new Brick (stage, BrickType.BRICK_SOLID);
            this._blackHole = new Teleport (stage);
            this._arrow = new Arrow (stage, ArrowType.ARROW_AUTOMATIC, ArrowDirection.ARROW_LEFT);

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

            // Set our position to center us on the screen horizontally and be
            // just slightly up from the bottom of the screen.
            this.setStagePositionXY ((this._stage.width / 2) - (this.width  / 2),
                                     this._stage.height - this.height - 16);
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
            super.update (stage, tick);
            this._blackHole.update (stage, tick);
            this._arrow.update (stage, tick);

            // Swap the direction of the arrow every 2 seconds.
            if (tick % 60 == 0)
                this._arrow.flip ();
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
         * Reset the maze.
         *
         * This will modify the bricks in the maze to represent a new randomly
         * created, empty maze.
         */
        reset () : void
        {
            // First, every brick needs to be a background brick. To do this we
            // just need to clear the entry in the array.
            for (let i = 0 ; i < this._contents.length ; i++)
                this._contents[i] = null;

            // Temporarily include a black hole so we can make sure everything
            // works as expected.
            this.setCellAt (5, 5, this._blackHole);
            this.setCellAt (6, 5, this._arrow);

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
    }

}