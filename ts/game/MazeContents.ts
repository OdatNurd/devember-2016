module nurdz.game
{
    /**
     * The width of the maze, in bricks.
     *
     * This is inclusive of the side walls, so it's actually 2 bricks wider than
     * the play area.
     */
    export const MAZE_WIDTH = 31;

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
     */
    export const MAZE_HEIGHT = 19;

    /**
     * This class is used to represent the content of the maze. This wraps the
     * data structure that actually contains the maze data as well as access
     * routines to set/change it.
     */
    export class MazeContents
    {
        /**
         * The contents of the maze. This is just an array of MazeCell entities
         * that represent the content at any given location, which is treated
         * as a 2D grid.
         */
        private _contents : Array<MazeCell>;

        /**
         * The set of balls that the human player has to play with. This is the
         * same size as the width of the content area (less the walls) and can
         * be swapped into the top row of the maze when it is the human player
         * turn.
         */
        private _playerBalls : Array<Ball>;

        /**
         * The set of balls that the computer player has to play with. This is
         * the same size as the width of the content area (less the walls) and
         * can be swapped into the top row of the maze when it is the computer
         * player turn.
         */
        private _computerBalls : Array<Ball>;

        /**
         * This is an array the same size as the _contents array which contains
         * a boolean that indicates if this position should be marked with a
         * debug marker or not.
         */
        private _markers : Array <boolean>;

        /**
         * The position on the stage that this maze content will be rendered at.
         * This is used to tell cells added to the maze what their location is
         * so that they will render appropriate.
         */
        private _position : Point;

        /**
         * The size (in pixels) of cells in the maze. All grid cells are assumed
         * to be square in dimension. This value defaults to 0. If left unset,
         * the position of cells on the screen will not be updated as they are
         * added.
         */
        private _cellSize : number;

        /**
         * Get the current position assigned to this maze content instance. This
         * value is used to update the position of added cells so that they know
         * where to render themselves on the screen.
         *
         * @returns {Point} the set position of this maze content on the stage
         */
        get position () : Point
        { return this._position; }

        /**
         * Get the current position assigned to this maze content instance. This
         * value is used to update the position of added cells so that they know
         * where to render themselves on the screen.
         *
         * @param {Point} newPosition the new position for this maze content on
         * the stage
         */
        set position (newPosition : Point)
        { this._position.setTo (newPosition); }

        /**
         * Get the cell size of cells in this maze content instance. This value
         * is used to calculate the render position of added cells so that they
         * know where to render themselves on the screen.
         *
         * @returns {number} the current cell size
         */
        get cellSize () : number
        { return this._cellSize; }

        /**
         * Set the cell size of cells in this maze content instance. This value
         * is used to calculate the render position of added cells so that they
         * know where to render themselves on the screen.
         *
         * @param {number} newSize the new cell size
         */
        set cellSize (newSize : number)
        { this._cellSize = newSize; }

        /**
         * Get the array of balls that represents the balls that the human
         * player is allowed to push into the maze. This is stored separate from
         * the maze content in general so that it can be swapped in and out as
         * needed.
         *
         * @returns {Array<Ball>} the array of balls; indicies that are null
         * indicate the ball at this location has already been pushed.
         */
        get playerBalls () : Array<Ball>
        { return this._playerBalls; }

        /**
         * Get the array of balls that represents the balls that the computer
         * player is allowed to push into the maze. This is stored separate from
         * the maze content in general so that it can be swapped in and out as
         * needed.
         *
         * @returns {Array<Ball>} the array of balls; indicies that are null
         * indicate the ball at this location has already been pushed.
         */
        get computerBalls () : Array<Ball>
        { return this._computerBalls; }

        /**
         * Construct a new maze content object. This will create the underlying
         * data structure and initialize it to be completely devoid of cells
         * and markers.
         */
        constructor ()
        {
            // Create the content and marker arrays.
            this._contents = new Array (MAZE_WIDTH * MAZE_HEIGHT);
            this._markers = new Array (MAZE_WIDTH * MAZE_HEIGHT);

            // Create the arrays that store the balls that the human and
            // computer players play with. These are not permanently stored in
            // the maze because their starting positions occupy the same part of
            // the maze.
            this._playerBalls = new Array<Ball> (MAZE_WIDTH - 2);
            this._computerBalls = new Array<Ball> (MAZE_WIDTH - 2);

            // Create a position point and set a default cell size.
            this._position = new Point (0, 0);
            this._cellSize = 0;

            // Start everything cleared out. This ensures that the arrays are
            // properly initialized.
            this.clearCells ();
            this.clearMarkers ();
        }

        /**
         * Mark the location provided as containing a marker. Locations that
         * are out of bounds are silently ignored.
         *
         * @param {number} x the X coordinate to put a marker at
         * @param {number} y the Y coordinate to put a marker at
         */
        setMarkerAt (x : number, y : number) : void
        {
            // If the bounds are invalid, do nothing.
            if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT)
                return;

            // Set the flag for a marker at this location.
            this._markers[y * MAZE_WIDTH + x] = true;
        }

        /**
         * Remove any marker that might be set at the provided location. Locations
         * that are out of bounds are silently ignored.
         *
         * @param {number} x the X coordinate to clear the marker from
         * @param {number} y the Y coordinate to clear the marker from
         */
        clearMarkerAt (x : number, y : number) : void
        {
            // If the bounds are invalid, do nothing.
            if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT)
                return;

            // Clear the flag for a marker at this location.
            this._markers[y * MAZE_WIDTH + x] = false;
        }

        /**
         * Check to see if there is a marker at the provided location. Locations
         * that are out of bounds always return no marker.
         *
         * @param   {number}  x the X coordinate to check in the maze
         * @param   {number}  y the Y coordinate to check in the maze
         *
         * @returns {boolean}   true if this position contains a marker, or
         * false otherwise
         */
        hasMarkerAt (x : number, y : number) : boolean
        {
            // The bounds are invalid, so no marker
            if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT)
                return false;

            // There is only a marker if this location is true.
            return this._markers[y * MAZE_WIDTH + x] == true;
        }


        /**
         * Toggle the marker that is at the provided location, swapping its state. Locations
         * that are out of bounds are silently ignored.
         *
         * @param {number} x the X coordinate to toggle
         * @param {number} y the Y coordinate to toggle
         */
        toggleMarkerAt (x : number, y : number) : void
        {
            // Set the state as appropriate. Bounds checking can be done by the
            // other methods.
            if (this.hasMarkerAt (x, y))
                this.clearMarkerAt (x, y);
            else
                this.setMarkerAt (x, y);
        }

        /**
         * Clear all markers that are set.
         */
        clearMarkers () : void
        {
            // Clear markers at all locations.
            for (let i = 0 ; i < MAZE_WIDTH * MAZE_HEIGHT ; i++)
                this._markers[i] = false;
        }

        /**
         * Get the name of the cell at the given location in the name. This will
         * return the name field of the MazeCell object that is stored at this
         * location, or null if the cell is empty or if the location provided is
         * out of bounds for the dimensions of the maze.
         *
         * @param   {number} x the X location to fetch the name of
         * @param   {number} y the Y location to fetch the name of
         *
         * @returns {string}   the name of the specified field, or null if the
         * cell is empty or out of bounds.
         */
        cellNameAt (x : number, y : number) : string
        {
            let cell = this.getCellAt (x, y);
            return (cell == null) ? null : cell.name;
        }

        /**
         * Collect the cell at the provided location in the maze. This will
         * return the cell that was originally stored at this location, which
         * will be null if this cell is empty or if the location provided is out
         * of bounds for the dimensions of the maze.
         *
         * @param   {number}   x the X location to fetch from
         * @param   {number}   y the Y location to fetch from
         *
         * @returns {MazeCell}   the cell at this location, or null if there is
         * none
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
         * Store the cell given into the cell at the given location in the maze.
         * When a cell is stored, its position in the grid and on the screen is
         * updated so that when later queried it can say where it came from or
         * where it should render to.
         *
         * If the cell is null, this clears the cell at the provided location in
         * the grid.
         *
         * If the location provided is out of bounds for the dimensions of the
         * maze, nothing happens. In particular, if this happens and the cell
         * provided is non-null, its position will not be updated as mentioned
         * above.
         *
         * @param {number}   x    the X location to store to
         * @param {number}   y    the Y location to store to
         * @param {MazeCell} cell the cell to store; null to clear this location
         */
        setCellAt (x : number, y : number, cell : MazeCell) : void
        {
            // The bounds are invalid, so do nothing.
            if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT)
                return;

            // Set the brick at the location to the one provided.
            this._contents[y * MAZE_WIDTH + x] = cell;

            // If we are storing a cell, set the position values in it as well.
            if (cell != null)
            {
                // The position provided is the map position, so we can just set
                // that.
                cell.mapPosition.setToXY (x, y);

                // The screen position is an offset from our position based on
                // the map position and the size of the cells, so calculate and
                // set that now.
                cell.position.setToXY (this._position.x + (x * this._cellSize),
                                       this._position.y + (y * this._cellSize));
            }
        }

        /**
         * Clear the cell (if any) stored at the given location in the maze. This
         * is equivalent to calling setCellAt() with a null cell.
         *
         * @param {number} x the X location to clear
         * @param {number} y the Y location to clear
         */
        clearCellAt (x : number, y : number) : void
        {
            this.setCellAt (x, y, null);
        }

        /**
         * Clear the contents of all cells.
         */
        clearCells () : void
        {
            // Clear cells at all locations.
            for (let i = 0 ; i < MAZE_WIDTH * MAZE_HEIGHT ; i++)
                this._contents[i] = null;

            // Ensure that the ball arrays for both players are fully empty.
            for (let i = 0 ; i < MAZE_WIDTH - 2 ; i++)
            {
                this._playerBalls[i] = null;
                this._computerBalls[i] = null;
            }
        }

        /**
         * Given an array of balls which is the full size of the content area of
         * the maze (less the walls on either sides), check and see if any of
         * the balls still in this array are playable or not.
         *
         * A ball is considered playable if the row directly under it is not
         * blocked by something.
         *
         * This checks the array for the presence of the ball and then the
         * current content of the maze below it to determine if it is playable;
         * thus this does not require the balls to be stored in the content
         * array.
         *
         * @param   {Array<Ball>} ballArray the ball array to check
         *
         * @returns {boolean}               true if any ball is playable, false
         * otherwise
         */
        private playableBallsInArray (ballArray : Array<Ball>) : boolean
        {
            // Scan all balls in the ball array.
            for (let ballIndex = 0 ; ballIndex < ballArray.length ; ballIndex++)
            {
                // We only need to do something if there is a ball at this index
                // in the array.
                if (ballArray[ballIndex] != null)
                {
                    // The index is the offset from the first content column in
                    // the maze; if the cell below that column is not a blocking
                    // cell, this ball is playable.
                    //
                    // This has to always assume no simulation.
                    if (this.getBlockingCellAt (ballIndex + 1, 1, false) == null)
                        return true;
                }
            }

            // There must be nothing playable.
            return false;
        }

        /**
         * Check to see if the human player has any balls that are still
         * playable or not.
         *
         * This does not require the human player balls to be swapped into the
         * maze first.
         *
         * @returns {boolean} true if the human player has any playable balls or
         * false otherwise.
         */
        hasPlayableHumanBall () : boolean
        {
            return this.playableBallsInArray (this._playerBalls);
        }

        /**
         * Check to see if the computer player has any balls that are still
         * playable or not.
         *
         * This does not require the computer player balls to be swapped into
         * the maze first.
         *
         * @returns {boolean} true if the computer player has any playable balls
         * or false otherwise.
         */
        hasPlayableComputerBall () : boolean
        {
            return this.playableBallsInArray (this._computerBalls);
        }

        /**
         * Copy the balls from the ball array provided into the first row of the
         * maze. Any missing balls become a null entry in the maze contents.
         *
         * During the restore, every ball that is restored is marked as being
         * idle so that it will visually appear on the screen.
         *
         * @param {Array<Ball>} ballArray the ball array to store into the maze
         */
        private restoreFromBallArray (ballArray : Array<Ball>) : void
        {
            // Replace the top row of the maze contents with the ball array. The
            // ball index in the array is the offset from the first column in
            // the maze contents.
            for (let ballIndex = 0 ; ballIndex < ballArray.length ; ballIndex++)
            {
                this.setCellAt (ballIndex + 1, 0, ballArray[ballIndex]);
                if (ballArray[ballIndex] != null)
                    ballArray[ballIndex].idle ();
            }
        }

        /**
         * Invoke the hide method for all balls currently in the array provided,
         * removing them from the screen.
         *
         * @param {Array<Ball>} ballArray the array of balls to hide
         */
        private hideBallsInArray (ballArray : Array<Ball>) : void
        {
            // Iterate all balls in the provided array and hide them.
            for (let ballIndex = 0; ballIndex < ballArray.length ; ballIndex++)
            {
                if (ballArray[ballIndex] != null)
                    ballArray[ballIndex].hide ();
            }
        }

        /**
         * Given a ball, this checks to see if this ball entity exists in either
         * the list of unplayed player balls or unplayed computer balls. If the
         * ball is found in one of those arrays, it is removed from the array so
         * that the code knows that this ball has now been played.
         *
         * @param {Ball} ball the ball to remove
         */
        markBallPlayed (ball : Ball) : void
        {
            // Try it first as a player ball.
            let index = this._playerBalls.indexOf (ball);
            if (index != -1)
                this._playerBalls[index] = null;
            else
            {
                index = this._computerBalls.indexOf (ball)
                if (index != -1)
                    this._computerBalls[index] = null;
            }

            // The code can get here if the debug code starts a ball moving or
            // during the final ball drop, where this method gets called but
            // the ball pushed is not contained in either of the arrays.
        }

        /**
         * Replace the top row contents of the maze with the list of balls that
         * remain to be played for the player and simultaneously hide all of the
         * computer balls still in the top row.
         */
        showPlayerBalls () : void
        {
            this.restoreFromBallArray (this._playerBalls);
            this.hideBallsInArray (this._computerBalls);
        }

        /**
         * Replace the top row contents of the maze with the list of balls that
         * remain to be played for the computer and simultaneously hide all of
         * the player balls still in the top row.
         */
        showComputerBalls () : void
        {
            this.restoreFromBallArray (this._computerBalls);
            this.hideBallsInArray (this._playerBalls);
        }

        /**
         * Check the maze at the given position to see if it is blocked for ball
         * movement or not. A cell is blocked when it contains a cell that
         * blocks the ball from moving and unblocked otherwise (including when
         * it is empty).
         *
         * When the location specified is blocked, it's contents are returned
         * back to the caller because we almost always want to interact with
         * such an entity further.
         *
         * @param   {number}  x            the x location to check
         * @param   {number}  y            the y location to check
         * @param   {boolean} isSimulation indication if this block is happening
         * during a simulation or not
         *
         * @returns {MazeCell}             null if the given location is not
         * blocked, or the entity that is blocking the ball if the position is
         * blocked
         */
        getBlockingCellAt (x : number, y : number, isSimulation : boolean) : MazeCell
        {
            let cell = this.getCellAt (x, y);
            if (cell == null || cell.blocksBall (isSimulation) == false)
                return null;
            return cell;
        }
    }
}