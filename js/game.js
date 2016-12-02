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
         * This is used to specify the valid values for brick types. A brick may
         * be a solid brick, a gray brick (solid, but vanishes near the end of the
         * game), or background (decorative, non-colliding).
         */
        (function (BrickType) {
            BrickType[BrickType["BRICK_SOLID"] = 0] = "BRICK_SOLID";
            BrickType[BrickType["BRICK_GRAY"] = 1] = "BRICK_GRAY";
            BrickType[BrickType["BRICK_BACKGROUND"] = 2] = "BRICK_BACKGROUND";
        })(game.BrickType || (game.BrickType = {}));
        var BrickType = game.BrickType;
        /**
         * The entity that represents bricks (background, permanent and temporary)
         * in the game.
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
                // Set a default brick type.
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
                 * appearance of the brick.
                 *
                 * @param {BrickType} newType the new type of the brick.
                 */
                set: function (newType) {
                    // Set the type of the brick to the one passed in, then set the
                    // sprite in the current sprite sheet to match it.
                    this._brickType = newType;
                    switch (this._brickType) {
                        case BrickType.BRICK_SOLID:
                            this._sprite = 0;
                            break;
                        case BrickType.BRICK_GRAY:
                            this._sprite = 5;
                            break;
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
                    // Set our position to center us on the screen horizontally and be
                    // just slightly up from the bottom of the screen.
                    _this.setStagePositionXY((_this._stage.width / 2) - (_this.width / 2), _this._stage.height - _this.height - 16);
                };
                // Set up a preload for the same sprite sheet that the brick entities
                // are using. This will allow us to capture the callback that
                // indicates that the sprite size is known, so that we can set up
                // our dimensions.
                new game.SpriteSheet(stage, "sprites_5_12.png", 5, 12, true, this.setDimensions);
                // Create both our empty brick and our solid brick for use in maps.
                this._empty = new game.Brick(stage, game.BrickType.BRICK_BACKGROUND);
                this._solid = new game.Brick(stage, game.BrickType.BRICK_SOLID);
                // Create the array that holds our contents. null entries are
                // treated as empty background bricks, so we don't need to do
                // anything further here.
                this._contents = new Array(MAZE_WIDTH * MAZE_HEIGHT);
                // Reset the maze
                this.reset();
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
                    for (var blitX = 0; blitX < MAZE_WIDTH; blitX++)
                        this.getBrickAt(blitX, blitY).render(x + (blitX * 25), y + (blitY * 25), renderer);
                }
            };
            /**
             * Reset the maze.
             *
             * This will modify the bricks in the maze to represent a new randomly
             * created, empty maze.
             */
            Maze.prototype.reset = function () {
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
