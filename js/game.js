var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * The number of points that a bonus brick is worth.
         */
        game.BONUS_BRICK_SCORE = 10;
        /**
         * The number of points that it's worth to get a ball all the way to the
         * bottom of the screen, where the goal line is.
         */
        game.GOAL_BALL_SCORE = 60;
        /**
         * The number of points scored per row of advancement of a ball. This is
         * applied at the end of the round when the final balls are removed.
         */
        game.BALL_POSITION_MULTIPLIER = 2;
        /**
         * The number of points the human player has.
         */
        var humanScore = 0;
        /**
         * The number of poitns the computer player has.
         */
        var computerScore = 0;
        /**
         * Reset the score values for both players.
         */
        function resetScores() {
            humanScore = 0;
            computerScore = 0;
        }
        game.resetScores = resetScores;
        /**
         * Update the score for the designated player by adding or subtracting the
         * provided point value from the score.
         *
         * @param {PlayerType} player the player to adjust the score for
         * @param {number}     value  the adjustment value; can be positive or
         * negative
         */
        function adjustScore(player, value) {
            // Update the correct score.
            if (player == game.PlayerType.PLAYER_HUMAN)
                humanScore += value;
            else
                computerScore += value;
        }
        /**
         * Score points due to touching a bonus brick for the owner of the ball
         * provided.
         *
         * @param {Ball} ball the ball that touched the bonus brick
         */
        function bonusBrickScore(ball) {
            adjustScore(ball.player, game.BONUS_BRICK_SCORE);
        }
        game.bonusBrickScore = bonusBrickScore;
        /**
         * Score points due to a ball reaching the goal line (the bottom of the
         * maze).
         *
         * @param {Ball} ball the ball that reached the score line
         */
        function goalBallScore(ball) {
            adjustScore(ball.player, game.GOAL_BALL_SCORE);
        }
        game.goalBallScore = goalBallScore;
        /**
         * Score partial points for a ball based on its final resting position in
         * the maze.
         *
         * @param {Ball} ball the ball to score partial points for
         */
        function partialBallScore(ball) {
            adjustScore(ball.player, ball.mapPosition.y * game.BALL_POSITION_MULTIPLIER);
        }
        game.partialBallScore = partialBallScore;
        /**
         * Render the scores of the two players to the screen. This renders the
         * scores to a known position on screen.
         *
         * @param {Renderer} renderer the renderer to use to blit the text.
         */
        function renderScores(renderer) {
            renderer.drawTxt(humanScore + "", 16, 32, "white");
            renderer.drawTxt(computerScore + "", game.STAGE_WIDTH - (5 * 32), 32, "yellow");
        }
        game.renderScores = renderScores;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * This class represents an actor pool.
         *
         * The idea is that during the game we will want to construct multiple
         * instances of some of the different types of entities (for example
         * arrows), and we want a way to be able to easily perform the same
         * operation on all of them, such as causing an update.
         *
         * Additionally, between plays we want to be able to re-use these entities
         * to avoid creating more of them.
         *
         * This class allows you to add some number of entities to the list, which
         * are considered "alive", and then redact them from the list of live
         * objects and insert them into the list of dead objects instead.
         */
        var ActorPool = (function () {
            /**
             * Create a new empty entity pool.
             */
            function ActorPool() {
                // Create the two pools of entities
                this._deadPool = new Array();
                this._liveContents = new Array();
            }
            Object.defineProperty(ActorPool.prototype, "liveEntities", {
                /**
                 * The list of entities in this pool that are currently marked as being
                 * alive. These are the entities for which our methods such as update()
                 * and render() operate over.
                 *
                 * @returns {Array<T>} the list of live entities, which may be empty
                 */
                get: function () { return this._liveContents; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ActorPool.prototype, "deadEntities", {
                /**
                 * The list of entities in this pool that are currently marked as being
                 * dead. These are the entities available to be resurrected for further
                 * use.
                 *
                 * @returns {Array<T>} the list of dead entities, which may be empty
                 */
                get: function () { return this._deadPool; },
                enumerable: true,
                configurable: true
            });
            /**
             * Add a new entity to the pool of entities. The state of new entities
             * (alive or dead) is determined by the optional parameter.
             *
             * If the entity provided is already in the list of either live or dead
             * entities, this does nothing.
             *
             * @param {T}       newEntity the entity to add to the live list.
             * @param {boolean} isAlive   true if the entity is added to the live
             * pool, false if it should be added as dead
             */
            ActorPool.prototype.addEntity = function (newEntity, isAlive) {
                if (isAlive === void 0) { isAlive = true; }
                // Only add the entity to the live contents if we don't already know
                // about it.
                if (this._deadPool.indexOf(newEntity) == -1 &&
                    this._liveContents.indexOf(newEntity) == -1) {
                    // Store in the appropriate section
                    (isAlive ? this._liveContents : this._deadPool).push(newEntity);
                    // If possible, tell this entity that it is stored in us. This
                    // requires that the (optional) parameter
                    if (typeof newEntity.pool != "undefined")
                        newEntity.pool = this;
                }
            };
            /**
             * Mark the entity provided as being dead. This shifts it from the list
             * of live contents to the list of dead contents.
             *
             * When an entity is dead, operations such as updates will not be taken
             * on it. Such entities can be resurrected in order to re-use them
             * later.
             *
             * If the provided entity is already dead or is not in the list of live
             * entities, then nothing happens.
             *
             * @param {T} deadEntity the entity to mark as dead; if this is not
             * an entity already in the live part of the pool, nothing happens.
             */
            ActorPool.prototype.killEntity = function (deadEntity) {
                // Find the index of the entity provided in the list of live
                // entities.
                var liveLocation = this._liveContents.indexOf(deadEntity);
                // If this entity is not already dead and we know that it's alive,
                // then we can kill it.
                if (this._deadPool.indexOf(deadEntity) == -1 && liveLocation != -1) {
                    // Push the entity into the dead list, then remove it from the
                    // live list using the splice function.
                    this._deadPool.push(deadEntity);
                    this._liveContents.splice(liveLocation, 1);
                }
            };
            /**
             * Bulk mark all entities in the pool as being dead.
             *
             * If there are no live contents, this harmlessly does nothing.
             */
            ActorPool.prototype.killALl = function () {
                // If there are any live elements, push them into the dead pool and
                // then remove them from the original array. This uses apply to
                // push all of the elements one after the other (push takes multiple
                // arguments).
                if (this._liveContents.length > 0) {
                    this._deadPool.push.apply(this._deadPool, this._liveContents);
                    this._liveContents.length = 0;
                }
            };
            /**
             * Resurrect a previously dead entity by pulling it from the list of
             * entities that were added to the pool and then marked as dead.
             *
             * If there are no entities to resurrect, this will return null and
             * nothing else happens. Otherwise, the entity is shifted from the dead
             * pool and into the live pool, and is then returned back to you.
             *
             * When this happens, it is up to you to reset the properties in the
             * entity as you see fit, as the entity will emerge in exactly the state
             * it was in when it died.
             *
             * @returns {T|null} the resurrected entity, or null if there is
             */
            ActorPool.prototype.resurrectEntity = function () {
                // Resurrect a dead entity; if this does not work, return null
                // right away.
                var entity = this._deadPool.pop();
                if (entity == null)
                    return null;
                // Add the entity back to the live list and return it.
                this._liveContents.push(entity);
                return entity;
            };
            /**
             * Perform an update on all entities contained in the pool which are
             * currently marked as being alive.
             *
             * This method can be treated like an invocation of the update() method
             * contained in the Actor class itself.
             *
             * @param {Stage}  stage the stage the entity is on
             * @param {number} tick  the game tick; this is a count of how many
             * times the game loop has executed
             */
            ActorPool.prototype.update = function (stage, tick) {
                for (var i = 0; i < this._liveContents.length; i++)
                    this._liveContents[i].update(stage, tick);
            };
            /**
             * Invoke the render method on all entities contained in the pool which
             * are currently marked as being alive.
             *
             * This will render all living entities by invoking their render method
             * using their current world position (entity.position) and the renderer
             * provided.
             *
             * As such this method is not for use in instances where there is a
             * scrolling view port unless you are modifying the position of
             * everything in the pool as needed.
             *
             * @param {Renderer} renderer the renderer used to do the rendering
             */
            ActorPool.prototype.render = function (renderer) {
                for (var i = 0; i < this._liveContents.length; i++) {
                    var actor = this._liveContents[i];
                    actor.render(actor.position.x, actor.position.y, renderer);
                }
            };
            return ActorPool;
        }());
        game.ActorPool = ActorPool;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * The width of the maze, in bricks.
         *
         * This is inclusive of the side walls, so it's actually 2 bricks wider than
         * the play area.
         */
        game.MAZE_WIDTH = 31;
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
        game.MAZE_HEIGHT = 19;
        /**
         * This class is used to represent the content of the maze. This wraps the
         * data structure that actually contains the maze data as well as access
         * routines to set/change it.
         */
        var MazeContents = (function () {
            /**
             * Construct a new maze content object. This will create the underlying
             * data structure and initialize it to be completely devoid of cells
             * and markers.
             */
            function MazeContents() {
                // Create the content and marker arrays.
                this._contents = new Array(game.MAZE_WIDTH * game.MAZE_HEIGHT);
                this._markers = new Array(game.MAZE_WIDTH * game.MAZE_HEIGHT);
                // Create the arrays that store the balls that the human and
                // computer players play with. These are not permanently stored in
                // the maze because their starting positions occupy the same part of
                // the maze.
                this._playerBalls = new Array(game.MAZE_WIDTH - 2);
                this._computerBalls = new Array(game.MAZE_WIDTH - 2);
                // Create a position point and set a default cell size.
                this._position = new game.Point(0, 0);
                this._cellSize = 0;
                // Start everything cleared out. This ensures that the arrays are
                // properly initialized.
                this.clearCells();
                this.clearMarkers();
            }
            Object.defineProperty(MazeContents.prototype, "position", {
                /**
                 * Get the current position assigned to this maze content instance. This
                 * value is used to update the position of added cells so that they know
                 * where to render themselves on the screen.
                 *
                 * @returns {Point} the set position of this maze content on the stage
                 */
                get: function () { return this._position; },
                /**
                 * Get the current position assigned to this maze content instance. This
                 * value is used to update the position of added cells so that they know
                 * where to render themselves on the screen.
                 *
                 * @param {Point} newPosition the new position for this maze content on
                 * the stage
                 */
                set: function (newPosition) { this._position.setTo(newPosition); },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MazeContents.prototype, "cellSize", {
                /**
                 * Get the cell size of cells in this maze content instance. This value
                 * is used to calculate the render position of added cells so that they
                 * know where to render themselves on the screen.
                 *
                 * @returns {number} the current cell size
                 */
                get: function () { return this._cellSize; },
                /**
                 * Set the cell size of cells in this maze content instance. This value
                 * is used to calculate the render position of added cells so that they
                 * know where to render themselves on the screen.
                 *
                 * @param {number} newSize the new cell size
                 */
                set: function (newSize) { this._cellSize = newSize; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MazeContents.prototype, "playerBalls", {
                /**
                 * Get the array of balls that represents the balls that the human
                 * player is allowed to push into the maze. This is stored separate from
                 * the maze content in general so that it can be swapped in and out as
                 * needed.
                 *
                 * @returns {Array<Ball>} the array of balls; indicies that are null
                 * indicate the ball at this location has already been pushed.
                 */
                get: function () { return this._playerBalls; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MazeContents.prototype, "computerBalls", {
                /**
                 * Get the array of balls that represents the balls that the computer
                 * player is allowed to push into the maze. This is stored separate from
                 * the maze content in general so that it can be swapped in and out as
                 * needed.
                 *
                 * @returns {Array<Ball>} the array of balls; indicies that are null
                 * indicate the ball at this location has already been pushed.
                 */
                get: function () { return this._computerBalls; },
                enumerable: true,
                configurable: true
            });
            /**
             * Mark the location provided as containing a marker. Locations that
             * are out of bounds are silently ignored.
             *
             * @param {number} x the X coordinate to put a marker at
             * @param {number} y the Y coordinate to put a marker at
             */
            MazeContents.prototype.setMarkerAt = function (x, y) {
                // If the bounds are invalid, do nothing.
                if (x < 0 || x >= game.MAZE_WIDTH || y < 0 || y >= game.MAZE_HEIGHT)
                    return;
                // Set the flag for a marker at this location.
                this._markers[y * game.MAZE_WIDTH + x] = true;
            };
            /**
             * Remove any marker that might be set at the provided location. Locations
             * that are out of bounds are silently ignored.
             *
             * @param {number} x the X coordinate to clear the marker from
             * @param {number} y the Y coordinate to clear the marker from
             */
            MazeContents.prototype.clearMarkerAt = function (x, y) {
                // If the bounds are invalid, do nothing.
                if (x < 0 || x >= game.MAZE_WIDTH || y < 0 || y >= game.MAZE_HEIGHT)
                    return;
                // Clear the flag for a marker at this location.
                this._markers[y * game.MAZE_WIDTH + x] = false;
            };
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
            MazeContents.prototype.hasMarkerAt = function (x, y) {
                // The bounds are invalid, so no marker
                if (x < 0 || x >= game.MAZE_WIDTH || y < 0 || y >= game.MAZE_HEIGHT)
                    return false;
                // There is only a marker if this location is true.
                return this._markers[y * game.MAZE_WIDTH + x] == true;
            };
            /**
             * Toggle the marker that is at the provided location, swapping its state. Locations
             * that are out of bounds are silently ignored.
             *
             * @param {number} x the X coordinate to toggle
             * @param {number} y the Y coordinate to toggle
             */
            MazeContents.prototype.toggleMarkerAt = function (x, y) {
                // Set the state as appropriate. Bounds checking can be done by the
                // other methods.
                if (this.hasMarkerAt(x, y))
                    this.clearMarkerAt(x, y);
                else
                    this.setMarkerAt(x, y);
            };
            /**
             * Clear all markers that are set.
             */
            MazeContents.prototype.clearMarkers = function () {
                // Clear markers at all locations.
                for (var i = 0; i < game.MAZE_WIDTH * game.MAZE_HEIGHT; i++)
                    this._markers[i] = false;
            };
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
            MazeContents.prototype.cellNameAt = function (x, y) {
                var cell = this.getCellAt(x, y);
                return (cell == null) ? null : cell.name;
            };
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
            MazeContents.prototype.getCellAt = function (x, y) {
                // The bounds are invalid, so return null
                if (x < 0 || x >= game.MAZE_WIDTH || y < 0 || y >= game.MAZE_HEIGHT)
                    return null;
                // Return the contents of the cell, if any
                return this._contents[y * game.MAZE_WIDTH + x];
            };
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
            MazeContents.prototype.setCellAt = function (x, y, cell) {
                // The bounds are invalid, so do nothing.
                if (x < 0 || x >= game.MAZE_WIDTH || y < 0 || y >= game.MAZE_HEIGHT)
                    return;
                // Set the brick at the location to the one provided.
                this._contents[y * game.MAZE_WIDTH + x] = cell;
                // If we are storing a cell, set the position values in it as well.
                if (cell != null) {
                    // The position provided is the map position, so we can just set
                    // that.
                    cell.mapPosition.setToXY(x, y);
                    // The screen position is an offset from our position based on
                    // the map position and the size of the cells, so calculate and
                    // set that now.
                    cell.position.setToXY(this._position.x + (x * this._cellSize), this._position.y + (y * this._cellSize));
                }
            };
            /**
             * Clear the cell (if any) stored at the given location in the maze. This
             * is equivalent to calling setCellAt() with a null cell.
             *
             * @param {number} x the X location to clear
             * @param {number} y the Y location to clear
             */
            MazeContents.prototype.clearCellAt = function (x, y) {
                this.setCellAt(x, y, null);
            };
            /**
             * Clear the contents of all cells.
             */
            MazeContents.prototype.clearCells = function () {
                // Clear cells at all locations.
                for (var i = 0; i < game.MAZE_WIDTH * game.MAZE_HEIGHT; i++)
                    this._contents[i] = null;
                // Ensure that the ball arrays for both players are fully empty.
                for (var i = 0; i < game.MAZE_WIDTH - 2; i++) {
                    this._playerBalls[i] = null;
                    this._computerBalls[i] = null;
                }
            };
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
            MazeContents.prototype.playableBallsInArray = function (ballArray) {
                // Scan all balls in the ball array.
                for (var ballIndex = 0; ballIndex < ballArray.length; ballIndex++) {
                    // We only need to do something if there is a ball at this index
                    // in the array.
                    if (ballArray[ballIndex] != null) {
                        // The index is the offset from the first content column in
                        // the maze; if the cell below that column is not a blocking
                        // cell, this ball is playable.
                        //
                        // This has to always assume no simulation.
                        if (this.getBlockingCellAt(ballIndex + 1, 1, false) == null)
                            return true;
                    }
                }
                // There must be nothing playable.
                return false;
            };
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
            MazeContents.prototype.hasPlayableHumanBall = function () {
                return this.playableBallsInArray(this._playerBalls);
            };
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
            MazeContents.prototype.hasPlayableComputerBall = function () {
                return this.playableBallsInArray(this._computerBalls);
            };
            /**
             * Copy the balls from the ball array provided into the first row of the
             * maze. Any missing balls become a null entry in the maze contents.
             *
             * During the restore, every ball that is restored is marked as being
             * idle so that it will visually appear on the screen.
             *
             * @param {Array<Ball>} ballArray the ball array to store into the maze
             */
            MazeContents.prototype.restoreFromBallArray = function (ballArray) {
                // Replace the top row of the maze contents with the ball array. The
                // ball index in the array is the offset from the first column in
                // the maze contents.
                for (var ballIndex = 0; ballIndex < ballArray.length; ballIndex++) {
                    this.setCellAt(ballIndex + 1, 0, ballArray[ballIndex]);
                    if (ballArray[ballIndex] != null)
                        ballArray[ballIndex].idle();
                }
            };
            /**
             * Invoke the hide method for all balls currently in the array provided,
             * removing them from the screen.
             *
             * @param {Array<Ball>} ballArray the array of balls to hide
             */
            MazeContents.prototype.hideBallsInArray = function (ballArray) {
                // Iterate all balls in the provided array and hide them.
                for (var ballIndex = 0; ballIndex < ballArray.length; ballIndex++) {
                    if (ballArray[ballIndex] != null)
                        ballArray[ballIndex].hide();
                }
            };
            /**
             * Given a ball, this checks to see if this ball entity exists in either
             * the list of unplayed player balls or unplayed computer balls. If the
             * ball is found in one of those arrays, it is removed from the array so
             * that the code knows that this ball has now been played.
             *
             * @param {Ball} ball the ball to remove
             */
            MazeContents.prototype.markBallPlayed = function (ball) {
                // Try it first as a player ball.
                var index = this._playerBalls.indexOf(ball);
                if (index != -1)
                    this._playerBalls[index] = null;
                else {
                    index = this._computerBalls.indexOf(ball);
                    if (index != -1)
                        this._computerBalls[index] = null;
                }
                // The code can get here if the debug code starts a ball moving or
                // during the final ball drop, where this method gets called but
                // the ball pushed is not contained in either of the arrays.
            };
            /**
             * Replace the top row contents of the maze with the list of balls that
             * remain to be played for the player and simultaneously hide all of the
             * computer balls still in the top row.
             */
            MazeContents.prototype.showPlayerBalls = function () {
                this.restoreFromBallArray(this._playerBalls);
                this.hideBallsInArray(this._computerBalls);
            };
            /**
             * Replace the top row contents of the maze with the list of balls that
             * remain to be played for the computer and simultaneously hide all of
             * the player balls still in the top row.
             */
            MazeContents.prototype.showComputerBalls = function () {
                this.restoreFromBallArray(this._computerBalls);
                this.hideBallsInArray(this._playerBalls);
            };
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
            MazeContents.prototype.getBlockingCellAt = function (x, y, isSimulation) {
                var cell = this.getCellAt(x, y);
                if (cell == null || cell.blocksBall(isSimulation) == false)
                    return null;
                return cell;
            };
            return MazeContents;
        }());
        game.MazeContents = MazeContents;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
     * The total number of teleport entities that get generated randomly into
     * the maze.
     */
        var TOTAL_TELEPORTERS = 5;
        /**
         * The minimum distance allowed between teleport entities and all other
         * entities. This makes sure they don't get generated too close together.
         *
         * Be careful not to set this too high or the generation may deadlock due to
         * there being no suitable locations.
         */
        var TELEPORT_MIN_DISTANCE = 3;
        /**
         * The relative probabilty of the number of arrows that appear in a column.
         * One of these elements is randomly selected in order to determine the
         * number of arrows in a column.
         */
        var ARROW_PROBABILITY = [1, 1, 2, 2, 2, 2, 3, 3, 4, 5];
        /**
         * The relative probabilty of the number of gray bricks that appear in a
         * column. One of these elements is randomly selected in order to determine
         * the number of gray bricks in a column.
         */
        var GRAY_BRICK_PROBABILITY = [0, 0, 0, 0, 0, 1, 1, 1, 2, 2];
        /**
         * The relative probabilty of the number of gray bricks that appear in a
         * column. One of these elements is randomly selected in order to determine
         * the number of gray bricks in a column.
         */
        var BONUS_BRICK_PROBABILITY = [0, 0, 0, 0, 0, 0, 0, 1, 1, 2];
        /**
         * This class contains the code used to generate the content of a new maze.
         * It requires access to the Maze entity so that it can get at the content
         * and perform its task.
         */
        var MazeGenerator = (function () {
            /**
             * Construct a new generator object that can generate mazes into the
             * provided maze object.
             *
             * @param {Maze} maze the maze object to generate into
             */
            function MazeGenerator(maze) {
                // Store the maze and get it's contents.
                this._maze = maze;
                this._contents = maze.contents;
                // By default there is no wall or teleporter.
                this._wall = null;
                this._teleport = null;
            }
            Object.defineProperty(MazeGenerator.prototype, "wall", {
                /**
                 * Set the wall that this generator object will use to create the walls
                 * in the maze. The same object will be used for all wall positions.
                 *
                 * If this is not set, there will be no walls to block ball movement.
                 *
                 * @param {MazeCell} newWall the entity to use for the wall.
                 */
                set: function (newWall) { this._wall = newWall; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MazeGenerator.prototype, "teleporter", {
                /**
                 * Set the entity that will be used to generate all of the teleport objects
                 * in the maze. The same object will be used for all wall positions.
                 *
                 * If this is not set, there will be no teleports generated in the maze.
                 *
                 * @param {Teleport} newTeleporter the entity to use for the teleporter
                 */
                set: function (newTeleporter) { this._teleport = newTeleporter; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MazeGenerator.prototype, "maxArrows", {
                /**
                 * Get the maximum number of arrows that could conceivably be generated
                 * into a maze.
                 *
                 * @returns {number} the maximum number of arrows in a maze
                 */
                get: function () { return (game.MAZE_WIDTH - 2) * Math.max.apply(null, ARROW_PROBABILITY); },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MazeGenerator.prototype, "maxGrayBricks", {
                /**
                 * Get the maximum number of gray bricks that could conceivably be
                 * generated into a maze.
                 *
                 * @returns {number} the maximum number of gray bricks in a maze
                 */
                get: function () { return (game.MAZE_HEIGHT - 4) * Math.max.apply(null, GRAY_BRICK_PROBABILITY); },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MazeGenerator.prototype, "maxBonusBricks", {
                /**
                 * Get the maximum number of bonus bricks that could conceivably be
                 * generated into a maze.
                 *
                 * @returns {number} the maximum number of bonus bricks in a maze
                 */
                get: function () { return (game.MAZE_HEIGHT - 4) * Math.max.apply(null, BONUS_BRICK_PROBABILITY); },
                enumerable: true,
                configurable: true
            });
            /**
             * Prepare for maze generation by resetting the contents of the maze to
             * be empty.
             *
             * The entire contents of the maze is set to be the empty background
             * brick, followed by wrapping the edges in the bounding bricks that
             * stop the ball from falling out of the maze.
             */
            MazeGenerator.prototype.emptyMaze = function () {
                // Clear all cells.
                this._contents.clearCells();
                // Now the left and right sides need to be solid bricks.
                for (var y = 0; y < game.MAZE_HEIGHT; y++) {
                    this._contents.setCellAt(0, y, this._wall);
                    this._contents.setCellAt(game.MAZE_WIDTH - 1, y, this._wall);
                }
                // Lastly, the bottom row needs to be made solid, except for the
                // first and last columns, which have already been filled out.
                for (var x = 1; x < game.MAZE_WIDTH - 1; x++)
                    this._contents.setCellAt(x, game.MAZE_HEIGHT - 1, this._wall);
            };
            /**
             * Scan the maze over the range of values given and check to see if the
             * entity provided exists in that span. This is allows to go outside of
             * the bounds of the maze.
             *
             * @param   {number}  x1     the x location of the first cell to check
             * @param   {number}  y1     the y location of the first cell to check
             * @param   {number}  x2     the x location of the second cell to check
             * @param   {number}  y2     the y location of the second cell to check
             * @param   {Entity}  entity the entity to search for
             *
             * @returns {boolean}    true if any of the cells in the rectangular
             * range between the two given points contains the entity.
             */
            MazeGenerator.prototype.entityInRange = function (x1, y1, x2, y2, entity) {
                // Scan the entire range; this is really inefficient but it gets
                // the job done.
                //
                // Note that getCellAt () returns null for an invalid location, so
                // this handles locations that end up off of the edge OK.
                for (var x = x1; x <= x2; x++) {
                    for (var y = y1; y <= y2; y++) {
                        if (this._contents.getCellAt(x, y) == entity)
                            return true;
                    }
                }
                return false;
            };
            /**
             * Scan the entire column of the maze given to see if the entity
             * provided exists in that column or not.
             *
             * @param   {number}  x      the column to search
             * @param   {Entity}  entity the entity to look for
             *
             * @returns {boolean}        true if the entity is found, false
             * otherwise
             */
            MazeGenerator.prototype.entityInColumn = function (x, entity) {
                // Scan the maze content portion to see if the entity is there.
                for (var y = 2; y < game.MAZE_HEIGHT - 2; y++) {
                    if (this._contents.getCellAt(x, y) == entity)
                        return true;
                }
                return false;
            };
            /**
             * This takes a probabilty array, which is an array of numbers, and will
             * randomly return one of the values in the array. The idea is that the
             * array would contain the same number some number of times to try and
             * set the probability that a particular outcome will happen.
             *
             * @param   {Array<number>} probabiltyArray the probabilty array
             *
             * @returns {number}                        the number selected
             */
            MazeGenerator.prototype.randomProbabilty = function (probabiltyArray) {
                return probabiltyArray[game.Utils.randomIntInRange(0, probabiltyArray.length - 1)];
            };
            /**
             * Generate our black hole entities into the maze. There is an exact
             * number of this entity in the maze at any given time, which are
             * randomly spready around with the restriction that there only ever be
             * one in any given column in the maze.
             *
             * There is expected to be a single global teleport entity that is
             * stamped into the maze at all locations, and we update the destination
             * list of the single entity to tell it where all of its other versions
             * are.
             *
             * For this reason, this method does nothing if there is no assigned
             * teleport entity instance, and every invocation resets the destination
             * list of the teleport entity.
             */
            MazeGenerator.prototype.genBlackHoles = function () {
                // We can't generate any black holes if we don't have a teleport
                // instance.
                if (this._teleport == null)
                    return;
                // Reset the destination list of the entity to make sure there are
                // no phantoms.
                this._teleport.clearDestinations();
                // Keep going until we hit a specific number of generated entities.
                var generated = 0;
                while (generated < TOTAL_TELEPORTERS) {
                    // Get a location. These values don't cover the entire maze area;
                    // we want the teleports to be away from the edges a bit.
                    var x = game.Utils.randomIntInRange(2, game.MAZE_WIDTH - 3);
                    var y = game.Utils.randomIntInRange(5, game.MAZE_HEIGHT - 6);
                    // Don't generate here if this location is not empty, there is
                    // already a teleport in this column, or there is a teleport
                    // close to us.
                    if (this._contents.getCellAt(x, y) != null ||
                        this.entityInColumn(x, this._teleport) ||
                        this.entityInRange(x - TELEPORT_MIN_DISTANCE, y - TELEPORT_MIN_DISTANCE, x + TELEPORT_MIN_DISTANCE, y + TELEPORT_MIN_DISTANCE, this._teleport))
                        continue;
                    // Set this location in the maze as a teleport and add this location
                    // as a destination.
                    this._contents.setCellAt(x, y, this._teleport);
                    this._teleport.addDestination(new game.Point(x, y));
                    // We added one.
                    generated++;
                }
            };
            /**
             * Generate arrow entities into the maze. Each column has a random
             * number of arrows, up to a specified maximum number (but always at
             * least one). The facing of the arrows is completely random.
             *
             * All arrows generated are normal arrows (changing direction only when
             * they direct a ball in another direction), but if the parameter is
             * true, there is a set number of arrows that are generated as automatic
             * arrows instead.
             *
             * @param includeAutomatic true if some generated arrows should be
             * automatic arrows (self switching) or false otherwise
             */
            MazeGenerator.prototype.genArrows = function (includeAutomatic) {
                // Iterate over all of the columns that can possibly contain arrows.
                for (var x = 1; x < game.MAZE_WIDTH - 1; x++) {
                    // Determine how many arrows will generate in this column; there
                    // is always at least one.
                    var arrowCount = this.randomProbabilty(ARROW_PROBABILITY);
                    // Generate them now.
                    while (arrowCount > 0) {
                        // Generate a row. We start 3 rows down (0 offset) to leave
                        // room for the initial ball placement and a single row of
                        // potential unobstructed movement.
                        var y = game.Utils.randomIntInRange(2, game.MAZE_HEIGHT - 3);
                        // Get the contents at this location; if this location is
                        // already filled, or the tile above it is a black hole,
                        // then try again (a black hole stops this arrow from being
                        // useful).
                        if (this._contents.getCellAt(x, y) != null ||
                            this._contents.cellNameAt(x, y - 1) == "blackHole")
                            continue;
                        // Get an arrow from the pool; leave if we can't.
                        var arrow = this._maze.getArrow();
                        if (arrow == null) {
                            console.log("Ran out of arrows generating maze");
                            return;
                        }
                        // Randomly set the initial facing direction.
                        if (game.Utils.randomIntInRange(0, 100) % 2 == 0)
                            arrow.arrowDirection = game.ArrowDirection.ARROW_LEFT;
                        else
                            arrow.arrowDirection = game.ArrowDirection.ARROW_RIGHT;
                        // If we are supposed to generate automatic arrows and this
                        // is randomly selected to be one, then this is an automatic
                        // arrow; otherwise it is normal.
                        if (includeAutomatic && game.Utils.randomIntInRange(0, 100) < 25)
                            arrow.arrowType = game.ArrowType.ARROW_AUTOMATIC;
                        else
                            arrow.arrowType = game.ArrowType.ARROW_NORMAL;
                        // Add it to the maze and count it as placed.
                        this._contents.setCellAt(x, y, arrow);
                        arrowCount--;
                    }
                }
            };
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
            MazeGenerator.prototype.genGrayBricks = function () {
                // Iterate over all of the columns that can possibly contain gray
                // bricks.
                for (var x = 1; x < game.MAZE_WIDTH - 1; x++) {
                    // Determine how many bricks we will generate in this column;
                    // there may be zero.
                    var brickCount = this.randomProbabilty(GRAY_BRICK_PROBABILITY);
                    // Now keep generating bricks into this row until we have
                    // generated enough.
                    while (brickCount > 0) {
                        // Generate a row. We start 3 rows down (0 offset) to leave
                        // room for the initial ball placement and a single row of
                        // potential unobstructed movement.
                        var y = game.Utils.randomIntInRange(2, game.MAZE_HEIGHT - 3);
                        // Get the contents at this location; if this location is
                        // already filled, or the tile above it is an arrow, then
                        // try again (a arrow stops this brick from being useful).
                        if (this._contents.getCellAt(x, y) != null ||
                            this._contents.cellNameAt(x, y - 1) == "arrow")
                            continue;
                        // Get a brick from the pool; leave if we can't.
                        var brick = this._maze.getGrayBrick();
                        if (brick == null) {
                            console.log("Ran out of gray bricks generating maze");
                            return;
                        }
                        // Add it to the maze, mark it to appear, and count it as
                        // placed.
                        this._contents.setCellAt(x, y, brick);
                        brick.appear();
                        brickCount--;
                    }
                }
            };
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
            MazeGenerator.prototype.genBonusBricks = function () {
                // Iterate over all of the columns that can possibly contain gray
                // bricks.
                for (var x = 1; x < game.MAZE_WIDTH - 1; x++) {
                    // Determine how many bricks we will generate in this column;
                    // there may be zero.
                    var brickCount = this.randomProbabilty(BONUS_BRICK_PROBABILITY);
                    // Now keep generating bricks into this row until we have
                    // generated enough.
                    while (brickCount > 0) {
                        // Generate a row. We start 3 rows down (0 offset) to leave
                        // room for the initial ball placement and a single row of
                        // potential unobstructed movement.
                        var y = game.Utils.randomIntInRange(2, game.MAZE_HEIGHT - 3);
                        // Get the contents at this location; if this location is
                        // already filled, or the tile above it is an arrow, then
                        // try again (a arrow stops this brick from being useful).
                        if (this._contents.getCellAt(x, y) != null ||
                            this._contents.cellNameAt(x, y - 1) == "arrow")
                            continue;
                        // Get a brick from the pool; leave if we can't.
                        var brick = this._maze.getBonusBrick();
                        if (brick == null) {
                            console.log("Ran out of bonus bricks generating maze");
                            return;
                        }
                        // Add it to the maze, mark it to appear, and count it as
                        // placed.
                        this._contents.setCellAt(x, y, brick);
                        brick.appear();
                        brickCount--;
                    }
                }
            };
            /**
             * Place the balls into the maze.
             *
             * Currently this fill up the top row with balls for the player only,
             * but it should also store balls for the computer into another data
             * structure.
             */
            MazeGenerator.prototype.placeBalls = function () {
                // Get the arrays that store the player and comptuer balls from
                // the contents object.
                var playerBalls = this._contents.playerBalls;
                var computerBalls = this._contents.computerBalls;
                // For each element in the ball arrays, pull out a ball and set it
                // to the appropriate type.
                //
                // This always works because the ball pool always has exactly enough
                // balls for our purposes.
                for (var ballIndex = 0; ballIndex < game.MAZE_WIDTH - 2; ballIndex++) {
                    // Get the balls from the pool
                    playerBalls[ballIndex] = this._maze.getBall();
                    computerBalls[ballIndex] = this._maze.getBall();
                    // Make sure that their score values are 0 to begin with.
                    playerBalls[ballIndex].score = 0;
                    computerBalls[ballIndex].score = 0;
                    // Now set the appropriate type so that they visually display
                    // as we want them to.
                    playerBalls[ballIndex].ballType = game.BallType.BALL_PLAYER;
                    computerBalls[ballIndex].ballType = game.BallType.BALL_COMPUTER;
                    // Both balls should be hidden to begin with. This has to come
                    // after the type setting below because when the type of a ball
                    // changes it idles by default.
                    playerBalls[ballIndex].hide();
                    computerBalls[ballIndex].hide();
                }
            };
            /**
             * Generate a new maze into the maze we were given at construction time.
             *
             * This will throw away all content and generate new content. This takes
             * entities from the actor pools exposed by the Maze object that owns
             * us, but does not take care to reap any objects in the pools first;
             * that is up to the caller.
             *
             * @param includeAutomatic true if arrows can be generated as
             * automatically flipping, or false otherwise.
             */
            MazeGenerator.prototype.generate = function (includeAutomatic) {
                // Empty the maze of all of its contents.
                this.emptyMaze();
                // Now generate the contents of the maze.
                this.genBlackHoles();
                this.genArrows(includeAutomatic);
                this.genGrayBricks();
                this.genBonusBricks();
                // Now we can place the balls in.
                this.placeBalls();
            };
            return MazeGenerator;
        }());
        game.MazeGenerator = MazeGenerator;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * This class contains the code used to generate the content of a new maze.
         * It requires access to the Maze entity so that it can get at the content
         * and perform its task.
         */
        var MazeDebugger = (function () {
            /**
             * Construct a new debugger object that can debug the provided maze object.
             *
             * @param {Maze} maze the maze object to deb
             */
            function MazeDebugger(maze) {
                // Store the maze and get it's contents.
                this._maze = maze;
                this._contents = maze.contents;
                // By default there is no wall or teleporter.
                this._wall = null;
                this._teleport = null;
                // Create a default debug point.
                this._debugPoint = new game.Point(0, 0);
                // No debugging by default, but the debugging point is the upper
                // left grid corner;.
                this._debugTracking = false;
            }
            Object.defineProperty(MazeDebugger.prototype, "wall", {
                /**
                 * Set the wall object that was used to generate walls in the maze.
                 *
                 * If this is not set, debugging logic may not correctly stop debugging
                 * options like deleting objects from operating on the walls.
                 *
                 * @param {MazeCell} newWall the entity to use for the wall.
                 */
                set: function (newWall) { this._wall = newWall; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MazeDebugger.prototype, "teleporter", {
                /**
                 * Set the entity that was used to generate the teleport objects in the
                 * maze.
                 *
                 * If this is not set, debugging logic may not correctly process debugging
                 * options such as adding or deleting teleport instances.
                 *
                 * @param {Teleport} newTeleporter the entity to use for the teleporter
                 */
                set: function (newTeleporter) { this._teleport = newTeleporter; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MazeDebugger.prototype, "debugPoint", {
                /**
                 * Get the currently set debug point in this object. This represents the
                 * last position in the maze that the mouse passed over while debugging
                 * was turned on.
                 *
                 * @returns {Point} the last known debug point
                 */
                get: function () { return this._debugPoint; },
                /**
                 * Set a new debug point for this object. This will be used as the locus
                 * for all future debug operations that require a specific location to
                 * operate.
                 *
                 * @param {Point} newPoint the new point to use for debugging
                 */
                set: function (newPoint) { this._debugPoint.setTo(newPoint); },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MazeDebugger.prototype, "debugTracking", {
                /**
                 * Get the current state of the debug tracking variable.
                 *
                 * When this is set to true, we display a marker on the stage at the
                 * current debug position.
                 *
                 * @returns {boolean} true if debugging is enabled, false otherwise.
                 */
                get: function () { return this._debugTracking; },
                /**
                 * Change the current state of the debug tracking variable.
                 *
                 * True enables debugging, which causes the maze to display a red marker
                 * at the current debug location.
                 *
                 * @param {boolean} newValue new debugging state
                 */
                set: function (newValue) { this._debugTracking = newValue; },
                enumerable: true,
                configurable: true
            });
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
            MazeDebugger.prototype.getDebugCell = function () {
                return this._contents.getCellAt(this._debugPoint.x, this._debugPoint.y);
            };
            /**
             * Set the cell at the current debug location in the grid to the cell
             * provided.
             *
             * @param {MazeCell} newCell the new cell to insert into the grid
             */
            MazeDebugger.prototype.setDebugCell = function (newCell) {
                this._contents.setCellAt(this._debugPoint.x, this._debugPoint.y, newCell);
            };
            /**
             * Log to the console some information on the currently selected debug
             * cell in the maze, such as it's class, position, etc.
             */
            MazeDebugger.prototype.debugShowContents = function () {
                // Do nothing if tracking is turned off.
                if (this._debugTracking == false)
                    return false;
                // We always display the maze location no matter what.
                console.log("[DEBUG]: =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-");
                console.log("[DEBUG]: Selected maze location: " + this._debugPoint.toString());
                // Get the cell; if it's empty, say so and leave.
                var cell = this.getDebugCell();
                if (cell == null) {
                    console.log("[DEBUG]: Maze reports empty at this location");
                    return true;
                }
                if (cell.pool != null) {
                    var isAlive = cell.pool.liveEntities.indexOf(cell) != -1;
                    console.log("[DEBUG]: Entity is in pool (" + (isAlive ? "alive" : "dead") + ")");
                }
                else
                    console.log("[DEBUG]: No assigned actor pool");
                // Display some core information about this entity
                console.log("[DEBUG]: Entity type: " + cell.name + " (id=" + cell.properties.id + ")");
                console.log("[DEBUG]: Maze position: " + cell.mapPosition.toString());
                console.log("[DEBUG]: Screen position: " + cell.position.toString());
                console.log("[DEBUG]: Current animation: " + cell.animations.current);
                console.log("[DEBUG]: Current sprite: " + cell["_sprite"]);
                console.log("[DEBUG]: Object: ", cell);
                return true;
            };
            /**
             * Remove the contents of an existing cell from the maze, returning the
             * object back into its pool.
             *
             * This currently does not work on Teleport entities, since they need
             * special action to work.
             *
             * @returns {boolean} true if debugging was turned on and we tried to
             * handle the command, false if debugging is turned off.
             */
            MazeDebugger.prototype.debugClearCell = function () {
                // Do nothing if tracking is turned off.
                if (this._debugTracking == false)
                    return false;
                // Get the debug cell and leave if there isn't one.
                var cell = this.getDebugCell();
                if (cell == null)
                    return true;
                // There is a single Teleport entity, so all we have to do is remove
                // the current location as a destination.
                if (cell.name == "blackHole")
                    this._teleport.clearDestination(this._debugPoint);
                else if (cell.pool != null)
                    cell.kill();
                else {
                    console.log("Cannot delete boundary bricks");
                    return true;
                }
                // Clear the contents of the cell now.
                this.setDebugCell(null);
                return true;
            };
            /**
             * Wipe the entire contents of the maze, killing all entities. This will
             * leave only the bounding bricks that stop the ball from going out of
             * bounds.
             *
             * @returns {boolean} true if debugging was turned on and we tried to
             * handle the command, false if debugging is turned off.
             */
            MazeDebugger.prototype.debugWipeMaze = function () {
                // Do nothing if tracking is turned off.
                if (this._debugTracking == false)
                    return false;
                // Reset all entities, then generate walls into the maze to clear it
                // back to a known state.
                this._maze.resetMazeEntities();
                this._maze.generator.emptyMaze();
                return true;
            };
            /**
             * Toggle an existing cell through its subtypes (for cells that support
             * this).
             *
             * If the debug point is empty or not of a toggle-able type, this does
             * nothing.
             *
             * @returns {boolean} true if debugging was turned on and we tried to
             * handle the command, false if debugging is turned off.
             */
            MazeDebugger.prototype.debugToggleCell = function () {
                // Do nothing if tracking is turned off.
                if (this._debugTracking == false)
                    return false;
                // Get the debug cell and leave if there isn't one.
                var cell = this.getDebugCell();
                if (cell == null)
                    return true;
                // If the cell is an arrow, toggle the type. Doing this will also
                // implicitly set an auto-flip timer on the arrow when it becomes
                // such an arrow.
                if (cell.name == "arrow") {
                    var arrow = cell;
                    if (arrow.arrowType == game.ArrowType.ARROW_AUTOMATIC)
                        arrow.arrowType = game.ArrowType.ARROW_NORMAL;
                    else
                        arrow.arrowType = game.ArrowType.ARROW_AUTOMATIC;
                    return true;
                }
                // If the cell is a ball, toggle the type.
                if (cell.name == "ball") {
                    var ball = cell;
                    if (ball.ballType == game.BallType.BALL_PLAYER)
                        ball.ballType = game.BallType.BALL_COMPUTER;
                    else
                        ball.ballType = game.BallType.BALL_PLAYER;
                    ball.appear();
                    return true;
                }
                // If the cell is a brick, toggle the type. This will change the visual
                // representation back to the idle state for this brick type.
                //
                // This is skipped for solid bricks; they're just used on the outer
                // edges and should not be messed with.
                if (cell.name == "brick" && cell != this._wall) {
                    // Get the brick at the current location.
                    var currentBrick = cell;
                    var newBrick = null;
                    // We keep a separate pool of bonus bricks and gray bricks.
                    //
                    // In order to swap, we need to get an existing brick from the
                    // opposite pool, then put it into place and kill the other one.
                    if (currentBrick.brickType == game.BrickType.BRICK_BONUS)
                        newBrick = this._maze.getGrayBrick();
                    else if (currentBrick.brickType == game.BrickType.BRICK_GRAY)
                        newBrick = this._maze.getBonusBrick();
                    // If we got a brick, play the animation to cause it to appear,
                    // then put it into the maze and kill the current brick in the
                    // pool that it came from.
                    if (newBrick != null) {
                        newBrick.appear();
                        this.setDebugCell(newBrick);
                        currentBrick.kill();
                    }
                    else
                        console.log("Cannot toggle brick; not enough entities in currentBrickPool");
                    return true;
                }
                console.log("Cannot toggle entity; it does not support toggling");
                return true;
            };
            /**
             * Add a brick to the maze at the current debug location (assuming one
             * is available).
             *
             * This will add a gray brick, unless there are none left in the pool,
             * in which case it will try to add a bonus brick instead.
             *
             * If the current location is not empty, this does nothing.
             *
             * @returns {boolean} true if debugging was turned on and we tried to
             * handle the command, false if debugging is turned off.
             */
            MazeDebugger.prototype.debugAddBrick = function () {
                // Do nothing if tracking is turned off.
                if (this._debugTracking == false)
                    return false;
                // We can only add a brick if the current cell is empty.
                if (this.getDebugCell() == null) {
                    // Get a brick from one of the pools. We try the gray brick
                    // first since that pool is larger.
                    var newBrick = this._maze.getGrayBrick();
                    if (newBrick == null)
                        newBrick = this._maze.getBonusBrick();
                    // If we got a brick, appear it and add it to the maze.
                    if (newBrick) {
                        newBrick.appear();
                        this.setDebugCell(newBrick);
                    }
                    else
                        console.log("Unable to add brick; no entities left in either pool");
                }
                else
                    console.log("Cannot add brick; cell is not empty");
                return true;
            };
            /**
             * Vanish all of the bricks of a set type based on the parameter. Any
             * brick of the given type that is not already gone will vanish away.
             *
             * @param {boolean} grayBricks true to vanish gray bricks, false to
             * vanish bonus bricks.
             *
             * @returns {boolean} true if debugging was turned on and we tried to
             * handle the command, false if debugging is turned off.
             */
            MazeDebugger.prototype.debugVanishBricks = function (grayBricks) {
                // Do nothing if tracking is turned off.
                if (this._debugTracking == false)
                    return false;
                for (var row = 0; row < game.MAZE_HEIGHT; row++) {
                    for (var col = 0; col < game.MAZE_WIDTH; col++) {
                        var cell = this._contents.getCellAt(col, row);
                        if (cell != null && cell.name == "brick") {
                            var brick = cell;
                            if (brick.isHidden == false &&
                                brick.brickType == (grayBricks ? game.BrickType.BRICK_GRAY : game.BrickType.BRICK_BONUS))
                                brick.vanish();
                        }
                    }
                }
                return true;
            };
            /**
             * Add a teleport destination to the maze at the current debug location
             * (assuming one is available).
             *
             * There is only a single Teleport instance, so this always works and
             * just adds another potential destination to the list.
             *
             * If the current location is not empty, this does nothing.
             *
             * @returns {boolean} true if debugging was turned on and we tried to
             * handle the command, false if debugging is turned off.
             */
            MazeDebugger.prototype.debugAddTeleport = function () {
                // Do nothing if tracking is turned off.
                if (this._debugTracking == false)
                    return false;
                // We can only add an exit point if the current cell is empty.
                if (this.getDebugCell() == null) {
                    // Add the destination and the entity
                    this._teleport.addDestination(this._debugPoint);
                    this.setDebugCell(this._teleport);
                }
                else
                    console.log("Cannot add teleport; cell is not empty");
                return true;
            };
            /**
             * Add an arrow to the maze at the current debug location (assuming one
             * is available).
             *
             * This will add a normal, right facing arrow. The type of the arrow can
             * be toggled with the toggle command.
             *
             * If the current location is not empty, this does nothing.
             *
             * @returns {boolean} true if debugging was turned on and we tried to
             * handle the command, false if debugging is turned off.
             */
            MazeDebugger.prototype.debugAddArrow = function () {
                // Do nothing if tracking is turned off.
                if (this._debugTracking == false)
                    return false;
                // We can only add an arrow if the current cell is empty.
                if (this.getDebugCell() == null) {
                    // Try to get the arrow out of the pool; if it works, we can
                    // set it's type and add it.
                    var arrow = this._maze.getArrow();
                    if (arrow != null) {
                        arrow.arrowType = game.ArrowType.ARROW_NORMAL;
                        arrow.arrowDirection = game.ArrowDirection.ARROW_RIGHT;
                        this.setDebugCell(arrow);
                    }
                    else
                        console.log("Cannot add arrow; no entities left in pool");
                }
                else
                    console.log("Cannot add arrow; cell is not empty");
                return true;
            };
            /**
             * Add a player ball to the maze at the current debug location (assuming
             * one is available).
             *
             * If the current location is not empty, this does nothing.
             *
             * @returns {boolean} true if debugging was turned on and we tried to
             * handle the command, false if debugging is turned off.
             */
            MazeDebugger.prototype.debugAddBall = function () {
                // Do nothing if tracking is turned off.
                if (this._debugTracking == false)
                    return false;
                // We can only add a ball if the current cell is empty.
                if (this.getDebugCell() == null) {
                    // Try to get the ball out of the pool; if it works, we can
                    // set it's type and add it.
                    var ball = this._maze.getBall();
                    if (ball != null) {
                        ball.ballType = game.BallType.BALL_PLAYER;
                        ball.appear();
                        this.setDebugCell(ball);
                    }
                    else
                        console.log("Cannot add ball; no entities left in pool");
                }
                else
                    console.log("Cannot add ball; cell is not empty");
                return true;
            };
            return MazeDebugger;
        }());
        game.MazeDebugger = MazeDebugger;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * Scan to see what balls in the maze are available to be pushed. These are
         * balls that are in the top row of the maze and not immediately blocked.
         *
         * @param   {Maze}        maze the maze to scan
         *
         * @returns {Array<Ball>}      the array of balls that can be moved; may be
         * empty
         */
        function getEligibleBalls(maze) {
            var retVal = [];
            // Scan all columns that are potential ball columns in the maze to see
            // what is what.
            for (var col = 1; col < game.MAZE_WIDTH - 1; col++) {
                // Get the entity at this column.
                var entity = maze.contents.getCellAt(col, 0);
                // If it exists, is a ball, and is not blocked, add it to the list
                // of eligible balls.
                //
                // For the purposes of this, assume that this is not a simulation
                // because we can't push the ball if the ball was actually blocked
                // at this point.
                if (entity != null && entity.name == "ball" &&
                    maze.contents.getBlockingCellAt(col, 1, false) == null)
                    retVal.push(entity);
            }
            return retVal;
        }
        /**
         * Run a simulation of dropping the given ball through the given maze to see
         * what happens. This presumes that this ball is capable of moving.
         *
         * This will move the ball as far as it can (simulating the whole time) and
         * then return the simulation score for this ball, which is a function of
         * how many bonus bricks it collected and how far through the maze it got.
         *
         * @param   {Ball}   ball the ball to try pushing
         * @param   {Maze}   maze the maze to push the ball in
         *
         * @returns {number}      the score of the pushed ball
         */
        function simulateBallInMaze(ball, maze) {
            // Get a duplicate of the position that the ball is stored at currently,
            // then remove it from the maze so that it doesn't block itself.
            var storedPos = ball.mapPosition.copy();
            maze.contents.clearCellAt(storedPos.x, storedPos.y);
            // Now ensure the ball knows before we start that it is not moving.
            ball.moveType = game.BallMoveType.BALL_MOVE_NONE;
            // Keep moving the ball through the maze until it stops; the method
            // returns false when this happens.
            //
            // We pass in the simulation parameter here so that nothing happens
            // visually.
            while (maze.nextBallPosition(ball, storedPos, true))
                ;
            // Put the ball back where it came from.
            maze.contents.setCellAt(ball.mapPosition.x, ball.mapPosition.y, ball);
            // If the position where this ball stopped is the bottom of the maze,
            // it gets a bonus score.
            if (storedPos.y == game.MAZE_HEIGHT - 2)
                ball.score += game.GOAL_BALL_SCORE;
            // Return the final score, which is the number of bonus bricks that this
            // ball passed through, plus getting to the bottom (if it did), plus points
            // for each row it made it through the maze.
            return ball.score + (storedPos.y * game.BALL_POSITION_MULTIPLIER);
        }
        /**
         * Select the best move for an AI player based on the state of the maze
         * provided.
         *
         * This is naive and essentially tries to move every possible ball and see
         * which one would provide the best score. In the case that there is more
         * than one move that would provide the best score, this just randomly picks
         * a move.
         *
         * @param   {Maze} maze the maze to check for a move in
         *
         * @returns {Ball}      the ball entity from the maze that should be moved;
         * this will be null if there is no potential move.
         */
        function AI_selectBestMove(maze) {
            // This contains the list of balls that we think we should push, in case
            // there is more than one that is valid.
            var possiblePushes = [];
            // This is the highest score of a ball that we have seen thus far, which
            // factors in the score of the ball after being pushed (through bonus
            // bricks, for example) and its position in the maze.
            var highScore = 0;
            // Tell the maze we are entering the simulation.
            maze.beginSimulation();
            // Get the list of balls that could be potentially dropped, and then
            // iterate over them.
            var ballList = getEligibleBalls(maze);
            for (var i = 0; i < ballList.length; i++) {
                // Get the ball and then simulate with it.
                var ball = ballList[i];
                var ballScore = simulateBallInMaze(ball, maze);
                // If we're debugging, say what score was assigned for this ball.
                if (maze.debugger.debugTracking)
                    console.log(String.format("Ball simulation of {0} scores {1}", ball.mapPosition.toString(), ballScore));
                // If the score of this ball is at least as good or better than the
                // highest score, this ball is interesting.
                if (ballScore >= highScore) {
                    // If the score of this ball is larger than the highest score,
                    // throw away all other possible pushes and set this as the new
                    // high score.
                    if (ballScore > highScore) {
                        possiblePushes.length = 0;
                        highScore = ballScore;
                    }
                    // Save this ball as possible now.
                    possiblePushes.push(ball);
                }
                // This iteration is done, so restore now.
                maze.endSimulation();
            }
            // If we're debugging, indicate the potential AI choices.
            if (maze.debugger.debugTracking) {
                var results = [];
                for (var i = 0; i < possiblePushes.length; i++)
                    results.push(possiblePushes[i].mapPosition.toString());
                console.log(String.format("AI: {0} choices for score {1} => {2}", possiblePushes.length, highScore, results));
            }
            // If there are no moves, return null; if there is one move, return it.
            // Otherwise, randomly select one.
            switch (possiblePushes.length) {
                // No valid pushes; all moves are blocked.
                case 0:
                    return null;
                // Exactly one possible option; return it. This could be done with
                // the handler below, but then we would be generating a random
                // number between 1 and 1 and I don't know what bothers me more.
                case 1:
                    return possiblePushes[0];
                // More than one identical move, so randomly select one.
                default:
                    return possiblePushes[game.Utils.randomIntInRange(0, possiblePushes.length - 1)];
            }
        }
        game.AI_selectBestMove = AI_selectBestMove;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * This enumeration represents all of the potential states that the state
         * machine may be in at any given time.
         */
        var GameState;
        (function (GameState) {
            /**
             * There is no state. The purposes of this value is to be different from
             * all possible known states so that it can act as a sentinel.
             */
            GameState[GameState["NO_STATE"] = 0] = "NO_STATE";
            /**
             * This state is set while the maze is undergoing generation. The Maze
             * entity doing the generation will inform the registered event listener
             * when the generation is completed, at which point it will switch away
             * from this state.
             */
            GameState[GameState["MAZE_GENERATION"] = 1] = "MAZE_GENERATION";
            /**
             * We want it to be the human player's turn. In this state we check to
             * see if the human (or computer) can take a turn. If yes, the
             * appropriate player state is swapped to. Otherwise we skip to the
             * state where we start removing gray bricks.
             */
            GameState[GameState["CHECK_VALID_PLAY_PLAYER"] = 2] = "CHECK_VALID_PLAY_PLAYER";
            /**
             * We have determined that the player has at least one play to make, so
             * they can take a turn now. In this state, the controls available to
             * the player to make a move are enabled.
             */
            GameState[GameState["PLAYER_TURN"] = 3] = "PLAYER_TURN";
            /**
             * We want it to be the computer player's turn. In this state we check
             * to see if the computer (or human) can take a turn. If yes, the
             * appropriate player state is swapped to. Otherwise we skip to the
             * state where we start removing gray bricks.
             */
            GameState[GameState["CHECK_VALID_PLAY_COMPUTER"] = 4] = "CHECK_VALID_PLAY_COMPUTER";
            /**
             * The computer is taking its turn now. This state encompasses the
             * entirety of the computer taking it's turn, from selecting the move to
             * arriving at the correct position and pushing the ball. The update()
             * method in the Player entity is used to control this entire process.
             */
            GameState[GameState["COMPUTER_TURN"] = 5] = "COMPUTER_TURN";
            /**
             * Either the human player or the AI has pushed a ball. This state
             * remains in effect until the ball has finished moving, in which case
             * the handling code will either cycle to the state for the next player
             * to take their turn or to the state where we start the end of round
             * proceedings. round.
             */
            GameState[GameState["BALL_DROPPING"] = 6] = "BALL_DROPPING";
            /**
             * ALl of the possible plays have been made. In this state we are
             * finding and removing all balls that can't possibly move any farther
             * because they are not sitting on top of a gray brick that will vanish
             * and allow them to fall.
             */
            GameState[GameState["REMOVE_BLOCKED_BALLS"] = 7] = "REMOVE_BLOCKED_BALLS";
            /**
             * All of the possible plays have been made and all blocked ball have
             * beem removed. In this state we are removing all of the gray bricks
             * that are in the maze by vanishing them away. Once that is done we
             * transition to the state where we start dropping the final balls.
             */
            GameState[GameState["REMOVE_GRAY_BRICKS"] = 8] = "REMOVE_GRAY_BRICKS";
            /**
             * All of the gray bricks have been removed, so we are now in the
             * process of finding all balls that can still drop and dropping them.
             * We remain in this state until all balls have been dropped, and then
             * we either cycle back to the generation state for the next round or to
             * the game over state.
             */
            GameState[GameState["FINAL_BALL_DROP"] = 9] = "FINAL_BALL_DROP";
            /**
             * All of the gray bricks have been removed, all of the final ball drops
             * have finished, and we have no more rounds to play; the game is just
             * over now.
             */
            GameState[GameState["GAME_OVER"] = 10] = "GAME_OVER";
        })(GameState = game.GameState || (game.GameState = {}));
        /**
         * This class represents the state of the game in the current game. This is
         * uses in the Game scene to control what is happening and what can and
         * cannot happen at any given time.
         */
        var StateMachine = (function () {
            /**
             * Construct a new state machine.
             */
            function StateMachine() {
                // Set the current and previous states.
                this._currentState = GameState.NO_STATE;
                this._previousState = GameState.NO_STATE;
                // Default our tick value.
                this._ticksInState = 0;
                // Create the listener array.
                this._listeners = new Array();
            }
            Object.defineProperty(StateMachine.prototype, "state", {
                /**
                 * Get the current state of this state machine.
                 *
                 * @returns {GameState} the state that this machine is currently in
                 */
                get: function () { return this._currentState; },
                /**
                 * Set the current state of this state machine to the state provided.
                 * Attempts to switch to the current state have no effect and are
                 * ignored.
                 *
                 * @param {GameState} newState the state to switch to.
                 */
                set: function (newState) {
                    // Only do something when the state is actually changing
                    if (this._currentState != newState) {
                        // Save the current state, then switch it.
                        this._previousState = this._currentState;
                        this._currentState = newState;
                        // Reset the number of ticks that have happened in this state.
                        this._ticksInState = 0;
                        // Trigger listeners.
                        for (var i = 0; i < this._listeners.length; i++)
                            this._listeners[i].stateChanged(this, this._currentState);
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(StateMachine.prototype, "priorState", {
                /**
                 * Get the state that this state machine was in prior to being in the
                 * current state.
                 *
                 * Initially there is no previous state. Additionally, this only tracks
                 * actual state changes, so attempts to switch to the state that is
                 * currently already set does not update this state.
                 *
                 * @returns {GameState} the state that this machine was in prior to the
                 * current state
                 */
                get: function () { return this._previousState; },
                enumerable: true,
                configurable: true
            });
            /**
             * This is invoked once per update loop while this scene is the active
             * scene
             *
             * @param {number} tick the game tick; this is a count of how many times
             * the game loop has executed
             */
            StateMachine.prototype.update = function (tick) {
                // Count this as an elapsed tick.
                this._ticksInState++;
            };
            /**
             * Check to see if the machine has been in the current state for at
             * least the number of ticks provided, returning a boolean that
             * indicates if this is the case.
             *
             * This is not meant to be used as a timer that you check multiple times,
             * as once the tick count hit has elapsed, this will continue to return
             * true.
             *
             * @param   {number}  tickCount the tick count to check
             *
             * @returns {boolean}           true if at least this many ticks have
             * elapsed, or false otherwise.
             */
            StateMachine.prototype.hasElapsed = function (tickCount) {
                return this._ticksInState >= tickCount;
            };
            /**
             * Check to see if a timer that triggers on a multiple of the number of
             * ticks given has triggered or not. Unlike hasElapsed(), this can be
             * used for a recurring timer.
             *
             * In order to use this effectively this needs to be checked on every
             * frame update; if you skip a check during a frame you run the risk of
             * missing the tick that causes the timer to fire.
             *
             * @param   {number}  tickMultiple the multiple of the tick to trigger
             * for, e.g. 30 triggers once a second
             *
             * @returns {boolean}              true if the timer triggers during
             * this tick or false otherwise
             */
            StateMachine.prototype.timerTrigger = function (tickMultiple) {
                return this._ticksInState % tickMultiple == 0;
            };
            /**
             * Add the given object to the list of objects that get informed
             * whenever the state of this machine changes.
             *
             * If the object provided is already a listener, this does nothing.
             *
             * @param {StateMachineChangeListener} listener the new listener to add
             */
            StateMachine.prototype.addListener = function (listener) {
                // Add this listener if it's not already in the list.
                if (this._listeners.indexOf(listener) == -1)
                    this._listeners.push(listener);
            };
            /**
             * Remove the given object from the list of objects that get informed
             * whenever the state of this machine changes.
             *
             * If the object provided is not a listener, this does nothing.
             *
             * @param {StateMachineChangeListener} listener the listener to remove
             */
            StateMachine.prototype.removeListener = function (listener) {
                // Get the location of this listener; if it is in the list, remove
                // it.
                var location = this._listeners.indexOf(listener);
                if (location != -1)
                    this._listeners.splice(location, 1);
            };
            return StateMachine;
        }());
        game.StateMachine = StateMachine;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * This is used to indicate what type of player this is. This is just for
         * visual identification on the board.
         */
        var PlayerType;
        (function (PlayerType) {
            PlayerType[PlayerType["PLAYER_HUMAN"] = 0] = "PLAYER_HUMAN";
            PlayerType[PlayerType["PLAYER_COMPUTER"] = 1] = "PLAYER_COMPUTER";
        })(PlayerType = game.PlayerType || (game.PlayerType = {}));
        /**
         * This is used to indicate what direction this player is facing currently.
         * If the player has been told to switch to a particular facing, it will
         * start reporting that facing right away, even if it's still rotating
         * to face that direction.
         */
        var PlayerDirection;
        (function (PlayerDirection) {
            PlayerDirection[PlayerDirection["DIRECTION_RIGHT"] = 0] = "DIRECTION_RIGHT";
            PlayerDirection[PlayerDirection["DIRECTION_LEFT"] = 1] = "DIRECTION_LEFT";
            PlayerDirection[PlayerDirection["DIRECTION_DOWN"] = 2] = "DIRECTION_DOWN";
        })(PlayerDirection = game.PlayerDirection || (game.PlayerDirection = {}));
        /**
         * This provides a mapping between the values in the PlayerDirection enum
         * and the character that represents that direction in our animations.
         *
         * This is sensitive to the order of the values in the enumeration, but
         * you'll know when you forgot to fix it though, because everything will
         * look like crap.
         */
        var playerDirectionMap = ["r", "l", "d"];
        /**
         * The entity that represents a player in the game. This is a little man
         * that runs back and forth over the top of the maze that can push balls
         * into the maze to start them off.
         *
         * This entity is used as both the human and computer player (although they
         * are represented by different sprites).
         */
        var Player = (function (_super) {
            __extends(Player, _super);
            /**
             * Construct a new maze cell that will render on the stage provided and
             * which has the entity name provided.
             *
             * This class will automatically set the sprite sheet to the sheet used
             * by all MazeCell subclasses and invoke the setDimensions() method once
             * the preload has completed, at which point dimensions and other
             * handling can be done.
             *
             * @param {Stage}      stage      the stage that we use to render
             * ourselves
             * @param {PlayerType} playerType the type of player entity this should
             * be
             */
            function Player(stage, playerType) {
                var _this = 
                // Invoke the super; note that this does not set a position because
                // that is set by whoever created us. Our dimensions are based on
                // our sprites, so we don't set anything here.
                _super.call(this, "player", stage, 0, 0, 0, 0, 1, {}, {}, 'blue') || this;
                /**
                 * This callback is invoked when the preload of our sprite sheet is
                 * finished and the image is fully loaded.
                 *
                 * This allows us to set our dimensions. Position waits until we know
                 * the maze has fully loaded all of its images as well so that it knows
                 * how to size itself.
                 *
                 * @param {SpriteSheet} sheet the sprite sheet that was loaded
                 */
                _this.setDimensions = function (sheet) {
                    _this.makeRectangle(sheet.width, sheet.height);
                };
                // Load the sprite sheet that will contain our sprites. The size of
                // the entity is based on the size of the sprites, so we let the
                // callback handle that.
                _this._sheet = new game.SpriteSheet(stage, "sprites_5_12.png", 5, 12, true, _this.setDimensions);
                // The default reference point is the upper left corner of the screen.
                _this._referencePoint = new game.Point(0, 0);
                // We start out visible.
                _this._visible = true;
                // Set up animations. There are multiple idle and rotate animations,
                // and a set for the player and human.
                //
                // These follow a strict format so that we can use string formatting
                // to select the appropriate animation easily.
                // Player: Idling facing a given direction.
                _this.addAnimation("p_idle_r", 1, false, [40]);
                _this.addAnimation("p_idle_d", 1, false, [42]);
                _this.addAnimation("p_idle_l", 1, false, [44]);
                // Computer: Idling facing a given direction.
                _this.addAnimation("c_idle_r", 1, false, [50]);
                _this.addAnimation("c_idle_d", 1, false, [52]);
                _this.addAnimation("c_idle_l", 1, false, [54]);
                // Player: Pushing in each direction.
                _this.addAnimation("p_push_r", 15, false, [40, 45, 45, 45, 40]);
                _this.addAnimation("p_push_d", 15, false, [42, 47, 47, 47, 42]);
                _this.addAnimation("p_push_l", 15, false, [44, 49, 49, 49, 44]);
                // Computer: Pushing in each direction.
                _this.addAnimation("c_push_r", 15, false, [50, 55, 55, 55, 50]);
                _this.addAnimation("c_push_d", 15, false, [52, 57, 57, 57, 52]);
                _this.addAnimation("c_push_l", 15, false, [54, 59, 59, 59, 54]);
                // Player: Rotating between all facings.
                _this.addAnimation("p_rotate_r_l", 15, false, [40, 41, 42, 43, 44]);
                _this.addAnimation("p_rotate_l_r", 15, false, [44, 43, 42, 41, 40]);
                _this.addAnimation("p_rotate_r_d", 15, false, [40, 41, 42]);
                _this.addAnimation("p_rotate_l_d", 15, false, [44, 43, 42]);
                _this.addAnimation("p_rotate_d_r", 15, false, [42, 41, 40]);
                _this.addAnimation("p_rotate_d_l", 15, false, [42, 43, 44]);
                // Computer: Rotating between all facings.
                _this.addAnimation("c_rotate_r_l", 15, false, [50, 51, 52, 53, 54]);
                _this.addAnimation("c_rotate_l_r", 15, false, [54, 53, 52, 51, 50]);
                _this.addAnimation("c_rotate_r_d", 15, false, [50, 51, 52]);
                _this.addAnimation("c_rotate_l_d", 15, false, [54, 53, 52]);
                _this.addAnimation("c_rotate_d_r", 15, false, [52, 51, 50]);
                _this.addAnimation("c_rotate_d_l", 15, false, [52, 53, 54]);
                // Save the type given, then set up the correct facing.
                _this._playerType = playerType;
                _this._playerDirection = PlayerDirection.DIRECTION_RIGHT;
                // If this is a computer player, change the default animation from
                // the one that was automatically selected (the first one added).
                if (playerType == PlayerType.PLAYER_COMPUTER)
                    _this.playAnimation("c_idle_r");
                // Set up default AI parameters.
                _this._aiSelectedColumn = 0;
                _this._maze = null;
                return _this;
            }
            Object.defineProperty(Player.prototype, "playerType", {
                /**
                 * Get the type of the current player; this controls what the player
                 * looks like.
                 *
                 * @returns {PlayerType} the type of player this entity represents
                 */
                get: function () { return this._playerType; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Player.prototype, "playerDirection", {
                /**
                 * Get the direction that this player is currently facing or rotating
                 * to face.
                 *
                 * @returns {PlayerDirection} the current direction.
                 */
                get: function () { return this._playerDirection; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Player.prototype, "referencePoint", {
                /**
                 * Get the reference position that sets us as far left as we can be and
                 * still be in bounds of the maze. This is used to calculate our
                 * position when it changes.
                 *
                 * @returns {Point} the current reference position.
                 */
                get: function () { return this._referencePoint; },
                /**
                 * Change the reference position that sets us as far left as we can be
                 * and still be in bounds of the maze.
                 *
                 * When this is set to a new value, our position is automatically
                 * recalculated based on this point and our current mapPosition.
                 *
                 * @param {Point} newPoint the new reference point
                 */
                set: function (newPoint) {
                    this._referencePoint.setTo(newPoint);
                    this.updateScreenPosition();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Player.prototype, "visible", {
                /**
                 * Get the visibility state of this entity; when the entity is
                 * invisible, its update() and render() methods do nothing.
                 *
                 * @returns {boolean} true to be visible and active or false to be
                 * invisible and inactive.
                 */
                get: function () { return this._visible; },
                /**
                 * Set the visibility state of this entity; when the entity is invisible,
                 * its update() and render() methods do nothing
                 *
                 * @param {boolean} newState the new visibility state to apply
                 */
                set: function (newState) { this._visible = newState; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Player.prototype, "maze", {
                /**
                 * Get the maze entity that this computer AI controlled Player will use
                 * to select its moves. A human controlled player entity ignroes this
                 * value.
                 *
                 * @returns {Maze} the maze currently being used for move selection.
                 */
                get: function () { return this._maze; },
                /**
                 * Set the maze entity that this computer AI controlled player will use
                 * to select its moves. A human controlled player entity ignores this
                 * value.
                 *
                 * @param {Maze} newMaze [description]
                 */
                set: function (newMaze) { this._maze = newMaze; },
                enumerable: true,
                configurable: true
            });
            /**
             * Update our screen position based on our currently set reference point
             * and our map position.
             *
             * Only the X value of the map position is used to calculate, since we
             * never actually enter the maze.
             */
            Player.prototype.updateScreenPosition = function () {
                this._position.setToXY(this._referencePoint.x +
                    (this.mapPosition.x * this._width), this._referencePoint.y);
            };
            /**
             * Update internal state for this pklayer entity.
             *
             * This always invokes the super to do engine housekeeping (such as
             * updating animations), but if we are not visible, no further logic is
             * applied.
             *
             * @param stage the stage that the actor is on
             * @param tick the game tick; this is a count of how many times the game
             * loop has executed
             */
            Player.prototype.update = function (stage, tick) {
                // Let the super do its job.
                _super.prototype.update.call(this, stage, tick);
                // The remainder of the logic is for the computer player when it is
                // taking a turn. Thus it does not need to execute if this is a
                // human player, the entity is not currently visible, or we are
                // already done with our turn.
                if (this._visible == false || this._playerType == PlayerType.PLAYER_HUMAN ||
                    this._aiSelectedColumn == 0)
                    return;
                // If there is not a target column for the ball to push yet, then we
                // need to select that right now.
                if (this._aiSelectedColumn == -1)
                    this.ai_selectTargetColumn();
                else if (this._aiSelectedColumn != this._mapPosition.x)
                    this.ai_stepTowardsTargetBall();
                else
                    this.ai_pushTargetBall();
            };
            /**
             * Render this player using the renderer provided. The position given is
             * the position to render on the screen.
             *
             * This will invoke the super version by default, unless we're not
             * visible, in which case it does nothing.
             *
             * @param x the x location to render the actor at, in stage coordinates
             * (NOT world)
             * @param y the y location to render the actor at, in stage coordinates
             * (NOT world)
             * @param renderer the class to use to render the actor
             */
            Player.prototype.render = function (x, y, renderer) {
                // If we're visible, let the super render us.
                if (this._visible)
                    _super.prototype.render.call(this, x, y, renderer);
            };
            /**
             * Get an indication as to whether the player is capable of pushing at
             * the moment.
             *
             * If this returns false, calling the push () method will have no
             * effect.
             *
             * @returns {boolean} true if the player can push now, false otherwise.
             */
            Player.prototype.canPush = function () {
                // We can only push if we're not currently running any animation.
                return this.animations.isPlaying == false;
            };
            /**
             * Run the animation to push the ball from the current facing.
             *
             * If the player cannot currently push, this does nothing. Otherwise it
             * runs the animation that pushes the ball in the current facing
             * direction of the player.
             *
             * While the push animation is running, no other actions are possible.
              */
            Player.prototype.push = function () {
                // Leave if we can't push.
                if (this.canPush() == false)
                    return;
                // Construct the animation that needs to play to push from the
                // current facing.
                var animation = String.format("{0}_push_{1}", (this._playerType == PlayerType.PLAYER_HUMAN ? "p" : "c"), playerDirectionMap[this._playerDirection]);
                // Now play the animation
                this.playAnimation(animation);
            };
            /**
             * Get an indication as to whether the player is capable of turning at
             * the moment.
             *
             * If this returns false, calling the turnTo () method will have no
             * effect.
             *
             * @returns {boolean} true if the player can turn now, false otherwise.
             */
            Player.prototype.canTurn = function () {
                // Can only turn if we're not currently running any animation.
                return this.animations.isPlaying == false;
            };
            /**
             * Turn the player to face the direction given from their current
             * facing.
             *
             * If the player cannot currently turn, this does nothing. Otherwise it
             * runs the animation that rotates the player from their current facing
             * to the one provided.
             *
             * While the turn animation is running, no other actions are possible.
             *
             * @param {PlayerDirection} newDirection the new direction to face in.
             */
            Player.prototype.turnTo = function (newDirection) {
                // If we can't currently turn or the direction to turn to is the
                // direction we're already facing, then just leave and do nothing.
                if (this.canTurn() == false || this._playerDirection == newDirection)
                    return;
                // Construct the animation that needs to play to change the facing
                // to the one provided.
                var animation = String.format("{0}_rotate_{1}_{2}", (this._playerType == PlayerType.PLAYER_HUMAN ? "p" : "c"), playerDirectionMap[this._playerDirection], playerDirectionMap[newDirection]);
                // Now play the animation and change the facing.
                this.playAnimation(animation);
                this._playerDirection = newDirection;
            };
            /**
             * Modify the map location of this player entity by translating the X
             * coordinate by the value provided. Once this is done, the screen
             * position is updated to match the new map position.
             *
             * This method is simple and does not validate that the translation will
             * keep the entity within the correct span of the maze.
             *
             * @param {number} translateX the value to translate by
             */
            Player.prototype.moveBy = function (translateX) {
                this._mapPosition.translateXY(translateX, 0);
                this.updateScreenPosition();
            };
            /**
             * Jump the position of the player entity on the screen directly to the
             * given absolute column in the maze. Once this is done, the screen position
             * is updated to match the new map position.
             *
             * This method is simple and does not validate that the translation will
             * keep the entity within the correct span of the maze.
             *
             * @param {number} newX the column to jump the player entity to
             */
            Player.prototype.jumpTo = function (newX) {
                this._mapPosition.x = newX;
                this.updateScreenPosition();
            };
            /**
             * This method is for use when this player entity represents a computer
             * AI player.
             *
             * This is to inform the entity that it is becoming their turn and so on
             * the next call to the update method, we should start our turn.
             */
            Player.prototype.ai_startingTurn = function () {
                // Indicate that we need to select a column to push on the next
                // update loop.
                this._aiSelectedColumn = -1;
            };
            /**
             * When invoked, this method selects the ball from the current maze
             * layout that it wants to push.
             *
             * This will always select a ball to push, so this should only be
             * invoked when we know that we need to select a new ball.
             */
            Player.prototype.ai_selectTargetColumn = function () {
                // Use the AI function to select a ball in the maze.
                //
                // This should always return a valid ball to push (and never null)
                // because we ensure that there is actually a move available prior
                // to switching to the AI turn.
                var ball = game.AI_selectBestMove(this._maze);
                if (ball == null) {
                    // Disregard that comment above; this is bad and can conceivably
                    // happen because we don't actually perform that check like the
                    // comment says we do (yet).
                    this._aiSelectedColumn = 0;
                    console.log("AI decided it cannot make a move; this is bad mojo");
                    return;
                }
                // Set the target position to the one that is in the ball that
                // we want to push.
                this._aiSelectedColumn = ball.mapPosition.x;
                console.log("AI selected ball at column " + this._aiSelectedColumn);
            };
            /**
             * When the AI player is not currently at the correct column in the maze
             * to push its target ball, this method should be invoked.
             *
             * It will cause the player to step towards the correct column, making
             * sure that we change our facing as needed first.
             */
            Player.prototype.ai_stepTowardsTargetBall = function () {
                // Assume that we want to go left, which is a positional offset of
                // -1.
                var direction = PlayerDirection.DIRECTION_LEFT;
                var offset = -1;
                // If the target map position is larger than  us, we actually want
                // to turn right instead.
                if (this._mapPosition.x < this._aiSelectedColumn) {
                    direction = PlayerDirection.DIRECTION_RIGHT;
                    offset = 1;
                }
                // If we are not currently facing in the correct direction, then we
                // need to turn to that direction.
                if (this._playerDirection != direction)
                    this.turnTo(direction);
                else if (this.animations.isPlaying == false)
                    this.moveBy(offset);
            };
            /**
             * When the AI player is standing in the correct column in the maze to
             * push its target ball, this method should be invoked.
             *
             * It will cause the computer player to turn towards the ball and push
             * it.
             */
            Player.prototype.ai_pushTargetBall = function () {
                // If we are not currently facing downards, then we need to face
                // in that direction now.
                if (this._playerDirection != PlayerDirection.DIRECTION_DOWN)
                    this.turnTo(PlayerDirection.DIRECTION_DOWN);
                else if (this.animations.isPlaying == false) {
                    this.push();
                    if (this._maze.pushBall(this._aiSelectedColumn))
                        this._aiSelectedColumn = 0;
                }
            };
            return Player;
        }(game.Entity));
        game.Player = Player;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * The entity that represents a cell inside of the Maze entity.
         *
         * These are basically regular Entity objects with a slightly different
         * common interface.
         */
        var MazeCell = (function (_super) {
            __extends(MazeCell, _super);
            /**
             * Construct a new maze cell that will render on the stage provided and
             * which has the entity name provided.
             *
             * This class will automatically set the sprite sheet to the sheet
             * used by all MazeCell subclasses and invoke the setDimensions() method
             * once the preload has completed, at which point dimensions and other
             * handling can be done.
             *
             * @param {Stage}  stage the stage that we use to render ourselves
             * @param {String} name  the entity name for this subclass
             */
            function MazeCell(stage, name) {
                var _this = 
                // Invoke the super; note that this does not set a position because
                // that is set by whoever created us. Our dimensions are based on
                // our sprites, so we don't set anything here.
                _super.call(this, name, stage, 0, 0, 0, 0, 1, {}, {}, 'blue') || this;
                /**
                 * The ActorPool that this MazeCell is defined in. This is null before
                 * it is put into a pool, and afterwards always tracks the last actor
                 * pool it was added to.
                 */
                _this._pool = null;
                /**
                 * This callback is invoked when the preload of our sprite sheet is
                 * finished and the image is fully loaded.
                 *
                 * This method is not overrideable due to the way it is implemented, so
                 * we just invoke the client version of this method so that subclasses
                 * can specialize if needed.
                 *
                 * @param {SpriteSheet} sheet the sprite sheet that was loaded
                 */
                _this.preloadComplete = function (sheet) {
                    // Invoke the regular method now.
                    _this.spritesheetLoaded(sheet);
                };
                // Load the sprite sheet that will contain our sprites. The size of
                // the entity is based on the size of the sprites, so we let the
                // callback handle that.
                _this._sheet = new game.SpriteSheet(stage, "sprites_5_12.png", 5, 12, true, _this.preloadComplete);
                return _this;
            }
            Object.defineProperty(MazeCell.prototype, "name", {
                /**
                 * Get the name associated with this entity. This is generally a textual
                 * name that represents what class of entity this is.
                 *
                 * @returns {string} the name of this entity.
                 */
                get: function () { return this._name; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MazeCell.prototype, "pool", {
                /**
                 * Obtain the actor pool that this MazeCell is stored in, if any
                 *
                 * @returns {ActorPool<ActorPoolClient>} the actor pool this cell is stored
                 * in, or null if it is not in a pool
                 */
                get: function () { return this._pool; },
                /**
                 * Set the actor pool that this MazeCell is stored in
                 *
                 * @param {ActorPool<ActorPoolClient>} newPool the actor pool that this
                 * cell is stored in.
                 */
                set: function (newPool) { this._pool = newPool; },
                enumerable: true,
                configurable: true
            });
            /**
             * This is invoked when our sprite sheet has finished loading, allowing
             * us to perform any tasks that require information from the sprite
             * sheet, such as the dimensions.
             *
             * @param {SpriteSheet} sheet the loaded sprite sheet
             */
            MazeCell.prototype.spritesheetLoaded = function (sheet) {
                // Set our bounds based on the dimensions of the sprites in the
                // loaded sheet.
                this.makeRectangle(sheet.width, sheet.height);
            };
            /**
             * Using the ActorPool currently associated with this entity, kill it.
             *
             * If there is no pool associated yet, this sends a warning to the
             * console to tell us that we have done something stupid.
             */
            MazeCell.prototype.kill = function () {
                if (this._pool != null)
                    this._pool.killEntity(this);
                else
                    console.log("Kill on " + this._name + " when it has no pool");
            };
            /**
             * Render this cell using the renderer provided. The position provided
             * represents the actual position of this cell as realized on the
             * screen, which means that assumes that is relative to the screen and
             * not the Maze entity.
             *
             * @param x the x location to render the cell at, in stage coordinates
             * (NOT world)
             * @param y the y location to render the cell at, in stage coordinates
             * (NOT world)
             * @param renderer the class to use to render the cell
             */
            MazeCell.prototype.render = function (x, y, renderer) {
                // Let the super do the work now.
                _super.prototype.render.call(this, x, y, renderer);
            };
            /**
             * Returns a determination on whether this maze cell, in its current
             * state, would block the ball from moving through it or not.
             *
             * The boolean parameter isSimulation is true if this ball movement is
             * taking place as the result of a simulation (e.g. for AI purposes).
             * This allows the entity to potentially change how it operates based on
             * saved state or the fact that this is a simulation.
             *
             * When this returns true, the ball is stopped before entering this
             * cell. Otherwise, it is allowed to enter this cell.
             *
             * @param {boolean} isSimulation true if this is part of a simulation,
             * false otherwise
             *
             * @returns {boolean} true if this entity should block this ball moving
             * through it or false if it should allow such movement.
             */
            MazeCell.prototype.blocksBall = function (isSimulation) {
                return true;
            };
            /**
             * If this Maze cell blocks the ball (blocksBall() returns true), then
             * this method will be invoked to indicate that the ball tried to enter
             * the same maze cell as it is currently occupies..
             *
             * The collision is informed of the maze that it is contained in, the
             * ball that it is colliding with, and the location in the maze that the
             * collision is happening at (i.e. the location in the maze of this
             * MazeCell).
             *
             * If desired, the position of the ball can be modified by returning a
             * point that represents the new position in the maze. Otherwise, the
             * ball is left at the current location.
             *
             * This position may or may not be used by the engine; if it is,
             * didMoveBall() will be invoked to tell us that the ball provided was
             * actually moved.
             *
             * It is important to note that no side effects of the collision should
             * be applied to the state of the entity here, since this gets invoked
             * for a variety of reasons.
             *
             * @param   {Maze}  maze     the maze containing us and the ball
             * @param   {Ball}  ball     the ball that is colliding with us
             * @param   {Point} location the location in the maze that we are at
             *
             * @returns {Point}          if non-null, this is the position that the
             * ball should be moved to in response to colliding with us; a return
             * value of null indicates the ball should stay where it is.
             */
            MazeCell.prototype.ballCollision = function (maze, ball, location) {
                return null;
            };
            /**
             * This is invoked after a call to ballCollsiion() indicated that the
             * ball location should be changed as a result of colliding with us, and
             * the position of the ball was actually changed as a result of what we
             * said.
             *
             * The ball that was moved is provided to the call to indicate which
             * ball was the one that moved.
             *
             * The boolean parameter isSimulation is true if this ball movement is
             * taking place as the result of a simulation (e.g. for AI purposes).
             * When this is true, the entity should update internal state but not
             * change anything visual about itself, since this new state is
             * temporary.
             *
             * @param {Ball}    ball          the ball that we moved
             * @param {boolean} isSimulation true if this is part of a simulation,
             * false otherwise
             */
            MazeCell.prototype.didMoveBall = function (ball, isSimulation) {
            };
            /**
             * This is invoked when the ball enters the same cell as this maze
             * entity (which means that a call to blocksBall() returned false) to
             * tell us that the ball has actually entered our location.
             *
             * The collision is informed of the maze that it is contained in, the
             * ball that is touching us, and the location in the maze that the touch
             * is happening at (i.e. the location in the maze of this MazeCell).
             *
             * If desired, the position of the ball can be modified by returning a
             * point that represents the new position in the maze; otherwise the
             * ball is left at the current location.
             *
             * This position may or may not be used by the engine. If the position
             * of the ball is changed, a touch event will not fire if the ball was
             * placed on top of another entity that supports this call.
             *
             * The boolean parameter isSimulation is true if this touch event is
             * taking place as the result of a simulation (e.g. for AI purposes).
             * When this is true, the entity should update internal state but not
             * change anything visual about itself, since this new state is
             * temporary.
             *
             * @param   {Maze}    maze         the maze containing us and the ball
             * @param   {Ball}    ball         the ball that is touching us
             * @param   {Point}   location     the location in the mazer that we are
             * at
             * @param   {boolean} isSimulation true if this is part of a simulation,
             *
             * @returns {Point}                if non-null, this is the position
             * that the ball should be moved to in response to touching us; a return
             * value of null indicates that the ball should stay where it is
             */
            MazeCell.prototype.ballTouch = function (maze, ball, location, isSimulation) {
                return null;
            };
            /**
             * This method is invoked on this entity when the engine is entering
             * simulation mode for any reason.
             *
             * In response to this call, any important non-visual state in this
             * entity should be saved somewhere persistent (for the duration of the
             * current game).
             */
            MazeCell.prototype.enteringSimulation = function () {
            };
            /**
             * This method is invoked on this entity when the engine is exiting
             * simulation mode for any reason (even temporarily).
             *
             * In response to this call, the state saved from the call to
             * enteringSimulation() should be restored internally.
             *
             * This may be invoked several times in response to a single call to
             * enteringSimulation(), so this should only restore the state and not
             * destroy it.
             */
            MazeCell.prototype.exitingSimulation = function () {
            };
            return MazeCell;
        }(game.Entity));
        game.MazeCell = MazeCell;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * This is a simple entity for use during debugging. It can mark a cell in
         * the maze by rendering its bounds.
         */
        var Marker = (function (_super) {
            __extends(Marker, _super);
            /**
             * Construct a new marker entity that will render on the stage provided.
             *
             * This needs to know the size of the cells in the grid so that it knows
             * how to render itself; this means an instance cannot be created until
             * all of the preloads are finished and we know the cell size.
             *
             * @param {Stage}  stage    the stage that we use to render ourselves
             * @param {number} cellSize the size of the cells (in pixels)
             */
            function Marker(stage, cellSize) {
                // Invoke the super; note that this does not set a position because
                // we're rendered wherever we are needed. We do set our dimensions
                // however.
                return _super.call(this, "marker", stage, 0, 0, cellSize, cellSize, 1, {}, {}, 'white') || this;
            }
            return Marker;
        }(game.Entity));
        game.Marker = Marker;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * This is used to indicate what type of ball this is. This is just for
         * visual identification on the board.
         */
        var BallType;
        (function (BallType) {
            BallType[BallType["BALL_PLAYER"] = 0] = "BALL_PLAYER";
            BallType[BallType["BALL_COMPUTER"] = 1] = "BALL_COMPUTER";
        })(BallType = game.BallType || (game.BallType = {}));
        /**
         * As the ball is being moved through the maze, a value of this type is
         * stored into it to indicate under what circumstances it moved. This allows
         * a ball or other entity to make a decision about how to move the ball
         * based on prior movement.
         *
         * The prime case of this is allowed a ball pushed by an arrow to roll over
         * other stationary balls.
         */
        var BallMoveType;
        (function (BallMoveType) {
            BallMoveType[BallMoveType["BALL_MOVE_NONE"] = 0] = "BALL_MOVE_NONE";
            BallMoveType[BallMoveType["BALL_MOVE_DROP"] = 1] = "BALL_MOVE_DROP";
            BallMoveType[BallMoveType["BALL_MOVE_LEFT"] = 2] = "BALL_MOVE_LEFT";
            BallMoveType[BallMoveType["BALL_MOVE_RIGHT"] = 3] = "BALL_MOVE_RIGHT";
            BallMoveType[BallMoveType["BALL_MOVE_JUMP"] = 4] = "BALL_MOVE_JUMP";
        })(BallMoveType = game.BallMoveType || (game.BallMoveType = {}));
        /**
         * The entity that represents the bricks in the game. These can be used for
         * level geometry or in the actual play area. Some of them are statically
         * displayed while some of them can animate themselves appearing or
         * vanishing away.
         */
        var Ball = (function (_super) {
            __extends(Ball, _super);
            /**
             * Construct a new ball entity that will render on the stage provided.
             *
             * The ball type provided is used to determine what the ball looks like
             * on the screen.
             *
             * @param {Stage}     stage     the stage that we use to render
             * ourselves
             * @param {ballType} typeOfBall the type of ball entity this should be
             */
            function Ball(stage, typeOfBall) {
                if (typeOfBall === void 0) { typeOfBall = BallType.BALL_PLAYER; }
                var _this = 
                // Invoke the super; note that this does not set a position because
                // that is set by whoever created us. Our dimensions are based on
                // our sprites, so we don't set anything here.
                _super.call(this, stage, "ball") || this;
                // Set up all of the animations that will be used for this entity.
                // There are two sets; one for the player ball and one for the
                // computer ball.
                _this.addAnimation("p_idle", 1, false, [10]);
                _this.addAnimation("p_idle_gone", 1, false, [14]);
                _this.addAnimation("p_vanish", 10, false, [10, 11, 12, 13, 14]);
                _this.addAnimation("p_appear", 10, false, [14, 13, 12, 11, 10]);
                _this.addAnimation("c_idle", 1, false, [15]);
                _this.addAnimation("c_idle_gone", 1, false, [19]);
                _this.addAnimation("c_vanish", 10, false, [15, 16, 17, 18, 19]);
                _this.addAnimation("c_appear", 10, false, [19, 18, 17, 16, 15]);
                // The ball is not hidden by default (the first animation in the list
                // is the one that plays by default).
                _this._hidden = false;
                // Set the ball type to the value passed in. This will make sure
                // that the ball is properly represented by playing the appropriate
                // idle animation.
                _this.ballType = typeOfBall;
                // The ball does not start rolling
                _this.moveType = BallMoveType.BALL_MOVE_NONE;
                // Create the point for our saved position during simulations.
                _this._savedPosition = new game.Point(0, 0);
                _this._savedScore = 0;
                return _this;
            }
            Object.defineProperty(Ball.prototype, "ballType", {
                /**
                 * Get the type of ball that this is; this is used to set a visual
                 * representation of the ball
                 *
                 * @returns {BallType} the current type of the ball
                 */
                get: function () { return this._ballType; },
                /**
                 * Set the type of ball that this is; this is used to set a visual
                 * representation of the ball.
                 *
                 * After setting the ball, the animation is set to the appropriate idle
                 * animation for this ball based on it's type.
                 *
                 * @param {BallType} newType the new type of the ball
                 */
                set: function (newType) {
                    // Set the type of the ball to the one passed in, then set the
                    // ball to idle.
                    this._ballType = newType;
                    this.idle();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Ball.prototype, "moveType", {
                /**
                 * Get the movement type that was most recently set on this ball. This
                 * can be used during movement to influence how an entity moves the
                 * ball.
                 *
                 * @returns {BallMoveType} the last set movement type of this ball
                 */
                get: function () { return this._moveType; },
                /**
                 * Change the movement type of this ball to the type passed in; this
                 * value can be retreived and used by entities to influence how they
                 * operate.
                 *
                 * @param {BallMoveType} newMoveType the new movement type to set
                 */
                set: function (newMoveType) {
                    this._moveType = newMoveType;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Ball.prototype, "score", {
                /**
                 * Get the current score value set for this ball.
                 *
                 * @returns {number} the current score value (which may be 0)
                 */
                get: function () { return this._score; },
                /**
                 * Set the scoring value for this ball.
                 *
                 * @param {number} newScore the new score for this ball
                 */
                set: function (newScore) { this._score = newScore; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Ball.prototype, "isHidden", {
                /**
                 * Tells you if this ball is hidden or not based on its visual state.
                 *
                 * This is only an indication of whether the methods in the class have
                 * told it to display or not. In particular, if you change the ball
                 * animation without using a method in this class, the value here may
                 * not track. Additionally, the ball may consider itself hidden while it
                 * is still vanishing. If it matters, check if the current animation is
                 * playing or not as well.
                 *
                 * @returns {boolean} true if this ball is currently hidden or false
                 * otherwise
                 */
                get: function () { return this._hidden; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Ball.prototype, "player", {
                /**
                 * Return the type of player that owns this ball. This is derived from
                 * the current ball type, and is read-only.
                 *
                 * @returns {PlayerType} the type of player that owns this ball. ball.
                 */
                get: function () {
                    if (this._ballType == BallType.BALL_PLAYER)
                        return game.PlayerType.PLAYER_HUMAN;
                    return game.PlayerType.PLAYER_COMPUTER;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Set the visual state of the ball to idle; this is the normal state,
             * in which the ball just sits there, looking pretty.
             */
            Ball.prototype.idle = function () {
                this.playAnimation(this._ballType == BallType.BALL_PLAYER
                    ? "p_idle"
                    : "c_idle");
                this._hidden = false;
            };
            /**
             * Set the visual state of the ball to hidden; this is an idle state in
             * which the ball is no longer visible on the screen.
             */
            Ball.prototype.hide = function () {
                this.playAnimation(this._ballType == BallType.BALL_PLAYER
                    ? "p_idle_gone"
                    : "c_idle_gone");
                this._hidden = true;
            };
            /**
             * Set the visual state of the ball to vanish; this plays an animation
             * that causes the ball to vanish from the screen. This is identical to
             * the hidden state (see hide()) but you see the ball vanishing.
             */
            Ball.prototype.vanish = function () {
                this.playAnimation(this._ballType == BallType.BALL_PLAYER
                    ? "p_vanish"
                    : "c_vanish");
                this._hidden = true;
            };
            /**
             * Set the visual state of the ball to appear; this plays an animation
             * that causes the ball to transition from a hidden to idle state. This
             * is identical to the idle state (see idle()) bvut you can see the ball
             * appearing.
             */
            Ball.prototype.appear = function () {
                this.playAnimation(this._ballType == BallType.BALL_PLAYER
                    ? "p_appear"
                    : "c_appear");
                this._hidden = false;
            };
            /**
             * Balls only block other balls while they are still visible. This is
             * true whether this is a simulation or not.
             *
             * @param {boolean} isSimulation true if this is part of a simulation,
             * false otherwise
             *
             * @returns {boolean} true if this ball should block the ball or false
             * if the ball should be allowed to pass through it.
             */
            Ball.prototype.blocksBall = function (isSimulation) {
                // If the ball is not hidden, then we block; otherwise we do not.
                return this._hidden == false;
            };
            /**
             * When a ball touches us, we will push it to the left or to the right
             * as long as the last time the ball moved, it was because of a move
             * left or right.
             *
             * This means that for the specific case of a ball moving because it
             * was pushed with an arrow, it will "roll over" us and keep going as
             * if we were an arrow.
             *
             * @param   {Maze}  maze     the maze containing us and the ball
             * @param   {Ball}  ball     the ball that is coliding with us
             * @param   {Point} location the location in the maze that we are at
             *
             * @returns {Point}          the location provided, update to be to the
             * left or right of where it currently sits.
             */
            Ball.prototype.ballCollision = function (maze, ball, location) {
                // Depending on the type of move the ball made last, act
                // accordingly. As long as the ball is trying to drop into us and it
                // was last pushed laterally, keep it moving in that direction.
                switch (ball.moveType) {
                    case BallMoveType.BALL_MOVE_LEFT:
                        return location.copyTranslatedXY(-1, 0);
                    case BallMoveType.BALL_MOVE_RIGHT:
                        return location.copyTranslatedXY(1, 0);
                    default:
                        return null;
                }
            };
            /**
             * Invoked when we are entering the simulation mode. This saves
             * important state to be restored later.
             */
            Ball.prototype.enteringSimulation = function () {
                // Save our mapPosition and score.
                this._savedPosition.setTo(this._mapPosition);
                this._savedScore = this._score;
            };
            /**
             * Restore saved data that was saved when we entered the simulation.
             */
            Ball.prototype.exitingSimulation = function () {
                this._mapPosition.setTo(this._savedPosition);
                this._score = this._savedScore;
            };
            return Ball;
        }(game.MazeCell));
        game.Ball = Ball;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * This is used to specify the valid values for brick types. This includes
         * static bricks that make up the level, as well as bricks that make up the
         * actual play area.
         */
        var BrickType;
        (function (BrickType) {
            BrickType[BrickType["BRICK_BACKGROUND"] = 0] = "BRICK_BACKGROUND";
            BrickType[BrickType["BRICK_SOLID"] = 1] = "BRICK_SOLID";
            BrickType[BrickType["BRICK_GRAY"] = 2] = "BRICK_GRAY";
            BrickType[BrickType["BRICK_BONUS"] = 3] = "BRICK_BONUS";
        })(BrickType = game.BrickType || (game.BrickType = {}));
        /**
         * The entity that represents the bricks in the game. These can be used for
         * level geometry or in the actual play area. Some of them are statically
         * displayed while some of them can animate themselves appearing or
         * vanishing away.
         */
        var Brick = (function (_super) {
            __extends(Brick, _super);
            /**
             * Construct a new brick entity that will render on the stage provided.
             *
             * This supports all three kinds of bricks: The permanent bricks that
             * surround the play area, the background of the play area, and the gray
             * blocks that impede ball movement until all balls are pushed.
             *
             * @param {Stage}     stage       the stage that we use to render
             * ourselves
             * @param {BrickType} typeOfBrick the type of brick entity this should
             * be
             */
            function Brick(stage, typeOfBrick) {
                if (typeOfBrick === void 0) { typeOfBrick = BrickType.BRICK_SOLID; }
                var _this = 
                // Invoke the super; note that this does not set a position because
                // that is set by whoever created us. Our dimensions are based on
                // our sprites, so we don't set anything here.
                _super.call(this, stage, "brick") || this;
                // The non-animated bricks don't have their update methods called,
                // so no special setup is needed here.
                //
                // For the animated brick types, we set up animations for them,
                // which includes the idle states (where they are not animating).
                _this.addAnimation("gray_idle", 1, false, [5]);
                _this.addAnimation("gray_idle_gone", 1, false, [9]);
                _this.addAnimation("gray_vanish", 10, false, [5, 6, 7, 8, 9]);
                _this.addAnimation("gray_appear", 10, false, [9, 8, 7, 6, 5]);
                _this.addAnimation("bonus_idle", 1, false, [30]);
                _this.addAnimation("bonus_idle_gone", 1, false, [34]);
                _this.addAnimation("bonus_vanish", 10, false, [30, 31, 32, 33, 34]);
                _this.addAnimation("bonus_appear", 10, false, [34, 33, 32, 31, 30]);
                // Set a default brick type. This will make sure that this brick
                // is properly visually represented, either by playing the correct
                // animation or by selecting the appropriate sprite.
                _this.brickType = typeOfBrick;
                // Start out not collected in the simulation:
                _this._simulationCollected = false;
                return _this;
            }
            Object.defineProperty(Brick.prototype, "brickType", {
                /**
                 * Get the brick type of this brick.
                 *
                 * @returns {BrickType} the current brick type for this brick; this
                 * corresponds to the visual appearance of the brick on the screen.
                 */
                get: function () {
                    return this._brickType;
                },
                /**
                 * Set the brick type for the current brick. This visually changes the
                 * appearance of the brick as well.
                 *
                 * For static bricks, this changes rendering to the appropriate sprite,
                 * while for animated bricks it selects an idle animation. It favors the
                 * idle animation that shows the brick being present on the screen.
                 *
                 * @param {BrickType} newType the new type of the brick.
                 */
                set: function (newType) {
                    // First, set our internal type flag to the one provided.
                    this._brickType = newType;
                    // Now set up visuals. For non-animated bricks, we just set the
                    // sprite from the sprite sheet. For animated bricks, we need to
                    // start playing the appropriate idle animation.
                    //
                    // This works because the Maze entity makes sure to only call update
                    // for animated brick entities, and that call will mess with the
                    // current sprite.
                    switch (this._brickType) {
                        // These are primarily used to represent the outer bounds of the
                        // play area.
                        case BrickType.BRICK_SOLID:
                            this._sprite = 0;
                            break;
                        // These appear in the game grid and stop the ball, but vanish
                        // away near the end of the game to allow for final ball
                        // movement.
                        case BrickType.BRICK_GRAY:
                            this.playAnimation("gray_idle");
                            break;
                        // These appear in the game grid; they don't actually block
                        // movement of the ball, but as the ball passes through them
                        // they award bonus points.
                        case BrickType.BRICK_BONUS:
                            this.playAnimation("bonus_idle");
                            break;
                        // Everything else is just a background brick. These are used to
                        // represent the back wall of the play area.
                        default:
                            this._sprite = 1;
                            break;
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Brick.prototype, "isHidden", {
                /**
                 * Tells you if this brick is hidden or not based on its visual state.
                 *
                 * This is only an indication of whether the methods in the class have
                 * told it to display or not. In particular, if you change the brick
                 * animation without using a method in this class, the value here may
                 * not track. Additionally, the brick may consider itself hidden while
                 * it is still vanishing. If it matters, check if the current animation
                 * is playing or not as well.
                 *
                 * @returns {boolean} true if this brick is currently hidden or false
                 * otherwise
                 */
                get: function () { return this._hidden; },
                enumerable: true,
                configurable: true
            });
            /**
             * Set the visual state of the ball to idle; this is the normal state,
             * in which the ball just sits there, looking pretty.
             */
            Brick.prototype.idle = function () {
                this.playAnimation(this._brickType == BrickType.BRICK_GRAY
                    ? "gray_idle"
                    : "bonus_idle");
                this._hidden = false;
            };
            /**
             * Set the visual state of the ball to hidden; this is an idle state in
             * which the ball is no longer visible on the screen.
             */
            Brick.prototype.hide = function () {
                this.playAnimation(this._brickType == BrickType.BRICK_GRAY
                    ? "gray_idle_gone"
                    : "bonus_idle_gone");
                this._hidden = true;
            };
            /**
             * Set the visual state of the ball to vanish; this plays an animation
             * that causes the ball to vanish from the screen. This is identical to
             * the hidden state (see hide()) but you see the ball vanishing.
             */
            Brick.prototype.vanish = function () {
                this.playAnimation(this._brickType == BrickType.BRICK_GRAY
                    ? "gray_vanish"
                    : "bonus_vanish");
                this._hidden = true;
            };
            /**
             * Set the visual state of the ball to appear; this plays an animation
             * that causes the ball to transition from a hidden to idle state. This
             * is identical to the idle state (see idle()) bvut you can see the ball
             * appearing.
             */
            Brick.prototype.appear = function () {
                this.playAnimation(this._brickType == BrickType.BRICK_GRAY
                    ? "gray_appear"
                    : "bonus_appear");
                this._hidden = false;
            };
            /**
             * The only bricks that block the ball are solid bricks and gray bricks
             * that are still visible on the screen.
             *
             * Gray bricks will only block the ball from moving when this is not a
             * simulation; in a simulation they always act as if they are invisible,
             * to allow for AI to try and guess where the ball will ultimately land.
             *
             * @param {boolean} isSimulation true if this is part of a simulation,
             * false otherwise
             *
             * @returns {boolean} true if this brick should block the brick or false
             * if the ball should be allowed to pass through it.
             */
            Brick.prototype.blocksBall = function (isSimulation) {
                switch (this._brickType) {
                    // Bonus bricks always allow the ball to pass through.
                    case BrickType.BRICK_BONUS:
                        return false;
                    // Gray bricks allow the ball to pass through if they have
                    // vanished.
                    case BrickType.BRICK_GRAY:
                        if (this._hidden)
                            return false;
                        // The brick is still visible; it only blocks when this is
                        // not a simulation; during a simulation it never blocks,
                        // even when visible.
                        return isSimulation == false;
                    // Everything else blocks movement.
                    default:
                        return true;
                }
            };
            /**
             * For bricks that allow us to enter them, this will get invoked if the
             * ball enters our cell in the maze.
             *
             * This is only true for gray bricks that are gone or for bonus bricks
             * that are still visible. In the case of a bonus brick, this handles
             * the removal of the bonus brick.
             *
             * When isSimulation is true for a bonus brick, instead of vanishing the
             * brick away we update the score of the ball that touched us so that
             * the simulation can track the score change.
             *
             * @param   {Maze}    maze         the maze containing us and the ball
             * @param   {Ball}    ball         the ball that is touching us
             * @param   {Point}   location     the location in the mazer that we are
             * at
             * @param   {boolean} isSimulation true if this is part of a simulation,
             *
             * @returns {Point}          always null; we never move the ball
             */
            Brick.prototype.ballTouch = function (maze, ball, location, isSimulation) {
                // No matter what, we never want to do anything unless this is a bonus
                // brick; when we pass through gray bricks, we just pass through them.
                if (this._brickType != BrickType.BRICK_BONUS)
                    return null;
                // We are not simulating; this is a normal touch.
                if (isSimulation == false) {
                    // If this bonus brick is visible, then vanish it to consider
                    // ourselves collected.
                    if (this._hidden == false)
                        this.vanish();
                    // Score points for the owner of the ball as well.
                    game.bonusBrickScore(ball);
                }
                else {
                    // We are simulating, so if we have not already set the flag
                    // saying we are collected, update the score in the ball that
                    // touched us.
                    if (this._simulationCollected == false)
                        ball.score += game.BONUS_BRICK_SCORE;
                    // We are collected now, no matter what.
                    this._simulationCollected = true;
                }
                return null;
            };
            /**
             * Invoked when we are entering the simulation mode. This saves
             * important state to be restored later.
             */
            Brick.prototype.enteringSimulation = function () {
                // Our entity (when it is a bonus brick) considers itself already
                // collected when it is hidden or available when it is not. Save
                // that value here. During the simulation, this value will change
                // only.
                this._simulationCollected = this._hidden;
            };
            /**
             * Restore saved data that was saved when we entered the simulation.
             */
            Brick.prototype.exitingSimulation = function () {
                // When we are exiting the simulation, we can set the simulated
                // value the same as we did when we entered the simulation, so that
                // we go back to the state we were in then.
                this.enteringSimulation();
            };
            return Brick;
        }(game.MazeCell));
        game.Brick = Brick;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * The entity that represents black holes (teleporters) in the game.
         */
        var Teleport = (function (_super) {
            __extends(Teleport, _super);
            /**
             * Construct a new teleport entity that will render on the stage
             * provided.
             *
             * This entity is always in a continuously animated state.
             *
             * @param {Stage} stage the stage that we use to render ourselves
             */
            function Teleport(stage) {
                var _this = 
                // Invoke the super; note that this does not set a position because
                // that is set by whoever created us. Our dimensions are based on
                // our sprites, so we don't set anything here.
                _super.call(this, stage, "blackHole") || this;
                // Set up an animation. As this is the first animation, it will play
                // by default.
                _this.addAnimation("idle", 10, true, [35, 36, 37, 38, 39]);
                // Create the list of destinations
                _this._destinations = new Array();
                return _this;
            }
            Object.defineProperty(Teleport.prototype, "destination", {
                /**
                 * Get the destination of this teleport.
                 *
                 * There can be one or more destinations available from this teleport
                 * instance, in which case one of them is randomly selected.
                 *
                 * If there are no destinations registered, this returns null
                 *
                 * @returns {Point} the destination of this teleport
                 */
                get: function () {
                    // How we operate depends on how many many destinations we have
                    switch (this._destinations.length) {
                        // No known destinations
                        case 0:
                            return null;
                        // Exactly one destination
                        case 1:
                            return this._destinations[0];
                        // Many destinations
                        default:
                            return this._destinations[game.Utils.randomIntInRange(0, this._destinations.length - 1)];
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Teleport.prototype, "destinationList", {
                /**
                 * Obtain the complete list of current destinations known to this
                 * entity.
                 *
                 * This is an array which can have any number of elements, including 0.
                 *
                 * @returns {Array<Point>} the list of destinations stored in this
                 * instance.
                 */
                get: function () { return this._destinations; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Teleport.prototype, "length", {
                /**
                 * Get the number of destinations registered on this teleport instance.
                 *
                 * This can be any number >= 0; when it is larger than 1, a destination
                 * is randomly selected
                 *
                 * @returns {number} the number of destinations in the destination list
                 * of this instance.
                 */
                get: function () { return this._destinations.length; },
                enumerable: true,
                configurable: true
            });
            /**
             * Internal helper; given a point, scan the list of destinations to see
             * if this destination appears anywhere in it. If it does, its index in
             * the destination array is returned; otherwise -1 is returned.
             *
             * @param   {Point}  destination the destination to check
             *
             * @returns {number}             the index of the destination in the
             * list, or -1 if it does not exist.
             */
            Teleport.prototype.indexOfDestination = function (destination) {
                // Simple scan.
                for (var i = 0; i < this._destinations.length; i++) {
                    if (destination.equals(this._destinations[i]))
                        return i;
                }
                return -1;
            };
            /**
             * Add a potential destination to this teleport instance. This can be
             * invoked more than once, in which case when activated the teleport
             * will randomly select the destination from those provided.
             *
             * If this destination is already in the list, nothing happens.
             *
             * @param {Point} destination the destination to add
             */
            Teleport.prototype.addDestination = function (destination) {
                if (this.indexOfDestination(destination) == -1)
                    this._destinations.push(destination.copy());
            };
            /**
             * Remove all known destinations from this teleport object. This removes
             * its ability to teleport the ball anywhere.
             */
            Teleport.prototype.clearDestinations = function () {
                // Throw away all known destinations.
                this._destinations.length = 0;
            };
            /**
             * Remove a single destination from the list of destinations allowed by
             * this teleport instance.
             *
             * If the destination is not in the list, nothing happens.
             *
             * @param {Point} destination the destination to remove
             */
            Teleport.prototype.clearDestination = function (destination) {
                var index = this.indexOfDestination(destination);
                if (index != -1)
                    this._destinations.splice(index, 1);
            };
            /**
             * We don't block the ball because we change its position when it gets
             * on top of us instead of when it touches us.
             *
             * @param {boolean} isSimulation true if this is part of a simulation,
             * false otherwise
             *
             * @returns {boolean} always false; the ball is allowed to move through
             * us
             */
            Teleport.prototype.blocksBall = function (isSimulation) {
                return false;
            };
            /**
             * When the ball is sitting on top of us, we transfer it to a different
             * location in the grid, which has been previously given to us, if
             * possible
             *
             * @param   {Maze}  maze     the maze containing us and the ball
             * @param   {Ball}  ball     the ball that is touching us
             * @param   {Point} location the location in the mazer that we are at
             *
             * @returns {Point}          the potential landing location, if we can
             * find one that is not blocked
             */
            Teleport.prototype.ballTouch = function (maze, ball, location) {
                // If there are no destinations stored, we can't teleport, so do
                // nothing.
                if (this.length == 0)
                    return null;
                // There are some destinations registered; get one out randomly.
                var newPos = this.destination;
                // As long as the new position is the same as the position that was
                // given to us, select a new position (if possible), so that we
                // don't try to teleport the ball to where it already is.
                while (newPos.equals(location)) {
                    // If there is only a single destination, leave; we can't
                    // teleport because the ball is already there.
                    if (this.length == 1)
                        return null;
                    // Try again.
                    newPos = this.destination;
                }
                // Indicate the new position
                return newPos;
            };
            return Teleport;
        }(game.MazeCell));
        game.Teleport = Teleport;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * For automatic arrows, this is the minimum number of seconds before the
         * arrow will automatically flip itself. This can be a fractional value.
         */
        var MIN_AUTO_FLIP_SECONDS = 3;
        /**
         * For automatic arrows, this is the maximum number of seconds before the
         * arrow will automatically flip itself. This can be a fractional value.
         */
        var MAX_AUTO_FLIP_SECONDS = 12;
        /**
         * This is used to specify the two types of arrows in the game.
         *
         * A normal arrow faces some direction and only swaps directions when it is
         * touched. An automatic arrow randomly swaps directions while the ball is
         * dropping, even if it is not touched.
         */
        var ArrowType;
        (function (ArrowType) {
            ArrowType[ArrowType["ARROW_NORMAL"] = 0] = "ARROW_NORMAL";
            ArrowType[ArrowType["ARROW_AUTOMATIC"] = 1] = "ARROW_AUTOMATIC";
        })(ArrowType = game.ArrowType || (game.ArrowType = {}));
        ;
        /**
         * This is used to specify the direction that an arrow is currently facing,
         * which represents what direction a ball touching it from above will be
         * pushed.
         *
         * When an arrow changes directions, the direction is instantaneously
         * changed, although the animation may still show it transitioning.
         */
        var ArrowDirection;
        (function (ArrowDirection) {
            ArrowDirection[ArrowDirection["ARROW_LEFT"] = 0] = "ARROW_LEFT";
            ArrowDirection[ArrowDirection["ARROW_RIGHT"] = 1] = "ARROW_RIGHT";
        })(ArrowDirection = game.ArrowDirection || (game.ArrowDirection = {}));
        /**
         * The entity that represents arrows in the game. This covers both style
         * of arrows (the kind that move only when touched by a ball and the kind
         * that randomly swap directions).
         */
        var Arrow = (function (_super) {
            __extends(Arrow, _super);
            /**
             * Construct a new arrow entity that will render on the stage provided.
             *
             * This entity is always in a continuously animated state, although the
             * animation may be only a single frame.
             *
             * @param {Stage}          stage     the stage that we use to render
             * ourselves
             * @param {ArrowType}      arrowType the type of arrow to create
             * @param {ArrowDirection} direction the direction the arrow is facing
             */
            function Arrow(stage, arrowType, direction) {
                if (arrowType === void 0) { arrowType = ArrowType.ARROW_NORMAL; }
                if (direction === void 0) { direction = ArrowDirection.ARROW_LEFT; }
                var _this = 
                // Invoke the super; note that this does not set a position because
                // that is set by whoever created us. Our dimensions are based on
                // our sprites, so we don't set anything here.
                _super.call(this, stage, "arrow") || this;
                // Capture the type and direction of the arrow.
                _this._arrowType = arrowType;
                _this._arrowDirection = direction;
                _this._savedArrowDirection = direction;
                // If this is an automatic arrow, set up the auto flip timer right
                // away.
                if (arrowType == ArrowType.ARROW_AUTOMATIC)
                    _this.setAutoFlipTimer();
                // Set up animations for this entity. We need animations for two
                // different types of entity, so animations are prefixed with 'n'
                // for "normal" arrows and 'a' for "automatically rotating" arrows.
                //
                // We need idle animations for facing in both directions for both
                // types of arrow.
                _this.addAnimation("n_idle_right", 1, false, [20]);
                _this.addAnimation("n_idle_left", 1, false, [24]);
                _this.addAnimation("a_idle_right", 1, false, [25]);
                _this.addAnimation("a_idle_left", 1, false, [29]);
                // Now we need animations that swap facing from either right to left
                // or left to right. As above, we need two different versions.
                _this.addAnimation("n_rotate_r_to_l", 10, false, [20, 21, 22, 23, 24]);
                _this.addAnimation("n_rotate_l_to_r", 10, false, [24, 23, 22, 21, 20]);
                _this.addAnimation("a_rotate_r_to_l", 10, false, [25, 26, 27, 28, 29]);
                _this.addAnimation("a_rotate_l_to_r", 10, false, [29, 28, 27, 26, 25]);
                // Based on the type and direction, set the appropriate animation
                // playing. We always start out being idle.
                _this.resetAnimation();
                return _this;
            }
            Object.defineProperty(Arrow.prototype, "arrowType", {
                /**
                 * Obtain the type of this arrow. This is either a normal arrow, which
                 * only swaps its direction when it is touched by a dropping ball, or
                 * an automatic ball, which randomly swaps directions.
                 *
                 * @returns {ArrowType} the type of this arrow
                 */
                get: function () { return this._arrowType; },
                /**
                 * Change the type of this arrow to the type passed in. This will modify
                 * the visual representation of the arrow, but the animation selected
                 * will be the idle animation appropriate for the type and direction of
                 * the arrow, so if this is invoked while the arrow is animating, the
                 * animation will jump.
                 *
                 * When the type passed in is the automatic arrow type, the internal
                 * timer for how long until the arrow randomly flips directions is
                 * reset.
                 *
                 * If this sets the type to the type that already exists, nothing
                 * happens except for the possible resetting of the auto flip timer (to
                 * allow you to force a timer reset).
                 *
                 * @param {ArrowType} newType the new arrow type
                 */
                set: function (newType) {
                    // If the new type is automatic, set up the auto flip timer.
                    if (newType == ArrowType.ARROW_AUTOMATIC)
                        this.setAutoFlipTimer();
                    // If the type is actually changing, change it and ensure that the
                    // visual representation of the arrow is correct.
                    if (newType != this._arrowType) {
                        this._arrowType = newType;
                        this.resetAnimation();
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Arrow.prototype, "arrowDirection", {
                /**
                 * Obtain the current facing direction of the arrow. In the case that
                 * the arrow is currently in the process of changing its facing visually
                 * from one direction to another, this reports what the final direction
                 * will be, even if the arrow is still animating.
                 *
                 * @returns {ArrowDirection} the current facing direction of this arrow
                 */
                get: function () { return this._arrowDirection; },
                /**
                 * Set the current facing direction of the arrow. This immediately jumps
                 * the state of the arrow to the correct new facing, skipping the
                 * animation that happens with the flip() method.
                 *
                 * If this sets the direction to the direction that is already set,
                 * nothing happens.
                 *
                 * @param {ArrowDirection} newDirection the new direction
                 */
                set: function (newDirection) {
                    // If the direction is actually changing, change it and ensure that
                    // the visual representation of the arrow is correct.
                    if (newDirection != this._arrowDirection) {
                        this._arrowDirection = newDirection;
                        this.resetAnimation();
                    }
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Reset the internal timer that counts down how long it will be until
             * the arrow automatically flips (if it's going to do that).
             *
             * This always resets the timer; it's up the caller to only invoke this
             * when it wants that to happen.
             */
            Arrow.prototype.setAutoFlipTimer = function () {
                this._autoFlipTimer = game.Utils.randomIntInRange(Math.floor(30 * MIN_AUTO_FLIP_SECONDS), Math.floor(30 * MAX_AUTO_FLIP_SECONDS));
            };
            /**
             * This resets the animation for the arrow based on it's current type
             * and direction.
             *
             * This will select the appropriate idle animation for the type and
             * direction that the arrow is currently set for.
             *
             * This is an internal helper for use when we manually set the type
             * and direction values.
             */
            Arrow.prototype.resetAnimation = function () {
                // Based on the type and direction, set the appropriate animation
                // playing. We always start out being idle.
                switch (this._arrowType) {
                    case ArrowType.ARROW_NORMAL:
                        this.playAnimation(this._arrowDirection == ArrowDirection.ARROW_LEFT
                            ? "n_idle_left"
                            : "n_idle_right");
                        break;
                    case ArrowType.ARROW_AUTOMATIC:
                        this.playAnimation(this._arrowDirection == ArrowDirection.ARROW_LEFT
                            ? "a_idle_left"
                            : "a_idle_right");
                        break;
                }
            };
            /**
             * This is called every frame update (tick tells us how many times this
             * has happened) to allow us to update ourselves.
             *
             * @param {Stage}  stage the stage that we are on
             * @param {number} tick  the current engine tick; this advances once for
             * each frame update
             */
            Arrow.prototype.update = function (stage, tick) {
                // Let the super do it's thing for us.
                _super.prototype.update.call(this, stage, tick);
                // If this is an automatic arrow, decrement the timer and maybe also
                // call the flip function if it's time to automatically flip.
                if (this._arrowType == ArrowType.ARROW_AUTOMATIC) {
                    this._autoFlipTimer--;
                    if (this._autoFlipTimer == 0)
                        this.flip(false);
                }
            };
            /**
             * Flip the current direction of this arrow from left to right or vice
             * versa.
             *
             * This will immediately change the internal direction that the arrow
             * thinks that it is pointing, but it will also start the arrow
             * animating towards it's new facing, where it will stop.
             *
             * The animation of the the arrow flipping will not be played if this is
             * a simulation, which simplifies the restore code.
             *
             * @param {boolean} isSimulation true if this is a simulated flip or not
             */
            Arrow.prototype.flip = function (isSimulation) {
                // Based on the direction that we're currently facing, swap the
                // direction to the other way, and set our animation to rotate to
                // the appropriate location.
                switch (this._arrowDirection) {
                    case ArrowDirection.ARROW_LEFT:
                        if (isSimulation == false)
                            this.playAnimation(this._arrowType == ArrowType.ARROW_NORMAL
                                ? "n_rotate_l_to_r"
                                : "a_rotate_l_to_r");
                        this._arrowDirection = ArrowDirection.ARROW_RIGHT;
                        break;
                    case ArrowDirection.ARROW_RIGHT:
                        if (isSimulation == false)
                            this.playAnimation(this._arrowType == ArrowType.ARROW_NORMAL
                                ? "n_rotate_r_to_l"
                                : "a_rotate_r_to_l");
                        this._arrowDirection = ArrowDirection.ARROW_LEFT;
                        break;
                }
                // If this is an automatic arrow, reset the timer for the next
                // automatic flip.
                if (this._arrowType == ArrowType.ARROW_AUTOMATIC)
                    this.setAutoFlipTimer();
            };
            /**
             * When the ball touches us, we collide with it but shift it to either
             * the left or right, depending on what direction we're pointing.
             *
             * @param   {Maze}  maze     the maze containing us and the ball
             * @param   {Ball}  ball     the ball that is colliding with us
             * @param   {Point} location the location in the maze that we are at
             *
             * @returns {Point}          the location provided, update to be to the
             * left or right of where it currently sits.
             */
            Arrow.prototype.ballCollision = function (maze, ball, location) {
                // Return a translated copy
                return location.copyTranslatedXY(this._arrowDirection == ArrowDirection.ARROW_LEFT ? -1 : 1, 0);
            };
            /**
             * This is invoked if we successfully pushed the ball to the side that
             * we're currently facing.
             *
             * We take this opportunity to flip ourselves to face the other
             * direction.
             *
             * @param {Ball} ball the ball that we moved
             */
            Arrow.prototype.didMoveBall = function (ball, isSimulation) {
                // Mark the direction that we moved the ball.
                ball.moveType = (this._arrowDirection == ArrowDirection.ARROW_LEFT)
                    ? game.BallMoveType.BALL_MOVE_LEFT
                    : game.BallMoveType.BALL_MOVE_RIGHT;
                // Flip our orientation now.
                this.flip(isSimulation);
            };
            /**
             * Invoked when we are entering the simulation mode. This saves
             * important state to be restored later.
             */
            Arrow.prototype.enteringSimulation = function () {
                // Save our current direction.
                this._savedArrowDirection = this._arrowDirection;
            };
            /**
             * Restore saved data that was saved when we entered the simulation.
             */
            Arrow.prototype.exitingSimulation = function () {
                // Restore our saved position.
                this._arrowDirection = this._savedArrowDirection;
            };
            return Arrow;
        }(game.MazeCell));
        game.Arrow = Arrow;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * The number of ticks between steps in a normal (interactive) ball drop,
         */
        var NORMAL_DROP_SPEED = 3;
        /**
         * The number of ticks between steps in a final (end of round) ball drop.
         */
        var FINAL_DROP_SPEED = 1;
        /**
         * The entity that represents the maze in the game. This is the entire play
         * area of the game.
         */
        var Maze = (function (_super) {
            __extends(Maze, _super);
            /**
             * Construct a new empty maze entity.
             *
             * @param {Stage} stage the stage that we use to render ourselves
             */
            function Maze(stage) {
                var _this = 
                // Invoke the super; note that this does not set a position because
                // that is set by whoever created us. Our dimensions are based on
                // the size of the brick sprites, which we don't know yet.
                _super.call(this, "maze", stage, 0, 0, 0, 0, 1, {}, {}, 'blue') || this;
                /**
                 * This callback is invoked when our sprite sheet finishes loading the
                 * underlying image for the sprites.
                 */
                _this.setDimensions = function (sheet) {
                    // Alter our collision properties so that our bounds represent the
                    // entire maze area.
                    _this.makeRectangle(sheet.width * game.MAZE_WIDTH, sheet.height * game.MAZE_HEIGHT);
                    // Set the cell size now.
                    _this._cellSize = sheet.width;
                    // Determine how much width is left on the stage that is not taken
                    // up by us.
                    var remainder = _this._stage.width - _this.width;
                    // Create a marker entity and set it's dimensions based on the
                    // sprite sheet we loaded. Our callback might get invoked before
                    // that of the _empty entity that our cellSize property returns,
                    // so it's not safe to reference it here.
                    _this._marker = new game.Marker(_this._stage, sheet.width);
                    // Create the debug marker. This is as above, but we modify its
                    // debug color to visually distinguish it. We need to violate the
                    // privacy rules here because this is not supposed to be externally
                    // touchable.
                    _this._debugMarker = new game.Marker(_this._stage, sheet.width);
                    _this._debugMarker["_debugColor"] = 'red';
                    // Set our position to center us on the screen horizontally and be
                    // just slightly up from the bottom of the screen. We use half of
                    // the remainder of the width, so that the bottom edge is as far
                    // from the bottom of the screen as the side edges are.
                    _this.setStagePositionXY(Math.floor((_this._stage.width / 2) - (_this.width / 2)), Math.floor(_this._stage.height - _this.height - (remainder / 2)));
                    // Now that we know our position and cell size, set that into the
                    // maze contents so that it can update the position of things.
                    _this._contents.cellSize = _this._cellSize;
                    _this._contents.position = _this._position;
                };
                // There is no listener by default.
                _this._listener = null;
                // Set up a preload for the same sprite sheet that the brick entities
                // are using. This will allow us to capture the callback that
                // indicates that the sprite size is known, so that we can set up
                // our dimensions.
                new game.SpriteSheet(stage, "sprites_5_12.png", 5, 12, true, _this.setDimensions);
                // Create our singleton maze entities; these are entities for which
                // we only ever have a single instance that's used everywhere.
                _this._empty = new game.Brick(stage, game.BrickType.BRICK_BACKGROUND);
                _this._solid = new game.Brick(stage, game.BrickType.BRICK_SOLID);
                _this._blackHole = new game.Teleport(stage);
                // Create our maze contents, generator, and debugger; order is
                // important here, the generator and debugger need to get the
                // contents from us to initialize, and the debugger requires the
                // generator to already be available.
                _this._contents = new game.MazeContents();
                _this._generator = new game.MazeGenerator(_this);
                _this._debugger = new game.MazeDebugger(_this);
                _this._generator.wall = _this._solid;
                _this._debugger.wall = _this._solid;
                _this._generator.teleporter = _this._blackHole;
                _this._debugger.teleporter = _this._blackHole;
                // Create our entity pools.
                _this._arrows = new game.ActorPool();
                _this._grayBricks = new game.ActorPool();
                _this._bonusBricks = new game.ActorPool();
                _this._balls = new game.ActorPool();
                // There is no ball dropping by default; also set up default values
                // for the drop time and speed (drop time is not consulted unless
                // a ball is dropping).
                _this._droppingBall = null;
                _this._lastDroppedBall = null;
                _this._dropSpeed = NORMAL_DROP_SPEED;
                _this._lastDropTick = 0;
                // No ball has finished moving and no gray bricks have been removed.
                // These also get reset on level generation.
                _this._ballMoveFinalized = false;
                _this._droppingFinalBall = false;
                // Pre-populate all of our actor pools with the maximum possible
                // number of actors that we could need.
                //
                // This is here to get around a ts-game-engine bug that stops creation
                // of entities that load images after the preload is finished.
                for (var i = 0; i < _this._generator.maxArrows; i++)
                    _this._arrows.addEntity(new game.Arrow(stage), false);
                for (var i = 0; i < _this._generator.maxGrayBricks; i++)
                    _this._grayBricks.addEntity(new game.Brick(stage, game.BrickType.BRICK_GRAY), false);
                for (var i = 0; i < _this._generator.maxBonusBricks; i++)
                    _this._bonusBricks.addEntity(new game.Brick(stage, game.BrickType.BRICK_BONUS), false);
                // Fill the actor pool for balls with a complete set of balls; this
                // only ever happens once and is the one case where we always know
                // exactly how many entities of a type we need.
                for (var i = 0; i < (game.MAZE_WIDTH - 2) * 2; i++)
                    _this._balls.addEntity(new game.Ball(stage), false);
                return _this;
            }
            Object.defineProperty(Maze.prototype, "cellSize", {
                /**
                 * Get the size (in pixels) of the cells in the maze based on the
                 * current sprite set. The cells are square, so this represents both
                 * dimensions.
                 *
                 * @returns {number} the pixel size of the cells in the grid
                 */
                get: function () { return this._cellSize; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Maze.prototype, "contents", {
                /**
                 * Get the object that stores the actual contents of this maze. Using
                 * this object the state of the maze can be queried or updated.
                 *
                 * @returns {MazeContents} the object that holds our contents.
                 */
                get: function () { return this._contents; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Maze.prototype, "listener", {
                /**
                 * Get the object that is currently being told about events happening in
                 * this maze object; this can be null.
                 *
                 * @returns {MazeEventListener} the current event listener if any, or
                 * null otherwise.
                 */
                get: function () { return this._listener; },
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
                set: function (newListener) { this._listener = newListener; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Maze.prototype, "generator", {
                /**
                 * Get the object that is used to generate the contents of this maze.
                 * Using this object, external code can regenerate or otherwise tweak
                 * the maze.
                 *
                 * @returns {MazeGenerator} the object that handles our generation.
                 */
                get: function () { return this._generator; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Maze.prototype, "debugger", {
                /**
                 * Get the object that is used for debugging. This contains methods that
                 * can be used to turn debugging on and off and interact with the maze
                 * in a variety of ways.
                 *
                 * @returns {MazeDebugger} the object that handles our debugging
                 */
                get: function () { return this._debugger; },
                enumerable: true,
                configurable: true
            });
            /**
             * Get an arrow from the arrow pool; may return null if none are
             * available.
             */
            Maze.prototype.getArrow = function () { return this._arrows.resurrectEntity(); };
            /**
             * Get a gray brick from the arrow pool; may return null if none are
             * available.
             */
            Maze.prototype.getGrayBrick = function () { return this._grayBricks.resurrectEntity(); };
            /**
             * Get a bonus brick from the arrow pool; may return null if none are
             * available.
             */
            Maze.prototype.getBonusBrick = function () { return this._bonusBricks.resurrectEntity(); };
            /**
             * Get a ball from the ball pool; may return null if none are
             * available.
             */
            Maze.prototype.getBall = function () { return this._balls.resurrectEntity(); };
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
            Maze.prototype.setDebugPoint = function (position) {
                // Use this point as long as it is contained inside of us.
                if (this.contains(position)) {
                    // Set our debug position the one provided, translate it to make
                    // it local to our location on the stage, and then reduce it to
                    // a cell coordinate.
                    this._debugger.debugPoint.setTo(position);
                    this._debugger.debugPoint.translateXY(-this._position.x, -this._position.y);
                    this._debugger.debugPoint.reduce(this.cellSize);
                }
            };
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
            Maze.prototype.pushBall = function (column) {
                // Try to get the entity in the first row of the given column. If
                // it exists and it is a ball, push it.
                var entity = this._contents.getCellAt(column, 0);
                if (entity != null && entity.name == "ball" && this._droppingBall == null) {
                    // Drop it and leave.
                    this.dropBall(entity, NORMAL_DROP_SPEED, false);
                    return true;
                }
                return false;
            };
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
            Maze.prototype.handleClick = function (position) {
                // The position is in pixels, so reduce it down to the size of the
                // cells in the maze, then collect the entity out of the maze at
                // that location (if any).
                position.reduce(this.cellSize);
                var entity = this._contents.getCellAt(position.x, position.y);
                // If this cell in the maze does not contain anything, or it
                // contains the black hole, then toggle the marker at this location.
                if (entity == null || entity == this._blackHole) {
                    // Toggle the marker here.
                    this._contents.toggleMarkerAt(position.x, position.y);
                    return;
                }
                // If the entity is a ball and we're not already trying to drop a
                // ball, try to move it downwards.
                if (entity.name == "ball" && this._droppingBall == null) {
                    // Drop it and leave.
                    this.dropBall(entity, NORMAL_DROP_SPEED, false);
                    return true;
                }
                // If we're not tracking debug action, the rest of these actions
                // should not be allowed;
                if (this._debugger.debugTracking == false)
                    return;
                // If this is a brick that is not hidden, vanish it. We can't bring
                // it back because once it's hidden the update loop will reap it.
                if (entity.name == "brick") {
                    // Clear any marker that might be here; these can only appear if
                    // the ball drops through, so lets be able to remove them.
                    this._contents.clearMarkerAt(position.x, position.y);
                    // Get the brick; if its not hidden, vanish it.
                    var brick = entity;
                    if (brick.isHidden == false)
                        brick.vanish();
                }
                // If it is an arrow, flip it. This works for any type of arrow; an
                // automatic arrow will reset its random flip time in this case.
                if (entity.name == "arrow") {
                    var arrow = entity;
                    arrow.flip(false);
                    return true;
                }
                // We care not for this click.
                return false;
            };
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
            Maze.prototype.dropBall = function (ball, speed, isFinal) {
                // Set the flag that indicates if this drop is a final drop or not.
                this._droppingFinalBall = isFinal;
                // Get the maze contents to mark this ball as played. If this is
                // one of the generated human or computer balls from the top row,
                // this will remove it from the list of balls so that the code knows
                // that this ball is no longer available.
                this._contents.markBallPlayed(ball);
                // Set the entity that is currently dropping to the one provided,
                // then remove it from the maze. It will be re-added when
                // it is finished moving
                this._droppingBall = ball;
                this._lastDroppedBall = ball;
                this._contents.clearCellAt(ball.mapPosition.x, ball.mapPosition.y);
                // Ensure that the ball knows before we start that it started
                // out not moving.
                this._droppingBall.moveType = game.BallMoveType.BALL_MOVE_NONE;
                // Now indicate that the last time the ball dropped was right now
                // so that the next step in the drop happens in the future.
                this._lastDropTick = this._stage.tick;
                // Set up the drop speed.
                this._dropSpeed = speed;
                // Now that the ball has started moving, if there is a listener,
                // tell it.
                if (this._listener != null)
                    this._listener.startBallPush(ball);
            };
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
            Maze.prototype.nextBallPosition = function (ball, position, isSimulation) {
                // If this position is in the second to last row of the maze, it has
                // reached the goal line, so movement stops.
                if (position.y == game.MAZE_HEIGHT - 2) {
                    ball.moveType = game.BallMoveType.BALL_MOVE_NONE;
                    return false;
                }
                // Get the contents of the cell where the ball is currently at, if
                // any; if there is one, tell it that the ball touched it, and also
                // possibly allow it to move the ball, as long as that's not how we
                // got at the current position.
                var current = this._contents.getCellAt(position.x, position.y);
                if (current != null) {
                    // Copy the position provided and then hand it to the entity
                    // that we're currently on top of.
                    var newPos_1 = current.ballTouch(this, ball, position, isSimulation);
                    // If we're allowed to move the ball because of a touch and the
                    // entity below us actually changed the location, then that is
                    // the move for this cycle.
                    if (ball.moveType != game.BallMoveType.BALL_MOVE_JUMP && newPos_1 != null) {
                        // The movement type of a touch is a jump; the entity itself
                        // can't stamp this in because we never tell it if it
                        // successfully moved the ball or not.
                        ball.moveType = game.BallMoveType.BALL_MOVE_JUMP;
                        // Set the position to the one the entity provided.
                        position.setTo(newPos_1);
                        return true;
                    }
                }
                // If the cell below us is not blocking the ball, we can drop the
                // ball into it and we're done.
                var below = this._contents.getBlockingCellAt(position.x, position.y + 1, isSimulation);
                if (below == null) {
                    ball.moveType = game.BallMoveType.BALL_MOVE_DROP;
                    position.y++;
                    return true;
                }
                // The cell below has blocked our movement. Invoke the collision
                // routine with it. If this returns null, we're blocked and cannot
                // move, so return now.
                var newPos = below.ballCollision(this, ball, position);
                if (newPos == null) {
                    ball.moveType = game.BallMoveType.BALL_MOVE_NONE;
                    return false;
                }
                // Check the contents of the new location and see if the ball is
                // allowed to enter that cell or not; the ball can enter if the cell
                // is empty or does not block ball movement.
                if (this._contents.getBlockingCellAt(newPos.x, newPos.y, isSimulation) == null) {
                    // Tell the cell that moved the ball that we actually moved it,
                    // and then return back the position that it gave.
                    //
                    // In this case, it is up to the entity that moved the ball to
                    // mark how it moved it, as we can't know.
                    below.didMoveBall(ball, isSimulation);
                    position.setTo(newPos);
                    return true;
                }
                // The cell below us wants to shift our location to somewhere that
                // we're not allowed to enter, so just leave.
                ball.moveType = game.BallMoveType.BALL_MOVE_NONE;
                return false;
            };
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
            Maze.prototype.reapHiddenEntitiesFromPool = function (pool) {
                var retVal = 0;
                // Scan all of the live entities in the pool.
                for (var i = 0; i < pool.liveEntities.length; i++) {
                    // If this ball thinks it's hidden and it's animation is no
                    // longer playing, we can remove it from the grid now.
                    var cell = pool.liveEntities[i];
                    if (cell.isHidden && cell.animations.isPlaying == false) {
                        this._contents.clearCellAt(cell.mapPosition.x, cell.mapPosition.y);
                        pool.killEntity(cell);
                        retVal++;
                    }
                }
                return retVal;
            };
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
            Maze.prototype.clearHiddenBalls = function () {
                var retVal = 0;
                for (var row = 0; row < game.MAZE_HEIGHT - 1; row++) {
                    for (var col = 1; col < game.MAZE_WIDTH - 1; col++) {
                        var ball = this._contents.getCellAt(col, row);
                        if (ball != null && ball.name == "ball" &&
                            ball.isHidden && ball.animations.isPlaying == false) {
                            this._contents.clearCellAt(col, row);
                            retVal++;
                        }
                    }
                }
                return retVal;
            };
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
            Maze.prototype.dropNextFinalBall = function () {
                // Find a ball from the maze and drop it.
                for (var row = game.MAZE_HEIGHT - 2; row >= 0; row--) {
                    for (var col = game.MAZE_WIDTH - 1; col >= 1; col--) {
                        var cell = this._contents.getCellAt(col, row);
                        if (cell != null && cell.name == "ball") {
                            // Start this ball dropping.
                            this.dropBall(cell, FINAL_DROP_SPEED, true);
                            return true;
                        }
                    }
                }
                // There was nothing to push
                return false;
            };
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
            Maze.prototype.removeNextGrayBrick = function () {
                // Assume be default we did not see any gray bricks at all.
                var sawBrick = false;
                // Scan from the bottom up.
                for (var row = game.MAZE_HEIGHT - 2; row >= 0; row--) {
                    for (var col = 1; col < game.MAZE_WIDTH - 1; col++) {
                        // Get the cell as a brick (it may not be).
                        var cell = this._contents.getCellAt(col, row);
                        // If we got a cell and it's a gray brick, it might be
                        // interesting.
                        if (cell != null && cell.name == "brick" &&
                            cell.brickType == game.BrickType.BRICK_GRAY) {
                            // If the brick is not already hidden, hide it and return
                            // true right away.
                            if (cell.isHidden == false) {
                                cell.vanish();
                                return true;
                            }
                            // It's already hidden so we need to ignore it, but at
                            // least we saw it.
                            sawBrick = true;
                        }
                    }
                }
                return sawBrick;
            };
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
            Maze.prototype.removeNextBlockedBall = function () {
                var sawBall = false;
                // Scan from the bottom up.
                for (var row = game.MAZE_HEIGHT - 2; row >= 0; row--) {
                    for (var col = 1; col < game.MAZE_WIDTH - 1; col++) {
                        // Get the cell that we're searching for as a ball and the
                        // cell below it.
                        var cell = this._contents.getCellAt(col, row);
                        var below = this._contents.getCellAt(col, row + 1);
                        // Skip this cell if it is empty or not a ball.
                        if (cell == null || cell.name != "ball")
                            continue;
                        // This is a ball; if it has already been hidden we can skip
                        // any further checks, but set our flag to indicate that we're
                        // still waiting for this ball to be removed.
                        if (cell.isHidden == true) {
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
                            (below.name == "ball" && below.isHidden == true)) {
                            // Tell our listener (if any) that this is happening
                            if (this._listener != null)
                                this._listener.blockedBallRemoved(cell);
                            cell.vanish();
                            return true;
                        }
                    }
                }
                // Return if we saw a ball waiting to vanish or not.
                return sawBall;
            };
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
            Maze.prototype.update = function (stage, tick) {
                // Let the super do it's thing for us.
                _super.prototype.update.call(this, stage, tick);
                // Make sure the black holes animate.
                this._blackHole.update(stage, tick);
                // Now update all of the entities in our various entity pools.
                this._arrows.update(stage, tick);
                this._grayBricks.update(stage, tick);
                this._bonusBricks.update(stage, tick);
                this._balls.update(stage, tick);
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
                if (this.clearHiddenBalls() > 0 && this._lastDroppedBall != null)
                    this._ballMoveFinalized = true;
                // Reap any dead gray bricks; these are the gray bricks that have
                // been vanished out of the level because all of the balls have been
                // played.
                //
                // If this collects all gray bricks, we can tell our listener that
                // we're done removing them now.
                if (this.reapHiddenEntitiesFromPool(this._grayBricks) > 0 &&
                    this._grayBricks.liveEntities.length == 0) {
                    if (this._listener != null)
                        this._listener.grayBrickRemovalComplete();
                }
                // If there is a dropping ball and it's time to drop it, take a step
                // now.
                if (this._droppingBall && tick >= this._lastDropTick + this._dropSpeed) {
                    // We are going to drop the ball (or try to), so reset the last
                    // drop tick to this tick.
                    this._lastDropTick = tick;
                    // Get the current position of the ball; this is just an alias
                    // to the actual object.
                    var pos = this._droppingBall.mapPosition;
                    // Check to see what the next position of the ball is. If this
                    // returns false, the ball is not going to move, so we are done
                    // moving it now.
                    if (this.nextBallPosition(this._droppingBall, pos, false) == false) {
                        // Add the ball back to the maze at it's current position.
                        this._contents.setCellAt(pos.x, pos.y, this._droppingBall);
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
                        if (pos.y == game.MAZE_HEIGHT - 2 || this._droppingFinalBall == true)
                            this._droppingBall.vanish();
                        else
                            this._ballMoveFinalized = true;
                        // Now clear the flag so we know we're done.
                        this._droppingBall = null;
                    }
                    else {
                        // The ball moved, so update it's location on the screen
                        // as well.
                        this._droppingBall.position.setTo(pos);
                        this._droppingBall.position.scale(this.cellSize);
                        this._droppingBall.position.translate(this._position);
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
                if (this._ballMoveFinalized) {
                    // Reset the flag now for next time
                    this._ballMoveFinalized = false;
                    // If there is a listener, tell it that this ball has stopped
                    // moving now.
                    if (this._listener != null)
                        this._listener.ballDropComplete(this._lastDroppedBall, this._droppingFinalBall);
                    // Done with the value now.
                    this._lastDroppedBall = null;
                }
            };
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
            Maze.prototype.renderMazeBacking = function (x, y, cSize, renderer) {
                // Iterate over all of the cells that make up the maze, rendering
                // as appropriate.
                for (var cellY = 0, blitY = y; cellY < game.MAZE_HEIGHT; cellY++, blitY += cSize) {
                    for (var cellX = 0, blitX = x; cellX < game.MAZE_WIDTH; cellX++, blitX += cSize) {
                        // The cell to render is empty, unless this is the side of
                        // the maze or the bottom of it, in which case the wall is
                        // solid.
                        var cell = this._empty;
                        if (cellX == 0 || cellX == game.MAZE_WIDTH - 1 || cellY == game.MAZE_HEIGHT - 1)
                            cell = this._solid;
                        // Render this cell.
                        cell.render(blitX, blitY, renderer);
                    }
                }
            };
            /**
             * Render the markers in the maze; these are set manually by the user
             * clicking on the grid while in debug mode.
             *
             * @param {number}   x        the X coordinate to start drawing at
             * @param {number}   y        the y coordinate to start drawing at
             * @param {number}   cSize    the size of the grid cells, in pixels
             * @param {Renderer} renderer the renderer to use to render the markers.
             */
            Maze.prototype.renderMazeMarkers = function (x, y, cSize, renderer) {
                // Iterate over all columns and rows and render any markers that
                // might exist.
                for (var cellY = 0, blitY = y; cellY < game.MAZE_HEIGHT; cellY++, blitY += cSize) {
                    for (var cellX = 0, blitX = x; cellX < game.MAZE_WIDTH; cellX++, blitX += cSize) {
                        // If this position contains a marker, render one here.
                        if (this._contents.hasMarkerAt(cellX, cellY))
                            this._marker.render(blitX, blitY, renderer);
                    }
                }
            };
            /**
             * Render us onto the stage provided at the given position.
             *
             * This renders us by displaying all entities stored in the maze.
             *
             * @param {number}   x        the X coordinate to start drawing at
             * @param {number}   y        the y coordinate to start drawing at
             * @param {Renderer} renderer the renderer to use to render
             */
            Maze.prototype.render = function (x, y, renderer) {
                // Get the cell size of our cells so we know how to blit.
                var cSize = this.cellSize;
                // Render the background of the maze first. This will draw the
                // background and the walls along the sides.
                this.renderMazeBacking(x, y, cSize, renderer);
                // Render all of the black holes; for this we have to iterate the
                // list of known destinations and use them to calculate the
                // appropriate position.
                //
                // Black holes have to come first so that if the ball comes to
                // rest on top of them, we can still see it.
                for (var i = 0; i < this._blackHole.length; i++) {
                    var pos = this._blackHole.destinationList[i];
                    this._blackHole.render(x + (pos.x * cSize), y + (pos.y * cSize), renderer);
                }
                // Now render everything else.
                this._arrows.render(renderer);
                this._grayBricks.render(renderer);
                this._bonusBricks.render(renderer);
                this._balls.render(renderer);
                // We can render the markers now.
                this.renderMazeMarkers(x, y, cSize, renderer);
                // Now the debug marker, if it's turned on.
                if (this._debugger.debugTracking) {
                    var pos = this._debugger.debugPoint;
                    this._debugMarker.render(x + (pos.x * cSize), y + (pos.y * cSize), renderer);
                }
            };
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
            Maze.prototype.resetMazeEntities = function () {
                // Make sure that all of the entity pools are emptied out by killing
                // everything in them.
                this._arrows.killALl();
                this._grayBricks.killALl();
                this._bonusBricks.killALl();
                this._balls.killALl();
                this._contents.clearMarkers();
            };
            /**
             * Generate a new maze; this sets everything up for a new round of the
             * game.
             */
            Maze.prototype.generateMaze = function () {
                // Kill all living entities to get everything into a clean state.
                this.resetMazeEntities();
                // No ball has finished moving and no gray bricks have been removed.
                this._ballMoveFinalized = false;
                this._droppingFinalBall = false;
                // Now generate the contents of the maze.
                this._generator.generate(true);
                // Reset the scores
                game.resetScores();
                // If there is a listener, tell it now that the generation has
                // completed.
                if (this._listener != null)
                    this._listener.mazeGenerationComplete();
            };
            /**
             * Inform the maze that one or more simulations are about to commence.
             * This will make sure to tell all entities for which it matters that
             * they should save their state.
             */
            Maze.prototype.beginSimulation = function () {
                // Save state in balls.
                for (var i = 0; i < this._balls.liveEntities.length; i++)
                    this._balls.liveEntities[i].enteringSimulation();
                // Save state in bonus bricks
                for (var i = 0; i < this._bonusBricks.liveEntities.length; i++)
                    this._bonusBricks.liveEntities[i].enteringSimulation();
                // Save state in arrows
                for (var i = 0; i < this._arrows.liveEntities.length; i++)
                    this._arrows.liveEntities[i].enteringSimulation();
                // Nothing else needs to save state because it does not change per-
                // move.
            };
            /**
             * Inform the maze that a simulation cycle has now finished and everything
             * should be restored to its pre-simulation state.
             */
            Maze.prototype.endSimulation = function () {
                // Restore state in balls.
                for (var i = 0; i < this._balls.liveEntities.length; i++)
                    this._balls.liveEntities[i].exitingSimulation();
                // Restore state in bonus bricks
                for (var i = 0; i < this._bonusBricks.liveEntities.length; i++)
                    this._bonusBricks.liveEntities[i].exitingSimulation();
                // Restore state in arrows
                for (var i = 0; i < this._arrows.liveEntities.length; i++)
                    this._arrows.liveEntities[i].exitingSimulation();
                // Nothing else needs to restore state because it does not change
                // per- move.
            };
            return Maze;
        }(game.Entity));
        game.Maze = Maze;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * When we are in the state that we're removing blocked balls from the maze,
         * this is the delay (in ticks) for telling the next ball when it should
         * start to vanish.
         */
        var ROUND_BALL_VANISH_TIME = 3;
        /**
         * When we are in the state that we're removing gray bricks from the maze,
         * this is the delay (in ticks) for telling the next brick when it should
         * start to vanish.
         */
        var ROUND_BRICK_VANISH_TIME = 2;
        /**
         * This scene represents the game screen, where the game will actually be
         * played.
         */
        var GameScene = (function (_super) {
            __extends(GameScene, _super);
            /**
             * Construct a new game screen scene that will display on the provided
             * stage.
             *
             * This scene type represents the core of the game; it manages all of
             * the game entities required to play the game as well as the controls
             * and interactions between them.
             *
             * @param stage the stage the scene will present on
             *
             * @constructor
             */
            function GameScene(stage) {
                var _this = 
                // Create the scene via our super class.
                _super.call(this, "gameScreen", stage) || this;
                // Create the state machine that drives us and register our interest
                // in knowing when the state inside it changes.
                _this._state = new game.StateMachine();
                _this._state.addListener(_this);
                // Create the maze that holds most of our game state and tell it
                // that we are interested in when game related events trigger.
                _this._maze = new game.Maze(stage);
                _this._maze.listener = _this;
                // Now create the player and the computer player objects and set
                // the position of each of them to be the first column in the map
                // and their visibility state to hidden.
                _this._player = new game.Player(stage, game.PlayerType.PLAYER_HUMAN);
                _this._player.mapPosition.setToXY(1, 0);
                _this._player.visible = false;
                _this._computer = new game.Player(stage, game.PlayerType.PLAYER_COMPUTER);
                _this._computer.mapPosition.setToXY(1, 0);
                _this._computer.visible = false;
                // The computer player needs a handle to the maze so that it can
                // determine what moves to make.
                _this._computer.maze = _this._maze;
                // Add all of our child entities so that they update and render.
                _this.addActor(_this._maze);
                _this.addActor(_this._player);
                _this.addActor(_this._computer);
                // Start out with a default mouse location.
                _this._mouse = new game.Point(0, 0);
                // Stash the debugger.
                _this._debugger = _this._maze.debugger;
                return _this;
            }
            Object.defineProperty(GameScene.prototype, "state", {
                /**
                 * Get the current state of the game.
                 *
                 * This directly returns the state of our state machine object.
                 *
                 * @returns {GameState} the current state of our state machine
                 */
                get: function () { return this._state.state; },
                /**
                 * Change the current state of the game to a new state.
                 *
                 * This directly sets the state of our state machine object.
                 *
                 * @param {GameState} newState the new state to switch to
                 */
                set: function (newState) { this._state.state = newState; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(GameScene.prototype, "priorState", {
                /**
                 * Get the state that we were in prior to the current state.
                 *
                 * This directly returns the prior state of our state machine object.
                 *
                 * @returns {GameState} the previous state of our state machine
                 */
                get: function () { return this._state.priorState; },
                enumerable: true,
                configurable: true
            });
            /**
             * This is invoked when we are becoming the current scene.
             *
             * We use this to know that our preload is finished and do any handling
             * that needs to be done in that instance.
             *
             * @param {Scene} previousScene the scene that was active before us
             */
            GameScene.prototype.activating = function (previousScene) {
                // Let the super work its magic.
                _super.prototype.activating.call(this, previousScene);
                // Set up what our font should be while this screen is active.
                this._renderer.context.font = '30px kenvector_futureregular';
                // Set the reference position of the player and computer entities
                // to that of the maze, shifted up some cell so that they appear in
                // the virtual cell on top of the maze.
                this._player.referencePoint = this._maze.position.copyTranslatedXY(0, -this._maze.cellSize);
                this._computer.referencePoint = this._maze.position.copyTranslatedXY(0, -this._maze.cellSize);
                // If there is no current state, it's time to generate a new level.
                if (this.state == game.GameState.NO_STATE)
                    this.state = game.GameState.MAZE_GENERATION;
            };
            /**
             * Modify the passed in player to either turn to face the direction that
             * is provided or, if they are already facing that direction, walk in
             * that direction (if possible).
             *
             * This will work for either a computer or player controlled Player
             * instance in any facing.
             *
             * @param {Player}          player    the player entity to turn or move
             * @param {PlayerDirection} direction the direction to turn or move in
             */
            GameScene.prototype.playerTurnOrMove = function (player, direction) {
                // If the player is not facing in the direction provided, then
                // turn them and leave.
                if (player.playerDirection != direction) {
                    player.turnTo(direction);
                    return;
                }
                // We're facing in the appropriate direction, so see if we should
                // move or not.
                switch (direction) {
                    case game.PlayerDirection.DIRECTION_RIGHT:
                        if (this._player.mapPosition.x < game.MAZE_WIDTH - 2)
                            this._player.moveBy(1);
                        break;
                    case game.PlayerDirection.DIRECTION_LEFT:
                        if (player.mapPosition.x > 1)
                            player.moveBy(-1);
                        break;
                    // Can't move in this direction
                    case game.PlayerDirection.DIRECTION_DOWN:
                        break;
                }
            };
            /**
             * This is invoked by inputKeyDown to handle input directly related to
             * the player and their ability to move their avatar or make a move.
             *
             * The commands here may be ignored based on the current state of the
             * game, so that input is not applied inappropriately. The return value
             * is true when the event was handled and false when it was not.
             *
             * @param   {KeyboardEvent} eventObj the keyboard event that says what
             * key was pressed
             *
             * @returns {boolean}                true if we handled the key, false
             * otherwise.
             */
            GameScene.prototype.handlePlayerKey = function (eventObj) {
                // If our current state does not indicate that it is the player's
                // turn, then do nothing.
                if (this.state != game.GameState.PLAYER_TURN)
                    return false;
                // See if it's something else we care about.
                switch (eventObj.keyCode) {
                    // Rotate the player to face left or walk left.
                    case game.KeyCodes.KEY_LEFT:
                        this.playerTurnOrMove(this._player, game.PlayerDirection.DIRECTION_LEFT);
                        return true;
                    // Rotate the player to face right or walk right.
                    case game.KeyCodes.KEY_RIGHT:
                        this.playerTurnOrMove(this._player, game.PlayerDirection.DIRECTION_RIGHT);
                        return true;
                    // Rotate the player to face down.
                    case game.KeyCodes.KEY_DOWN:
                        this.playerTurnOrMove(this._player, game.PlayerDirection.DIRECTION_DOWN);
                        return true;
                    // Run the push animation in the current facing direction.
                    case game.KeyCodes.KEY_SPACEBAR:
                        this._player.push();
                        // If the player is facing down, then try to actually push
                        // the ball.
                        if (this._player.playerDirection == game.PlayerDirection.DIRECTION_DOWN)
                            this._maze.pushBall(this._player.mapPosition.x);
                        return true;
                    // The question mark key; this is not in ts-game-engine yet.
                    case 191:
                        // If we're in debugging mode, don't handle the key here and
                        // let the debug code handle it instead.
                        if (this._debugger.debugTracking)
                            return false;
                        // Get the AI to select a ball. If one was selected, jump
                        // the player to that position, turn to face it, and push.
                        // The push might not work if we're not already facing down,
                        // but that's OK.
                        var ball = game.AI_selectBestMove(this._maze);
                        if (ball != null) {
                            this._player.jumpTo(ball.mapPosition.x);
                            this._player.turnTo(game.PlayerDirection.DIRECTION_DOWN);
                            this._player.push();
                        }
                        return true;
                    // We don't handle any other keys.
                    default:
                        return false;
                }
            };
            /**
             * Invoked every time a key is pressed on the game screen
             *
             * @param   {KeyboardEvent} eventObj the keyboard event that says what
             * key was pressed
             *
             * @returns {boolean}                true if we handled the key, false
             * otherwise
             */
            GameScene.prototype.inputKeyDown = function (eventObj) {
                // If this is a key the super class knows how to handle, then let it
                // handle it and we'll just leave.
                if (_super.prototype.inputKeyDown.call(this, eventObj))
                    return true;
                // If this is a player key and it was handled, then we can leave
                // now.
                if (this.handlePlayerKey(eventObj))
                    return true;
                // See if it's something else we care about.
                switch (eventObj.keyCode) {
                    // For the F key, toggle between full screen mode and windowed
                    // mode.
                    case game.KeyCodes.KEY_F:
                        this._stage.toggleFullscreen();
                        return true;
                    // Trigger a new maze generation.
                    case game.KeyCodes.KEY_G:
                        if (this._debugger.debugTracking) {
                            this._maze.generateMaze();
                            return true;
                        }
                        return false;
                    // Toggle mouse tracking of the debug location, then update the
                    // tracking with the last known mouse location.
                    case game.KeyCodes.KEY_F12:
                        this._debugger.debugTracking = !this._debugger.debugTracking;
                        if (this._debugger.debugTracking)
                            this._maze.setDebugPoint(this._mouse);
                        return true;
                    // Delete the contents of the current cell, if anything is
                    // there.
                    //
                    // These correspond to Backspace and Delete respectively; the
                    // engine does not have a code for these yet. Note that the
                    // delete key on the numeric keypad may or may not work.
                    case 8:
                    case 46:
                        return this._debugger.debugClearCell();
                    // Toggle the type of the entity under the debug cursor through
                    // its various states.
                    case game.KeyCodes.KEY_T:
                        return this._debugger.debugToggleCell();
                    // Add a brick to the maze at the current debug cursor; this
                    // only works if the cell is currently empty. This will try
                    // to add a gray brick, and failing that a bonus brick.
                    case game.KeyCodes.KEY_B:
                        return this._debugger.debugAddBrick();
                    // Add an arrow to the maze at the current debug cursor; this
                    // only works if the cell is currentlye empty. This will add a
                    // normal arrow by default, but this can be toggled with the
                    // 'T" key'.
                    case game.KeyCodes.KEY_A:
                        return this._debugger.debugAddArrow();
                    // Add a teleport to the maze at the current debug cursor; this
                    // only works if the cell is currentlye empty. This just adds an
                    // extra exit point to the black hole system.
                    case game.KeyCodes.KEY_H:
                        return this._debugger.debugAddTeleport();
                    // Add a ball to the maze at the current debug cursor; this only
                    // works if the cell is currently empty. This will add a player
                    // ball by default, but this can be toggled with the 'T' key.
                    case game.KeyCodes.KEY_L:
                        return this._debugger.debugAddBall();
                    // Vanish away all of the gray or bonus bricks that are still
                    // visible.
                    case game.KeyCodes.KEY_V:
                    case game.KeyCodes.KEY_C:
                        return this._debugger.debugVanishBricks(eventObj.keyCode == game.KeyCodes.KEY_V);
                    // Wipe the entire maze contents; this is like a reset except
                    // no new maze is generated first.
                    case game.KeyCodes.KEY_W:
                        return this._debugger.debugWipeMaze();
                    // The question mark key; this is not in ts-game-engine yet.
                    case 191:
                        return this._debugger.debugShowContents();
                    // For debugging purposes, this key swaps to human balls
                    case game.KeyCodes.KEY_Z:
                        this._maze.contents.showPlayerBalls();
                        return true;
                    // For debugging purposes, this key swaps to computer balls.
                    case game.KeyCodes.KEY_X:
                        this._maze.contents.showComputerBalls();
                        return true;
                }
                // We did not handle it
                return false;
            };
            /**
             * This gets triggered while the game is running and the user clicks the
             * mouse in the scene.
             *
             * The method should return true if the mouse event was handled or false
             * if it was not. The Stage will prevent the default handling for all
             * mouse events that are handled.
             *
             * @param eventObj the event object
             *
             * @returns {boolean} true if the mouse event was handled, false
             * otherwise
             */
            GameScene.prototype.inputMouseClick = function (eventObj) {
                // Calculate where on the stage the mouse clicked. If this is inside
                // of the maze, localize the point to the bounds of the maze and
                // have the maze handle it.
                var mousePos = this._stage.calculateMousePos(eventObj);
                if (this._maze.contains(mousePos)) {
                    var pos = this._maze.position;
                    return this._maze.handleClick(mousePos.translateXY(-pos.x, -pos.y));
                }
                return false;
            };
            /**
             * This is triggered whenever the mouse is moved over the canvas.
             *
             * @param eventObj the event that represents the mouse movement.
             * @returns {boolean} true if we handled this event or false if not.
             */
            GameScene.prototype.inputMouseMove = function (eventObj) {
                // Get the current mouse position, and then update tracking with it.
                this._mouse = this._stage.calculateMousePos(eventObj, this._mouse);
                // If we're tracking a debug location, tell the maze about this
                // point.
                if (this._debugger.debugTracking)
                    this._maze.setDebugPoint(this._mouse);
                // We handled it.
                return true;
            };
            /**
             * This is invoked once per update loop while this scene is the active
             * scene
             *
             * @param {number} tick the game tick; this is a count of how many times
             * the game loop has executed
             */
            GameScene.prototype.update = function (tick) {
                // Let the super do it's business, which updates all of our registered
                // actors.
                _super.prototype.update.call(this, tick);
                // Update the state machine tick and then handle our state logic for
                // this update.
                this._state.update(tick);
                this.stateLogic();
            };
            /**
             * This is invoked every frame to render the current scene to the stage.
             */
            GameScene.prototype.render = function () {
                // Clear the screen, then let our super render for us so that all
                // entities get painted.
                this._renderer.fillRect(0, 0, this._stage.width, this._stage.height, '#000');
                _super.prototype.render.call(this);
                // Now render the score.
                game.renderScores(this._renderer);
            };
            /**
             * This gets invoked by our maze entity when it has finished generating
             * a maze. We use this to switch the state so that the game can start.
             */
            GameScene.prototype.mazeGenerationComplete = function () {
                // For now, after maze generation it is always the human player's
                // turn.
                this.state = game.GameState.CHECK_VALID_PLAY_PLAYER;
            };
            /**
             * This gets invoked when either the player or the computer has selected
             * a ball to push and told the maze to push it, and the maze has decided
             * that this is allowed and it is about to drop the ball.
             *
             * We get told what ball is currently being dropped. We can determine
             * who pushed the ball by the current state.
             *
             * @param {Ball} ball the ball entity that is being pushed.
             */
            GameScene.prototype.startBallPush = function (ball) {
                // Set the state to indicate that a ball is being dropped.
                this.state = game.GameState.BALL_DROPPING;
            };
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
            GameScene.prototype.ballDropComplete = function (ball, isFinal) {
                // Did the ball reach the goal?
                if (ball.mapPosition.y == game.MAZE_HEIGHT - 2)
                    game.goalBallScore(ball);
                else if (isFinal == true)
                    game.partialBallScore(ball);
                // Now that the ball is done, where we go depends on where we came
                // from.
                switch (this.priorState) {
                    // If it was the players turn before the ball started dropping,
                    // it is the computers turn now.
                    case game.GameState.PLAYER_TURN:
                        this.state = game.GameState.CHECK_VALID_PLAY_COMPUTER;
                        break;
                    // If it was the computers turn before the ball started
                    // dropping, it is the players turn now.
                    case game.GameState.COMPUTER_TURN:
                        this.state = game.GameState.CHECK_VALID_PLAY_PLAYER;
                        break;
                    // If we were doing the final ball drop before, go back there
                    // now.
                    case game.GameState.FINAL_BALL_DROP:
                        this.state = game.GameState.FINAL_BALL_DROP;
                        break;
                    // If we get here, we don't know.
                    default:
                        console.log("DEBUG: Do not know how to get to the next state from here");
                        break;
                }
            };
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
            GameScene.prototype.blockedBallRemoved = function (ball) {
                // This is a blocked ball that can no longer move, so apply a
                // partial score value now.
                game.partialBallScore(ball);
            };
            /**
             * The Maze is telling us that it is now empty of gray bricks because it
             * has just reaped the last fully hidden gray brick.
             *
             * This triggers the start of the final ball drop.
             */
            GameScene.prototype.grayBrickRemovalComplete = function () {
                // Swap states to the final ball drop
                this.state = game.GameState.FINAL_BALL_DROP;
            };
            /**
             * This gets triggered every time our state machine gets put into a new
             * state.
             *
             * This is used to handle state logic that only needs to happen one
             * time, when the state actively changes into a new state. All other
             * state logic happens in the stateLogic() method below. This allows us
             * to handle simple 1 time logic without requiring a boolean to flag
             * if we have done it or not.
             *
             * WARNING: All hell (probably) breaks loose if this method immediately
             * changes the state of the machine that was passed in, so maybe don't
             * do that?
             *
             * @param {StateMachine} machine  the machine whose state changed
             * @param {GameState}    newState the newly set state
             */
            GameScene.prototype.stateChanged = function (machine, newState) {
                // Record the stat change.
                console.log("DEBUG: State changed to: " + game.GameState[newState]);
                switch (newState) {
                    // We are supposed to be generating a maze, so do that now.
                    case game.GameState.MAZE_GENERATION:
                        this._maze.generateMaze();
                        break;
                    // It is now the turn of the human player, so make sure that
                    // they are visible and the computer is not.
                    case game.GameState.PLAYER_TURN:
                        this._player.visible = true;
                        this._computer.visible = false;
                        this._maze.contents.showPlayerBalls();
                        break;
                    // It is now the turn of the computer player, so make sure that
                    // they are visible and the player is not.
                    case game.GameState.COMPUTER_TURN:
                        this._computer.visible = true;
                        this._player.visible = false;
                        this._maze.contents.showComputerBalls();
                        // Tell the computer that they're starting their turn now.
                        this._computer.ai_startingTurn();
                        break;
                    // When we enter the final ball drop, hide the player and
                    // computer characters.
                    case game.GameState.FINAL_BALL_DROP:
                        this._player.visible = false;
                        this._computer.visible = false;
                        break;
                }
            };
            /**
             * This method is used to handle all of the ongoing state logic; logic
             * that needs to be checked every update loop to handle something while
             * inside of a particular state.
             *
             * For logic that applies only when the state is initially changed to a
             * new state, see the stateChanged() method. This allows us to handle
             * such logic without requiring a bunch of sentinel boolean values to
             * flag that it has been done.
             */
            GameScene.prototype.stateLogic = function () {
                // Handle based on state.
                switch (this.state) {
                    // It is becoming the player's turn; check to see if there is
                    // a valid play for them; if yes, make it their turn. Otherwise,
                    // make it the computer turn.
                    case game.GameState.CHECK_VALID_PLAY_PLAYER:
                        if (this._maze.contents.hasPlayableHumanBall())
                            this.state = game.GameState.PLAYER_TURN;
                        else {
                            // If there is a computer ball to play, make it the
                            // computer's turn. Otherwise, time to do the final ball
                            // drop.
                            if (this._maze.contents.hasPlayableComputerBall())
                                this.state = game.GameState.COMPUTER_TURN;
                            else
                                this.state = game.GameState.REMOVE_BLOCKED_BALLS;
                        }
                        break;
                    // It is becoming the computer's turn; check to see if there is
                    // a valid play for them; if yes, make it their tun. Otherwise
                    // make it the player's turn.
                    case game.GameState.CHECK_VALID_PLAY_COMPUTER:
                        if (this._maze.contents.hasPlayableComputerBall())
                            this.state = game.GameState.COMPUTER_TURN;
                        else {
                            // If there is a player ball to play, make it the
                            // player's turn. Otherwise, time to do the final ball
                            // drop.
                            if (this._maze.contents.hasPlayableHumanBall())
                                this.state = game.GameState.PLAYER_TURN;
                            else
                                this.state = game.GameState.REMOVE_BLOCKED_BALLS;
                        }
                        break;
                    // When we are in the remove blocked balls state, use the state
                    // timer to remove a blocked ball every so often, until we
                    // determine that there are none left.
                    case game.GameState.REMOVE_BLOCKED_BALLS:
                        if (this._state.timerTrigger(ROUND_BALL_VANISH_TIME)) {
                            // Try to remove a ball; this returns false when there
                            // are no more balls to remove AND all balls we were
                            // waiting for are now gone.
                            if (this._maze.removeNextBlockedBall() == false)
                                this.state = game.GameState.REMOVE_GRAY_BRICKS;
                        }
                        break;
                    // When we are in the remove gray bricks state, use the state
                    // timer to remove a brick every so often.
                    case game.GameState.REMOVE_GRAY_BRICKS:
                        if (this._state.timerTrigger(ROUND_BRICK_VANISH_TIME)) {
                            // If there is no brick to remove, trigger the state
                            // change right away.
                            if (this._maze.removeNextGrayBrick() == false)
                                this.grayBrickRemovalComplete();
                        }
                        break;
                    // We are dropping the final balls through the maze now. Select
                    // one and drop it; if there are none left to drop, set the
                    // state to the game over state.
                    //
                    // When a ball is successfully started dropping using this
                    // method the state is changed to the dropping ball state
                    // automatically.
                    case game.GameState.FINAL_BALL_DROP:
                        if (this._maze.dropNextFinalBall() == false)
                            this.state = game.GameState.GAME_OVER;
                        break;
                }
            };
            return GameScene;
        }(game.Scene));
        game.GameScene = GameScene;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var main;
    (function (main) {
        /**
         * Set up the button on the page to toggle the state of the game.
         *
         * @param stage the stage to control
         * @param buttonID the ID of the button to mark up to control the game state
         */
        function setupButton(stage, buttonID) {
            // True when the game is running, false when it is not. This state is toggled by the button. We
            // assume that the game is going to start running.
            var gameRunning = true;
            // Get the button.
            var button = document.getElementById(buttonID);
            if (button == null)
                throw new ReferenceError("No button found with ID '" + buttonID + "'");
            // Set up the button to toggle the stage.
            button.addEventListener("click", function () {
                // Try to toggle the game state. This will only throw an error if we try to put the game into
                // a state it is already in, which can only happen if the engine stops itself when we didn't
                // expect it.
                try {
                    if (gameRunning) {
                        stage.muteMusic(true);
                        stage.muteSounds(true);
                        stage.stop();
                    }
                    else {
                        stage.muteMusic(false);
                        stage.muteSounds(false);
                        stage.run();
                    }
                }
                // Log and then rethrow the error.
                catch (error) {
                    console.log("Exception generated while toggling game state");
                    throw error;
                }
                finally {
                    // No matter what, toggle the state.
                    gameRunning = !gameRunning;
                    button.innerHTML = gameRunning ? "Stop Game" : "Restart Game";
                }
            });
        }
        // Once the DOM is loaded, set things up.
        nurdz.contentLoaded(window, function () {
            try {
                // Set up the stage.
                var stage = new nurdz.game.Stage('gameContent', 'black', window.location.search == "?noscale" ? false : true);
                // Set up the default values used for creating a screen shot.
                nurdz.game.Stage.screenshotFilenameBase = "devember2016-";
                nurdz.game.Stage.screenshotWindowTitle = "devember2016-";
                // Set up the button that will stop the game if something goes wrong.
                setupButton(stage, "controlBtn");
                // Register all of our scenes.
                stage.addScene("game", new nurdz.game.GameScene(stage));
                // Switch to the initial scene, add a dot to display and then run the game.
                stage.switchToScene("game");
                stage.run();
            }
            catch (error) {
                console.log("Error starting the game");
                throw error;
            }
        });
    })(main = nurdz.main || (nurdz.main = {}));
})(nurdz || (nurdz = {}));
