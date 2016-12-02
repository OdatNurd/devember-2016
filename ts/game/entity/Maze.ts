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

            // Create both our empty brick and our solid brick for use in maps.
            this._empty = new Brick (stage, BrickType.BRICK_BACKGROUND);
            this._solid = new Brick (stage, BrickType.BRICK_SOLID);

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
            // The bounds are invalid, so return the default.
            if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT)
                return this._empty;

            // Return the contents of the maze as a brick; if there is no brick
            // at this location, return the default instead.
            return (<Brick>this._contents[y * MAZE_WIDTH + x]) || this._empty;
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
            // The bounds are invalid, so do nothing.
            if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT)
                return;

            // Set the brick at the location to the one provided.
            this._contents[y * MAZE_WIDTH + x] = brick;
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
                    this.getBrickAt(blitX, blitY).render (
                        x + (blitX * 25),
                        y + (blitY * 25),
                        renderer);
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