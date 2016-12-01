module nurdz.game
{
    /**
     * This scene represents the game screen, where the game will actually be
     * played.
     */
    export class GameScene extends Scene
    {
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
            super ("gameScreen", stage);
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
            // If the super handles the key or if it is a paddle key, return true.
            if (super.inputKeyDown (eventObj))
                return true;

            // See if it's something else we care about.
            switch (eventObj.keyCode)
            {
                // For the F key, toggle between full screen mode and windowed mode.
                case KeyCodes.KEY_F:
                    this._stage.toggleFullscreen();
                    return true;
            }

            // We did not handle it
            return false;
        }
    }
}
