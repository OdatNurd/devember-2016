module nurdz.game
{
    /**
     * The number of ticks between steps in a normal (interactive) ball drop,
     */
    const NORMAL_DROP_SPEED = 3;

    /**
     * The number of ticks between steps in a final (end of round) ball drop.
     */
    const FINAL_DROP_SPEED = 1;

    /**
     * This interface is implemented by any class that wants to be told about
     * game specific events that occur as a result of operations in the maze.
     */
    export interface MazeEventListener
    {
        /**
         * The maze was asked to push a ball somehow and the ball push has
         * started now.
         *
         * @param {Ball} ball the ball entity that is being pushed.
         */
        startBallPush (ball : Ball) : void;

        /**
         * A ball drop that was in progress has now finished. The event features
         * the ball that was dropped.
         *
         * This gets triggered once the ball comes to a rest and before it is
         * vanished away (if it should be).
         *
         * This is triggered for any ball drop; human or computer, during the
         * regular game or as the final ball drop.
         *
         * The owner of the ball can be determined from the ball entity itself
         * while isFinal tells you if the ball finished dropping as part of a
         * regular or final ball drop.
         *
         * @param {Ball}    ball    the ball that stopped dropping
         * @param {boolean} isFInal true if this ball was part of a final ball
         * drop
         */
        ballDropComplete (ball : Ball, isFinal : boolean) : void;

        /**
         * A ball that is blocked has been told that it's being removed from
         * the maze during the final part of the round just prior to the gray
         * bricks being removed and the final ball drop.
         *
         * This gets triggered once the ball has been told to vanish away but
         * before the vanish starts.
         *
         * This is triggered for both human and computer balls.
         *
         * @param {Ball} ball the ball that being removed
         */
        blockedBallRemoved (ball : Ball) : void;

        /**
         * This will get invoked every time we're told to generate a maze and
         * our generation is finally completed.
         */
        mazeGenerationComplete () : void;

        /**
         * This will get invoked by the Maze update loop when it actively reaps
         * gray bricks that are finished vanishing (or just plain hidden) and it
         * detects that there are no further such bricks left.
         *
         * Once this triggers, it cannot trigger again unless something puts
         * more bricks into the maze.
         */
        grayBrickRemovalComplete () : void;
    }

    /**
     * The entity that represents the maze in the game. This is the entire play
     * area of the game.
     */
    export class Maze extends Entity
    {
        /**
         * The object that gets events when important things happen. This is
         * currently constrained to a single owning object for simplicity.
         */
        private _listener : MazeEventListener;

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
         * grid entirely) and will be added back when it stops moving.
         *
         * When this value is null, no ball is currently dropping.
         */
        private _droppingBall : Ball;

        /**
         * This gets set to a valid ball at the same time as _droppingBall value
         * does during a ball drop. It retains it's value until the event
         * triggers that tells the caller that the ball has finished dropping.
         *
         * This is needed because we have to clear _droppingBall to let our
         * update code know to stop trying to drop it, but we need to keep it
         * around because the event that notifies of the ball stop may happen
         * several updates later if the ball is vanishing.
         */
        private _lastDroppedBall : Ball;

        /**
         * This flag is set to true when a ball has finished moving and is now
         * finalized. There are two conditions under which this is true; when
         * the ball stops somewhere in the maze, is told to vanish, and then has
         * finished vanishing.
         *
         * This is used to know when it is time to tell our listener that the
         * drop is complete, which can happen multiple ticks after the ball
         * comes to rest.
         */
        private _ballMoveFinalized : boolean;

        /**
         * This flag is set when we are dropping a ball through the maze as a
         * result of all moves having been made and all gray bricks being
         * removed.
         *
         * This is used to tell the drop code that when the ball comes to rest,
         * it should vanish away even if it didn't reach the goal.
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
         * The object that handles our debug options.
         */
        private _debugger : MazeDebugger;

        /**
         * A special marker instance that is used to show the current debug
         * point while debug tracking is turned on.
         *
         * This is like a regular marker but displays in an alternate color to
         * distinguish it.
         */
        private _debugMarker : Marker;

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
         * Get the object that is currently being told about events happening in
         * this maze object; this can be null.
         *
         * @returns {MazeEventListener} the current event listener if any, or
         * null otherwise.
         */
        get listener () : MazeEventListener
        { return this._listener; }

        /**
         * Set the object that will be told about events happening in this maze
         * object. This will replace any existing listener.
         *
         * You can set this to null to turn off event listening for the
         * currently registered object.
         *
         * @param {MazeEventListener} newListener the object to use as listener
         * or null for none
         */
        set listener (newListener : MazeEventListener)
        { this._listener = newListener; }

        /**
         * Get the object that is used to generate the contents of this maze.
         * Using this object, external code can regenerate or otherwise tweak
         * the maze.
         *
         * @returns {MazeGenerator} the object that handles our generation.
         */
        get generator () : MazeGenerator
        { return this._generator; }

        /**
         * Get the object that is used for debugging. This contains methods that
         * can be used to turn debugging on and off and interact with the maze
         * in a variety of ways.
         *
         * @returns {MazeDebugger} the object that handles our debugging
         */
        get debugger () : MazeDebugger
        { return this._debugger; }

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

            // There is no listener by default.
            this._listener = null;

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

            // Create our maze contents, generator, and debugger; order is
            // important here, the generator and debugger need to get the
            // contents from us to initialize, and the debugger requires the
            // generator to already be available.
            this._contents = new MazeContents ();
            this._generator = new MazeGenerator (this);
            this._debugger = new MazeDebugger (this);
            this._generator.wall = this._solid;
            this._debugger.wall = this._solid;
            this._generator.teleporter = this._blackHole;
            this._debugger.teleporter = this._blackHole;

            // Create our entity pools.
            this._arrows = new ActorPool<Arrow> ();
            this._grayBricks = new ActorPool<Brick> ();
            this._bonusBricks = new ActorPool<Brick> ();
            this._balls = new ActorPool<Ball> ();

            // There is no ball dropping by default; also set up default values
            // for the drop time and speed (drop time is not consulted unless
            // a ball is dropping).
            this._droppingBall = null;
            this._lastDroppedBall = null;
            this._dropSpeed = NORMAL_DROP_SPEED;
            this._lastDropTick = 0;

            // No ball has finished moving and no gray bricks have been removed.
            // These also get reset on level generation.
            this._ballMoveFinalized = false;
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
         * Get a ball from the ball pool; may return null if none are
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
                this._debugger.debugPoint.setTo (position);
                this._debugger.debugPoint.translateXY (-this._position.x, - this._position.y);
                this._debugger.debugPoint.reduce (this.cellSize);
            }
        }

        /**
         * Attempt to push the ball that exists in the top row of the given
         * column in the maze, if possible.
         *
         * The ball can only be pushed if the cell in the maze at that position
         * is not empty, is a ball, and there is not already a ball dropping.
         *
         * The return value tells you if the drop started or not.
         *
         * @param   {number}  column the column in the maze to push the ball in
         *
         * @returns {boolean}        true if the push worked and ball is
         * starting to drop, or false otherwise
         */
        pushBall (column : number) : boolean
        {
            // Try to get the entity in the first row of the given column. If
            // it exists and it is a ball, push it.
            let entity = this._contents.getCellAt (column, 0);
            if (entity != null && entity.name == "ball" && this._droppingBall == null)
            {
                // Drop it and leave.
                this.dropBall (<Ball> entity, NORMAL_DROP_SPEED, false);
                return true;
            }

            return false;
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
                this.dropBall (<Ball> entity, NORMAL_DROP_SPEED, false);
                return true;
            }

            // If we're not tracking debug action, the rest of these actions
            // should not be allowed;
            if (this._debugger.debugTracking == false)
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
                arrow.flip (false);
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
         * When isFinal is true, this ball will be vanished as soon as it stops
         * moving, even if it doesn't reach the goal.
         *
         * @param {Ball}    ball    the ball to drop
         * @param {number}  speed   the number of ticks between ball step stages
         * @param {boolean} isFinal true if this is a final ball drop or false
         * otherwise
         */
        private dropBall (ball : Ball, speed : number, isFinal: boolean) : void
        {
            // Set the flag that indicates if this drop is a final drop or not.
            this._droppingFinalBall = isFinal;

            // Get the maze contents to mark this ball as played. If this is
            // one of the generated human or computer balls from the top row,
            // this will remove it from the list of balls so that the code knows
            // that this ball is no longer available.
            this._contents.markBallPlayed (ball);

            // Set the entity that is currently dropping to the one provided,
            // then remove it from the maze. It will be re-added when
            // it is finished moving
            this._droppingBall = ball;
            this._lastDroppedBall = ball;
            this._contents.clearCellAt (ball.mapPosition.x, ball.mapPosition.y);

            // Ensure that the ball knows before we start that it started
            // out not moving.
            this._droppingBall.moveType = BallMoveType.BALL_MOVE_NONE;

            // Now indicate that the last time the ball dropped was right now
            // so that the next step in the drop happens in the future.
            this._lastDropTick = this._stage.tick;

            // Set up the drop speed.
            this._dropSpeed = speed;

            // Now that the ball has started moving, if there is a listener,
            // tell it.
            if (this._listener != null)
                this._listener.startBallPush (ball);
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
         *    3) The cell below us is a teleport; the ball position potentially
         *       jumps elsewhere.
         *
         * If the ball would stop at this location, false is returned back to
         * indicate this. Otherwise, the position passed in is modified to show
         * where the move would go next and true is returned.
         *
         * The isSimulation parameter indicates if this movement operation is
         * part of a simulation (e.g. for AI purposes) and is passed to the
         * appropriate event handlers on entities.
         *
         * When we're simulating the collisions still logically work but the
         * state of the objects is not permanently changed, so that we can
         * revert back to where we started without visual glitches.
         *
         * @param   {Ball}    ball     the ball that is moving
         * @param   {Point}   position the current position of the ball given
         * @param   {boolean} isSimulation true if this is part of a
         * simulation,
         *
         * @returns {boolean} true if the ball moved, false otherwise. When
         * true is returned, the passed in point is modified to show where the
         * new location is.
         */
        nextBallPosition (ball : Ball, position : Point,
                          isSimulation : boolean) : boolean
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
                let newPos = current.ballTouch (this, ball, position, isSimulation);

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
            let below = this._contents.getBlockingCellAt (position.x, position.y + 1, isSimulation);
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
            if (this._contents.getBlockingCellAt (newPos.x, newPos.y, isSimulation) == null)
            {
                // Tell the cell that moved the ball that we actually moved it,
                // and then return back the position that it gave.
                //
                // In this case, it is up to the entity that moved the ball to
                // mark how it moved it, as we can't know.
                below.didMoveBall (ball, isSimulation);
                position.setTo (newPos);
                return true;
            }

            // The cell below us wants to shift our location to somewhere that
            // we're not allowed to enter, so just leave.
            ball.moveType = BallMoveType.BALL_MOVE_NONE;
            return false;
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
         * Scan the maze to find all entities that are ball entities that are
         * currently marked as hidden, and remove them from the maze by setting
         * that position in the maze to null.
         *
         * The return value indicates how many such balls were removed from the
         * maze during this call.
         *
         * @returns {number} the number of removed balls during this call, which
         * may be 0.
         */
        private clearHiddenBalls () : number
        {
            let retVal = 0;

            for (let row = 0 ; row < MAZE_HEIGHT - 1 ; row++)
            {
                for (let col = 1 ; col < MAZE_WIDTH - 1 ; col++)
                {
                    let ball = <Ball> this._contents.getCellAt (col, row);
                    if (ball != null && ball.name == "ball" &&
                        ball.isHidden && ball.animations.isPlaying == false)
                    {
                        this._contents.clearCellAt (col, row);
                        retVal++;
                    }
                }
            }

            return retVal;
        }

        /**
         * Select the next ball in the maze that should start it's final descent
         * through the maze.
         *
         * The return value indicates if a ball was found or not, so that the
         * caller knows if there is anything left to push.
         *
         * @returns {boolean} true if a ball was started dropping, or false
         * otherwise
         */
        dropNextFinalBall () : boolean
        {

            // Find a ball from the maze and drop it.
            for (let row = MAZE_HEIGHT - 2 ; row >= 0 ; row--)
            {
                for (let col = MAZE_WIDTH - 1 ; col >= 1 ; col--)
                {
                    let cell = this._contents.getCellAt (col, row);
                    if (cell != null && cell.name == "ball")
                    {
                        // Start this ball dropping.
                        this.dropBall (<Ball> cell, FINAL_DROP_SPEED, true);
                        return true;
                    }
                }
            }

            // There was nothing to push
            return false;
        }

        /**
         * Scan through the maze (left to right, bottom to top) looking for the
         * first gray brick entity that has not already been told to vanish and
         * tell it to.
         *
         * If there are no gray bricks at all in the maze, this will return
         * false to indicate that there can be no brick removal.
         *
         * The return value will be true if a brick was told to vanish OR we ran
         * across a brick that is hidden but still in the maze; in this case we
         * know that it has not vanished yet, so we can wait.
         *
         * This allows calling code to detect when there are no gray bricks at
         * all (debugging) so that it can skip over the state where we remove
         * gray bricks, but still make sure that we can naturally trigger the
         * "all gray bricks are now vanished" event once the last of them
         * vanishes away and is reaped.
         *
         * @returns {boolean} false if there are no gray bricks in the maze at
         * all or true otherwise
         */
        removeNextGrayBrick () : boolean
        {
            // Assume be default we did not see any gray bricks at all.
            let sawBrick = false;

            // Scan from the bottom up.
            for (let row = MAZE_HEIGHT - 2 ; row >= 0 ; row--)
            {
                for (let col = 1 ; col < MAZE_WIDTH - 1 ; col++)
                {
                    // Get the cell as a brick (it may not be).
                    let cell = <Brick> this._contents.getCellAt (col, row);

                    // If we got a cell and it's a gray brick, it might be
                    // interesting.
                    if (cell != null && cell.name == "brick" &&
                        cell.brickType == BrickType.BRICK_GRAY)
                    {
                        // If the brick is not already hidden, hide it and return
                        // true right away.
                        if (cell.isHidden == false)
                        {
                            cell.vanish ();
                            return true;
                        }

                        // It's already hidden so we need to ignore it, but at
                        // least we saw it.
                        sawBrick = true;
                    }
                }
            }

            return sawBrick;
        }

        /**
         * Scan through the maze from the bottom to the top looking for balls
         * that we need to vanish away because there is no possibility of them
         * moving further.
         *
         * Primarily this is a ball that is either directly resting on an arrow
         * or a ball that is resting on a ball that is an arrow.
         *
         * In practice since we are scanning from the bottom up, we remove a
         * ball in the situations mentioned above as well as when the cell below
         * a ball is either empty or a hidden ball, both of which being a
         * consequence of a previous call to this method having been invoked.
         *
         * The return value is false in the exact situation where there are no
         * balls at all in the maze that require being removed or true if we
         * told a ball to vanish or there is at least still one ball waiting to
         * finish vanishing.
         *
         * This should be called repeatedly (over time) until it returns false.
         *
         * @returns {boolean} true if there are still balls to remove/waiting to
         * be removed or false when no balls need to be removed any longer.
         */
        removeNextBlockedBall () : boolean
        {
            let sawBall = false;

            // Scan from the bottom up.
            for (let row = MAZE_HEIGHT - 2 ; row >= 0 ; row--)
            {
                for (let col = 1 ; col < MAZE_WIDTH - 1 ; col++)
                {
                    // Get the cell that we're searching for as a ball and the
                    // cell below it.
                    let cell = <Ball> this._contents.getCellAt (col, row);
                    let below = this._contents.getCellAt (col, row + 1);

                    // Skip this cell if it is empty or not a ball.
                    if (cell == null || cell.name != "ball")
                        continue;

                    // This is a ball; if it has already been hidden we can skip
                    // any further checks, but set our flag to indicate that we're
                    // still waiting for this ball to be removed.
                    if (cell.isHidden == true)
                    {
                        sawBall = true;
                        continue;
                    }

                    // This is a ball that is not already hidden. The criteria
                    // for hiding a ball during this call are that it is not
                    // already hidden (not already selected) and:
                    //
                    //   1) The cell below is a blank space (has to be a ball
                    //      that we previously vanished with a call like this)
                    //   2) What is below is a ball that is hidden (will soon
                    //      become #1, just not there yet)
                    //   3) The cell below is an arrow
                    if (below == null ||
                        below.name == "arrow" ||
                        (below.name == "ball" && (<Ball>below).isHidden == true))
                    {
                        // Tell our listener (if any) that this is happening
                        if (this._listener != null)
                            this._listener.blockedBallRemoved (cell);
                        cell.vanish ();
                        return true;
                    }
                }
            }

            // Return if we saw a ball waiting to vanish or not.
            return sawBall;
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
            // When this happens and we are dropping a ball, then we can set the
            // flag that indicates that the ball movement is finalized, so that
            // we can tell our listener that the move is done now.
            //
            // This also gets triggered during non-dropped ball removal, such
            // as vanishing blocked balls, but in that case we don't set the
            // flag because the appropriate handling has already been done.
            if (this.clearHiddenBalls () > 0 && this._lastDroppedBall != null)
                this._ballMoveFinalized = true;

            // Reap any dead gray bricks; these are the gray bricks that have
            // been vanished out of the level because all of the balls have been
            // played.
            //
            // If this collects all gray bricks, we can tell our listener that
            // we're done removing them now.
            if (this.reapHiddenEntitiesFromPool (this._grayBricks) > 0 &&
                    this._grayBricks.liveEntities.length == 0)
            {
                if (this._listener != null)
                    this._listener.grayBrickRemovalComplete ();
            }

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
                if (this.nextBallPosition (this._droppingBall, pos, false) == false)
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

            // When this flag is set, it means that a ball has been dropped and
            // is now finished moving. This can either have triggered from the
            // code above, or if the code above vanished the ball, the code that
            // reaps the dead ball when it is finished vanishing sets this flag
            // for us.
            //
            // In either case, this is our chance to tell any listener that the
            // drop is fully complete.
            //
            // NOTE: If the ball reached the goal, it was vanished and is now
            // dead. However its map position remains the same.
            if (this._ballMoveFinalized)
            {
                // Reset the flag now for next time
                this._ballMoveFinalized = false;

                // If there is a listener, tell it that this ball has stopped
                // moving now.
                if (this._listener != null)
                    this._listener.ballDropComplete (this._lastDroppedBall,
                                                     this._droppingFinalBall);

                // Done with the value now.
                this._lastDroppedBall = null;
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
            if (this._debugger.debugTracking)
            {
                let pos = this._debugger.debugPoint;
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
        resetMazeEntities () : void
        {
            // Make sure that all of the entity pools are emptied out by killing
            // everything in them.
            this._arrows.killALl ();
            this._grayBricks.killALl ();
            this._bonusBricks.killALl ();
            this._balls.killALl ();
            this._contents.clearMarkers ();
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
            this._droppingFinalBall = false;

            // Now generate the contents of the maze.
            this._generator.generate ();

            // Reset the scores
            resetScores ();

            // If there is a listener, tell it now that the generation has
            // completed.
            if (this._listener != null)
                this._listener.mazeGenerationComplete ();
        }

        /**
         * Inform the maze that one or more simulations are about to commence.
         * This will make sure to tell all entities for which it matters that
         * they should save their state.
         */
        beginSimulation () : void
        {
            // Save state in balls.
            for (let i = 0 ; i < this._balls.liveEntities.length ; i++)
                this._balls.liveEntities[i].enteringSimulation ();

            // Save state in bonus bricks
            for (let i = 0 ; i < this._bonusBricks.liveEntities.length ; i++)
                this._bonusBricks.liveEntities[i].enteringSimulation ();

            // Save state in arrows
            for (let i = 0 ; i < this._arrows.liveEntities.length ; i++)
                this._arrows.liveEntities[i].enteringSimulation ();

            // Nothing else needs to save state because it does not change per-
            // move.
        }

        /**
         * Inform the maze that a simulation cycle has now finished and everything
         * should be restored to its pre-simulation state.
         */
        endSimulation () : void
        {
            // Restore state in balls.
            for (let i = 0 ; i < this._balls.liveEntities.length ; i++)
                this._balls.liveEntities[i].exitingSimulation ();

            // Restore state in bonus bricks
            for (let i = 0 ; i < this._bonusBricks.liveEntities.length ; i++)
                this._bonusBricks.liveEntities[i].exitingSimulation ();

            // Restore state in arrows
            for (let i = 0 ; i < this._arrows.liveEntities.length ; i++)
                this._arrows.liveEntities[i].exitingSimulation ();

            // Nothing else needs to restore state because it does not change
            // per- move.
        }
    }
}