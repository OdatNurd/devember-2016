module nurdz.game
{
    /**
     * The number of ticks between steps in a normal (interactive) ball drop,
     */
    const NORMAL_DROP_SPEED = 3;

    /**
     * The number of ticks between steps in a final (end of round) ball drop.
     *
     * @type {Number}
     */
    const FINAL_DROP_SPEED = 1;
    /**
     * The entity that represents the maze in the game. This is the entire play
     * area of the game.
     */
    export class Maze extends Entity
    {
        /**
         * The object that we use to store our maze contents.
         */
        private _contents : MazeContents;

        /**
         * The object that we use to generate our random mazes.
         */
        private _generator : MazeGenerator;

        /**
         * The size (in pixels) of the cells that make up the maze grid.
         */
        private _cellSize : number;

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
         * This flag is set to true when a ball has finished moving and is now
         * finalized. There are two conditions under which this is true; when
         * the ball stops somewhere in the maze, is told to vanish, and then has
         * finished vanishing.
         *
         * This is used to determine if we should remove all gray bricks (if
         * that has not been done yet) or to select the next ball to drop at the
         * end of the round, if any are left.
         */
        private _ballMoveFinalized : boolean;

        /**
         * This flag is set when we have determined that all possible plays have
         * been made in the game and we have vanished away the gray bricks.
         *
         * This starts off false, but once it gets set to true we no longer
         * check after every ball move (i.e. the value of _ballMoveFinalized is
         * ignored).
         */
        private _grayBricksRemoved : boolean;

        /**
         * This flag is set when we are dropping a ball through the maze as a
         * result of all moves having been made and all gray bricks being
         * removed.
         *
         * When this is true, we are actively dropping a ball, so the update
         * code will not select a new one to drop.
         */
        private _droppingFinalBall : boolean;

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
        { return this._cellSize; }

        /**
         * Get the object that stores the actual contents of this maze. Using
         * this object the state of the maze can be queried or updated.
         *
         * @returns {MazeContents} the object that holds our contents.
         */
        get contents () : MazeContents
        { return this._contents; }

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

            // Create our singleton maze entities; these are entities for which
            // we only ever have a single instance that's used everywhere.
            this._empty = new Brick (stage, BrickType.BRICK_BACKGROUND);
            this._solid = new Brick (stage, BrickType.BRICK_SOLID);
            this._blackHole = new Teleport (stage);

            // Create our maze contents and generator; order is important here,
            // the generator needs to get the contents from us to initialize.
            this._contents = new MazeContents ();
            this._generator = new MazeGenerator (this);
            this._generator.wall = this._solid;
            this._generator.teleporter = this._blackHole;

            // Create our entity pools.
            this._arrows = new ActorPool<Arrow> ();
            this._grayBricks = new ActorPool<Brick> ();
            this._bonusBricks = new ActorPool<Brick> ();
            this._balls = new ActorPool<Ball> ();

            // There is no ball dropping by default; also set up default values
            // for the drop time and speed (drop time is not consulted unless
            // a ball is dropping).
            this._droppingBall = null;
            this._dropSpeed = NORMAL_DROP_SPEED;
            this._lastDropTick = 0;

            // No ball has finished moving and no gray bricks have been removed.
            // These also get reset on level generation.
            this._ballMoveFinalized = false;
            this._grayBricksRemoved = false;
            this._droppingFinalBall = false;

            // Pre-populate all of our actor pools with the maximum possible
            // number of actors that we could need.
            //
            // This is here to get around a ts-game-engine bug that stops creation
            // of entities that load images after the preload is finished.
            for (let i = 0 ; i < this._generator.maxArrows ; i++)
                this._arrows.addEntity (new Arrow (stage), false);
            for (let i = 0 ; i < this._generator.maxGrayBricks ; i++)
                this._grayBricks.addEntity (new Brick (stage, BrickType.BRICK_GRAY), false);
            for (let i = 0 ; i < this._generator.maxBonusBricks ; i++)
                this._bonusBricks.addEntity (new Brick (stage, BrickType.BRICK_BONUS), false);

            // Fill the actor pool for balls with a complete set of balls; this
            // only ever happens once and is the one case where we always know
            // exactly how many entities of a type we need.
            for (let i = 0 ; i < (MAZE_WIDTH - 2) * 2 ; i++)
                this._balls.addEntity (new Ball (stage), false);

            // No debugging by default, but the debugging point is the upper
            // left grid corner; the marker is created later when we know the
            // grid size.
            this._debugTracking = false;
            this._debugPoint = new Point (0, 0);
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

            // Set the cell size now.
            this._cellSize = sheet.width;

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
            this.setStagePositionXY (Math.floor ((this._stage.width / 2) - (this.width  / 2)),
                                     Math.floor (this._stage.height - this.height - (remainder / 2)));

            // Now that we know our position and cell size, set that into the
            // maze contents so that it can update the position of things.
            this._contents.cellSize = this._cellSize;
            this._contents.position = this._position;

            // Generate a maze now.
            //
            // This has to be here because we can't generate the maze without
            // knowing the size of the cells.
            this.generateMaze ();
        }

        /**
         * Get an arrow from the arrow pool; may return null if none are
         * available.
         */
        getArrow () : Arrow { return this._arrows.resurrectEntity (); }

        /**
         * Get a gray brick from the arrow pool; may return null if none are
         * available.
         */
        getGrayBrick () : Brick { return this._grayBricks.resurrectEntity (); }

        /**
         * Get a bonus brick from the arrow pool; may return null if none are
         * available.
         */
        getBonusBrick () : Brick { return this._bonusBricks.resurrectEntity (); }

        /**
         * Get a ball from the arrow pool; may return null if none are
         * available.
         */
        getBall () : Ball { return this._balls.resurrectEntity (); }

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
                this._blackHole.clearDestination (this._debugPoint);

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
            this.resetMazeEntities ();
            this._generator.emptyMaze ();
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
            if (cell.name == "brick" && cell != this._solid)
            {
                // Get the brick at the current location.
                let currentBrick = <Brick> cell;
                let newBrick : Brick = null;

                // We keep a separate pool of bonus bricks and gray bricks.
                //
                // In order to swap, we need to get an existing brick from the
                // opposite pool, then put it into place and kill the other one.
                if (currentBrick.brickType == BrickType.BRICK_BONUS)
                    newBrick = this.getGrayBrick ();
                else if (currentBrick.brickType == BrickType.BRICK_GRAY)
                    newBrick = this.getBonusBrick ();

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
                let newBrick = this.getGrayBrick ();
                if (newBrick == null)
                    newBrick = this.getBonusBrick ();

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
                let arrow = this.getArrow ();
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
                let ball = this.getBall ();
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
            let entity = this._contents.getCellAt (position.x, position.y);

            // If this cell in the maze does not contain anything, or it
            // contains the black hole, then toggle the marker at this location.
            if (entity == null || entity == this._blackHole)
            {
                // Toggle the marker here.
                this._contents.toggleMarkerAt (position.x, position.y);
                return;
            }

            // If the entity is a ball and we're not already trying to drop a
            // ball, try to move it downwards.
            if (entity.name == "ball" && this._droppingBall == null)
            {
                // Drop it and leave.
                this.dropBall (<Ball> entity, NORMAL_DROP_SPEED);
                return true;
            }

            // If we're not tracking debug action, the rest of these actions
            // should not be allowed;
            if (this._debugTracking == false)
                return;

            // If this is a brick that is not hidden, vanish it. We can't bring
            // it back because once it's hidden the update loop will reap it.
            if (entity.name == "brick")
            {
                // Clear any marker that might be here; these can only appear if
                // the ball drops through, so lets be able to remove them.
                this._contents.clearMarkerAt (position.x, position.y);

                // Get the brick; if its not hidden, vanish it.
                let brick = <Brick> entity;
                if (brick.isHidden == false)
                    brick.vanish ();
            }

            // If it is an arrow, flip it. This works for any type of arrow; an
            // automatic arrow will reset its random flip time in this case.
            if (entity.name == "arrow")
            {
                let arrow = <Arrow> entity;
                arrow.flip ();
                return true;
            }

            // We care not for this click.
            return false;
        }

        /**
         * Given a ball entity which exists in the maze, set up to start
         * dropping it through the maze, setting everything up as needed.
         *
         * For this to work, the ball provided must be stored in the maze and
         * its map position must accurately reflect the position it is stored
         * in, since that position will be cleared when the ball starts moving.
         *
         * @param {Ball}   ball  the ball to drop
         * @param {number} speed the number of ticks between ball step stages
         */
        private dropBall (ball : Ball, speed : number) : void
        {
            // Set the entity that is currently dropping to the one provided,
            // then remove it from the maze. It will be re-added when
            // it is finished moving
            this._droppingBall = ball;
            this._contents.clearCellAt (ball.mapPosition.x, ball.mapPosition.y);

            // Ensure that the ball knows before we start that it started
            // out not moving.
            this._droppingBall.moveType = BallMoveType.BALL_MOVE_NONE;

            // Now indicate that the last time the ball dropped was right now
            // so that the next step in the drop happens in the future.
            this._lastDropTick = this._stage.tick;

            // Set up the drop speed.
            this._dropSpeed = speed;
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
            let current = this._contents.getCellAt (position.x, position.y);
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

            // If the cell below us is not blocking the ball, we can drop the
            // ball into it and we're done.
            let below = this._contents.getBlockingCellAt (position.x, position.y + 1);
            if (below == null)
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
            if (this._contents.getBlockingCellAt (newPos.x, newPos.y) == null)
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
         * This performs a check to see if all of the balls have been played by
         * both players or not. This involves checking that the top row is
         * either empty of all balls, or any balls that remain have a cell under
         * them that is going to stop them from moving.
         *
         * When this determination is made, we vanish all of the gray bricks out
         * of the level for the final phase of the round.
         */
        private checkForAllBallsPlayed () : void
        {
            // Scan every cell in the top row of the maze contents.
            for (let cellX = 1 ; cellX < MAZE_WIDTH - 1 ; cellX++)
            {
                // Get the content of this cell. If there is content here, we
                // need to check below it.
                if (this._contents.getCellAt (cellX, 0) != null)
                {
                    // If the cell below this ball isn't blocked, this ball is
                    // still playable, so we can leave now.
                    if (this._contents.getBlockingCellAt (cellX, 1) == null)
                        return;
                }
            }

            // If we get here, all of the balls in the top row are either gone
            // or blocked from moving. In either case, hide all of the gray
            // bricks now.
            for (let i = 0 ; i < this._grayBricks.liveEntities.length ; i++)
                this._grayBricks.liveEntities[i].vanish ();
        }

        /**
         * Given an ActorPool that contains maze cells that conform to the
         * hide-able maze cell interface, scan the pool for all live entities
         * that are currently hidden and not actively hiding themselves and
         * remove them from the maze grid, killing the entity in the process.
         *
         * @param {ActorPool<HideableMazeCell>} pool the pool to reap
         *
         * @returns {number} the number of entities that were reaped during the
         * call, which may be 0.
         */
        private reapHiddenEntitiesFromPool (pool : ActorPool<HideableMazeCell>) : number
        {
            let retVal = 0;

            // Scan all of the live entities in the pool.
            for (let i = 0 ; i < pool.liveEntities.length ; i++)
            {
                // If this ball thinks it's hidden and it's animation is no
                // longer playing, we can remove it from the grid now.
                let cell = pool.liveEntities[i];
                if (cell.isHidden && cell.animations.isPlaying == false)
                {
                    this._contents.clearCellAt (cell.mapPosition.x, cell.mapPosition.y);
                    pool.killEntity (cell);
                    retVal++;
                }
            }

            return retVal;
        }

        /**
         * Select the next ball on the screen that should start it's final
         * descent through the maze.
         */
        private dropNextFinalBall () : void
        {
            // If we're already dropping a final ball, we don't need to select
            // one here.
            if (this._droppingFinalBall == true)
                return;

            // Set the flag indicating that we are dropping a final ball. This
            // protects us from this method being called again until the ball
            // we select (if any) is finished moving.
            this._droppingFinalBall = true;
            for (let row = MAZE_HEIGHT - 2 ; row >= 0 ; row--)
            {
                for (let col = MAZE_WIDTH - 1 ; col >= 1 ; col--)
                {
                    let cell = this._contents.getCellAt (col, row);
                    if (cell != null && cell.name == "ball")
                    {
                        // Start it dropping, then leave; we're done.
                        this.dropBall (<Ball> cell, FINAL_DROP_SPEED);
                        return;
                    }
                }
            }
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

            // Reap any dead balls; these are balls which are currently
            // invisible but still alive; they can be removed from the grid now.
            //
            // When this happens, we can set the flag that indicates that the
            // ball move is finalized, so that the update code can trigger a
            // check to see if all balls have been played or not.
            if (this.reapHiddenEntitiesFromPool (this._balls) > 0)
                this._ballMoveFinalized = true;

            // Reap any dead gray bricks; these are the gray bricks that have
            // been vanished out of the level because all of the balls have been
            // played.
            //
            // If this collects all gray bricks, we can set the flag that
            // indicates that we're done removing them now.
            if (this.reapHiddenEntitiesFromPool (this._grayBricks) > 0 &&
                    this._grayBricks.liveEntities.length == 0)
                this._grayBricksRemoved = true;

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
                    this._contents.setCellAt (pos.x, pos.y, this._droppingBall);

                    // If the ball position is at the bottom of the maze or it
                    // is one of the final balls, then, get it to play it's
                    // vanish animation. When this is not the case, the ball
                    // stopped somewhere in the maze. In this case we set the
                    // flag that says the ball is done moving right away.
                    //
                    // A ball that is vanishing sets this flag when it gets
                    // reaped, so that the code that triggers when the flag
                    // becomes set to true doesn't happen until the ball is
                    // visibly gone.
                    if (pos.y == MAZE_HEIGHT - 2 || this._droppingFinalBall == true)
                        this._droppingBall.vanish ();
                    else
                        this._ballMoveFinalized = true;

                    // Now clear the flag so we know we're done.
                    this._droppingBall = null;
                }
                else
                {
                    // The ball moved, so update it's location on the screen
                    // as well.
                    this._droppingBall.position.setTo (pos);
                    this._droppingBall.position.scale (this.cellSize);
                    this._droppingBall.position.translate (this._position);
                }
            }

            // If all of the gray bricks have been removed from the level, kick
            // off the process of dropping all remaining balls, one at a time.
            //
            // Kick off the process by selecting and dropping a ball now. This
            // call will do nothing if this is already in progress.
            if (this._grayBricksRemoved == true)
                this.dropNextFinalBall ();

            // When this flag is set, it means that a ball has been dropped and
            // is now finished moving. This can either have triggered from the
            // code above, or if the code above vanished the ball, the code that
            // reaps the dead ball when it is finished vanishing sets this flag
            // for us.
            //
            // In either case, we use this to check and see if all of the balls
            // have been played or not, so that we can trigger the vanish of the
            // gray bricks and get on with things.
            if (this._ballMoveFinalized)
            {
                // Reset the flag now for next time
                this._ballMoveFinalized = false;

                // If we have not already removed all of the gray bricks, now is
                // the time to see if we should.
                if (this._grayBricksRemoved == false)
                    this.checkForAllBallsPlayed ();

                // The gray bricks have been removed, so if we are currently
                // dropping a final ball, then turn the flag off and invoke
                // the method to select a new one to drop.
                else if (this._droppingFinalBall == true)
                {
                    this._droppingFinalBall = false;
                    this.dropNextFinalBall ();
                }
            }

        }

        /**
         * This will render the backing portion of the maze, which will draw in
         * the bounding walls on the outer edges as well as a complete grid of
         * background tiles.
         *
         * This effectively draws what looks like a completely empty grid.
         *
         * @param {number}   x        the X coordinate to start drawing at
         * @param {number}   y        the y coordinate to start drawing at
         * @param {number}   cSize    the size of the grid cells, in pixels
         * @param {Renderer} renderer the render to use during rendering
         */
        private renderMazeBacking (x : number, y : number, cSize : number, renderer : Renderer) : void
        {
            // Iterate over all of the cells that make up the maze, rendering
            // as appropriate.
            for (let cellY = 0, blitY = y ; cellY < MAZE_HEIGHT ; cellY++, blitY += cSize)
            {
                for (let cellX = 0, blitX = x ; cellX < MAZE_WIDTH ; cellX++, blitX += cSize)
                {
                    // The cell to render is empty, unless this is the side of
                    // the maze or the bottom of it, in which case the wall is
                    // solid.
                    let cell = this._empty;
                    if (cellX == 0 || cellX == MAZE_WIDTH - 1 || cellY == MAZE_HEIGHT - 1)
                        cell = this._solid;

                    // Render this cell.
                    cell.render (blitX, blitY, renderer);
                }
            }
        }

        /**
         * Render the markers in the maze; these are set manually by the user
         * clicking on the grid while in debug mode.
         *
         * @param {number}   x        the X coordinate to start drawing at
         * @param {number}   y        the y coordinate to start drawing at
         * @param {number}   cSize    the size of the grid cells, in pixels
         * @param {Renderer} renderer the renderer to use to render the markers.
         */
        private renderMazeMarkers (x : number, y : number, cSize : number, renderer : Renderer) : void
        {
            // Iterate over all columns and rows and render any markers that
            // might exist.
            for (let cellY = 0, blitY = y ; cellY < MAZE_HEIGHT ; cellY++, blitY += cSize)
            {
                for (let cellX = 0, blitX = x ; cellX < MAZE_WIDTH ; cellX++, blitX += cSize)
                {
                    // If this position contains a marker, render one here.
                    if (this._contents.hasMarkerAt (cellX, cellY))
                        this._marker.render (blitX, blitY, renderer);
                }
            }
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

            // Render the background of the maze first. This will draw the
            // background and the walls along the sides.
            this.renderMazeBacking (x, y, cSize, renderer);

            // Render all of the black holes; for this we have to iterate the
            // list of known destinations and use them to calculate the
            // appropriate position.
            //
            // Black holes have to come first so that if the ball comes to
            // rest on top of them, we can still see it.
            for (let i = 0 ; i < this._blackHole.length ; i++)
            {
                let pos = this._blackHole.destinationList[i];
                this._blackHole.render (x + (pos.x * cSize),
                                        y + (pos.y * cSize),
                                        renderer);
            }

            // Now render everything else.
            this._arrows.render (renderer);
            this._grayBricks.render (renderer);
            this._bonusBricks.render (renderer);
            this._balls.render (renderer);

            // We can render the markers now.
            this.renderMazeMarkers (x, y, cSize, renderer);

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
         * Reset all of the maze entities.
         *
         * This will kill all of the living entities, clear all markers, and get
         * all entities used in the maze back into their clean starting state
         * for a new maze generation sequence.
         *
         * This does not modify the contents of the maze, so things are likely
         * to break if you don't clear it yourself or generate a maze right
         * away.
         */
        private resetMazeEntities () : void
        {
            // Make sure that all of the entity pools are emptied out by killing
            // everything in them.
            this._arrows.killALl ();
            this._grayBricks.killALl ();
            this._bonusBricks.killALl ();
            this._balls.killALl ();
            this._contents.clearMarkers ();

            // Make sure that our black hole entity doesn't know about any
            // destinations from a prior maze (if any).
            this._blackHole.clearDestinations ();
        }

        /**
         * Generate a new maze; this sets everything up for a new round of the
         * game.
         */
        generateMaze () : void
        {
            // Kill all living entities to get everything into a clean state.
            this.resetMazeEntities ();

            // No ball has finished moving and no gray bricks have been removed.
            this._ballMoveFinalized = false;
            this._grayBricksRemoved = false;
            this._droppingFinalBall = false;

            // Now generate the contents of the maze.
            this._generator.generate ();
        }
    }
}