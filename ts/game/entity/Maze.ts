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
         *
         * @type {Array<Brick>}
         */
        private _contents: Array<Brick>;

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

            // Create the array that holds our contents and fill it with
            // instances of the brick entity.
            this._contents = new Array (MAZE_WIDTH * MAZE_HEIGHT);
            for (let i = 0 ; i < MAZE_WIDTH * MAZE_HEIGHT ; i++)
                this._contents[i] = new Brick (stage);

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
                    this._contents[blitY * MAZE_WIDTH + blitX].render (
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
            // First, every brick needs to be a background brick.
            for (let i = 0 ; i < this._contents.length ; i++)
                this._contents[i].brickType = BrickType.BRICK_BACKGROUND;

            // Now the left and right sides need to be solid bricks.
            for (let y = 0 ; y < MAZE_HEIGHT ; y++)
            {
                this._contents[y * MAZE_WIDTH].brickType = BrickType.BRICK_SOLID;
                this._contents[y * MAZE_WIDTH + (MAZE_WIDTH - 1)].brickType = BrickType.BRICK_SOLID;
            }

            // Lastly, the bottom row needs to be made solid, except for the
            // first and last columns, which have already been filled out.
            for (let x = 1 ; x < MAZE_WIDTH - 1 ; x++)
                this._contents[(MAZE_HEIGHT - 1) * MAZE_WIDTH + x].brickType = BrickType.BRICK_SOLID;
        }
    }

}