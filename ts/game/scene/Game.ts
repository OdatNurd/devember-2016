module nurdz.game
{
    /**
     * This scene represents the game screen, where the game will actually be
     * played.
     */
    export class GameScene extends Scene
    {
        /**
         * The maze, which holds most of the game entities.
         *
         * @type {Maze}
         */
        private _maze : Maze;

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
        constructor (stage : Stage)
        {
            // Create the scene via our super class.
            super ("gameScreen", stage);

            // Create a maze and add it to the scene so we can see how it
            // renders itself.
            this._maze = new Maze (stage);
            this.addActor (this._maze);
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
        inputKeyDown (eventObj : KeyboardEvent) : boolean
        {
            // If this is a key the super class knows how to handle, then let it
            // handle it and we'll jus leave.
            if (super.inputKeyDown (eventObj))
                return true;

            // See if it's something else we care about.
            switch (eventObj.keyCode)
            {
                // For the F key, toggle between full screen mode and windowed
                // mode.
                case KeyCodes.KEY_F:
                    this._stage.toggleFullscreen();
                    return true;

                // Trigger a new maze generation.
                case KeyCodes.KEY_G:
                    this._maze.reset ();
                    return true;
            }

            // We did not handle it
            return false;
        }

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
        inputMouseClick (eventObj : MouseEvent) : boolean
        {
            // Calculate where on the stage the mouse clicked. If this is inside
            // of the maze, localize the point to the bounds of the maze and
            // have the maze handle it.
            let mousePos = this._stage.calculateMousePos (eventObj);
            if (this._maze.contains (mousePos) == true)
            {
                let pos = this._maze.position;
                return this._maze.handleClick (mousePos.translateXY (-pos.x, -pos.y));
            }

            return false;
        }

        /**
         * This is invoked every frame to render the current scene to the stage.
         */
        render () : void
        {
            // Clear the screen, then let our super render for us so that all
            // entities get painted.
            this._renderer.fillRect (0, 0, this._stage.width, this._stage.height, '#000');
            super.render ();
        }
    }
}
