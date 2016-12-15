module nurdz.game
{
    /**
     * This class contains the code used to generate the content of a new maze.
     * It requires access to the Maze entity so that it can get at the content
     * and perform its task.
     */
    export class MazeDebugger
    {
        /**
         * The maze entity that we are debugging for.
         */
        private _maze : Maze;

        /**
         * The contents of the maze entity we were given; we use this as a
         * shortcut to get at the maze content.
         */
        private _contents : MazeContents;

        /**
         * The entity that is used to wall off the maze.
         */
        private _wall : MazeCell;

        /**
         * The entity that acts as the teleporter in our maze.
         */
        private _teleport : Teleport;

        /**
         * True if we are debugging, false otherwise.
         *
         * When this is true, the current debug cell in the grid (controlled via
         * the mouse) has a marker to show where it is.
         */
        private _debugTracking : boolean;

        /**
         * A point that represents a grid cell that is the current debug cell.
         *
         * The position of this cell is controlled by the mouse while debugging
         * it turned on.
         */
        private _debugPoint : Point;

        /**
         * Set the wall object that was used to generate walls in the maze.
         *
         * If this is not set, debugging logic may not correctly stop debugging
         * options like deleting objects from operating on the walls.
         *
         * @param {MazeCell} newWall the entity to use for the wall.
         */
        set wall (newWall : MazeCell)
        { this._wall = newWall; }

        /**
         * Set the entity that was used to generate the teleport objects in the
         * maze.
         *
         * If this is not set, debugging logic may not correctly process debugging
         * options such as adding or deleting teleport instances.
         *
         * @param {Teleport} newTeleporter the entity to use for the teleporter
         */
        set teleporter (newTeleporter : Teleport)
        { this._teleport = newTeleporter; }

        /**
         * Get the currently set debug point in this object. This represents the
         * last position in the maze that the mouse passed over while debugging
         * was turned on.
         *
         * @returns {Point} the last known debug point
         */
        get debugPoint () : Point
        { return this._debugPoint; }

        /**
         * Set a new debug point for this object. This will be used as the locus
         * for all future debug operations that require a specific location to
         * operate.
         *
         * @param {Point} newPoint the new point to use for debugging
         */
        set debugPoint (newPoint : Point)
        { this._debugPoint.setTo (newPoint); }

        /**
         * Get the current state of the debug tracking variable.
         *
         * When this is set to true, we display a marker on the stage at the
         * current debug position.
         *
         * @returns {boolean} true if debugging is enabled, false otherwise.
         */
        get debugTracking () : boolean
        { return this._debugTracking; }

        /**
         * Change the current state of the debug tracking variable.
         *
         * True enables debugging, which causes the maze to display a red marker
         * at the current debug location.
         *
         * @param {boolean} newValue new debugging state
         */
        set debugTracking (newValue : boolean)
        { this._debugTracking = newValue; }

        /**
         * Construct a new debugger object that can debug the provided maze object.
         *
         * @param {Maze} maze the maze object to deb
         */
        constructor (maze : Maze)
        {
            // Store the maze and get it's contents.
            this._maze = maze;
            this._contents = maze.contents;

            // By default there is no wall or teleporter.
            this._wall = null;
            this._teleport = null;

            // Create a default debug point.
            this._debugPoint = new Point (0, 0);

            // No debugging by default, but the debugging point is the upper
            // left grid corner;.
            this._debugTracking = false;
        }

        /**
         * Get the cell at the current debug location in the maze grid.
         *
         * This calls getCellAt() with the last known debug location, which
         * means that the return value may return null to indicate that there is
         * no maze contents at this location.
         *
         * @returns {MazeCell|null} the cell at this location in the maze, if
         * any
         */
        getDebugCell () : MazeCell
        {
            return this._contents.getCellAt (this._debugPoint.x, this._debugPoint.y);
        }

        /**
         * Set the cell at the current debug location in the grid to the cell
         * provided.
         *
         * @param {MazeCell} newCell the new cell to insert into the grid
         */
        setDebugCell (newCell : MazeCell) : void
        {
            this._contents.setCellAt (this._debugPoint.x, this._debugPoint.y, newCell);
        }

        /**
         * DEBUG METHOD
         *
         * Remove the contents of an existing cell from the maze, returning the
         * object back into its pool.
         *
         * This currently does not work on Teleport entities, since they need
         * special action to work.
         */
        debugClearCell () : void
        {
            // Get the debug cell and leave if there isn't one.
            let cell = this.getDebugCell ();
            if (cell == null)
                return;

            // There is a single Teleport entity, so all we have to do is remove
            // the current location as a destination.
            if (cell.name == "blackHole")
                this._teleport.clearDestination (this._debugPoint);

            // Not a teleport; if this entity has an actor pool, remove it from
            // the pool.
            else if (cell.pool != null)
                cell.kill ();

            // The entity doesn't have an actor pool. The only time this happens
            // is for a Teleport (already handled) or a boundary wall, which we
            // do not allow deleting.
            else
            {
                console.log ("Cannot delete boundary bricks");
                return;
            }

            // Clear the contents of the cell now.
            this.setDebugCell (null);
        }

        /**
         * Wipe the entire contents of the maze, killing all entities. This will
         * leave only the bounding bricks that stop the ball from going out of
         * bounds.
         */
        debugWipeMaze ()
        {
            // Reset all entities, then generate walls into the maze to clear it
            // back to a known state.
            this._maze.resetMazeEntities ();
            this._maze.generator.emptyMaze ();
        }

        /**
         * DEBUG METHOD
         *
         * Toggle an existing cell through its subtypes (for cells that support
         * this).
         *
         * If the debug point is empty or not of a toggle-able type, this does
         * nothing.
         */
        debugToggleCell () : void
        {
            // Get the debug cell and leave if there isn't one.
            let cell = this.getDebugCell ();
            if (cell == null)
                return;

            // If the cell is an arrow, toggle the type. Doing this will also
            // implicitly set an auto-flip timer on the arrow when it becomes
            // such an arrow.
            if (cell.name == "arrow")
            {
                let arrow = <Arrow> cell;
                if (arrow.arrowType == ArrowType.ARROW_AUTOMATIC)
                    arrow.arrowType = ArrowType.ARROW_NORMAL;
                else
                    arrow.arrowType = ArrowType.ARROW_AUTOMATIC;
                return;
            }

            // If the cell is a ball, toggle the type.
            if (cell.name == "ball")
            {
                let ball = <Ball> cell;
                if (ball.ballType == BallType.BALL_PLAYER)
                    ball.ballType = BallType.BALL_COMPUTER;
                else
                    ball.ballType = BallType.BALL_PLAYER;
                ball.appear ();
                return;
            }

            // If the cell is a brick, toggle the type. This will change the visual
            // representation back to the idle state for this brick type.
            //
            // This is skipped for solid bricks; they're just used on the outer
            // edges and should not be messed with.
            if (cell.name == "brick" && cell != this._wall)
            {
                // Get the brick at the current location.
                let currentBrick = <Brick> cell;
                let newBrick : Brick = null;

                // We keep a separate pool of bonus bricks and gray bricks.
                //
                // In order to swap, we need to get an existing brick from the
                // opposite pool, then put it into place and kill the other one.
                if (currentBrick.brickType == BrickType.BRICK_BONUS)
                    newBrick = this._maze.getGrayBrick ();
                else if (currentBrick.brickType == BrickType.BRICK_GRAY)
                    newBrick = this._maze.getBonusBrick ();

                // If we got a brick, play the animation to cause it to appear,
                // then put it into the maze and kill the current brick in the
                // pool that it came from.
                if (newBrick != null)
                {
                    newBrick.appear ();
                    this.setDebugCell (newBrick);
                    currentBrick.kill ();
                }
                else
                    console.log ("Cannot toggle brick; not enough entities in currentBrickPool");

                return;
            }

            console.log ("Cannot toggle entity; it does not support toggling");
        }

        /**
         * DEBUG METHOD
         *
         * Add a brick to the maze at the current debug location (assuming one
         * is available).
         *
         * This will add a gray brick, unless there are none left in the pool,
         * in which case it will try to add a bonus brick instead.
         *
         * If the current location is not empty, this does nothing.
         */
        debugAddBrick () : void
        {
            // We can only add a brick if the current cell is empty.
            if (this.getDebugCell () == null)
            {
                // Get a brick from one of the pools. We try the gray brick
                // first since that pool is larger.
                let newBrick = this._maze.getGrayBrick ();
                if (newBrick == null)
                    newBrick = this._maze.getBonusBrick ();

                // If we got a brick, appear it and add it to the maze.
                if (newBrick)
                {
                    newBrick.appear ();
                    this.setDebugCell (newBrick);
                }
                else
                    console.log ("Unable to add brick; no entities left in either pool");
            }
            else
                console.log ("Cannot add brick; cell is not empty");
        }

        /**
         * Vanish all of the bricks of a set type based on the parameter. Any
         * brick of the given type that is not already gone will vanish away.
         *
         * @param {boolean} grayBricks true to vanish gray bricks, false to
         * vanish bonus bricks.
         */
        debugVanishBricks (grayBricks : boolean) : void
        {
            for (let row = 0 ; row < MAZE_HEIGHT ; row++)
            {
                for (let col = 0 ; col < MAZE_WIDTH ; col++)
                {
                    let cell = this._contents.getCellAt (col, row);
                    if (cell != null && cell.name == "brick")
                    {
                        let brick = <Brick> cell;
                        if (brick.isHidden == false &&
                            brick.brickType == (grayBricks ? BrickType.BRICK_GRAY : BrickType.BRICK_BONUS))
                            brick.vanish ();
                    }
                }
            }
        }

        /**
         * DEBUG METHOD
         *
         * Add a teleport destination to the maze at the current debug location
         * (assuming one is available).
         *
         * There is only a single Teleport instance, so this always works and
         * just adds another potential destination to the list.
         *
         * If the current location is not empty, this does nothing.
         */
        debugAddTeleport () : void
        {
            // We can only add an exit point if the current cell is empty.
            if (this.getDebugCell () == null)
            {
                // Add the destination and the entity
                this._teleport.addDestination (this._debugPoint);
                this.setDebugCell (this._teleport);
            }
            else
                console.log ("Cannot add teleport; cell is not empty");
        }

        /**
         * DEBUG METHOD
         *
         * Add an arrow to the maze at the current debug location (assuming one
         * is available).
         *
         * This will add a normal, right facing arrow. The type of the arrow can
         * be toggled with the toggle command.
         *
         * If the current location is not empty, this does nothing.
         */
        debugAddArrow () : void
        {
            // We can only add an arrow if the current cell is empty.
            if (this.getDebugCell () == null)
            {
                // Try to get the arrow out of the pool; if it works, we can
                // set it's type and add it.
                let arrow = this._maze.getArrow ();
                if (arrow != null)
                {
                    arrow.arrowType = ArrowType.ARROW_NORMAL;
                    arrow.arrowDirection = ArrowDirection.ARROW_RIGHT;
                    this.setDebugCell (arrow);
                }
                else
                    console.log ("Cannot add arrow; no entities left in pool");
            }
            else
                console.log ("Cannot add arrow; cell is not empty");
        }

        /**
         * DEBUG METHOD
         *
         * Add a player ball to the maze at the current debug location (assuming
         * one is available).
         *
         * If the current location is not empty, this does nothing.
         */
        debugAddBall () : void
        {
            // We can only add a ball if the current cell is empty.
            if (this.getDebugCell () == null)
            {
                // Try to get the ball out of the pool; if it works, we can
                // set it's type and add it.
                let ball = this._maze.getBall ();
                if (ball != null)
                {
                    ball.ballType = BallType.BALL_PLAYER;
                    ball.appear ();
                    this.setDebugCell (ball);
                }
                else
                    console.log ("Cannot add ball; no entities left in pool");
            }
            else
                console.log ("Cannot add ball; cell is not empty");
        }

    }
}