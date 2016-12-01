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
                _super.call(this, "gameScreen", stage);
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
                // If the super handles the key or if it is a paddle key, return true.
                if (_super.prototype.inputKeyDown.call(this, eventObj))
                    return true;
                // See if it's something else we care about.
                switch (eventObj.keyCode) {
                    // For the F key, toggle between full screen mode and windowed mode.
                    case game.KeyCodes.KEY_F:
                        this._stage.toggleFullscreen();
                        return true;
                }
                // We did not handle it
                return false;
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
