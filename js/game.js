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
         * This class represents an entity pool.
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
         *
         * @type {[type]}
         */
        var EntityPool = (function () {
            /**
             * Create a new empty entity pool.
             */
            function EntityPool() {
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
             * @param {Entity}  newEntity the entity to add to the live list.
             * @param {boolean} isAlive   true if the entity is added to the live
             * pool, false if it should be added as dead
             */
            EntityPool.prototype.addEntity = function (newEntity, isAlive) {
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
             * @param {Entity} deadEntity the entity to mark as dead; if this is not
             * an entity already in the live part of the pool, nothing happens.
             */
            EntityPool.prototype.killEntity = function (deadEntity) {
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
             * @returns {Entity|null} the resurrected entity, or null if there is
             */
            EntityPool.prototype.resurrectEntity = function () {
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
             * contained in the Entity class itself.
             *
             * @param {Stage}  stage the stage the entity is on
             * @param {number} tick  the game tick; this is a count of how many
             * times the game loop has executed
             */
            EntityPool.prototype.update = function (stage, tick) {
                for (var i = 0; i < this._liveContents.length; i++)
                    this._liveContents[i].update(stage, tick);
            };
            return EntityPool;
        }());
        game.EntityPool = EntityPool;
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
            }
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
                 * If this sets the type to the type that already exists, nothing
                 * happens.
                 *
                 * @param {ArrowType} newType the new arrow type
                 */
                set: function (newType) {
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
         *
         * @type {Number}
         */
        var MAZE_WIDTH = 31;
        /**
         * The height of the maze, in bricks.
         *
         * This is inclusive of the bottom wall, so it's actually a brick taller
         * than the play area.
         *
         * @type {Number}
         */
        var MAZE_HEIGHT = 19;
        /**
         * When generating the random contents of the maze, we insert this many
         * teleport entities into the maze at random locations.
         *
         * @type {Number}
         */
        var TOTAL_TELEPORTERS = 5;
        /**
         * When generating the teleport entities, this specifies the minimum distance
         * that can occur between two adjacent teleporters.
         *
         * If this is set too high, maze generation will deadlock; be sensible.
         *
         * @type {Number}
         */
        var TELEPORT_MIN_DISTANCE = 2;
        /**
         * When generating the random contents of the maze, we generate a certain
         * number of arrows per row in the maze. This specifies the minimum and
         * maximum number of arrows that can be generated for each row in the maze.
         *
         * @type {Array}
         */
        var ARROWS_PER_ROW = [3, 8];
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
                this._arrows = new game.EntityPool();
                // Create our maze entities.
                this._empty = new game.Brick(stage, game.BrickType.BRICK_BACKGROUND);
                this._solid = new game.Brick(stage, game.BrickType.BRICK_SOLID);
                this._gray = new game.Brick(stage, game.BrickType.BRICK_GRAY);
                this._bonus = new game.Brick(stage, game.BrickType.BRICK_BONUS);
                this._blackHole = new game.Teleport(stage);
                // For arrows, we will pre-populate the maximum possible number of
                // arrows into the arrow pool. The type and direction of these
                // arrows does not matter; all arrows are added dead anyway.
                for (var i = 0; i < (MAZE_HEIGHT - 4) * ARROWS_PER_ROW[1]; i++)
                    this._arrows.addEntity(new game.Arrow(stage), false);
                // We want the bonus brick to start out gone.
                this._bonus.playAnimation("bonus_idle_gone");
                // Create the array that holds our contents. null entries are
                // treated as empty background bricks, so we don't need to do
                // anything further here.
                this._contents = new Array(MAZE_WIDTH * MAZE_HEIGHT);
                // Reset the maze
                this.reset();
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
            Maze.prototype.update = function (stage, tick) {
                // Let the super do it's think for us.
                _super.prototype.update.call(this, stage, tick);
                // Make sure that all of our bricks that can animate get updated, so
                // that their animations run as expected.
                this._gray.update(stage, tick);
                this._bonus.update(stage, tick);
                this._blackHole.update(stage, tick);
                // Now update all of the entities in our various entity pools.
                this._arrows.update(stage, tick);
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
                        cell.render(x + (blitX * 25), y + (blitY * 25), renderer);
                    }
                }
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
                    if (this.entityInRange(x - TELEPORT_MIN_DISTANCE, y - TELEPORT_MIN_DISTANCE, x + TELEPORT_MIN_DISTANCE, y + TELEPORT_MIN_DISTANCE) == false)
                        this.setCellAt(x, y, this._blackHole);
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
             *    is randomly generated. Currently the arrows are always normal, and
             *    their facing is randomly selected.
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
                        // Generate a column randomly. If this location has something,
                        // try again.
                        var column = this.genRandomMazeColumn();
                        if (this.getCellAt(column, row) != null)
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
             * Reset the maze.
             *
             * This will modify the bricks in the maze to represent a new randomly
             * created, empty maze.
             */
            Maze.prototype.reset = function () {
                // Prepare the maze; this empties out the current contents (if any)
                // and gives us a plain empty maze that is surrounded with the
                // bounding bricks that we need.
                this.emptyMaze();
                // Now generate the contents of the maze.
                this.genBlackHoles();
                this.genArrows();
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
                var maze = new game.Maze(stage);
                this.addActor(maze);
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
                }
                // We did not handle it
                return false;
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
