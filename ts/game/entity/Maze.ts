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

            // Reset the maze
            this.reset ();
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
            this._marker = new Marker (this._stage, this);
            this._marker.makeRectangle (sheet.width, sheet.height);

            // Set our position to center us on the screen horizontally and be
            // just slightly up from the bottom of the screen. We use half of
            // the remainder of the width, so that the bottom edge is as far
            // from the bottom of the screen as the side edges are.
            this.setStagePositionXY ((this._stage.width / 2) - (this.width  / 2),
                                     this._stage.height - this.height - (remainder / 2));
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

            // If this cell in the maze does not contain anything, then toggle
            // the marker at this location/
            if (entity == null)
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

            // If the entity is a ball, try to move it downwards
            if (entity instanceof Ball)
            {
                // We're going to move the ball, so remove all markers from
                // the maze.
                this.removeAllMarkers ();


                // Remove the ball entity from the maze at this location, since
                // we are going to move it. We also set a marker here to show
                // where we started the move from.
                // Get the ball entity out and remove it from the maze at
                // this position by replacing it with a marker entity.

                // Get the ball entity at this location.
                let ball = <Ball> entity;

                // Remove the ball from this position, since it will (probably)
                // be moving, and set a marker here so that we know where the
                // ball started.
                this.setCellAt (position.x, position.y, null);
                this.setMarkerAt (position.x, position.y);

                // Duplicate the position that the ball started out at.
                let ballPos = position.copy ();

                // Keep looping, deciding if the ball should move or not. When
                // the function returns true, it has modified the position to
                // be where the ball is moving to; when it is false, the ball
                // could not move from this point.
                //
                // When the position has changed, we set a marker at the new
                // position.
                while (this.nextBallPosition (ballPos))
                    this.setMarkerAt (ballPos.x, ballPos.y);

                // The loop stopped at the location where the ball should have
                // stopped. Put the ball entity that we started with at that
                // position now.
                this.setCellAt (ballPos.x, ballPos.y, ball);
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
         * @param   {Point}   position the current position of the ball that is
         * moving
         *
         * @returns {boolean}          true if the ball moved, false otherwise.
         * When true is returned, the passed in point is modified to show where
         * the new location is.
         */
        private nextBallPosition (position : Point) : boolean
        {
            // If this position is in the second to last row of the maze, it has
            // reached the goal line, so movement stops.
            if (position.y == MAZE_HEIGHT - 2)
                return false;

            // Get the contents of the cell below us in the grid.
            let below = this.getCellAt (position.x, position.y + 1);

            // If that cell is empty, or the ball is allowed to pass through it,
            // then change the position to drop down and return true.
            if (below == null || below.blocksBall () == false)
            {
                position.y++;
                return true;
            }

            // The cell below has blocked our movement. Make a duplicate of the
            // current position and then ask that cell if it thinks the ball
            // should be moved.
            //
            // If that returns false it doesn't think the ball should move, so
            // we can just leave.
            let testPos = position.copy ();
            if (below.changeBallLocation (testPos) == false)
                return false;

            // Check the contents of the new location and see if the ball is
            // allowed to enter that cell or not.
            let movedCell = this.getCellAt (testPos.x, testPos.y);
            if (movedCell == null || movedCell.blocksBall () == false)
            {
                // Tell the cell that moved the ball that we actually moved it,
                // and then return back the position that it gave.
                below.didChangeDirection ();
                position.setTo (testPos);
                return true;
            }

            // The cell below us wants to shift our location to somewhere that
            // we're not allowed to enter, so just leave.
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

                    // Render this cell.
                    cell.render (x + (blitX * 25), y + (blitY * 25), renderer);

                    // If this position contains a marker, render one here.
                    if (this.hasMarkerAt (blitX, blitY))
                        this._marker.render (x + (blitX * 25), y + (blitY * 25), renderer);
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
         * This will modify the bricks in the maze to represent a new randomly
         * created, empty maze.
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

            // Prepare the maze; this empties out the current contents (if any)
            // and gives us a plain empty maze that is surrounded with the
            // bounding bricks that we need.
            this.emptyMaze ();

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