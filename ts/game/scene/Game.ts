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
            // Create the scene via our super class.
            super ("gameScreen", stage);

            // Now create three bricks in each of the three different types,
            // setting their position on the screen and their type. This is for
            // testing the visuals on the class.
            let brick1 = new Brick (stage);
            let brick2 = new Brick (stage);
            let brick3 = new Brick (stage);

            brick1.brickType = BrickType.BRICK_BACKGROUND;
            brick2.brickType = BrickType.BRICK_GRAY;
            brick3.brickType = BrickType.BRICK_SOLID;

            brick1.setStagePositionXY (0, 0);
            brick2.setStagePositionXY (25, 0);
            brick3.setStagePositionXY (50, 0);

            this.addActor (brick1);
            this.addActor (brick2);
            this.addActor (brick3);
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
            }

            // We did not handle it
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
