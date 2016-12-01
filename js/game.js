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
             * @param {Stage} stage the stage that we use to render ourselves
             */
            function Brick(stage) {
                var _this = this;
                // Invoke the super; note that this does not set a position because
                // that is set by whoever created us. Our dimensions are based on
                // our sprites, so we don't set anything here.
                _super.call(this, "brick", stage, 0, 0, 0, 0, 1, {}, {}, 'blue');
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
                this.brickType = BrickType.BRICK_BACKGROUND;
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
        }(game.Entity));
        game.Brick = Brick;
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
                // Now create three bricks in each of the three different types,
                // setting their position on the screen and their type. This is for
                // testing the visuals on the class.
                var brick1 = new game.Brick(stage);
                var brick2 = new game.Brick(stage);
                var brick3 = new game.Brick(stage);
                brick1.brickType = game.BrickType.BRICK_BACKGROUND;
                brick2.brickType = game.BrickType.BRICK_GRAY;
                brick3.brickType = game.BrickType.BRICK_SOLID;
                brick1.setStagePositionXY(0, 0);
                brick2.setStagePositionXY(25, 0);
                brick3.setStagePositionXY(50, 0);
                this.addActor(brick1);
                this.addActor(brick2);
                this.addActor(brick3);
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
