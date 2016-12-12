module nurdz.game
{
    /**
     * The width of the maze, in bricks.
     *
     * This is inclusive of the side walls, so it's actually 2 bricks wider than
     * the play area.
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
     */
    const MAZE_HEIGHT = 19;

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
     * The entity that represents the maze in the game. This is the entire play
     * area of the game.
     */
    export class Maze extends Entity
    {
        /**
         * This is an array the same size as the _contents array which contains
         * a boolean that indicates if this position should be marked with a
         * debug marker or not.
         */
        private _markers : Array <boolean>;

        /**
         * The contents of the maze, which is a collection of entities that are
         * expected to always have the same dimensions.
         */
        private _contents : Array<MazeCell>;

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
         * Our singular marker entity; this is used to render a marker at all
         * marked locations.
         */
        private _marker : Marker;

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
         */
        private _bonusBricks : ActorPool<Brick>;

        /**
         * An actor pool which contains all of the ball entities we've created.
         * This is always a set number.
         */
        private _balls : ActorPool<Ball>;

        /**
         * If a ball is actively dropping through the maze, this value will be
         * the ball entity that is dropping down. In this case the ball is not
         * currently considered a part of the maze (it is removed from the
         * grid entirely) and will be added back when it starts moving.
         *
         * When this value is null, no ball is currently dropping.
         */
        private _droppingBall : Ball;

        /**
         * The entire tick the last time the ball dropped down or otherwise moved.
         *
         * When this value plus _dropSpeed meets or exceeds the current engine
         * tick, the ball needs to take a new movement step.
         */
        private _lastDropTick : number;

        /**
         * The number of ticks between drop movements in the ball. Ticks are
         * counted in frames per second and the engine runs at 30fps (or tries
         * to), so a value of 30 means 1 second between steps.
         *
         * @type {number}
         */
        private _dropSpeed : number;

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
         * A special marker instance that is used to show the current debug
         * point while debug tracking is turned on.
         *
         * This is like a regular marker but displays in an alternate color to
         * distinguish it.
         */
        private _debugMarker : Marker;

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
         * Get the size (in pixels) of the cells in the maze based on the
         * current sprite set. The cells are square, so this represents both
         * dimensions.
         *
         * @returns {number} the pixel size of the cells in the grid
         */
        get cellSize () : number
        { return this._empty.width; }

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
            this._balls = new ActorPool<Ball> ();

            // Create our maze entities; the marker entity is deferred until
            // we know the dimensions of the sprites in the sprite sheet.
            this._empty = new Brick (stage, BrickType.BRICK_BACKGROUND);
            this._solid = new Brick (stage, BrickType.BRICK_SOLID);
            this._blackHole = new Teleport (stage);

            // There is no ball dropping by default; also set up default values
            // for the drop time and speed (drop time is not consulted unless
            // a ball is dropping).
            this._droppingBall = null;
            this._dropSpeed = 3;
            this._lastDropTick = 0;

            // Pre-populate all of our actor pools with the maximum possible
            // number of actors that we could need. For the case of the gray
            // bricks and bonus bricks, this creates more than we technically
            // need (since not all rows get those added).
            //
            // This is sort of wasteful, but it gets around an engine problem
            // whereby creating an entity at runtime that loads an image will
            // trigger an exception because it's trying to add a preload when
            // it does not need to.
            for (let i = 0 ; i < (MAZE_HEIGHT - 4) * ARROWS_PER_ROW[1] ; i++)
                this._arrows.addEntity (new Arrow (stage), false);
            for (let i = 0 ; i < (MAZE_HEIGHT - 4) * GRAY_BRICKS_PER_ROW[1] ; i++)
                this._grayBricks.addEntity (new Brick (stage, BrickType.BRICK_GRAY), false);
            for (let i = 0 ; i < (MAZE_HEIGHT - 4) * BONUS_BRICKS_PER_ROW[1] ; i++)
                this._bonusBricks.addEntity (new Brick (stage, BrickType.BRICK_BONUS), false);

            // Fill the actor pool for balls with a complete set of balls; this
            // only ever happens once and is the one case where we always know
            // exactly how many entities of a type we need.
            for (let i = 0 ; i < (MAZE_WIDTH - 2) * 2 ; i++)
                this._balls.addEntity (new Ball (stage), false);

            // Create the array that holds our contents. null entries are
            // treated as empty background bricks, so we don't need to do
            // anything further here.
            this._contents = new Array (MAZE_WIDTH * MAZE_HEIGHT);

            // Create the marker overlay.
            this._markers = new Array (MAZE_WIDTH * MAZE_HEIGHT);

            // No debugging by default, but the debugging point is the upper
            // left grid corner; the marker is created later when we know the
            // grid size.
            this._debugTracking = false;
            this._debugPoint = new Point (0, 0);

            // Generate a new maze; we require a reset here since the side walls
            // have not been placed yet.
            this.generateMaze (true);
        }

        /**
         * Set a debug marker on the cell at the given location in the maze.
         *
         * If the location is out of bounds of the maze or there is already a
         * marker at this location, then this will do nothing.
         *
         * @param {number} x the X coordinate to put a marker at
         * @param {number} y the Y coordinate to put a marker at
         */
        private setMarkerAt (x : number, y : number) : void
        {
            // If the bounds are invalid, do nothing.
            if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT)
                return;

            // Set the marker into the marker list at this location.
            // Set the brick at the location to the one provided.
            this._markers[y * MAZE_WIDTH + x] = true;
        }

        /**
         * Clear the debug marker on the cell at the given location in the maze.
         *
         * If the location is out of bounds or does not contain a marker, then
         * this will do nothing.
         *
         * @param {number} x the X coordinate to clear the marker from
         * @param {number} y the Y coordinate to clear the marker from
         */
        private clearMarkerAt (x : number, y : number) : void
        {
            // If the bounds are invalid or there is not a marker a this
            // location, then do nothing.
            if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT)
                return;

            // Now remove it from the grid
            this._markers[y * MAZE_WIDTH + x] = false;
        }

        /**
         * Check the maze to see if there is a debug marker on the location
         * given.
         *
         * @param   {number}  x the X coordinate to check in the maze
         * @param   {number}  y the Y coordinate to check in the maze
         *
         * @returns {boolean}   true if this position contains a marker, or
         * false otherwise
         */
        private hasMarkerAt (x : number, y : number) : boolean
        {
            // The bounds are invalid, so no marker
            if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT)
                return false;

            // There is only a marker if this location is true.
            return this._markers[y * MAZE_WIDTH + x] == true;
        }

        /**
         * Remove all markers that may be set in the maze currently.
         */
        private removeAllMarkers () : void
        {
            // Scan the entire maze, and for every marker entity that we find,
            // remove it from that cell.
            for (let row = 0 ; row < MAZE_HEIGHT ; row++)
            {
                for (let col = 0 ; col < MAZE_WIDTH ; col++)
                {
                    this.clearMarkerAt (col, row);
                }
            }
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

            // Create a marker entity and set it's dimensions based on the
            // sprite sheet we loaded. Our callback might get invoked before
            // that of the _empty entity that our cellSize property returns,
            // so it's not safe to reference it here.
            this._marker = new Marker (this._stage, sheet.width);

            // Create the debug marker. This is as above, but we modify its
            // debug color to visually distinguish it. We need to violate the
            // privacy rules here because this is not supposed to be externally
            // touchable.
            this._debugMarker = new Marker (this._stage, sheet.width);
            this._debugMarker["_debugColor"] = 'red';

            // Set our position to center us on the screen horizontally and be
            // just slightly up from the bottom of the screen. We use half of
            // the remainder of the width, so that the bottom edge is as far
            // from the bottom of the screen as the side edges are.
            this.setStagePositionXY ((this._stage.width / 2) - (this.width  / 2),
                                     this._stage.height - this.height - (remainder / 2));
        }

        /**
         * Take a point in stage coordinates and use it to set the current debug
         * location, if possible.
         *
         * If the point is within the bounds of this maze on the stage, it will
         * be used to change the current debug point. Otherwise, nothing
         * happens.
         *
         * This can be invoked even when the debug flag is turned off, although
         * in that case the set value is not used.
         *
         * @param {Point} position the position to track on the stage
         */
        setDebugPoint (position : Point) : void
        {
            // Use this point as long as it is contained inside of us.
            if (this.contains (position))
            {
                // Set our debug position the one provided, translate it to make
                // it local to our location on the stage, and then reduce it to
                // a cell coordinate.
                this._debugPoint.setTo (position);
                this._debugPoint.translateXY (-this._position.x, - this._position.y);
                this._debugPoint.reduce (this.cellSize);
            }
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
            return this.getCellAt (this._debugPoint.x, this._debugPoint.y);
        }

        /**
         * Set the cell at the current debug location in the grid to the cell
         * provided.
         *
         * @param {MazeCell} newCell the new cell to insert into the grid
         */
        setDebugCell (newCell : MazeCell) : void
        {
            this.setCellAt (this._debugPoint.x, this._debugPoint.y, newCell);
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
            if (cell instanceof Teleport)
                this._blackHole.clearDestination (this._debugPoint);

            // If it is a ball, remove it from the ball entity pool.
            else if (cell instanceof Ball)
                this._balls.killEntity (cell);

            // If it is an arrow, remove it from the arrow entity pool.
            else if (cell instanceof Arrow)
                this._arrows.killEntity (cell);

            // If it is a brick, we need to be a bit more careful; remove it
            // from the correct pool AND don't delete the solid boundary cell.
            else if (cell instanceof Brick)
            {
                let brick = <Brick> cell;
                if (brick == this._solid)
                {
                    console.log ("Cannot delete boundary bricks");
                    return;
                }
                else if (brick.brickType == BrickType.BRICK_GRAY)
                    this._grayBricks.killEntity (brick);
                else if (brick.brickType == BrickType.BRICK_BONUS)
                    this._bonusBricks.killEntity (brick);
                else
                {
                    console.log ("This brick is not a brick. Double Yew Tee Eff");
                    return;
                }
            }

            else if (cell instanceof Ball == false)
            {
                console.log ("Unable to delete entity; I don't know what it is");
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
            // As simple as a reset.
            this.reset ();
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
            if (cell instanceof Arrow)
            {
                let arrow = <Arrow> cell;
                if (arrow.arrowType == ArrowType.ARROW_AUTOMATIC)
                    arrow.arrowType = ArrowType.ARROW_NORMAL;
                else
                    arrow.arrowType = ArrowType.ARROW_AUTOMATIC;
                return;
            }

            // If the cell is a ball, toggle the type.
            if (cell instanceof Ball)
            {
                let ball = <Ball> cell;
                if (ball.ballType == BallType.BALL_PLAYER)
                {
                    ball.ballType = BallType.BALL_COMPUTER;
                    ball.playAnimation ("c_appear");
                }
                else
                {
                    ball.ballType = BallType.BALL_PLAYER;
                    ball.playAnimation ("p_appear");
                }
                return;
            }

            // If the cell is a brick, toggle the type. This will change the visual
            // representation back to the idle state for this brick type.
            //
            // This is skipped for solid bricks; they're just used on the outer
            // edges and should not be messed with.
            if (cell instanceof Brick && cell != this._solid)
            {
                // Get the brick at the current location.
                let currentBrick = <Brick> cell;
                let currentBrickPool : ActorPool<MazeCell> = null;
                let newBrick : Brick = null;
                let animation : string = null;

                // We keep a separate pool of bonus bricks and gray bricks.
                //
                // In order to swap, we need to get an existing brick from the
                // opposite pool, then put it into place and kill the other one.
                if (currentBrick.brickType == BrickType.BRICK_BONUS)
                {
                    newBrick = this._grayBricks.resurrectEntity ();
                    animation = "gray_appear";
                    currentBrickPool = this._bonusBricks;
                }
                else if (currentBrick.brickType == BrickType.BRICK_GRAY)
                {
                    newBrick = this._bonusBricks.resurrectEntity ();
                    animation = "bonus_appear";
                    currentBrickPool = this._grayBricks;
                }

                // If we got a brick, play the animation to cause it to appear,
                // then put it into the maze and kill the current brick in the
                // pool that it came from.
                if (newBrick != null)
                {
                    newBrick.playAnimation (animation);
                    this.setDebugCell (newBrick);
                    currentBrickPool.killEntity (currentBrick);
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
                // Try to get a gray brick first, since that's the most common
                // type so the pool is larger. If this works, play the animation
                // to appear it.
                let newBrick = this._grayBricks.resurrectEntity ();
                if (newBrick != null)
                    newBrick.playAnimation ("gray_appear");
                else
                {
                    // No gray bricks were available, so try a bonus brick
                    // instead.
                    newBrick = this._bonusBricks.resurrectEntity ();
                    if (newBrick != null)
                        newBrick.playAnimation ("bonus_appear");
                }

                // If we got a brick, add it to the maze.
                if (newBrick)
                    this.setDebugCell (newBrick);
                else
                    console.log ("Unable to add brick; no entities left in either pool");
            }
            else
                console.log ("Cannot add brick; cell is not empty");
        }

        /**
         * Scan the entire grid for Brick entities that are currently being hidden
         * by virtue of their playing a hidden or idle_gone animations and have
         * them become visible again.
         */
        debugUnhideAll () : void
        {
            for (let row = 0 ; row < MAZE_HEIGHT ; row++)
            {
                for (let col = 0 ; col < MAZE_WIDTH ; col++)
                {
                    let cell = this.getCellAt (col, row);
                    if (cell != null || cell instanceof Brick)
                    {
                        let brick = <Brick> cell;
                        switch (brick.animations.current)
                        {
                            case "gray_idle_gone":
                            case "gray_vanish":
                                brick.playAnimation ("gray_appear")
                                break;

                            case "bonus_idle_gone":
                            case "bonus_vanish":
                                brick.playAnimation ("bonus_appear")
                                break;
                        }
                    }
                }
            }
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
                    let cell = this.getCellAt (col, row);
                    if (cell != null || cell instanceof Brick)
                    {
                        let brick = <Brick> cell;
                        switch (brick.animations.current)
                        {
                            case "gray_idle":
                            case "gray_appear":
                                if (grayBricks)
                                    brick.playAnimation ("gray_vanish")
                                break;

                            case "bonus_idle":
                            case "bonus_appear":
                                if (grayBricks == false)
                                    brick.playAnimation ("bonus_vanish")
                                break;
                        }
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
                this._blackHole.addDestination (this._debugPoint);
                this.setDebugCell (this._blackHole);
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
                let arrow = this._arrows.resurrectEntity ();
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
                let ball = this._balls.resurrectEntity ();
                if (ball != null)
                {
                    ball.ballType = BallType.BALL_PLAYER;
                    ball.playAnimation ("p_appear");
                    this.setDebugCell (ball);
                }
                else
                    console.log ("Cannot add ball; no entities left in pool");
            }
            else
                console.log ("Cannot add ball; cell is not empty");
        }

        /**
         * DEBUG METHOD
         *
         * This takes a point that is representative of a mouse click inside of
         * the maze (i.e. the point (0, 0) is the upper left corner of this
         * entity) and "handles" it, using whatever debug logic we deem
         * exciting.
         *
         * This should return true or false depending on if it did anything with
         * the point or not, so the scene knows if the default handling should
         * be applied or not.
         *
         * @param   {Point}   position the position in our bounds of the click
         *
         * @returns {boolean}          true if we handled the click, or false
         * otherwise
         */
        handleClick (position : Point) : boolean
        {
            // The position is in pixels, so reduce it down to the size of the
            // cells in the maze, then collect the entity out of the maze at
            // that location (if any).
            position.reduce (this.cellSize);
            let entity = this.getCellAt (position.x, position.y);

            // If the entity is a ball and we're not already trying to drop a
            // ball, try to move it downwards.
            if (entity instanceof Ball && this._droppingBall == null)
            {
                // The ball entity at this location is the one that is dropping,
                // so get it and then remove it from the grid for the duration
                // of it's move.
                this._droppingBall = <Ball> entity;
                this.setCellAt (position.x, position.y, null);

                // In the dropping ball, set the current position to the maze
                // position that it currently holds; that will allow us to track
                // it, since by default maze cells don't know where they are.
                this._droppingBall.setMapPosition (position);

                // Ensure that the ball knows before we start that it started
                // out not moving.
                this._droppingBall.moveType = BallMoveType.BALL_MOVE_NONE;

                // Now indicate that the last time the ball dropped was right now
                // so that the next step in the drop happens in the future.
                this._lastDropTick = this._stage.tick;

                // All done now
                return true;
            }

            // If we're not tracking debug action, the rest of these actions
            // should not be allowed;
            if (this._debugTracking == false)
                return;

            // If this cell in the maze does not contain anything, or it
            // contains the black hole, then toggle the marker at this location.
            if (entity == null || entity == this._blackHole)
            {
                // If there a marker here, then clear it; otherwise, add it.
                if (this.hasMarkerAt (position.x, position.y))
                    this.clearMarkerAt (position.x, position.y);
                else
                    this.setMarkerAt (position.x, position.y);
            }

            // If this is a brick, we might want to vanish or appear it in the
            // maze.
            if (entity instanceof Brick)
            {
                // Clear any marker that might be here; these can only appear if
                // the ball drops through, so lets be able to remove them.
                this.clearMarkerAt (position.x, position.y);

                // Since it's a brick, change it's animation based on the type.
                // We can tell if the brick is visible or not by checking what
                // the currently playing animation is.
                let brick = <Brick> entity;
                switch (brick.brickType)
                {
                    case BrickType.BRICK_GRAY:
                        if (brick.animations.current == "gray_vanish")
                            brick.playAnimation ("gray_appear");
                        else
                            brick.playAnimation ("gray_vanish");
                        return true;

                    case BrickType.BRICK_BONUS:
                        if (brick.animations.current == "bonus_vanish")
                            brick.playAnimation ("bonus_appear");
                        else
                            brick.playAnimation ("bonus_vanish");
                        return true;

                    default:
                        return false;
                }
            }

            // If it is an arrow, flip it. This works for any type of arrow; an
            // automatic arrow will reset its random flip time in this case.
            if (entity instanceof Arrow)
            {
                let arrow = <Arrow> entity;
                arrow.flip ();
                return true;
            }


            // We care not for this click.
            return false;
        }

        /**
         * Given a point that represents the position that is expected to be a
         * ball, calculate where the next position that it should be is.
         *
         * The possible position changes are:
         *    1) the cell below us allows the ball to enter it or is empty, so
         *       drop down one.
         *    2) The cell below us is an arrow which shoves us one space to the
         *       left or right, possibly.
         *    3) The cell below us is a teleport; currently this is unhandled.
         *
         * If the ball would stop at this location, false is returned back to
         * indicate this. Otherwise, the position passed in is modified to show
         * where the move would go next and true is returned.
         *
         * @param   {Ball}    ball     the ball that is moving
         * @param   {Point}   position the current position of the ball given
         *
         * @returns {boolean}          true if the ball moved, false otherwise.
         * When true is returned, the passed in point is modified to show where
         * the new location is.
         */
        private nextBallPosition (ball : Ball, position : Point) : boolean
        {
            // If this position is in the second to last row of the maze, it has
            // reached the goal line, so movement stops.
            if (position.y == MAZE_HEIGHT - 2)
            {
                ball.moveType = BallMoveType.BALL_MOVE_NONE;
                return false;
            }

            // Get the contents of the cell where the ball is currently at, if
            // any; if there is one, tell it that the ball touched it, and also
            // possibly allow it to move the ball, as long as that's not how we
            // got at the current position.
            let current = this.getCellAt (position.x, position.y);
            if (current != null)
            {
                // Copy the position provided and then hand it to the entity
                // that we're currently on top of.
                let newPos = current.ballTouch (this, ball, position);

                // If we're allowed to move the ball because of a touch and the
                // entity below us actually changed the location, then that is
                // the move for this cycle.
                if (ball.moveType != BallMoveType.BALL_MOVE_JUMP && newPos != null)
                {
                    // The movement type of a touch is a jump; the entity itself
                    // can't stamp this in because we never tell it if it
                    // successfully moved the ball or not.
                    ball.moveType = BallMoveType.BALL_MOVE_JUMP;

                    // Set the position to the one the entity provided.
                    position.setTo (newPos);
                    return true;
                }
            }

            // Get the contents of the cell below us in the grid. If that cell
            // is empty or does not block the ball, then change position to drop
            // the ball there and we're done.
            let below = this.getCellAt (position.x, position.y + 1);
            if (below == null || below.blocksBall () == false)
            {
                ball.moveType = BallMoveType.BALL_MOVE_DROP;
                position.y++;
                return true;
            }

            // The cell below has blocked our movement. Invoke the collision
            // routine with it. If this returns null, we're blocked and cannot
            // move, so return now.
            let newPos = below.ballCollision (this, ball, position);
            if (newPos == null)
            {
                ball.moveType = BallMoveType.BALL_MOVE_NONE;
                return false;
            }

            // Check the contents of the new location and see if the ball is
            // allowed to enter that cell or not; the ball can enter if the cell
            // is empty or does not block ball movement.
            let movedCell = this.getCellAt (newPos.x, newPos.y);
            if (movedCell == null || movedCell.blocksBall () == false)
            {
                // Tell the cell that moved the ball that we actually moved it,
                // and then return back the position that it gave.
                //
                // In this case, it is up to the entity that moved the ball to
                // mark how it moved it, as we can't know.
                below.didMoveBall (ball);
                position.setTo (newPos);
                return true;
            }

            // The cell below us wants to shift our location to somewhere that
            // we're not allowed to enter, so just leave.
            ball.moveType = BallMoveType.BALL_MOVE_NONE;
            return false;
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
            this._balls.update (stage, tick);

            // If there is a dropping ball and it's time to drop it, take a step
            // now.
            if (this._droppingBall && tick >= this._lastDropTick + this._dropSpeed)
            {
                // We are going to drop the ball (or try to), so reset the last
                // drop tick to this tick.
                this._lastDropTick = tick;

                // Get the current position of the ball; this is just an alias
                // to the actual object.
                let pos = this._droppingBall.mapPosition;

                // Check to see what the next position of the ball is. If this
                // returns false, the ball is not going to move, so we are done
                // moving it now.
                if (this.nextBallPosition (this._droppingBall, pos) == false)
                {
                    // Add the ball back to the maze at it's current position.
                    this.setCellAt (pos.x, pos.y, this._droppingBall);

                    // If the ball position is at the bottom of the maze,
                    // get it to play it's vanish animation.
                    if (pos.y == MAZE_HEIGHT - 2)
                        this._droppingBall.vanish ();

                    // Now clear the flag so we know we're done.
                    this._droppingBall = null;
                }
            }
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
            // Get the cell size of our cells so we know how to blit.
            let cSize = this.cellSize;

            // Iterate over all columns and rows of bricks, and get them to
            // render themselves at the appropriate offset from the position
            // we've been given.
            for (let cellY = 0, blitY = y ; cellY < MAZE_HEIGHT ; cellY++, blitY += cSize)
            {
                for (let cellX = 0, blitX = x ; cellX < MAZE_WIDTH ; cellX++, blitX += cSize)
                {
                    // Get the cell at this position, using the empty brick
                    // cell if there isn't anything.
                    let cell = this.getCellAt (cellX, cellY) || this._empty;

                    // If the cell is not a brick entity of some kind, then it
                    // probably has a transparent background. So we should first
                    // render the empty cell to provide a background for it.
                    if (cell instanceof Brick == false)
                        this._empty.render (blitX, blitY, renderer);

                    // Render this cell.
                    cell.render (blitX, blitY, renderer);

                    // If this position contains a marker, render one here.
                    if (this.hasMarkerAt (cellX, cellY))
                        this._marker.render (blitX, blitY, renderer);
                }
            }

            // If we are dropping a ball, then we need to render it now; while
            // it is dropping, it's not stored in the grid.
            if (this._droppingBall)
            {
                let pos = this._droppingBall.mapPosition;
                this._droppingBall.render (x + (pos.x * cSize),
                                           y + (pos.y * cSize),
                                           renderer);
            }

            // Now the debug marker, if it's turned on.
            if (this._debugTracking)
            {
                let pos = this._debugPoint;
                this._debugMarker.render (x + (pos.x * cSize),
                                          y + (pos.y * cSize),
                                          renderer);
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
                this.setCellAt (0, y, this._solid);
                this.setCellAt (MAZE_WIDTH - 1, y, this._solid);
            }

            // Lastly, the bottom row needs to be made solid, except for the
            // first and last columns, which have already been filled out.
            for (let x = 1 ; x < MAZE_WIDTH - 1 ; x++)
                this.setCellAt (x, MAZE_HEIGHT - 1, this._solid);
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
                {
                    // Store it, then add this location to the list of possible
                    // destinations in this black hole.
                    this.setCellAt (x, y, this._blackHole);
                    this._blackHole.addDestination (new Point (x, y));
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
                    let brick : Brick = this._bonusBricks.resurrectEntity ();
                    if (brick == null)
                    {
                        brick = new Brick (this._stage, BrickType.BRICK_BONUS);
                        this._bonusBricks.addEntity (brick, true);
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
         * Place the balls into the maze.
         *
         * Currently this fill up the top row with balls for the player only,
         * but it should also store balls for the computer into another data
         * structure.
         */
        private placeBalls () : void
        {
            // There should be two sets of balls that we cycle between, but for
            // now we just put a set of player balls into the top row of the
            // maze.
            for (let col = 1 ; col < MAZE_WIDTH - 1 ; col++)
            {
                // Get a ball; this pool always has enough entities for us
                // because the number is fixed.
                let ball = this._balls.resurrectEntity ();

                // Set the score and type.
                ball.score = 0;
                ball.ballType = BallType.BALL_PLAYER;

                // Have the ball appear onto the screen (instead of just being
                // there)
                ball.appear ();

                // Set the ball in now.
                this.setCellAt (col, 0, ball);
            }
        }

        /**
         * Reset the maze.
         *
         * This will erase the entire contents of the maze and all of the markers
         * that might be in it, leaving only the side walls.
         */
        reset () : void
        {
            // Make sure that all of the entity pools are emptied out by killing
            // everything in them.
            this._arrows.killALl ();
            this._grayBricks.killALl ();
            this._bonusBricks.killALl ();
            this._balls.killALl ();
            this.removeAllMarkers ();

            // Make sure that our black hole entity doesn't know about any
            // destinations from a prior maze (if any).
            this._blackHole.clearDestinations ();

            // Prepare the maze; this empties out the current contents (if any)
            // and gives us a plain empty maze that is surrounded with the
            // bounding bricks that we need.
            this.emptyMaze ();
        }

        /**
         * Generate a new maze; this sets everything up for a new round of the
         * game.
         *
         * If doReset is true, reset () is invoked before the maze is generated.
         * You can skip this if you want to pre-populate some parts of the maze
         * before you generate the rest randomly.
         *
         * @param {boolean} doReset true to reset the maze contents first, false
         * to generate as-is.
         */
        generateMaze (doReset : boolean) : void
        {
            // If asked, reset the maze too
            if (doReset)
                this.reset ();

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