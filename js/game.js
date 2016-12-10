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
                    this._liveContents.indexOf(newEntity) == -1)
                    (isAlive ? this._liveContents : this._deadPool).push(newEntity);
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
         * The entity that represents a cell inside of the Maze entity.
         *
         * These are basically regular Entity objects with a slightly different
         * common interface.
         */
        var MazeCell = (function (_super) {
            __extends(MazeCell, _super);
            /**
             * Construct a new maze cell that will render on the stage provided and
             * which will use the provided SpriteSheet.
             *
             * The dimensions of this entity are not set at construction time and
             * are instead set based on the size of the sprites in the attached
             * sprite sheet.
             *
             * Subclasses are responsible for setting the sprite sheet and for
             * ensuring that all MazeCell subclasses use the same size sprites.
             *
             * @param {Stage}  stage the stage that we use to render ourselves
             * @param {String} name  the entity name for this subclass
             */
            function MazeCell(stage, name) {
                // Invoke the super; note that this does not set a position because
                // that is set by whoever created us. Our dimensions are based on
                // our sprites, so we don't set anything here.
                _super.call(this, name, stage, 0, 0, 0, 0, 1, {}, {}, 'blue');
            }
            /**
             * Returns a determination on whether this maze cell, in its current
             * state, would block the ball from moving through it or not.
             *
             * When this returns true, the ball is stopped before entering this
             * cell. Otherwise, it is allowed to enter this cell.
             *
             * @returns {boolean} true if this entity should block this ball moving
             * through it or false if it should allow such movement.
             */
            MazeCell.prototype.blocksBall = function () {
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
             * @param   {Maze}  maze     the maze containing us and the ball
             * @param   {Ball}  ball     the ball that is coliding with us
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
             * @param {Ball} ball the ball that we moved
             */
            MazeCell.prototype.didMoveBall = function (ball) {
            };
            /**
             * This is invoked when the ball enters the same cell as this maze
             * entity (which measns that a call to blocksBall() returned false) to
             * tell us that the ball has actually entered our location.
             *
             * The collision is informed of the maze that it is contained in, the
             * ball that is touching us, and the location in the mazr that the touch
             * is happening at (i.e. the location in the maze of this MazeCell).
             *
             * If desired, the position of the ball can be modified by returning a
             * pooint that represents the new position in the maze; otherwise the
             * ball is left at the current location.
             *
             * This position may or may not be used by the engine. If the position
             * of the ball is changed, a touch event will not fire if the ball was
             * placed on top of another entity that supports this call.
             *
             * @param   {Maze}  maze     the maze containing us and the ball
             * @param   {Ball}  ball     the ball that is touching us
             * @param   {Point} location the location in the mazer that we are at
             *
             * @returns {Point}          if non-null, this is the position that the
             * ball should be moved to in response to touching us; a return value of
             * null indicates that the ball should stay where it is
             */
            MazeCell.prototype.ballTouch = function (maze, ball, location) {
                return null;
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
         * This is a simple (debug) entity; it is used to debug the tracking for
         * ball progress through the maze by leaving a trail of "bread crumbs".
         */
        var Marker = (function (_super) {
            __extends(Marker, _super);
            /**
             * Construct a new arrow entity that will render on the stage provided.
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
                // that is set by whoever created us. Dimensions come from the cell
                // size provided.
                _super.call(this, stage, "marker");
                this.makeRectangle(cellSize, cellSize);
                // ALl of our rendering is handled by the super class, so all we
                // have to do is set the color we want to render with.
                this._debugColor = 'white';
            }
            return Marker;
        }(game.MazeCell));
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
        (function (BallType) {
            BallType[BallType["BALL_PLAYER"] = 0] = "BALL_PLAYER";
            BallType[BallType["BALL_COMPUTER"] = 1] = "BALL_COMPUTER";
        })(game.BallType || (game.BallType = {}));
        var BallType = game.BallType;
        /**
         * As the ball is being moved through the maze, a value of this type is
         * stored into it to indicate under what circumstances it moved. This allows
         * a ball or other entity to make a decision about how to move the ball
         * based on prior movement.
         *
         * The prime case of this is allowed a ball pushed by an arrow to roll over
         * other stationary balls.
         */
        (function (BallMoveType) {
            BallMoveType[BallMoveType["BALL_MOVE_NONE"] = 0] = "BALL_MOVE_NONE";
            BallMoveType[BallMoveType["BALL_MOVE_DROP"] = 1] = "BALL_MOVE_DROP";
            BallMoveType[BallMoveType["BALL_MOVE_LEFT"] = 2] = "BALL_MOVE_LEFT";
            BallMoveType[BallMoveType["BALL_MOVE_RIGHT"] = 3] = "BALL_MOVE_RIGHT";
            BallMoveType[BallMoveType["BALL_MOVE_JUMP"] = 4] = "BALL_MOVE_JUMP";
        })(game.BallMoveType || (game.BallMoveType = {}));
        var BallMoveType = game.BallMoveType;
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
                var _this = this;
                if (typeOfBall === void 0) { typeOfBall = BallType.BALL_PLAYER; }
                // Invoke the super; note that this does not set a position because
                // that is set by whoever created us. Our dimensions are based on
                // our sprites, so we don't set anything here.
                _super.call(this, stage, "ball");
                /**
                 * This callback is invoked when our sprite sheet finishes loading the
                 * underlying image for the sprites. It allows us to set our bounds to
                 * be a rectangle at the dimensions of the sprites in the sprite sheet.
                 */
                this.setDimensions = function (sheet) {
                    // Alter our collision properties; we remain a rectangle even though
                    // we are represented by a circular sprite.
                    _this.makeRectangle(sheet.width, sheet.height);
                };
                // Load the sprite sheet that will contain our sprites. The size of
                // the entity is based on the size of the sprites, so we let the
                // callback handle that.
                this._sheet = new game.SpriteSheet(stage, "sprites_5_12.png", 5, 12, true, this.setDimensions);
                // Set up all of the animations that will be used for this entity.
                // There are two sets; one for the player ball and one for the
                // computer ball.
                this.addAnimation("p_idle", 1, false, [10]);
                this.addAnimation("p_idle_gone", 1, false, [14]);
                this.addAnimation("p_vanish", 10, false, [10, 11, 12, 13, 14]);
                this.addAnimation("p_appear", 10, false, [14, 13, 12, 11, 10]);
                this.addAnimation("c_idle", 1, false, [15]);
                this.addAnimation("c_idle_gone", 1, false, [19]);
                this.addAnimation("c_vanish", 10, false, [15, 16, 17, 18, 19]);
                this.addAnimation("c_appear", 10, false, [19, 18, 17, 16, 15]);
                // Set the ball type to the value passed in. This will make sure
                // that the ball is properly represented by playing the appropriate
                // idle animation.
                this.ballType = typeOfBall;
                // The ball does not start rolling
                this.moveType = BallMoveType.BALL_MOVE_NONE;
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
            /**
             * Set the visual state of the ball to idle; this is the normal state,
             * in which the ball just sits there, looking pretty.
             */
            Ball.prototype.idle = function () {
                this.playAnimation(this._ballType == BallType.BALL_PLAYER
                    ? "p_idle"
                    : "c_idle");
            };
            /**
             * Set the visual state of the ball to hidden; this is an idle state in
             * which the ball is no longer visible on the screen.
             */
            Ball.prototype.hide = function () {
                this.playAnimation(this._ballType == BallType.BALL_PLAYER
                    ? "p_idle_gone"
                    : "c_idle_gone");
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
        (function (BrickType) {
            BrickType[BrickType["BRICK_BACKGROUND"] = 0] = "BRICK_BACKGROUND";
            BrickType[BrickType["BRICK_SOLID"] = 1] = "BRICK_SOLID";
            BrickType[BrickType["BRICK_GRAY"] = 2] = "BRICK_GRAY";
            BrickType[BrickType["BRICK_BONUS"] = 3] = "BRICK_BONUS";
        })(game.BrickType || (game.BrickType = {}));
        var BrickType = game.BrickType;
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
                var _this = this;
                if (typeOfBrick === void 0) { typeOfBrick = BrickType.BRICK_SOLID; }
                // Invoke the super; note that this does not set a position because
                // that is set by whoever created us. Our dimensions are based on
                // our sprites, so we don't set anything here.
                _super.call(this, stage, "brick");
                /**
                 * This callback is invoked when our sprite sheet finishes loading the
                 * underlying image for the sprites. It allows us to set our bounds to
                 * be a rectangle at the dimensions of the sprites in the sprite sheet.
                 */
                this.setDimensions = function (sheet) {
                    // Alter our collision properties
                    _this.makeRectangle(sheet.width, sheet.height);
                };
                // Load the sprite sheet that will contain our sprites. The size of
                // the entity is based on the size of the sprites, so we let the
                // callback handle that.
                this._sheet = new game.SpriteSheet(stage, "sprites_5_12.png", 5, 12, true, this.setDimensions);
                // The non-animated bricks don't have their update methods called,
                // so no special setup is needed here.
                //
                // For the animated brick types, we set up animations for them,
                // which includes the idle states (where they are not animating).
                this.addAnimation("gray_idle", 1, false, [5]);
                this.addAnimation("gray_idle_gone", 1, false, [9]);
                this.addAnimation("gray_vanish", 10, false, [5, 6, 7, 8, 9]);
                this.addAnimation("gray_appear", 10, false, [9, 8, 7, 6, 5]);
                this.addAnimation("bonus_idle", 1, false, [30]);
                this.addAnimation("bonus_idle_gone", 1, false, [34]);
                this.addAnimation("bonus_vanish", 10, false, [30, 31, 32, 33, 34]);
                this.addAnimation("bonus_appear", 10, false, [34, 33, 32, 31, 30]);
                // Set a default brick type. This will make sure that this brick
                // is properly visually represented, either by playing the correct
                // animation or by selecting the appropriate sprite.
                this.brickType = typeOfBrick;
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
            /**
             * The only bricks that block the ball are solid bricks and gray bricks
             * that are still visible on the screen.
             *
             * @returns {boolean} true if this brick should block the brick or false
             * if the ball should be allowed to pass through it.
             */
            Brick.prototype.blocksBall = function () {
                switch (this._brickType) {
                    // Bonus bricks always allow the ball to pass through.
                    case BrickType.BRICK_BONUS:
                        return false;
                    // Gray bricks allow the ball to pass through if they have
                    // vanished.
                    case BrickType.BRICK_GRAY:
                        if (this.animations.current == "gray_idle_gone" ||
                            this.animations.current == "gray_vanish")
                            return false;
                        return true;
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
             * @param   {Maze}  maze     the maze containing us and the ball
             * @param   {Ball}  ball     the ball that is touching us
             * @param   {Point} location the location in the mazer that we are at
             *
             * @returns {Point}          always null; we never move the ball
             */
            Brick.prototype.ballTouch = function (maze, ball, location) {
                // If this is a bonus brick and it is visible, then switch the
                // animation to indicate that it has been touched and is thus now
                // collected.
                if (this._brickType == BrickType.BRICK_BONUS &&
                    (this.animations.current == "bonus_idle" ||
                        this.animations.current == "bonus_appear"))
                    this.playAnimation("bonus_vanish");
                return null;
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
                var _this = this;
                // Invoke the super; note that this does not set a position because
                // that is set by whoever created us. Our dimensions are based on
                // our sprites, so we don't set anything here.
                _super.call(this, stage, "blackHole");
                /**
                 * This callback is invoked when our sprite sheet finishes loading the
                 * underlying image for the sprites. It allows us to set our bounds to
                 * be a rectangle at the dimensions of the sprites in the sprite sheet.
                 */
                this.setDimensions = function (sheet) {
                    // Alter our collision properties
                    _this.makeRectangle(sheet.width, sheet.height);
                };
                // Load the sprite sheet that will contain our sprites. The size of
                // the entity is based on the size of the sprites, so we let the
                // callback handle that.
                this._sheet = new game.SpriteSheet(stage, "sprites_5_12.png", 5, 12, true, this.setDimensions);
                // Set up an animation. As this is the first animation, it will play
                // by default.
                this.addAnimation("idle", 10, true, [35, 36, 37, 38, 39]);
                // Create the list of destinations
                this._destinations = new Array();
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
            Object.defineProperty(Teleport.prototype, "length", {
                /**
                 * Get the number of destinations registered on this teleport instance.
                 *
                 * This can be any number >= 0; when it is larger than 1, a destination
                 * is randomly selected
                 *
                 * @returns {number} [description]
                 */
                get: function () { return this._destinations.length; },
                enumerable: true,
                configurable: true
            });
            /**
             * Add a potential destination to this teleport instance. This can be
             * invoked more than once, in which case when activated the teleport
             * will randomly select the destination from those provided.
             *
             * This does not verify that the location provided has not already been
             * added; this allows you to bias one destination over another by adding
             * it more than once.
             *
             * @param {Point} location the location to add
             */
            Teleport.prototype.addDestination = function (location) {
                this._destinations.push(location.copy());
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
             * We don't block the ball because we change its position when it gets
             * on top of us instead of when it touches us.
             *
             * @returns {boolean} always false; the ball is allowed to move through
             * us
             */
            Teleport.prototype.blocksBall = function () {
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
        (function (ArrowType) {
            ArrowType[ArrowType["ARROW_NORMAL"] = 0] = "ARROW_NORMAL";
            ArrowType[ArrowType["ARROW_AUTOMATIC"] = 1] = "ARROW_AUTOMATIC";
        })(game.ArrowType || (game.ArrowType = {}));
        var ArrowType = game.ArrowType;
        ;
        /**
         * This is used to specify the direction that an arrow is currently facing,
         * which represents what direction a ball touching it from above will be
         * pushed.
         *
         * When an arrow changes directions, the direction is instantaneously
         * changed, although the animation may still show it transitioning.
         */
        (function (ArrowDirection) {
            ArrowDirection[ArrowDirection["ARROW_LEFT"] = 0] = "ARROW_LEFT";
            ArrowDirection[ArrowDirection["ARROW_RIGHT"] = 1] = "ARROW_RIGHT";
        })(game.ArrowDirection || (game.ArrowDirection = {}));
        var ArrowDirection = game.ArrowDirection;
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
                var _this = this;
                if (arrowType === void 0) { arrowType = ArrowType.ARROW_NORMAL; }
                if (direction === void 0) { direction = ArrowDirection.ARROW_LEFT; }
                // Invoke the super; note that this does not set a position because
                // that is set by whoever created us. Our dimensions are based on
                // our sprites, so we don't set anything here.
                _super.call(this, stage, "arrow");
                /**
                 * This callback is invoked when our sprite sheet finishes loading the
                 * underlying image for the sprites. It allows us to set our bounds to
                 * be a rectangle at the dimensions of the sprites in the sprite sheet.
                 */
                this.setDimensions = function (sheet) {
                    // Alter our collision properties
                    _this.makeRectangle(sheet.width, sheet.height);
                };
                // Capture the type and direction of the arrow.
                this._arrowType = arrowType;
                this._arrowDirection = direction;
                // If this is an automatic arrow, set up the auto flip timer right
                // away.
                if (arrowType == ArrowType.ARROW_AUTOMATIC)
                    this.setAutoFlipTimer();
                // Load the sprite sheet that will contain our sprites. The size of
                // the entity is based on the size of the sprites, so we let the
                // callback handle that.
                this._sheet = new game.SpriteSheet(stage, "sprites_5_12.png", 5, 12, true, this.setDimensions);
                // Set up animations for this entity. We need animations for two
                // different types of entity, so animations are prefixed with 'n'
                // for "normal" arrows and 'a' for "automatically rotating" arrows.
                //
                // We need idle animations for facing in both directions for both
                // types of arrow.
                this.addAnimation("n_idle_right", 1, false, [20]);
                this.addAnimation("n_idle_left", 1, false, [24]);
                this.addAnimation("a_idle_right", 1, false, [25]);
                this.addAnimation("a_idle_left", 1, false, [29]);
                // Now we need animations that swap facing from either right to left
                // or left to right. As above, we need two different versions.
                this.addAnimation("n_rotate_r_to_l", 10, false, [20, 21, 22, 23, 24]);
                this.addAnimation("n_rotate_l_to_r", 10, false, [24, 23, 22, 21, 20]);
                this.addAnimation("a_rotate_r_to_l", 10, false, [25, 26, 27, 28, 29]);
                this.addAnimation("a_rotate_l_to_r", 10, false, [29, 28, 27, 26, 25]);
                // Based on the type and direction, set the appropriate animation
                // playing. We always start out being idle.
                this.resetAnimation();
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
                        this.flip();
                }
            };
            /**
             * Flip the current direction of this arrow from left to right or vice
             * versa.
             *
             * This will immediately change the internal direction that the arrow
             * thinks that it is pointing, but it will also start the arrow
             * animating towards it's new facing, where it will stop.
             */
            Arrow.prototype.flip = function () {
                // Based on the direction that we're currently facing, swap the
                // direction to the other way, and set our animation to rotate to
                // the appropriate location.
                switch (this._arrowDirection) {
                    case ArrowDirection.ARROW_LEFT:
                        this.playAnimation(this._arrowType == ArrowType.ARROW_NORMAL
                            ? "n_rotate_l_to_r"
                            : "a_rotate_l_to_r");
                        this._arrowDirection = ArrowDirection.ARROW_RIGHT;
                        break;
                    case ArrowDirection.ARROW_RIGHT:
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
             * @param   {Ball}  ball     the ball that is coliding with us
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
            Arrow.prototype.didMoveBall = function (ball) {
                // Mark the direction that we moved the ball.
                ball.moveType = (this._arrowDirection == ArrowDirection.ARROW_LEFT)
                    ? game.BallMoveType.BALL_MOVE_LEFT
                    : game.BallMoveType.BALL_MOVE_RIGHT;
                // Flip our orientation now.
                this.flip();
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
         * The width of the maze, in bricks.
         *
         * This is inclusive of the side walls, so it's actually 2 bricks wider than
         * the play area.
         */
        var MAZE_WIDTH = 31;
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
        var MAZE_HEIGHT = 19;
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
        var TELEPORT_MIN_DISTANCE = 2;
        /**
         * The minimum and maximum number of arrows that are generated per row in
         * the maze.
         */
        var ARROWS_PER_ROW = [3, 8];
        /**
         * The chance (percentage) that a row will contain any gray bricks at all.
         */
        var GRAY_BRICK_CHANCE = 50;
        /**
         * The minimum and maximum number of gray bricks that are generated per row.
         * This is only used after GRAY_BRICK_CHANCE has been used to determine if
         * there will be any bricks at all.
         */
        var GRAY_BRICKS_PER_ROW = [1, 3];
        /**
         * The chance (percentage) that a row will contain any bonus bricks.
         */
        var BONUS_BRICK_CHANCE = 40;
        /**
         * The minimum and maximum number of gray bricks that are generated per row.
         * This is only used after BONUS_BRICK_CHANCE has been used to determine if
         * there will be any bricks at all.
         */
        var BONUS_BRICKS_PER_ROW = [1, 2];
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
                var _this = this;
                // Invoke the super; note that this does not set a position because
                // that is set by whoever created us. Our dimensions are based on
                // the size of the brick sprites, which we don't know yet.
                _super.call(this, "maze", stage, 0, 0, 0, 0, 1, {}, {}, 'blue');
                /**
                 * This callback is invoked when our sprite sheet finishes loading the
                 * underlying image for the sprites.
                 */
                this.setDimensions = function (sheet) {
                    // Alter our collision properties so that our bounds represent the
                    // entire maze area.
                    _this.makeRectangle(sheet.width * MAZE_WIDTH, sheet.height * MAZE_HEIGHT);
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
                    _this.setStagePositionXY((_this._stage.width / 2) - (_this.width / 2), _this._stage.height - _this.height - (remainder / 2));
                };
                // Set up a preload for the same sprite sheet that the brick entities
                // are using. This will allow us to capture the callback that
                // indicates that the sprite size is known, so that we can set up
                // our dimensions.
                new game.SpriteSheet(stage, "sprites_5_12.png", 5, 12, true, this.setDimensions);
                // Create our entity pools.
                this._arrows = new game.ActorPool();
                this._grayBricks = new game.ActorPool();
                this._bonusBricks = new game.ActorPool();
                this._balls = new game.ActorPool();
                // Create our maze entities; the marker entity is deferred until
                // we know the dimensions of the sprites in the sprite sheet.
                this._empty = new game.Brick(stage, game.BrickType.BRICK_BACKGROUND);
                this._solid = new game.Brick(stage, game.BrickType.BRICK_SOLID);
                this._blackHole = new game.Teleport(stage);
                // Pre-populate all of our actor pools with the maximum possible
                // number of actors that we could need. For the case of the gray
                // bricks and bonus bricks, this creates more than we technically
                // need (since not all rows get those added).
                //
                // This is sort of wasteful, but it gets around an engine problem
                // whereby creating an entity at runtime that loads an image will
                // trigger an exception because it's trying to add a preload when
                // it does not need to.
                for (var i = 0; i < (MAZE_HEIGHT - 4) * ARROWS_PER_ROW[1]; i++)
                    this._arrows.addEntity(new game.Arrow(stage), false);
                for (var i = 0; i < (MAZE_HEIGHT - 4) * GRAY_BRICKS_PER_ROW[1]; i++)
                    this._grayBricks.addEntity(new game.Brick(stage, game.BrickType.BRICK_GRAY), false);
                for (var i = 0; i < (MAZE_HEIGHT - 4) * BONUS_BRICKS_PER_ROW[1]; i++)
                    this._bonusBricks.addEntity(new game.Brick(stage, game.BrickType.BRICK_BONUS), false);
                // Fill the actor pool for balls with a complete set of balls; this
                // only ever happens once and is the one case where we always know
                // exactly how many entities of a type we need.
                for (var i = 0; i < (MAZE_WIDTH - 2) * 2; i++)
                    this._balls.addEntity(new game.Ball(stage), false);
                // Create the array that holds our contents. null entries are
                // treated as empty background bricks, so we don't need to do
                // anything further here.
                this._contents = new Array(MAZE_WIDTH * MAZE_HEIGHT);
                // Create the marker overlay.
                this._markers = new Array(MAZE_WIDTH * MAZE_HEIGHT);
                // No debugging by default, but the debugging point is the upper
                // left grid corner; the marker is created later when we know the
                // grid size.
                this._debugTracking = false;
                this._debugPoint = new game.Point(0, 0);
                // Reset the maze
                this.reset();
            }
            Object.defineProperty(Maze.prototype, "debugTracking", {
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
            Object.defineProperty(Maze.prototype, "cellSize", {
                /**
                 * Get the size (in pixels) of the cells in the maze based on the
                 * current sprite set. The cells are square, so this represents both
                 * dimensions.
                 *
                 * @returns {number} the pixel size of the cells in the grid
                 */
                get: function () { return this._empty.width; },
                enumerable: true,
                configurable: true
            });
            /**
             * Set a debug marker on the cell at the given location in the maze.
             *
             * If the location is out of bounds of the maze or there is already a
             * marker at this location, then this will do nothing.
             *
             * @param {number} x the X coordinate to put a marker at
             * @param {number} y the Y coordinate to put a marker at
             */
            Maze.prototype.setMarkerAt = function (x, y) {
                // If the bounds are invalid, do nothing.
                if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT)
                    return;
                // Set the marker into the marker list at this location.
                // Set the brick at the location to the one provided.
                this._markers[y * MAZE_WIDTH + x] = true;
            };
            /**
             * Clear the debug marker on the cell at the given location in the maze.
             *
             * If the location is out of bounds or does not contain a marker, then
             * this will do nothing.
             *
             * @param {number} x the X coordinate to clear the marker from
             * @param {number} y the Y coordinate to clear the marker from
             */
            Maze.prototype.clearMarkerAt = function (x, y) {
                // If the bounds are invalid or there is not a marker a this
                // location, then do nothing.
                if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT)
                    return;
                // Now remove it from the grid
                this._markers[y * MAZE_WIDTH + x] = false;
            };
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
            Maze.prototype.hasMarkerAt = function (x, y) {
                // The bounds are invalid, so no marker
                if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT)
                    return false;
                // There is only a marker if this location is true.
                return this._markers[y * MAZE_WIDTH + x] == true;
            };
            /**
             * Remove all markers that may be set in the maze currently.
             */
            Maze.prototype.removeAllMarkers = function () {
                // Scan the entire maze, and for every marker entity that we find,
                // remove it from that cell.
                for (var row = 0; row < MAZE_HEIGHT; row++) {
                    for (var col = 0; col < MAZE_WIDTH; col++) {
                        this.clearMarkerAt(col, row);
                    }
                }
            };
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
                    this._debugPoint.setTo(position);
                    this._debugPoint.translateXY(-this._position.x, -this._position.y);
                    this._debugPoint.reduce(this.cellSize);
                }
            };
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
            Maze.prototype.getDebugCell = function () {
                return this.getCellAt(this._debugPoint.x, this._debugPoint.y);
            };
            /**
             * Set the cell at the current debug location in the grid to the cell
             * provided.
             *
             * @param {MazeCell} newCell the new cell to insert into the grid
             */
            Maze.prototype.setDebugCell = function (newCell) {
                this.setCellAt(this._debugPoint.x, this._debugPoint.y, newCell);
            };
            /**
             * DEBUG METHOD
             *
             * Remove the contents of an existing cell from the maze, returning the
             * object back into its pool.
             *
             * This currently does not work on Teleport entities, since they need
             * special action to work.
             */
            Maze.prototype.debugClearCell = function () {
                // Get the debug cell and leave if there isn't one.
                var cell = this.getDebugCell();
                if (cell == null)
                    return;
                // If the cell is a Teleport, we can't remove it yet.
                if (cell instanceof game.Teleport) {
                    console.log("Cannot delete Teleports (yet)");
                    return;
                }
                else if (cell instanceof game.Ball)
                    this._balls.killEntity(cell);
                else if (cell instanceof game.Arrow)
                    this._arrows.killEntity(cell);
                else if (cell instanceof game.Brick) {
                    var brick = cell;
                    if (brick == this._solid) {
                        console.log("Cannot delete boundary bricks");
                        return;
                    }
                    else if (brick.brickType == game.BrickType.BRICK_GRAY)
                        this._grayBricks.killEntity(brick);
                    else if (brick.brickType == game.BrickType.BRICK_BONUS)
                        this._bonusBricks.killEntity(brick);
                    else {
                        console.log("This brick is not a brick. Double Yew Tee Eff");
                        return;
                    }
                }
                else if (cell instanceof game.Ball == false) {
                    console.log("Unable to delete entity; I don't know what it is");
                    return;
                }
                // Clear the contents of the cell now.
                this.setDebugCell(null);
            };
            /**
             * DEBUG METHOD
             *
             * Toggle an existing cell through its subtypes (for cells that support
             * this).
             *
             * If the debug point is empty or not of a toggle-able type, this does
             * nothing.
             */
            Maze.prototype.debugToggleCell = function () {
                // Get the debug cell and leave if there isn't one.
                var cell = this.getDebugCell();
                if (cell == null)
                    return;
                // If the cell is an arrow, toggle the type. Doing this will also
                // implicitly set an auto-flip timer on the arrow when it becomes
                // such an arrow.
                if (cell instanceof game.Arrow) {
                    var arrow = cell;
                    if (arrow.arrowType == game.ArrowType.ARROW_AUTOMATIC)
                        arrow.arrowType = game.ArrowType.ARROW_NORMAL;
                    else
                        arrow.arrowType = game.ArrowType.ARROW_AUTOMATIC;
                    return;
                }
                // If the cell is a ball, toggle the type.
                if (cell instanceof game.Ball) {
                    var ball = cell;
                    if (ball.ballType == game.BallType.BALL_PLAYER) {
                        ball.ballType = game.BallType.BALL_COMPUTER;
                        ball.playAnimation("c_appear");
                    }
                    else {
                        ball.ballType = game.BallType.BALL_PLAYER;
                        ball.playAnimation("p_appear");
                    }
                    return;
                }
                // If the cell is a brick, toggle the type. This will change the visual
                // representation back to the idle state for this brick type.
                //
                // This is skipped for solid bricks; they're just used on the outer
                // edges and should not be messed with.
                if (cell instanceof game.Brick && cell != this._solid) {
                    // Get the brick at the current location.
                    var currentBrick = cell;
                    var currentBrickPool = null;
                    var newBrick = null;
                    var animation = null;
                    // We keep a separate pool of bonus bricks and gray bricks.
                    //
                    // In order to swap, we need to get an existing brick from the
                    // opposite pool, then put it into place and kill the other one.
                    if (currentBrick.brickType == game.BrickType.BRICK_BONUS) {
                        newBrick = this._grayBricks.resurrectEntity();
                        animation = "gray_appear";
                        currentBrickPool = this._bonusBricks;
                    }
                    else if (currentBrick.brickType == game.BrickType.BRICK_GRAY) {
                        newBrick = this._bonusBricks.resurrectEntity();
                        animation = "bonus_appear";
                        currentBrickPool = this._grayBricks;
                    }
                    // If we got a brick, play the animation to cause it to appear,
                    // then put it into the maze and kill the current brick in the
                    // pool that it came from.
                    if (newBrick != null) {
                        newBrick.playAnimation(animation);
                        this.setDebugCell(newBrick);
                        currentBrickPool.killEntity(currentBrick);
                    }
                    else
                        console.log("Cannot toggle brick; not enough entities in currentBrickPool");
                    return;
                }
            };
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
            Maze.prototype.debugAddBrick = function () {
                // We can only add a brick if the current cell is empty.
                if (this.getDebugCell() == null) {
                    // Try to get a gray brick first, since that's the most common
                    // type so the pool is larger. If this works, play the animation
                    // to appear it.
                    var newBrick = this._grayBricks.resurrectEntity();
                    if (newBrick != null)
                        newBrick.playAnimation("gray_appear");
                    else {
                        // No gray bricks were available, so try a bonus brick
                        // instead.
                        newBrick = this._bonusBricks.resurrectEntity();
                        if (newBrick != null)
                            newBrick.playAnimation("bonus_appear");
                    }
                    // If we got a brick, add it to the maze.
                    if (newBrick)
                        this.setDebugCell(newBrick);
                    else
                        console.log("Unable to add brick; no entities left in either pool");
                }
                else
                    console.log("Cannot add brick; cell is not empty");
            };
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
            Maze.prototype.debugAddArrow = function () {
                // We can only add an arrow if the current cell is empty.
                if (this.getDebugCell() == null) {
                    // Try to get the arrow out of the pool; if it works, we can
                    // set it's type and add it.
                    var arrow = this._arrows.resurrectEntity();
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
            };
            /**
             * DEBUG METHOD
             *
             * Add a player ball to the maze at the current debug location (assuming
             * one is available).
             *
             * If the current location is not empty, this does nothing.
             */
            Maze.prototype.debugAddBall = function () {
                // We can only add a ball if the current cell is empty.
                if (this.getDebugCell() == null) {
                    // Try to get the ball out of the pool; if it works, we can
                    // set it's type and add it.
                    var ball = this._balls.resurrectEntity();
                    if (ball != null) {
                        ball.ballType = game.BallType.BALL_PLAYER;
                        ball.playAnimation("p_appear");
                        this.setDebugCell(ball);
                    }
                    else
                        console.log("Cannot add ball; no entities left in pool");
                }
                else
                    console.log("Cannot add ball; cell is not empty");
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
                var entity = this.getCellAt(position.x, position.y);
                // If this cell in the maze does not contain anything, then toggle
                // the marker at this location/
                if (entity == null) {
                    // If there a marker here, then clear it; otherwise, add it.
                    if (this.hasMarkerAt(position.x, position.y))
                        this.clearMarkerAt(position.x, position.y);
                    else
                        this.setMarkerAt(position.x, position.y);
                }
                // If this is a brick, we might want to vanish or appear it in the
                // maze.
                if (entity instanceof game.Brick) {
                    // Since it's a brick, change it's animation based on the type.
                    // We can tell if the brick is visible or not by checking what
                    // the currently playing animation is.
                    var brick = entity;
                    switch (brick.brickType) {
                        case game.BrickType.BRICK_GRAY:
                            if (brick.animations.current == "gray_vanish")
                                brick.playAnimation("gray_appear");
                            else
                                brick.playAnimation("gray_vanish");
                            return true;
                        case game.BrickType.BRICK_BONUS:
                            if (brick.animations.current == "bonus_vanish")
                                brick.playAnimation("bonus_appear");
                            else
                                brick.playAnimation("bonus_vanish");
                            return true;
                        default:
                            return false;
                    }
                }
                // If it is an arrow, flip it. This works for any type of arrow; an
                // automatic arrow will reset its random flip time in this case.
                if (entity instanceof game.Arrow) {
                    var arrow = entity;
                    arrow.flip();
                    return true;
                }
                // If the entity is a ball, try to move it downwards
                if (entity instanceof game.Ball) {
                    // We're going to move the ball, so remove all markers from
                    // the maze.
                    this.removeAllMarkers();
                    // Get the ball entity at this location.
                    var ball = entity;
                    // Remove the ball from this position, since it will (probably)
                    // be moving, and set a marker here so that we know where the
                    // ball started.
                    this.setCellAt(position.x, position.y, null);
                    this.setMarkerAt(position.x, position.y);
                    // Duplicate the position that the ball started out at.
                    var ballPos = position.copy();
                    // Keep looping, deciding if the ball should move or not. When
                    // the function returns true, it has modified the position to
                    // be where the ball is moving to; when it is false, the ball
                    // could not move from this point.
                    //
                    // When the position has changed, we set a marker at the new
                    // position.
                    while (this.nextBallPosition(ball, ballPos))
                        this.setMarkerAt(ballPos.x, ballPos.y);
                    // The loop stopped at the location where the ball should have
                    // stopped. Put the ball entity that we started with at that
                    // position now, unless it was at the bottom of the grid, in
                    // which case the ball is just gone now.
                    if (ballPos.y == MAZE_HEIGHT - 2)
                        this._balls.killEntity(ball);
                    else
                        this.setCellAt(ballPos.x, ballPos.y, ball);
                    return true;
                }
                // We care not for this click.
                return false;
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
            Maze.prototype.nextBallPosition = function (ball, position) {
                // If this position is in the second to last row of the maze, it has
                // reached the goal line, so movement stops.
                if (position.y == MAZE_HEIGHT - 2) {
                    ball.moveType = game.BallMoveType.BALL_MOVE_NONE;
                    return false;
                }
                // Get the contents of the cell where the ball is currently at, if
                // any; if there is one, tell it that the ball touched it, and also
                // possibly allow it to move the ball, as long as that's not how we
                // got at the current position.
                var current = this.getCellAt(position.x, position.y);
                if (current != null) {
                    // Copy the position provided and then hand it to the entity
                    // that we're currently on top of.
                    var newPos_1 = current.ballTouch(this, ball, position);
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
                // Get the contents of the cell below us in the grid. If that cell
                // is empty or does not block the ball, then change position to drop
                // the ball there and we're done.
                var below = this.getCellAt(position.x, position.y + 1);
                if (below == null || below.blocksBall() == false) {
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
                var movedCell = this.getCellAt(newPos.x, newPos.y);
                if (movedCell == null || movedCell.blocksBall() == false) {
                    // Tell the cell that moved the ball that we actually moved it,
                    // and then return back the position that it gave.
                    //
                    // In this case, it is up to the entity that moved the ball to
                    // mark how it moved it, as we can't know.
                    below.didMoveBall(ball);
                    position.setTo(newPos);
                    return true;
                }
                // The cell below us wants to shift our location to somewhere that
                // we're not allowed to enter, so just leave.
                ball.moveType = game.BallMoveType.BALL_MOVE_NONE;
                return false;
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
            };
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
            Maze.prototype.getCellAt = function (x, y) {
                // The bounds are invalid, so return null
                if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT)
                    return null;
                // Return the contents of the cell, if any
                return this._contents[y * MAZE_WIDTH + x];
            };
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
            Maze.prototype.setCellAt = function (x, y, cell) {
                // The bounds are invalid, so do nothing.
                if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT)
                    return;
                // Set the brick at the location to the one provided.
                this._contents[y * MAZE_WIDTH + x] = cell;
            };
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
            Maze.prototype.getBrickAt = function (x, y) {
                // Get the cell at this location, and return it back, returning the
                // empty brick if needed.
                return this.getCellAt(x, y) || this._empty;
            };
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
            Maze.prototype.setBrickAt = function (x, y, brick) {
                this.setCellAt(x, y, brick);
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
                // Iterate over all columns and rows of bricks, and get them to
                // render themselves at the appropriate offset from the position
                // we've been given.
                for (var blitY = 0; blitY < MAZE_HEIGHT; blitY++) {
                    for (var blitX = 0; blitX < MAZE_WIDTH; blitX++) {
                        // Get the cell at this position, using the empty brick
                        // cell if there isn't anything.
                        var cell = this.getCellAt(blitX, blitY) || this._empty;
                        // If the cell is not a brick entity of some kind, then it
                        // probably has a transparent background. So we should first
                        // render the empty cell to provide a background for it.
                        if (cell instanceof game.Brick == false)
                            this._empty.render(x + (blitX * 25), y + (blitY * 25), renderer);
                        // Render this cell.
                        cell.render(x + (blitX * 25), y + (blitY * 25), renderer);
                        // If this position contains a marker, render one here.
                        if (this.hasMarkerAt(blitX, blitY))
                            this._marker.render(x + (blitX * 25), y + (blitY * 25), renderer);
                    }
                }
                // Now the debug marker, if it's turned on.
                if (this._debugTracking)
                    this._debugMarker.render(x + (this._debugPoint.x * 25), y + (this._debugPoint.y * 25), renderer);
            };
            /**
             * Prepare for maze generation by resetting the contents of the maze to
             * be empty.
             *
             * The entire contents of the maze is set to be the empty background
             * brick, followed by wrapping the edges in the bounding bricks that
             * stop the ball from falling out of the maze.
             */
            Maze.prototype.emptyMaze = function () {
                // First, every brick needs to be a background brick. To do this we
                // just need to clear the entry in the array.
                for (var i = 0; i < this._contents.length; i++)
                    this._contents[i] = null;
                // Now the left and right sides need to be solid bricks.
                for (var y = 0; y < MAZE_HEIGHT; y++) {
                    this.setBrickAt(0, y, this._solid);
                    this.setBrickAt(MAZE_WIDTH - 1, y, this._solid);
                }
                // Lastly, the bottom row needs to be made solid, except for the
                // first and last columns, which have already been filled out.
                for (var x = 1; x < MAZE_WIDTH - 1; x++)
                    this.setBrickAt(x, MAZE_HEIGHT - 1, this._solid);
            };
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
            Maze.prototype.entityInRange = function (x1, y1, x2, y2) {
                // Scan the entire range; this is really inefficient but it gets
                // the job done.
                //
                // Note that getCellAt () returns null for an invalid location, so
                // this handles locations that end up off of the edge OK.
                for (var x = x1; x <= x2; x++) {
                    for (var y = y1; y <= y2; y++) {
                        if (this.getCellAt(x, y) != null)
                            return true;
                    }
                }
                return false;
            };
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
            Maze.prototype.genRandomMazeColumn = function () {
                // Generate, ensuring that we never pick an edge.
                return game.Utils.randomIntInRange(1, MAZE_WIDTH - 1);
            };
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
            Maze.prototype.genRandomMazeRow = function () {
                // Generate, ensuring that we skip two rows for the initial ball
                // placements and at least a single row of movement, and two rows on
                // the bottom to make room for the lower boundary and the goal line.
                return game.Utils.randomIntInRange(2, MAZE_HEIGHT - 2);
            };
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
            Maze.prototype.genBlackHoles = function () {
                for (var i = 0; i < TOTAL_TELEPORTERS; i++) {
                    // Get a location.
                    var x = this.genRandomMazeColumn();
                    var y = this.genRandomMazeRow();
                    // If there are no entities within the proper distance of this
                    // selected square (which includes the square itself), then this
                    // is a good place to put the teleport; otherwise, try again.
                    if (this.entityInRange(x - TELEPORT_MIN_DISTANCE, y - TELEPORT_MIN_DISTANCE, x + TELEPORT_MIN_DISTANCE, y + TELEPORT_MIN_DISTANCE) == false) {
                        // Store it, then add this location to the list of possible
                        // destinations in this black hole.
                        this.setCellAt(x, y, this._blackHole);
                        this._blackHole.addDestination(new game.Point(x, y));
                    }
                    else
                        i--;
                }
            };
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
            Maze.prototype.genArrows = function () {
                // Iterate over all of the rows that can possibly contain arrows. We
                // start two rows down to make room for the initial ball locations
                // and the empty balls, and we stop 2 rows short to account for the
                // border of the maze and the goal row.
                for (var row = 2; row < MAZE_HEIGHT - 2; row++) {
                    // First, we need to determine how many arrows we will generate
                    // for this row.
                    var arrowCount = game.Utils.randomIntInRange(ARROWS_PER_ROW[0], ARROWS_PER_ROW[1]);
                    // Now keep generating arrows into this row until we have
                    // generated enough.
                    while (arrowCount > 0) {
                        // Generate a column randomly. If this location is already
                        // filled, or the tile above it is a black hole,  try again.
                        var column = this.genRandomMazeColumn();
                        if (this.getCellAt(column, row) != null ||
                            (this.getCellAt(column, row - 1) instanceof game.Teleport))
                            continue;
                        // This cell contains an arrow; resurrect one from the object
                        // pool. If there isn't one to resurrect, create one and add
                        // add it to the pool.
                        var arrow = this._arrows.resurrectEntity();
                        if (arrow == null) {
                            arrow = new game.Arrow(this._stage);
                            this._arrows.addEntity(arrow, true);
                        }
                        // Now randomly set the direction to be left or right as
                        // appropriate.
                        if (game.Utils.randomIntInRange(0, 100) > 50)
                            arrow.arrowDirection = game.ArrowDirection.ARROW_LEFT;
                        else
                            arrow.arrowDirection = game.ArrowDirection.ARROW_RIGHT;
                        // Randomly select the arrow type.
                        if (game.Utils.randomIntInRange(0, 100) > 25)
                            arrow.arrowType = game.ArrowType.ARROW_NORMAL;
                        else
                            arrow.arrowType = game.ArrowType.ARROW_AUTOMATIC;
                        // Add it to the maze and count it as placed.
                        this.setCellAt(column, row, arrow);
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
            Maze.prototype.genGrayBricks = function () {
                // Iterate over all of the rows that can possibly contain bricks. We
                // start two rows down to make room for the initial ball locations
                // and the empty balls, and we stop 2 rows short to account for the
                // border of the maze and the goal row.
                for (var row = 2; row < MAZE_HEIGHT - 2; row++) {
                    // See if we should bother generating any bricks in this row
                    // at all.
                    if (game.Utils.randomIntInRange(0, 100) > GRAY_BRICK_CHANCE)
                        continue;
                    // First, we need to determine how many bricks we will generate
                    // for this row.
                    var brickCount = game.Utils.randomIntInRange(GRAY_BRICKS_PER_ROW[0], GRAY_BRICKS_PER_ROW[1]);
                    // Now keep generating bricks into this row until we have
                    // generated enough.
                    while (brickCount > 0) {
                        // Generate a column randomly. If this location is already
                        // filled or the square above is an arrow, try again.
                        var column = this.genRandomMazeColumn();
                        if (this.getCellAt(column, row) != null ||
                            (this.getCellAt(column, row - 1) instanceof game.Arrow))
                            continue;
                        // This cell contains brick; resurrect one from the object
                        // pool. If there isn't one to resurrect, create one and add
                        // add it to the pool.
                        var brick = this._grayBricks.resurrectEntity();
                        if (brick == null) {
                            brick = new game.Brick(this._stage, game.BrickType.BRICK_GRAY);
                            this._grayBricks.addEntity(brick, true);
                        }
                        // Make sure the brick starts out growing into place.
                        brick.playAnimation("gray_appear");
                        // Add it to the maze and count it as placed.
                        this.setCellAt(column, row, brick);
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
            Maze.prototype.genBonusBricks = function () {
                // Iterate over all of the rows that can possibly contain bricks. We
                // start two rows down to make room for the initial ball locations
                // and the empty balls, and we stop 2 rows short to account for the
                // border of the maze and the goal row.
                for (var row = 2; row < MAZE_HEIGHT - 2; row++) {
                    // See if we should bother generating any bricks in this row
                    // at all.
                    if (game.Utils.randomIntInRange(0, 100) > BONUS_BRICK_CHANCE)
                        continue;
                    // First, we need to determine how many bricks we will generate
                    // for this row.
                    var brickCount = game.Utils.randomIntInRange(BONUS_BRICKS_PER_ROW[0], BONUS_BRICKS_PER_ROW[1]);
                    // Now keep generating bricks into this row until we have
                    // generated enough.
                    while (brickCount > 0) {
                        // Generate a column randomly. If this location is already
                        // filled or the square above is an arrow, try again.
                        var column = this.genRandomMazeColumn();
                        if (this.getCellAt(column, row) != null ||
                            (this.getCellAt(column, row - 1) instanceof game.Arrow))
                            continue;
                        // This cell contains brick; resurrect one from the object
                        // pool. If there isn't one to resurrect, create one and add
                        // add it to the pool.
                        var brick = this._bonusBricks.resurrectEntity();
                        if (brick == null) {
                            brick = new game.Brick(this._stage, game.BrickType.BRICK_BONUS);
                            this._bonusBricks.addEntity(brick, true);
                        }
                        // Make sure the brick starts out growing into place.
                        brick.playAnimation("bonus_appear");
                        // Add it to the maze and count it as placed.
                        this.setCellAt(column, row, brick);
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
            Maze.prototype.placeBalls = function () {
                // There should be two sets of balls that we cycle between, but for
                // now we just put a set of player balls into the top row of the
                // maze.
                for (var col = 1; col < MAZE_WIDTH - 1; col++) {
                    // Get a ball; this pool always has enough entities for us
                    // because the number is fixed.
                    var ball = this._balls.resurrectEntity();
                    // Set the score and type.
                    ball.score = 0;
                    ball.ballType = game.BallType.BALL_PLAYER;
                    // Have the ball appear onto the screen (instead of just being
                    // there)
                    ball.appear();
                    // Set the ball in now.
                    this.setCellAt(col, 0, ball);
                }
            };
            /**
             * Reset the maze.
             *
             * This will modify the bricks in the maze to represent a new randomly
             * created, empty maze.
             */
            Maze.prototype.reset = function () {
                // Make sure that all of the entity pools are emptied out by killing
                // everything in them.
                this._arrows.killALl();
                this._grayBricks.killALl();
                this._bonusBricks.killALl();
                this._balls.killALl();
                this.removeAllMarkers();
                // Make sure that our black hole entity doesn't know about any
                // destinations from a prior maze (if any).
                this._blackHole.clearDestinations();
                // Prepare the maze; this empties out the current contents (if any)
                // and gives us a plain empty maze that is surrounded with the
                // bounding bricks that we need.
                this.emptyMaze();
                // Now generate the contents of the maze.
                this.genBlackHoles();
                this.genArrows();
                this.genGrayBricks();
                this.genBonusBricks();
                // Now we can place the balls in.
                this.placeBalls();
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
                // Create the scene via our super class.
                _super.call(this, "gameScreen", stage);
                // Create a maze and add it to the scene so we can see how it
                // renders itself.
                this._maze = new game.Maze(stage);
                this.addActor(this._maze);
                // Start out with a default mouse location.
                this._mouse = new game.Point(0, 0);
            }
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
                // handle it and we'll jus leave.
                if (_super.prototype.inputKeyDown.call(this, eventObj))
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
                        this._maze.reset();
                        return true;
                    // Toggle mouse tracking of the debug location, then update the
                    // tracking with the last known mouse location.
                    case game.KeyCodes.KEY_SPACEBAR:
                        this._maze.debugTracking = !this._maze.debugTracking;
                        if (this._maze.debugTracking)
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
                        if (this._maze.debugTracking) {
                            this._maze.debugClearCell();
                            return true;
                        }
                        break;
                    // Toggle the type of the entity under the debug cursor through
                    // its various states.
                    case game.KeyCodes.KEY_T:
                        if (this._maze.debugTracking) {
                            this._maze.debugToggleCell();
                            return true;
                        }
                        break;
                    // Add a brick to the maze at the current debug cursor; this
                    // only works if the cell is currently empty. This will try
                    // to add a gray brick, and failing that a bonus brick.
                    case game.KeyCodes.KEY_B:
                        if (this._maze.debugTracking) {
                            this._maze.debugAddBrick();
                            return true;
                        }
                        break;
                    // Add an arrow to the maze at the current debug cursor; this
                    // only works if the cell is currentlye empty. This will add a
                    // normal arrow by default, but this can be toggled with the
                    // 'T" key'.
                    case game.KeyCodes.KEY_A:
                        if (this._maze.debugTracking) {
                            this._maze.debugAddArrow();
                            return true;
                        }
                        break;
                    // Add a ball to the maze at the current debug cursor; this only
                    // works if the cell is currently empty. This will add a player
                    // ball by default, but this can be toggled with the 'T' key.
                    case game.KeyCodes.KEY_L:
                        if (this._maze.debugTracking) {
                            this._maze.debugAddBall();
                            return true;
                        }
                        break;
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
                if (this._maze.debugTracking)
                    this._maze.setDebugPoint(this._mouse);
                // We handled it.
                return true;
            };
            /**
             * This is invoked every frame to render the current scene to the stage.
             */
            GameScene.prototype.render = function () {
                // Clear the screen, then let our super render for us so that all
                // entities get painted.
                this._renderer.fillRect(0, 0, this._stage.width, this._stage.height, '#000');
                _super.prototype.render.call(this);
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
                var stage = new nurdz.game.Stage('gameContent', 'black', true);
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
